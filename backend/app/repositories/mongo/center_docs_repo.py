# >>> DB-INTEGRATION-POINT: MongoDB Center Documents Metadata Repository
# Interacts with MongoDB collection 'center_document_metadata'.

from typing import List
from uuid import UUID

from app.db.mongo import get_mongo_db
from app.repositories.base import CenterDocMeta, CenterDocsRepoBase


class MongoCenterDocsRepo(CenterDocsRepoBase):
    def _collection(self):
        db = get_mongo_db()
        if db is None:
            raise RuntimeError("MongoDB is not initialized. Ensure MONGO_MODE=mongo.")
        return db["center_document_metadata"]

    async def save_center_doc(self, doc: CenterDocMeta) -> CenterDocMeta:
        coll = self._collection()
        d = doc.model_dump()
        d["_id"] = str(doc.doc_id)
        d["center_id"] = str(doc.center_id)
        d.pop("doc_id", None)
        coll.replace_one({"_id": d["_id"]}, d, upsert=True)
        return doc

    async def list_docs_for_center(self, center_id: UUID) -> List[CenterDocMeta]:
        coll = self._collection()
        cursor = coll.find({"center_id": str(center_id)})
        results = []
        for d in cursor:
            d["doc_id"] = UUID(d["_id"])
            d["center_id"] = UUID(d["center_id"])
            d.pop("_id", None)
            results.append(CenterDocMeta(**d))
        return results
