import sqlite3
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

from config import get_settings
from services.gemini_service import clear_client_cache, list_models
from database import db_dependency
from repositories.agent_log_repository import AgentLogRepository
from repositories.alert_repository import AlertRepository
from repositories.order_repository import OrderRepository
from repositories.product_repository import ProductRepository
from schemas.agent import AgentActionLog
from services.event_service import notify_clients
from schemas.settings import SettingsResponse, SettingsUpdate, ProfileResponse, ProfileUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
def get_settings_endpoint() -> SettingsResponse:
    settings = get_settings()
    return SettingsResponse(
        default_model=settings.default_model,
        available_models=list_models(),
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
    if data.default_model and data.default_model in list_models():
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
    row = conn.execute("SELECT display_name, store_name, language_preference FROM profile WHERE id = 1").fetchone()
    if not row:
        return ProfileResponse(display_name="", store_name="", language_preference="tr")
    return ProfileResponse(display_name=row["display_name"], store_name=row["store_name"], language_preference=row["language_preference"])


@router.put("/profile", response_model=ProfileResponse)
def update_profile(
    data: ProfileUpdate,
    conn: sqlite3.Connection = Depends(db_dependency),
) -> ProfileResponse:
    conn.execute(
        """
        UPDATE profile
        SET display_name        = COALESCE(?, display_name),
            store_name          = COALESCE(?, store_name),
            language_preference = COALESCE(?, language_preference),
            updated_at          = datetime('now')
        WHERE id = 1
        """,
        (data.display_name, data.store_name, data.language_preference),
    )
    conn.commit()
    row = conn.execute("SELECT display_name, store_name, language_preference FROM profile WHERE id = 1").fetchone()
    return ProfileResponse(display_name=row["display_name"], store_name=row["store_name"], language_preference=row["language_preference"])


@router.get("/dashboard-summary")
def dashboard_summary(conn: sqlite3.Connection = Depends(db_dependency)) -> dict:
    order_repo = OrderRepository(conn)
    alert_repo = AlertRepository(conn)
    product_repo = ProductRepository(conn)
    stock_counts = product_repo.stock_status_counts()
    total_products = sum(stock_counts.values())
    return {
        "orders_today": order_repo.count_today(),
        "active_alerts": alert_repo.count_unresolved(),
        "total_revenue": order_repo.total_revenue(),
        "stock_counts": stock_counts,
        "total_products": total_products,
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


@router.post("/agent-logs/{log_id}/revert")
def revert_agent_log(
    log_id: int,
    conn: sqlite3.Connection = Depends(db_dependency),
) -> dict:
    log = AgentLogRepository(conn).get_by_id(log_id)
    if not log:
        raise HTTPException(status_code=404, detail="ERR_LOG_NOT_FOUND")
    if not log.revert_data:
        raise HTTPException(status_code=422, detail="ERR_NO_REVERT_DATA")

    rd = log.revert_data
    for order_id in rd.get("orders_created", []):
        conn.execute("DELETE FROM order_items WHERE order_id = ?", (order_id,))
        conn.execute("DELETE FROM orders WHERE id = ?", (order_id,))
    for product_id in rd.get("products_created", []):
        conn.execute("DELETE FROM alerts WHERE product_id = ?", (product_id,))
        conn.execute("DELETE FROM order_items WHERE product_id = ?", (product_id,))
        conn.execute("DELETE FROM products WHERE id = ?", (product_id,))
    for alert_id in rd.get("alerts_created", []):
        conn.execute("UPDATE alerts SET resolved = 1 WHERE id = ?", (alert_id,))
    for alert_id in rd.get("alerts_resolved", []):
        conn.execute("UPDATE alerts SET resolved = 0 WHERE id = ?", (alert_id,))
    for entry in rd.get("alerts_updated", []):
        conn.execute(
            "UPDATE alerts SET type = ?, message = ?, draft_email = ? WHERE id = ?",
            (entry["type"], entry["message"], entry["draft_email"], entry["id"]),
        )
    for change in rd.get("stock_changes", []):
        conn.execute("UPDATE products SET stock_quantity = ? WHERE id = ?",
                     (change["old_qty"], change["product_id"]))

    conn.commit()
    notify_clients("update")
    return {"status": "reverted"}
