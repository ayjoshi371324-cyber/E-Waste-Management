# >>> DB-INTEGRATION-POINT: PostgreSQL Centers Repository with PostGIS Spatial Query
# Executes PostGIS queries against 'recycling_centers' and 'center_accepted_categories'.

import json
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from app.db.postgres import get_db_connection
from app.repositories.base import CenterSearchResult, CentersRepoBase, RecyclingCenter


class PgCentersRepo(CentersRepoBase):
    async def search_nearby(self, lat: float, lng: float, radius_km: float = 25.0, category_id: Optional[UUID] = None, verified_only: bool = True) -> List[CenterSearchResult]:
        radius_meters = radius_km * 1000.0
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # PostGIS spatial proximity query using ST_Distance and ST_DWithin
                params = [lng, lat, lng, lat, radius_meters]
                filter_clauses = []

                if verified_only:
                    filter_clauses.append("c.current_verification_status = 'verified'")

                if category_id:
                    filter_clauses.append("cac.category_id = %s")
                    params.append(category_id)

                where_sql = " AND ".join(filter_clauses)
                if where_sql:
                    where_sql = "AND " + where_sql

                query = f"""
                    SELECT 
                        c.center_id,
                        c.name,
                        c.address,
                        c.contact_phone,
                        c.contact_email,
                        ST_Y(c.location) AS latitude,
                        ST_X(c.location) AS longitude,
                        c.operational_hours,
                        c.current_verification_status,
                        ROUND((ST_Distance(c.location::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography))::numeric, 1) AS distance_meters,
                        ROUND(((ST_Distance(c.location::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography)) / 1000.0)::numeric, 2) AS distance_km,
                        COALESCE(
                            ARRAY_AGG(dc.code) FILTER (WHERE dc.code IS NOT NULL),
                            ARRAY[]::VARCHAR[]
                        ) AS accepted_categories
                    FROM recycling_centers c
                    LEFT JOIN center_accepted_categories cac ON c.center_id = cac.center_id
                    LEFT JOIN device_categories dc ON cac.category_id = dc.category_id
                    WHERE ST_DWithin(c.location::geography, ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, %s)
                    {where_sql}
                    GROUP BY c.center_id, c.name, c.address, c.contact_phone, c.contact_email, c.location, c.operational_hours, c.current_verification_status
                    ORDER BY distance_meters ASC
                """
                # Point arguments are placed at the beginning and the within check
                full_params = [lng, lat, lng, lat, lng, lat, radius_meters]
                if category_id:
                    full_params.append(category_id)

                cur.execute(query, tuple(full_params))
                rows = cur.fetchall()

                return [
                    CenterSearchResult(
                        center_id=r["center_id"],
                        name=r["name"],
                        address=r["address"],
                        contact_phone=r["contact_phone"],
                        contact_email=r["contact_email"],
                        latitude=float(r["latitude"]),
                        longitude=float(r["longitude"]),
                        operational_hours=r["operational_hours"] or {},
                        distance_meters=float(r["distance_meters"]),
                        distance_km=float(r["distance_km"]),
                        verification_status=r["current_verification_status"],
                        accepted_categories=r["accepted_categories"] or [],
                    )
                    for r in rows
                ]

    async def get_by_id(self, center_id: UUID) -> Optional[RecyclingCenter]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT c.center_id, c.name, c.address, c.contact_phone, c.contact_email,
                           ST_Y(c.location) AS latitude, ST_X(c.location) AS longitude,
                           c.operational_hours, c.current_verification_status, c.created_by,
                           c.created_at, c.updated_at,
                           COALESCE(ARRAY_AGG(dc.code) FILTER (WHERE dc.code IS NOT NULL), ARRAY[]::VARCHAR[]) as accepted_categories
                    FROM recycling_centers c
                    LEFT JOIN center_accepted_categories cac ON c.center_id = cac.center_id
                    LEFT JOIN device_categories dc ON cac.category_id = dc.category_id
                    WHERE c.center_id = %s
                    GROUP BY c.center_id, c.name, c.address, c.contact_phone, c.contact_email, c.location, c.operational_hours, c.current_verification_status, c.created_by, c.created_at, c.updated_at
                    """,
                    (center_id,)
                )
                row = cur.fetchone()
                if row:
                    return RecyclingCenter(**row)
                return None

    async def create_center(self, name: str, address: str, contact_phone: Optional[str], contact_email: Optional[str], latitude: float, longitude: float, operational_hours: Dict[str, Any], current_verification_status: str, created_by: Optional[UUID], accepted_categories: List[UUID]) -> RecyclingCenter:
        center_id = uuid4()
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO recycling_centers (
                        center_id, name, address, contact_phone, contact_email,
                        location, operational_hours, current_verification_status, created_by
                    ) VALUES (
                        %s, %s, %s, %s, %s,
                        ST_SetSRID(ST_MakePoint(%s, %s), 4326),
                        %s::jsonb, %s, %s
                    )
                    RETURNING center_id, name, address, contact_phone, contact_email,
                              ST_Y(location) AS latitude, ST_X(location) AS longitude,
                              operational_hours, current_verification_status, created_by,
                              created_at, updated_at
                    """,
                    (
                        center_id, name, address, contact_phone, contact_email,
                        longitude, latitude, json.dumps(operational_hours),
                        current_verification_status, created_by
                    )
                )
                row = cur.fetchone()

                cat_codes = []
                for cat_id in accepted_categories:
                    cur.execute(
                        "INSERT INTO center_accepted_categories (center_id, category_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                        (center_id, cat_id)
                    )
                    cur.execute("SELECT code FROM device_categories WHERE category_id = %s", (cat_id,))
                    c_row = cur.fetchone()
                    if c_row:
                        cat_codes.append(c_row["code"])

                return RecyclingCenter(**row, accepted_categories=cat_codes)

    async def update_center(self, center_id: UUID, name: Optional[str] = None, address: Optional[str] = None, contact_phone: Optional[str] = None, contact_email: Optional[str] = None, operational_hours: Optional[Dict[str, Any]] = None, current_verification_status: Optional[str] = None) -> Optional[RecyclingCenter]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE recycling_centers
                    SET name = COALESCE(%s, name),
                        address = COALESCE(%s, address),
                        contact_phone = COALESCE(%s, contact_phone),
                        contact_email = COALESCE(%s, contact_email),
                        operational_hours = CASE WHEN %s IS NOT NULL THEN %s::jsonb ELSE operational_hours END,
                        current_verification_status = COALESCE(%s, current_verification_status),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE center_id = %s
                    RETURNING center_id, name, address, contact_phone, contact_email,
                              ST_Y(location) AS latitude, ST_X(location) AS longitude,
                              operational_hours, current_verification_status, created_by,
                              created_at, updated_at
                    """,
                    (
                        name, address, contact_phone, contact_email,
                        json.dumps(operational_hours) if operational_hours else None,
                        json.dumps(operational_hours) if operational_hours else None,
                        current_verification_status, center_id
                    )
                )
                row = cur.fetchone()
                if not row:
                    return None
                cur.execute(
                    """
                    SELECT COALESCE(ARRAY_AGG(dc.code), ARRAY[]::VARCHAR[]) AS accepted_categories
                    FROM center_accepted_categories cac
                    JOIN device_categories dc ON cac.category_id = dc.category_id
                    WHERE cac.center_id = %s
                    """,
                    (center_id,)
                )
                c_row = cur.fetchone()
                return RecyclingCenter(**row, accepted_categories=c_row["accepted_categories"] if c_row else [])

    async def list_all_centers(self) -> List[RecyclingCenter]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT c.center_id, c.name, c.address, c.contact_phone, c.contact_email,
                           ST_Y(c.location) AS latitude, ST_X(c.location) AS longitude,
                           c.operational_hours, c.current_verification_status, c.created_by,
                           c.created_at, c.updated_at,
                           COALESCE(ARRAY_AGG(dc.code) FILTER (WHERE dc.code IS NOT NULL), ARRAY[]::VARCHAR[]) as accepted_categories
                    FROM recycling_centers c
                    LEFT JOIN center_accepted_categories cac ON c.center_id = cac.center_id
                    LEFT JOIN device_categories dc ON cac.category_id = dc.category_id
                    GROUP BY c.center_id, c.name, c.address, c.contact_phone, c.contact_email, c.location, c.operational_hours, c.current_verification_status, c.created_by, c.created_at, c.updated_at
                    ORDER BY c.name ASC
                    """
                )
                rows = cur.fetchall()
                return [RecyclingCenter(**r) for r in rows]
