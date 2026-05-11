from database import get_connection
from repositories.product_repository import ProductRepository
from repositories.alert_repository import AlertRepository
from schemas.alert import AlertCreate
from services.email_service import draft_reorder_email

def check_and_alert_stock(product_id: int):
    """
    Check stock level of a product and create an alert + email draft if it drops below threshold.
    Designed to be run as a FastAPI BackgroundTask.
    """
    conn = get_connection()
    try:
        repo = ProductRepository(conn)
        product = repo.get_by_id(product_id)
        if not product:
            return

        if product.status in ["low", "critical"]:
            alert_repo = AlertRepository(conn)
            
            # Check if there is already an active alert for this product
            existing = conn.execute(
                "SELECT id FROM alerts WHERE product_id = ? AND resolved = FALSE",
                (product.id,)
            ).fetchone()
            
            if not existing:
                draft_email = None
                message = f"{product.name} is {product.status} stock ({product.stock_quantity} units)."
                
                # Only draft email if critical stock to save AI tokens, or if it has a supplier
                if product.status == "critical":
                    draft_email = draft_reorder_email(
                        product.supplier_name or "Supplier",
                        product.supplier_email or "",
                        [{"name": product.name, "stock_quantity": product.stock_quantity}]
                    )
                    
                alert_repo.create(AlertCreate(
                    type="critical_stock" if product.status == "critical" else "low_stock",
                    product_id=product.id,
                    message=message,
                    draft_email=draft_email
                ))
                conn.commit()
    except Exception as e:
        print(f"Background alert task failed for product {product_id}: {e}")
    finally:
        conn.close()
