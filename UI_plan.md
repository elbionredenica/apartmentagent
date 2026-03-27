# ApartmentAgent — Frontend UX Plan

## Stack
Planned stack for the new UI implementation:

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Backend for UI**: Next.js route handlers over Ghost/Postgres
- **Auth**: Demo session / seeded user for MVP, Auth0 via `@auth0/nextjs-auth0` in phase 2
- **Real-time**: SSE from `/api/users/:userId/stream` (polling only as a temporary fallback)
- **Calendar**: Custom weekly calendar fed by `viewings`
- **Data source**: existing `users`, `listings`, `user_listing_states`, `call_transcripts`, `viewings`

---

## Routes

| Route        | Page                                      |
|--------------|-------------------------------------------|
| `/`          | Login / Landing                           |
| `/chat`      | Chatbot + live preference builder         |
| `/dashboard` | Calendar + live sidebar pipeline          |
| `/intel`     | Split-screen intel view (build later)     |

---

## Page 1 — Login (`/`)

**Purpose**: Entry point. Clean first impression for the demo and a place to enter demo mode before Auth0 is wired.

**Layout**:
- Left half: brand statement, value prop, 3 stat counters (calls made, avg tours saved, listings qualified)
- Right half: access card
  - primary CTA: `Enter Demo`
  - secondary CTA: `Continue with Auth0` when phase 2 auth is enabled

**Behavior**:
- Demo entry loads the seeded demo user and redirects to `/chat`
- Auth0 session, when enabled, redirects to `/chat`
- Existing active demo session or active user listings in progress → redirect to `/dashboard`

---

## Page 2 — Chat (`/chat`)

**Purpose**: The agent learns what the user wants conversationally, then autonomously kicks off the calling pipeline. No button to "start" — the agent decides when it has enough.

### Layout: Two-column

**Left panel (~60%) — Chat interface**
- Agent bubbles on left, user bubbles on right
- Typing indicator while agent is processing
- Text input + send at bottom
- Quick-reply chips for common answers ("No pets", "ASAP", "Yes", "No")

**Right panel (~40%) — Live Preference Builder**
- Starts empty: subtle placeholder text *"Your search profile will appear here as we talk"*
- As Claude extracts each piece of info from the conversation, a preference card **animates in** (slide + fade from bottom)
- Cards grouped by category:
  - Budget
  - Location
  - Bedrooms / Bathrooms
  - Pets
  - Dealbreakers
  - Must-Haves
  - Move-in Timeline
  - Custom Questions
- Each card shows the value in plain language e.g. *"Max $3,000/mo incl. utilities"*
- Cards get a subtle green border once agent confirms them back in conversation

### Agent Auto-Start Logic

The chat endpoint should collect the core profile fields required to actually start a search. The minimum start gate is:

1. Max budget
2. Location / neighborhood(s)
3. Bedroom count or range
4. Pet situation (type + weight if applicable)
5. At least one dealbreaker

These fields are useful, but optional before kickoff:

- Must-have
- Move-in timeline
- Custom questions

When the minimum set is satisfied, the chat response includes structured data the frontend watches for:

```json
{
  "message": "Got everything I need. I can start calling now.",
  "profilePatch": { "...": "..." },
  "missingFields": [],
  "readyToStart": true,
  "action": "START_SEARCH",
  "preferences": { ... }
}
```

Frontend detects this flag, calls `POST /api/searches`, and only then transitions to `/dashboard`.

### Transition Sequence

1. Agent sends final message: *"Got everything I need. I'm calling 8 listings now — I'll book the ones worth your time."*
2. Preference cards on the right do a brief "lock in" animation (borders turn gold)
3. Frontend sends the normalized profile to `POST /api/searches`
4. After the search-start request succeeds → navigate to `/dashboard`
5. Chat UI **shrinks to a persistent collapsed bar** at the very bottom of the dashboard

---

## Page 3 — Dashboard (`/dashboard`)

**Purpose**: Main working view. The agent operates in real time — listings trickle into the sidebar with live state changes, booked viewings appear on the calendar as calls complete.

### Layout: Two-column

---

### Left (~30%) — Live Task Sidebar

A vertical pipeline tracker. Every listing the agent works on appears as a card and updates state live.

The backend remains the source of truth with canonical states:

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

The UI maps those states to friendlier labels:

| Backend state(s) | UI label |
|------------------|----------|
| `discovered`, `criteria_checked` | Evaluating |
| `queued_for_prescreen` | Queued |
| `prescreening`, `deepscreening` | Reaching Out |
| `prescreened`, `queued_for_deepscreen`, `deepscreened` | Deep Screening |
| `ready_for_booking` | Ready to Book |
| `voicemail_pending` | Unable to Reach |
| `booked` | Booked |
| `failed` | Not a Fit |

**Each listing card shows:**
- Address (truncated to one line)
- State badge (colored pill)
- Pulsing animated border while state is "Reaching Out"
- Timestamp of last update
- Failure reason when state = `failed`
- Latest score when available

**State badge colors:**
| State            | Color                        |
|------------------|------------------------------|
| Evaluating       | Gold                         |
| Queued           | Muted amber                  |
| Reaching Out     | Blue with pulse animation    |
| Deep Screening   | Teal                         |
| Ready to Book    | Emerald                      |
| Booked           | Green                        |
| Unable to Reach  | Grey / muted                 |
| Not a Fit        | Red / muted                  |

