import json
import re

from google import genai
from google.genai import types

from config import get_settings


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
    """Simple text-only generation."""
    client = _get_client()
    response = client.models.generate_content(
        model=model or _get_model(),
        contents=prompt,
    )
    return response.text


def generate_json(prompt: str, model: str | None = None) -> dict:
    """Text-only generation that parses and returns a JSON dict."""
    text = generate_text(prompt, model)
    return _parse_json_response(text)


def generate_from_image(image_bytes: bytes, mime_type: str, prompt: str, model: str | None = None) -> dict:
    """Multimodal generation with an image, returns parsed JSON dict."""
    client = _get_client()
    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
    response = client.models.generate_content(
        model=model or _get_model(),
        contents=[image_part, prompt],
    )
    return _parse_json_response(response.text)


def generate_from_audio(audio_bytes: bytes, mime_type: str, prompt: str, model: str | None = None) -> dict:
    """Multimodal generation with audio, returns parsed JSON dict."""
    client = _get_client()
    audio_part = types.Part.from_bytes(data=audio_bytes, mime_type=mime_type)
    response = client.models.generate_content(
        model=model or _get_model(),
        contents=[audio_part, prompt],
    )
    return _parse_json_response(response.text)
