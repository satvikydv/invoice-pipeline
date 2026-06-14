"""
Pipeline Stage 2: Document Extraction
Uses Gemini Vision API to extract structured invoice data from PDFs and images.
Falls back to pdfplumber for machine-readable PDFs if Gemini fails.
"""
import os
import json
import base64
import pdfplumber
import google.generativeai as genai
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

EXTRACTION_PROMPT = """
You are an expert invoice parser. Extract the following fields from the provided invoice document.
Return a JSON object with exactly these keys:
{
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD string or null",
  "vendor_name": "string or null",
  "po_number": "string or null",
  "subtotal": float or null,
  "tax": float or null,
  "total_amount": float or null,
  "ocr_confidence": float between 0.0 and 1.0 (your confidence in the extraction quality),
  "raw_text_snippet": "first 200 chars of extracted text"
}

Rules:
- If a field is not found, set it to null.
- For amounts, extract numeric values only (no currency symbols).
- ocr_confidence should reflect how legible and complete the document is.
- Return ONLY valid JSON, no extra text.
"""


def _encode_file_to_base64(file_path: str) -> str:
    with open(file_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def _get_mime_type(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()
    mime_map = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".tiff": "image/tiff",
        ".bmp": "image/bmp",
        ".webp": "image/webp",
    }
    return mime_map.get(ext, "application/octet-stream")


def _extract_with_gemini(file_path: str) -> dict:
    """Use Gemini Vision to extract invoice data."""
    model = genai.GenerativeModel("gemini-2.5-flash")
    file_data = _encode_file_to_base64(file_path)
    mime_type = _get_mime_type(file_path)

    response = model.generate_content([
        {"inline_data": {"mime_type": mime_type, "data": file_data}},
        EXTRACTION_PROMPT,
    ])

    raw = response.text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
    
    return json.loads(raw)


def _extract_with_pdfplumber(file_path: str) -> dict:
    """Fallback: extract text from machine-readable PDF using pdfplumber."""
    with pdfplumber.open(file_path) as pdf:
        text = "\n".join(page.extract_text() or "" for page in pdf.pages)

    result = {
        "invoice_number": None,
        "invoice_date": None,
        "vendor_name": None,
        "po_number": None,
        "subtotal": None,
        "tax": None,
        "total_amount": None,
        "ocr_confidence": 0.6,
        "raw_text_snippet": text[:200],
    }

    import re
    # Try to extract common patterns
    inv_match = re.search(r"Invoice\s*(?:No|Number|#)[:\s]*([A-Za-z0-9\-]+)", text, re.IGNORECASE)
    if inv_match:
        result["invoice_number"] = inv_match.group(1).strip()

    date_match = re.search(r"(\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4})", text)
    if date_match:
        result["invoice_date"] = date_match.group(1).strip()

    po_match = re.search(r"PO\s*(?:Number|No|#)?[:\s]*([A-Za-z0-9\-]+)", text, re.IGNORECASE)
    if po_match:
        result["po_number"] = po_match.group(1).strip()

    total_match = re.search(r"Total\s*(?:Amount|Due)?[:\s]*\$?([\d,]+\.?\d*)", text, re.IGNORECASE)
    if total_match:
        result["total_amount"] = float(total_match.group(1).replace(",", ""))

    return result


def run(context: dict) -> dict:
    """
    Stage 2: Extract invoice data from file.
    Input: context with 'file_path'
    Output: context with 'extraction' dict added
    """
    file_path = context["file_path"]
    extracted = {}
    method = "gemini"
    error = None

    try:
        if GEMINI_API_KEY:
            extracted = _extract_with_gemini(file_path)
        else:
            raise ValueError("No Gemini API key configured")
    except Exception as e:
        error = str(e)
        method = "pdfplumber_fallback"
        try:
            if file_path.lower().endswith(".pdf"):
                extracted = _extract_with_pdfplumber(file_path)
            else:
                extracted = {
                    "invoice_number": None,
                    "invoice_date": None,
                    "vendor_name": None,
                    "po_number": None,
                    "subtotal": None,
                    "tax": None,
                    "total_amount": None,
                    "ocr_confidence": 0.3,
                    "raw_text_snippet": "",
                }
        except Exception as e2:
            error = f"Gemini: {e}; pdfplumber: {e2}"
            extracted = {
                "invoice_number": None,
                "invoice_date": None,
                "vendor_name": None,
                "po_number": None,
                "subtotal": None,
                "tax": None,
                "total_amount": None,
                "ocr_confidence": 0.0,
                "raw_text_snippet": "",
            }

    context["extraction"] = {
        "status": "success" if not error else "partial",
        "method": method,
        "error": error,
        "fields": extracted,
    }
    return context