Cards animate in one by one as the agent queues each listing. State transitions cross-fade smoothly.

---

### Right (~70%) — Calendar

Weekly calendar view of the current week.

- Source of truth is the `viewings` dataset, not listing state alone
- Booked appointments appear as calendar events **live** when a new `viewings` record arrives
- Each event block: address, time slot, landlord contact name
- Color coding: green for booked, amber for pending reschedule or follow-up states if added later
- Clicking an event → detail popover showing:
  - Full address + rent
  - Why it passed or what still needs follow-up
  - Landlord contact info
  - Prep notes for the viewing
  - Link to transcript/details drawer
- While agent is still working: subtle placeholder slots that get replaced by real bookings as they come in

### Details / Transcript Drawer

Accessible from a listing card or calendar event.

- Shows the latest transcript
- Shows extracted data and scores
- Shows failure reason or booking rationale
- If the viewing is completed, includes the feedback form:
  - attended
  - rating
  - would apply
  - free-form notes

---

### Bottom — Collapsed Chat Bar

Persistent bar at the very bottom of the dashboard:

- While running: *"🤖 Agent is working · 5 calls remaining · Refine criteria?"*
- Click to expand → chat panel overlays the screen so user can add/change requirements mid-search
- When done: *"✓ Done · 3 viewings booked · 2 listings couldn't be reached"*

---

## Page 4 — Intel (`/intel`) — Build later

**Purpose**: Deep-dive comparison page after the dashboard MVP exists. Transcript retrieval itself still ships in the dashboard details drawer.

### Layout: True 50/50 split

**Left — Your Profile**
Structured preference cards. Static reference panel.

**Right — Landlord Intelligence**
Per-listing findings. "You wanted" vs "What they said" per criterion with pass/fail indicators. Transcript expandable per listing.

Accessible from the top nav at any time after the agent has run.

---

## Top Navigation

Appears on `/dashboard` and `/intel` only (hidden on login and chat).

```
[ ApartmentAgent ]          [ Dashboard ]  [ Intel ]  [ avatar · logout ]
```

---

## Component Tree

``` 
app/
├── page.tsx                    → Login
├── chat/
│   └── page.tsx                → ChatPage
│       ├── ChatPanel           → messages, input, quick-reply chips
│       └── PreferenceBuilder   → animated live preference cards
├── dashboard/
│   └── page.tsx                → DashboardPage
│       ├── Sidebar             → live listing pipeline cards
│       ├── CalendarView        → weekly calendar + event blocks
│       ├── ChatBar             → collapsed persistent chat bar
│       └── DetailsDrawer       → transcript, scores, booking detail, feedback form
└── intel/
    └── page.tsx                → IntelPage (later)
        ├── ProfilePanel        → extracted user prefs
        └── LandlordPanel       → per-listing call findings
```

---

## State Management

| Data                  | Where it lives                                              |
|-----------------------|-------------------------------------------------------------|
| Draft user preferences | React state during chat, normalized before search start    |
| Persisted profile      | `GET /api/users/:userId/profile` + `POST /api/searches`    |
| Listing pipeline       | Initial `GET /api/users/:userId/listings` + SSE stream     |
| Calendar events        | `GET /api/users/:userId/viewings`                          |
| Chat history           | Local React state, sent to `POST /api/chat`                |
| Transcript detail      | Fetched on demand from `/api/listings/:listingId/transcripts` |

---

## API Contracts (frontend expects these from backend)

```ts
// POST /api/chat
body: { messages: Message[], draftProfile: Partial<Preferences> }
response: {
  message: string,
  profilePatch: Partial<Preferences>,
  missingFields: string[],
  readyToStart: boolean,
  action?: "START_SEARCH",
  preferences?: Preferences
}

// POST /api/searches
body: { userId: string, preferences: Preferences }
response: { userId: string, searchStarted: true }

// GET /api/users/:userId/profile
response: Preferences

// GET /api/users/:userId/listings
response: ListingCard[]

// GET /api/users/:userId/viewings
response: Viewing[]

// GET /api/users/:userId/transcripts
response: Transcript[]

// GET /api/listings/:listingId/transcripts
response: Transcript[]

// PATCH /api/viewings/:id/feedback
body: { attended: boolean, userRating?: number, wouldApply?: boolean, userFeedback?: string }
response: Viewing

// POST /api/demo/load
response: { userId: string, seeded: true }

// GET /api/users/:userId/stream
// Server-Sent Events for listing updates, transcript arrivals, and new viewings
```

---

## Key Demo Moments (in order)

| # | Moment |
|---|--------|
| 1 | Landing → clean entry with `Enter Demo` first, Auth0 later |
| 2 | Chat → preference cards build themselves live on the right as user talks |
| 3 | Agent auto-detects enough info → sends final message → frontend starts the search |
| 4 | Dashboard loads → sidebar starts populating one listing at a time with canonical state updates mapped to friendly labels |
| 5 | First booked viewing record arrives → a calendar event animates in live |
| 6 | More bookings trickle in → calendar fills up |
| 7 | Collapsed chat bar at bottom shows live progress counter |
| 8 | Click a calendar event or listing → detail drawer with transcript, scores, and feedback flow |
