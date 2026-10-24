from typing import Any, Dict, List, Optional
from uuid import UUID

from app.repositories.base import CategoryMaterial, DeviceCategory
from app.repositories.factory import get_repos


class CatalogService:
    def __init__(self):
        self.repos = get_repos()

    async def list_categories(self, active_only: bool = True) -> List[DeviceCategory]:
        return await self.repos.catalog.list_categories(active_only=active_only)

    async def get_category(self, category_id: UUID) -> Optional[DeviceCategory]:
        return await self.repos.catalog.get_category_by_id(category_id)

    async def get_category_by_code(self, code: str) -> Optional[DeviceCategory]:
        return await self.repos.catalog.get_category_by_code(code)

    async def get_category_materials(self, category_id: UUID) -> List[CategoryMaterial]:
        return await self.repos.catalog.get_category_materials(category_id)

    def get_handling_guidance(self, code: str, handling_priority: str) -> Dict[str, Any]:
        """Provides category-specific safety, secure data wipe, and handling guidance."""
        guidance: Dict[str, Any] = {
            "handling_priority": handling_priority,
            "safety_instructions": [],
            "data_sanitization_steps": [],
            "battery_precautions": [],
        }

        if handling_priority == "secure_data_wipe" or code in ("SMARTPHONE", "LAPTOP", "TABLET"):
            guidance["safety_instructions"] = [
                "Inspect device for physical battery swelling or punctured chassis.",
                "Keep device dry and stored at room temperature before drop-off.",
                "Include charging brick/cables if available for maximum material recovery."
            ]
            guidance["data_sanitization_steps"] = [
                "1. Backup all personal data to cloud or external storage.",
                "2. Sign out of all accounts (Apple ID, Google, Samsung, Microsoft).",
                "3. Perform factory data reset with cryptographic storage erasure.",
                "4. Remove physical SIM cards, SD cards, and dongles."
            ]
            guidance["battery_precautions"] = [
                "Do not attempt to puncture, bend, or incinerate embedded lithium-ion cells."
            ]
        elif handling_priority == "hazardous" or code in ("BATTERY", "PCB"):
            guidance["safety_instructions"] = [
                "Handle with non-conductive gloves if terminals are exposed or corroded.",
                "Tape exposed metallic terminals with non-conductive electrical tape.",
                "Keep completely isolated from flammable materials, liquids, and direct sunlight."
            ]
            guidance["battery_precautions"] = [
                "Strict hazardous material protocol: Never crush, incinerate, or expose to water.",
                "If swollen or leaking, place immediately in sand or specialized vermiculite fire bag."
            ]
        else:
            guidance["safety_instructions"] = [
                "Unplug from mains electrical outlet and allow cooling if applicable.",
                "Neatly bundle cords using twist ties.",
                "Keep plastic enclosures intact to avoid sharp fragment exposure."
            ]

        return guidance
