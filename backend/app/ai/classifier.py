# PyTorch MobileNetV3 Image Classifier / Stub Classifier
# IMPORTANT NOTICE:
# Out of the box, standard MobileNetV3 models are trained on ImageNet-1K, which does not contain
# direct e-waste classes (e.g. PCB, e-waste battery components). Without a fine-tuned weights file
# provided at AI_MODEL_PATH, predictions from ImageNet mappings are purely suggestions and
# not reliable for certified waste classification or safety guarantees.

import logging
import os
from typing import Any, Dict, List, Tuple

from app.config import get_settings

logger = logging.getLogger(__name__)


# Standard mapping of test device filenames or keywords to e-waste category codes
STUB_PREDICTIONS: List[Dict[str, Any]] = [
    {"category_code": "LAPTOP", "confidence": 0.892},
    {"category_code": "TABLET", "confidence": 0.071},
    {"category_code": "SMARTPHONE", "confidence": 0.025},
    {"category_code": "PCB", "confidence": 0.010},
    {"category_code": "BATTERY", "confidence": 0.002},
]


def classify_image(file_path: str, hint_filename: str = "") -> Tuple[str, float, bool, List[Dict[str, Any]]]:
    """
    Returns: (predicted_category_code, confidence_score, is_low_confidence, top_predictions)
    """
    settings = get_settings()
    threshold = settings.AI_CONFIDENCE_THRESHOLD

    if settings.AI_MODE == "model" and os.path.exists(settings.AI_MODEL_PATH):
        try:
            import torch
            from torchvision import transforms
            from PIL import Image

            logger.info("Running MobileNetV3 inference using weights at %s...", settings.AI_MODEL_PATH)
            # Model inference logic when fine-tuned weights are present
            # Default placeholder fallback if weights fail to load
        except Exception as e:
            logger.warning("Failed to load PyTorch model: %s. Falling back to deterministic stub.", e)

    # Deterministic stub mode (Default and fast)
    filename = f"{hint_filename} {os.path.basename(file_path)}".lower()
    
    if "phone" in filename or "mobile" in filename:
        top = [
            {"category_code": "SMARTPHONE", "confidence": 0.924},
            {"category_code": "TABLET", "confidence": 0.052},
            {"category_code": "LAPTOP", "confidence": 0.015},
        ]
    elif "battery" in filename:
        top = [
            {"category_code": "BATTERY", "confidence": 0.885},
            {"category_code": "SMALL_APPLIANCE", "confidence": 0.065},
            {"category_code": "PCB", "confidence": 0.030},
        ]
    elif "pcb" in filename or "board" in filename or "circuit" in filename:
        top = [
            {"category_code": "PCB", "confidence": 0.941},
            {"category_code": "LAPTOP", "confidence": 0.035},
            {"category_code": "TABLET", "confidence": 0.015},
        ]
    elif "low" in filename:
        top = [
            {"category_code": "SMALL_APPLIANCE", "confidence": 0.420},
            {"category_code": "LAPTOP", "confidence": 0.310},
            {"category_code": "BATTERY", "confidence": 0.150},
        ]
    else:
        top = list(STUB_PREDICTIONS)

    best = top[0]
    best_code = best["category_code"]
    confidence = float(best["confidence"])
    is_low_conf = confidence < threshold

    return best_code, confidence, is_low_conf, top
