import sqlite3
from datetime import datetime

from schemas.alert import AlertCreate, AlertResponse


def _row_to_alert(row: sqlite3.Row, product_name: str | None = None) -> AlertResponse:
    return AlertResponse(
        id=row["id"],
        type=row["type"],
        product_id=row["product_id"],
        product_name=product_name,
        message=row["message"],
        draft_email=row["draft_email"],
        resolved=bool(row["resolved"]),
        created_at=datetime.fromisoformat(row["created_at"]),
    )


class AlertRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def get_unresolved(self) -> list[AlertResponse]:
        rows = self._conn.execute(
            """
            SELECT a.*, p.name AS product_name
            FROM alerts a
            LEFT JOIN products p ON p.id = a.product_id
            WHERE a.resolved = 0
            ORDER BY a.created_at DESC
            """
        ).fetchall()
        return [
            _row_to_alert(r, r["product_name"] if "product_name" in r.keys() else None)
            for r in rows
        ]

    def get_all(self) -> list[AlertResponse]:
        rows = self._conn.execute(
            """
            SELECT a.*, p.name AS product_name
            FROM alerts a
            LEFT JOIN products p ON p.id = a.product_id
            ORDER BY a.created_at DESC
            LIMIT 50
            """
        ).fetchall()
        return [
            _row_to_alert(r, r["product_name"] if "product_name" in r.keys() else None)
            for r in rows
        ]

    def create(self, data: AlertCreate) -> AlertResponse:
        cursor = self._conn.execute(
            "INSERT INTO alerts (type, product_id, message, draft_email) VALUES (?, ?, ?, ?)",
            (data.type, data.product_id, data.message, data.draft_email),
        )
        row = self._conn.execute(
            "SELECT * FROM alerts WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        return _row_to_alert(row)

    def resolve(self, alert_id: int) -> bool:
        cursor = self._conn.execute(
            "UPDATE alerts SET resolved = 1 WHERE id = ?", (alert_id,)
        )
        return cursor.rowcount > 0

    def count_unresolved(self) -> int:
        return self._conn.execute(
            "SELECT COUNT(*) FROM alerts WHERE resolved = 0"
        ).fetchone()[0]

    def alert_exists_for_product(self, product_id: int) -> bool:
        """Avoid duplicate unresolved alerts for the same product."""
        row = self._conn.execute(
            "SELECT 1 FROM alerts WHERE product_id = ? AND resolved = 0 LIMIT 1",
            (product_id,),
        ).fetchone()
        return row is not None
