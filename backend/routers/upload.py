import sqlite3

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File
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
from fastapi import BackgroundTasks
from services.alert_service import check_and_alert_stock
from services.event_service import notify_clients

router = APIRouter(prefix="/api/upload", tags=["upload"])

_SUPPORTED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
_SUPPORTED_AUDIO_TYPES = {"audio/wav", "audio/mpeg", "audio/mp4", "audio/ogg", "audio/webm"}

def _base_mime(content_type: str) -> str:
    """Strip codec parameters, e.g. 'audio/webm;codecs=opus' -> 'audio/webm'."""
    return content_type.split(";")[0].strip()


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

    try:
        classification = classifier_agent.classify_image(image_bytes, file.content_type)
    except ServerError:
        raise HTTPException(status_code=503, detail="ERR_AI_UNAVAILABLE")

    if classification.type == "unknown" or classification.confidence == "low":
        raise HTTPException(
            status_code=422,
            detail="ERR_IMAGE_UNIDENTIFIED",
        )

    try:
        if classification.type == "order_slip":
            result = vision_agent.process_order_slip(image_bytes, file.content_type, conn, lang)
        else:
            result = vision_agent.process_shelf_scan(image_bytes, file.content_type, conn, lang)
    except ServerError:
        raise HTTPException(status_code=503, detail="ERR_AI_UNAVAILABLE")
    except ValueError:
        raise HTTPException(status_code=422, detail="ERR_AI_PARSE")

    log_repo = AgentLogRepository(conn)
    log_repo.create(
        input_type=result.input_type,
        input_summary=f"{classification.type} detected (confidence: {classification.confidence})",
        reasoning=result.reasoning,
        actions_taken=result.actions_taken,
        model_used=result.model_used,
    )
    conn.commit()
    notify_clients("update")

    return result


@router.post("/audio", response_model=UploadResult)
async def upload_audio(
    background_tasks: BackgroundTasks,
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
    try:
        intent_result = voice_agent.process_audio(audio_bytes, mime)
    except ServerError:
        raise HTTPException(status_code=503, detail="ERR_AI_UNAVAILABLE")
    except ValueError:
        raise HTTPException(status_code=422, detail="ERR_AI_PARSE")

    actions: list[str] = [f"[mic] Transcribed: \"{intent_result.original_transcription}\""]
    alerts_created = 0

    product_repo = ProductRepository(conn)
    order_repo = OrderRepository(conn)

    if intent_result.intent == "add_order":
        customer = intent_result.entities.get("customer_name") or "Unknown"
        product_name = intent_result.entities.get("product_name")
        quantity = intent_result.entities.get("quantity") or 1
        if product_name:
            matches = product_repo.search_by_name(product_name)
            if not matches:
                new_prod = product_repo.create(ProductCreate(
                    name=product_name,
                    category="Needs Setup",
                    stock_quantity=0,
                    unit_price=0.0
                ))
                product = new_prod
                
                alert_repo = AlertRepository(conn)
                alert_repo.create(AlertCreate(
                    type="setup_required",
                    product_id=new_prod.id,
                    message=f"New product '{product_name}' was auto-added from a voice note. Please configure pricing and SKU."
                ))
                actions.append(f"[info] Auto-created missing product: '{product_name}'")
                alerts_created += 1
            else:
                product = matches[0]

            order_repo.create(
                OrderCreate(
                    customer_name=customer,
                    source="voice",
                    items=[{"product_id": product.id, "quantity": quantity}],
                )
            )
            actions.append(f"[ok] Order created: {quantity}× {product.name} for {customer}")

    elif intent_result.intent == "update_stock":
        product_name = intent_result.entities.get("product_name")
        quantity = intent_result.entities.get("quantity") or 0
        if product_name and quantity:
            matches = product_repo.search_by_name(product_name)
            if matches:
                product_repo.update_stock(matches[0].id, quantity)
                conn.commit() # Commit before background task
                background_tasks.add_task(check_and_alert_stock, matches[0].id)
                actions.append(f"[ok] Stock updated: +{quantity} {matches[0].name}")
            else:
                actions.append(f"[warn] Product '{product_name}' not found")

    elif intent_result.intent == "query_stock":
        product_name = intent_result.entities.get("product_name")
        if product_name:
            matches = product_repo.search_by_name(product_name)
            if matches:
                p = matches[0]
                actions.append(f"[info] {p.name}: {p.stock_quantity} units in stock ({p.status})")
            else:
                actions.append(f"[warn] Product '{product_name}' not found")

    context = (
        f"Input type: voice note. "
        f"Transcription: '{intent_result.original_transcription}'. "
        f"Detected intent: {intent_result.intent}. "
        f"Entities: {intent_result.entities}. "
        f"Actions taken: {actions}."
    )
    reasoning = synthesize_reasoning(context, lang)

    log_repo = AgentLogRepository(conn)
    model_used = get_settings().default_model
    log_repo.create(
        input_type="voice",
        input_summary=f"Voice note: '{intent_result.original_transcription[:80]}'",
        reasoning=reasoning,
        actions_taken=actions,
        model_used=model_used,
    )
    conn.commit()
    notify_clients("update")

    return UploadResult(
        input_type="voice",
        actions_taken=actions,
        reasoning=reasoning,
        alerts_created=alerts_created,
        model_used=model_used,
    )
