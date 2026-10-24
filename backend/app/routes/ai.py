from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.deps import get_current_user
from app.repositories.base import User
from app.schemas.domain import AIClassifyResponse
from app.services.ai_service import AIService

router = APIRouter(prefix="/api/v1/ai", tags=["AI Image Classification"])
ai_service = AIService()


@router.post("/classify-device", response_model=AIClassifyResponse)
async def classify_device(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    try:
        file_bytes = await file.read()
        res = await ai_service.process_and_classify_upload(
            file_bytes=file_bytes,
            original_filename=file.filename or "upload.jpg",
            content_type=file.content_type or "image/jpeg",
            user_id=user.id,
        )
        return AIClassifyResponse(**res)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Image classification failed: {str(e)}")
