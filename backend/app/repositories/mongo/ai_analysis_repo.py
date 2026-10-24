# >>> DB-INTEGRATION-POINT: MongoDB AI Analysis Reports Repository
# Interacts with MongoDB collection 'ai_analysis_reports'.

from typing import Optional
from uuid import UUID

from app.db.mongo import get_mongo_db
from app.repositories.base import AIAnalysisReport, AIAnalysisRepoBase


class MongoAIAnalysisRepo(AIAnalysisRepoBase):
    def _collection(self):
        db = get_mongo_db()
        if db is None:
            raise RuntimeError("MongoDB is not initialized. Ensure MONGO_MODE=mongo.")
        return db["ai_analysis_reports"]

    async def save_analysis_report(self, report: AIAnalysisReport) -> AIAnalysisReport:
        coll = self._collection()
        doc = report.model_dump()
        doc["_id"] = str(report.report_id)
        doc["photo_id"] = str(report.photo_id)
        if report.record_id:
            doc["record_id"] = str(report.record_id)
        doc.pop("report_id", None)
        coll.replace_one({"_id": doc["_id"]}, doc, upsert=True)
        return report

    async def get_report_by_photo(self, photo_id: UUID) -> Optional[AIAnalysisReport]:
        coll = self._collection()
        doc = coll.find_one({"photo_id": str(photo_id)})
        if doc:
            doc["report_id"] = UUID(doc["_id"])
            doc["photo_id"] = UUID(doc["photo_id"])
            if doc.get("record_id"):
                doc["record_id"] = UUID(doc["record_id"])
            doc.pop("_id", None)
            return AIAnalysisReport(**doc)
        return None
