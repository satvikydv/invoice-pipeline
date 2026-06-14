from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import VendorMaster, POData

router = APIRouter(prefix="/system", tags=["system"])

@router.get("/vendors")
def list_vendors(db: Session = Depends(get_db)):
    vendors = db.query(VendorMaster).all()
    return vendors

@router.get("/pos")
def list_pos(db: Session = Depends(get_db)):
    pos = db.query(POData).all()
    return pos
