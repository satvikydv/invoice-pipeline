import os
import uuid
import shutil
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Invoice
from schemas import (
    UploadResponse,
    InvoiceListItem,
    InvoiceDetail,
    InvoiceAudit,
    InvoiceListResponse,
    StatsResponse,
)
from pipeline.orchestrator import run_pipeline

router = APIRouter(prefix="/invoices", tags=["invoices"])

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".tiff", ".bmp", ".webp"}
MAX_FILE_SIZE_MB = 20


@router.post("/upload", response_model=UploadResponse)
async def upload_invoice(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Validate file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read and check size
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File too large ({size_mb:.1f} MB). Max: {MAX_FILE_SIZE_MB} MB")

    # Save file
    job_id = str(uuid.uuid4())
    save_path = UPLOAD_DIR / f"{job_id}{ext}"
    with open(save_path, "wb") as f:
        f.write(contents)

    # Create DB record
    invoice = Invoice(
        job_id=job_id,
        filename=file.filename,
        file_path=str(save_path),
        status="PROCESSING",
    )
    db.add(invoice)
    db.commit()

    # Run pipeline in background
    background_tasks.add_task(run_pipeline, job_id, str(save_path))

    return UploadResponse(job_id=job_id, message="Invoice uploaded and processing started")


@router.get("", response_model=InvoiceListResponse)
def list_invoices(
    status: str = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Invoice)
    if status:
        query = query.filter(Invoice.status == status)
    total = query.count()
    items = query.order_by(Invoice.created_at.desc()).offset(skip).limit(limit).all()
    return InvoiceListResponse(total=total, items=items)


@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Invoice).count()
    approved = db.query(Invoice).filter(Invoice.status == "APPROVED").count()
    review = db.query(Invoice).filter(Invoice.status == "REVIEW_REQUIRED").count()
    rejected = db.query(Invoice).filter(Invoice.status == "REJECTED").count()
    processing = db.query(Invoice).filter(Invoice.status == "PROCESSING").count()
    return StatsResponse(
        total=total,
        approved=approved,
        review_required=review,
        rejected=rejected,
        processing=processing,
    )


@router.get("/{job_id}", response_model=InvoiceDetail)
def get_invoice(job_id: str, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.job_id == job_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.get("/{job_id}/audit", response_model=InvoiceAudit)
def get_invoice_audit(job_id: str, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.job_id == job_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice
