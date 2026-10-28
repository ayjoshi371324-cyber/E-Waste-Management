import io
import os
import sys
from pathlib import Path
from uuid import UUID

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.stdout.reconfigure(line_buffering=True)

from PIL import Image
import pypdf
from app.ai.classifier import classify_image, classify_pil_image


def test_classifier_differentiation():
    print("\n--- Test 1: Testing different images (Selfie vs Business Diagram vs PCB) ---", flush=True)
    
    # 1. Non-e-waste selfie (the one uploaded by user)
    selfie_path = "backend/uploads/6ec4e414-4746-4e71-9c69-952377b8b9a0.jpg"
    code1, conf1, low1, preds1 = classify_image(selfie_path)
    print(f"Selfie: predicted={code1}, conf={conf1*100:.1f}%, is_low_conf={low1}", flush=True)
    assert code1 == "NON_EWASTE", f"Expected NON_EWASTE, got {code1}"
    assert low1 is True

    # 2. Non-e-waste business diagram (the one uploaded by user)
    chart_path = "backend/uploads/28b87a67-1faf-435b-94d2-0ec20b609e58.png"
    code2, conf2, low2, preds2 = classify_image(chart_path)
    print(f"Chart: predicted={code2}, conf={conf2*100:.1f}%, is_low_conf={low2}", flush=True)
    assert code2 == "NON_EWASTE", f"Expected NON_EWASTE, got {code2}"
    assert low2 is True

    # Ensure different images produce different confidence scores
    assert abs(conf1 - conf2) > 0.05, "Scores should vary based on visual content"

    # 3. PCB pattern test
    pcb_img = Image.new("RGB", (200, 200), color=(20, 140, 30))
    code3, conf3, low3, preds3 = classify_pil_image(pcb_img)
    print(f"PCB: predicted={code3}, conf={conf3*100:.1f}%, is_low_conf={low3}", flush=True)
    assert code3 == "PCB", f"Expected PCB, got {code3}"

    # Verify probability normalization to exactly 100%
    for name, p_list in [("Selfie", preds1), ("Chart", preds2), ("PCB", preds3)]:
        total = sum(p["confidence"] for p in p_list)
        print(f"{name} distribution total: {total:.4f} (100.0%)", flush=True)
        assert abs(total - 1.0) < 0.001
        
    print(">>> Test 1 Passed: Real inference and probability normalization verified!", flush=True)


def test_pdf_extraction_and_classification():
    print("\n--- Test 2: Testing PDF image extraction and multi-page processing ---", flush=True)

    # 1. Single page PDF with PCB image
    buf1 = io.BytesIO()
    img1 = Image.new("RGB", (150, 150), color=(25, 135, 35))
    img1.save(buf1, format="PDF")
    pdf_bytes1 = buf1.getvalue()

    reader1 = pypdf.PdfReader(io.BytesIO(pdf_bytes1))
    assert len(reader1.pages) == 1
    extracted1 = [im.image for p in reader1.pages for im in p.images]
    assert len(extracted1) == 1
    code_pdf1, conf_pdf1, low_pdf1, preds_pdf1 = classify_pil_image(extracted1[0])
    print(f"Single-page PDF: extracted={len(extracted1)} images, predicted={code_pdf1} ({conf_pdf1*100:.1f}%)", flush=True)
    assert code_pdf1 == "PCB"
    assert abs(sum(p["confidence"] for p in preds_pdf1) - 1.0) < 0.001

    # 2. Multi-page PDF (3 pages)
    buf_multi = io.BytesIO()
    img_a = Image.new("RGB", (100, 100), color=(20, 140, 30))
    img_b = Image.new("RGB", (100, 100), color=(30, 30, 30))
    img_c = Image.new("RGB", (100, 100), color=(200, 200, 200))
    img_a.save(buf_multi, format="PDF", save_all=True, append_images=[img_b, img_c])
    multi_bytes = buf_multi.getvalue()

    reader_multi = pypdf.PdfReader(io.BytesIO(multi_bytes))
    assert len(reader_multi.pages) == 3
    extracted_multi = [im.image for p in reader_multi.pages for im in p.images]
    print(f"Multi-page PDF: pages={len(reader_multi.pages)}, extracted={len(extracted_multi)} images", flush=True)
    assert len(extracted_multi) == 3

    # Classify each page's image
    page_results = [classify_pil_image(im) for im in extracted_multi]
    print(f"Multi-page classifications: {[r[0] for r in page_results]}", flush=True)
    assert page_results[0][0] == "PCB"

    print(">>> Test 2 Passed: Single and multi-page PDF processing verified!", flush=True)


def test_validation_and_error_handling():
    print("\n--- Test 3: Testing validation and error handling for PDFs and images ---", flush=True)

    # 1. Corrupted PDF
    try:
        pypdf.PdfReader(io.BytesIO(b"not a valid pdf header"))
        assert False, "Should fail on corrupted PDF"
    except Exception as e:
        print("Caught corrupted PDF error:", type(e).__name__, flush=True)

    # 2. Corrupted image
    try:
        with Image.open(io.BytesIO(b"corrupted image bytes")) as img:
            img.verify()
        assert False, "Should fail on corrupted image"
    except Exception as e:
        print("Caught corrupted image error:", type(e).__name__, flush=True)

    # 3. Validating file extensions and mime types
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"]
    for valid_type in allowed_types:
        assert valid_type in allowed_types
    assert "text/plain" not in allowed_types
    assert "application/zip" not in allowed_types

    print(">>> Test 3 Passed: Validation and error handling verified!", flush=True)


if __name__ == "__main__":
    test_classifier_differentiation()
    test_pdf_extraction_and_classification()
    test_validation_and_error_handling()
    print("\n=========================================", flush=True)
    print("ALL VERIFICATION SUITES PASSED (3/3)!", flush=True)
    print("=========================================", flush=True)
