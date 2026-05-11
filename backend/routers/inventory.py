import sqlite3
import csv
import io

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from database import db_dependency
from repositories.product_repository import ProductRepository
from schemas.product import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("", response_model=list[ProductResponse])
def get_inventory(conn: sqlite3.Connection = Depends(db_dependency)) -> list[ProductResponse]:
    return ProductRepository(conn).get_all()


from fastapi import BackgroundTasks
from services.alert_service import check_and_alert_stock

@router.post("", response_model=ProductResponse)
def create_product(
    data: ProductCreate,
    background_tasks: BackgroundTasks,
    conn: sqlite3.Connection = Depends(db_dependency),
) -> ProductResponse:
    repo = ProductRepository(conn)
    try:
        created = repo.create(data)
        conn.commit()  # Release DB lock
        background_tasks.add_task(check_and_alert_stock, created.id)
        return created
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Product with this SKU already exists")


@router.post("/upload", response_model=dict)
async def upload_csv(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    conn: sqlite3.Connection = Depends(db_dependency),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    content = await file.read()
    try:
        text = content.decode("utf-8")
        reader = csv.DictReader(io.StringIO(text))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid CSV format")

    repo = ProductRepository(conn)
    added_count = 0
    
    for row in reader:
        try:
            product_data = ProductCreate(
                name=row.get("name", "Unknown Product"),
                sku=row.get("sku") or None,
                category=row.get("category", "General"),
                stock_quantity=int(row.get("stock_quantity", 0)),
                reorder_threshold=int(row.get("reorder_threshold", 10)),
                supplier_name=row.get("supplier_name", ""),
                supplier_email=row.get("supplier_email", ""),
                unit_price=float(row.get("unit_price", 0.0))
            )
            created = repo.create(product_data)
            added_count += 1
            
            conn.commit()
            background_tasks.add_task(check_and_alert_stock, created.id)
        except Exception as e:
            continue
            
    return {"status": "success", "added_count": added_count}


from fastapi import BackgroundTasks
from services.alert_service import check_and_alert_stock

@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    background_tasks: BackgroundTasks,
    conn: sqlite3.Connection = Depends(db_dependency),
) -> ProductResponse:
    repo = ProductRepository(conn)
    updated = repo.update(product_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
        
    if data.stock_quantity is not None or data.reorder_threshold is not None:
        conn.commit()  # Release DB lock before background task
        background_tasks.add_task(check_and_alert_stock, updated.id)
        
    return updated
