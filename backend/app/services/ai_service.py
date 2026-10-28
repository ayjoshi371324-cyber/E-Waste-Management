import os
from typing import Any, Dict, List
from uuid import UUID, uuid4

from app.ai.classifier import classify_image
from app.config import get_settings
from app.repositories.base import AIAnalysisReport, DevicePhotoMeta
from app.repositories.factory import get_repos


class AIService:
    def __init__(self):
        self.repos = get_repos()
        self.settings = get_settings()

    async def process_and_classify_upload(
        self,
        file_bytes: bytes,
        original_filename: str,
        content_type: str,
        user_id: UUID,
    ) -> Dict[str, Any]:
        # Validate MIME type
        allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
        if content_type.lower() not in allowed_types:
            raise ValueError(f"Invalid file type '{content_type}'. Only JPEG, PNG, and WebP are accepted.")

        # Validate file size
        if len(file_bytes) > self.settings.MAX_UPLOAD_SIZE_BYTES:
            raise ValueError(f"File size exceeds maximum permitted limit ({self.settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB).")

        # Save to local uploads directory with UUID filename
        ext = os.path.splitext(original_filename)[1].lower() or ".jpg"
        photo_id = uuid4()
        stored_filename = f"{photo_id}{ext}"
        upload_dir = self.settings.UPLOAD_DIR
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, stored_filename)

        with open(file_path, "wb") as f:
            f.write(file_bytes)

        # Persist photo metadata to PostgreSQL device_photo_metadata table
        photo_meta = DevicePhotoMeta(
            photo_id=photo_id,
            original_filename=original_filename,
            storage_path=file_path,
            mime_type=content_type,
            file_size_bytes=len(file_bytes),
            uploaded_by=user_id,
        )
        await self.repos.device_photos.save_photo_metadata(photo_meta)

        # Run AI classification
        best_code, confidence, is_low_conf, top_k = classify_image(file_path, hint_filename=original_filename)

        # Persist AI analysis report to PostgreSQL ai_analysis_reports table (top_k stored as JSONB)
        report_id = uuid4()
        report = AIAnalysisReport(
            report_id=report_id,
            photo_id=photo_id,
            model_name="MobileNetV3-Small",
            predicted_category_code=best_code,
            confidence_score=confidence,
            is_low_confidence=is_low_conf,
            top_k=top_k,
        )
        await self.repos.ai_reports.save_analysis_report(report)

        return {
            "photo_id": photo_id,
            "predicted_category_code": best_code,
            "confidence": confidence,
            "is_low_confidence": is_low_conf,
            "top_predictions": top_k,
            "storage_url": f"/uploads/{stored_filename}",
            "disclaimer": "Predictions are suggestions, not certified safety assessments. Verify the category prior to submission."
        }
