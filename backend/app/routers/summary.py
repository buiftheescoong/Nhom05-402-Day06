from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession

from app.models.database import get_db, Summary
from app.models.schemas import SummaryRequest, SummaryResponse
from app.services.summary_service import generate_summary

router = APIRouter()


@router.post("/generate", response_model=SummaryResponse)
async def create_summary(body: SummaryRequest, db: DBSession = Depends(get_db)):
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
