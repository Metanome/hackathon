import sqlite3

from schemas.product import ProductCreate, ProductResponse, ProductUpdate


def _stock_status(qty: int, threshold: int) -> str:
    if qty == 0:
        return "critical"
    if qty < threshold:
        return "low"
    return "ok"


def _row_to_product(row: sqlite3.Row) -> ProductResponse:
    return ProductResponse(
        id=row["id"],
        name=row["name"],
        sku=row["sku"],
        category=row["category"],
        stock_quantity=row["stock_quantity"],
        reorder_threshold=row["reorder_threshold"],
        supplier_name=row["supplier_name"],
        supplier_email=row["supplier_email"],
        unit_price=row["unit_price"],
        status=_stock_status(row["stock_quantity"], row["reorder_threshold"]),
    )


class ProductRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def create(self, data: ProductCreate) -> ProductResponse:
        import uuid
        sku = data.sku or f"PRD-{str(uuid.uuid4())[:8].upper()}"
        cursor = self._conn.execute(
            """
            INSERT INTO products (name, sku, category, stock_quantity, reorder_threshold, supplier_name, supplier_email, unit_price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (data.name, sku, data.category, data.stock_quantity, data.reorder_threshold, data.supplier_name, data.supplier_email, data.unit_price)
        )
        return self.get_by_id(cursor.lastrowid)

    def get_all(self) -> list[ProductResponse]:
        rows = self._conn.execute(
            "SELECT * FROM products ORDER BY name"
        ).fetchall()
        return [_row_to_product(r) for r in rows]

    def get_by_id(self, product_id: int) -> ProductResponse | None:
        row = self._conn.execute(
            "SELECT * FROM products WHERE id = ?", (product_id,)
        ).fetchone()
        return _row_to_product(row) if row else None

    def search_by_name(self, name: str) -> list[ProductResponse]:
        """Case-insensitive partial match - used by agents for fuzzy product lookup."""
        rows = self._conn.execute(
            "SELECT * FROM products WHERE LOWER(name) LIKE ?",
            (f"%{name.lower()}%",),
        ).fetchall()
        return [_row_to_product(r) for r in rows]

    def update_stock(self, product_id: int, delta: int) -> ProductResponse | None:
        """Apply a positive or negative delta to stock_quantity."""
        self._conn.execute(
            "UPDATE products SET stock_quantity = MAX(0, stock_quantity + ?) WHERE id = ?",
            (delta, product_id),
        )
        return self.get_by_id(product_id)

    def update(self, product_id: int, data: ProductUpdate) -> ProductResponse | None:
        fields = {k: v for k, v in data.model_dump().items() if v is not None}
        if not fields:
            return self.get_by_id(product_id)
        set_clause = ", ".join(f"{k} = ?" for k in fields)
        self._conn.execute(
            f"UPDATE products SET {set_clause} WHERE id = ?",
            (*fields.values(), product_id),
        )

        if "unit_price" in fields:
            # Sync the new price to any pending orders containing this product
            self._conn.execute(
                """
                UPDATE order_items 
                SET unit_price = ? 
                WHERE product_id = ? 
                  AND order_id IN (SELECT id FROM orders WHERE status = 'pending')
                """,
                (fields["unit_price"], product_id)
            )

        return self.get_by_id(product_id)

    def get_below_threshold(self) -> list[ProductResponse]:
        rows = self._conn.execute(
            "SELECT * FROM products WHERE stock_quantity < reorder_threshold ORDER BY stock_quantity"
        ).fetchall()
        return [_row_to_product(r) for r in rows]
