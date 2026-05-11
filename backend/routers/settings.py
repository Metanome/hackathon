import sqlite3
from pathlib import Path

from fastapi import APIRouter, Depends

from config import get_settings
from database import db_dependency
from repositories.agent_log_repository import AgentLogRepository
from repositories.alert_repository import AlertRepository
from repositories.order_repository import OrderRepository
from schemas.agent import AgentActionLog
from schemas.settings import AVAILABLE_MODELS, SettingsResponse, SettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
def get_settings_endpoint() -> SettingsResponse:
    settings = get_settings()
    return SettingsResponse(
        default_model=settings.default_model,
        available_models=AVAILABLE_MODELS,
        api_key_set=bool(settings.gemini_api_key),
    )


@router.post("", response_model=SettingsResponse)
def update_settings(data: SettingsUpdate) -> SettingsResponse:
    """
    Persist new model/API key to .env and invalidate the cached settings.
    """
    env_path = Path(".env")
    env_lines = env_path.read_text(encoding="utf-8").splitlines() if env_path.exists() else []

    new_values: dict[str, str] = {}
    if data.default_model and data.default_model in AVAILABLE_MODELS:
        new_values["DEFAULT_MODEL"] = data.default_model
    if data.gemini_api_key:
        new_values["GEMINI_API_KEY"] = data.gemini_api_key

    updated_keys = set()
    new_lines = []
    for line in env_lines:
        key = line.split("=", 1)[0].strip()
        if key in new_values:
            new_lines.append(f"{key}={new_values[key]}")
            updated_keys.add(key)
        else:
            new_lines.append(line)

    for key, value in new_values.items():
        if key not in updated_keys:
            new_lines.append(f"{key}={value}")

    env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")

    # Invalidate cached settings so next request picks up new values
    get_settings.cache_clear()

    return get_settings_endpoint()


@router.get("/dashboard-summary")
def dashboard_summary(conn: sqlite3.Connection = Depends(db_dependency)) -> dict:
    order_repo = OrderRepository(conn)
    alert_repo = AlertRepository(conn)
    return {
        "orders_today": order_repo.count_today(),
        "active_alerts": alert_repo.count_unresolved(),
    }


@router.post("/reset")
def reset_database() -> dict:
    """Reset the database and reseed with default data."""
    from database import reset_db
    from seed import seed
    reset_db()
    seed()
    return {"status": "success", "message": "Database reset and seeded."}


@router.get("/agent-logs", response_model=list[AgentActionLog])
def get_agent_logs(
    limit: int = 10,
    conn: sqlite3.Connection = Depends(db_dependency),
) -> list[AgentActionLog]:
    return AgentLogRepository(conn).get_recent(limit=limit)
