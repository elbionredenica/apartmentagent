# Requirements Document: ApartmentAgent Core

## Introduction

ApartmentAgent is an autonomous AI system that calls apartment listings on behalf of users, qualifies them through voice conversations, and schedules viewings only for properties that meet all user requirements. Built for the Deep Agents Hackathon at RSAC 2026 (8-hour build window), the system demonstrates active qualification through voice calls rather than passive search, with emphasis on handling ambiguity, recovering from unexpected states, and learning from user feedback.

The core innovation is a five-stage pipeline: real-time listing ingestion, agentic workflow orchestration, two-tier voice screening (fast pre-screen and deep qualitative assessment), and secure calendar booking. The system must strictly comply with Fair Housing Act requirements throughout all interactions.

## Glossary

- **ApartmentAgent**: The complete AI system that autonomously qualifies apartment listings
- **User**: A person searching for an apartment who configures their preferences
- **Listing**: An apartment available for rent from external sources (Zillow, Apartments.com)
- **Pre_Screen_Agent**: Bland AI voice agent that performs fast dealbreaker checks (60 second calls)
- **Deep_Screen_Agent**: Bland AI voice agent that performs thorough qualitative assessment (4-6 minute calls)
- **Orchestrator**: LangGraph-based state machine that manages the workflow pipeline
- **Ingestion_System**: Airbyte CDC pipeline that monitors listing sources in real-time
- **Transcript_Analyzer**: AWS Bedrock Claude instance that analyzes call transcripts and extracts structured data
- **Booking_System**: Auth0-secured calendar integration that schedules viewings
- **Ghost_Database**: Postgres database with unlimited forking capability for user profiles and transcripts
- **Checkpointer**: Persistence layer for workflow state (Aerospike or Postgres)
- **Compliance_Monitor**: System component that enforces Fair Housing Act requirements
- **Dealbreaker**: User-specified requirement that automatically disqualifies a listing if not met
- **Viewing**: Scheduled appointment to see an apartment in person
- **Protected_Class**: Categories protected by Fair Housing Act (race, religion, familial status, disability, etc.)

## Requirements

### Requirement 1: User Preference Configuration

**User Story:** As a user, I want to configure my apartment search preferences, so that the agent only calls listings that could potentially meet my needs.

#### Acceptance Criteria

1. THE ApartmentAgent SHALL accept user input for maximum monthly budget as an integer value
2. THE ApartmentAgent SHALL accept user input for minimum and maximum bedroom count
3. WHERE the user has a pet, THE ApartmentAgent SHALL accept pet type (dog, cat, other) and weight in pounds
4. THE ApartmentAgent SHALL accept a list of dealbreakers from the user
5. THE ApartmentAgent SHALL store all user preferences in the Ghost_Database
6. THE ApartmentAgent SHALL validate that maximum budget is greater than zero
7. THE ApartmentAgent SHALL validate that minimum bedrooms is less than or equal to maximum bedrooms

### Requirement 2: Real-Time Listing Ingestion

**User Story:** As a user, I want the system to monitor apartment listings in real-time, so that I don't miss newly available apartments.

#### Acceptance Criteria

1. THE Ingestion_System SHALL connect to external listing sources using Airbyte CDC
2. WHEN a new listing appears on a monitored source, THE Ingestion_System SHALL capture the listing within 60 seconds
3. THE Ingestion_System SHALL extract address, city, rent, bedrooms, bathrooms, phone number, and description from each listing
4. THE Ingestion_System SHALL store each listing in the Ghost_Database with a unique identifier
5. THE Ingestion_System SHALL mark each listing with its source (Zillow, Apartments.com)
6. WHEN a listing is updated on the source, THE Ingestion_System SHALL update the corresponding record in the Ghost_Database
7. THE Ingestion_System SHALL mark listings as unavailable when they are removed from the source

### Requirement 3: Text-Based Pre-Filtering

**User Story:** As a user, I want the system to filter out obviously unsuitable listings before making calls, so that the agent doesn't waste time calling apartments I can't afford or that don't meet basic requirements.

#### Acceptance Criteria

