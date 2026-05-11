import sqlite3

from agents import planner_agent
from prompts import ORDER_EXTRACTION_PROMPT, SHELF_SCAN_PROMPT
from repositories.alert_repository import AlertRepository
from repositories.order_repository import OrderRepository
from repositories.product_repository import ProductRepository
from schemas.agent import OrderExtractionResult, ShelfScanResult, UploadResult
from schemas.alert import AlertCreate
from schemas.order import OrderCreate
from schemas.product import ProductCreate
from services.email_service import draft_reorder_email
from services.gemini_service import generate_from_image


def process_order_slip(
    image_bytes: bytes,
    mime_type: str,
    conn: sqlite3.Connection,
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
            actions.append(f"✨ Auto-created missing product: '{item.product_name}'")
        else:
            product = matches[0]
        product_repo.update_stock(product.id, -item.quantity)
        order_items.append({"product_id": product.id, "quantity": item.quantity})
        actions.append(f"✅ Deducted {item.quantity}× {product.name} from stock")

        updated = product_repo.get_by_id(product.id)
        if updated and updated.status in ("low", "critical"):
            if not alert_repo.alert_exists_for_product(product.id):
                alert_type = "critical_stock" if updated.status == "critical" else "low_stock"
                alert_repo.create(AlertCreate(
                    type=alert_type,
                    product_id=product.id,
                    message=f"{product.name} is {updated.status} ({updated.stock_quantity} units remaining).",
                ))
                actions.append(f"🔔 Alert created: {product.name} is {updated.status}")

    if order_items:
        order_repo.create(OrderCreate(
            customer_name=extraction.customer_name,
            source="image_order",
            items=order_items,
        ))
        actions.append(f"📦 Order created for customer: {extraction.customer_name}")

    context = (
        f"Input type: handwritten order slip. "
        f"Customer: {extraction.customer_name}. "
        f"Items extracted: {[f'{i.quantity}× {i.product_name}' for i in extraction.items]}. "
        f"Actions taken: {actions}. "
        f"Notes: {extraction.notes or 'none'}."
    )
    reasoning = planner_agent.synthesize_reasoning(context)
    alerts_created = sum(1 for a in actions if "Alert created" in a)

    from config import get_settings
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
) -> UploadResult:
    """
    Assess shelf stock levels from a photo and create alerts for low/critical products.
    """
    product_repo = ProductRepository(conn)
    alert_repo = AlertRepository(conn)

    raw = generate_from_image(image_bytes, mime_type, SHELF_SCAN_PROMPT)
    scan = ShelfScanResult(**raw)

    actions: list[str] = []
    critical_products_for_email: list[dict] = []

    for detected in scan.products_detected:
        if detected.status == "adequate":
            continue

        matches = product_repo.search_by_name(detected.name)
        product_id = matches[0].id if matches else None
        product_display = matches[0].name if matches else detected.name

        if product_id and alert_repo.alert_exists_for_product(product_id):
            continue

        alert_type = "critical_stock" if detected.status == "critical" else "low_stock"
        draft_email = None

        if detected.status == "critical" and matches:
            p = matches[0]
            critical_products_for_email.append({
                "name": p.name,
                "sku": p.sku,
                "stock_quantity": p.stock_quantity,
                "supplier_name": p.supplier_name,
                "supplier_email": p.supplier_email,
            })

        alert_repo.create(AlertCreate(
            type=alert_type,
            product_id=product_id,
            message=f"Shelf scan detected '{product_display}' as {detected.status}.",
            draft_email=draft_email,
        ))
        actions.append(f"🔔 Alert: '{product_display}' appears {detected.status} on shelf")

    if critical_products_for_email:
        supplier_name = critical_products_for_email[0]["supplier_name"] or "Supplier"
        supplier_email = critical_products_for_email[0]["supplier_email"] or ""
        email_body = draft_reorder_email(supplier_name, supplier_email, critical_products_for_email)
        last_critical = conn.execute(
            "SELECT id FROM alerts WHERE type = 'critical_stock' ORDER BY id DESC LIMIT 1"
        ).fetchone()
        if last_critical:
            conn.execute(
                "UPDATE alerts SET draft_email = ? WHERE id = ?",
                (email_body, last_critical["id"]),
            )
        actions.append(f"✉️ Reorder email drafted for {len(critical_products_for_email)} critical product(s)")

    context = (
        f"Input type: shelf scan. "
        f"Overall shelf status: {scan.overall_status}. "
        f"Observations: {scan.observations}. "
        f"Products detected: {[f'{p.name} ({p.status})' for p in scan.products_detected]}. "
        f"Actions taken: {actions}."
    )
    reasoning = planner_agent.synthesize_reasoning(context)

    from config import get_settings
    return UploadResult(
        input_type="image_shelf",
        actions_taken=actions,
        reasoning=reasoning,
        alerts_created=len([a for a in actions if "Alert" in a]),
        model_used=get_settings().default_model,
    )
