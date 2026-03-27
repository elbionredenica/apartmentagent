# Frontend Architecture

> ApartmentAgent — Next.js 16.2.1 / React 19 / TypeScript 6 / Tailwind CSS 4

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.1 |
| UI | React | 19.2.4 |
| Language | TypeScript | 6.0.2 |
| Styling | Tailwind CSS | 4.2.2 |
| Icons | Lucide React | 1.7.0 |
| Animation | Motion (framer-motion v12) | 12.38.0 |
| Page transitions | next-view-transitions | 0.3.5 |
| Auth (Phase 2) | Auth0 via @auth0/nextjs-auth0 | — |

---

## Directory Structure

```
apartmentagent/
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # Root layout (Inter font, ViewTransitions)
│   ├── globals.css                 # Design tokens + view transition CSS
│   ├── page.tsx                    # Landing / Login (server guard)
│   ├── LoginClient.tsx             # Landing page (composes landing sections)
│   ├── chat/
│   │   ├── page.tsx                # Chat route (server guard)
│   │   └── ChatClient.tsx          # Chat + preference builder
│   ├── dashboard/
│   │   ├── layout.tsx              # NavBar wrapper
│   │   ├── page.tsx                # Dashboard route (server guard)
│   │   └── DashboardClient.tsx     # Calendar + pipeline + drawer
│   ├── intel/
│   │   ├── layout.tsx              # NavBar wrapper
│   │   └── page.tsx                # Coming soon placeholder
│   └── api/
│       ├── chat/route.ts           # POST — mock chat responses
│       ├── searches/route.ts       # POST — start search
│       └── demo/load/route.ts      # POST — set demo session
├── components/
│   ├── ui/                         # Primitives (Button, Card, Input, Badge, Drawer, EmptyState)
│   ├── chat/                       # Chat page components
│   ├── dashboard/                  # Dashboard page components
│   ├── landing/                    # Landing page sections
│   ├── NavBar.tsx                  # Top navigation
│   ├── StatusBadge.tsx             # Status-aware badge
│   └── Providers.tsx               # Context wrapper (Auth0 Phase 2)
├── lib/
│   ├── mock-data.ts                # Demo user, listings, transcripts, viewings, chat script
│   ├── session.ts                  # Cookie-based session (getUserId, setUserSession, clearUserSession)
│   └── status-map.ts               # ListingStatus → UI label + colors
├── types/
│   ├── index.ts                    # Re-exports all types
│   ├── user.ts                     # User, Preferences, DraftProfile
│   ├── listing.ts                  # Listing, ListingCard, ListingStatus, UIListingStatus, FailureReason
│   ├── transcript.ts               # CallTranscript, CallType, CallOutcome
│   ├── viewing.ts                  # Viewing, ViewingStatus
│   ├── chat.ts                     # Message, ChatRequest, ChatResponse
│   ├── search.ts                   # SearchRequest, SearchResponse
│   └── sse.ts                      # SSEEvent union type
├── package.json
├── tsconfig.json                   # Path alias: @/* → ./*
├── next.config.ts                  # Empty (defaults)
└── postcss.config.mjs              # Tailwind CSS plugin
```

---

## Routing & Auth

### Route Map

| Route | Auth | Server Component | Client Component |
|---|---|---|---|
| `/` | Public (redirects to `/dashboard` if logged in) | `app/page.tsx` | `LoginClient.tsx` |
| `/chat` | Protected (redirects to `/` if no session) | `app/chat/page.tsx` | `ChatClient.tsx` |
| `/dashboard` | Protected | `app/dashboard/page.tsx` | `DashboardClient.tsx` |
| `/intel` | Protected | `app/intel/page.tsx` | — (static placeholder) |

### Auth Flow (Demo Mode)

1. Server pages call `getUserId()` → reads `userId` httpOnly cookie
2. "Enter Demo" button → `POST /api/demo/load` → sets cookie with `DEMO_USER_ID`
3. Phase 2: `getUserId()` will call `auth0.getSession()` instead

### Navigation

- **NavBar links**: Use `Link` from `next-view-transitions` (smooth route transitions)
- **Programmatic navigation**: Use `useTransitionRouter()` from `next-view-transitions` (replaces `useRouter`)
- **View transitions**: Slide-and-fade CSS animations on `::view-transition-old/new(root)`
- **NavBar persistence**: `view-transition-name: navbar` prevents NavBar from animating during transitions

---

## Design System

### Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-white` | `#FFFFFF` | Primary background |
| `--color-off-white` | `#F7F6F5` | Secondary background, cards |
| `--color-border` | `#EBEBEB` | All borders |
| `--color-ink` | `#222222` | Primary text, headings |
| `--color-ink-mid` | `#484848` | Secondary text, labels |
| `--color-ink-muted` | `#767676` | Placeholders, captions |
| `--color-accent` | `#FF5A5F` | Primary CTA, brand coral |
| `--color-accent-light` | `#FFF0F0` | Accent tint backgrounds |
| `--color-accent-dark` | `#E04E53` | Hover state |
| `--color-success` | `#008A05` | Confirmed/booked |
| `--color-warning` | `#B45309` | Partial match |
| `--color-error` | `#C13515` | Error state |

