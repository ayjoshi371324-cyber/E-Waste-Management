# PostgreSQL Device Photo Metadata Repository
# Replaces MongoDevicePhotoRepo — stores photo metadata in the
# 'device_photo_metadata' table created in 010_pg_only_tables.sql.

from typing import Optional
from uuid import UUID

from app.db.postgres import get_db_connection
from app.repositories.base import DevicePhotoMeta, DevicePhotoRepoBase


class PgDevicePhotoRepo(DevicePhotoRepoBase):
    async def save_photo_metadata(self, photo_meta: DevicePhotoMeta) -> DevicePhotoMeta:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO device_photo_metadata (
                        photo_id, record_id, original_filename, storage_path,
                        mime_type, file_size_bytes, uploaded_by, uploaded_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (photo_id) DO UPDATE SET
                        record_id         = EXCLUDED.record_id,
                        original_filename = EXCLUDED.original_filename,
                        storage_path      = EXCLUDED.storage_path,
                        mime_type         = EXCLUDED.mime_type,
                        file_size_bytes   = EXCLUDED.file_size_bytes,
                        uploaded_by       = EXCLUDED.uploaded_by,
                        uploaded_at       = EXCLUDED.uploaded_at
                    """,
                    (
                        photo_meta.photo_id,
                        photo_meta.record_id,
                        photo_meta.original_filename,
                        photo_meta.storage_path,
                        photo_meta.mime_type,
                        photo_meta.file_size_bytes,
                        photo_meta.uploaded_by,
                        photo_meta.uploaded_at,
                    ),
                )
        return photo_meta

    async def get_photo_metadata(self, photo_id: UUID) -> Optional[DevicePhotoMeta]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT photo_id, record_id, original_filename, storage_path,
                           mime_type, file_size_bytes, uploaded_by, uploaded_at
                    FROM device_photo_metadata
                    WHERE photo_id = %s
                    """,
                    (photo_id,),
                )
                row = cur.fetchone()
                if row:
                    return DevicePhotoMeta(**row)
                return None

