"""
Pipeline Stage 9: Decision Engine
Applies PRD business rules to produce APPROVED / REVIEW_REQUIRED / REJECTED.
"""


def run(context: dict) -> dict:
    """
    Stage 9: Determine final decision based on all pipeline stage results.
    """
    vendor = context.get("vendor_check", {})
    po = context.get("po_match", {})
    recon = context.get("reconciliation", {})
    dup = context.get("duplicate", {})
    validation = context.get("validation", {})
    risk = context.get("risk", {})
    ocr_confidence = context.get("extraction", {}).get("fields", {}).get("ocr_confidence", 1.0)

    decision = "APPROVED"
    reasoning = []
    reject_reasons = []
    review_reasons = []

    # --- REJECTION conditions (hard stops) ---
    if dup.get("result") == "CONFIRMED_DUPLICATE":
        reject_reasons.append("Confirmed duplicate invoice – already processed")

    if vendor.get("result") == "BLOCKED_VENDOR":
        reject_reasons.append("Vendor is blocked in the vendor master list")

    if not validation.get("passed", True) and len(validation.get("failed_fields", [])) >= 2:
        reject_reasons.append(f"Invoice is invalid – multiple required fields missing: {', '.join(validation.get('failed_fields', []))}")

    # --- REVIEW conditions ---
    if not validation.get("passed", True):
        review_reasons.append(f"Missing required fields: {', '.join(validation.get('failed_fields', []))}")

    if vendor.get("result") == "UNKNOWN_VENDOR":
        review_reasons.append("Vendor not found in approved vendor list")

    if po.get("status") in ("FAIL", "REVIEW"):
        if po.get("status") == "FAIL":
            review_reasons.append("No matching PO could be identified")
        else:
            review_reasons.append(f"PO matched by fuzzy logic only – confidence: {po.get('confidence', 0):.0%}")

    if recon.get("status") == "REVIEW":
        review_reasons.append(f"Invoice amount variance exceeds 5% threshold ({recon.get('difference_pct', 0):.1f}% variance)")

    if dup.get("result") == "POTENTIAL_DUPLICATE":
        review_reasons.append("Potential duplicate – similar records found in invoice history")

    if ocr_confidence is not None and ocr_confidence < 0.7:
        review_reasons.append(f"Low OCR confidence ({ocr_confidence:.0%}) – document quality may be poor")

    # --- Final decision ---
    if reject_reasons:
        decision = "REJECTED"
        reasoning = [f"❌ {r}" for r in reject_reasons]
        if review_reasons:
            reasoning += [f"⚠️ {r}" for r in review_reasons]
    elif review_reasons:
        decision = "REVIEW_REQUIRED"
        reasoning = [f"⚠️ {r}" for r in review_reasons]
    else:
        decision = "APPROVED"
        reasoning = []
        if vendor.get("result") == "VERIFIED":
            reasoning.append("✅ Vendor verified in approved vendor list")
        if po.get("status") == "PASS":
            reasoning.append(f"✅ PO matched successfully ({po.get('matched_po', {}).get('po_number', 'N/A')})")
        if recon.get("status") == "PASS":
            reasoning.append("✅ Invoice amount within approved tolerance")
        if dup.get("result") == "NO_DUPLICATE":
            reasoning.append("✅ No duplicate detected in invoice history")
        if validation.get("passed"):
            reasoning.append("✅ All required fields present and validated")

    # Confidence: inverse of risk score, normalized
    risk_score = risk.get("score", 0)
    confidence = max(0.0, min(1.0, 1.0 - (risk_score / 100.0)))
    # Boost confidence for clean approvals
    if decision == "APPROVED":
        confidence = min(1.0, confidence + 0.1)

    context["decision"] = {
        "decision": decision,
        "reasoning": reasoning,
        "confidence": round(confidence, 3),
        "risk_level": risk.get("level", "LOW"),
        "reject_reasons": reject_reasons,
        "review_reasons": review_reasons,
    }
    return context
