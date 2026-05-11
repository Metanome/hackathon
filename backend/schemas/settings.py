from pydantic import BaseModel

AVAILABLE_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.5-flash-lite",
    "gemini-3.0-flash",
    "gemini-3-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro"
]


class SettingsResponse(BaseModel):
    default_model: str
    available_models: list[str]
    api_key_set: bool  # Never expose the actual key


class SettingsUpdate(BaseModel):
    default_model: str | None = None
    gemini_api_key: str | None = None
