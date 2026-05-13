from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str
    sku: str | None = None
    category: str = "Needs Setup"
    stock_quantity: int = Field(0, ge=0)
    reorder_threshold: int = Field(10, ge=0)
    supplier_name: str = ""
    supplier_email: str = ""
    unit_price: float = Field(0.0, ge=0)
    unit: str = 'pcs'

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
    unit: str
    status: str  # "ok" | "low" | "critical" - computed, not stored


class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    stock_quantity: int | None = Field(None, ge=0)
    reorder_threshold: int | None = Field(None, ge=0)
    supplier_name: str | None = None
    supplier_email: str | None = None
    unit_price: float | None = Field(None, ge=0)
    unit: str | None = None
