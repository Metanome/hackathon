from prompts import PLANNER_REASONING_PROMPT
from services.gemini_service import generate_text


def synthesize_reasoning(context: str) -> str:
    """
    Given a plain-text context summary of what the agent did,
    generate a human-readable reasoning paragraph.
    """
    prompt = PLANNER_REASONING_PROMPT.format(context=context)
    return generate_text(prompt)
