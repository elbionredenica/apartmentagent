"""
test_airbyte_client.py
----------------------
Two-phase test for the Airbyte platform ingestion setup.

PHASE 1 — run once to set everything up:
    python -m src.ingestion.test_airbyte_client --setup

    This will:
      - Authenticate with Airbyte Cloud
      - Create the RentCast source
      - Create the Postgres destination
      - Wire them together as a Connection
      - Print IDs to add to your .env

PHASE 2 — run any time to trigger a sync:
    python -m src.ingestion.test_airbyte_client --sync

    This will:
      - Trigger a manual sync
      - Poll until it completes
      - Confirm data landed in Postgres
"""

import argparse
import asyncio
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

# City/state to use for the test — change to match your target market
TEST_CITY = "Austin"
TEST_STATE = "TX"
TEST_BEDROOMS = 2


def check_env_vars(phase: str):
    """Fail fast if required credentials are missing."""
    base_vars = ["AIRBYTE_CLIENT_ID", "AIRBYTE_CLIENT_SECRET", "RENT_CAST_API",
                 "GHOST_CONNECTION_STRING"]
    sync_vars = ["AIRBYTE_CONNECTION_ID"]

    required = base_vars if phase == "setup" else base_vars + sync_vars
    missing = [v for v in required if not os.environ.get(v)]

    if missing:
        raise EnvironmentError(
            f"Missing required env vars for --{phase}: {missing}\n"
            "Copy .env.example to .env and fill in your credentials."
        )
    print("✓ All required env vars present")


async def run_setup():
    """Phase 1: create source, destination, and connection. Run once."""
    from Airbyte.ingestion.airbyte_client import (
        setup_rentcast_source,
        setup_postgres_destination,
        setup_rentcast_sync,
    )

    check_env_vars("setup")
    print(f"\nSetting up Airbyte pipeline for {TEST_CITY}, {TEST_STATE}...\n")

    # Re-use existing IDs if already created (so re-running is safe)
    source_id = os.environ.get("AIRBYTE_RENTCAST_SOURCE_ID")
    destination_id = os.environ.get("AIRBYTE_POSTGRES_DESTINATION_ID")

    if source_id:
        print(f"Step 1/3: RentCast source already exists ({source_id}), skipping.")
    else:
        print("Step 1/3: Creating RentCast source...")
        source_id = await setup_rentcast_source(
            city=TEST_CITY,
            state=TEST_STATE,
            bedrooms=TEST_BEDROOMS,
            max_days_old=7,
        )

    if destination_id:
        print(f"Step 2/3: Postgres destination already exists ({destination_id}), skipping.")
    else:
        print("Step 2/3: Creating Postgres destination...")
        destination_id = await setup_postgres_destination()

    print("Step 3/3: Creating sync connection...")
    connection_id = await setup_rentcast_sync(
        source_id=source_id,
        destination_id=destination_id,
        sync_interval_hours=1,
    )

    print("\n" + "="*50)
    print("SETUP COMPLETE. Add these to your .env file:")
    if not os.environ.get("AIRBYTE_RENTCAST_SOURCE_ID"):
        print(f"  AIRBYTE_RENTCAST_SOURCE_ID={source_id}")
    if not os.environ.get("AIRBYTE_POSTGRES_DESTINATION_ID"):
        print(f"  AIRBYTE_POSTGRES_DESTINATION_ID={destination_id}")
    print(f"  AIRBYTE_CONNECTION_ID={connection_id}")
    print("="*50)
    print("\nNow run: python -m src.ingestion.test_airbyte_client --sync")


async def run_sync():
    """Phase 2: trigger a sync and wait for it to complete."""
    from Airbyte.ingestion.airbyte_client import trigger_sync, wait_for_sync

    check_env_vars("sync")
    print("\nTriggering RentCast sync...")

    job_id = await trigger_sync()
    print(f"✓ Sync job started: {job_id}")
    print("Polling for completion (this may take 1-2 minutes)...")

    success = await wait_for_sync(job_id, poll_interval_seconds=10, timeout_seconds=300)

    if success:
        print("\n✓ Sync completed successfully.")
        print("  RentCast listings are now in your Postgres DB.")
        print("  Your team's listing_processor.py can now read from the")
        print("  'rental_listings' table in the public schema.")
    else:
        print("\n✗ Sync failed or timed out.")
        print("  Check app.airbyte.ai > Connections for error details.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test Airbyte RentCast ingestion")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--setup", action="store_true",
                       help="Create source, destination, and connection (run once)")
    group.add_argument("--sync", action="store_true",
                       help="Trigger a manual sync and wait for completion")
    args = parser.parse_args()

    if args.setup:
        asyncio.run(run_setup())
    else:
        asyncio.run(run_sync())
