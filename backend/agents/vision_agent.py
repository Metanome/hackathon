import sqlite3

from agents import planner_agent
from config import get_settings
from i18n import t as _t
from prompts import ORDER_EXTRACTION_PROMPT, SHELF_SCAN_PROMPT
from repositories.alert_repository import AlertRepository
from repositories.order_repository import OrderRepository
from repositories.product_repository import ProductRepository
from schemas.agent import OrderExtractionResult, ShelfScanResult, UploadResult
from schemas.alert import AlertCreate
from schemas.order import OrderCreate
from schemas.product import ProductCreate
from services.alert_service import sync_alert_tracked
from services.event_service import notify_clients
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
    notify_clients("progress:3")

    actions: list[str] = []
    order_items: list[dict] = []
    revert_data: dict = {"orders_created": [], "products_created": [], "alerts_created": []}

    for item in extraction.items:
        matches = product_repo.search_by_name(item.product_name)
        if not matches:
            new_prod = product_repo.create(ProductCreate(
                name=item.product_name,
                category=_t("category_needs_setup", lang),
                stock_quantity=0,
                unit_price=0.0,
                unit=item.unit or "pcs",
            ))
            product = new_prod
            revert_data["products_created"].append(new_prod.id)
            alert = alert_repo.create(AlertCreate(
                type="setup_required",
                product_id=new_prod.id,
                message=_t("setup_required_message_order", lang, name=item.product_name)
            ))
            revert_data["alerts_created"].append(alert.id)
            actions.append(_t("auto_created_product", lang, name=item.product_name))
        else:
            product = matches[0]

        order_items.append({"product_id": product.id, "quantity": item.quantity})
        sync_alert_tracked(conn, product.id, revert_data)
        actions.append(_t("alert_synced", lang, name=product.name))

    if order_items:
        order = order_repo.create(OrderCreate(
            customer_name=extraction.customer_name,
            source="image_order",
            items=order_items,
        ))
        revert_data["orders_created"].append(order.id)
        actions.append(_t("order_created_customer", lang, customer=extraction.customer_name))

    notify_clients("progress:4")
    context = (
        f"Input type: handwritten order slip. "
        f"Customer: {extraction.customer_name}. "
        f"Items extracted: {[f'{i.quantity}\u00d7 {i.product_name}' for i in extraction.items]}. "
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
        revert_data=revert_data,
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
    notify_clients("progress:3")

    actions: list[str] = []
    revert_data: dict = {"alerts_created": []}

    for detected in scan.products_detected:
        if detected.status == "adequate":
            continue

        matches = product_repo.search_by_name(detected.name)
        product_id = matches[0].id if matches else None
        product_display = matches[0].name if matches else detected.name

        if product_id:
            sync_alert_tracked(conn, product_id, revert_data)
            actions.append(_t("shelf_alert_synced", lang, name=product_display))
        else:
            existing = conn.execute(
                "SELECT id FROM alerts WHERE product_id IS NULL AND resolved = 0 AND message LIKE ?",
                (f"%'{detected.name}'%",),
            ).fetchone()
            if not existing:
                alert = alert_repo.create(AlertCreate(
                    type="critical_stock" if detected.status == "critical" else "low_stock",
                    product_id=None,
                    message=_t("shelf_unknown_alert_message", lang, name=detected.name, status=detected.status),
                ))
                revert_data["alerts_created"].append(alert.id)
                actions.append(_t("shelf_unknown_action", lang, name=detected.name, status=detected.status))
            else:
                actions.append(_t("shelf_existing_alert", lang, name=detected.name))

    notify_clients("progress:4")
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
        revert_data=revert_data,
    )
