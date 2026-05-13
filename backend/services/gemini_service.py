import json
import logging
import re
import time
from functools import lru_cache

from google import genai
from google.genai import types
from google.genai.errors import ClientError, ServerError

from config import get_settings
from i18n import t as _t


class APIKeyMissingError(Exception):
    """Raised when GEMINI_API_KEY is not configured."""


def _with_retry(fn, *args, max_retries: int = 2, **kwargs):
    """Call fn(*args, **kwargs), retrying up to max_retries times on 503 overload."""
    for attempt in range(max_retries + 1):
        try:
            return fn(*args, **kwargs)
        except ServerError as exc:
            if exc.code == 503 and attempt < max_retries:
                time.sleep(2 ** attempt)  # 1 s, then 2 s
                continue
            raise


@lru_cache(maxsize=1)
def _get_client() -> genai.Client:
    key = get_settings().gemini_api_key
    if not key:
        raise APIKeyMissingError()
    return genai.Client(api_key=key)


def _get_model() -> str:
    return get_settings().default_model


def _parse_json_response(text: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*", "", text).replace("```", "").strip()
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in Gemini response: {text!r}")
    return json.loads(match.group())


def _call_with_fallback(fn, model: str | None = None, **kwargs):
    """Call fn with model fallback on 429 (quota), 404 (missing), or exhausted 503 retries."""
    primary = model or _get_model()
    candidates = [primary] + [m for m in list_models() if m != primary]

    last_exc: Exception = RuntimeError("No models available")
    for candidate in candidates:
        try:
            return _with_retry(fn, model=candidate, **kwargs)
        except ClientError as exc:
            if exc.code in (429, 404):
                logging.warning(f"Model {candidate!r} failed ({exc.code}), trying fallback")
                last_exc = exc
                continue
            raise
        except ServerError as exc:
            logging.warning(f"Model {candidate!r} unavailable after retries, trying fallback")
            last_exc = exc
            continue
    raise last_exc


def generate_text(prompt: str, model: str | None = None) -> str:
    response = _call_with_fallback(
        _get_client().models.generate_content,
        model=model,
        contents=prompt,
    )
    return response.text


def generate_json(prompt: str, model: str | None = None) -> dict:
    return _parse_json_response(generate_text(prompt, model))


def generate_from_image(image_bytes: bytes, mime_type: str, prompt: str, model: str | None = None) -> dict:
    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
    response = _call_with_fallback(
        _get_client().models.generate_content,
        model=model,
        contents=[image_part, prompt],
    )
    return _parse_json_response(response.text)


_models_cache: list[str] = []
_models_cache_at: float = 0.0
_MODELS_TTL = 600  # seconds


def list_models() -> list[str]:
    """Return available generateContent-capable Gemini models from the API.
    Result is cached for 10 minutes; returns empty list on error."""
    global _models_cache, _models_cache_at
    if _models_cache and (time.time() - _models_cache_at) < _MODELS_TTL:
        return _models_cache
    try:
        result = []
        for m in _get_client().models.list():
            name: str = m.name or ""
            if not name.startswith("models/gemini-"):
                continue
            actions = getattr(m, "supported_actions", []) or []
            if "generateContent" not in actions:
                continue
            result.append(name.removeprefix("models/"))
        _models_cache = sorted(result)
        _models_cache_at = time.time()
        return _models_cache
    except Exception as exc:
        logging.warning(f"Could not fetch model list from Gemini API: {exc}")
        return []


def clear_client_cache() -> None:
    global _models_cache, _models_cache_at
    _models_cache = []
    _models_cache_at = 0.0
    _get_client.cache_clear()


def generate_from_audio(audio_bytes: bytes, mime_type: str, prompt: str, model: str | None = None) -> dict:
    audio_part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
    response = _call_with_fallback(
        _get_client().models.generate_content,
        model=model,
        contents=[audio_part, prompt],
    )
    return _parse_json_response(response.text)
