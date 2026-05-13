import asyncio

_loop: asyncio.AbstractEventLoop | None = None
_queues: set[asyncio.Queue] = set()
_shutting_down = False

def set_event_loop(loop: asyncio.AbstractEventLoop):
    """Capture the main event loop to allow thread-safe broadcasting."""
    global _loop
    _loop = loop

def shutdown():
    """Signal all SSE streams to close so uvicorn can shut down cleanly."""
    global _shutting_down
    _shutting_down = True
    for q in list(_queues):
        try:
            q.put_nowait(None)
        except Exception:
            pass

async def subscribe():
    """Generator for SSE streams."""
    q = asyncio.Queue()
    _queues.add(q)
    try:
        while not _shutting_down:
            try:
                msg = await asyncio.wait_for(q.get(), timeout=15.0)
                if msg is None:
                    break
                yield f"data: {msg}\n\n"
            except asyncio.TimeoutError:
                yield ": keepalive\n\n"
    finally:
        _queues.discard(q)

def notify_clients(msg: str = "update"):
    """
    Broadcast a message to all connected SSE clients.
    Safe to call from synchronous threadpools (e.g., BackgroundTasks).
    """
    if _loop is None:
        return
    for q in _queues:
        try:
            _loop.call_soon_threadsafe(q.put_nowait, msg)
        except RuntimeError:
            pass
