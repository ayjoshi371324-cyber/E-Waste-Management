# Repository Factory
# Single switch point selecting Mock or PostgreSQL implementations.
# DB_MODE controls ALL repositories — both relational and document (formerly MongoDB).
# When DB_MODE=postgres: all repos use PostgreSQL (psycopg3).
# When DB_MODE=mock:     all repos use in-memory mock implementations.

import logging
from functools import lru_cache

from app.config import get_settings
from app.repositories.base import (
    ActivityEventsRepoBase,
    AIAnalysisRepoBase,
    AnalyticsRepoBase,
    CatalogRepoBase,
    CenterDocsRepoBase,
    CentersRepoBase,
    DevicePhotoRepoBase,
    PointsRepoBase,
    RecordsRepoBase,
    RewardsRepoBase,
    SessionsRepoBase,
    UsersRepoBase,
    VerificationRepoBase,
)
from app.repositories.mock.repositories import (
    MockActivityEventsRepo,
    MockAIAnalysisRepo,
    MockAnalyticsRepo,
    MockCatalogRepo,
    MockCenterDocsRepo,
    MockCentersRepo,
    MockDevicePhotoRepo,
    MockPointsRepo,
    MockRecordsRepo,
    MockRewardsRepo,
    MockSessionsRepo,
    MockUsersRepo,
    MockVerificationRepo,
)
from app.repositories.pg.activity_events_repo import PgActivityEventsRepo
from app.repositories.pg.ai_analysis_repo import PgAIAnalysisRepo
from app.repositories.pg.analytics_repo import PgAnalyticsRepo
from app.repositories.pg.catalog_repo import PgCatalogRepo
from app.repositories.pg.center_docs_repo import PgCenterDocsRepo
from app.repositories.pg.centers_repo import PgCentersRepo
from app.repositories.pg.device_photo_repo import PgDevicePhotoRepo
from app.repositories.pg.points_repo import PgPointsRepo
from app.repositories.pg.records_repo import PgRecordsRepo
from app.repositories.pg.rewards_repo import PgRewardsRepo
from app.repositories.pg.sessions_repo import PgSessionsRepo
from app.repositories.pg.users_repo import PgUsersRepo
from app.repositories.pg.verification_repo import PgVerificationRepo

logger = logging.getLogger(__name__)


class RepositoryContainer:
    def __init__(self):
        settings = get_settings()
        self.db_mode = settings.DB_MODE

        if self.db_mode == "postgres":
            logger.info("Initializing PostgreSQL repositories (relational + document)...")
            # Relational repositories
            self.users = PgUsersRepo()
            self.sessions = PgSessionsRepo()
            self.catalog = PgCatalogRepo()
            self.centers = PgCentersRepo()
            self.verification = PgVerificationRepo()
            self.records = PgRecordsRepo()
            self.points = PgPointsRepo()
            self.rewards = PgRewardsRepo()
            self.analytics = PgAnalyticsRepo()
            # Document repositories (formerly MongoDB — now PostgreSQL JSONB)
            self.device_photos = PgDevicePhotoRepo()
            self.ai_reports = PgAIAnalysisRepo()
            self.center_docs = PgCenterDocsRepo()
            self.activity_events = PgActivityEventsRepo()
        else:
            logger.info("Initializing In-Memory MOCK repositories (all collections)...")
            self.users = MockUsersRepo()
            self.sessions = MockSessionsRepo()
            self.catalog = MockCatalogRepo()
            self.centers = MockCentersRepo()
            self.verification = MockVerificationRepo()
            self.records = MockRecordsRepo()
            self.points = MockPointsRepo()
            self.rewards = MockRewardsRepo()
            self.analytics = MockAnalyticsRepo()
            self.device_photos = MockDevicePhotoRepo()
            self.ai_reports = MockAIAnalysisRepo()
            self.center_docs = MockCenterDocsRepo()
            self.activity_events = MockActivityEventsRepo()


@lru_cache()
def get_repos() -> RepositoryContainer:
    return RepositoryContainer()
