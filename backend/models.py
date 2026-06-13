from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.sql import func
from database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, unique=True, index=True)
    filename = Column(String)
    file_path = Column(String)
    status = Column(String, default="PROCESSING")  # PROCESSING, APPROVED, REVIEW_REQUIRED, REJECTED, FAILED

    # Extracted fields
    invoice_number = Column(String, nullable=True)
    invoice_date = Column(String, nullable=True)
    vendor_name = Column(String, nullable=True)
    po_number = Column(String, nullable=True)
    subtotal = Column(Float, nullable=True)
    tax = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True)
    ocr_confidence = Column(Float, nullable=True)

    # Pipeline results
    extraction_result = Column(JSON, nullable=True)
    validation_result = Column(JSON, nullable=True)
    vendor_check_result = Column(JSON, nullable=True)
    po_match_result = Column(JSON, nullable=True)
    reconciliation_result = Column(JSON, nullable=True)
    duplicate_result = Column(JSON, nullable=True)
    risk_result = Column(JSON, nullable=True)
    decision_result = Column(JSON, nullable=True)

    # Final output
    decision = Column(String, nullable=True)  # APPROVED, REVIEW_REQUIRED, REJECTED
    confidence = Column(Float, nullable=True)
    risk_level = Column(String, nullable=True)
    reasoning = Column(JSON, nullable=True)
    processing_time = Column(Float, nullable=True)  # seconds

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class POData(Base):
    __tablename__ = "po_data"

    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String, unique=True, index=True)
    vendor_name = Column(String)
    po_amount = Column(Float)
    remaining_balance = Column(Float)
    status = Column(String)  # Active, Closed


class VendorMaster(Base):
    __tablename__ = "vendor_master"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(String, unique=True, index=True)
    vendor_name = Column(String)
    status = Column(String)  # Approved, Blocked
    tax_id = Column(String)


class InvoiceHistory(Base):
    __tablename__ = "invoice_history"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, index=True)
    vendor_name = Column(String)
    amount = Column(Float)
    invoice_date = Column(String)
    processed_at = Column(DateTime(timezone=True), server_default=func.now())
    source_job_id = Column(String)
