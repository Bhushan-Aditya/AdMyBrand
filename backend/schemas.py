# schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum as PyEnum


# --- Enums ---
class GenderEnum(str, PyEnum):
    male = "male"
    female = "female"
    non_binary = "non-binary"
    other = "other"


class PlanTypeEnum(str, PyEnum):
    basic = "basic"
    premium = "premium"
    platinum = "platinum"


class SubscriptionStatusEnum(str, PyEnum):
    active = "active"
    expired = "expired"
    cancelled = "cancelled"


# Added Report Status Enum
class ReportStatusEnum(str, PyEnum):
    pending = "pending"
    reviewed = "reviewed"
    action_taken = "action_taken"
    dismissed = "dismissed"


# --- Interest Schemas ---
class InterestBase(BaseModel):
    name: str
    category: Optional[str] = None


class InterestCreate(InterestBase): pass


class InterestOut(InterestBase):
    id: int = Field(..., alias="interest_id")
    model_config = {"from_attributes": True, "populate_by_name": True}


# --- Profile Photo Schemas ---
class ProfilePhotoBase(BaseModel):
    photo_url: str
    is_primary: bool = False


class ProfilePhotoCreate(ProfilePhotoBase): pass


class ProfilePhotoOut(ProfilePhotoBase):
    photo_id: int
    uploaded_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


# --- User Interest Update ---
class UserInterestsUpdate(BaseModel):
    interests: List[str] = Field(default_factory=list)


# --- User Schemas ---
class UserSignUp(BaseModel):
    email: EmailStr
    password: str


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[GenderEnum] = None
    dob: Optional[date] = None
    location: Optional[str] = None
    bio: Optional[str] = None


class UserOut(BaseModel):  # Base User Output
    id: int = Field(..., alias="user_id")
    email: EmailStr
    name: Optional[str] = None
    gender: Optional[str] = None
    dob: Optional[date] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    interests: List[InterestOut] = Field(default_factory=list)
    photos: List[ProfilePhotoOut] = Field(default_factory=list)
    model_config = {"from_attributes": True, "populate_by_name": True}


# --- Preference Schemas ---
class PreferenceBase(BaseModel):
    preferred_gender: Optional[str] = Field(None)
    age_min: Optional[int] = Field(None, ge=18)
    age_max: Optional[int] = Field(None, ge=18)
    location_radius_km: Optional[int] = Field(None, gt=0)


class PreferenceCreate(PreferenceBase): pass


class PreferenceUpdate(PreferenceBase): pass


class PreferenceOut(PreferenceBase):
    preference_id: int
    user_id: int
    model_config = {"from_attributes": True}


# --- Subscription Schemas ---
class SubscriptionBase(BaseModel):
    plan_type: PlanTypeEnum
    start_date: date
    end_date: date
    status: SubscriptionStatusEnum


class SubscriptionUpdate(BaseModel):
    plan: PlanTypeEnum


class SubscriptionOut(SubscriptionBase):
    subscription_id: int
    user_id: int
    model_config = {"from_attributes": True}


# --- Like Schemas ---
class LikeCreate(BaseModel):
    liked_user_id: int


class LikeOut(BaseModel):
    liker_id: int
    liked_id: int
    liked_at: datetime
    model_config = {"from_attributes": True}


class LikeResponse(BaseModel):
    match_status: str = Field(..., examples=["liked", "matched"])
    matched_user: Optional[UserOut] = None


# --- Match Schemas ---
class MatchBase(BaseModel):
    user_1_id: int
    user_2_id: int
    matched_at: datetime


class MatchOut(MatchBase):
    match_id: int
    # Optionally include simplified user info in match output
    # user1: Optional[UserOut] = None
    # user2: Optional[UserOut] = None
    model_config = {"from_attributes": True}


# --- Report Schemas (NEW) ---
class ReportBase(BaseModel):
    reported_user_id: int
    # Reason field with validation
    reason: str = Field(..., min_length=10, max_length=1000,
                        description="Detailed reason for the report (10-1000 characters)")


class ReportCreate(ReportBase):
    # This is the schema for the request body when CREATING a report
    pass  # reporter_id comes from context/auth


class ReportOut(ReportBase):
    # Schema for returning report details (e.g., to an admin)
    report_id: int
    # Reporter might have deleted account, hence Optional
    reporter_id: Optional[int] = None
    created_at: datetime
    status: ReportStatusEnum  # Use the status enum
    moderator_notes: Optional[str] = None
    updated_at: Optional[datetime] = None

    # Include nested UserOut for reporter/reported if useful for display
    # reporter: Optional[UserOut] = None # requires population in query
    # reported_user: Optional[UserOut] = None # requires population in query

    model_config = {"from_attributes": True}


class ReportStatusUpdate(BaseModel):
    # Schema for Admin endpoint to update a report's status/notes
    status: ReportStatusEnum
    moderator_notes: Optional[str] = Field(None, max_length=500)


# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int


class TokenData(BaseModel):
    user_id: Optional[int] = None