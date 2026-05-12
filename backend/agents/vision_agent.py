import sqlite3

from agents import planner_agent
from config import get_settings
from prompts import ORDER_EXTRACTION_PROMPT, SHELF_SCAN_PROMPT
from repositories.alert_repository import AlertRepository
from repositories.order_repository import OrderRepository
from repositories.product_repository import ProductRepository
from schemas.agent import OrderExtractionResult, ShelfScanResult, UploadResult
from schemas.alert import AlertCreate
from schemas.order import OrderCreate
from schemas.product import ProductCreate
from services.alert_service import sync_alert
from services.gemini_service import generate_from_image


def process_order_slip(
    image_bytes: bytes,
    mime_type: str,
    conn: sqlite3.Connection,
    lang: str = "en",
) -> UploadResult:
    """
    Extract an order from a handwritten/printed order slip image,
    deduct stock, and create alerts for low-stock items.
    """
    product_repo = ProductRepository(conn)
    order_repo = OrderRepository(conn)
    alert_repo = AlertRepository(conn)

    raw = generate_from_image(image_bytes, mime_type, ORDER_EXTRACTION_PROMPT)
    extraction = OrderExtractionResult(**raw)

    actions: list[str] = []
    order_items: list[dict] = []

    for item in extraction.items:
        matches = product_repo.search_by_name(item.product_name)
        if not matches:
            new_prod = product_repo.create(ProductCreate(
                name=item.product_name,
                category="Needs Setup",
                stock_quantity=0,
                unit_price=0.0
            ))
            product = new_prod
            
            alert_repo.create(AlertCreate(
                type="setup_required",
                product_id=new_prod.id,
                message=f"New product '{item.product_name}' was auto-added from an order. Please configure pricing and SKU."
            ))
            actions.append(f"[info] Auto-created missing product: '{item.product_name}'")
        else:
            product = matches[0]

        order_items.append({"product_id": product.id, "quantity": item.quantity})
        sync_alert(conn, product.id)
        actions.append(f"[alert] Alert synced for {product.name}")

    if order_items:
        order_repo.create(OrderCreate(
            customer_name=extraction.customer_name,
            source="image_order",
            items=order_items,
        ))
        actions.append(f"[ok] Order created for customer: {extraction.customer_name}")

    context = (
        f"Input type: handwritten order slip. "
        f"Customer: {extraction.customer_name}. "
        f"Items extracted: {[f'{i.quantity}× {i.product_name}' for i in extraction.items]}. "
        f"Actions taken: {actions}. "
        f"Notes: {extraction.notes or 'none'}."
    )
    reasoning = planner_agent.synthesize_reasoning(context, lang)
    alerts_created = sum(1 for a in actions if a.startswith("[alert]"))

    return UploadResult(
        input_type="image_order",
        actions_taken=actions,
        reasoning=reasoning,
        alerts_created=alerts_created,
        model_used=get_settings().default_model,
    )


def process_shelf_scan(
    image_bytes: bytes,
    mime_type: str,
    conn: sqlite3.Connection,
    lang: str = "en",
) -> UploadResult:
    """
    Assess shelf stock levels from a photo and create alerts for low/critical products.
    """
    product_repo = ProductRepository(conn)
    alert_repo = AlertRepository(conn)

    raw = generate_from_image(image_bytes, mime_type, SHELF_SCAN_PROMPT)
    scan = ShelfScanResult(**raw)

    actions: list[str] = []

    for detected in scan.products_detected:
        if detected.status == "adequate":
            continue

        matches = product_repo.search_by_name(detected.name)
        product_id = matches[0].id if matches else None
        product_display = matches[0].name if matches else detected.name

        if product_id:
            sync_alert(conn, product_id)
            actions.append(f"[alert] Alert synced for '{product_display}' via shelf scan")
        else:
            existing = conn.execute(
                "SELECT id FROM alerts WHERE product_id IS NULL AND resolved = 0 AND message LIKE ?",
                (f"%'{detected.name}'%",),
            ).fetchone()
            if not existing:
                alert_repo.create(AlertCreate(
                    type="critical_stock" if detected.status == "critical" else "low_stock",
                    product_id=None,
                    message=f"Shelf scan detected unknown product '{detected.name}' as {detected.status}.",
                ))
                actions.append(f"[alert] Alert: '{detected.name}' appears {detected.status} on shelf")
            else:
                actions.append(f"[info] Existing alert for unknown product '{detected.name}' already active")

    context = (
        f"Input type: shelf scan. "
        f"Overall shelf status: {scan.overall_status}. "
        f"Observations: {scan.observations}. "
        f"Products detected: {[f'{p.name} ({p.status})' for p in scan.products_detected]}. "
        f"Actions taken: {actions}."
    )
    reasoning = planner_agent.synthesize_reasoning(context, lang)

    return UploadResult(
        input_type="image_shelf",
        actions_taken=actions,
        reasoning=reasoning,
        alerts_created=len([a for a in actions if "Alert" in a]),
        model_used=get_settings().default_model,
    )
