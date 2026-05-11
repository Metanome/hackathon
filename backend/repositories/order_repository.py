import sqlite3
from datetime import datetime

from schemas.order import OrderCreate, OrderItemResponse, OrderResponse


def _build_order(row: sqlite3.Row, items: list[OrderItemResponse]) -> OrderResponse:
    return OrderResponse(
        id=row["id"],
        customer_name=row["customer_name"],
        created_at=datetime.fromisoformat(row["created_at"]),
        status=row["status"],
        source=row["source"],
        items=items,
    )


class OrderRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def get_all(self, status: str | None = None) -> list[OrderResponse]:
        if status:
            rows = self._conn.execute(
                "SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC",
                (status,),
            ).fetchall()
        else:
            rows = self._conn.execute(
                "SELECT * FROM orders ORDER BY created_at DESC"
            ).fetchall()
        return [_build_order(r, self._get_items(r["id"])) for r in rows]

    def get_by_id(self, order_id: int) -> OrderResponse | None:
        row = self._conn.execute(
            "SELECT * FROM orders WHERE id = ?", (order_id,)
        ).fetchone()
        if not row:
            return None
        return _build_order(row, self._get_items(order_id))

    def create(self, data: OrderCreate) -> OrderResponse:
        cursor = self._conn.execute(
            "INSERT INTO orders (customer_name, status, source) VALUES (?, 'pending', ?)",
            (data.customer_name, data.source),
        )
        order_id = cursor.lastrowid
        for item in data.items:
            product_row = self._conn.execute(
                "SELECT unit_price FROM products WHERE id = ?", (item["product_id"],)
            ).fetchone()
            unit_price = product_row["unit_price"] if product_row else 0.0
            self._conn.execute(
                "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
                (order_id, item["product_id"], item["quantity"], unit_price),
            )
        return self.get_by_id(order_id)

    def update_status(self, order_id: int, status: str) -> OrderResponse | None:
        self._conn.execute(
            "UPDATE orders SET status = ? WHERE id = ?",
            (status, order_id),
        )
        return self.get_by_id(order_id)

    def count_today(self) -> int:
        return self._conn.execute(
            "SELECT COUNT(*) FROM orders WHERE DATE(created_at) = DATE('now')"
        ).fetchone()[0]

    def _get_items(self, order_id: int) -> list[OrderItemResponse]:
        rows = self._conn.execute(
            """
            SELECT oi.id, oi.product_id, p.name AS product_name, oi.quantity, oi.unit_price
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = ?
            """,
            (order_id,),
        ).fetchall()
        return [
            OrderItemResponse(
                id=r["id"],
                product_id=r["product_id"],
                product_name=r["product_name"],
                quantity=r["quantity"],
                unit_price=r["unit_price"],
            )
            for r in rows
        ]
