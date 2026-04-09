import logging

from app.services.llm_router import llm_router
from app.services.rag_service import query_chunks
from app.prompts.chat import CHAT_SYSTEM, CHAT_PROMPT
from app.models.database import SessionLocal, ChatMessage
import json

logger = logging.getLogger(__name__)


async def chat_with_documents(
    session_id: str,
    message: str,
    document_id: str | None = None,
) -> dict:
    """Answer a question using RAG over uploaded documents."""

    relevant = query_chunks(session_id, message, n_results=5, doc_id=document_id)

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


async def chat_with_documents_stream(session_id: str, message: str, document_id: str | None = None):
    relevant = query_chunks(session_id, message, n_results=5, doc_id=document_id)

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

    db = SessionLocal()
    try:
        history_msgs = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.desc()).limit(6).all()
        history_msgs = list(reversed(history_msgs))
        history_text = "\n".join([f"{'Student' if m.role == 'user' else 'Tutor'}: {m.content}" for m in history_msgs])
    finally:
        db.close()

    full_message = f"Lịch sử chat gần đây:\n{history_text}\n\n================\nTài liệu tham khảo:\n{context}\n\nCâu hỏi mới của sinh viên:\n{message}"

    try:
        async for chunk in llm_router.generate_stream(full_message, system=CHAT_SYSTEM):
            yield f"data: {json.dumps({'content': chunk})}\n\n"
        
        # Gửi payload cuối cùng chứa context và báo done
        yield f"data: {json.dumps({'sources': sources, 'done': True})}\n\n"
    except Exception as e:
        logger.error("Chat stream failed: %s", e)
        yield f"data: {json.dumps({'content': f'Lỗi hệ thống: {e}', 'done': True})}\n\n"