1. WHEN a new listing is ingested, THE Orchestrator SHALL compare the listing rent against the user's maximum budget
2. IF the listing rent exceeds the user's maximum budget, THEN THE Orchestrator SHALL mark the listing as failed with reason "PRICE"
3. THE Orchestrator SHALL compare the listing bedroom count against the user's minimum and maximum bedroom requirements
4. IF the listing bedroom count is outside the user's range, THEN THE Orchestrator SHALL mark the listing as failed with reason "BEDROOMS"
5. WHERE the user has a pet, THE Orchestrator SHALL search the listing description for phrases indicating "no pets" or "pets not allowed"
6. IF the listing description indicates no pets and the user has a pet, THEN THE Orchestrator SHALL mark the listing as failed with reason "PETS"
7. WHEN a listing passes all text-based filters, THE Orchestrator SHALL mark the listing status as "queued_for_prescreen"

### Requirement 4: Pre-Screen Voice Calls

**User Story:** As a user, I want the agent to make quick phone calls to check dealbreakers, so that I only spend time on deeper screening for listings that pass basic requirements.

#### Acceptance Criteria

1. WHEN a listing is marked "queued_for_prescreen", THE Orchestrator SHALL trigger the Pre_Screen_Agent to call the listing phone number
2. THE Pre_Screen_Agent SHALL ask if the unit is still available
3. WHERE the user has a pet, THE Pre_Screen_Agent SHALL ask about the pet policy including weight limits and breed restrictions
4. THE Pre_Screen_Agent SHALL ask if the building is quiet during work hours
5. THE Pre_Screen_Agent SHALL complete the call within 90 seconds
6. IF the landlord indicates the unit is unavailable, THEN THE Pre_Screen_Agent SHALL politely end the call
7. THE Pre_Screen_Agent SHALL send the complete transcript to a webhook endpoint when the call completes
8. THE Pre_Screen_Agent SHALL extract structured data including availability status, pet policy details, and noise level

### Requirement 5: Pre-Screen Transcript Analysis

**User Story:** As a user, I want the system to analyze pre-screen call transcripts and determine if the listing should proceed to deep screening, so that only qualified listings consume more agent time.

#### Acceptance Criteria

1. WHEN the Pre_Screen_Agent webhook fires, THE Transcript_Analyzer SHALL receive the call transcript and extracted data
2. THE Transcript_Analyzer SHALL determine if the listing is still available based on the transcript
3. IF the listing is unavailable, THEN THE Orchestrator SHALL mark the listing as failed with reason "UNAVAILABLE"
4. WHERE the user has a pet, THE Transcript_Analyzer SHALL determine if the pet policy allows the user's specific pet
5. IF the pet policy disqualifies the user's pet, THEN THE Orchestrator SHALL mark the listing as failed with reason "PETS"
6. THE Transcript_Analyzer SHALL store the complete transcript in the Ghost_Database
7. WHEN the listing passes all pre-screen checks, THE Orchestrator SHALL mark the listing status as "queued_for_deepscreen"

### Requirement 6: Deep Screen Voice Calls

**User Story:** As a user, I want the agent to have thorough conversations with landlords about quality and management, so that I only view apartments that are well-managed and worth my time.

#### Acceptance Criteria

1. WHEN a listing is marked "queued_for_deepscreen", THE Orchestrator SHALL trigger the Deep_Screen_Agent to call the listing phone number
2. THE Deep_Screen_Agent SHALL ask how quickly management responds to maintenance requests
3. THE Deep_Screen_Agent SHALL ask if there have been any pest issues in the past year
4. THE Deep_Screen_Agent SHALL ask about wall thickness and noise between units
5. THE Deep_Screen_Agent SHALL ask about recent rent increases
6. THE Deep_Screen_Agent SHALL ask about lease flexibility after the first year
7. THE Deep_Screen_Agent SHALL complete the call within 360 seconds
8. THE Deep_Screen_Agent SHALL adapt follow-up questions based on landlord responses
9. THE Deep_Screen_Agent SHALL send the complete transcript to a webhook endpoint when the call completes
10. THE Deep_Screen_Agent SHALL extract structured data for all questions asked

### Requirement 7: Deep Screen Scoring and Analysis

**User Story:** As a user, I want the system to score apartments based on deep screen calls, so that I can prioritize which viewings to attend.

#### Acceptance Criteria

