from abc import ABC, abstractmethod
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


# ============================================================================
# Domain Models (Pydantic)
# ============================================================================

class User(BaseModel):
    id: UUID
    email: str
    password_hash: str
    full_name: str
    role_id: int
    role_name: str
    phone: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)


class Session(BaseModel):
    session_id: str
    user_id: UUID
    session_data: Dict[str, Any] = Field(default_factory=dict)
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)


class DeviceCategory(BaseModel):
    category_id: UUID
    code: str
    name: str
    description: Optional[str] = None
    handling_priority: str = "standard"
    base_points: int = 50
    points_per_kg: float = 10.00
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)


class Material(BaseModel):
    material_id: UUID
    code: str
    name: str
    unit: str = "kg"
    default_impact_factor: float = 1.0000
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)


class CategoryMaterial(BaseModel):
    category_id: UUID
    material_id: UUID
    name: str
    code: str
    unit: str = "kg"
    estimated_percentage: float
    default_impact_factor: float = 1.0000

    model_config = ConfigDict(from_attributes=True)


class RecyclingCenter(BaseModel):
    center_id: UUID
    name: str
    address: str
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    latitude: float
    longitude: float
    operational_hours: Dict[str, Any] = Field(default_factory=lambda: {"monday_to_saturday": "09:00 - 18:00"})
    current_verification_status: str = "pending"
    created_by: Optional[UUID] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    accepted_categories: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class CenterSearchResult(BaseModel):
    center_id: UUID
    name: str
    address: str
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    latitude: float
    longitude: float
    operational_hours: Dict[str, Any] = Field(default_factory=dict)
    distance_meters: float
    distance_km: float
    verification_status: str
    accepted_categories: List[str] = Field(default_factory=list)


class CenterVerification(BaseModel):
    verification_id: UUID
    center_id: UUID
    status: str
    reviewer_id: Optional[UUID] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    rejection_reason: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)


class CenterStatusHistory(BaseModel):
    history_id: UUID
    center_id: UUID
    old_status: Optional[str] = None
    new_status: str
    changed_by: Optional[UUID] = None
    reason: Optional[str] = None
    changed_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)


class RecyclingRecord(BaseModel):
    record_id: UUID
    user_id: UUID
    center_id: UUID
    category_id: UUID
    weight_kg: float
    estimated_units: int = 1
    status: str = "pending"
    notes: Optional[str] = None
    mongo_photo_id: Optional[UUID] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    category_name: Optional[str] = None
    category_code: Optional[str] = None
    center_name: Optional[str] = None
    receipt_reference: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RecordStatusHistory(BaseModel):
    history_id: UUID
    record_id: UUID
    old_status: Optional[str] = None
    new_status: str
    changed_by: Optional[UUID] = None
    reason: Optional[str] = None
    changed_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)


class Receipt(BaseModel):
    receipt_id: UUID
    record_id: UUID
    receipt_reference: str
    issued_by_center_id: UUID
    issuance_date: date
    verification_code: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    center_name: Optional[str] = None
    center_address: Optional[str] = None
    weight_kg: Optional[float] = None
    user_id: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)


class PointsLedgerEntry(BaseModel):
    ledger_id: UUID
    user_id: UUID
    record_id: Optional[UUID] = None
    transaction_type: str
    points: int
    idempotency_key: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)


class Reward(BaseModel):
    reward_id: UUID
    title: str
    description: Optional[str] = None
    points_cost: int
    stock_quantity: int
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)


class Redemption(BaseModel):
    redemption_id: UUID
    user_id: UUID
    reward_id: UUID
    points_spent: int
    status: str = "completed"
    idempotency_key: str
    redeemed_at: datetime = Field(default_factory=datetime.utcnow)
    reward_title: Optional[str] = None
    reward_description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class Badge(BaseModel):
    badge_id: UUID
    code: str
    name: str
    description: Optional[str] = None
    icon_name: str = "military_tech"
    required_records: int = 0
    required_points: int = 0

    model_config = ConfigDict(from_attributes=True)


class UserBadge(BaseModel):
    user_id: UUID
    badge_id: UUID
    code: str
    name: str
    description: Optional[str] = None
    icon_name: str
    awarded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeaderboardEntry(BaseModel):
    user_id: UUID
    full_name: str
    total_points: int
    total_kg: float
    total_records: int
    rank: int


