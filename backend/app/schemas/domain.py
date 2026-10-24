from datetime import date, datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


# Catalog Schemas
class CategoryResponse(BaseModel):
    category_id: UUID
    code: str
    name: str
    description: Optional[str] = None
    handling_priority: str
    base_points: int
    points_per_kg: float
    is_active: bool


class CategoryCreateRequest(BaseModel):
    code: str = Field(min_length=2, max_length=50)
    name: str = Field(min_length=2, max_length=100)
    description: Optional[str] = None
    handling_priority: str = Field(default="standard")
    base_points: int = Field(default=50, ge=0)
    points_per_kg: float = Field(default=10.0, ge=0.0)


class CategoryDetailResponse(CategoryResponse):
    materials: List[Dict[str, Any]] = Field(default_factory=list)
    safety_guidance: Dict[str, Any] = Field(default_factory=dict)


# Center Schemas
class CenterCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    address: str = Field(min_length=5)
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    latitude: float = Field(ge=-90.0, le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)
    operational_hours: Dict[str, Any] = Field(default_factory=lambda: {"monday_to_saturday": "09:00 - 18:00"})
    accepted_categories: List[UUID] = Field(default_factory=list)


class CenterUpdateRequest(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    operational_hours: Optional[Dict[str, Any]] = None


class CenterVerificationRequest(BaseModel):
    status: str = Field(pattern="^(verified|rejected|expired)$")
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    rejection_reason: Optional[str] = None


class CenterResponse(BaseModel):
    center_id: UUID
    name: str
    address: str
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    latitude: float
    longitude: float
    operational_hours: Dict[str, Any]
    current_verification_status: str
    accepted_categories: List[str]


# Record Schemas
class RecordCreateRequest(BaseModel):
    center_id: UUID
    category_id: UUID
    weight_kg: float = Field(gt=0, description="Measured weight in kg must be positive")
    estimated_units: int = Field(default=1, gt=0)
    receipt_number: Optional[str] = None
    notes: Optional[str] = None
    photo_id: Optional[UUID] = None


class RecordResponse(BaseModel):
    record_id: UUID
    user_id: UUID
    center_id: UUID
    category_id: UUID
    weight_kg: float
    estimated_units: int
    status: str
    notes: Optional[str] = None
    receipt_reference: Optional[str] = None
    created_at: datetime
    category_name: Optional[str] = None
    category_code: Optional[str] = None
    center_name: Optional[str] = None


class RecordReviewRequest(BaseModel):
    decision: str = Field(pattern="^(approved|rejected)$")
    rejection_reason: Optional[str] = None
    receipt_reference: Optional[str] = None
    verification_code: Optional[str] = None


class ReceiptResponse(BaseModel):
    receipt_id: UUID
    record_id: UUID
    receipt_reference: str
    center_name: Optional[str] = None
    center_address: Optional[str] = None
    weight_kg: Optional[float] = None
    issuance_date: date
    verification_code: str
    created_at: datetime


# Reward Schemas
class RewardResponse(BaseModel):
    reward_id: UUID
    title: str
    description: Optional[str] = None
    points_cost: int
    stock_quantity: int
    is_active: bool


class RewardCreateRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: Optional[str] = None
    points_cost: int = Field(gt=0)
    stock_quantity: int = Field(ge=0)
    is_active: bool = True


class RewardRedeemRequest(BaseModel):
    reward_id: UUID
    idempotency_key: str = Field(min_length=5, max_length=100)


class RedemptionResponse(BaseModel):
    redemption_id: UUID
    reward_title: str
    points_spent: int
    remaining_balance: int
    status: str
    idempotent_replay: bool
    message: str


# Analytics Schemas
class AnalyticsSummaryResponse(BaseModel):
    measured: Dict[str, Any]
    points: Optional[Dict[str, Any]] = None
    estimates: Dict[str, Any]
    text_summary: Optional[str] = None


# AI Schemas
class AICandidatePrediction(BaseModel):
    category_code: str
    confidence: float


class AIClassifyResponse(BaseModel):
    photo_id: UUID
    predicted_category_code: str
    confidence: float
    is_low_confidence: bool
    top_predictions: List[AICandidatePrediction]
    storage_url: str
    disclaimer: str = "Predictions are suggestions, not certified safety assessments. Verify the category prior to submission."
