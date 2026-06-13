from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class InvoiceListItem(BaseModel):
    id: int
    job_id: str
    filename: str
    invoice_number: Optional[str]
    vendor_name: Optional[str]
    total_amount: Optional[float]
    status: str
    decision: Optional[str]
    risk_level: Optional[str]
    confidence: Optional[float]
    processing_time: Optional[float]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class InvoiceDetail(BaseModel):
    id: int
    job_id: str
    filename: str
    status: str
    invoice_number: Optional[str]
    invoice_date: Optional[str]
    vendor_name: Optional[str]
    po_number: Optional[str]
    subtotal: Optional[float]
    tax: Optional[float]
    total_amount: Optional[float]
    ocr_confidence: Optional[float]
    decision: Optional[str]
    confidence: Optional[float]
    risk_level: Optional[str]
    reasoning: Optional[List[str]]
    processing_time: Optional[float]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class InvoiceAudit(BaseModel):
    id: int
    job_id: str
    filename: str
    file_path: Optional[str]
    status: str
    extraction_result: Optional[Dict[str, Any]]
    validation_result: Optional[Dict[str, Any]]
    vendor_check_result: Optional[Dict[str, Any]]
    po_match_result: Optional[Dict[str, Any]]
    reconciliation_result: Optional[Dict[str, Any]]
    duplicate_result: Optional[Dict[str, Any]]
    risk_result: Optional[Dict[str, Any]]
    decision_result: Optional[Dict[str, Any]]
    decision: Optional[str]
    confidence: Optional[float]
    risk_level: Optional[str]
    reasoning: Optional[List[str]]
    processing_time: Optional[float]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    job_id: str
    message: str


class InvoiceListResponse(BaseModel):
    total: int
    items: List[InvoiceListItem]


class StatsResponse(BaseModel):
    total: int
    approved: int
    review_required: int
    rejected: int
    processing: int
