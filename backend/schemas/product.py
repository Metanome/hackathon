from pydantic import BaseModel


class ProductCreate(BaseModel):
    name: str
    sku: str | None = None
    category: str = "Needs Setup"
    stock_quantity: int = 0
    reorder_threshold: int = 10
    supplier_name: str = ""
    supplier_email: str = ""
    unit_price: float = 0.0

class ProductResponse(BaseModel):
    id: int
    name: str
    sku: str
    category: str
    stock_quantity: int
    reorder_threshold: int
    supplier_name: str
    supplier_email: str
    unit_price: float
    status: str  # "ok" | "low" | "critical" - computed, not stored


class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    stock_quantity: int | None = None
    reorder_threshold: int | None = None
    supplier_name: str | None = None
    supplier_email: str | None = None
    unit_price: float | None = None
