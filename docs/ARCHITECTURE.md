# Kiến trúc hệ thống AI Tutor LMS

## Tổng quan

AI Tutor là nền tảng học tập tích hợp AI, cho phép giáo viên quản lý lớp học và tài liệu theo buổi, học sinh tham gia lớp và sử dụng AI để tóm tắt, tạo quiz, và hỏi đáp.

## Stack công nghệ

| Layer | Công nghệ |
|-------|----------|
| Frontend | Next.js 16, React 19, Zustand, Tailwind CSS, shadcn/ui |
| Backend | FastAPI (Python), SQLAlchemy, Pydantic |
| Vector DB | ChromaDB (persistent) |
| Database | SQLite |
| AI/LLM | OpenAI / Gemini (qua LLM Router) |

## Luồng hoạt động

```
┌─────────────────────────────────────────────────────────┐
│                    GIÁO VIÊN                            │
│  1. Tạo lớp → nhận mã lớp + PIN                        │
│  2. Tạo buổi học (Buổi 1, Buổi 2, ...)                 │
│  3. Upload tài liệu (PDF/DOCX/TXT) cho từng buổi       │
│  4. Mở buổi → học sinh có thể xem                       │
└─────────────────────┬───────────────────────────────────┘
                      │ Mã lớp
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    HỌC SINH                             │
│  1. Nhập mã lớp + tên → join lớp                        │
│  2. Xem danh sách buổi đã mở                            │
│  3. Chọn buổi → xem tài liệu                            │
│  4. Dùng AI: Tóm tắt, Quiz + Hint, Chat hỏi đáp         │
└─────────────────────────────────────────────────────────┘
```

## Cấu trúc thư mục

```
backend/
├── app/
│   ├── main.py              # FastAPI app, mount routers
│   ├── config.py             # Settings từ .env
│   ├── models/
│   │   ├── database.py       # SQLAlchemy models (Course, Session, Student, Document, ...)
│   │   └── schemas.py        # Pydantic request/response models
│   ├── routers/
│   │   ├── teacher.py        # API cho giáo viên (CRUD lớp, buổi, upload)
│   │   ├── student.py        # API cho học sinh (join, list buổi, xem tài liệu)
│   │   ├── chat.py           # Chat hỏi đáp RAG
│   │   ├── summary.py        # Tạo tóm tắt
│   │   ├── quiz.py           # Tạo quiz + đánh giá + hint
│   │   └── feedback.py       # Thu thập feedback
│   ├── services/
│   │   ├── rag_service.py    # ChromaDB vector store
│   │   ├── chat_service.py   # RAG chat logic
│   │   ├── summary_service.py
│   │   ├── quiz_service.py
│   │   ├── hint_service.py
│   │   ├── llm_router.py     # LLM provider routing
│   │   └── document_processor.py  # PDF/DOCX/TXT extraction + chunking
│   └── prompts/              # System & user prompts cho LLM
│       ├── chat.py
│       ├── summary.py
│       ├── quiz.py
│       └── hint.py

frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                      # Trang chủ: chọn Giáo viên / Học sinh
│   │   ├── teacher/
│   │   │   ├── page.tsx                  # Tạo lớp / đăng nhập lớp
│   │   │   └── course/[id]/page.tsx      # LMS dashboard: sidebar buổi + quản lý tài liệu
│   │   └── student/
│   │       ├── page.tsx                  # Join lớp / vào lại lớp
│   │       └── course/[id]/page.tsx      # LMS view: sidebar buổi + AI Tutor (chat + studio)
│   ├── components/
│   │   ├── sources/SourcePanel.tsx       # Danh sách tài liệu (read-only, dùng trong session cũ)
│   │   ├── chat/                         # Panel chat hỏi đáp AI
│   │   └── studio/                       # Panel tóm tắt + quiz + hint
│   ├── hooks/
│   │   ├── useSession.ts                 # Zustand store cho student session
│   │   └── useTeacher.ts                 # Zustand store cho teacher dashboard
│   ├── lib/
│   │   ├── api.ts                        # HTTP client cho backend API
│   │   └── utils.ts
│   └── types/index.ts                    # TypeScript interfaces
```

## Quan hệ dữ liệu

```
Course (Lớp học)
  ├── join_code (6 ký tự, chia sẻ cho học sinh)
  ├── teacher_pin (6 số, giáo viên giữ bí mật)
  │
  ├── Sessions (Buổi học)
  │   ├── is_open (true/false - toggle bởi giáo viên)
  │   └── Documents (Tài liệu)
  │       └── → ChromaDB chunks (vector embeddings)
  │
  └── Enrollments
      └── Students (Học sinh)
          ├── ChatMessages (lịch sử chat riêng)
          ├── Summaries (tóm tắt riêng)
          └── QuizAttempts (kết quả quiz riêng)
```

## RAG Pipeline

1. Giáo viên upload tài liệu → extract text (PyMuPDF/python-docx)
2. Text được chunk bằng LangChain RecursiveCharacterTextSplitter
3. Chunks lưu vào ChromaDB collection `session_{session_id}`
4. Khi học sinh hỏi → query ChromaDB → lấy top-k chunks → gửi LLM kèm context
5. LLM trả lời kèm nguồn tham chiếu
