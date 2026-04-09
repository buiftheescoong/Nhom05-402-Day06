from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.models.database import get_db, Course, Session, Student, Enrollment, Document
from app.models.schemas import (
    StudentJoin,
    StudentResponse,
    EnrollmentResponse,
    CourseResponse,
    SessionResponse,
    DocumentResponse,
)

router = APIRouter()


@router.post("/join", response_model=EnrollmentResponse)
def join_course(body: StudentJoin, db: DBSession = Depends(get_db)):
    course = db.query(Course).filter(Course.join_code == body.join_code).first()
    if not course:
        raise HTTPException(404, "Mã lớp không đúng")

    student = Student(name=body.name)
    db.add(student)
    db.flush()

    existing = (
        db.query(Enrollment)
        .filter(Enrollment.student_id == student.id, Enrollment.course_id == course.id)
        .first()
    )
    if existing:
        db.rollback()
        raise HTTPException(400, "Đã tham gia lớp này rồi")

    enrollment = Enrollment(student_id=student.id, course_id=course.id)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    return EnrollmentResponse(
        student_id=student.id,
        student_name=student.name,
        course_id=course.id,
        course_name=course.name,
        joined_at=enrollment.joined_at,
    )


@router.post("/rejoin", response_model=EnrollmentResponse)
def rejoin_course(body: StudentJoin, db: DBSession = Depends(get_db)):
    """Rejoin with existing name: find student by name in this course."""
    course = db.query(Course).filter(Course.join_code == body.join_code).first()
    if not course:
        raise HTTPException(404, "Mã lớp không đúng")

    enrollment = (
        db.query(Enrollment)
        .join(Student)
        .filter(Enrollment.course_id == course.id, Student.name == body.name)
        .first()
    )
    if not enrollment:
        raise HTTPException(404, "Không tìm thấy học sinh trong lớp này. Hãy dùng Join để tham gia lần đầu.")

    student = db.query(Student).filter(Student.id == enrollment.student_id).first()
    return EnrollmentResponse(
        student_id=student.id,
        student_name=student.name,
        course_id=course.id,
        course_name=course.name,
        joined_at=enrollment.joined_at,
    )


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str, db: DBSession = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(404, "Không tìm thấy học sinh")
    return StudentResponse(id=student.id, name=student.name, created_at=student.created_at)


@router.get("/{student_id}/courses", response_model=list[CourseResponse])
def list_student_courses(student_id: str, db: DBSession = Depends(get_db)):
    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.student_id == student_id)
        .all()
    )
    result = []
    for enr in enrollments:
        course = db.query(Course).filter(Course.id == enr.course_id).first()
        if course:
            result.append(
                CourseResponse(
                    id=course.id,
                    name=course.name,
                    join_code=course.join_code,
                    created_at=course.created_at,
                    updated_at=course.updated_at,
                    session_count=len(course.sessions),
                    student_count=len(course.enrollments),
                )
            )
    return result


@router.get("/{student_id}/courses/{course_id}/sessions", response_model=list[SessionResponse])
def list_open_sessions(student_id: str, course_id: str, db: DBSession = Depends(get_db)):
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.student_id == student_id, Enrollment.course_id == course_id)
        .first()
    )
    if not enrollment:
        raise HTTPException(403, "Bạn chưa tham gia lớp này")

    sessions = (
        db.query(Session)
        .filter(Session.course_id == course_id, Session.is_open == True)
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


@router.get("/sessions/{session_id}/documents", response_model=list[DocumentResponse])
def get_session_documents(session_id: str, db: DBSession = Depends(get_db)):
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(404, "Không tìm thấy buổi học")
    if not session.is_open:
        raise HTTPException(403, "Buổi học chưa được mở")

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


@router.get("/documents/{doc_id}/content")
def get_document_content(doc_id: str, db: DBSession = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Không tìm thấy tài liệu")
    session = db.query(Session).filter(Session.id == doc.session_id).first()
    if not session or not session.is_open:
        raise HTTPException(403, "Buổi học chưa được mở")
    return {
        "id": doc.id,
        "filename": doc.filename,
        "file_type": doc.file_type,
        "content": doc.content_text or "",
        "outline": doc.outline_json or [],
    }
