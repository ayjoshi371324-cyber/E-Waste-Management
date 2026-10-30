from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps import get_current_user, require_admin
from app.repositories.base import Badge, LeaderboardEntry, PointsLedgerEntry, Redemption, Reward, User, UserBadge
from app.schemas.domain import (
    RedemptionResponse,
    RewardCreateRequest,
    RewardRedeemRequest,
    RewardResponse,
    RewardRuleResponse,
    RewardRuleUpdateRequest,
    RewardUpdateRequest,
    RewardsOverviewResponse,
)
from app.services.rewards_service import RewardsService

router = APIRouter(prefix="/api/v1/rewards", tags=["Rewards & Gamification"])
rewards_service = RewardsService()


@router.get("", response_model=List[RewardResponse])
async def list_rewards():
    rewards = await rewards_service.list_rewards()
    return [
        RewardResponse(
            reward_id=r.reward_id,
            title=r.title,
            description=r.description,
            points_cost=r.points_cost,
            stock_quantity=r.stock_quantity,
            is_active=r.is_active,
        )
        for r in rewards
    ]


@router.post("/redeem", response_model=RedemptionResponse)
async def redeem_reward(
    req: RewardRedeemRequest,
    user: User = Depends(get_current_user),
):
    try:
        res = await rewards_service.redeem(
            user_id=user.id,
            reward_id=req.reward_id,
            idempotency_key=req.idempotency_key,
        )
        return RedemptionResponse(
            redemption_id=res["redemption_id"],
            reward_title=res["reward_title"],
            points_spent=res["points_spent"],
            remaining_balance=res["remaining_balance"],
            status="completed",
            idempotent_replay=res.get("idempotent_replay", False),
            message=res.get("message", "Reward successfully redeemed."),
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/my-redemptions", response_model=List[Redemption])
async def list_my_redemptions(user: User = Depends(get_current_user)):
    return await rewards_service.list_user_redemptions(user.id)


@router.get("/my-balance")
async def get_my_points_balance(user: User = Depends(get_current_user)):
    balance = await rewards_service.get_user_balance(user.id)
    ledger = await rewards_service.get_user_ledger(user.id)
    return {
        "user_id": user.id,
        "current_balance": balance,
        "ledger": [e.model_dump() for e in ledger],
    }


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(limit: int = Query(10, ge=1, le=100)):
    return await rewards_service.get_leaderboard(limit=limit)


@router.get("/my-badges", response_model=List[UserBadge])
async def get_my_badges(user: User = Depends(get_current_user)):
    return await rewards_service.get_user_badges(user.id)


@router.get("/badges", response_model=List[Badge])
async def list_all_badges():
    return await rewards_service.list_all_badges()


# Admin Reward Management & Dashboard Endpoints
@router.get("/admin/overview", response_model=RewardsOverviewResponse)
async def get_rewards_overview(admin: User = Depends(require_admin)):
    data = await rewards_service.get_admin_overview()
    return RewardsOverviewResponse(**data)


@router.get("/admin/all", response_model=List[RewardResponse])
async def list_all_rewards_admin(admin: User = Depends(require_admin)):
    rewards = await rewards_service.list_all_rewards()
    return [
        RewardResponse(
            reward_id=r.reward_id,
            title=r.title,
            description=r.description,
            points_cost=r.points_cost,
            stock_quantity=r.stock_quantity,
            is_active=r.is_active,
        )
        for r in rewards
    ]


@router.post("", response_model=RewardResponse, status_code=status.HTTP_201_CREATED)
async def create_reward(
    req: RewardCreateRequest,
    admin: User = Depends(require_admin),
):
    rew = await rewards_service.create_reward(
        title=req.title,
        description=req.description,
        points_cost=req.points_cost,
        stock_quantity=req.stock_quantity,
        is_active=req.is_active,
    )
    return RewardResponse(
        reward_id=rew.reward_id,
        title=rew.title,
        description=rew.description,
        points_cost=rew.points_cost,
        stock_quantity=rew.stock_quantity,
        is_active=rew.is_active,
    )


@router.put("/{reward_id}", response_model=RewardResponse)
async def update_reward(
    reward_id: UUID,
    req: RewardUpdateRequest,
    admin: User = Depends(require_admin),
):
    rew = await rewards_service.update_reward(
        reward_id=reward_id,
        title=req.title,
        description=req.description,
        points_cost=req.points_cost,
        stock_quantity=req.stock_quantity,
        is_active=req.is_active,
    )
    if not rew:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reward not found.")
    return RewardResponse(
        reward_id=rew.reward_id,
        title=rew.title,
        description=rew.description,
        points_cost=rew.points_cost,
        stock_quantity=rew.stock_quantity,
        is_active=rew.is_active,
    )


@router.delete("/{reward_id}")
async def delete_reward(
    reward_id: UUID,
    admin: User = Depends(require_admin),
):
    deleted = await rewards_service.delete_reward(reward_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reward not found.")
    return {"success": True, "message": "Reward removed successfully."}


@router.get("/rules", response_model=List[RewardRuleResponse])
async def list_reward_rules(admin: User = Depends(require_admin)):
    categories = await rewards_service.list_rules()
    return [
        RewardRuleResponse(
            category_id=c.category_id,
            code=c.code,
            name=c.name,
            description=c.description,
            base_points=c.base_points,
            points_per_kg=c.points_per_kg,
            is_active=c.is_active,
        )
        for c in categories
    ]


@router.put("/rules/{category_id}", response_model=RewardRuleResponse)
async def update_reward_rule(
    category_id: UUID,
    req: RewardRuleUpdateRequest,
    admin: User = Depends(require_admin),
):
    cat = await rewards_service.update_rule(
        category_id=category_id,
        base_points=req.base_points,
        points_per_kg=req.points_per_kg,
    )
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    return RewardRuleResponse(
        category_id=cat.category_id,
        code=cat.code,
        name=cat.name,
        description=cat.description,
        base_points=cat.base_points,
        points_per_kg=cat.points_per_kg,
        is_active=cat.is_active,
    )
