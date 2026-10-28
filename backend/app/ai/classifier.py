# PyTorch MobileNetV3 Image Classifier for E-Waste Recycling
# Genuine inference pipeline using torchvision MobileNetV3-Small
import io
import logging
import os
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from PIL import Image

from app.config import get_settings

logger = logging.getLogger(__name__)

# Global cached model and transforms
_MODEL = None
_TRANSFORMS = None
_CATEGORIES = None


def _load_model():
    global _MODEL, _TRANSFORMS, _CATEGORIES
    if _MODEL is not None:
        return _MODEL, _TRANSFORMS, _CATEGORIES

    try:
        import torch
        import torchvision.models as models

        weights = models.MobileNet_V3_Small_Weights.DEFAULT
        _TRANSFORMS = weights.transforms()
        _CATEGORIES = weights.meta["categories"]

        # Directly load from local torch checkpoints cache if present for instant offline loading
        cache_path = os.path.expanduser("~/.cache/torch/hub/checkpoints/mobilenet_v3_small-047dcff4.pth")
        model = models.mobilenet_v3_small(weights=None)
        if os.path.exists(cache_path):
            state_dict = torch.load(cache_path, map_location="cpu", weights_only=True)
            model.load_state_dict(state_dict)
            logger.info("MobileNetV3-Small weights loaded offline from %s", cache_path)
        else:
            model = models.mobilenet_v3_small(weights=weights)

        model.eval()
        _MODEL = model
        logger.info("MobileNetV3-Small loaded successfully with ImageNet-1K pretrained weights.")
        return _MODEL, _TRANSFORMS, _CATEGORIES
    except Exception as e:
        logger.error("Failed to initialize PyTorch MobileNetV3 model: %s", e)
        return None, None, None


# ImageNet-1K indices mapped to E-Waste categories
# 1000 classes mapped to domain recycling categories
EW_MAPPINGS: Dict[str, List[int]] = {
    "LAPTOP": [620, 681],  # laptop, notebook computer
    "SMARTPHONE": [487, 528, 707],  # cellular telephone, dial phone, pay-phone
    "TABLET": [590],  # hand-held computer
    "MONITOR": [664, 782, 851, 527],  # monitor, screen, television, desktop computer
    "KEYBOARD_PERIPHERAL": [508, 673, 613, 878, 761],  # keyboard, mouse, joystick, typewriter keyboard, remote
    "CHARGER_CABLE": [844, 662, 745],  # switch/plug, modem, projector
    "SMALL_APPLIANCE": [
        481, 482, 485, 509, 530, 531, 534, 545, 606, 632, 650, 651,
        713, 732, 742, 754, 759, 760, 778, 811, 826, 848, 859, 882,
        891, 892, 897,
    ],
}

# ImageNet classes that are definitively non-electronics (people, garments, vehicles, food, animals, paper)
NON_ELECTRONIC_PATTERNS = [
    "seat belt", "neck brace", "military uniform", "suit", "jersey", "t-shirt",
    "bow tie", "sunglasses", "wig", "fur coat", "swimming trunks", "pajamas",
    "web site", "menu", "rule", "comic book", "envelope", "packet", "binder",
    "book jacket", "crossword", "jigsaw", "restaurant", "theater curtain",
    "dog", "cat", "bird", "fish", "horse", "tree", "flower", "fruit", "vegetable",
]


def _extract_circuit_visual_features(pil_img: Image.Image) -> float:
    """Detects visual characteristics typical of circuit boards (PCBs):
    green/copper hues, high edge frequency, metallic traces."""
    try:
        thumb = pil_img.resize((120, 120)).convert("RGB")
        arr = np.array(thumb, dtype=np.float32) / 255.0
        r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

        # Solder mask green ratio (typical FR4 green PCB)
        green_mask = (g > 0.28) & (g > r * 1.22) & (g > b * 1.18)
        green_ratio = float(np.mean(green_mask))

        # Trace / pad variance
        gray = 0.2989 * r + 0.5870 * g + 0.1140 * b
        edges_x = np.abs(gray[:, 1:] - gray[:, :-1])
        edges_y = np.abs(gray[1:, :] - gray[:-1, :])
        edge_energy = float(np.mean(edges_x) + np.mean(edges_y))

        # Circuit board score combines solder-mask coloration and high-density trace edges
        pcb_score = (green_ratio * 2.5) + (edge_energy * 0.4)
        return min(max(pcb_score, 0.0), 1.0)
    except Exception:
        return 0.0


def _extract_battery_visual_features(pil_img: Image.Image) -> float:
    """Detects visual characteristics typical of battery packs:
    cylindrical aspect ratio, metallic caps/leads, dark/blue high-contrast wrappers."""
    try:
        w, h = pil_img.size
        aspect_ratio = max(w / max(h, 1), h / max(w, 1))

        thumb = pil_img.resize((100, 100)).convert("RGB")
        arr = np.array(thumb, dtype=np.float32) / 255.0
        r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

        # Dark or reflective casing
        dark_ratio = float(np.mean((r < 0.25) & (g < 0.25) & (b < 0.25)))
        contrast = float(np.std(arr))

        battery_score = 0.0
        if 1.4 < aspect_ratio < 6.0 and dark_ratio > 0.35 and contrast > 0.18:
            battery_score = 0.45 + min(dark_ratio * 0.5, 0.35)
        return min(max(battery_score, 0.0), 1.0)
    except Exception:
        return 0.0


