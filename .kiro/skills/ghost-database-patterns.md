# Ghost Database Schema Patterns for AI Agents

## Core Principle
Design schemas that are easy for LLMs to understand and query. Use descriptive names, avoid abbreviations, include helpful comments.

## Schema Design

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Preferences
    max_budget INTEGER NOT NULL,
    min_bedrooms INTEGER NOT NULL,
    max_bedrooms INTEGER NOT NULL,
    has_pet BOOLEAN DEFAULT FALSE,
    pet_type TEXT, -- 'dog', 'cat', 'other'
    pet_weight_lbs INTEGER,
    
    -- Dealbreakers (JSON for flexibility)
    dealbreakers JSONB DEFAULT '[]'::jsonb,
    -- Example: ["no_pets", "ground_floor_only", "must_be_quiet"]
    
    -- Nice-to-haves
    preferences JSONB DEFAULT '{}'::jsonb,
    -- Example: {"parking": "preferred", "laundry": "in_unit"}
    
    -- Learned patterns (updated by agent over time)
    learned_preferences JSONB DEFAULT '{}'::jsonb
    -- Example: {"rejects_ground_floor": true, "prefers_new_buildings": true}
);

COMMENT ON TABLE users IS 'Renter profiles with preferences and learned patterns';
COMMENT ON COLUMN users.dealbreakers IS 'Array of absolute requirements that will disqualify a listing';
COMMENT ON COLUMN users.learned_preferences IS 'Patterns learned from user feedback, updated by agent';
```

### Listings Table
```sql
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE NOT NULL, -- ID from Zillow/Apartments.com
    source TEXT NOT NULL, -- 'zillow', 'apartments_com', 'craigslist'
    
    -- Basic info
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT,
    
    -- Details
    bedrooms INTEGER,
    bathrooms NUMERIC(3,1),
    rent INTEGER NOT NULL,
    deposit INTEGER,
    square_feet INTEGER,
    
    -- Contact
    phone TEXT,
    email TEXT,
    property_manager TEXT,
    
    -- Raw data
    description TEXT,
    amenities JSONB DEFAULT '[]'::jsonb,
    photos JSONB DEFAULT '[]'::jsonb,
    raw_data JSONB, -- Full API response
    
    -- Metadata
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_available BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_listings_rent ON listings(rent);
CREATE INDEX idx_listings_bedrooms ON listings(bedrooms);
CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_listings_available ON listings(is_available) WHERE is_available = TRUE;

COMMENT ON TABLE listings IS 'Apartment listings from various sources';
```

### User Listing States Table
```sql
CREATE TABLE user_listing_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- State machine
    status TEXT NOT NULL,
    -- 'discovered', 'criteria_checked', 'queued_for_prescreen', 
    -- 'prescreened', 'queued_for_deepscreen', 'deepscreened',
    -- 'booked', 'failed', 'voicemail_pending'
    
    failure_reason TEXT,
    -- 'PETS', 'PRICE', 'NOISE', 'UNAVAILABLE', 'COMPLIANCE_VIOLATION'
    
    -- Timestamps
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    prescreened_at TIMESTAMPTZ,
    deepscreened_at TIMESTAMPTZ,
    booked_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    
    -- Metadata
    retry_count INTEGER DEFAULT 0,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_user_listing_states_user ON user_listing_states(user_id);
CREATE INDEX idx_user_listing_states_status ON user_listing_states(status);

COMMENT ON TABLE user_listing_states IS 'Tracks each listing processing state per user';
```

### Call Transcripts Table
```sql
CREATE TABLE call_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Call details
    call_type TEXT NOT NULL, -- 'prescreen', 'deepscreen'
    call_id TEXT, -- Bland AI call ID
    phone_number TEXT,
    duration_seconds INTEGER,
    
    -- Content
    transcript TEXT NOT NULL,
    extracted_data JSONB, -- Structured data from Bland AI extract
    
    -- Outcome
    outcome TEXT NOT NULL, -- 'PASS', 'FAIL', 'VOICEMAIL', 'WRONG_NUMBER', 'HOSTILE'
    failure_reason TEXT,
    
    -- Compliance
    compliance_violation BOOLEAN DEFAULT FALSE,
    compliance_notes TEXT,
    
    -- Timestamps
    called_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Scores (for deepscreen calls)
    management_score INTEGER, -- 0-100
    noise_score INTEGER,
    value_score INTEGER,
    flexibility_score INTEGER,
    overall_score INTEGER
);

CREATE INDEX idx_call_transcripts_user ON call_transcripts(user_id);
CREATE INDEX idx_call_transcripts_listing ON call_transcripts(listing_id);
CREATE INDEX idx_call_transcripts_outcome ON call_transcripts(outcome);
CREATE INDEX idx_call_transcripts_compliance ON call_transcripts(compliance_violation) WHERE compliance_violation = TRUE;