1. WHEN the Deep_Screen_Agent webhook fires, THE Transcript_Analyzer SHALL receive the call transcript and extracted data
2. THE Transcript_Analyzer SHALL generate a management quality score from 0 to 100 based on maintenance response time
3. THE Transcript_Analyzer SHALL generate a noise score from 0 to 100 based on wall thickness and neighbor noise
4. THE Transcript_Analyzer SHALL generate a value score from 0 to 100 based on rent stability and included amenities
5. THE Transcript_Analyzer SHALL generate a flexibility score from 0 to 100 based on lease terms
6. THE Transcript_Analyzer SHALL calculate an overall score as the weighted average of all component scores
7. THE Transcript_Analyzer SHALL store all scores in the Ghost_Database with the transcript
8. WHEN the overall score is 70 or higher, THE Orchestrator SHALL mark the listing status as "ready_for_booking"
9. IF the overall score is below 70, THEN THE Orchestrator SHALL mark the listing as failed with reason "LOW_SCORE"

### Requirement 8: Viewing Scheduling

**User Story:** As a user, I want the system to automatically schedule viewings for qualified apartments on my calendar, so that I don't have to manually coordinate with landlords.

#### Acceptance Criteria

1. WHEN a listing is marked "ready_for_booking", THE Booking_System SHALL authenticate the user via Auth0
2. THE Booking_System SHALL request OAuth access to the user's calendar (Google Calendar or Outlook)
3. THE Booking_System SHALL find available time slots in the user's calendar
4. THE Booking_System SHALL create a calendar event with the listing address and landlord contact information
5. THE Booking_System SHALL set the event duration to 30 minutes
6. THE Booking_System SHALL store the calendar event ID in the Ghost_Database
7. THE Booking_System SHALL mark the listing status as "booked"
8. THE Booking_System SHALL send a confirmation notification to the user

### Requirement 9: Fair Housing Compliance Enforcement

**User Story:** As a system operator, I want the agent to strictly comply with Fair Housing Act requirements, so that the system never engages in discriminatory practices.

#### Acceptance Criteria

1. THE Pre_Screen_Agent SHALL NOT ask questions about race, national origin, religion, sex, familial status, disability, or age
2. THE Deep_Screen_Agent SHALL NOT ask questions about race, national origin, religion, sex, familial status, disability, or age
3. THE Compliance_Monitor SHALL review all call scripts before execution to ensure no prohibited questions are included
4. WHEN a landlord volunteers discriminatory information during a call, THE Pre_Screen_Agent SHALL immediately end the call politely
5. WHEN a landlord volunteers discriminatory information during a call, THE Deep_Screen_Agent SHALL immediately end the call politely
6. IF discriminatory information is detected in a transcript, THEN THE Compliance_Monitor SHALL flag the listing with compliance_violation set to true
7. IF a listing is flagged for compliance violation, THEN THE Orchestrator SHALL mark the listing as failed with reason "COMPLIANCE_VIOLATION"
8. IF a listing is flagged for compliance violation, THEN THE Booking_System SHALL NOT schedule a viewing
9. THE Compliance_Monitor SHALL store all flagged transcripts for human review

### Requirement 10: Workflow State Persistence and Recovery

**User Story:** As a system operator, I want the workflow to persist its state and recover from crashes, so that listings are not lost or duplicated if the system restarts.

#### Acceptance Criteria

1. THE Orchestrator SHALL save workflow state to the Checkpointer after each node execution
2. THE Orchestrator SHALL assign a unique thread_id to each user-listing combination in the format "{user_id}:{listing_id}"
3. WHEN the system restarts, THE Orchestrator SHALL load all incomplete workflows from the Checkpointer
4. THE Orchestrator SHALL resume each incomplete workflow from its last saved state
5. THE Orchestrator SHALL NOT duplicate calls for listings that have already been called
6. IF a workflow fails three times, THEN THE Orchestrator SHALL mark the listing as failed with reason "MAX_RETRIES"
7. THE Orchestrator SHALL log all state transitions to the Ghost_Database for debugging

### Requirement 11: Concurrent Listing Processing

**User Story:** As a user, I want the system to process multiple listings simultaneously, so that I get results quickly even when many new listings appear.

#### Acceptance Criteria

