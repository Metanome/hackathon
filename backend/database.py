import sqlite3
from contextlib import contextmanager
from typing import Generator

from config import get_settings

_CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS profile (
    id           INTEGER PRIMARY KEY CHECK (id = 1),
    display_name TEXT NOT NULL DEFAULT '',
    store_name   TEXT NOT NULL DEFAULT '',
    updated_at   DATETIME NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO profile (id, display_name, store_name) VALUES (1, '', '');

CREATE TABLE IF NOT EXISTS products (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT    NOT NULL,
    sku              TEXT    NOT NULL UNIQUE,
    category         TEXT    NOT NULL DEFAULT '',
    stock_quantity   INTEGER NOT NULL DEFAULT 0,
    reorder_threshold INTEGER NOT NULL DEFAULT 10,
    supplier_name    TEXT    NOT NULL DEFAULT '',
    supplier_email   TEXT    NOT NULL DEFAULT '',
    unit_price       REAL    NOT NULL DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT    NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT (datetime('now')),
    status        TEXT    NOT NULL DEFAULT 'pending',
    source        TEXT    NOT NULL DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS order_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity   INTEGER NOT NULL,
    unit_price REAL    NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    type       TEXT    NOT NULL,
    product_id INTEGER REFERENCES products(id),
    message    TEXT    NOT NULL,
    draft_email TEXT,
    resolved   INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_logs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    input_type    TEXT    NOT NULL,
    input_summary TEXT    NOT NULL,
    reasoning     TEXT    NOT NULL,
    actions_taken TEXT    NOT NULL DEFAULT '[]',
    model_used    TEXT    NOT NULL,
    created_at    DATETIME NOT NULL DEFAULT (datetime('now'))
);
"""


def init_db() -> None:
    """Create all tables on startup if they do not exist."""
    settings = get_settings()
    conn = sqlite3.connect(settings.database_path)
    try:
        conn.executescript(_CREATE_TABLES_SQL)
        conn.commit()
    finally:
        conn.close()

def reset_db() -> None:
    """Drop all tables and recreate them."""
    settings = get_settings()
    conn = sqlite3.connect(settings.database_path)
    try:
        conn.executescript("""
            DROP TABLE IF EXISTS agent_logs;
            DROP TABLE IF EXISTS alerts;
            DROP TABLE IF EXISTS order_items;
            DROP TABLE IF EXISTS orders;
            DROP TABLE IF EXISTS products;
            -- profile table is intentionally excluded: user data survives a data reset
        """)
        conn.commit()
    finally:
        conn.close()
    init_db()


def get_connection() -> sqlite3.Connection:
    """Return a new SQLite connection with row_factory set."""
    settings = get_settings()
    conn = sqlite3.connect(settings.database_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    """Context manager for a single request-scoped DB connection."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def db_dependency() -> Generator[sqlite3.Connection, None, None]:
    """FastAPI Depends-compatible generator."""
    with get_db() as conn:
        yield conn
