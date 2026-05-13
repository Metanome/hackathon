from datetime import datetime
from pydantic import BaseModel


# --- Classifier ---

class ClassificationResult(BaseModel):
    type: str   # "order_slip" | "shelf_scan" | "unknown"
    confidence: str  # "high" | "medium" | "low"


# --- Vision: Order Slip ---

class ExtractedItem(BaseModel):
    product_name: str
    quantity: int
    unit: str | None = None


class OrderExtractionResult(BaseModel):
    customer_name: str
    items: list[ExtractedItem]
    notes: str = ""


# --- Vision: Shelf Scan ---

class DetectedProduct(BaseModel):
    name: str
    status: str  # "adequate" | "low" | "critical"


class ShelfScanResult(BaseModel):
    overall_status: str  # "adequate" | "low" | "critical"
    observations: str
    products_detected: list[DetectedProduct]


# --- Voice ---

class VoiceIntentResult(BaseModel):
    intent: str   # "add_order" | "update_stock" | "query_stock"
    entities: dict
    original_transcription: str


# --- Agent Log ---

class AgentActionLog(BaseModel):
    id: int
    input_type: str
    input_summary: str
    reasoning: str
    actions_taken: list[str]
    model_used: str
    revert_data: dict | None = None
    created_at: datetime


# --- Upload Response (returned to frontend) ---

class UploadResult(BaseModel):
    input_type: str
    actions_taken: list[str]
    reasoning: str
    alerts_created: int
    model_used: str
    log_id: int | None = None
    revert_data: dict | None = None
