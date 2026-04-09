from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DBSession

from app.models.database import get_db, Quiz, QuizQuestion, QuizAttempt
from app.models.schemas import (
    QuizGenerateRequest,
    QuizResponse,
    QuizQuestionResponse,
    QuizEvaluateRequest,
    QuizEvaluateResponse,
    HintRequest,
    HintResponse,
)
from app.services.quiz_service import generate_quiz, evaluate_answer
from app.services.hint_service import get_hint

router = APIRouter()


@router.post("/generate", response_model=QuizResponse)
async def create_quiz(
    body: QuizGenerateRequest,
    refresh: bool = Query(False, description="Bỏ qua cache, gọi lại AI để tạo bài kiểm tra mới"),
    db: DBSession = Depends(get_db)
):
    # --- Cache lookup: tìm bài kiểm tra đã lưu ---
    if not refresh:
        query = db.query(Quiz).filter(
            Quiz.session_id == body.session_id,
            Quiz.scope == body.scope,
            Quiz.difficulty == body.difficulty
        )
        if body.document_id:
            query = query.filter(Quiz.document_id == body.document_id)
        
        cached = query.order_by(Quiz.created_at.desc()).first()

        if cached and cached.questions:
            return QuizResponse(
                id=cached.id,
                scope=cached.scope,
                difficulty=cached.difficulty,
                questions=[
                    QuizQuestionResponse(
                        id=q.id,
                        question=q.question,
                        difficulty=q.difficulty,
                        bloom_level=q.bloom_level,
                        source_ref=q.source_ref,
                    )
                    for q in cached.questions
                ],
                created_at=cached.created_at,
            )

    # --- Cache miss hoặc refresh=true: gọi AI ---
    questions_data = await generate_quiz(
        session_id=body.session_id,
        document_id=body.document_id,
        scope=body.scope,
        difficulty=body.difficulty,
        count=body.count,
    )

    if not questions_data:
        raise HTTPException(400, "Không thể tạo quiz. Hãy kiểm tra tài liệu đã upload.")

    quiz = Quiz(
        session_id=body.session_id,
        student_id=body.student_id,
        document_id=body.document_id,
        scope=body.scope,
        difficulty=body.difficulty,
    )
    db.add(quiz)
    db.flush()

    for q_data in questions_data:
        qq = QuizQuestion(
            quiz_id=quiz.id,
            question=q_data.get("question", ""),
            model_answer=q_data.get("model_answer", ""),
            difficulty=q_data.get("difficulty", body.difficulty),
            bloom_level=q_data.get("bloom_level", "understand"),
            hints_json=q_data.get("hints", []),
            source_ref=q_data.get("source_ref", ""),
        )
        db.add(qq)

    db.commit()
    db.refresh(quiz)

    return QuizResponse(
        id=quiz.id,
        scope=quiz.scope,
        difficulty=quiz.difficulty,
        questions=[
            QuizQuestionResponse(
                id=q.id,
                question=q.question,
                difficulty=q.difficulty,
                bloom_level=q.bloom_level,
                source_ref=q.source_ref,
            )
            for q in quiz.questions
        ],
        created_at=quiz.created_at,
    )



@router.post("/evaluate", response_model=QuizEvaluateResponse)
async def evaluate_quiz_answer(body: QuizEvaluateRequest, db: DBSession = Depends(get_db)):
    qq = db.query(QuizQuestion).filter(QuizQuestion.id == body.question_id).first()
    if not qq:
        raise HTTPException(404, "Question not found")

    result = await evaluate_answer(qq.question, qq.model_answer, body.user_answer)

    attempt = QuizAttempt(
        question_id=qq.id,
        student_id=body.student_id,
        user_answer=body.user_answer,
        score=result["score"],
        feedback=result["feedback"],
    )
    db.add(attempt)
    db.commit()

    return QuizEvaluateResponse(
        score=result["score"],
        feedback=result["feedback"],
        model_answer=qq.model_answer,
        hints_used=attempt.hints_used,
    )


@router.post("/hint", response_model=HintResponse)
async def get_quiz_hint(body: HintRequest, db: DBSession = Depends(get_db)):
    qq = db.query(QuizQuestion).filter(QuizQuestion.id == body.question_id).first()
    if not qq:
        raise HTTPException(404, "Question not found")

    result = await get_hint(qq.question, qq.model_answer, body.current_level + 1, qq.hints_json or [])

    return HintResponse(
        hint=result["hint"],
        level=result["level"],
        max_level=result["max_level"],
        score_penalty=result["score_penalty"],
    )
