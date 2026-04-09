from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models.database import init_db
from app.routers import teacher, student, summary, quiz, chat, feedback


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="AI Tutor API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(teacher.router, prefix="/api/teacher", tags=["teacher"])
app.include_router(student.router, prefix="/api/student", tags=["student"])
app.include_router(summary.router, prefix="/api/summary", tags=["summary"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
