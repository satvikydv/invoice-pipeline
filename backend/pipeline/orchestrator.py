"""
Pipeline Orchestrator
Runs all stages sequentially, updates the DB record after each stage,
and builds the complete audit trail.
"""
import time
import traceback

from database import SessionLocal
from models import Invoice, InvoiceHistory
from pipeline import extractor, validator, vendor_check, po_matcher, reconciler, dedup, risk_scorer, decision_engine


STAGES = [
    ("extraction", extractor),
    ("validation", validator),
    ("vendor_check", vendor_check),
    ("po_match", po_matcher),
    ("reconciliation", reconciler),
    ("duplicate", dedup),
    ("risk", risk_scorer),
    ("decision", decision_engine),
]


def run_pipeline(job_id: str, file_path: str):
    """
    Runs the full invoice processing pipeline for a given job.
    Opens its own DB session (called from background task).
    """
    db = SessionLocal()
    start_time = time.time()

    try:
        invoice = db.query(Invoice).filter(Invoice.job_id == job_id).first()
        if not invoice:
            return

        context = {
            "job_id": job_id,
            "file_path": file_path,
            "db": db,
        }

        # Run each stage
        for stage_name, stage_module in STAGES:
            try:
                context = stage_module.run(context)
            except Exception as e:
                context[stage_name] = {
                    "status": "ERROR",
                    "error": str(e),
                    "traceback": traceback.format_exc(),
                }

        elapsed = time.time() - start_time

        # Extract results
        extraction = context.get("extraction", {})
        fields = extraction.get("fields", {})
        decision_ctx = context.get("decision", {})
        risk_ctx = context.get("risk", {})

        # Update invoice record
        invoice.invoice_number = fields.get("invoice_number")
        invoice.invoice_date = fields.get("invoice_date")
        invoice.vendor_name = fields.get("vendor_name")
        invoice.po_number = fields.get("po_number")
        invoice.subtotal = fields.get("subtotal")
        invoice.tax = fields.get("tax")
        invoice.total_amount = fields.get("total_amount")
        invoice.ocr_confidence = fields.get("ocr_confidence")

        invoice.extraction_result = extraction
        invoice.validation_result = context.get("validation")
        invoice.vendor_check_result = context.get("vendor_check")
        invoice.po_match_result = context.get("po_match")
        invoice.reconciliation_result = context.get("reconciliation")
        invoice.duplicate_result = context.get("duplicate")
        invoice.risk_result = risk_ctx
        invoice.decision_result = decision_ctx

        invoice.decision = decision_ctx.get("decision")
        invoice.confidence = decision_ctx.get("confidence")
        invoice.risk_level = risk_ctx.get("level")
        invoice.reasoning = decision_ctx.get("reasoning", [])
        invoice.processing_time = round(elapsed, 2)
        invoice.status = decision_ctx.get("decision", "FAILED")

        # Add to invoice history for future dedup (if approved or reviewed)
        if invoice.decision in ("APPROVED", "REVIEW_REQUIRED") and invoice.invoice_number:
            history_entry = InvoiceHistory(
                invoice_number=invoice.invoice_number,
                vendor_name=invoice.vendor_name,
                amount=invoice.total_amount,
                invoice_date=invoice.invoice_date,
                source_job_id=job_id,
            )
            db.add(history_entry)

        db.commit()

    except Exception as e:
        db.rollback()
        try:
            invoice = db.query(Invoice).filter(Invoice.job_id == job_id).first()
            if invoice:
                invoice.status = "FAILED"
                invoice.reasoning = [f"Pipeline error: {str(e)}"]
                db.commit()
        except Exception:
            pass
    finally:
        db.close()