def classify_pil_image(
    pil_img: Image.Image,
    hint_filename: str = "",
) -> Tuple[str, float, bool, List[Dict[str, Any]]]:
    """Runs genuine PyTorch MobileNetV3 classification on a PIL image.
    Normalizes probabilities across categories to 100% and detects non-e-waste.
    """
    settings = get_settings()
    threshold = settings.AI_CONFIDENCE_THRESHOLD

    model, transforms, categories = _load_model()
    if model is None:
        # Fallback if torch cannot be loaded
        logger.warning("Torch model unavailable, returning low confidence non-e-waste.")
        return "NON_EWASTE", 0.10, True, [{"category_code": "NON_EWASTE", "confidence": 1.0}]

    import torch

    # Preprocess image
    rgb_img = pil_img.convert("RGB")
    tensor = transforms(rgb_img).unsqueeze(0)

    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1)[0].numpy()

    top1_idx = int(probs.argmax())
    top1_class = categories[top1_idx]
    top1_prob = float(probs[top1_idx])

    # Check for visual PCB & battery features
    pcb_visual = _extract_circuit_visual_features(rgb_img)
    battery_visual = _extract_battery_visual_features(rgb_img)

    # Calculate raw scores for all e-waste categories
    cat_scores: Dict[str, float] = {}
    for cat, idxs in EW_MAPPINGS.items():
        cat_scores[cat] = float(sum(probs[i] for i in idxs))

    # Add PCB & Battery scores
    cat_scores["PCB"] = pcb_visual
    cat_scores["BATTERY"] = battery_visual

    total_ew_mass = sum(cat_scores.values())

    # Check non-electronic dominance
    is_non_electronic_dominant = any(pat in top1_class.lower() for pat in NON_ELECTRONIC_PATTERNS)

    # Non-e-waste condition:
    # 1. Total e-waste mass is below 0.12 AND non-electronic dominates or top1 is non-electronic
    # 2. Or top1 probability is high (> 0.25) and it is definitively non-electronic (e.g. website, seat belt, uniform)
    if (total_ew_mass < 0.12 and is_non_electronic_dominant) or (top1_prob > 0.25 and is_non_electronic_dominant and total_ew_mass < 0.20):
        # Image does not contain electronic waste
        confidence = float(min(max(1.0 - total_ew_mass, 0.70), 0.99))
        is_low_conf = True

        # Generate normalized probability distribution
        top_sorted = sorted(cat_scores.items(), key=lambda x: -x[1])[:4]
        remaining_conf = 1.0 - confidence
        denom = sum(score for _, score in top_sorted) or 1.0

        top_preds = [{"category_code": "NON_EWASTE", "confidence": round(confidence, 4)}]
        for c, s in top_sorted:
            share = (s / denom) * remaining_conf
            top_preds.append({"category_code": c, "confidence": round(share, 4)})

        # Ensure exact 100% sum
        diff = 1.0 - sum(p["confidence"] for p in top_preds)
        top_preds[0]["confidence"] = round(top_preds[0]["confidence"] + diff, 4)

        return "NON_EWASTE", confidence, is_low_conf, top_preds

    # Valid E-Waste Image: find best e-waste category
    best_cat, best_raw = max(cat_scores.items(), key=lambda x: x[1])

    # Calibrate confidence using softmax over category scores
    scores_array = np.array(list(cat_scores.values()), dtype=np.float32)
    # Temperature scaled softmax
    exp_scores = np.exp((scores_array - np.max(scores_array)) * 4.0)
    norm_probs = exp_scores / np.sum(exp_scores)

    category_keys = list(cat_scores.keys())
    prob_dict = {category_keys[i]: float(norm_probs[i]) for i in range(len(category_keys))}

    # Sort categories by normalized probability
    sorted_cats = sorted(prob_dict.items(), key=lambda x: -x[1])

    # Select top 5 categories
    top5 = sorted_cats[:5]
    top5_sum = sum(p for _, p in top5)
    
    top_preds: List[Dict[str, Any]] = []
    for cat, p in top5:
        norm_p = p / top5_sum
        top_preds.append({"category_code": cat, "confidence": round(norm_p, 4)})

    # Ensure total strictly equals 1.000 (100%)
    curr_sum = sum(p["confidence"] for p in top_preds)
    top_preds[0]["confidence"] = round(top_preds[0]["confidence"] + (1.0 - curr_sum), 4)

    best_code = top_preds[0]["category_code"]
    best_confidence = float(top_preds[0]["confidence"])
    is_low_conf = best_confidence < threshold

    return best_code, best_confidence, is_low_conf, top_preds


def classify_image(file_path: str, hint_filename: str = "") -> Tuple[str, float, bool, List[Dict[str, Any]]]:
    """Classifies an image from disk."""
    try:
        with Image.open(file_path) as img:
            return classify_pil_image(img, hint_filename=hint_filename)
    except Exception as e:
        logger.error("Error reading image at %s: %s", file_path, e)
        return "NON_EWASTE", 0.0, True, [{"category_code": "NON_EWASTE", "confidence": 1.0}]
