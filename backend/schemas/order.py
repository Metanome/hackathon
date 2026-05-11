from datetime import datetime
from pydantic import BaseModel


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: float


class OrderResponse(BaseModel):
    id: int
    customer_name: str
    created_at: datetime
    status: str
    source: str
    items: list[OrderItemResponse] = []


class OrderCreate(BaseModel):
    customer_name: str
    source: str = "manual"
    items: list[dict]  # [{product_id, quantity}]


class OrderUpdate(BaseModel):
    status: str
