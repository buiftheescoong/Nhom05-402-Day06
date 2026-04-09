import logging
import math

from app.services.llm_router import llm_router
from app.services.rag_service import query_chunks, get_all_chunks
from app.prompts.quiz import QUIZ_SYSTEM, QUIZ_PROMPT, EVALUATE_SYSTEM, EVALUATE_PROMPT

logger = logging.getLogger(__name__)


def _stratified_sample(chunks: list[str], n_sections: int, chunks_per_section: int = 2) -> str:
    """Pick representative chunks evenly across the document.

    Divides chunks into *n_sections* equal bands and takes
    *chunks_per_section* consecutive chunks from the middle of each band.
    Returns the concatenated text with section markers.
    """
    if not chunks:
        return ""

    total = len(chunks)
    band_size = max(1, math.ceil(total / n_sections))
    selected_parts: list[str] = []

    for i in range(n_sections):
        start = i * band_size
        end = min(start + band_size, total)
        if start >= total:
            break

        mid = (start + end) // 2
        half = chunks_per_section // 2
        pick_start = max(start, mid - half)
        pick_end = min(end, pick_start + chunks_per_section)

        section_chunks = chunks[pick_start:pick_end]
        if section_chunks:
            header = f"[Phần {i + 1}/{n_sections} của tài liệu]"
            selected_parts.append(header + "\n" + "\n\n".join(section_chunks))

    return "\n\n---\n\n".join(selected_parts)


async def generate_quiz(
    session_id: str,
    document_id: str | None = None,
    scope: str = "full",
    difficulty: str = "medium",
    count: int = 5,
) -> list[dict]:
    """Generate quiz questions from document content."""

    if scope == "full":
        chunks = get_all_chunks(session_id, document_id)
    else:
        raw = query_chunks(session_id, scope, n_results=10, doc_id=document_id)
        chunks = [c["content"] for c in raw]

    if not chunks:
        return []

    is_long = len(chunks) > 15 or len("\n\n".join(chunks)) > 8000

    if is_long:
        content = _stratified_sample(chunks, n_sections=count)
        logger.info(
            "[Quiz Service] Long doc (%d chunks) -> stratified sample for %d questions, context %d chars",
            len(chunks),
            count,
            len(content),
        )
    else:
        content = "\n\n".join(chunks)

    prompt = QUIZ_PROMPT.format(
        count=count,
        difficulty=difficulty,
        scope=scope,
        content=content[:12000],
    )

    try:
        logger.info(
            "[Quiz Service] Calling LLM with scope '%s', context length: %d chars",
            scope,
            len(content),
        )
        result = await llm_router.generate_json(prompt, system=QUIZ_SYSTEM)
        if isinstance(result, dict):
            num_q = len(result.get("questions", []))
            logger.info("[Quiz Service] Generated %d questions.", num_q)
            result = result.get("questions", [])
        return result if isinstance(result, list) else []
    except Exception as e:
        logger.error("[Quiz Service] Quiz generation failed: %s", e)
        return []


async def evaluate_answer(question: str, model_answer: str, user_answer: str) -> dict:
    """Evaluate a student's answer against the model answer."""
    prompt = EVALUATE_PROMPT.format(
        question=question,
        model_answer=model_answer,
        user_answer=user_answer,
    )

    try:
        result = await llm_router.generate_json(prompt, system=EVALUATE_SYSTEM)
        return {
            "score": float(result.get("score", 0)),
            "feedback": result.get("feedback", ""),
        }
    except Exception as e:
        logger.error("Answer evaluation failed: %s", e)
        return {"score": 0, "feedback": f"Lỗi khi chấm bài: {e}"}
