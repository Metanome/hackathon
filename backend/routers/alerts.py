import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from database import db_dependency
from repositories.alert_repository import AlertRepository
from schemas.alert import AlertResponse
from services.event_service import notify_clients

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertResponse])
def get_alerts(
    all: bool = False,
    conn: sqlite3.Connection = Depends(db_dependency),
) -> list[AlertResponse]:
    repo = AlertRepository(conn)
    return repo.get_all() if all else repo.get_unresolved()


@router.post("/{alert_id}/resolve", response_model=dict)
def resolve_alert(
    alert_id: int,
    conn: sqlite3.Connection = Depends(db_dependency),
) -> dict:
    if not AlertRepository(conn).resolve(alert_id):
        raise HTTPException(status_code=404, detail="ERR_ALERT_NOT_FOUND")
    conn.commit()
    notify_clients("update")
    return {"success": True}
