from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.database import get_db, FeedbackLog
from app.models.schemas import FeedbackRequest

router = APIRouter()


@router.post("")
def submit_feedback(body: FeedbackRequest, db: Session = Depends(get_db)):
    fb = FeedbackLog(
        target_type=body.target_type,
        target_id=body.target_id,
        feedback_type=body.feedback_type,
        user_note=body.user_note,
    )
    db.add(fb)
    db.commit()
    return {"ok": True}
