from typing import Any, Dict, List
from uuid import UUID

from app.repositories.factory import get_repos


class AnalyticsService:
    def __init__(self):
        self.repos = get_repos()

    async def get_user_impact(self, user_id: UUID) -> Dict[str, Any]:
        data = await self.repos.analytics.get_user_metrics(user_id)
        measured = data.get("measured", {})
        points = data.get("points", {})
        estimates = data.get("estimates", {})

        total_kg = measured.get("total_recycled_kg", 0.0)
        units = measured.get("total_units_recycled", 0)
        ghg = estimates.get("ghg_avoided_kg_co2e", 0.0)
        pts = points.get("lifetime_earned", 0)

        # Templated, rule-based non-LLM summary
        summary = (
            f"You have recycled {total_kg:.2f} kg of electronic waste across {units} verified devices, "
            f"earning {pts} sustainability reward points. "
            f"This has prevented an estimated {ghg:.2f} kg of CO2 equivalent emissions and diverted "
            f"hazardous materials from municipal landfills."
        )

        data["text_summary"] = summary
        return data

    async def get_community_impact(self) -> Dict[str, Any]:
        data = await self.repos.analytics.get_community_metrics()
        measured = data.get("measured", {})
        estimates = data.get("estimates", {})

        comm_kg = measured.get("community_recycled_kg", 0.0)
        citizens = measured.get("participating_citizens", 0)
        devices = measured.get("community_devices_count", 0)
        ghg = estimates.get("total_ghg_avoided_kg_co2e", 0.0)
        landfill = estimates.get("landfill_space_saved_m3", 0.0)

        summary = (
            f"Together, {citizens} active community members have recovered {comm_kg:.2f} kg "
            f"of electronic hardware across {devices} verified devices. "
            f"This collective effort avoided an estimated {ghg:.2f} kg CO2e greenhouse gas emissions "
            f"and conserved {landfill:.3f} cubic meters of landfill capacity."
        )

        data["text_summary"] = summary
        return data

    async def get_category_breakdown(self) -> List[Dict[str, Any]]:
        return await self.repos.analytics.get_category_metrics()
