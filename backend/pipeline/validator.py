"""
Pipeline Stage 3: Field Validation
Checks that all required invoice fields are present and non-empty.
"""

REQUIRED_FIELDS = ["invoice_number", "vendor_name", "invoice_date", "total_amount"]


def run(context: dict) -> dict:
    """
    Stage 3: Validate required fields from extraction.
    """
    fields = context.get("extraction", {}).get("fields", {})
    results = {}
    failed_fields = []

    for field in REQUIRED_FIELDS:
        value = fields.get(field)
        ok = value is not None and str(value).strip() != ""
        results[field] = {"present": ok, "value": value}
        if not ok:
            failed_fields.append(field)

    passed = len(failed_fields) == 0

    context["validation"] = {
        "status": "PASS" if passed else "FAIL",
        "required_fields": results,
        "failed_fields": failed_fields,
        "passed": passed,
    }
    return context
