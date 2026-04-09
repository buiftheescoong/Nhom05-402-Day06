from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.database import get_db, FeedbackLog
from app.models.schemas import (
    FeedbackRequest,
    FeedbackResponse,
    FeedbackStatsResponse,
)

router = APIRouter()


@router.post("", response_model=FeedbackResponse)
def submit_feedback(body: FeedbackRequest, db: Session = Depends(get_db)):
    if body.student_id:
        existing = (
            db.query(FeedbackLog)
            .filter(
                FeedbackLog.target_type == body.target_type,
                FeedbackLog.target_id == body.target_id,
                FeedbackLog.student_id == body.student_id,
                FeedbackLog.feedback_type.in_(["like", "dislike"]),
            )
            .first()
        )
        if existing and body.feedback_type in ("like", "dislike"):
            existing.feedback_type = body.feedback_type
            existing.category = body.category
            existing.user_note = body.user_note
            db.commit()
            db.refresh(existing)
            return _to_response(existing)

    fb = FeedbackLog(
        target_type=body.target_type,
        target_id=body.target_id,
        student_id=body.student_id,
        feedback_type=body.feedback_type,
        category=body.category,
        user_note=body.user_note,
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return _to_response(fb)


@router.get("/check")
def check_feedback(
    target_type: str = Query(...),
    target_id: str = Query(...),
    student_id: str = Query(...),
    db: Session = Depends(get_db),
):
    """Check what feedback a student already gave for a target."""
    feedbacks = (
        db.query(FeedbackLog)
        .filter(
            FeedbackLog.target_type == target_type,
            FeedbackLog.target_id == target_id,
            FeedbackLog.student_id == student_id,
        )
        .order_by(FeedbackLog.created_at.desc())
        .all()
    )
    has_like = any(f.feedback_type == "like" for f in feedbacks)
    has_dislike = any(f.feedback_type == "dislike" for f in feedbacks)
    has_report = any(f.feedback_type == "report" for f in feedbacks)
    return {
        "has_like": has_like,
        "has_dislike": has_dislike,
        "has_report": has_report,
        "feedback_type": "like" if has_like else "dislike" if has_dislike else None,
    }


@router.get("/stats/{target_type}/{target_id}", response_model=FeedbackStatsResponse)
def get_feedback_stats(target_type: str, target_id: str, db: Session = Depends(get_db)):
    rows = (
        db.query(FeedbackLog.feedback_type, func.count(FeedbackLog.id))
        .filter(
            FeedbackLog.target_type == target_type,
            FeedbackLog.target_id == target_id,
        )
        .group_by(FeedbackLog.feedback_type)
        .all()
    )
    counts = {r[0]: r[1] for r in rows}
    likes = counts.get("like", 0)
    dislikes = counts.get("dislike", 0)
    reports = counts.get("report", 0)
    return FeedbackStatsResponse(
        target_type=target_type,
        target_id=target_id,
        likes=likes,
        dislikes=dislikes,
        reports=reports,
        total=likes + dislikes + reports,
    )


@router.get("/list/{target_type}/{target_id}", response_model=list[FeedbackResponse])
def list_feedback(target_type: str, target_id: str, db: Session = Depends(get_db)):
    """List all feedback for a target (useful for teacher dashboard)."""
    feedbacks = (
        db.query(FeedbackLog)
        .filter(
            FeedbackLog.target_type == target_type,
            FeedbackLog.target_id == target_id,
        )
        .order_by(FeedbackLog.created_at.desc())
        .all()
    )
    return [_to_response(f) for f in feedbacks]


def _to_response(fb: FeedbackLog) -> FeedbackResponse:
    return FeedbackResponse(
        id=fb.id,
        target_type=fb.target_type,
        target_id=fb.target_id,
        student_id=fb.student_id,
        feedback_type=fb.feedback_type,
        category=fb.category or "",
        user_note=fb.user_note or "",
        created_at=fb.created_at,
    )
