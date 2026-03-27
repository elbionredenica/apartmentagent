"""
airbyte_client.py
-----------------
Sets up RentCast as an Airbyte Cloud source and triggers syncs into
the Ghost Postgres database. This is the "Option A" platform approach —
Airbyte manages the connector, credentials, and data replication.

HOW IT WORKS:
  1. setup_rentcast_source()  — registers RentCast in your Airbyte workspace
                                (only needs to run once)
  2. setup_rentcast_sync()    — creates a Connection: RentCast → your Postgres
                                (only needs to run once)
  3. trigger_sync()           — triggers a manual sync on demand
  4. wait_for_sync()          — polls until the sync job completes

After a sync completes, RentCast data lands in your Postgres DB in a table
called `rental_listings` (Airbyte's default stream name). Your team's
listing_processor.py then reads from that table.

Environment variables required (.env):
    AIRBYTE_CLIENT_ID       — from app.airbyte.ai > Settings > API Keys
    AIRBYTE_CLIENT_SECRET   — from app.airbyte.ai > Settings > API Keys
    RENT_CAST_API           — from rentcast.io dashboard
    GHOST_CONNECTION_STRING — your Postgres connection string

Dependencies:
    pip install httpx python-dotenv
"""

import asyncio
import logging
import os
import time

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

AIRBYTE_API_BASE = "https://api.airbyte.com/v1"

# RentCast's official Airbyte connector definition ID
# Source: https://docs.airbyte.com/integrations/sources/rentcast
RENTCAST_DEFINITION_ID = "f1d3c80a-b443-49b9-ad32-560ce3d61edb"

# Airbyte's Postgres destination definition ID (standard, never changes)
POSTGRES_DESTINATION_DEFINITION_ID = "25c5221d-dce2-4163-ade9-739ef790f503"


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

async def _get_access_token(client: httpx.AsyncClient) -> str:
    """
    Exchange client_id + client_secret for a short-lived bearer token.
    Tokens expire after 15 minutes — call this fresh for each script run.
    """
    response = await client.post(
        f"{AIRBYTE_API_BASE}/applications/token",
        json={
            "client_id": os.environ["AIRBYTE_CLIENT_ID"],
            "client_secret": os.environ["AIRBYTE_CLIENT_SECRET"],
        },
    )
    response.raise_for_status()
    token = response.json()["access_token"]
    logger.info("Airbyte access token obtained")
    return token


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------------------------------------------------------------------------
# Workspace helpers
# ---------------------------------------------------------------------------

async def _get_workspace_id(client: httpx.AsyncClient, token: str) -> str:
    """Return the first workspace ID in the account."""
    response = await client.get(
        f"{AIRBYTE_API_BASE}/workspaces",
        headers=_auth_headers(token),
    )
    response.raise_for_status()
    workspaces = response.json().get("data", [])
    if not workspaces:
        raise RuntimeError("No Airbyte workspaces found. Create one at app.airbyte.ai")
    workspace_id = workspaces[0]["workspaceId"]
    logger.info("Using workspace: %s", workspace_id)
    return workspace_id


# ---------------------------------------------------------------------------
# Step 1: Create RentCast source
# ---------------------------------------------------------------------------

