from database import SessionLocal
from models import POData, VendorMaster, InvoiceHistory


VENDOR_DATA = [
    {"vendor_id": "V001", "vendor_name": "Acme Corp", "status": "Approved", "tax_id": "12-3456789"},
    {"vendor_id": "V002", "vendor_name": "GlobalTech Solutions", "status": "Approved", "tax_id": "98-7654321"},
    {"vendor_id": "V003", "vendor_name": "OfficeSupply Pro", "status": "Approved", "tax_id": "45-6789012"},
    {"vendor_id": "V004", "vendor_name": "CloudHost Inc", "status": "Approved", "tax_id": "33-1122334"},
    {"vendor_id": "V005", "vendor_name": "PrintMasters Ltd", "status": "Blocked", "tax_id": "77-9988776"},
    {"vendor_id": "V006", "vendor_name": "DataVault Systems", "status": "Approved", "tax_id": "55-4433221"},
    {"vendor_id": "V007", "vendor_name": "Nexus Logistics", "status": "Approved", "tax_id": "11-5566778"},
]

PO_DATA = [
    {"po_number": "PO-2024-001", "vendor_name": "Acme Corp", "po_amount": 5000.00, "remaining_balance": 5000.00, "status": "Active"},
    {"po_number": "PO-2024-002", "vendor_name": "GlobalTech Solutions", "po_amount": 12000.00, "remaining_balance": 8500.00, "status": "Active"},
    {"po_number": "PO-2024-003", "vendor_name": "OfficeSupply Pro", "po_amount": 2500.00, "remaining_balance": 2500.00, "status": "Active"},
    {"po_number": "PO-2024-004", "vendor_name": "CloudHost Inc", "po_amount": 9000.00, "remaining_balance": 3200.00, "status": "Active"},
    {"po_number": "PO-2024-005", "vendor_name": "DataVault Systems", "po_amount": 15000.00, "remaining_balance": 15000.00, "status": "Active"},
    {"po_number": "PO-2024-006", "vendor_name": "Nexus Logistics", "po_amount": 7500.00, "remaining_balance": 7500.00, "status": "Active"},
    {"po_number": "PO-2024-007", "vendor_name": "Acme Corp", "po_amount": 3000.00, "remaining_balance": 1200.00, "status": "Active"},
    {"po_number": "PO-2023-100", "vendor_name": "GlobalTech Solutions", "po_amount": 20000.00, "remaining_balance": 0.00, "status": "Closed"},
    {"po_number": "PO-2024-008", "vendor_name": "OfficeSupply Pro", "po_amount": 800.00, "remaining_balance": 800.00, "status": "Active"},
    {"po_number": "PO-2024-009", "vendor_name": "DataVault Systems", "po_amount": 6000.00, "remaining_balance": 4800.00, "status": "Active"},
]

HISTORICAL_INVOICES = [
    {
        "invoice_number": "INV-DUPLICATE-001",
        "vendor_name": "Acme Corp",
        "amount": 1500.00,
        "invoice_date": "2024-05-01",
        "source_job_id": "historical-seed",
    },
]


def seed_database():
    db = SessionLocal()
    try:
        if db.query(VendorMaster).count() == 0:
            for v in VENDOR_DATA:
                db.add(VendorMaster(**v))
            print(f"Seeded {len(VENDOR_DATA)} vendors.")

        if db.query(POData).count() == 0:
            for p in PO_DATA:
                db.add(POData(**p))
            print(f"Seeded {len(PO_DATA)} PO records.")

        if db.query(InvoiceHistory).count() == 0:
            for h in HISTORICAL_INVOICES:
                db.add(InvoiceHistory(**h))
            print(f"Seeded {len(HISTORICAL_INVOICES)} historical invoices.")

        db.commit()
        print("Seed complete.")
    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
