from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class ListingStatus(str, Enum):
    DISCOVERED = "discovered"
    CRITERIA_CHECKED = "criteria_checked"
    QUEUED_FOR_PRESCREEN = "queued_for_prescreen"
    PRESCREENING = "prescreening"
    PRESCREENED = "prescreened"
    QUEUED_FOR_DEEPSCREEN = "queued_for_deepscreen"
    DEEPSCREENING = "deepscreening"
    DEEPSCREENED = "deepscreened"
    READY_FOR_BOOKING = "ready_for_booking"
    BOOKED = "booked"
    FAILED = "failed"
    VOICEMAIL_PENDING = "voicemail_pending"

class CallOutcome(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    VOICEMAIL = "VOICEMAIL"
    WRONG_NUMBER = "WRONG_NUMBER"
    HOSTILE = "HOSTILE"

class ListingState(BaseModel):
    """State for LangGraph workflow"""
    listing_id: str
    user_id: str
    status: ListingStatus
    failure_reason: Optional[str] = None
    prescreen_call_id: Optional[str] = None
    prescreen_transcript: Optional[str] = None
    deepscreen_call_id: Optional[str] = None
    deepscreen_transcript: Optional[str] = None
    scores: Optional[Dict[str, int]] = None
    retry_count: int = 0
    next_action: Optional[str] = None

class User(BaseModel):
    id: str
    email: str
    max_budget: int
    min_bedrooms: int
    max_bedrooms: int
    has_pet: bool
    pet_type: Optional[str] = None
    pet_weight_lbs: Optional[int] = None
    dealbreakers: List[str] = []
    preferences: Dict[str, Any] = {}

class Listing(BaseModel):
    id: str
    external_id: str
    source: str
    address: str
    city: str
    state: str
    rent: int
    bedrooms: int
    bathrooms: float
    phone: Optional[str] = None
    description: Optional[str] = None
    is_available: bool = True

class CallTranscript(BaseModel):
    id: str
    user_id: str
    listing_id: str
    call_type: str  # 'prescreen' or 'deepscreen'
    call_id: Optional[str] = None
    transcript: str
    extracted_data: Optional[Dict[str, Any]] = None
    outcome: CallOutcome
    failure_reason: Optional[str] = None
    overall_score: Optional[int] = None
    called_at: datetime
