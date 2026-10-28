# PostgreSQL Center Documents Metadata Repository
# Replaces MongoCenterDocsRepo — stores center compliance document metadata
# in the 'center_document_metadata' table created in 010_pg_only_tables.sql.

from typing import List
from uuid import UUID

from app.db.postgres import get_db_connection
from app.repositories.base import CenterDocMeta, CenterDocsRepoBase


class PgCenterDocsRepo(CenterDocsRepoBase):
    async def save_center_doc(self, doc: CenterDocMeta) -> CenterDocMeta:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO center_document_metadata (
                        doc_id, center_id, doc_type, file_path, verified, uploaded_at
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (doc_id) DO UPDATE SET
                        center_id   = EXCLUDED.center_id,
                        doc_type    = EXCLUDED.doc_type,
                        file_path   = EXCLUDED.file_path,
                        verified    = EXCLUDED.verified,
                        uploaded_at = EXCLUDED.uploaded_at
                    """,
                    (
                        doc.doc_id,
                        doc.center_id,
                        doc.doc_type,
                        doc.file_path,
                        doc.verified,
                        doc.uploaded_at,
                    ),
                )
        return doc

    async def list_docs_for_center(self, center_id: UUID) -> List[CenterDocMeta]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT doc_id, center_id, doc_type, file_path, verified, uploaded_at
                    FROM center_document_metadata
                    WHERE center_id = %s
                    ORDER BY uploaded_at DESC
                    """,
                    (center_id,),
                )
                rows = cur.fetchall()
                return [CenterDocMeta(**row) for row in rows]

