import logging

from app.services.llm_router import llm_router
from app.services.rag_service import query_chunks, get_all_chunks
from app.prompts.summary import SUMMARY_SYSTEM, SUMMARY_PROMPT

logger = logging.getLogger(__name__)


async def generate_summary(
    session_id: str,
    document_id: str | None = None,
    scope: str = "full",
) -> dict:
    """Generate a structured summary from document content."""

    if scope == "full":
        chunks = get_all_chunks(session_id, document_id)
        content = "\n\n".join(chunks[:20])
    else:
        chunks = query_chunks(session_id, scope, n_results=10, doc_id=document_id)
        content = "\n\n".join(c["content"] for c in chunks)

    if not content.strip():
        return {
            "key_points": ["Không tìm thấy nội dung để tóm tắt"],
            "summary": "Tài liệu chưa được tải lên hoặc chưa được xử lý.",
            "confidence": 0.0,
        }

    prompt = SUMMARY_PROMPT.format(scope=scope, content=content[:8000])

    try:
        result = await llm_router.generate_json(prompt, system=SUMMARY_SYSTEM)
        return {
            "key_points": result.get("key_points", []),
            "summary": result.get("summary", ""),
            "confidence": float(result.get("confidence", 0.8)),
        }
    except Exception as e:
        logger.error("Summary generation failed: %s", e)
        return {
            "key_points": ["Lỗi khi tạo tóm tắt"],
            "summary": f"Không thể tạo tóm tắt: {e}",
            "confidence": 0.0,
        }
