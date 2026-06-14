import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from database import engine, Base
from models import Invoice, POData, VendorMaster, InvoiceHistory
from routers.invoices import router as invoices_router
from routers.system import router as system_router
from seed_data import seed_database

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
UPLOAD_DIR.mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables
    Base.metadata.create_all(bind=engine)
    # Seed data if needed
    seed_database()
    yield


app = FastAPI(
    title="InvoiceIQ API",
    description="AI-powered invoice processing and approval system",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:4173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Routers
app.include_router(invoices_router)
app.include_router(system_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "InvoiceIQ API"}