1. THE Orchestrator SHALL process up to 20 listings concurrently for a single user
2. THE Orchestrator SHALL maintain separate workflow state for each listing using unique thread_ids
3. WHEN multiple listings are queued for pre-screening, THE Orchestrator SHALL trigger calls in parallel
4. WHEN multiple listings are queued for deep screening, THE Orchestrator SHALL trigger calls in parallel
5. THE Orchestrator SHALL handle webhook responses from concurrent calls without race conditions
6. THE Orchestrator SHALL update the Ghost_Database atomically for each listing state change
7. THE Orchestrator SHALL limit total concurrent calls across all users to prevent rate limiting

### Requirement 12: Voicemail and Error Handling

**User Story:** As a user, I want the system to handle voicemail and call failures gracefully, so that listings are not incorrectly marked as unavailable.

#### Acceptance Criteria

1. WHEN the Pre_Screen_Agent reaches voicemail, THE Orchestrator SHALL mark the listing status as "voicemail_pending"
2. WHEN the Deep_Screen_Agent reaches voicemail, THE Orchestrator SHALL mark the listing status as "voicemail_pending"
3. WHEN a listing is marked "voicemail_pending", THE Orchestrator SHALL schedule a retry attempt 4 hours later
4. THE Orchestrator SHALL retry voicemail listings up to 3 times before marking as failed
5. IF a call fails due to wrong number, THEN THE Orchestrator SHALL mark the listing as failed with reason "WRONG_NUMBER"
6. IF a landlord is hostile or hangs up, THEN THE Orchestrator SHALL mark the call outcome as "HOSTILE" and end processing
7. THE Orchestrator SHALL store the failure reason for all failed listings in the Ghost_Database

### Requirement 13: User Feedback Collection

**User Story:** As a user, I want to provide feedback after viewing apartments, so that the agent can learn my preferences over time.

#### Acceptance Criteria

1. WHEN a viewing is marked as completed, THE ApartmentAgent SHALL prompt the user for feedback
2. THE ApartmentAgent SHALL ask if the user attended the viewing
3. WHERE the user attended, THE ApartmentAgent SHALL ask for a rating from 1 to 5 stars
4. WHERE the user attended, THE ApartmentAgent SHALL ask if the user would apply for the apartment
5. THE ApartmentAgent SHALL accept free-form text feedback from the user
6. THE ApartmentAgent SHALL store all feedback in the Ghost_Database linked to the viewing record
7. THE ApartmentAgent SHALL update the user's learned_preferences based on patterns in feedback

### Requirement 14: Transcript Storage and Retrieval

**User Story:** As a user, I want to review call transcripts for any listing, so that I can verify what was discussed before attending a viewing.

#### Acceptance Criteria

1. THE ApartmentAgent SHALL store the complete transcript for every pre-screen call in the Ghost_Database
2. THE ApartmentAgent SHALL store the complete transcript for every deep screen call in the Ghost_Database
3. THE ApartmentAgent SHALL link each transcript to the specific listing and user
4. THE ApartmentAgent SHALL store the call duration in seconds for each transcript
5. THE ApartmentAgent SHALL store the call outcome (PASS, FAIL, VOICEMAIL, WRONG_NUMBER, HOSTILE) for each transcript
6. THE ApartmentAgent SHALL provide an API endpoint to retrieve transcripts by listing_id
7. THE ApartmentAgent SHALL provide an API endpoint to retrieve all transcripts for a user

### Requirement 15: Hackathon Demo Workflow

**User Story:** As a hackathon judge, I want to see a complete end-to-end workflow demonstration, so that I can evaluate the system's capabilities.

#### Acceptance Criteria

1. THE ApartmentAgent SHALL support a demo mode with 2-3 mock listings
2. WHEN demo mode is activated, THE Ingestion_System SHALL load mock listings into the Ghost_Database
3. THE ApartmentAgent SHALL process mock listings through the complete pipeline from ingestion to booking
4. THE ApartmentAgent SHALL display real-time status updates as listings progress through workflow stages
5. THE ApartmentAgent SHALL stream transcript text as calls are simulated
6. THE ApartmentAgent SHALL complete the full demo workflow within 5 minutes
7. THE ApartmentAgent SHALL display final scores and booking confirmations for qualified listings

