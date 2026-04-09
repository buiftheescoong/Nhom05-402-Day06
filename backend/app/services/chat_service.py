import logging

from app.services.llm_router import llm_router
from app.services.rag_service import query_chunks
from app.prompts.chat import CHAT_SYSTEM, CHAT_PROMPT

logger = logging.getLogger(__name__)


async def chat_with_documents(
    session_id: str,
    message: str,
) -> dict:
    """Answer a question using RAG over uploaded documents."""

    relevant = query_chunks(session_id, message, n_results=5)

    sources = []
    context_parts = []
    for i, chunk in enumerate(relevant):
        context_parts.append(f"[Nguồn {i + 1}]: {chunk['content']}")
        sources.append({
            "index": i + 1,
            "content": chunk["content"][:200],
            "doc_id": chunk["metadata"].get("doc_id", ""),
        })

    context = "\n\n".join(context_parts) if context_parts else "Không tìm thấy nội dung liên quan trong tài liệu."

    prompt = CHAT_PROMPT.format(context=context, question=message)

    try:
        answer = await llm_router.generate(prompt, system=CHAT_SYSTEM)
        return {"content": answer.strip(), "sources": sources}
    except Exception as e:
        logger.error("Chat failed: %s", e)
        return {
            "content": f"Xin lỗi, không thể trả lời lúc này: {e}",
            "sources": [],
        }
