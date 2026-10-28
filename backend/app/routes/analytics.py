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


@router.get("/personal", response_model=AnalyticsSummaryResponse)
async def get_personal_impact(user: User = Depends(get_current_user)):
    data = await analytics_service.get_user_impact(user.id)
    return AnalyticsSummaryResponse(**data)


@router.get("/summary-report")
async def get_summary_report():
    from datetime import datetime
    data = await analytics_service.get_community_impact()
    measured = data.get("measured", {})
    estimates = data.get("estimates", {})
    comm_kg = float(measured.get("community_recycled_kg", 0.0))
    citizens = int(measured.get("participating_citizens", 0))
    devices = int(measured.get("community_devices_count", 0))
    ghg = float(estimates.get("total_ghg_avoided_kg_co2e", 0.0))

    return {
        "title": "Municipal E-Waste Diversion & CO2 Reduction Audit",
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "scope": "Citywide Certified E-Waste Collection Network",
        "key_metrics": {
            "measured_kg_diverted": comm_kg,
            "estimated_co2_kg_saved": ghg,
            "approved_submissions": devices,
            "active_recyclers": citizens,
        },
        "narrative_summary": data.get("text_summary", "Community members actively diverting hazardous electronics."),
        "transparency_note": "Weights certified via calibrated on-site platform scales. Estimates follow EPA WARM v15 conversion metrics.",
    }

