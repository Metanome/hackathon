from datetime import datetime
from pydantic import BaseModel


class AlertResponse(BaseModel):
    id: int
    type: str
    product_id: int | None
    product_name: str | None
    message: str
    draft_email: str | None
    resolved: bool
    created_at: datetime


class AlertCreate(BaseModel):
    type: str
    product_id: int | None = None
    message: str
    draft_email: str | None = None
