from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import require_admin
from app.repositories.base import User
from app.schemas.domain import CategoryCreateRequest, CategoryDetailResponse, CategoryResponse
from app.services.catalog_service import CatalogService

router = APIRouter(prefix="/api/v1/categories", tags=["Device Categories"])
catalog_service = CatalogService()


@router.get("", response_model=List[CategoryResponse])
async def list_categories():
    categories = await catalog_service.list_categories(active_only=True)
    return [
        CategoryResponse(
            category_id=c.category_id,
            code=c.code,
            name=c.name,
            description=c.description,
            handling_priority=c.handling_priority,
            base_points=c.base_points,
            points_per_kg=c.points_per_kg,
            is_active=c.is_active,
        )
        for c in categories
    ]


@router.get("/{category_id}", response_model=CategoryDetailResponse)
async def get_category(category_id: UUID):
    category = await catalog_service.get_category(category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")

    materials = await catalog_service.get_category_materials(category_id)
    guidance = catalog_service.get_handling_guidance(category.code, category.handling_priority)

    return CategoryDetailResponse(
        category_id=category.category_id,
        code=category.code,
        name=category.name,
        description=category.description,
        handling_priority=category.handling_priority,
        base_points=category.base_points,
        points_per_kg=category.points_per_kg,
        is_active=category.is_active,
        materials=[m.model_dump() for m in materials],
        safety_guidance=guidance,
    )


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    req: CategoryCreateRequest,
    admin: User = Depends(require_admin),
):
    try:
        cat = await catalog_service.repos.catalog.create_category(
            code=req.code,
            name=req.name,
            description=req.description,
            handling_priority=req.handling_priority,
            base_points=req.base_points,
            points_per_kg=req.points_per_kg,
        )
        return CategoryResponse(
            category_id=cat.category_id,
            code=cat.code,
            name=cat.name,
            description=cat.description,
            handling_priority=cat.handling_priority,
            base_points=cat.base_points,
            points_per_kg=cat.points_per_kg,
            is_active=cat.is_active,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
