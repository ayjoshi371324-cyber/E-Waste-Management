# >>> DB-INTEGRATION-POINT: PostgreSQL Points Repository
# Executes parameterized queries against 'points_ledger', 'badges', and 'user_badges'.

from typing import List, Optional
from uuid import UUID

from app.db.postgres import get_db_connection
from app.repositories.base import Badge, LeaderboardEntry, PointsLedgerEntry, PointsRepoBase, UserBadge


class PgPointsRepo(PointsRepoBase):
    async def get_user_balance(self, user_id: UUID) -> int:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT COALESCE(SUM(points), 0) AS balance FROM points_ledger WHERE user_id = %s",
                    (user_id,)
                )
                row = cur.fetchone()
                return int(row["balance"]) if row else 0

    async def get_user_ledger(self, user_id: UUID) -> List[PointsLedgerEntry]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT ledger_id, user_id, record_id, transaction_type, points,
                           idempotency_key, notes, created_at
                    FROM points_ledger
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    """,
                    (user_id,)
                )
                rows = cur.fetchall()
                return [PointsLedgerEntry(**r) for r in rows]

    async def get_leaderboard(self, limit: int = 10) -> List[LeaderboardEntry]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT 
                        u.id AS user_id,
                        u.full_name,
                        COALESCE(SUM(pl.points) FILTER (WHERE pl.points > 0), 0) AS total_points,
                        COALESCE(SUM(rr.weight_kg) FILTER (WHERE rr.status = 'approved'), 0.0) AS total_kg,
                        COUNT(rr.record_id) FILTER (WHERE rr.status = 'approved') AS total_records,
                        ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(pl.points) FILTER (WHERE pl.points > 0), 0) DESC) AS rank
                    FROM users u
                    LEFT JOIN points_ledger pl ON u.id = pl.user_id
                    LEFT JOIN recycling_records rr ON u.id = rr.user_id
                    WHERE u.role_id = 2
                    GROUP BY u.id, u.full_name
                    ORDER BY total_points DESC
                    LIMIT %s
                    """,
                    (limit,)
                )
                rows = cur.fetchall()
                return [
                    LeaderboardEntry(
                        user_id=r["user_id"],
                        full_name=r["full_name"],
                        total_points=int(r["total_points"]),
                        total_kg=float(round(r["total_kg"], 2)),
                        total_records=int(r["total_records"]),
                        rank=int(r["rank"]),
                    )
                    for r in rows
                ]

    async def get_user_badges(self, user_id: UUID) -> List[UserBadge]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT b.badge_id, ub.user_id, b.code, b.name, b.description, b.icon_name, ub.awarded_at
                    FROM badges b
                    JOIN user_badges ub ON b.badge_id = ub.badge_id
                    WHERE ub.user_id = %s
                    ORDER BY ub.awarded_at DESC
                    """,
                    (user_id,)
                )
                rows = cur.fetchall()
                return [UserBadge(**r) for r in rows]

    async def list_all_badges(self) -> List[Badge]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT badge_id, code, name, description, icon_name, required_records, required_points
                    FROM badges
                    ORDER BY required_points ASC
                    """
                )
                rows = cur.fetchall()
                return [Badge(**r) for r in rows]

    async def evaluate_and_award_badges(self, user_id: UUID) -> List[UserBadge]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                balance = await self.get_user_balance(user_id)
                cur.execute(
                    "SELECT COUNT(*) AS cnt FROM recycling_records WHERE user_id = %s AND status = 'approved'",
                    (user_id,)
                )
                cnt_row = cur.fetchone()
                record_cnt = int(cnt_row["cnt"]) if cnt_row else 0

                cur.execute("SELECT badge_id, required_records, required_points FROM badges")
                badges = cur.fetchall()

                for b in badges:
                    if record_cnt >= b["required_records"] and balance >= b["required_points"]:
                        cur.execute(
                            """
                            INSERT INTO user_badges (user_id, badge_id, awarded_at)
                            VALUES (%s, %s, CURRENT_TIMESTAMP)
                            ON CONFLICT (user_id, badge_id) DO NOTHING
                            """,
                            (user_id, b["badge_id"])
                        )

                return await self.get_user_badges(user_id)
