# >>> DB-INTEGRATION-POINT: PostgreSQL Catalog Repository
# Executes parameterized queries against 'device_categories', 'materials', and 'category_materials'.

from typing import List, Optional
from uuid import UUID, uuid4

from app.db.postgres import get_db_connection
from app.repositories.base import CatalogRepoBase, CategoryMaterial, DeviceCategory


class PgCatalogRepo(CatalogRepoBase):
    async def list_categories(self, active_only: bool = True) -> List[DeviceCategory]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                query = """
                    SELECT category_id, code, name, description, handling_priority,
                           base_points, points_per_kg, is_active, created_at
                    FROM device_categories
                """
                if active_only:
                    query += " WHERE is_active = TRUE"
                query += " ORDER BY name ASC"
                cur.execute(query)
                rows = cur.fetchall()
                return [DeviceCategory(**r) for r in rows]

    async def get_category_by_id(self, category_id: UUID) -> Optional[DeviceCategory]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT category_id, code, name, description, handling_priority,
                           base_points, points_per_kg, is_active, created_at
                    FROM device_categories
                    WHERE category_id = %s
                    """,
                    (category_id,)
                )
                row = cur.fetchone()
                if row:
                    return DeviceCategory(**row)
                return None

    async def get_category_by_code(self, code: str) -> Optional[DeviceCategory]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT category_id, code, name, description, handling_priority,
                           base_points, points_per_kg, is_active, created_at
                    FROM device_categories
                    WHERE UPPER(code) = UPPER(%s)
                    """,
                    (code.strip(),)
                )
                row = cur.fetchone()
                if row:
                    return DeviceCategory(**row)
                return None

    async def create_category(self, code: str, name: str, description: Optional[str], handling_priority: str, base_points: int, points_per_kg: float) -> DeviceCategory:
        cat_id = uuid4()
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO device_categories (category_id, code, name, description, handling_priority, base_points, points_per_kg, is_active)
                    VALUES (%s, UPPER(%s), %s, %s, %s, %s, %s, TRUE)
                    RETURNING category_id, code, name, description, handling_priority, base_points, points_per_kg, is_active, created_at
                    """,
                    (cat_id, code.strip(), name.strip(), description, handling_priority, base_points, points_per_kg)
                )
                row = cur.fetchone()
                return DeviceCategory(**row)

    async def get_category_materials(self, category_id: UUID) -> List[CategoryMaterial]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT cm.category_id, cm.material_id, m.name, m.code, m.unit,
                           cm.estimated_percentage, m.default_impact_factor
                    FROM category_materials cm
                    JOIN materials m ON cm.material_id = m.material_id
                    WHERE cm.category_id = %s
                    """,
                    (category_id,)
                )
                rows = cur.fetchall()
                return [CategoryMaterial(**r) for r in rows]
