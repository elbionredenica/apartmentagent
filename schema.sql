-- ApartmentAgent Database Schema
-- Run this to set up the Ghost database

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Preferences
    max_budget INTEGER NOT NULL,
    min_bedrooms INTEGER NOT NULL,
    max_bedrooms INTEGER NOT NULL,
    has_pet BOOLEAN DEFAULT FALSE,
    pet_type TEXT,
    pet_weight_lbs INTEGER,
    
    -- Dealbreakers (JSON for flexibility)
    dealbreakers JSONB DEFAULT '[]'::jsonb,
    
    -- Nice-to-haves
    preferences JSONB DEFAULT '{}'::jsonb,
    
    -- Learned patterns (updated by agent over time)
    learned_preferences JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE users IS 'Renter profiles with preferences and learned patterns';

-- Listings table
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE NOT NULL,
    source TEXT NOT NULL,
    
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
    raw_data JSONB,
    
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

-- User listing states table
CREATE TABLE user_listing_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- State machine
    status TEXT NOT NULL,
    failure_reason TEXT,
    
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

-- Call transcripts table
CREATE TABLE call_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Call details
    call_type TEXT NOT NULL,
    call_id TEXT,
    phone_number TEXT,
    duration_seconds INTEGER,
    
    -- Content
    transcript TEXT NOT NULL,
    extracted_data JSONB,
    
    -- Outcome
    outcome TEXT NOT NULL,
    failure_reason TEXT,
    
    -- Compliance
    compliance_violation BOOLEAN DEFAULT FALSE,
    compliance_notes TEXT,
    
    -- Timestamps
    called_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Scores (for deepscreen calls)
    management_score INTEGER,
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

-- Viewings table
CREATE TABLE viewings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Viewing details
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    calendar_event_id TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'scheduled',
    
    -- Feedback (collected after viewing)
    attended BOOLEAN,
    user_rating INTEGER,
    user_feedback TEXT,
    would_apply BOOLEAN,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_viewings_user ON viewings(user_id);
CREATE INDEX idx_viewings_scheduled ON viewings(scheduled_at);

COMMENT ON TABLE viewings IS 'Scheduled and completed apartment viewings';
