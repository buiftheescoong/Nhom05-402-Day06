# Hướng dẫn Setup & Chạy dự án

## Yêu cầu

- Python 3.11+
- Node.js 18+
- OpenAI API key hoặc Gemini API key

## 1. Backend

### Cài đặt dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Cấu hình .env

Copy `.env.example` thành `.env` và điền API keys:

```bash
cp .env.example .env
```

Nội dung `.env`:
```
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
DEFAULT_LLM_PROVIDER=openai    # hoặc gemini
EMBEDDING_PROVIDER=openai
CORS_ORIGINS=http://localhost:3000
```

### Chạy backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Backend sẽ chạy tại `http://localhost:8000`. Swagger docs tại `http://localhost:8000/docs`.

### Lưu ý
- Lần đầu chạy, database SQLite sẽ tự tạo tại `./data/aitutor.db`
- Tài liệu upload sẽ lưu tại `./uploads/`
- Vector embeddings lưu tại `./data/chroma/`

## 2. Frontend

### Cài đặt dependencies

```bash
cd frontend
npm install
```

### Chạy frontend

```bash
npm run dev
```

Frontend sẽ chạy tại `http://localhost:3000`.

### Biến môi trường (tùy chọn)

Tạo file `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 3. Docker (tùy chọn)

```bash
docker-compose up --build
```

## 4. Kiểm tra

1. Mở `http://localhost:3000`
2. Chọn **Giáo viên** → Tạo lớp → Ghi nhận mã lớp + PIN
3. Tạo buổi học → Upload tài liệu → Mở buổi
4. Mở tab mới → Chọn **Học sinh** → Nhập mã lớp + tên → Join
5. Vào buổi đã mở → Dùng Tóm tắt, Quiz, Chat