### Typography

- **Font**: Inter (Google Fonts, weights 300–800)
- **Scale**: xs (12px), sm (14px), base (16px), md (18px), lg (22px), xl (28px), 2xl (36px)
- **Weights**: 300 (timestamps), 400 (body), 500 (emphasized), 600 (headings/buttons), 700 (titles)

### Spacing & Radius

- **Base unit**: 8px
- **Radius**: sm (8px), md (12px), lg (16px), xl (24px), full (9999px)
- **Shadows**: sm, md, lg (increasing opacity/blur)

### Motion

- **Enter**: opacity 0→1 + translateY(8px→0), 200ms ease-out
- **Leave**: opacity 1→0, 150ms ease-in
- **Hover**: 160ms
- **Route transition**: slide-out 250ms + slide-in 300ms

---

## Component Library

### UI Primitives (`components/ui/`)

| Component | Props | Description |
|---|---|---|
| `Button` | `variant: "primary" \| "secondary" \| "ghost"` | Coral CTA, outlined, or minimal |
| `Card` | `hoverable?: boolean` | White card with border, optional hover shadow |
| `Input` | Standard HTML input props | Styled text input with focus ring |
| `Badge` | `bgClass, textClass` | Colored pill for status labels |
| `Drawer` | `open, onClose, title?, width?` | Right-sliding overlay panel with backdrop |
| `EmptyState` | `icon, message` | Centered placeholder with icon |

### Shared Components

| Component | Description |
|---|---|
| `NavBar` | Top nav with logo, Dashboard/Intel links, avatar. Uses transition-aware `Link`. |
| `StatusBadge` | Wraps `Badge` with `mapBackendStatus()` for automatic styling by `ListingStatus` |
| `Providers` | Context wrapper. No-op now, Auth0Provider in Phase 2. |

---

## Page Components

### Landing Page (`/`)

`LoginClient.tsx` composes 6 sections:

| Section | Component | Description |
|---|---|---|
| Hero | `HeroSection` | Full-viewport, two-column. Headline, CTA buttons, mock call transcript card. Fade-slide-up animation. |
| Features | `FeaturesSection` | 3-column grid on `bg-off-white`. Phone/Clipboard/Calendar icons. Staggered scroll animation. |
| How It Works | `HowItWorksSection` | 3 numbered steps with connecting line. Sequential scroll reveal. |
| Stats | `StatsSection` | Coral background strip with 3 metrics. Fade-in on scroll. |
| CTA | `CTASection` | Bottom call-to-action with demo + Auth0 buttons. |
| Footer | `Footer` | Minimal branding line. |

All sections use `AnimateOnScroll` wrapper (motion.div with `whileInView`).

### Chat Page (`/chat`)

`ChatClient.tsx` — two-column layout (60% / 40%):

| Panel | Component | Description |
|---|---|---|
| Left | `ChatPanel` | Message list, typing indicator, quick-reply chips, text input |
| Right | `PreferenceBuilder` | Live preference cards that appear as agent extracts info |

**Sub-components**: `MessageBubble`, `TypingIndicator`, `QuickReplyChips`, `PreferenceCard`

**Flow**: User converses → agent extracts preferences → `readyToStart: true` triggers search → navigate to dashboard.

### Dashboard Page (`/dashboard`)

`DashboardClient.tsx` — multi-panel layout:

| Panel | Component | Description |
|---|---|---|
| Left sidebar (320px) | `ListingPipeline` | Sorted listing cards with status badges |
| Center | `CalendarView` | Week-view calendar (8am–8pm) with viewing events |
| Right drawer | `DetailsDrawer` | Listing details, transcripts with scores, feedback form |
| Bottom bar | `ChatBar` | Persistent agent status (active calls / completion summary) |

**Sub-components**: `ListingPipelineCard`, `CalendarHeader`, `CalendarEvent`, `TranscriptView`, `ScoreDisplay`, `FeedbackForm`

---

## Type System

### Core Types

