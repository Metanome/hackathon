import sqlite3
from pathlib import Path

from fastapi import APIRouter, Depends

from config import get_settings
from services.gemini_service import clear_client_cache
from database import db_dependency
from repositories.agent_log_repository import AgentLogRepository
from repositories.alert_repository import AlertRepository
from repositories.order_repository import OrderRepository
from schemas.agent import AgentActionLog
from schemas.settings import AVAILABLE_MODELS, SettingsResponse, SettingsUpdate, ProfileResponse, ProfileUpdate

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

    # Invalidate cached settings and Gemini client so next request picks up new values
    get_settings.cache_clear()
    clear_client_cache()

    return get_settings_endpoint()


@router.get("/profile", response_model=ProfileResponse)
def get_profile(conn: sqlite3.Connection = Depends(db_dependency)) -> ProfileResponse:
    row = conn.execute("SELECT display_name, store_name FROM profile WHERE id = 1").fetchone()
    if not row:
        return ProfileResponse(display_name="", store_name="")
    return ProfileResponse(display_name=row["display_name"], store_name=row["store_name"])


@router.put("/profile", response_model=ProfileResponse)
def update_profile(
    data: ProfileUpdate,
    conn: sqlite3.Connection = Depends(db_dependency),
) -> ProfileResponse:
    conn.execute(
        """
        UPDATE profile
        SET display_name = COALESCE(?, display_name),
            store_name   = COALESCE(?, store_name),
            updated_at   = datetime('now')
        WHERE id = 1
        """,
        (data.display_name, data.store_name),
    )
    row = conn.execute("SELECT display_name, store_name FROM profile WHERE id = 1").fetchone()
    return ProfileResponse(display_name=row["display_name"], store_name=row["store_name"])


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
