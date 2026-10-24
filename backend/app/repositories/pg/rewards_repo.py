# >>> DB-INTEGRATION-POINT: PostgreSQL Rewards Repository calling redeem_reward_transaction
# Executes parameterized queries and calls the Phase 1 stored function for atomic reward redemptions.

import json
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
import psycopg

from app.db.postgres import get_db_connection
from app.repositories.base import Redemption, Reward, RewardsRepoBase


class PgRewardsRepo(RewardsRepoBase):
    async def list_active_rewards(self) -> List[Reward]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT reward_id, title, description, points_cost, stock_quantity, is_active, created_at, updated_at
                    FROM rewards
                    WHERE is_active = TRUE
                    ORDER BY points_cost ASC
                    """
                )
                rows = cur.fetchall()
                return [Reward(**r) for r in rows]

    async def get_by_id(self, reward_id: UUID) -> Optional[Reward]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT reward_id, title, description, points_cost, stock_quantity, is_active, created_at, updated_at
                    FROM rewards
                    WHERE reward_id = %s
                    """,
                    (reward_id,)
                )
                row = cur.fetchone()
                if row:
                    return Reward(**row)
                return None

    async def create_reward(self, title: str, description: Optional[str], points_cost: int, stock_quantity: int, is_active: bool = True) -> Reward:
        r_id = uuid4()
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO rewards (reward_id, title, description, points_cost, stock_quantity, is_active, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING reward_id, title, description, points_cost, stock_quantity, is_active, created_at, updated_at
                    """,
                    (r_id, title.strip(), description, points_cost, stock_quantity, is_active)
                )
                row = cur.fetchone()
                return Reward(**row)

    async def update_reward(self, reward_id: UUID, title: Optional[str] = None, description: Optional[str] = None, points_cost: Optional[int] = None, stock_quantity: Optional[int] = None, is_active: Optional[bool] = None) -> Optional[Reward]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE rewards
                    SET title = COALESCE(%s, title),
                        description = COALESCE(%s, description),
                        points_cost = COALESCE(%s, points_cost),
                        stock_quantity = COALESCE(%s, stock_quantity),
                        is_active = COALESCE(%s, is_active),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE reward_id = %s
                    RETURNING reward_id, title, description, points_cost, stock_quantity, is_active, created_at, updated_at
                    """,
                    (title, description, points_cost, stock_quantity, is_active, reward_id)
                )
                row = cur.fetchone()
                if row:
                    return Reward(**row)
                return None

    async def redeem_reward(self, user_id: UUID, reward_id: UUID, idempotency_key: str) -> Dict[str, Any]:
        """
        >>> DB-INTEGRATION-POINT: Invokes redeem_reward_transaction stored function in 007_functions.sql
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                try:
                    cur.execute(
                        "SELECT redeem_reward_transaction(%s, %s, %s) AS result",
                        (user_id, reward_id, idempotency_key)
                    )
                    row = cur.fetchone()
                    res = row["result"] if row else {}
                    if isinstance(res, str):
                        res = json.loads(res)
                    return res
                except psycopg.errors.RaiseException as e:
                    raise ValueError(str(e))

    async def list_user_redemptions(self, user_id: UUID) -> List[Redemption]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT red.redemption_id, red.user_id, red.reward_id, red.points_spent,
                           red.status, red.idempotency_key, red.redeemed_at,
                           rew.title AS reward_title, rew.description AS reward_description
                    FROM redemptions red
                    JOIN rewards rew ON red.reward_id = rew.reward_id
                    WHERE red.user_id = %s
                    ORDER BY red.redeemed_at DESC
                    """,
                    (user_id,)
                )
                rows = cur.fetchall()
                return [Redemption(**r) for r in rows]
