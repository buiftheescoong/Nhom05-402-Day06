from pydantic import BaseModel
from datetime import datetime


# --------------- Course / Session / Student ---------------

class CourseCreate(BaseModel):
    name: str


class CourseAuth(BaseModel):
    join_code: str
    teacher_pin: str


class CourseResponse(BaseModel):
    id: str
    name: str
    join_code: str
    created_at: datetime
    updated_at: datetime
    session_count: int = 0
    student_count: int = 0


class CourseTeacherResponse(CourseResponse):
    teacher_pin: str


class SessionCreate(BaseModel):
    title: str
    description: str = ""


class SessionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    order: int | None = None


class SessionResponse(BaseModel):
    id: str
    course_id: str
    title: str
    description: str
    order: int
    is_open: bool
    document_count: int = 0
    created_at: datetime
    updated_at: datetime


class StudentJoin(BaseModel):
    join_code: str
    name: str


class StudentResponse(BaseModel):
    id: str
    name: str
    created_at: datetime


class EnrollmentResponse(BaseModel):
    student_id: str
    student_name: str
    course_id: str
    course_name: str
    joined_at: datetime


# --------------- Document ---------------

class DocumentResponse(BaseModel):
    id: str
    session_id: str
    filename: str
    file_type: str
    status: str
    outline: list = []
    error_message: str = ""
    created_at: datetime


# --------------- Summary ---------------

class SummaryRequest(BaseModel):
    session_id: str
    student_id: str | None = None
    document_id: str | None = None
    scope: str = "full"


class SummaryResponse(BaseModel):
    id: str
    content: str
    key_points: list[str]
    confidence: float
    scope: str
    created_at: datetime


# --------------- Quiz ---------------

class QuizGenerateRequest(BaseModel):
    session_id: str
    student_id: str | None = None
    document_id: str | None = None
    scope: str = "full"
    difficulty: str = "medium"
    count: int = 5


class QuizQuestionResponse(BaseModel):
    id: str
    question: str
    difficulty: str
    bloom_level: str
    source_ref: str = ""


class QuizResponse(BaseModel):
    id: str
    scope: str
    difficulty: str
    questions: list[QuizQuestionResponse]
    created_at: datetime


class QuizEvaluateRequest(BaseModel):
    question_id: str
    user_answer: str
    student_id: str | None = None


class QuizEvaluateResponse(BaseModel):
    score: float
    feedback: str
    model_answer: str
    hints_used: int


class HintRequest(BaseModel):
    question_id: str
    current_level: int = 0


class HintResponse(BaseModel):
    hint: str
    level: int
    max_level: int
    score_penalty: str


# --------------- Chat ---------------

class ChatRequest(BaseModel):
    session_id: str
    student_id: str | None = None
    document_id: str | None = None
    message: str


class ChatResponse(BaseModel):
    id: str
    role: str
    content: str
    sources: list = []
    created_at: datetime


# --------------- Feedback ---------------

class FeedbackRequest(BaseModel):
    target_type: str
    target_id: str
    feedback_type: str  # like | dislike | report
    student_id: str | None = None
    category: str = ""
    user_note: str = ""


class FeedbackResponse(BaseModel):
    id: str
    target_type: str
    target_id: str
    student_id: str | None
    feedback_type: str
    category: str
    user_note: str
    created_at: datetime


class FeedbackStatsResponse(BaseModel):
    target_type: str
    target_id: str
    likes: int = 0
    dislikes: int = 0
    reports: int = 0
    total: int = 0
