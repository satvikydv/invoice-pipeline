"""
Pipeline Stage 5: PO Matching
Attempts direct match on PO number, then fuzzy match by vendor + amount.
"""
from rapidfuzz import fuzz, process


FUZZY_VENDOR_THRESHOLD = 80
AMOUNT_TOLERANCE_RATIO = 0.15  # 15% for fuzzy PO match


def run(context: dict) -> dict:
    """
    Stage 5: Find matching Purchase Order.
    """
    from models import POData

    db = context["db"]
    fields = context.get("extraction", {}).get("fields", {})
    po_number = fields.get("po_number")
    vendor_name = fields.get("vendor_name")
    total_amount = fields.get("total_amount")
    matched_vendor = context.get("vendor_check", {}).get("matched_vendor")
    canonical_vendor = matched_vendor["name"] if matched_vendor else vendor_name

    active_pos = db.query(POData).filter(POData.status == "Active").all()

    # --- Direct match by PO number ---
    if po_number:
        direct = next((p for p in active_pos if p.po_number.strip().upper() == po_number.strip().upper()), None)
        if direct:
            context["po_match"] = {
                "status": "PASS",
                "method": "direct",
                "matched_po": {
                    "po_number": direct.po_number,
                    "vendor_name": direct.vendor_name,
                    "po_amount": direct.po_amount,
                    "remaining_balance": direct.remaining_balance,
                    "status": direct.status,
                },
                "confidence": 1.0,
                "reason": f"Direct PO number match: {direct.po_number}",
            }
            return context

    # --- Fuzzy match by vendor + amount proximity ---
    if not canonical_vendor:
        context["po_match"] = {
            "status": "FAIL",
            "method": "none",
            "matched_po": None,
            "confidence": 0.0,
            "reason": "No PO number and no vendor name available for fuzzy match",
        }
        return context

    best_po = None
    best_score = 0.0

    for po in active_pos:
        vendor_score = fuzz.token_sort_ratio(canonical_vendor, po.vendor_name) / 100.0
        if vendor_score < FUZZY_VENDOR_THRESHOLD / 100.0:
            continue
        amount_score = 1.0
        if total_amount and po.remaining_balance:
            diff = abs(total_amount - po.remaining_balance) / max(po.remaining_balance, 1)
            amount_score = max(0.0, 1.0 - diff / AMOUNT_TOLERANCE_RATIO)
        combined = vendor_score * 0.7 + amount_score * 0.3
        if combined > best_score:
            best_score = combined
            best_po = po

    FUZZY_PASS_THRESHOLD = 0.65

    if best_po and best_score >= FUZZY_PASS_THRESHOLD:
        context["po_match"] = {
            "status": "REVIEW" if po_number else "PASS",
            "method": "fuzzy",
            "matched_po": {
                "po_number": best_po.po_number,
                "vendor_name": best_po.vendor_name,
                "po_amount": best_po.po_amount,
                "remaining_balance": best_po.remaining_balance,
                "status": best_po.status,
            },
            "confidence": round(best_score, 3),
            "reason": f"Fuzzy match to PO {best_po.po_number} (confidence: {best_score:.0%})",
        }
    else:
        context["po_match"] = {
            "status": "FAIL",
            "method": "fuzzy",
            "matched_po": None,
            "confidence": round(best_score, 3),
            "reason": f"No confident PO match found (best score: {best_score:.0%})",
        }

    return context
