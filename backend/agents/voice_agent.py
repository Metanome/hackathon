from prompts import VOICE_INTENT_PROMPT
from schemas.agent import VoiceIntentResult
from services.gemini_service import generate_from_audio


def process_audio(audio_bytes: bytes, mime_type: str) -> VoiceIntentResult:
    """
    Transcribe an audio note and extract the user's intent and entities.
    Raises ValueError if Gemini's response cannot be parsed or validated.
    """
    raw = generate_from_audio(audio_bytes, mime_type, VOICE_INTENT_PROMPT)
    return VoiceIntentResult(**raw)
