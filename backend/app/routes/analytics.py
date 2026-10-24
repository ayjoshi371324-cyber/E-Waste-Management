from typing import Any, Dict, List
from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.repositories.base import User
from app.schemas.domain import AnalyticsSummaryResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics & Impact Reporting"])
analytics_service = AnalyticsService()


@router.get("/my-impact", response_model=AnalyticsSummaryResponse)
async def get_my_impact(user: User = Depends(get_current_user)):
    data = await analytics_service.get_user_impact(user.id)
    return AnalyticsSummaryResponse(**data)


@router.get("/community", response_model=AnalyticsSummaryResponse)
async def get_community_impact():
    data = await analytics_service.get_community_impact()
    return AnalyticsSummaryResponse(**data)


@router.get("/categories", response_model=List[Dict[str, Any]])
async def get_category_metrics():
    return await analytics_service.get_category_breakdown()
