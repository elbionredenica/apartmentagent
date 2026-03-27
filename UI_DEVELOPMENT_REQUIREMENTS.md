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

## Selected Implementation Direction

To align the product requirements with the UI plan, the planned implementation direction is:

- Frontend: Next.js (App Router)
- Styling: Tailwind CSS
- UI-facing backend: thin Next.js route handlers that read/write Ghost/Postgres
- Real-time updates: SSE first, with polling only as a temporary development fallback
- MVP auth: demo session / seeded demo user
- Phase 2 auth: Auth0 for real user login and calendar OAuth

These are planning decisions only. They are not implemented in the repo yet.

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

## Canonical Search Profile Contract

The UI and backend should share one profile shape.

Core fields map to existing columns on `users`:

- `max_budget`
- `min_bedrooms`
- `max_bedrooms`
- `has_pet`
- `pet_type`
- `pet_weight_lbs`
- `dealbreakers`

Flexible fields should live inside `users.preferences` JSONB:

```json
{
  "locations": ["mission", "soma"],
  "min_bathrooms": 1,
  "must_haves": ["quiet", "in-unit laundry"],
  "nice_to_haves": ["parking"],
  "move_in_timeline": "within_30_days",
  "custom_questions": ["How often does rent increase?"],
  "notes": "Works from home three days a week"
}
```

For search kickoff, the minimum required profile fields are:

1. `max_budget`
2. at least one `locations` entry
3. bedroom count or range
4. pet details if `has_pet = true`
5. at least one dealbreaker

`must_haves`, `move_in_timeline`, and `custom_questions` are useful for the UX, but should be optional for starting the search.

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

For the chosen Next.js-based UI plan, this API should be implemented as thin route handlers rather than the browser connecting directly to Postgres.

A practical minimum backend for the UI would expose:

- `POST /api/chat`
- `POST /api/searches`
- `GET /api/users/:userId/profile`
- `GET /api/users/:userId/listings`
- `GET /api/users/:userId/transcripts`
- `GET /api/listings/:listingId/transcripts`
- `GET /api/users/:userId/viewings`
- `GET /api/users/:userId/stream` (SSE)
- `POST /api/demo/load` or similar, if you want one-click demo reset
- `PATCH /api/viewings/:id/feedback` or similar, for post-viewing feedback

Without this API layer, the frontend should use mock JSON fixtures.

## 4. Auth

Auth0 is not required for the MVP demo flow, but it is required if the UI needs:

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
- phase 1 can use a demo session and seeded user instead of real login
- phase 2 should add Auth0-backed sessions and calendar OAuth

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

## Canonical Workflow State Model

The backend should expose canonical workflow states. The UI can map these to friendlier labels, but should not invent different source-of-truth states.

Canonical states:

- `discovered`
- `criteria_checked`
- `queued_for_prescreen`
- `prescreening`
- `prescreened`
- `queued_for_deepscreen`
- `deepscreening`
- `deepscreened`
- `ready_for_booking`
- `voicemail_pending`
- `booked`
- `failed`

The UI should rely on `failure_reason` for failed items and should treat `viewings` as the source of truth for booked calendar events.

If the product later wants concepts like "Partial Fit", those should be exposed as a separate computed field such as `fit_tier`, not by replacing the canonical workflow state.

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

These pieces are not in the repo yet and need to be implemented:

- the actual Next.js app scaffold
- the route handlers / API layer
- the SSE stream for live listing and transcript updates
- typed frontend models based on the schema and profile JSON contract
- the demo session flow and seeded-user bootstrapping
- transcript and feedback UI surfaces
- user identity mapping for phase 2 Auth0
  - how Auth0 users map to `users.id` / `users.email`
- token storage for phase 2 calendar OAuth
  - the Auth0 notes mention a `user_auth_tokens` table, but that table is not in `schema.sql`

## Practical Recommendation

For this repo as it exists today, the best UI-development setup is:

1. scaffold the Next.js app and frontend types from the SQL schema
2. build the UI against mocked data first
3. add thin Next.js route handlers that read from Ghost/Postgres
4. add SSE and demo reset endpoints for the connected demo
5. add Auth0 only when login or booking is actually being wired up
6. treat Bland AI, Bedrock, Airbyte, and Aerospike as second-phase integrations

## Source Files

- `README.md`
- `.env.example`
- `schema.sql`
- `seed.sql`
- `DATABASE_SETUP_COMPLETE.md`
- `.kiro/specs/apartment-agent-core/requirements.md`
- `.kiro/skills/auth0-authentication.md`
