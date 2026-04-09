import uuid
import string
import random
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON, UniqueConstraint, create_engine
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


def _utcnow():
    return datetime.now(timezone.utc)


def _new_id():
    return uuid.uuid4().hex[:12]


def _join_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def _teacher_pin():
    return "".join(random.choices(string.digits, k=6))


# --------------- LMS Models ---------------

class Course(Base):
    __tablename__ = "courses"

    id = Column(String, primary_key=True, default=_new_id)
    name = Column(String, nullable=False)
    join_code = Column(String(6), unique=True, nullable=False, default=_join_code)
    teacher_pin = Column(String(6), nullable=False, default=_teacher_pin)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    sessions = relationship("Session", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=_new_id)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    order = Column(Integer, default=0)
    is_open = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    course = relationship("Course", back_populates="sessions")
    documents = relationship("Document", back_populates="session", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class Student(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True, default=_new_id)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=_utcnow)

    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("student_id", "course_id", name="uq_student_course"),)

    id = Column(String, primary_key=True, default=_new_id)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False)
    joined_at = Column(DateTime, default=_utcnow)

    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


# --------------- Content Models ---------------

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=_new_id)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    content_text = Column(Text, default="")
    outline_json = Column(JSON, default=list)
    status = Column(String, default="processing")  # processing | ready | error
    error_message = Column(Text, default="")
    created_at = Column(DateTime, default=_utcnow)

    session = relationship("Session", back_populates="documents")


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(String, primary_key=True, default=_new_id)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    student_id = Column(String, ForeignKey("students.id"), nullable=True)
    document_id = Column(String, ForeignKey("documents.id"), nullable=True)
    scope = Column(String, default="full")
    content = Column(Text, default="")
    key_points = Column(JSON, default=list)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime, default=_utcnow)


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String, primary_key=True, default=_new_id)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    student_id = Column(String, ForeignKey("students.id"), nullable=True)
    document_id = Column(String, ForeignKey("documents.id"), nullable=True)
    scope = Column(String, default="full")
    difficulty = Column(String, default="medium")
    created_at = Column(DateTime, default=_utcnow)

    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String, primary_key=True, default=_new_id)
    quiz_id = Column(String, ForeignKey("quizzes.id"), nullable=False)
    question = Column(Text, nullable=False)
    model_answer = Column(Text, default="")
    difficulty = Column(String, default="medium")
    bloom_level = Column(String, default="understand")
    hints_json = Column(JSON, default=list)
    source_ref = Column(Text, default="")

    quiz = relationship("Quiz", back_populates="questions")
    attempts = relationship("QuizAttempt", back_populates="question", cascade="all, delete-orphan")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String, primary_key=True, default=_new_id)
    question_id = Column(String, ForeignKey("quiz_questions.id"), nullable=False)
    student_id = Column(String, ForeignKey("students.id"), nullable=True)
    user_answer = Column(Text, default="")
    score = Column(Float, default=0.0)
    feedback = Column(Text, default="")
    hints_used = Column(Integer, default=0)
    created_at = Column(DateTime, default=_utcnow)

    question = relationship("QuizQuestion", back_populates="attempts")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=_new_id)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    student_id = Column(String, ForeignKey("students.id"), nullable=True)
    role = Column(String, nullable=False)  # user | assistant
    content = Column(Text, default="")
    sources_json = Column(JSON, default=list)
    created_at = Column(DateTime, default=_utcnow)

    session = relationship("Session", back_populates="chat_messages")


class FeedbackLog(Base):
    __tablename__ = "feedback_log"

    id = Column(String, primary_key=True, default=_new_id)
    target_type = Column(String, nullable=False)  # summary | quiz | quiz_question | hint | chat
    target_id = Column(String, nullable=False)
    student_id = Column(String, ForeignKey("students.id"), nullable=True)
    feedback_type = Column(String, nullable=False)  # like | dislike | report
    category = Column(String, default="")  # report sub-category
    user_note = Column(Text, default="")
    created_at = Column(DateTime, default=_utcnow)


engine = create_engine(f"sqlite:///{settings.sqlite_db_path}", echo=False)
SessionLocal = sessionmaker(bind=engine)


def init_db():
    settings.ensure_dirs()
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