COMMENT ON TABLE call_transcripts IS 'Complete record of all calls made by the agent';
COMMENT ON COLUMN call_transcripts.extracted_data IS 'Structured data extracted by Bland AI';
```

### Viewings Table
```sql
CREATE TABLE viewings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Viewing details
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    calendar_event_id TEXT, -- Google Calendar or Outlook event ID
    
    -- Status
    status TEXT NOT NULL DEFAULT 'scheduled',
    -- 'scheduled', 'completed', 'cancelled', 'no_show'
    
    -- Feedback (collected after viewing)
    attended BOOLEAN,
    user_rating INTEGER, -- 1-5 stars
    user_feedback TEXT,
    would_apply BOOLEAN,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_viewings_user ON viewings(user_id);
CREATE INDEX idx_viewings_scheduled ON viewings(scheduled_at);

COMMENT ON TABLE viewings IS 'Scheduled and completed apartment viewings';
COMMENT ON COLUMN viewings.user_feedback IS 'Free-form feedback from user after viewing';
```

## Agent-Friendly Query Patterns

### Find listings to process for a user
```sql
-- Agent can run this to find work
SELECT l.id, l.address, l.rent, l.bedrooms
FROM listings l
LEFT JOIN user_listing_states uls 
    ON uls.listing_id = l.id AND uls.user_id = $1
WHERE l.is_available = TRUE
    AND uls.id IS NULL -- Not yet processed for this user
    AND l.rent <= (SELECT max_budget FROM users WHERE id = $1)
    AND l.bedrooms >= (SELECT min_bedrooms FROM users WHERE id = $1)
    AND l.bedrooms <= (SELECT max_bedrooms FROM users WHERE id = $1)
LIMIT 20;
```

### Analyze what questions correlate with bad viewings
```sql
-- Overmind uses this for meta-learning
SELECT 
    ct.extracted_data->>'noise_level' as noise_level,
    AVG(ct.overall_score) as avg_score,
    COUNT(*) FILTER (WHERE v.would_apply = FALSE) as rejection_count,
    COUNT(*) as total_viewings
FROM call_transcripts ct
JOIN viewings v ON v.listing_id = ct.listing_id AND v.user_id = ct.user_id
WHERE ct.call_type = 'deepscreen'
    AND v.attended = TRUE
GROUP BY ct.extracted_data->>'noise_level'
HAVING COUNT(*) >= 5;
```

### Get user's viewing history with scores
```sql
-- Agent uses this to learn user preferences
SELECT 
    l.address,
    l.rent,
    l.bedrooms,
    ct.overall_score,
    v.user_rating,
    v.would_apply,
    v.user_feedback
FROM viewings v
JOIN listings l ON l.id = v.listing_id
LEFT JOIN call_transcripts ct ON ct.listing_id = v.listing_id 
    AND ct.user_id = v.user_id 
    AND ct.call_type = 'deepscreen'
WHERE v.user_id = $1
    AND v.attended = TRUE
ORDER BY v.scheduled_at DESC;
```

## Database Forking Strategy

### Use forks for testing new logic
```bash
# Create a fork to test new scoring algorithm
ghost fork production-db --name test-new-scoring

# Agent runs new scoring logic against historical data
ghost sql test-new-scoring < new_scoring_algorithm.sql

# Compare results
ghost sql test-new-scoring "
SELECT 
    'new' as version,
    AVG(new_overall_score) as avg_score,
    COUNT(*) FILTER (WHERE new_overall_score > 80) as high_score_count
FROM call_transcripts_new_scoring
UNION ALL
SELECT 
    'old' as version,
    AVG(overall_score) as avg_score,
    COUNT(*) FILTER (WHERE overall_score > 80) as high_score_count
FROM call_transcripts;
"

# If better, promote the fork
ghost delete production-db
ghost rename test-new-scoring production-db
```

## Agent Autonomy Patterns

### Agent creates its own analytics tables
```sql
-- Agent can create derived tables for faster queries
CREATE TABLE IF NOT EXISTS user_listing_recommendations (
    user_id UUID NOT NULL REFERENCES users(id),
    listing_id UUID NOT NULL REFERENCES listings(id),
    recommendation_score INTEGER NOT NULL,
    reasoning JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, listing_id)
);

COMMENT ON TABLE user_listing_recommendations IS 'Agent-generated recommendations with reasoning';
```

### Agent updates learned preferences
```sql
-- After user rejects a viewing, agent updates learned patterns
UPDATE users
SET learned_preferences = jsonb_set(
    learned_preferences,
    '{rejects_ground_floor}',
    'true'::jsonb
)
WHERE id = $1
    AND (
        SELECT COUNT(*) 
        FROM viewings v
        JOIN listings l ON l.id = v.listing_id
        WHERE v.user_id = $1
            AND v.would_apply = FALSE
            AND l.description ILIKE '%ground floor%'
    ) >= 3; -- Pattern confirmed after 3 rejections
```