# MongoDB Models
class DevicePhotoMeta(BaseModel):
    photo_id: UUID
    record_id: Optional[UUID] = None
    original_filename: str
    storage_path: str
    mime_type: str
    file_size_bytes: int
    uploaded_by: UUID
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class AIAnalysisReport(BaseModel):
    report_id: UUID
    photo_id: UUID
    record_id: Optional[UUID] = None
    model_name: str = "MobileNetV3-Small"
    predicted_category_code: str
    confidence_score: float
    is_low_confidence: bool
    top_k: List[Dict[str, Any]]
    user_confirmed_code: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CenterDocMeta(BaseModel):
    doc_id: UUID
    center_id: UUID
    doc_type: str
    file_path: str
    verified: bool = False
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class ActivityEvent(BaseModel):
    event_id: UUID
    user_id: Optional[UUID] = None
    event_type: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Abstract Repository Interfaces (The Seam)
# ============================================================================

class UsersRepoBase(ABC):
    @abstractmethod
    async def get_by_id(self, user_id: UUID) -> Optional[User]: ...
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]: ...
    @abstractmethod
    async def create_user(self, email: str, password_hash: str, full_name: str, role_id: int, phone: Optional[str] = None) -> User: ...
    @abstractmethod
    async def update_user(self, user_id: UUID, full_name: Optional[str] = None, phone: Optional[str] = None) -> Optional[User]: ...


class SessionsRepoBase(ABC):
    @abstractmethod
    async def create_session(self, session_id: str, user_id: UUID, session_data: Dict[str, Any], expires_at: datetime) -> Session: ...
    @abstractmethod
    async def get_session(self, session_id: str) -> Optional[Session]: ...
    @abstractmethod
    async def delete_session(self, session_id: str) -> bool: ...
    @abstractmethod
    async def delete_user_sessions(self, user_id: UUID) -> int: ...
    @abstractmethod
    async def cleanup_expired(self) -> int: ...


class CatalogRepoBase(ABC):
    @abstractmethod
    async def list_categories(self, active_only: bool = True) -> List[DeviceCategory]: ...
    @abstractmethod
    async def get_category_by_id(self, category_id: UUID) -> Optional[DeviceCategory]: ...
    @abstractmethod
    async def get_category_by_code(self, code: str) -> Optional[DeviceCategory]: ...
    @abstractmethod
    async def create_category(self, code: str, name: str, description: Optional[str], handling_priority: str, base_points: int, points_per_kg: float) -> DeviceCategory: ...
    @abstractmethod
    async def get_category_materials(self, category_id: UUID) -> List[CategoryMaterial]: ...


class CentersRepoBase(ABC):
    @abstractmethod
    async def search_nearby(self, lat: float, lng: float, radius_km: float = 25.0, category_id: Optional[UUID] = None, verified_only: bool = True) -> List[CenterSearchResult]: ...
    @abstractmethod
    async def get_by_id(self, center_id: UUID) -> Optional[RecyclingCenter]: ...
    @abstractmethod
    async def create_center(self, name: str, address: str, contact_phone: Optional[str], contact_email: Optional[str], latitude: float, longitude: float, operational_hours: Dict[str, Any], current_verification_status: str, created_by: Optional[UUID], accepted_categories: List[UUID]) -> RecyclingCenter: ...
    @abstractmethod
    async def update_center(self, center_id: UUID, name: Optional[str] = None, address: Optional[str] = None, contact_phone: Optional[str] = None, contact_email: Optional[str] = None, operational_hours: Optional[Dict[str, Any]] = None, current_verification_status: Optional[str] = None) -> Optional[RecyclingCenter]: ...
    @abstractmethod
    async def list_all_centers(self) -> List[RecyclingCenter]: ...


class VerificationRepoBase(ABC):
    @abstractmethod
    async def create_verification(self, center_id: UUID, status: str, reviewer_id: Optional[UUID], valid_from: Optional[date], valid_until: Optional[date], rejection_reason: Optional[str]) -> CenterVerification: ...
    @abstractmethod
    async def get_verifications_for_center(self, center_id: UUID) -> List[CenterVerification]: ...
    @abstractmethod
    async def get_status_history(self, center_id: UUID) -> List[CenterStatusHistory]: ...


