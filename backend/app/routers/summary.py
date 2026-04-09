from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session as DBSession

from app.models.database import get_db, Summary
from app.models.schemas import SummaryRequest, SummaryResponse
from app.services.summary_service import generate_summary

router = APIRouter()


@router.post("/generate", response_model=SummaryResponse)
async def create_summary(
    body: SummaryRequest,
    refresh: bool = Query(False, description="Bỏ qua cache, gọi lại AI để tạo tóm tắt mới"),
    db: DBSession = Depends(get_db),
):
    # --- Cache lookup: tìm summary đã lưu cho cùng (session_id, document_id, scope) ---
    if not refresh:
        query = db.query(Summary).filter(
            Summary.session_id == body.session_id,
            Summary.scope == body.scope,
        )
        if body.document_id:
            query = query.filter(Summary.document_id == body.document_id)
        cached = query.order_by(Summary.created_at.desc()).first()

        if cached:
            return SummaryResponse(
                id=cached.id,
                content=cached.content,
                key_points=cached.key_points,
                confidence=cached.confidence,
                scope=cached.scope,
                created_at=cached.created_at,
            )

    # --- Cache miss hoặc refresh=true: gọi AI ---
    result = await generate_summary(
        session_id=body.session_id,
        document_id=body.document_id,
        scope=body.scope,
    )

    summary = Summary(
        session_id=body.session_id,
        student_id=body.student_id,
        document_id=body.document_id,
        scope=body.scope,
        content=result["summary"],
        key_points=result["key_points"],
        confidence=result["confidence"],
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)

    return SummaryResponse(
        id=summary.id,
        content=summary.content,
        key_points=summary.key_points,
        confidence=summary.confidence,
        scope=summary.scope,
        created_at=summary.created_at,
    )

