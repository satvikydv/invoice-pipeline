# InvoiceIQ – AI-Powered Invoice Processing & Approval System

> Automatically processes vendor invoices using Gemini Vision AI, matching them against POs and vendor master data, scoring risk, and producing explainable APPROVED / REVIEW REQUIRED / REJECTED decisions.

---

## Architecture

```
frontend (React + Vite)  ←→  backend (FastAPI + SQLite)  ←→  Gemini Vision API
```

## Quick Start (Local)

### 1. Backend

```bash
cd backend

# Create .env from template
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Install dependencies (Python 3.11+)
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`  
Auto-docs: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The UI will be available at `http://localhost:5173`

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | **Required.** Your Google Gemini API key | — |
| `DATABASE_URL` | SQLAlchemy DB URL | `sqlite:///./invoices.db` |
| `UPLOAD_DIR` | Directory for uploaded files | `uploads` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

---

## Deployment

### Option A: Docker Compose (Self-hosted / Railway / Render)

```bash
# 1. Set your API key
export GEMINI_API_KEY=your_key_here

# 2. Build and run
docker-compose up --build -d
```

Backend will be at `http://localhost:8000`.

### Option B: Backend on Render + Frontend on Vercel

#### Backend (Render)
1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your repository
3. Set **Root Directory** to `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables: `GEMINI_API_KEY`, `FRONTEND_URL` (your Vercel URL)

#### Frontend (Vercel)
1. Import project on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable: `VITE_API_URL` = your Render backend URL

---

## Pipeline Stages

| # | Stage | What it does |
|---|---|---|
| 1 | **Upload** | File saved, job record created |
| 2 | **Extraction** | Gemini Vision reads all invoice fields (number, date, vendor, PO, amounts) |
| 3 | **Validation** | Checks all required fields are present |
| 4 | **Vendor Verification** | Fuzzy-matches vendor against master list |
| 5 | **PO Matching** | Direct PO number match, then fuzzy by vendor + amount |
| 6 | **Amount Reconciliation** | Compares invoice total vs PO remaining balance (5% tolerance) |
| 7 | **Duplicate Detection** | Checks invoice history for same number/vendor/amount/date |
| 8 | **Risk Scoring** | Weighted score → Low / Medium / High |
| 9 | **Decision Engine** | APPROVED / REVIEW REQUIRED / REJECTED with reasoning |

---

## Test Cases

Upload these to verify the system:
- **Happy path invoice** (matching vendor + PO + amount) → APPROVED
- Invoice with vendor name `"PrintMasters Ltd"` → REJECTED (blocked vendor)  
- Invoice with invoice number `"INV-DUPLICATE-001"` from vendor `"Acme Corp"` for `$1500` → REJECTED (duplicate)
- Invoice amount significantly over PO balance → REVIEW REQUIRED

---

## Tech Stack

- **Frontend**: React 18, Vite, React Router, Axios
- **Backend**: FastAPI, SQLAlchemy, SQLite
- **AI**: Google Gemini 1.5 Flash (Vision), pdfplumber (fallback)
- **Matching**: rapidfuzz
- **Deployment**: Docker, Vercel, Render
