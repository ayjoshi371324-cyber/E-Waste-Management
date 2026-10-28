import io
import logging
import os
from typing import Any, Dict, List, Tuple
from uuid import UUID, uuid4

from PIL import Image
import pypdf

from app.ai.classifier import classify_image, classify_pil_image
from app.config import get_settings
from app.repositories.base import AIAnalysisReport, DevicePhotoMeta
from app.repositories.factory import get_repos

logger = logging.getLogger(__name__)


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
        # Validate file size
        if len(file_bytes) > self.settings.MAX_UPLOAD_SIZE_BYTES:
            max_mb = self.settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)
            raise ValueError(f"File size exceeds maximum permitted limit ({max_mb} MB).")

        if len(file_bytes) == 0:
            raise ValueError("The uploaded file is empty.")

        ext = os.path.splitext(original_filename)[1].lower()
        is_pdf = content_type.lower() == "application/pdf" or ext == ".pdf"
        allowed_image_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]

        if not is_pdf and content_type.lower() not in allowed_image_types and ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            raise ValueError(
                f"Unsupported file type '{content_type}'. Please upload an image (JPEG, PNG, WebP) or a PDF document."
            )

        photo_id = uuid4()
        upload_dir = self.settings.UPLOAD_DIR
        os.makedirs(upload_dir, exist_ok=True)

        if is_pdf:
            return await self._process_pdf(
                file_bytes=file_bytes,
                original_filename=original_filename,
                photo_id=photo_id,
                user_id=user_id,
                upload_dir=upload_dir,
            )
        else:
            return await self._process_image(
                file_bytes=file_bytes,
                original_filename=original_filename,
                content_type=content_type,
                photo_id=photo_id,
                user_id=user_id,
                upload_dir=upload_dir,
                ext=ext or ".jpg",
            )

    async def _process_pdf(
        self,
        file_bytes: bytes,
        original_filename: str,
        photo_id: UUID,
        user_id: UUID,
        upload_dir: str,
    ) -> Dict[str, Any]:
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        except Exception as e:
            logger.error("Failed to parse PDF %s: %s", original_filename, e)
            raise ValueError("The uploaded PDF file is invalid or corrupted.")

        if reader.is_encrypted:
            raise ValueError("The uploaded PDF is password-protected. Please upload an unencrypted document.")

        page_count = len(reader.pages)
        if page_count == 0:
            raise ValueError("The uploaded PDF document contains no pages.")

        extracted_images: List[Tuple[int, str, Image.Image]] = []
        for page_idx, page in enumerate(reader.pages):
            try:
                for img_obj in page.images:
                    pil_img = img_obj.image.convert("RGB")
                    extracted_images.append((page_idx + 1, img_obj.name, pil_img))
            except Exception as e:
                logger.warning("Error reading images from page %d of %s: %s", page_idx + 1, original_filename, e)

        if not extracted_images:
            raise ValueError(
                "No electronic waste images could be extracted from the uploaded PDF. "
                "Please upload a PDF containing photos/scans of electronic waste or upload image files directly."
            )

        # Classify each extracted image and pick the best e-waste candidate
        scored_candidates = []
        for page_num, img_name, pil_img in extracted_images:
            code, conf, low, preds = classify_pil_image(pil_img, hint_filename=original_filename)
            scored_candidates.append({
                "page": page_num,
                "name": img_name,
                "img": pil_img,
                "code": code,
                "confidence": conf,
                "is_low": low,
                "predictions": preds,
            })

        # Prefer non-NON_EWASTE predictions with highest confidence; fallback to highest confidence candidate
        ew_candidates = [c for c in scored_candidates if c["code"] != "NON_EWASTE"]
        if ew_candidates:
            primary = max(ew_candidates, key=lambda c: c["confidence"])
        else:
            primary = max(scored_candidates, key=lambda c: c["confidence"])

        # Save the primary extracted image as JPEG for visual preview in frontend
        preview_filename = f"{photo_id}.jpg"
        preview_path = os.path.join(upload_dir, preview_filename)
        primary["img"].save(preview_path, format="JPEG", quality=90)

        # Save the original PDF document
        pdf_filename = f"{photo_id}.pdf"
        pdf_path = os.path.join(upload_dir, pdf_filename)
        with open(pdf_path, "wb") as f:
            f.write(file_bytes)

        # Persist photo metadata
        photo_meta = DevicePhotoMeta(
            photo_id=photo_id,
            original_filename=original_filename,
            storage_path=preview_path,
            mime_type="application/pdf",
            file_size_bytes=len(file_bytes),
            uploaded_by=user_id,
        )
        await self.repos.device_photos.save_photo_metadata(photo_meta)

        # Persist AI analysis report
        report_id = uuid4()
        report = AIAnalysisReport(
            report_id=report_id,
            photo_id=photo_id,
            model_name="MobileNetV3-Small",
            predicted_category_code=primary["code"],
            confidence_score=primary["confidence"],
            is_low_confidence=primary["is_low"],
            top_k=primary["predictions"],
        )
        await self.repos.ai_reports.save_analysis_report(report)

        return {
            "photo_id": photo_id,
            "predicted_category_code": primary["code"],
            "confidence": primary["confidence"],
            "is_low_confidence": primary["is_low"],
            "top_predictions": primary["predictions"],
            "storage_url": f"/uploads/{preview_filename}",
            "disclaimer": "Predictions are assistive suggestions, not certified safety assessments. Verify the category prior to submission.",
            "is_pdf": True,
            "page_count": page_count,
            "images_detected": len(extracted_images),
        }

    async def _process_image(
        self,
        file_bytes: bytes,
        original_filename: str,
        content_type: str,
        photo_id: UUID,
        user_id: UUID,
        upload_dir: str,
        ext: str,
    ) -> Dict[str, Any]:
        # Validate PIL Image opening
        try:
            with Image.open(io.BytesIO(file_bytes)) as pil_img:
                pil_img.verify()
        except Exception as e:
            raise ValueError("The uploaded image file is corrupted or not a valid image format.")

        stored_filename = f"{photo_id}{ext}"
        file_path = os.path.join(upload_dir, stored_filename)

        with open(file_path, "wb") as f:
            f.write(file_bytes)

        # Persist photo metadata
        photo_meta = DevicePhotoMeta(
            photo_id=photo_id,
            original_filename=original_filename,
            storage_path=file_path,
            mime_type=content_type,
            file_size_bytes=len(file_bytes),
            uploaded_by=user_id,
        )
        await self.repos.device_photos.save_photo_metadata(photo_meta)

        # Run genuine AI classification
        best_code, confidence, is_low_conf, top_k = classify_image(file_path, hint_filename=original_filename)

        # Persist AI analysis report
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
            "disclaimer": "Predictions are assistive suggestions, not certified safety assessments. Verify the category prior to submission.",
            "is_pdf": False,
        }
