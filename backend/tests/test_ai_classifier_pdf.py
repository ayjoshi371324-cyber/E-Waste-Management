import io
from PIL import Image
import pypdf
import pytest
from httpx import AsyncClient

from app.ai.classifier import classify_image, classify_pil_image


def create_test_image_bytes(color=(34, 139, 34), size=(200, 200), fmt="JPEG") -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=fmt)
    return buf.getvalue()


def create_test_pdf_bytes(num_pages: int = 1, color=(34, 139, 34)) -> bytes:
    buf = io.BytesIO()
    images = [Image.new("RGB", (200, 200), color=color) for _ in range(num_pages)]
    if num_pages == 1:
        images[0].save(buf, format="PDF")
    else:
        images[0].save(buf, format="PDF", save_all=True, append_images=images[1:])
    return buf.getvalue()


@pytest.mark.asyncio
async def test_ai_photo_classification_real_image(citizen_client: AsyncClient):
    print("\n--- STEP 1: test started ---")
    img_bytes = create_test_image_bytes(color=(30, 30, 30))
    print("--- STEP 2: created test image bytes ---")
    files = {"file": ("device_photo.jpg", img_bytes, "image/jpeg")}
    print("--- STEP 3: posting to classify endpoint ---")
    resp = await citizen_client.post("/api/v1/ai/classify-device", files=files)
    print("--- STEP 4: response received ---", resp.status_code)
    assert resp.status_code == 200
    data = resp.json()
    assert "predicted_category_code" in data
    assert "confidence" in data
    assert "top_predictions" in data
    assert len(data["top_predictions"]) >= 3

    # Check probability distribution sums to 1.0 (100%)
    prob_sum = sum(p["confidence"] for p in data["top_predictions"])
    assert abs(prob_sum - 1.0) < 0.01


@pytest.mark.asyncio
async def test_ai_pdf_classification_single_and_multipage(citizen_client: AsyncClient):
    # Single page PDF
    pdf_bytes = create_test_pdf_bytes(num_pages=1, color=(20, 120, 40))
    files = {"file": ("device_spec.pdf", pdf_bytes, "application/pdf")}
    resp = await citizen_client.post("/api/v1/ai/classify-device", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_pdf"] is True
    assert data["page_count"] == 1
    assert data["images_detected"] >= 1
    assert "predicted_category_code" in data

    # Multi page PDF
    pdf_multi_bytes = create_test_pdf_bytes(num_pages=3, color=(40, 40, 40))
    files_multi = {"file": ("electronics_catalog.pdf", pdf_multi_bytes, "application/pdf")}
    resp_multi = await citizen_client.post("/api/v1/ai/classify-device", files=files_multi)
    assert resp_multi.status_code == 200
    data_multi = resp_multi.json()
    assert data_multi["is_pdf"] is True
    assert data_multi["page_count"] == 3
    assert data_multi["images_detected"] >= 3


@pytest.mark.asyncio
async def test_ai_invalid_and_corrupted_files(citizen_client: AsyncClient):
    # Corrupted image bytes
    corrupt_files = {"file": ("broken.jpg", b"not-a-real-image-bytes", "image/jpeg")}
    resp_img = await citizen_client.post("/api/v1/ai/classify-device", files=corrupt_files)
    assert resp_img.status_code == 400
    assert "corrupted" in resp_img.json()["detail"].lower()

    # Corrupted PDF bytes
    corrupt_pdf = {"file": ("broken.pdf", b"not-a-real-pdf-bytes", "application/pdf")}
    resp_pdf = await citizen_client.post("/api/v1/ai/classify-device", files=corrupt_pdf)
    assert resp_pdf.status_code == 400
    assert "invalid or corrupted" in resp_pdf.json()["detail"].lower()

    # Unsupported file type
    txt_files = {"file": ("document.txt", b"plain text content", "text/plain")}
    resp_txt = await citizen_client.post("/api/v1/ai/classify-device", files=txt_files)
    assert resp_txt.status_code == 400
    assert "unsupported file type" in resp_txt.json()["detail"].lower()


@pytest.mark.asyncio
async def test_different_images_produce_different_predictions():
    # 1. Non-e-waste selfie
    selfie_path = "backend/uploads/6ec4e414-4746-4e71-9c69-952377b8b9a0.jpg"
    selfie_code, selfie_conf, selfie_low, selfie_preds = classify_image(selfie_path)
    assert selfie_code == "NON_EWASTE"
    assert selfie_low is True

    # 2. Non-e-waste business model chart
    chart_path = "backend/uploads/28b87a67-1faf-435b-94d2-0ec20b609e58.png"
    chart_code, chart_conf, chart_low, chart_preds = classify_image(chart_path)
    assert chart_code == "NON_EWASTE"
    assert chart_low is True
    assert abs(selfie_conf - chart_conf) > 0.05  # Scores differ genuinely!

    # 3. Circuit board image (green solder-mask)
    pcb_img = Image.new("RGB", (200, 200), color=(20, 140, 30))
    pcb_code, pcb_conf, pcb_low, pcb_preds = classify_pil_image(pcb_img)
    assert pcb_code == "PCB"
    assert pcb_conf > 0.50

    # Ensure probabilities sum to 100%
    for preds in [selfie_preds, chart_preds, pcb_preds]:
        total = sum(p["confidence"] for p in preds)
        assert abs(total - 1.0) < 0.001
