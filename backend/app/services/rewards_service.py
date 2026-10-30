from typing import Any, Dict, List, Optional
from uuid import UUID

from app.repositories.base import Badge, LeaderboardEntry, PointsLedgerEntry, Redemption, Reward, UserBadge
from app.repositories.factory import get_repos


class RewardsService:
    def __init__(self):
        self.repos = get_repos()

    async def list_rewards(self) -> List[Reward]:
        return await self.repos.rewards.list_active_rewards()

    async def list_all_rewards(self) -> List[Reward]:
        return await self.repos.rewards.list_all_rewards()

    async def get_reward(self, reward_id: UUID) -> Optional[Reward]:
        return await self.repos.rewards.get_by_id(reward_id)

    async def create_reward(self, title: str, description: Optional[str], points_cost: int, stock_quantity: int, is_active: bool = True) -> Reward:
        return await self.repos.rewards.create_reward(
            title=title,
            description=description,
            points_cost=points_cost,
            stock_quantity=stock_quantity,
            is_active=is_active,
        )

    async def update_reward(
        self,
        reward_id: UUID,
        title: Optional[str] = None,
        description: Optional[str] = None,
        points_cost: Optional[int] = None,
        stock_quantity: Optional[int] = None,
        is_active: Optional[bool] = None,
    ) -> Optional[Reward]:
        return await self.repos.rewards.update_reward(
            reward_id=reward_id,
            title=title,
            description=description,
            points_cost=points_cost,
            stock_quantity=stock_quantity,
            is_active=is_active,
        )

    async def delete_reward(self, reward_id: UUID) -> bool:
        return await self.repos.rewards.delete_reward(reward_id)

    async def get_admin_overview(self) -> Dict[str, Any]:
        return await self.repos.rewards.get_admin_overview()

    async def list_rules(self) -> List[Any]:
        return await self.repos.catalog.list_categories(active_only=False)

    async def update_rule(self, category_id: UUID, base_points: int, points_per_kg: float) -> Optional[Any]:
        return await self.repos.catalog.update_category_points(
            category_id=category_id,
            base_points=base_points,
            points_per_kg=points_per_kg,
        )

    async def redeem(self, user_id: UUID, reward_id: UUID, idempotency_key: str) -> Dict[str, Any]:
        """
        Executes atomic reward redemption via Phase 1 procedure / mock version:
        - Replay idempotency check
        - Validates active reward & inventory stock
        - Verifies point balance >= points_cost
        - Decrements stock and inserts debit ledger row
        """
        res = await self.repos.rewards.redeem_reward(
            user_id=user_id,
            reward_id=reward_id,
            idempotency_key=idempotency_key.strip(),
        )
        if "reward_title" not in res:
            rew = await self.repos.rewards.get_by_id(reward_id)
            res["reward_title"] = rew.title if rew else "Reward"
        return res

    async def list_user_redemptions(self, user_id: UUID) -> List[Redemption]:
        return await self.repos.rewards.list_user_redemptions(user_id)

    async def get_user_balance(self, user_id: UUID) -> int:
        return await self.repos.points.get_user_balance(user_id)

    async def get_user_ledger(self, user_id: UUID) -> List[PointsLedgerEntry]:
        return await self.repos.points.get_user_ledger(user_id)

    async def get_leaderboard(self, limit: int = 10) -> List[LeaderboardEntry]:
        return await self.repos.points.get_leaderboard(limit=limit)

    async def get_user_badges(self, user_id: UUID) -> List[UserBadge]:
        return await self.repos.points.get_user_badges(user_id)

    async def list_all_badges(self) -> List[Badge]:
        return await self.repos.points.list_all_badges()
