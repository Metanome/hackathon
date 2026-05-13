import asyncio
import io
import sqlite3

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File
from PIL import Image
from google.genai.errors import ServerError

from agents import classifier_agent, vision_agent, voice_agent
from agents.planner_agent import synthesize_reasoning
from database import db_dependency
from repositories.alert_repository import AlertRepository
from repositories.agent_log_repository import AgentLogRepository
from repositories.order_repository import OrderRepository
from repositories.product_repository import ProductRepository
from schemas.agent import UploadResult
from schemas.alert import AlertCreate
from schemas.order import OrderCreate
from schemas.product import ProductCreate
from config import get_settings
from i18n import t as _t
from services.alert_service import sync_alert_tracked
from services.event_service import notify_clients

router = APIRouter(prefix="/api/upload", tags=["upload"])

_SUPPORTED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
_SUPPORTED_AUDIO_TYPES = {"audio/wav", "audio/mpeg", "audio/mp4", "audio/ogg", "audio/webm"}

def _base_mime(content_type: str) -> str:
    """Strip codec parameters, e.g. 'audio/webm;codecs=opus' -> 'audio/webm'."""
    return content_type.split(";")[0].strip()


_MAX_IMAGE_BYTES = 3 * 1024 * 1024

def _compress_image(data: bytes, mime: str) -> tuple[bytes, str]:
    if len(data) <= _MAX_IMAGE_BYTES:
        return data, mime
    img = Image.open(io.BytesIO(data)).convert("RGB")
    img.thumbnail((1920, 1920), Image.LANCZOS)
    buf = io.BytesIO()
    quality = 85
    img.save(buf, format="JPEG", quality=quality, optimize=True)
    while buf.tell() > _MAX_IMAGE_BYTES and quality > 40:
        quality -= 10
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
    return buf.getvalue(), "image/jpeg"


@router.post("/image", response_model=UploadResult)
async def upload_image(
    file: UploadFile = File(...),
    lang: str = Form("en"),
    conn: sqlite3.Connection = Depends(db_dependency),
) -> UploadResult:
    if file.content_type not in _SUPPORTED_IMAGE_TYPES:
        raise HTTPException(
            status_code=415,
            detail="ERR_UNSUPPORTED_IMAGE",
        )

    image_bytes = await file.read()
    image_bytes, image_mime = await asyncio.to_thread(_compress_image, image_bytes, file.content_type)
    notify_clients("progress:1")

    try:
        classification = await asyncio.to_thread(classifier_agent.classify_image, image_bytes, image_mime)
    except ServerError:
        raise HTTPException(status_code=503, detail="ERR_AI_UNAVAILABLE")

    if classification.type == "unknown" or classification.confidence == "low":
        raise HTTPException(
            status_code=422,
            detail="ERR_IMAGE_UNIDENTIFIED",
        )

    notify_clients("progress:2")
    try:
        if classification.type == "order_slip":
            result = await asyncio.to_thread(vision_agent.process_order_slip, image_bytes, image_mime, conn, lang)
        else:
            result = await asyncio.to_thread(vision_agent.process_shelf_scan, image_bytes, image_mime, conn, lang)
    except ServerError:
        raise HTTPException(status_code=503, detail="ERR_AI_UNAVAILABLE")
    except ValueError:
        raise HTTPException(status_code=422, detail="ERR_AI_PARSE")

    log_repo = AgentLogRepository(conn)
    log = log_repo.create(
        input_type=result.input_type,
        input_summary=_t("image_log_summary", lang, type=classification.type, confidence=classification.confidence),
        reasoning=result.reasoning,
        actions_taken=result.actions_taken,
        model_used=result.model_used,
        revert_data=result.revert_data,
    )
    conn.commit()
    notify_clients("update")

    return result.model_copy(update={"log_id": log.id})


