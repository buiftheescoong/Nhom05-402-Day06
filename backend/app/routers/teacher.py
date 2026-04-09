import os
import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session as DBSession

from app.config import settings
from app.models.database import get_db, Course, Session, Document
from app.models.schemas import (
    CourseCreate,
    CourseAuth,
    CourseTeacherResponse,
    SessionCreate,
    SessionUpdate,
    SessionResponse,
    DocumentResponse,
)
from app.services.document_processor import extract_text, chunk_text
from app.services.rag_service import add_document_chunks, delete_document_chunks

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "doc", "pptx", "ppt"}


def _get_ext(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


# --------------- Course ---------------

@router.post("/courses", response_model=CourseTeacherResponse)
def create_course(body: CourseCreate, db: DBSession = Depends(get_db)):
    course = Course(name=body.name)
    db.add(course)
    db.commit()
    db.refresh(course)
    return CourseTeacherResponse(
        id=course.id,
        name=course.name,
        join_code=course.join_code,
        teacher_pin=course.teacher_pin,
        created_at=course.created_at,
        updated_at=course.updated_at,
        session_count=0,
        student_count=0,
    )


@router.post("/courses/auth", response_model=CourseTeacherResponse)
def auth_course(body: CourseAuth, db: DBSession = Depends(get_db)):
    course = db.query(Course).filter(Course.join_code == body.join_code).first()
    if not course or course.teacher_pin != body.teacher_pin:
        raise HTTPException(401, "Mã lớp hoặc PIN không đúng")
    return CourseTeacherResponse(
        id=course.id,
        name=course.name,
        join_code=course.join_code,
        teacher_pin=course.teacher_pin,
        created_at=course.created_at,
        updated_at=course.updated_at,
        session_count=len(course.sessions),
        student_count=len(course.enrollments),
    )


@router.get("/courses/{course_id}", response_model=CourseTeacherResponse)
def get_course(course_id: str, db: DBSession = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Không tìm thấy lớp học")
    return CourseTeacherResponse(
        id=course.id,
        name=course.name,
        join_code=course.join_code,
        teacher_pin=course.teacher_pin,
        created_at=course.created_at,
        updated_at=course.updated_at,
        session_count=len(course.sessions),
        student_count=len(course.enrollments),
    )


@router.put("/courses/{course_id}")
def update_course(course_id: str, body: CourseCreate, db: DBSession = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Không tìm thấy lớp học")
    course.name = body.name
    db.commit()
    return {"ok": True}


@router.delete("/courses/{course_id}")
def delete_course(course_id: str, db: DBSession = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Không tìm thấy lớp học")
    db.delete(course)
    db.commit()
    return {"ok": True}


# --------------- Session (Buổi học) ---------------

@router.get("/courses/{course_id}/sessions", response_model=list[SessionResponse])
def list_sessions(course_id: str, db: DBSession = Depends(get_db)):
    sessions = (
        db.query(Session)
        .filter(Session.course_id == course_id)
        .order_by(Session.order.asc(), Session.created_at.asc())
        .all()
    )
    return [
        SessionResponse(
            id=s.id,
            course_id=s.course_id,
            title=s.title,
            description=s.description or "",
            order=s.order,
            is_open=s.is_open,
            document_count=len(s.documents),
            created_at=s.created_at,
            updated_at=s.updated_at,
        )
        for s in sessions
    ]


@router.post("/courses/{course_id}/sessions", response_model=SessionResponse)
def create_session(course_id: str, body: SessionCreate, db: DBSession = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Không tìm thấy lớp học")

    max_order = db.query(Session).filter(Session.course_id == course_id).count()
    session = Session(
        course_id=course_id,
        title=body.title,
        description=body.description,
        order=max_order,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return SessionResponse(
        id=session.id,
        course_id=session.course_id,
        title=session.title,
        description=session.description or "",
        order=session.order,
        is_open=session.is_open,
        document_count=0,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@router.put("/sessions/{session_id}", response_model=SessionResponse)
def update_session(session_id: str, body: SessionUpdate, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(404, "Không tìm thấy buổi học")
    if body.title is not None:
        session.title = body.title
    if body.description is not None:
        session.description = body.description
    if body.order is not None:
        session.order = body.order
    db.commit()
    db.refresh(session)
    return SessionResponse(
        id=session.id,
        course_id=session.course_id,
        title=session.title,
        description=session.description or "",
        order=session.order,
        is_open=session.is_open,
        document_count=len(session.documents),
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@router.put("/sessions/{session_id}/toggle")
def toggle_session(session_id: str, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(404, "Không tìm thấy buổi học")
    session.is_open = not session.is_open
    db.commit()
    return {"ok": True, "is_open": session.is_open}


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(404, "Không tìm thấy buổi học")
    db.delete(session)
    db.commit()
    return {"ok": True}


# --------------- Documents (Teacher upload) ---------------

@router.post("/sessions/{session_id}/documents/upload", response_model=DocumentResponse)
async def upload_document(
    session_id: str,
    file: UploadFile = File(...),
    db: DBSession = Depends(get_db),
):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(404, "Không tìm thấy buổi học")

    ext = _get_ext(file.filename or "file.txt")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Định dạng không hỗ trợ: {ext}")

    file_id = uuid.uuid4().hex[:12]
    save_name = f"{file_id}.{ext}"
    save_path = os.path.join(settings.upload_dir, save_name)

    os.makedirs(settings.upload_dir, exist_ok=True)
    content = await file.read()
    with open(save_path, "wb") as f:
        f.write(content)

    doc = Document(
        id=file_id,
        session_id=session_id,
        filename=file.filename or "document",
        file_type=ext,
        status="processing",
    )
    db.add(doc)
    db.commit()

    try:
        text, outline = extract_text(save_path, ext)
        chunks = chunk_text(text)
        add_document_chunks(session_id, file_id, chunks)

        doc.content_text = text
        doc.outline_json = outline
        doc.status = "ready"
        db.commit()
        db.refresh(doc)
    except Exception as e:
        logger.error("Document processing failed: %s", e)
        doc.status = "error"
        doc.error_message = str(e)
        db.commit()
        db.refresh(doc)

    return DocumentResponse(
        id=doc.id,
        session_id=doc.session_id,
        filename=doc.filename,
        file_type=doc.file_type,
        status=doc.status,
        outline=doc.outline_json or [],
        error_message=doc.error_message or "",
        created_at=doc.created_at,
    )


@router.get("/sessions/{session_id}/documents", response_model=list[DocumentResponse])
def list_session_documents(session_id: str, db: DBSession = Depends(get_db)):
    docs = (
        db.query(Document)
        .filter(Document.session_id == session_id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return [
        DocumentResponse(
            id=d.id,
            session_id=d.session_id,
            filename=d.filename,
            file_type=d.file_type,
            status=d.status,
            outline=d.outline_json or [],
            error_message=d.error_message or "",
            created_at=d.created_at,
        )
        for d in docs
    ]


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, db: DBSession = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Không tìm thấy tài liệu")

    delete_document_chunks(doc.session_id, doc_id)

    file_path = os.path.join(settings.upload_dir, f"{doc_id}.{doc.file_type}")
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(doc)
    db.commit()
    return {"ok": True}
