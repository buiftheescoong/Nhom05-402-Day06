# Tech Stack — AI Learning Co-pilot MVP

## 1. Mục tiêu kỹ thuật

- Build MVP nhanh trong hackathon 6 ngày.
- Tối ưu để có demo end-to-end ổn định.
- Ưu tiên kiến trúc đơn giản, dễ debug, dễ mở rộng sau hackathon.

---

## 2. Architecture tổng quan

`Frontend (Next.js)` -> `Backend API (FastAPI)` -> `AI Services (LLM + Embedding)` -> `RAG Storage (ChromaDB)` -> `Document Parsing (PyMuPDF/python-docx)`

---

## 3. Stack đề xuất (MVP)

## Frontend

- **Framework:** Next.js (React + TypeScript)
- **UI:** Tailwind CSS (hoặc component library nhẹ)
- **State/data fetching:** React Query/SWR
- **Màn hình chính:** Upload, Summary, Quiz, Hint, Feedback

## Backend

- **API framework:** FastAPI (Python 3.11+)
- **Server:** Uvicorn/Gunicorn
- **Validation:** Pydantic schema cho request/response
- **Auth (pilot):** token đơn giản hoặc bypass nội bộ hackathon

## AI/LLM layer

- **LLM generation:** Claude API (summarize, quiz, hint, grading)
- **Embedding:** `text-embedding-3-small` (hoặc model tương đương)
- **Prompting:** prompt template versioned theo task (`summary`, `quiz`, `hint_l1/l2/l3`, `grader`)

## RAG & data layer

- **Vector DB:** ChromaDB (local) cho MVP
- **Chunking:** ~500 tokens, overlap ~50
- **Retrieval:** top-k chunks + similarity threshold
- **Parsing:** PyMuPDF (PDF), python-docx (DOCX)

## Deployment & DevOps

- **Frontend deploy:** Vercel
- **Backend deploy:** Railway (hoặc Render)
- **Container:** Docker + docker-compose
- **CI:** GitHub Actions (lint, test cơ bản, build check)
- **Observability:** logging + latency/error metrics cơ bản

---

## 4. API surface (MVP)

- `POST /upload`  
  Input: file (`pdf/docx`)  
  Output: `doc_id`, trạng thái parse, metadata

- `POST /summarize`  
  Input: `doc_id`, scope/chapter  
  Output: summary + `source_chunk_ids`

- `POST /quiz`  
  Input: `doc_id`, scope, difficulty, num_questions  
  Output: quiz items + `source_chunk_ids`

- `POST /hint`  
  Input: question context, hint level (1/2/3)  
  Output: hint text + `source_chunk_ids`

- `POST /feedback`  
  Input: object type (`summary/quiz/hint`), rating/report/edit note  
  Output: ack + feedback id

---

## 5. Non-functional targets

- **Latency mục tiêu:**
  - Summarize/quiz/hint: 5-10 giây (MVP với file lớn)
  - P95 cho phản hồi ngắn: <= 3s khi có cache và context ngắn
- **Cost:** mục tiêu dưới $0.02/query trung bình
- **Reliability:** error rate API < 5% trong demo
- **Security:** không public tài liệu nội bộ; secrets qua env vars

---

## 6. Grounding & safety rules

- Mọi output quan trọng phải kèm `source_chunk_id`.
- Nếu retrieval similarity < ngưỡng (vd 0.7), trả về cảnh báo "không đủ chắc chắn".
- Không trả lời chắc chắn khi ngoài phạm vi tài liệu.
- Bật cơ chế report/edit ở mọi bước quan trọng.

---

## 7. Data model (tối thiểu)

- `documents(doc_id, owner_id, filename, file_type, created_at)`
- `chunks(chunk_id, doc_id, page_no, text, embedding_ref)`
- `quizzes(quiz_id, doc_id, created_at, difficulty, scope)`
- `quiz_questions(question_id, quiz_id, prompt, model_answer, source_chunk_ids)`
- `feedback(feedback_id, user_id, object_type, object_id, rating, note, created_at)`

---

## 8. Trade-offs trong MVP

- Chọn Chroma local để nhanh, chấp nhận chưa HA.
- Chưa tách microservices để giảm integration complexity.
- Chưa làm fine-tuning; dùng prompt + retrieval + feedback loop.
- Chưa làm OCR nâng cao để giữ tiến độ demo.

---

## 9. Next phase (sau MVP)

- Thêm Chat Q&A (F5) có citation.
- Thêm Redis cache và batching để giảm latency/cost.
- Migrate vector DB managed (Pinecone/Weaviate) nếu scale.
- Thêm auth/role chuẩn cho trường lớp.