async def setup_rentcast_source(
    city: str,
    state: str,
    bedrooms: int | None = None,
    max_days_old: int = 7,
) -> str:
    """
    Register RentCast as a source in your Airbyte workspace.

    Only needs to run ONCE. Returns the source_id — save it to your .env
    as AIRBYTE_RENTCAST_SOURCE_ID so you don't recreate it on every run.

    Args:
        city:         City to search (e.g. "Austin")
        state:        2-letter state code (e.g. "TX")
        bedrooms:     Optional bedroom filter
        max_days_old: Only pull listings this many days old or newer

    Returns:
        source_id string — store this in your .env
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        token = await _get_access_token(client)
        workspace_id = await _get_workspace_id(client, token)

        # Build the RentCast source configuration.
        # RentCast is a marketplace connector so we use definitionId, NOT sourceType.
        # definitionId: https://docs.airbyte.com/integrations/sources/rentcast
        source_config: dict = {
            "api_key": os.environ["RENT_CAST_API"],
            "city": city,
            "state": state,
            "status": "Active",
            "days_old": str(max_days_old),
            "property_type": "Apartment",
        }
        if bedrooms is not None:
            source_config["bedrooms"] = bedrooms

        response = await client.post(
            f"{AIRBYTE_API_BASE}/sources",
            headers=_auth_headers(token),
            json={
                "workspaceId": workspace_id,
                "name": f"RentCast - {city}, {state}",
                # Use definitionId for marketplace connectors, not sourceType
                "definitionId": RENTCAST_DEFINITION_ID,
                "configuration": source_config,
            },
        )
        if response.status_code >= 400:
            logger.error("Airbyte API error %s: %s", response.status_code, response.text)
        response.raise_for_status()
        source_id = response.json()["sourceId"]
        logger.info("RentCast source created: %s", source_id)
        print(f"\n✓ RentCast source created. Add to your .env:\n"
              f"  AIRBYTE_RENTCAST_SOURCE_ID={source_id}\n")
        return source_id


# ---------------------------------------------------------------------------
# Step 2: Create Postgres destination
# ---------------------------------------------------------------------------

async def setup_postgres_destination() -> str:
    """
    Register your Ghost Postgres DB as an Airbyte destination.

    Only needs to run ONCE. Returns destination_id — save as
    AIRBYTE_POSTGRES_DESTINATION_ID in your .env.

    Parses GHOST_CONNECTION_STRING automatically.
    Format: postgresql://user:password@host:port/dbname
    """
    conn_str = os.environ["GHOST_CONNECTION_STRING"]

    # Parse the connection string into individual fields Airbyte needs
    # Format: postgresql://user:password@host:port/dbname
    from urllib.parse import urlparse
    parsed = urlparse(conn_str)

    async with httpx.AsyncClient(timeout=30.0) as client:
        token = await _get_access_token(client)
        workspace_id = await _get_workspace_id(client, token)

        response = await client.post(
            f"{AIRBYTE_API_BASE}/destinations",
            headers=_auth_headers(token),
            json={
                "workspaceId": workspace_id,
                "name": "Ghost Postgres DB",
                "configuration": {
                    "destinationType": "postgres",
                    "host": parsed.hostname,
                    "port": parsed.port or 5432,
                    "database": parsed.path.lstrip("/"),
                    "username": parsed.username,
                    "password": parsed.password,
                    "schema": "public",
                    # Timescale Cloud requires SSL — disable_ssl: false enables it
                    "ssl": True,
                },
            },
        )
        if response.status_code >= 400:
            logger.error("Airbyte API error %s: %s", response.status_code, response.text)
        response.raise_for_status()
        destination_id = response.json()["destinationId"]
        logger.info("Postgres destination created: %s", destination_id)
        print(f"\n✓ Postgres destination created. Add to your .env:\n"
              f"  AIRBYTE_POSTGRES_DESTINATION_ID={destination_id}\n")
        return destination_id


# ---------------------------------------------------------------------------
# Step 3: Create a Connection (source → destination)
# ---------------------------------------------------------------------------

async def setup_rentcast_sync(
    source_id: str,
    destination_id: str,
    sync_interval_hours: int = 1,
) -> str:
    """
    Wire the RentCast source to the Postgres destination.

    Only needs to run ONCE. Returns connection_id — save as
    AIRBYTE_CONNECTION_ID in your .env.

    Airbyte will sync on the schedule you set, AND you can trigger
    manual syncs any time via trigger_sync().

    Args:
        source_id:            From setup_rentcast_source()
        destination_id:       From setup_postgres_destination()
        sync_interval_hours:  How often Airbyte auto-syncs. Default 1 hour.

    Returns:
        connection_id string
    """
    async with httpx.AsyncClient(timeout=120.0) as client:
        token = await _get_access_token(client)

        response = await client.post(
            f"{AIRBYTE_API_BASE}/connections",
            headers=_auth_headers(token),
            json={
                "sourceId": source_id,
                "destinationId": destination_id,
                "name": "RentCast -> Ghost Postgres",
                # Cron: top of every hour, UTC. Min frequency allowed is 1 hour.
                "schedule": {
                    "scheduleType": "cron",
                    "cronExpression": "0 0 * * * ?",
                },
                "status": "active",
            },
        )
        if response.status_code >= 400:
            logger.error("Airbyte API error %s: %s", response.status_code, response.text)
        response.raise_for_status()
        connection_id = response.json()["connectionId"]
        logger.info("Airbyte connection created: %s", connection_id)
        print(f"\n✓ Connection created. Add to your .env:\n"
              f"  AIRBYTE_CONNECTION_ID={connection_id}\n")
        return connection_id


# ---------------------------------------------------------------------------
# Step 4: Trigger a manual sync
# ---------------------------------------------------------------------------

async def trigger_sync(connection_id: str | None = None) -> str:
    """
    Trigger an immediate sync for the RentCast → Postgres connection.

    Call this whenever you want fresh listings (e.g. on app startup,
    or when a user updates their search preferences).

    Args:
        connection_id: Defaults to AIRBYTE_CONNECTION_ID env var.

    Returns:
        job_id string — pass to wait_for_sync() to block until done.
    """
    connection_id = connection_id or os.environ["AIRBYTE_CONNECTION_ID"]

    async with httpx.AsyncClient(timeout=30.0) as client:
        token = await _get_access_token(client)

        response = await client.post(
            f"{AIRBYTE_API_BASE}/jobs",
            headers=_auth_headers(token),
            json={
                "connectionId": connection_id,
                "jobType": "sync",
            },
        )
        response.raise_for_status()
        job_id = str(response.json()["jobId"])
        logger.info("Sync triggered, job_id=%s", job_id)
        return job_id


# ---------------------------------------------------------------------------
# Step 5: Poll until sync completes
# ---------------------------------------------------------------------------

async def wait_for_sync(
    job_id: str,
    poll_interval_seconds: int = 10,
    timeout_seconds: int = 300,
) -> bool:
    """
    Poll the Airbyte job until it succeeds or fails.

    Args:
        job_id:                 From trigger_sync()
        poll_interval_seconds:  How often to check. Default 10s.
        timeout_seconds:        Give up after this long. Default 5 min.

    Returns:
        True if sync succeeded, False if it failed or timed out.
    """
    deadline = time.time() + timeout_seconds

    async with httpx.AsyncClient(timeout=30.0) as client:
        token = await _get_access_token(client)

        while time.time() < deadline:
            response = await client.get(
                f"{AIRBYTE_API_BASE}/jobs/{job_id}",
                headers=_auth_headers(token),
            )
            response.raise_for_status()
            job = response.json()
            status = job.get("status")

            logger.info("Sync job %s status: %s", job_id, status)

            if status == "succeeded":
                return True
            if status in ("failed", "cancelled"):
                logger.error("Sync job %s ended with status: %s", job_id, status)
                return False

            # Still running — wait and poll again
            await asyncio.sleep(poll_interval_seconds)

    logger.error("Sync job %s timed out after %ds", job_id, timeout_seconds)
    return False