```typescript
// User & Preferences
User { id, email, fullName, maxBudget, minBedrooms, maxBedrooms, hasPet, petType, petWeightLbs, dealbreakers, preferences }
Preferences { locations, minBathrooms, mustHaves, niceToHaves, moveInTimeline, customQuestions, notes }
DraftProfile { maxBudget, locations, bedrooms, hasPet, petType, petWeightLbs, dealbreakers, mustHaves, moveInTimeline, customQuestions }

// Listings
Listing { id, address, city, rent, bedrooms, bathrooms, description, phone, propertyManager, photos, amenities, ... }
ListingCard { id, address, rent, bedrooms, status, failureReason?, score?, updatedAt }
ListingStatus = "discovered" | "criteria_checked" | "queued_for_prescreen" | "prescreening" | "prescreened" | "queued_for_deepscreen" | "deepscreening" | "deepscreened" | "ready_for_booking" | "voicemail_pending" | "booked" | "failed"

// Transcripts
CallTranscript { id, listingId, callType, outcome, duration, transcript, extractedData, scores, complianceFlags }
CallOutcome = "PASS" | "FAIL" | "VOICEMAIL" | "NO_ANSWER" | "WRONG_NUMBER" | "COMPLIANCE_VIOLATION"

// Viewings
Viewing { id, listingId, userId, scheduledAt, status, address, propertyManager, attended?, rating?, wouldApply?, feedback? }

// Chat
Message { id, role: "user" | "agent", content, timestamp }
ChatResponse { message, profilePatch?, missingFields?, readyToStart, action?, preferences? }

// SSE
SSEEvent = { type: "listing_update" | "new_viewing" | "transcript_ready" | "connected", data }
```

### Status Mapping

`lib/status-map.ts` maps 12 backend statuses → 8 UI labels with Tailwind classes:

| Backend Status | UI Label | Style |
|---|---|---|
| `discovered`, `criteria_checked` | Evaluating | Shortlisted (amber) |
| `queued_for_prescreen` | Queued | Muted (gray) |
| `prescreening`, `deepscreening` | Reaching Out | Accent (coral) |
| `prescreened`, `queued_for_deepscreen`, `deepscreened` | Deep Screening | Shortlisted (amber) |
| `ready_for_booking` | Ready to Book | Success (green) |
| `voicemail_pending` | Unable to Reach | Muted (gray) |
| `booked` | Booked | Booked (green) |
| `failed` | Not a Fit | Error (red) |

---

## API Routes

| Endpoint | Method | Request | Response | Notes |
|---|---|---|---|---|
| `/api/chat` | POST | `{ messages, draftProfile }` | `ChatResponse` | Mock: indexes into `MOCK_CHAT_RESPONSES` array. 800ms delay. |
| `/api/searches` | POST | `{ preferences }` | `{ userId, searchStarted }` | Guards on session cookie. Phase B: triggers pipeline. |
| `/api/demo/load` | POST | — | `{ userId, seeded }` | Sets `DEMO_USER_ID` session cookie. |

### Planned Endpoints (Phase B)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/users/:userId/profile` | GET | User preferences |
| `/api/users/:userId/listings` | GET | Listing pipeline |
| `/api/users/:userId/viewings` | GET | Scheduled viewings |
| `/api/users/:userId/transcripts` | GET | All transcripts |
| `/api/listings/:listingId/transcripts` | GET | Listing-specific transcripts |
| `/api/viewings/:id/feedback` | PATCH | Post-viewing feedback |
| `/api/users/:userId/stream` | GET | SSE for live updates |

---

## Data Flow

### Demo Flow (Current)

```
Landing Page → "Try Demo" → POST /api/demo/load → set cookie
  → /chat → POST /api/chat (×6 scripted turns) → extract preferences
  → POST /api/searches → /dashboard → render mock data
```

### State Management

- **Server**: Cookie-based session (`lib/session.ts`)
- **Client**: React `useState` per page (no global store)
- **Data**: Hardcoded mock data in `lib/mock-data.ts`
- **Future**: Ghost/Postgres via API routes, SSE for real-time updates

---

## Patterns & Conventions

1. **Server/Client split**: Server components handle auth guards and data fetching. Client components handle interactivity. Named `*Client.tsx`.
2. **Tailwind-only styling**: No CSS modules. Custom theme tokens in `globals.css`. No component library (all custom primitives).
3. **Transition-aware navigation**: All `Link` and `router.push` use `next-view-transitions` variants.
4. **Scroll animations**: `AnimateOnScroll` wrapper using `motion.div` with `whileInView`.
5. **Status centralization**: `status-map.ts` is the single source of truth for status → UI mapping.
6. **Path alias**: `@/*` maps to project root (e.g., `@/components/ui/Button`).
7. **Consistent timing**: 160ms hovers, 200ms UI transitions, 300–500ms entrance animations.

---

## Phase 2 Roadmap

| Feature | Status | Notes |
|---|---|---|
| Auth0 integration | Planned | `Providers.tsx` ready, `session.ts` has swap comment |
| Ghost/Postgres database | Planned | Types match schema, API routes have Phase B comments |
| SSE streaming | Planned | `SSEEvent` types defined, endpoint planned |
| Live Claude API chat | Planned | Mock can be toggled via `ENABLE_LIVE_CHAT` env var |
| Bland AI voice calls | Planned | Transcript types ready for real call data |
| Intel page | Planned | Route exists, layout in place, UI TBD |
| Airbyte listing ingestion | Planned | Listing types ready |
