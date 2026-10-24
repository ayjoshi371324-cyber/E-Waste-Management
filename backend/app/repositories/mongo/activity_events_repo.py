# >>> DB-INTEGRATION-POINT: MongoDB Activity Events Repository
# Interacts with MongoDB collection 'activity_events'.

from typing import List
from uuid import UUID

from app.db.mongo import get_mongo_db
from app.repositories.base import ActivityEvent, ActivityEventsRepoBase


class MongoActivityEventsRepo(ActivityEventsRepoBase):
    def _collection(self):
        db = get_mongo_db()
        if db is None:
            raise RuntimeError("MongoDB is not initialized. Ensure MONGO_MODE=mongo.")
        return db["activity_events"]

    async def record_event(self, event: ActivityEvent) -> ActivityEvent:
        coll = self._collection()
        d = event.model_dump()
        d["_id"] = str(event.event_id)
        if event.user_id:
            d["user_id"] = str(event.user_id)
        d.pop("event_id", None)
        coll.replace_one({"_id": d["_id"]}, d, upsert=True)
        return event

    async def list_recent_events(self, limit: int = 50) -> List[ActivityEvent]:
        coll = self._collection()
        cursor = coll.find().sort("timestamp", -1).limit(limit)
        events = []
        for d in cursor:
            d["event_id"] = UUID(d["_id"])
            if d.get("user_id"):
                d["user_id"] = UUID(d["user_id"])
            d.pop("_id", None)
            events.append(ActivityEvent(**d))
        return events