@router.post("/audio", response_model=UploadResult)
async def upload_audio(
    file: UploadFile = File(...),
    lang: str = Form("en"),
    conn: sqlite3.Connection = Depends(db_dependency),
) -> UploadResult:
    mime = _base_mime(file.content_type or "")
    if mime not in _SUPPORTED_AUDIO_TYPES:
        raise HTTPException(
            status_code=415,
            detail="ERR_UNSUPPORTED_AUDIO",
        )

    audio_bytes = await file.read()
    notify_clients("progress:1")
    try:
        intent_result = await asyncio.to_thread(voice_agent.process_audio, audio_bytes, mime)
    except ServerError:
        raise HTTPException(status_code=503, detail="ERR_AI_UNAVAILABLE")
    except ValueError:
        raise HTTPException(status_code=422, detail="ERR_AI_PARSE")

    notify_clients("progress:2")
    actions: list[str] = [_t("transcribed", lang, text=intent_result.original_transcription)]
    alerts_created = 0
    revert_data: dict = {"orders_created": [], "products_created": [], "alerts_created": [], "stock_changes": []}

    product_repo = ProductRepository(conn)
    order_repo = OrderRepository(conn)

    if intent_result.intent == "add_order":
        customer = intent_result.entities.get("customer_name") or _t("customer_unknown", lang)
        raw_items = intent_result.entities.get("items") or []
        if not raw_items:
            single = intent_result.entities.get("product_name")
            if single:
                raw_items = [{"product_name": single, "quantity": intent_result.entities.get("quantity") or 1, "unit": intent_result.entities.get("unit")}]

        order_items: list[dict] = []
        alert_repo = AlertRepository(conn)
        for item in raw_items:
            product_name = item.get("product_name")
            quantity = item.get("quantity") or 1
            if not product_name:
                continue
            matches = product_repo.search_by_name(product_name)
            if not matches:
                new_prod = product_repo.create(ProductCreate(
                    name=product_name,
                    category=_t("category_needs_setup", lang),
                    stock_quantity=0,
                    unit_price=0.0,
                    unit=item.get("unit") or "pcs",
                ))
                product = new_prod
                revert_data["products_created"].append(new_prod.id)
                alert = alert_repo.create(AlertCreate(
                    type="setup_required",
                    product_id=new_prod.id,
                    message=_t("setup_required_message_voice", lang, name=product_name)
                ))
                revert_data["alerts_created"].append(alert.id)
                actions.append(_t("auto_created_product", lang, name=product_name))
                alerts_created += 1
            else:
                product = matches[0]
            order_items.append({"product_id": product.id, "quantity": quantity})
            actions.append(_t("order_created_voice", lang, qty=quantity, name=product.name, customer=customer))

        if order_items:
            order = order_repo.create(
                OrderCreate(
                    customer_name=customer,
                    source="voice",
                    items=order_items,
                )
            )
            revert_data["orders_created"].append(order.id)

    elif intent_result.intent == "update_stock":
        product_name = intent_result.entities.get("product_name")
        quantity = intent_result.entities.get("quantity") or 0
        if product_name and quantity:
            matches = product_repo.search_by_name(product_name)
            if matches:
                old_qty = matches[0].stock_quantity
                product_repo.update_stock(matches[0].id, quantity)
                revert_data["stock_changes"].append({"product_id": matches[0].id, "old_qty": old_qty})
                sync_alert_tracked(conn, matches[0].id, revert_data)
                actions.append(_t("stock_updated", lang, qty=quantity, name=matches[0].name))
            else:
                actions.append(_t("product_not_found", lang, name=product_name))

    elif intent_result.intent == "query_stock":
        product_name = intent_result.entities.get("product_name")
        if product_name:
            matches = product_repo.search_by_name(product_name)
            if matches:
                p = matches[0]
                actions.append(_t("stock_query_result", lang, name=p.name, qty=p.stock_quantity, status=_t(f"status_{p.status}", lang)))
            else:
                actions.append(_t("product_not_found", lang, name=product_name))

    notify_clients("progress:3")
    notify_clients("progress:4")
    context = (
        f"Input type: voice note. "
        f"Transcription: '{intent_result.original_transcription}'. "
        f"Detected intent: {intent_result.intent}. "
        f"Entities: {intent_result.entities}. "
        f"Actions taken: {actions}."
    )
    reasoning = await asyncio.to_thread(synthesize_reasoning, context, lang)

    log_repo = AgentLogRepository(conn)
    model_used = get_settings().default_model
    log = log_repo.create(
        input_type="voice",
        input_summary=_t("voice_log_summary", lang, text=intent_result.original_transcription[:80]),
        reasoning=reasoning,
        actions_taken=actions,
        model_used=model_used,
        revert_data=revert_data,
    )
    conn.commit()
    notify_clients("update")

    return UploadResult(
        input_type="voice",
        actions_taken=actions,
        reasoning=reasoning,
        alerts_created=alerts_created,
        model_used=model_used,
        log_id=log.id,
        revert_data=revert_data,
    )
