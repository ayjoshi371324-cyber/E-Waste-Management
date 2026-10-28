import math
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from app.repositories.base import (
    ActivityEvent,
    ActivityEventsRepoBase,
    AIAnalysisReport,
    AIAnalysisRepoBase,
    AnalyticsRepoBase,
    Badge,
    CatalogRepoBase,
    CategoryMaterial,
    CenterDocMeta,
    CenterDocsRepoBase,
    CenterSearchResult,
    CenterStatusHistory,
    CenterVerification,
    CentersRepoBase,
    DeviceCategory,
    DevicePhotoMeta,
    DevicePhotoRepoBase,
    LeaderboardEntry,
    Material,
    PointsLedgerEntry,
    PointsRepoBase,
    Receipt,
    RecyclingCenter,
    RecyclingRecord,
    RecordStatusHistory,
    RecordsRepoBase,
    Redemption,
    Reward,
    RewardsRepoBase,
    Session,
    SessionsRepoBase,
    User,
    UserBadge,
    UsersRepoBase,
)


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


class MockDataStore:
    """In-memory data store seeded exactly according to db/sql/008_seed.sql."""

    def __init__(self):
        self.reset()

    def reset(self):
        # Roles
        self.roles = {
            1: "admin",
            2: "user",
            3: "center_representative",
        }

        # Users
        pw_hash = "$2b$12$25C/PEMYHGEvEjo3khCHHOfqeSeK.oI73a1m.ubYPKc6TXUxvkWDu"  # AdminPass123!
        self.users: Dict[UUID, User] = {
            UUID("00000000-0000-0000-0000-000000000001"): User(
                id=UUID("00000000-0000-0000-0000-000000000001"),
                email="admin@ewaste.org",
                password_hash=pw_hash,
                full_name="System Administrator",
                role_id=1,
                role_name="admin",
                phone="+1-555-0100",
                is_active=True,
            ),
            UUID("00000000-0000-0000-0000-000000000002"): User(
                id=UUID("00000000-0000-0000-0000-000000000002"),
                email="citizen.jane@example.com",
                password_hash=pw_hash,
                full_name="Jane Citizen",
                role_id=2,
                role_name="user",
                phone="+1-555-0200",
                is_active=True,
            ),
            UUID("00000000-0000-0000-0000-000000000003"): User(
                id=UUID("00000000-0000-0000-0000-000000000003"),
                email="center.rep@ecocenter.org",
                password_hash=pw_hash,
                full_name="Robert Representative",
                role_id=3,
                role_name="center_representative",
                phone="+1-555-0300",
                is_active=True,
            ),
        }

        # Sessions
        self.sessions: Dict[str, Session] = {}

        # Categories
        self.categories: Dict[UUID, DeviceCategory] = {
            UUID("11111111-1111-1111-1111-111111110001"): DeviceCategory(
                category_id=UUID("11111111-1111-1111-1111-111111110001"),
                code="SMARTPHONE",
                name="Smartphones & Mobile Devices",
                description="Smartphones, cell phones, and personal handheld digital assistants",
                handling_priority="secure_data_wipe",
                base_points=50,
                points_per_kg=20.00,
                is_active=True,
            ),
            UUID("11111111-1111-1111-1111-111111110002"): DeviceCategory(
                category_id=UUID("11111111-1111-1111-1111-111111110002"),
                code="LAPTOP",
                name="Laptops & Notebooks",
                description="Portable computers, notebooks, and ultrabooks",
                handling_priority="secure_data_wipe",
                base_points=100,
                points_per_kg=25.00,
                is_active=True,
            ),
            UUID("11111111-1111-1111-1111-111111110003"): DeviceCategory(
                category_id=UUID("11111111-1111-1111-1111-111111110003"),
                code="TABLET",
                name="Tablets & E-Readers",
                description="Slates, touchpads, and electronic book readers",
                handling_priority="secure_data_wipe",
                base_points=60,
                points_per_kg=20.00,
                is_active=True,
            ),
            UUID("11111111-1111-1111-1111-111111110004"): DeviceCategory(
                category_id=UUID("11111111-1111-1111-1111-111111110004"),
                code="BATTERY",
                name="Lithium-Ion & Secondary Batteries",
                description="Rechargeable consumer batteries from electronics",
                handling_priority="hazardous",
                base_points=30,
                points_per_kg=40.00,
                is_active=True,
            ),
            UUID("11111111-1111-1111-1111-111111110005"): DeviceCategory(
                category_id=UUID("11111111-1111-1111-1111-111111110005"),
                code="PCB",
                name="Printed Circuit Boards & Motherboards",
                description="Circuit boards containing precious metals",
                handling_priority="hazardous",
                base_points=40,
                points_per_kg=50.00,
                is_active=True,
            ),
            UUID("11111111-1111-1111-1111-111111110006"): DeviceCategory(
                category_id=UUID("11111111-1111-1111-1111-111111110006"),
                code="SMALL_APPLIANCE",
                name="Small Household Electronics",
                description="Toasters, blenders, kettles, power tools",
                handling_priority="standard",
                base_points=20,
                points_per_kg=10.00,
                is_active=True,
            ),
            UUID("11111111-1111-1111-1111-111111110007"): DeviceCategory(
                category_id=UUID("11111111-1111-1111-1111-111111110007"),
                code="MONITOR",
                name="Monitors & Displays",
                description="Computer monitors, LCD/LED screens, televisions",
                handling_priority="hazardous",
                base_points=70,
                points_per_kg=15.00,
                is_active=True,
            ),
            UUID("11111111-1111-1111-1111-111111110008"): DeviceCategory(
                category_id=UUID("11111111-1111-1111-1111-111111110008"),
                code="KEYBOARD_PERIPHERAL",
                name="Keyboards & Peripherals",
                description="Keyboards, computer mice, controllers, and input accessories",
                handling_priority="standard",
                base_points=25,
                points_per_kg=12.00,
                is_active=True,
            ),
            UUID("11111111-1111-1111-1111-111111110009"): DeviceCategory(
                category_id=UUID("11111111-1111-1111-1111-111111110009"),
                code="CHARGER_CABLE",
                name="Chargers, Adapters & Cables",
                description="Power adapters, charging cords, USB cables, connectors",
                handling_priority="standard",
                base_points=15,
                points_per_kg=10.00,
                is_active=True,
            ),
        }

        # Materials
        self.materials: Dict[UUID, Material] = {
            UUID("22222222-2222-2222-2222-222222220001"): Material(
                material_id=UUID("22222222-2222-2222-2222-222222220001"),
                code="COPPER",
                name="Refined Copper",
                unit="kg",
                default_impact_factor=1.8500,
            ),
            UUID("22222222-2222-2222-2222-222222220002"): Material(
                material_id=UUID("22222222-2222-2222-2222-222222220002"),
                code="ALUMINUM",
                name="Recycled Aluminum",
                unit="kg",
                default_impact_factor=1.2000,
            ),
            UUID("22222222-2222-2222-2222-222222220003"): Material(
                material_id=UUID("22222222-2222-2222-2222-222222220003"),
                code="GOLD",
                name="Recovered Gold",
                unit="g",
                default_impact_factor=15.0000,
            ),
            UUID("22222222-2222-2222-2222-222222220004"): Material(
                material_id=UUID("22222222-2222-2222-2222-222222220004"),
                code="LITHIUM",
                name="Battery Lithium",
                unit="kg",
                default_impact_factor=3.5000,
            ),
            UUID("22222222-2222-2222-2222-222222220005"): Material(
                material_id=UUID("22222222-2222-2222-2222-222222220005"),
                code="PLASTIC",
                name="Engineering Polymers",
                unit="kg",
                default_impact_factor=0.8000,
            ),
        }

        # Category Materials
        self.category_materials: Dict[UUID, List[CategoryMaterial]] = {
            UUID("11111111-1111-1111-1111-111111110001"): [
                CategoryMaterial(category_id=UUID("11111111-1111-1111-1111-111111110001"), material_id=UUID("22222222-2222-2222-2222-222222220001"), name="Refined Copper", code="COPPER", estimated_percentage=20.0, default_impact_factor=1.85),
                CategoryMaterial(category_id=UUID("11111111-1111-1111-1111-111111110001"), material_id=UUID("22222222-2222-2222-2222-222222220004"), name="Battery Lithium", code="LITHIUM", estimated_percentage=15.0, default_impact_factor=3.50),
                CategoryMaterial(category_id=UUID("11111111-1111-1111-1111-111111110001"), material_id=UUID("22222222-2222-2222-2222-222222220005"), name="Engineering Polymers", code="PLASTIC", estimated_percentage=40.0, default_impact_factor=0.80),
            ],
            UUID("11111111-1111-1111-1111-111111110002"): [
                CategoryMaterial(category_id=UUID("11111111-1111-1111-1111-111111110002"), material_id=UUID("22222222-2222-2222-2222-222222220002"), name="Recycled Aluminum", code="ALUMINUM", estimated_percentage=35.0, default_impact_factor=1.20),
                CategoryMaterial(category_id=UUID("11111111-1111-1111-1111-111111110002"), material_id=UUID("22222222-2222-2222-2222-222222220001"), name="Refined Copper", code="COPPER", estimated_percentage=15.0, default_impact_factor=1.85),
                CategoryMaterial(category_id=UUID("11111111-1111-1111-1111-111111110002"), material_id=UUID("22222222-2222-2222-2222-222222220004"), name="Battery Lithium", code="LITHIUM", estimated_percentage=10.0, default_impact_factor=3.50),
                CategoryMaterial(category_id=UUID("11111111-1111-1111-1111-111111110002"), material_id=UUID("22222222-2222-2222-2222-222222220005"), name="Engineering Polymers", code="PLASTIC", estimated_percentage=25.0, default_impact_factor=0.80),
            ],
        }

        # Recycling Centers (SRID 4326 Point: Indiranagar, Koramangala, Hebbal, Marathahalli)
        self.centers: Dict[UUID, RecyclingCenter] = {
            UUID("33333333-3333-3333-3333-333333330001"): RecyclingCenter(
                center_id=UUID("33333333-3333-3333-3333-333333330001"),
                name="EcoTech Central Recycling Hub",
                address="100 Feet Road, Indiranagar, Bengaluru, KA 560038",
                contact_phone="+91-80-25251100",
                contact_email="contact@ecotechbangalore.org",
                latitude=12.9784,
                longitude=77.6413,
                current_verification_status="verified",
                created_by=UUID("00000000-0000-0000-0000-000000000001"),
                accepted_categories=["SMARTPHONE", "LAPTOP", "TABLET", "BATTERY", "PCB"],
            ),
            UUID("33333333-3333-3333-3333-333333330002"): RecyclingCenter(
                center_id=UUID("33333333-3333-3333-3333-333333330002"),
                name="GreenBytes E-Waste Depot Koramangala",
                address="80 Feet Peripheral Road, 4th Block, Koramangala, Bengaluru, KA 560034",
                contact_phone="+91-80-25532200",
                contact_email="support@greenbytes.org",
                latitude=12.9352,
                longitude=77.6245,
                current_verification_status="verified",
                created_by=UUID("00000000-0000-0000-0000-000000000001"),
                accepted_categories=["SMARTPHONE", "LAPTOP", "TABLET"],
            ),
            UUID("33333333-3333-3333-3333-333333330003"): RecyclingCenter(
                center_id=UUID("33333333-3333-3333-3333-333333330003"),
                name="North City Battery & Electronics Drop-off",
                address="Bellary Road, Hebbal, Bengaluru, KA 560024",
                contact_phone="+91-80-23633300",
                contact_email="info@northcityewaste.com",
                latitude=13.0358,
                longitude=77.5921,
                current_verification_status="verified",
                created_by=UUID("00000000-0000-0000-0000-000000000001"),
                accepted_categories=["BATTERY", "SMALL_APPLIANCE"],
            ),
            UUID("33333333-3333-3333-3333-333333330004"): RecyclingCenter(
                center_id=UUID("33333333-3333-3333-3333-333333330004"),
                name="Pending Electronic Salvage Co.",
                address="Outer Ring Road, Marathahalli, Bengaluru, KA 560037",
                contact_phone="+91-80-28474400",
                contact_email="admin@pendingsalvage.in",
                latitude=12.9569,
                longitude=77.7011,
                current_verification_status="pending",
                created_by=UUID("00000000-0000-0000-0000-000000000003"),
                accepted_categories=["SMARTPHONE", "LAPTOP"],
            ),
        }

        # Verifications and history
        self.verifications: Dict[UUID, List[CenterVerification]] = {}
        self.center_history: List[CenterStatusHistory] = []

        # Records & Status History
        self.records: Dict[UUID, RecyclingRecord] = {}
        self.record_history: List[RecordStatusHistory] = []
        self.receipts: Dict[UUID, Receipt] = {}  # keyed by record_id
        self.receipt_references: Dict[str, Receipt] = {}  # keyed by receipt_reference

        # Points Ledger
        self.ledger: List[PointsLedgerEntry] = []
        self.ledger_by_record: Dict[UUID, PointsLedgerEntry] = {}
        self.ledger_idempotency: Dict[str, PointsLedgerEntry] = {}

        # Rewards
        self.rewards: Dict[UUID, Reward] = {
            UUID("44444444-4444-4444-4444-444444440001"): Reward(
                reward_id=UUID("44444444-4444-4444-4444-444444440001"),
                title="Solar Powered Keychain Charger",
                description="Eco-friendly mini solar battery pack with USB-C connector",
                points_cost=250,
                stock_quantity=50,
                is_active=True,
            ),
            UUID("44444444-4444-4444-4444-444444440002"): Reward(
                reward_id=UUID("44444444-4444-4444-4444-444444440002"),
                title="$15 Sustainable Store Voucher",
                description="Digital discount code applicable across verified eco-friendly retailers",
                points_cost=300,
                stock_quantity=100,
                is_active=True,
            ),
            UUID("44444444-4444-4444-4444-444444440003"): Reward(
                reward_id=UUID("44444444-4444-4444-4444-444444440003"),
                title="Upcycled Laptop Sleeve (15 inch)",
                description="Padded protective sleeve manufactured from 100% ocean plastic fabric",
                points_cost=450,
                stock_quantity=20,
                is_active=True,
            ),
            UUID("44444444-4444-4444-4444-444444440004"): Reward(
                reward_id=UUID("44444444-4444-4444-4444-444444440004"),
                title="Tree Plantation Certificate",
                description="One native tree planted and monitored on your behalf with GPS coordinates",
                points_cost=150,
                stock_quantity=500,
                is_active=True,
            ),
        }
        self.redemptions: Dict[UUID, Redemption] = {}
        self.redemption_idempotency: Dict[str, Redemption] = {}

        # Badges
        self.badges: Dict[UUID, Badge] = {
            UUID("55555555-5555-5555-5555-555555550001"): Badge(
                badge_id=UUID("55555555-5555-5555-5555-555555550001"),
                code="FIRST_DROP",
                name="Green Pioneer",
                description="Completed your very first verified e-waste recycling drop-off",
                icon_name="eco",
                required_records=1,
                required_points=0,
            ),
            UUID("55555555-5555-5555-5555-555555550002"): Badge(
                badge_id=UUID("55555555-5555-5555-5555-555555550002"),
                code="CIRCUIT_SAVER",
                name="Circuit Champion",
                description="Recycled 5 or more verified electronic devices",
                icon_name="memory",
                required_records=5,
                required_points=250,
            ),
            UUID("55555555-5555-5555-5555-555555550003"): Badge(
                badge_id=UUID("55555555-5555-5555-5555-555555550003"),
                code="CENTURION",
                name="Earth Guardian",
                description="Earned 1000 points keeping toxic heavy metals out of landfills",
                icon_name="public",
                required_records=10,
                required_points=1000,
            ),
        }
        self.user_badges: Dict[UUID, List[UserBadge]] = {}

        # Document metadata and activity store (mirrors PG tables in mock mode)
        self.device_photos: Dict[UUID, DevicePhotoMeta] = {}
        self.ai_reports: Dict[UUID, AIAnalysisReport] = {}
        self.center_docs: List[CenterDocMeta] = []
        self.activity_events: List[ActivityEvent] = []


_mock_store = MockDataStore()


def get_mock_store() -> MockDataStore:
    return _mock_store
