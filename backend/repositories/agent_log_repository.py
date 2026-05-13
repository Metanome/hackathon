import json
import sqlite3
from datetime import datetime

from schemas.agent import AgentActionLog


def _row_to_log(row: sqlite3.Row) -> AgentActionLog:
    revert_raw = row["revert_data"]
    return AgentActionLog(
        id=row["id"],
        input_type=row["input_type"],
        input_summary=row["input_summary"],
        reasoning=row["reasoning"],
        actions_taken=json.loads(row["actions_taken"]),
        model_used=row["model_used"],
        revert_data=json.loads(revert_raw) if revert_raw else None,
        created_at=datetime.fromisoformat(row["created_at"]),
    )


class AgentLogRepository:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def create(
        self,
        input_type: str,
        input_summary: str,
        reasoning: str,
        actions_taken: list[str],
        model_used: str,
        revert_data: dict | None = None,
    ) -> AgentActionLog:
        cursor = self._conn.execute(
            """
            INSERT INTO agent_logs (input_type, input_summary, reasoning, actions_taken, model_used, revert_data)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (input_type, input_summary, reasoning, json.dumps(actions_taken), model_used,
             json.dumps(revert_data) if revert_data is not None else None),
        )
        row = self._conn.execute(
            "SELECT * FROM agent_logs WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        return _row_to_log(row)

    def get_by_id(self, log_id: int) -> AgentActionLog | None:
        row = self._conn.execute(
            "SELECT * FROM agent_logs WHERE id = ?", (log_id,)
        ).fetchone()
        return _row_to_log(row) if row else None

    def get_recent(self, limit: int = 10) -> list[AgentActionLog]:
        rows = self._conn.execute(
            "SELECT * FROM agent_logs ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [_row_to_log(r) for r in rows]
