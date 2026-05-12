from pydantic import BaseModel


class SettingsResponse(BaseModel):
    default_model: str
    available_models: list[str]
    api_key_set: bool  # Never expose the actual key


class SettingsUpdate(BaseModel):
    default_model: str | None = None
    gemini_api_key: str | None = None


class ProfileResponse(BaseModel):
    display_name: str
    store_name: str


class ProfileUpdate(BaseModel):
    display_name: str | None = None
    store_name: str | None = None
