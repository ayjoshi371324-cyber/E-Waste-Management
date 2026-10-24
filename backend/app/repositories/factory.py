# >>> DB-INTEGRATION-POINT: Repository Factory
# This is the single switch point selecting Mock or Real implementations
# according to DB_MODE ('mock' | 'postgres') and MONGO_MODE ('mock' | 'mongo').

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
from app.repositories.mongo.activity_events_repo import MongoActivityEventsRepo
from app.repositories.mongo.ai_analysis_repo import MongoAIAnalysisRepo
from app.repositories.mongo.center_docs_repo import MongoCenterDocsRepo
from app.repositories.mongo.device_photo_repo import MongoDevicePhotoRepo
from app.repositories.pg.analytics_repo import PgAnalyticsRepo
from app.repositories.pg.catalog_repo import PgCatalogRepo
from app.repositories.pg.centers_repo import PgCentersRepo
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
        self.mongo_mode = settings.MONGO_MODE

        # >>> DB-INTEGRATION-POINT: Instantiate PostgreSQL or Mock Repositories
        if self.db_mode == "postgres":
            logger.info("Initializing Real PostgreSQL repositories...")
            self.users = PgUsersRepo()
            self.sessions = PgSessionsRepo()
            self.catalog = PgCatalogRepo()
            self.centers = PgCentersRepo()
            self.verification = PgVerificationRepo()
            self.records = PgRecordsRepo()
            self.points = PgPointsRepo()
            self.rewards = PgRewardsRepo()
            self.analytics = PgAnalyticsRepo()
        else:
            logger.info("Initializing In-Memory MOCK relational repositories...")
            self.users = MockUsersRepo()
            self.sessions = MockSessionsRepo()
            self.catalog = MockCatalogRepo()
            self.centers = MockCentersRepo()
            self.verification = MockVerificationRepo()
            self.records = MockRecordsRepo()
            self.points = MockPointsRepo()
            self.rewards = MockRewardsRepo()
            self.analytics = MockAnalyticsRepo()

        # >>> DB-INTEGRATION-POINT: Instantiate MongoDB or Mock Document Repositories
        if self.mongo_mode == "mongo":
            logger.info("Initializing Real MongoDB document repositories...")
            self.device_photos = MongoDevicePhotoRepo()
            self.ai_reports = MongoAIAnalysisRepo()
            self.center_docs = MongoCenterDocsRepo()
            self.activity_events = MongoActivityEventsRepo()
        else:
            logger.info("Initializing In-Memory MOCK MongoDB document repositories...")
            self.device_photos = MockDevicePhotoRepo()
            self.ai_reports = MockAIAnalysisRepo()
            self.center_docs = MockCenterDocsRepo()
            self.activity_events = MockActivityEventsRepo()


@lru_cache()
def get_repos() -> RepositoryContainer:
    return RepositoryContainer()
