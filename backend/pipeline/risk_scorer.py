"""
Pipeline Stage 8: Risk Scoring
Combines signals from all previous stages into a Low/Medium/High risk score.
"""

WEIGHTS = {
    "missing_fields": 30,
    "unknown_vendor": 30,
    "blocked_vendor": 40,
    "confirmed_duplicate": 40,
    "potential_duplicate": 20,
    "po_mismatch": 15,
    "amount_variance": 15,
    "low_ocr_confidence": 15,
    "fuzzy_po_only": 10,
}

LOW_THRESHOLD = 20
HIGH_THRESHOLD = 50


def run(context: dict) -> dict:
    """
    Stage 8: Compute risk score and level.
    """
    score = 0
    flags = []

    # Missing fields
    validation = context.get("validation", {})
    if not validation.get("passed", True):
        score += WEIGHTS["missing_fields"]
        flags.append(f"Missing required fields: {', '.join(validation.get('failed_fields', []))}")

    # Vendor issues
    vendor = context.get("vendor_check", {})
    vendor_result = vendor.get("result", "")
    if vendor_result == "UNKNOWN_VENDOR":
        score += WEIGHTS["unknown_vendor"]
        flags.append("Vendor not found in master list")
    elif vendor_result == "BLOCKED_VENDOR":
        score += WEIGHTS["blocked_vendor"]
        flags.append("Vendor is blocked")

    # Duplicate
    dup = context.get("duplicate", {})
    dup_result = dup.get("result", "")
    if dup_result == "CONFIRMED_DUPLICATE":
        score += WEIGHTS["confirmed_duplicate"]
        flags.append("Confirmed duplicate invoice")
    elif dup_result == "POTENTIAL_DUPLICATE":
        score += WEIGHTS["potential_duplicate"]
        flags.append("Potential duplicate found in history")

    # PO match issues
    po = context.get("po_match", {})
    po_status = po.get("status", "")
    if po_status == "FAIL":
        score += WEIGHTS["po_mismatch"]
        flags.append("No matching PO found")
    elif po.get("method") == "fuzzy" and po_status != "FAIL":
        score += WEIGHTS["fuzzy_po_only"]
        flags.append("PO matched by fuzzy logic only (no direct reference)")

    # Amount variance
    recon = context.get("reconciliation", {})
    if recon.get("status") == "REVIEW":
        score += WEIGHTS["amount_variance"]
        flags.append(f"Amount variance: {recon.get('difference_pct', 0):.1f}%")

    # OCR confidence
    ocr_confidence = context.get("extraction", {}).get("fields", {}).get("ocr_confidence", 1.0)
    if ocr_confidence is not None and ocr_confidence < 0.7:
        score += WEIGHTS["low_ocr_confidence"]
        flags.append(f"Low OCR confidence: {ocr_confidence:.0%}")

    # Determine level
    if score >= HIGH_THRESHOLD:
        level = "HIGH"
    elif score >= LOW_THRESHOLD:
        level = "MEDIUM"
    else:
        level = "LOW"

    context["risk"] = {
        "score": score,
        "level": level,
        "flags": flags,
        "breakdown": {
            "missing_fields": WEIGHTS["missing_fields"] if not validation.get("passed", True) else 0,
            "vendor_issue": WEIGHTS["unknown_vendor"] if vendor_result == "UNKNOWN_VENDOR" else (WEIGHTS["blocked_vendor"] if vendor_result == "BLOCKED_VENDOR" else 0),
            "duplicate": WEIGHTS["confirmed_duplicate"] if dup_result == "CONFIRMED_DUPLICATE" else (WEIGHTS["potential_duplicate"] if dup_result == "POTENTIAL_DUPLICATE" else 0),
            "po_issue": WEIGHTS["po_mismatch"] if po_status == "FAIL" else (WEIGHTS["fuzzy_po_only"] if po.get("method") == "fuzzy" else 0),
            "amount_variance": WEIGHTS["amount_variance"] if recon.get("status") == "REVIEW" else 0,
            "ocr": WEIGHTS["low_ocr_confidence"] if (ocr_confidence is not None and ocr_confidence < 0.7) else 0,
        },
    }
    return context
