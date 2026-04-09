# AI Tutor - Nền tảng học tập thông minh

Hệ thống LMS tích hợp AI giúp giáo viên quản lý tài liệu theo buổi học, học sinh tham gia lớp và sử dụng AI để tóm tắt, tạo quiz, hỏi đáp.

## Tính năng

### Giáo viên
- Tạo lớp học → nhận **mã lớp** (chia sẻ cho học sinh) + **PIN** (giữ bí mật)
- Tạo buổi học (Buổi 1, Buổi 2, ...) và upload tài liệu (PDF, DOCX, TXT)
- **Mở/đóng buổi** - chỉ buổi được mở thì học sinh mới thấy

### Học sinh
- Nhập mã lớp + tên → **join lớp**
- Xem danh sách buổi đã mở → chọn buổi
- **Tóm tắt AI** - tự động tóm tắt nội dung tài liệu
- **Quiz + Hint** - bài kiểm tra tự động với gợi ý theo cấp độ
- **Chat hỏi đáp** - đặt câu hỏi về tài liệu, AI trả lời kèm nguồn

## Stack

| | Công nghệ |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS, Zustand |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| AI | OpenAI / Gemini (LLM Router) |
| Vector DB | ChromaDB |
| Database | SQLite |

## Chạy nhanh

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env  # điền API keys
uvicorn app.main:app --reload --port 8000

# Frontend (tab mới)
cd frontend
npm install
npm run dev
```

Mở `http://localhost:3000` → Chọn Giáo viên hoặc Học sinh.

## Tài liệu chi tiết

- [Kiến trúc hệ thống](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Hướng dẫn Setup](docs/SETUP.md)
- [Changelog](docs/CHANGELOG.md)

## Cấu trúc thư mục

```
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── config.py          # Settings
│   │   ├── models/            # Database + Pydantic schemas
│   │   ├── routers/           # API endpoints (teacher, student, chat, ...)
│   │   ├── services/          # Business logic (RAG, LLM, ...)
│   │   └── prompts/           # LLM prompts
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/               # Pages (Next.js App Router)
│       ├── components/        # UI components
│       ├── hooks/             # Zustand stores
│       ├── lib/               # API client, utils
│       └── types/             # TypeScript types
├── docs/                      # Documentation
└── docker-compose.yml
```
