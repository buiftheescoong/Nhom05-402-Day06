import logging

from app.services.llm_router import llm_router
from app.services.rag_service import query_chunks, get_all_chunks
from app.prompts.quiz import QUIZ_SYSTEM, QUIZ_PROMPT, EVALUATE_SYSTEM, EVALUATE_PROMPT

logger = logging.getLogger(__name__)


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
        content = "\n\n".join(chunks[:15])
    else:
        chunks = query_chunks(session_id, scope, n_results=10, doc_id=document_id)
        content = "\n\n".join(c["content"] for c in chunks)

    if not content.strip():
        return []

    prompt = QUIZ_PROMPT.format(
        count=count,
        difficulty=difficulty,
        scope=scope,
        content=content[:8000],
    )

    try:
        result = await llm_router.generate_json(prompt, system=QUIZ_SYSTEM)
        if isinstance(result, dict):
            result = result.get("questions", [])
        return result if isinstance(result, list) else []
    except Exception as e:
        logger.error("Quiz generation failed: %s", e)
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