class RecordsRepoBase(ABC):
    @abstractmethod
    async def create_record(self, user_id: UUID, center_id: UUID, category_id: UUID, weight_kg: float, estimated_units: int, notes: Optional[str], mongo_photo_id: Optional[UUID] = None, receipt_reference: Optional[str] = None) -> RecyclingRecord: ...
    @abstractmethod
    async def get_by_id(self, record_id: UUID) -> Optional[RecyclingRecord]: ...
    @abstractmethod
    async def list_by_user(self, user_id: UUID) -> List[RecyclingRecord]: ...
    @abstractmethod
    async def list_pending_queue(self) -> List[RecyclingRecord]: ...
    @abstractmethod
    async def approve_and_award(self, record_id: UUID, reviewer_id: UUID, receipt_reference: Optional[str] = None, verification_code: Optional[str] = None) -> Dict[str, Any]: ...
    @abstractmethod
    async def reject_record(self, record_id: UUID, reviewer_id: UUID, reason: str) -> RecyclingRecord: ...
    @abstractmethod
    async def get_receipt_by_record_id(self, record_id: UUID) -> Optional[Receipt]: ...
    @abstractmethod
    async def get_receipt_by_reference(self, reference: str) -> Optional[Receipt]: ...
    @abstractmethod
    async def get_record_status_history(self, record_id: UUID) -> List[RecordStatusHistory]: ...


class PointsRepoBase(ABC):
    @abstractmethod
    async def get_user_balance(self, user_id: UUID) -> int: ...
    @abstractmethod
    async def get_user_ledger(self, user_id: UUID) -> List[PointsLedgerEntry]: ...
    @abstractmethod
    async def get_leaderboard(self, limit: int = 10) -> List[LeaderboardEntry]: ...
    @abstractmethod
    async def get_user_badges(self, user_id: UUID) -> List[UserBadge]: ...
    @abstractmethod
    async def list_all_badges(self) -> List[Badge]: ...
    @abstractmethod
    async def evaluate_and_award_badges(self, user_id: UUID) -> List[UserBadge]: ...


class RewardsRepoBase(ABC):
    @abstractmethod
    async def list_active_rewards(self) -> List[Reward]: ...
    @abstractmethod
    async def get_by_id(self, reward_id: UUID) -> Optional[Reward]: ...
    @abstractmethod
    async def create_reward(self, title: str, description: Optional[str], points_cost: int, stock_quantity: int, is_active: bool = True) -> Reward: ...
    @abstractmethod
    async def update_reward(self, reward_id: UUID, title: Optional[str] = None, description: Optional[str] = None, points_cost: Optional[int] = None, stock_quantity: Optional[int] = None, is_active: Optional[bool] = None) -> Optional[Reward]: ...
    @abstractmethod
    async def redeem_reward(self, user_id: UUID, reward_id: UUID, idempotency_key: str) -> Dict[str, Any]: ...
    @abstractmethod
    async def list_user_redemptions(self, user_id: UUID) -> List[Redemption]: ...


class AnalyticsRepoBase(ABC):
    @abstractmethod
    async def get_user_metrics(self, user_id: UUID) -> Dict[str, Any]: ...
    @abstractmethod
    async def get_community_metrics(self) -> Dict[str, Any]: ...
    @abstractmethod
    async def get_category_metrics(self) -> List[Dict[str, Any]]: ...


class DevicePhotoRepoBase(ABC):
    @abstractmethod
    async def save_photo_metadata(self, photo_meta: DevicePhotoMeta) -> DevicePhotoMeta: ...
    @abstractmethod
    async def get_photo_metadata(self, photo_id: UUID) -> Optional[DevicePhotoMeta]: ...


class AIAnalysisRepoBase(ABC):
    @abstractmethod
    async def save_analysis_report(self, report: AIAnalysisReport) -> AIAnalysisReport: ...
    @abstractmethod
    async def get_report_by_photo(self, photo_id: UUID) -> Optional[AIAnalysisReport]: ...


class CenterDocsRepoBase(ABC):
    @abstractmethod
    async def save_center_doc(self, doc: CenterDocMeta) -> CenterDocMeta: ...
    @abstractmethod
    async def list_docs_for_center(self, center_id: UUID) -> List[CenterDocMeta]: ...


class ActivityEventsRepoBase(ABC):
    @abstractmethod
    async def record_event(self, event: ActivityEvent) -> ActivityEvent: ...
    @abstractmethod
    async def list_recent_events(self, limit: int = 50) -> List[ActivityEvent]: ...
