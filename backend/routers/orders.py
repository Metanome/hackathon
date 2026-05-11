import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from database import db_dependency
from repositories.order_repository import OrderRepository
from schemas.order import OrderResponse, OrderUpdate

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("", response_model=list[OrderResponse])
def get_orders(
    status: str | None = None,
    conn: sqlite3.Connection = Depends(db_dependency),
) -> list[OrderResponse]:
    return OrderRepository(conn).get_all(status=status)


from fastapi import BackgroundTasks
from services.alert_service import check_and_alert_stock

@router.patch("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    data: OrderUpdate,
    background_tasks: BackgroundTasks,
    conn: sqlite3.Connection = Depends(db_dependency),
) -> OrderResponse:
    repo = OrderRepository(conn)
    
    # Check current status first to prevent double-deduction
    current_order = repo.get_by_id(order_id)
    if not current_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if current_order.status == "pending" and data.status == "fulfilled":
        from repositories.product_repository import ProductRepository
        prod_repo = ProductRepository(conn)
        for item in current_order.items:
            prod_repo.update_stock(item.product_id, -item.quantity)
            conn.commit()  # Release DB lock before background task
            background_tasks.add_task(check_and_alert_stock, item.product_id)

    updated = repo.update_status(order_id, data.status)
    conn.commit() # Ensure order status is committed
    return updated
