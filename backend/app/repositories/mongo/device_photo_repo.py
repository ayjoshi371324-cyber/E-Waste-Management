# >>> DB-INTEGRATION-POINT: MongoDB Device Photo Metadata Repository
# Interacts with MongoDB collection 'device_photo_metadata'.

from typing import Optional
from uuid import UUID

from app.db.mongo import get_mongo_db
from app.repositories.base import DevicePhotoMeta, DevicePhotoRepoBase


class MongoDevicePhotoRepo(DevicePhotoRepoBase):
    def _collection(self):
        db = get_mongo_db()
        if db is None:
            raise RuntimeError("MongoDB is not initialized. Ensure MONGO_MODE=mongo.")
        return db["device_photo_metadata"]

    async def save_photo_metadata(self, photo_meta: DevicePhotoMeta) -> DevicePhotoMeta:
        coll = self._collection()
        doc = photo_meta.model_dump()
        doc["_id"] = str(photo_meta.photo_id)
        if photo_meta.record_id:
            doc["record_id"] = str(photo_meta.record_id)
        doc["uploaded_by"] = str(photo_meta.uploaded_by)
        doc.pop("photo_id", None)
        coll.replace_one({"_id": doc["_id"]}, doc, upsert=True)
        return photo_meta

    async def get_photo_metadata(self, photo_id: UUID) -> Optional[DevicePhotoMeta]:
        coll = self._collection()
        doc = coll.find_one({"_id": str(photo_id)})
        if doc:
            doc["photo_id"] = UUID(doc["_id"])
            if doc.get("record_id"):
                doc["record_id"] = UUID(doc["record_id"])
            doc["uploaded_by"] = UUID(doc["uploaded_by"])
            doc.pop("_id", None)
            return DevicePhotoMeta(**doc)
        return None
