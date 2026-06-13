"""
Pipeline Stage 4: Vendor Verification
Checks vendor against the VendorMaster table using fuzzy name matching.
"""
from rapidfuzz import fuzz, process


FUZZY_THRESHOLD = 80  # Minimum score to consider a vendor match


def run(context: dict) -> dict:
    """
    Stage 4: Verify vendor exists and is not blocked.
    Requires context['db'] (SQLAlchemy session) and context['extraction']['fields']['vendor_name'].
    """
    from models import VendorMaster

    db = context["db"]
    vendor_name = context.get("extraction", {}).get("fields", {}).get("vendor_name")

    if not vendor_name:
        context["vendor_check"] = {
            "status": "UNKNOWN",
            "result": "UNKNOWN_VENDOR",
            "reason": "No vendor name extracted",
            "matched_vendor": None,
            "match_score": 0,
        }
        return context

    all_vendors = db.query(VendorMaster).all()
    if not all_vendors:
        context["vendor_check"] = {
            "status": "UNKNOWN",
            "result": "UNKNOWN_VENDOR",
            "reason": "Vendor master list is empty",
            "matched_vendor": None,
            "match_score": 0,
        }
        return context

    vendor_names = {v.vendor_name: v for v in all_vendors}
    match_result = process.extractOne(
        vendor_name,
        vendor_names.keys(),
        scorer=fuzz.token_sort_ratio,
    )

    if match_result is None or match_result[1] < FUZZY_THRESHOLD:
        context["vendor_check"] = {
            "status": "FAIL",
            "result": "UNKNOWN_VENDOR",
            "reason": f"No vendor match found above threshold (best score: {match_result[1] if match_result else 0})",
            "matched_vendor": None,
            "match_score": match_result[1] if match_result else 0,
        }
        return context

    matched_name = match_result[0]
    matched_vendor = vendor_names[matched_name]
    score = match_result[1]

    if matched_vendor.status == "Blocked":
        context["vendor_check"] = {
            "status": "FAIL",
            "result": "BLOCKED_VENDOR",
            "reason": f"Vendor '{matched_name}' is blocked in the vendor master list",
            "matched_vendor": {"id": matched_vendor.vendor_id, "name": matched_name, "status": "Blocked"},
            "match_score": score,
        }
    else:
        context["vendor_check"] = {
            "status": "PASS",
            "result": "VERIFIED",
            "reason": f"Vendor matched: '{matched_name}' (score: {score})",
            "matched_vendor": {
                "id": matched_vendor.vendor_id,
                "name": matched_name,
                "status": matched_vendor.status,
                "tax_id": matched_vendor.tax_id,
            },
            "match_score": score,
        }

    return context
