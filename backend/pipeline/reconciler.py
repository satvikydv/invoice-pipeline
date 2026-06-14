"""
Pipeline Stage 6: Amount Reconciliation
Compares invoice total against matched PO remaining balance.
"""

TOLERANCE_PERCENT = 5.0  # 5% tolerance per PRD


def run(context: dict) -> dict:
    """
    Stage 6: Reconcile invoice amount against PO remaining balance.
    """
    fields = context.get("extraction", {}).get("fields", {})
    po_match = context.get("po_match", {})
    matched_po = po_match.get("matched_po")
    total_amount = fields.get("total_amount")

    if not matched_po:
        context["reconciliation"] = {
            "status": "SKIP",
            "reason": "No matched PO available for reconciliation",
            "invoice_amount": total_amount,
            "po_balance": None,
            "difference": None,
            "difference_pct": None,
        }
        return context

    if total_amount is None:
        context["reconciliation"] = {
            "status": "FAIL",
            "reason": "Invoice total amount is missing",
            "invoice_amount": None,
            "po_balance": matched_po.get("remaining_balance"),
            "difference": None,
            "difference_pct": None,
        }
        return context

    po_balance = matched_po.get("remaining_balance", 0)
    difference = total_amount - po_balance

    if difference <= 0:
        status = "PASS"
        reason = "Invoice amount is fully covered by PO remaining balance"
        difference_pct = 0.0
    else:
        difference_pct = (difference / max(po_balance, 0.01)) * 100
        if difference_pct <= TOLERANCE_PERCENT:
            status = "PASS"
            reason = f"Invoice amount exceeds balance but is within {TOLERANCE_PERCENT}% tolerance (variance: +{difference_pct:.2f}%)"
        else:
            status = "REVIEW"
            reason = f"Invoice amount exceeds PO balance by {difference_pct:.2f}% (limit: {TOLERANCE_PERCENT}%)"

    context["reconciliation"] = {
        "status": status,
        "reason": reason,
        "invoice_amount": total_amount,
        "po_balance": po_balance,
        "difference": round(difference, 2),
        "difference_pct": round(difference_pct, 2),
    }
    return context
