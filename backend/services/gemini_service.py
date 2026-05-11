import json
import re
from functools import lru_cache

from google import genai
from google.genai import types

from config import get_settings


@lru_cache(maxsize=1)
def _get_client() -> genai.Client:
    return genai.Client(api_key=get_settings().gemini_api_key)


def _get_model() -> str:
    return get_settings().default_model


def _parse_json_response(text: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*", "", text).replace("```", "").strip()
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in Gemini response: {text!r}")
    return json.loads(match.group())


def generate_text(prompt: str, model: str | None = None) -> str:
    response = _get_client().models.generate_content(
        model=model or _get_model(),
        contents=prompt,
    )
    return response.text


def generate_json(prompt: str, model: str | None = None) -> dict:
    return _parse_json_response(generate_text(prompt, model))


def generate_from_image(image_bytes: bytes, mime_type: str, prompt: str, model: str | None = None) -> dict:
    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
    response = _get_client().models.generate_content(
        model=model or _get_model(),
        contents=[image_part, prompt],
    )
    return _parse_json_response(response.text)


def generate_from_audio(audio_bytes: bytes, mime_type: str, prompt: str, model: str | None = None) -> dict:
    audio_part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
    response = _get_client().models.generate_content(
        model=model or _get_model(),
        contents=[audio_part, prompt],
    )
    return _parse_json_response(response.text)
