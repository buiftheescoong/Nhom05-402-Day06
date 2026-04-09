from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession

from app.models.database import get_db, ChatMessage
from app.models.schemas import ChatRequest, ChatResponse
from app.services.chat_service import chat_with_documents, chat_with_documents_stream
from fastapi.responses import StreamingResponse
import json

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def send_message(body: ChatRequest, db: DBSession = Depends(get_db)):
    user_msg = ChatMessage(
        session_id=body.session_id,
        student_id=body.student_id,
        role="user",
        content=body.message,
    )
    db.add(user_msg)
    db.commit()

    result = await chat_with_documents(body.session_id, body.message)

    ai_msg = ChatMessage(
        session_id=body.session_id,
        student_id=body.student_id,
        role="assistant",
        content=result["content"],
        sources_json=result["sources"],
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    return ChatResponse(
        id=ai_msg.id,
        role=ai_msg.role,
        content=ai_msg.content,
        sources=ai_msg.sources_json,
        created_at=ai_msg.created_at,
    )


@router.get("/history/{session_id}", response_model=list[ChatResponse])
def get_chat_history(session_id: str, student_id: str | None = None, db: DBSession = Depends(get_db)):
    query = db.query(ChatMessage).filter(ChatMessage.session_id == session_id)
    if student_id:
        query = query.filter(
            (ChatMessage.student_id == student_id) | (ChatMessage.student_id.is_(None))
        )
    messages = query.order_by(ChatMessage.created_at.asc()).all()
    return [
        ChatResponse(
            id=m.id,
            role=m.role,
            content=m.content,
            sources=m.sources_json or [],
            created_at=m.created_at,
        )
        for m in messages
    ]

@router.post("/stream")
async def send_message_stream(body: ChatRequest, db: DBSession = Depends(get_db)):
    user_msg = ChatMessage(
        session_id=body.session_id,
        student_id=body.student_id,
        role="user",
        content=body.message,
    )
    db.add(user_msg)
    db.commit()

    async def event_generator():
        full_content = ""
        sources = []
        async for sse_payload in chat_with_documents_stream(body.session_id, body.message):
            yield sse_payload
            
            # Extract content to save to DB at the end
            if "data: " in sse_payload:
                try:
                    data_dict = json.loads(sse_payload.split("data: ")[1])
                    if "content" in data_dict:
                        full_content += data_dict["content"]
                    if "sources" in data_dict:
                        sources = data_dict["sources"]
                except Exception:
                    pass
        
        # Save AI reply to DB
        ai_msg = ChatMessage(
            session_id=body.session_id,
            student_id=body.student_id,
            role="assistant",
            content=full_content,
            sources_json=sources,
        )
        db.add(ai_msg)
        db.commit()

    return StreamingResponse(event_generator(), media_type="text/event-stream")
