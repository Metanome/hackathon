from prompts import CLASSIFIER_PROMPT
from schemas.agent import ClassificationResult
from services.gemini_service import generate_from_image


def classify_image(image_bytes: bytes, mime_type: str) -> ClassificationResult:
    """
    Determine whether an uploaded image is an order slip, shelf scan, or unknown.
    Raises ValueError if the Gemini response cannot be parsed.
    """
    raw = generate_from_image(image_bytes, mime_type, CLASSIFIER_PROMPT)
    return ClassificationResult(**raw)
