# Tech Stack — AI Learning Co-pilot (AI Tutor)

## 1. Mục tiêu kỹ thuật

- Xây dựng sản phẩm giáo dục MVP (Nền tảng học tập thông minh).
- Tối ưu demo end-to-end ổn định với phân phối luồng Giáo viên (Teacher) và Học sinh (Student).
- Hỗ trợ đa dạng nền tảng LLM định tuyến (OpenAI/Gemini) để tối ưu chi phí và tăng performance.

---

## 2. Architecture tổng quan

`Frontend (Next.js/React)` -> `Backend API (FastAPI)` -> `LLM Router (OpenAI/Gemini)`
- `Backend API` -> `RAG Storage (ChromaDB)` & `Relational DB (SQLite)`
- `Document Parsing` -> `PyMuPDF / python-docx`

---

## 3. Stack hiện tại

### Frontend
- **Framework:** Next.js 16 (App Router), React 19
- **UI:** Tailwind CSS v4, base-ui, class-variance-authority, shadcn
- **State management:** Zustand
- **Màn hình/Luồng:**
  - Giáo viên: Quản lý lớp, tạo buổi học (notebooks), upload tài liệu học tập.
  - Học sinh: Join lớp bằng code định danh, sử dụng Tóm tắt AI, tạo Quiz, Chat Q&A có ngữ cảnh.

### Backend
- **API framework:** FastAPI (Python 3.12+)
- **Server:** Uvicorn
- **ORM / Validation:** SQLAlchemy, Pydantic (schema/settings)
- **Thiết kế API:** chia router độc lập (`teacher`, `student`, `summary`, `quiz`, `chat`, `feedback`).

### AI/LLM layer
- **LLM/Router:** Hỗ trợ OpenAI (ví dụ GPT-4o) và Google GenAI (Gemini) qua Langchain layer (`langchain-openai`, `langchain-google-genai`).
- **Embedding:** OpenAI/Google hoặc provider local.
- **Chain Flow:** LangChain để quản lý text-splitters (chunking ~1000, overlap ~200) và prompt template generation.

### Database & Storage
- **Relational DB:** SQLite qua `aiosqlite` & `SQLAlchemy`. Quản lý metadata cấu trúc lớp, session, buổi học.
- **RAG/Vector DB:** ChromaDB (Local persistence).
- **File Storage:** Lưu trữ nội bộ hệ thống trong `uploads` directory.

### Deployment & DevOps
- **Containerization:** Docker + `docker-compose` phân tách minh bạch `frontend` & `backend`.
- **Environment:** Quản lý biến môi trường bảo mật qua `.env`.

---

## 4. API surface (Backend Routers)

- `GET/POST /api/teacher/...`
  - Quản lý lớp học (Tạo lớp, tạo PIN giới hạn).
  - Quản lý notebook/buổi học, cập nhật trạng thái mở khóa bài giảng cho học sinh.
  - Upload file (PDF, DOCX) và Parse RAG vector.
- `GET/POST /api/student/...`
  - Tham gia lớp qua tham chiếu tên và class code.
  - Xem danh sách documents của session hiện tại.
- `POST /api/summary/...`
  - Tạo tóm tắt ngữ liệu dài lấy từ database.
- `POST /api/quiz/...`
  - Sinh trắc nghiệm/Tự luận kèm Hint 3 cấp độ (L1/L2/L3).
- `POST /api/chat/...`
  - Chat có context RAG trực tiếp từ tài liệu đang thao tác.
- `POST /api/feedback/...`
  - Gửi báo lỗi hoặc đánh giá (rating) kết quả mô hình.

---

## 5. Non-functional targets (MVP)

- **Latency:** Xử lý file, tóm tắt tài liệu lớn: 5-10 giây; P95 cho phản hồi chat (RAG) <= 3-5s (Phụ thuộc API OpenAI/Gemini external).
- **Tính bảo mật:** Cấu trúc PIN + Mã định danh lớp tránh chia sẻ rộng rãi. Biến secrets nằm 100% tại `.env`.
- **Khả năng duy trì / Mở rộng:** Dùng LLM router ở config giúp dễ chuyển đổi mô hình (ví dụ chuyển hẳn qua Gemini nếu OpenAI rate limit).

---

## 6. Trade-offs thiết kế (Dạng MVP Hackathon)

- Chỉ dùng SQLite thay cho Postgres để tối giản dependency cho setup local.
- Tương tự với ChromaDB chạy local directory. 
- Authentication luồng Student dựa trên Session và Mã Lớp/Tên học sinh để giảm rào cản đăng ký tài khoản (rất phù hợp cho LMS test/Hackathon flow).
