# UI Development Requirements

This document summarizes what the frontend needs based on the current repository contents.

## What Is In The Repo Today

This repo currently contains planning docs, setup docs, and SQL schema/seed files. It does **not** currently contain:

- a frontend app
- a `package.json`
- a backend/API implementation
- a `requirements.txt`
- the `src/main.py` or `src/dashboard.py` files mentioned in the README

That means UI development can start immediately, but a connected UI will need either:

1. mocked data, or
2. a small backend/API layer added first

## What The Product Expects

The intended product flow is:

1. ingest listings
2. orchestrate workflow state
3. run pre-screen calls
4. run deep-screen calls
5. book viewings

Source: `README.md`, `.kiro/specs/apartment-agent-core/requirements.md`

## Minimum Requirements For UI Development

## 1. Frontend Data Source

For a real connected UI, the frontend needs access to data representing:

- user preferences
- apartment listings
- per-user listing workflow state
- call transcripts and scores
- scheduled viewings

Those data structures already exist in the database schema:

- `users`
- `listings`
- `user_listing_states`
- `call_transcripts`
- `viewings`

Source: `schema.sql`

## 2. Database

If you want the UI to run against real data instead of mocks, the database is the main required backend dependency.

The repo is set up around a Ghost-hosted Postgres database, using:

- `GHOST_DB_ID`
- `GHOST_CONNECTION_STRING`

The schema and demo seed data are already defined in:

- `schema.sql`
- `seed.sql`

The setup docs also say a Ghost database named `apartment-agent-db` was created and seeded with:

- 1 demo user
- 3 San Francisco listings

Important:

- the frontend should **not** connect directly to Postgres from the browser
- `GHOST_CONNECTION_STRING` is server-only

## 3. Backend/API Layer

This is the biggest missing piece for frontend development.

The requirements mention API access for transcript retrieval, and the Auth0 notes sketch protected API routes, but there is no API implementation in the repo yet.

A practical minimum backend for the UI would expose:

- `GET /api/users/:userId/profile`
- `GET /api/users/:userId/listings`
- `GET /api/users/:userId/transcripts`
- `GET /api/listings/:listingId/transcripts`
- `GET /api/users/:userId/viewings`
- `POST /api/demo/load` or similar, if you want one-click demo reset
- `PATCH /api/viewings/:id/feedback` or similar, for post-viewing feedback

If you want the UI to show live workflow progress, add one of:

- SSE endpoint for status updates
- WebSocket endpoint for live transcript/status streaming

Without this API layer, the frontend should use mock JSON fixtures.

## 4. Auth

Auth0 is required if the UI needs:

- login/logout
- protected user-specific data
- calendar booking flows
- multi-tenant separation between users

The repo expects these env vars:

- `AUTH0_DOMAIN`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`

The Auth0 integration notes also expect:

- `AUTH0_SECRET`
- `BASE_URL`

Important:

- `AUTH0_CLIENT_SECRET` and `AUTH0_SECRET` are server-only
- the browser should only use safe public Auth0 config

## 5. Real-Time / Demo Integrations

These are **not required** for basic UI building, but they are required for the full intended product experience.

### Required for full live demo behavior

- Bland AI
  - for pre-screen and deep-screen call execution
  - needs `BLAND_API_KEY`
- AWS Bedrock
  - for transcript analysis/scoring
  - needs `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- Webhook base URL
  - needed so call providers can post results back to the backend
  - needs `WEBHOOK_BASE_URL`

### Required for real listing ingestion

- Airbyte
  - for listing ingestion / CDC
  - needs `AIRBYTE_API_KEY`, `AIRBYTE_WORKSPACE_ID`

### Optional

- Aerospike
  - only needed if you want the separate checkpointer/state store
  - Postgres/Ghost can be used instead
  - env vars: `AEROSPIKE_HOST`, `AEROSPIKE_PORT`, `AEROSPIKE_NAMESPACE`
- Overmind
  - optional prompt optimization
  - not needed for frontend development

## UI Features Implied By The Requirements

Based on the requirements/specs, the UI should eventually support:

- preference form
  - max budget
  - min/max bedrooms
  - pet details
  - dealbreakers
- listing dashboard
  - address, rent, bedrooms, description, source
- workflow status display
  - discovered
  - queued_for_prescreen
  - prescreened
  - queued_for_deepscreen
  - deepscreened
  - voicemail_pending
  - ready_for_booking
  - booked
  - failed
- failure reasons
  - PRICE
  - BEDROOMS
  - PETS
  - UNAVAILABLE
  - LOW_SCORE
  - COMPLIANCE_VIOLATION
  - MAX_RETRIES
  - WRONG_NUMBER
- transcript views
  - full transcript text
  - outcome
  - call duration
  - extracted data
- scoring UI
  - management score
  - noise score
  - value score
  - flexibility score
  - overall score
- viewing management
  - scheduled time
  - calendar event id
  - attendance
  - rating
  - feedback
  - would apply
- demo/live mode
  - real-time status updates
  - transcript streaming
  - final booking confirmation

## Recommended UI Development Modes

## Mode A: Pure UI Work

Use this if you are designing screens, flows, and components only.

You need:

- no database
- no Auth0
- no Bland AI
- no Airbyte
- no Bedrock
- local mock JSON only

This is the fastest path for initial frontend work.

## Mode B: Connected Demo UI

Use this if you want the UI to show real listings/state from the project database.

You need:

- Ghost/Postgres database
- schema loaded
- seed data loaded
- a minimal backend/API
- optional Auth0 depending on whether login is in scope

This is the best default target for real frontend development in this repo.

## Mode C: Full Product UI

Use this if you want the full intended experience.

You need:

- everything from Mode B
- Auth0
- Bland AI
- Bedrock
- Airbyte
- webhook handling
- optional Aerospike

## Current Gaps Blocking A Real Frontend

These pieces are not in the repo yet and need to be added or decided:

- frontend framework choice
  - React/Vite, Next.js, etc.
- backend framework choice
  - Express, FastAPI, etc.
- API contract
  - exact routes, payloads, auth model
- real-time transport
  - polling, SSE, or WebSockets
- user identity mapping
  - how Auth0 users map to `users.id` / `users.email`
- token storage model
  - the Auth0 notes mention a `user_auth_tokens` table, but that table is not in `schema.sql`

## Practical Recommendation

For this repo as it exists today, the best UI-development setup is:

1. build the frontend against mocked data first
2. use the existing SQL schema as the source of truth for types
3. add a very small backend that reads from Ghost/Postgres
4. add Auth0 only when login or booking is actually being wired up
5. treat Bland AI, Bedrock, Airbyte, and Aerospike as second-phase integrations

## Source Files

- `README.md`
- `.env.example`
- `schema.sql`
- `seed.sql`
- `DATABASE_SETUP_COMPLETE.md`
- `.kiro/specs/apartment-agent-core/requirements.md`
- `.kiro/skills/auth0-authentication.md`
