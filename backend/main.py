import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from database import init_db
from routers import alerts, events, inventory, orders, settings, upload
from services.event_service import set_event_loop, shutdown as shutdown_events

logging.basicConfig(
    filename='backend.log',
    level=logging.ERROR,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    set_event_loop(asyncio.get_running_loop())
    yield
    shutdown_events()


app = FastAPI(
    title="Esnaf Tezgahı API",
    description="Multimodal AI operations platform for Turkish SMEs",
    version="1.0.0",
    lifespan=lifespan,
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unhandled error on {request.url.path}", exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


_settings = get_settings()
allowed_origins = [o.strip() for o in _settings.cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(orders.router)
app.include_router(inventory.router)
app.include_router(alerts.router)
app.include_router(settings.router)
app.include_router(events.router)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "Esnaf Tezgahı"}
