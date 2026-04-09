import logging

from app.services.llm_router import llm_router
from app.prompts.hint import HINT_SYSTEM, HINT_PROMPT

logger = logging.getLogger(__name__)

SCORE_PENALTIES = {
    1: "Điểm tối đa: 8/10",
    2: "Điểm tối đa: 5/10",
    3: "Điểm tối đa: 3/10",
}


async def get_hint(question: str, model_answer: str, level: int, stored_hints: list[str]) -> dict:
    """Get a hint at the specified level. Uses pre-generated hints if available."""

    level = max(1, min(level, 3))

    if stored_hints and level <= len(stored_hints):
        return {
            "hint": stored_hints[level - 1],
            "level": level,
            "max_level": 3,
            "score_penalty": SCORE_PENALTIES.get(level, ""),
        }

    prompt = HINT_PROMPT.format(
        question=question,
        model_answer=model_answer,
        level=level,
    )

    try:
        hint_text = await llm_router.generate(prompt, system=HINT_SYSTEM)
        return {
            "hint": hint_text.strip(),
            "level": level,
            "max_level": 3,
            "score_penalty": SCORE_PENALTIES.get(level, ""),
        }
    except Exception as e:
        logger.error("Hint generation failed: %s", e)
        return {
            "hint": "Không thể tạo gợi ý. Hãy thử đọc lại tài liệu.",
            "level": level,
            "max_level": 3,
            "score_penalty": SCORE_PENALTIES.get(level, ""),
        }
