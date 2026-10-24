# >>> DB-INTEGRATION-POINT: PostgreSQL Analytics Repository
# Executes aggregate SQL queries for personal and community impact metrics.
# Clearly segregates measured figures from conversion-factor estimates.

from typing import Any, Dict, List
from uuid import UUID

from app.db.postgres import get_db_connection
from app.repositories.base import AnalyticsRepoBase


class PgAnalyticsRepo(AnalyticsRepoBase):
    async def get_user_metrics(self, user_id: UUID) -> Dict[str, Any]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # 1. Measured recycling performance
                cur.execute(
                    """
                    SELECT 
                        COALESCE(SUM(weight_kg), 0.0) AS total_kg,
                        COALESCE(SUM(estimated_units), 0) AS total_units,
                        COUNT(record_id) AS approved_count
                    FROM recycling_records
                    WHERE user_id = %s AND status = 'approved'
                    """,
                    (user_id,)
                )
                rec_row = cur.fetchone()
                total_kg = float(rec_row["total_kg"]) if rec_row else 0.0
                total_units = int(rec_row["total_units"]) if rec_row else 0
                approved_count = int(rec_row["approved_count"]) if rec_row else 0

                # 2. Points summary
                cur.execute(
                    """
                    SELECT 
                        COALESCE(SUM(points), 0) AS current_balance,
                        COALESCE(SUM(points) FILTER (WHERE points > 0), 0) AS lifetime_earned
                    FROM points_ledger
                    WHERE user_id = %s
                    """,
                    (user_id,)
                )
                pts_row = cur.fetchone()
                current_balance = int(pts_row["current_balance"]) if pts_row else 0
                lifetime_earned = int(pts_row["lifetime_earned"]) if pts_row else 0

                # 3. Estimates via category materials composition
                cur.execute(
                    """
                    SELECT 
                        m.name AS material_name,
                        ROUND(SUM(rr.weight_kg * (cm.estimated_percentage / 100.0))::numeric, 3) AS estimated_material_kg
                    FROM recycling_records rr
                    JOIN category_materials cm ON rr.category_id = cm.category_id
                    JOIN materials m ON cm.material_id = m.material_id
                    WHERE rr.user_id = %s AND rr.status = 'approved'
                    GROUP BY m.name
                    """,
                    (user_id,)
                )
                mat_rows = cur.fetchall()
                materials_dict = {r["material_name"]: float(r["estimated_material_kg"]) for r in mat_rows}

                return {
                    "measured": {
                        "total_recycled_kg": round(total_kg, 2),
                        "total_units_recycled": total_units,
                        "verified_submissions_count": approved_count,
                    },
                    "points": {
                        "current_balance": current_balance,
                        "lifetime_earned": lifetime_earned,
                    },
                    "estimates": {
                        "materials_recovered_kg": materials_dict,
                        "ghg_avoided_kg_co2e": round(total_kg * 1.44, 2),  # Conversion factor: 1.44 kg CO2e / kg e-waste diverted
                    }
                }

    async def get_community_metrics(self) -> Dict[str, Any]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT 
                        COALESCE(SUM(weight_kg), 0.0) AS community_recycled_kg,
                        COALESCE(SUM(estimated_units), 0) AS community_devices_count,
                        COUNT(DISTINCT user_id) AS participating_citizens
                    FROM recycling_records
                    WHERE status = 'approved'
                    """
                )
                comm_row = cur.fetchone()
                comm_kg = float(comm_row["community_recycled_kg"]) if comm_row else 0.0
                comm_devices = int(comm_row["community_devices_count"]) if comm_row else 0
                citizens_cnt = int(comm_row["participating_citizens"]) if comm_row else 0

                cur.execute(
                    "SELECT COUNT(*) AS verified_count FROM recycling_centers WHERE current_verification_status = 'verified'"
                )
                ctr_row = cur.fetchone()
                verified_centers = int(ctr_row["verified_count"]) if ctr_row else 0

                return {
                    "measured": {
                        "community_recycled_kg": round(comm_kg, 2),
                        "community_devices_count": comm_devices,
                        "participating_citizens": citizens_cnt,
                        "verified_centers_count": verified_centers,
                    },
                    "estimates": {
                        "total_ghg_avoided_kg_co2e": round(comm_kg * 1.44, 2),
                        "landfill_space_saved_m3": round(comm_kg * 0.0018, 3),  # Conversion factor: 0.0018 m3 per kg
                    }
                }

    async def get_category_metrics(self) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT 
                        dc.category_id,
                        dc.name,
                        dc.code,
                        COALESCE(SUM(rr.weight_kg) FILTER (WHERE rr.status = 'approved'), 0.0) AS total_kg,
                        COUNT(rr.record_id) FILTER (WHERE rr.status = 'approved') AS submissions_count
                    FROM device_categories dc
                    LEFT JOIN recycling_records rr ON dc.category_id = rr.category_id
                    GROUP BY dc.category_id, dc.name, dc.code
                    ORDER BY total_kg DESC
                    """
                )
                rows = cur.fetchall()
                return [
                    {
                        "category_id": r["category_id"],
                        "name": r["name"],
                        "code": r["code"],
                        "total_kg": float(round(r["total_kg"], 2)),
                        "submissions_count": int(r["submissions_count"]),
                    }
                    for r in rows
                ]
