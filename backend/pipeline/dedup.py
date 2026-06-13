"""
Pipeline Stage 7: Duplicate Detection
Checks invoice against InvoiceHistory for (number, vendor, amount, date) matches.
"""
from rapidfuzz import fuzz


AMOUNT_EPSILON = 0.01  # cents
VENDOR_FUZZY_THRESHOLD = 90


def run(context: dict) -> dict:
    """
    Stage 7: Detect duplicate invoices.
    """
    from models import InvoiceHistory

    db = context["db"]
    fields = context.get("extraction", {}).get("fields", {})
    current_job_id = context.get("job_id")

    invoice_number = fields.get("invoice_number")
    vendor_name = fields.get("vendor_name")
    total_amount = fields.get("total_amount")
    invoice_date = fields.get("invoice_date")

    history = db.query(InvoiceHistory).all()

    exact_match = None
    potential_matches = []

    for record in history:
        if record.source_job_id == current_job_id:
            continue

        # Exact match: same invoice number AND vendor AND amount AND date
        num_match = invoice_number and record.invoice_number and \
            invoice_number.strip().upper() == record.invoice_number.strip().upper()
        vendor_match = vendor_name and record.vendor_name and \
            fuzz.token_sort_ratio(vendor_name, record.vendor_name) >= VENDOR_FUZZY_THRESHOLD
        amount_match = total_amount is not None and record.amount is not None and \
            abs(total_amount - record.amount) <= AMOUNT_EPSILON
        date_match = invoice_date and record.invoice_date and \
            invoice_date.strip() == record.invoice_date.strip()

        if num_match and vendor_match and amount_match:
            exact_match = record
            break

        # Potential: same number OR (same vendor + same amount + same date)
        if num_match or (vendor_match and amount_match and date_match):
            potential_matches.append(record)

    if exact_match:
        context["duplicate"] = {
            "status": "FAIL",
            "result": "CONFIRMED_DUPLICATE",
            "reason": f"Confirmed duplicate: invoice number {invoice_number} already processed",
            "matching_records": [{
                "invoice_number": exact_match.invoice_number,
                "vendor_name": exact_match.vendor_name,
                "amount": exact_match.amount,
                "processed_at": str(exact_match.processed_at),
            }],
        }
    elif potential_matches:
        context["duplicate"] = {
            "status": "REVIEW",
            "result": "POTENTIAL_DUPLICATE",
            "reason": f"Potential duplicate found: {len(potential_matches)} similar record(s) in history",
            "matching_records": [{
                "invoice_number": r.invoice_number,
                "vendor_name": r.vendor_name,
                "amount": r.amount,
                "processed_at": str(r.processed_at),
            } for r in potential_matches[:3]],
        }
    else:
        context["duplicate"] = {
            "status": "PASS",
            "result": "NO_DUPLICATE",
            "reason": "No duplicate found in invoice history",
            "matching_records": [],
        }

    return context
