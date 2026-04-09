# SRS — Software Requirements Specification

## 1. Introduction

### 1.1 Purpose

Tài liệu này mô tả yêu cầu phần mềm cho hệ thống AI Learning Co-pilot hỗ trợ học sinh/sinh viên ôn tập từ tài liệu học tập bằng tóm tắt, quiz và hint.

### 1.2 Scope

Hệ thống cho phép người dùng:

- Upload tài liệu học tập (`PDF`, `DOCX`)
- Nhận tóm tắt có cấu trúc
- Làm quiz tự luận
- Nhận hint nhiều cấp độ
- Gửi feedback/correction khi AI sai

### 1.3 Definitions

- **GAR:** Grounded Answer Rate
- **TSR:** Task Success @1-turn
- **RAG:** Retrieval-Augmented Generation
- **Hint L1/L2/L3:** Mức gợi ý tăng dần

---

## 2. Overall description

### 2.1 Product perspective

Sản phẩm là web app gồm frontend, backend API, và AI/RAG pipeline. Dữ liệu tài liệu được parse, chunk, embed và truy xuất phục vụ sinh nội dung học tập có grounding.

### 2.2 User classes

- **Student user:** Upload tài liệu, học bằng summary/quiz/hint, gửi feedback.
- **Admin/mentor (tùy chọn pilot):** Theo dõi lỗi lặp và chất lượng hệ thống.

### 2.3 Operating environment

- Client: Web browser hiện đại
- Frontend: Next.js
- Backend: FastAPI (Python)
- AI services: LLM + embedding API
- Storage: ChromaDB local (MVP)

### 2.4 Constraints

- Thời gian hackathon ngắn (6 ngày)
- Cost mục tiêu thấp
- Dữ liệu học tập có thể là nội bộ, cần bảo mật cơ bản

---

## 3. External interface requirements

### 3.1 User interface

- Trang upload file và hiển thị trạng thái xử lý
- Trang summary có citation
- Trang quiz tự luận (nhập câu trả lời + xem chấm điểm)
- Nút hint theo cấp độ
- Nút feedback/report ở các điểm chính

### 3.2 Software interfaces

- LLM API cho generation
- Embedding API cho vector hóa
- Vector DB API cho lưu/truy xuất chunk
- File parser library cho PDF/DOCX

### 3.3 Communication interfaces

- HTTPS REST APIs dạng JSON
- Multipart upload cho tài liệu

---

## 4. System features and functional requirements

### 4.1 Feature A — Document Upload and Processing

- `REQ-FUNC-001`: Hệ thống phải nhận file `PDF`/`DOCX`.
- `REQ-FUNC-002`: Hệ thống phải parse được văn bản và metadata trang/mục (khi có).
- `REQ-FUNC-003`: Hệ thống phải thông báo trạng thái xử lý thành công/thất bại rõ ràng.
- `REQ-FUNC-004`: Khi parse thất bại, hệ thống phải đưa hướng dẫn recover (re-upload, đổi định dạng).

### 4.2 Feature B — Summarization

- `REQ-FUNC-005`: Hệ thống phải sinh tóm tắt gồm key points và phần diễn giải.
- `REQ-FUNC-006`: Tóm tắt phải gắn citation (`source_chunk_ids`).
- `REQ-FUNC-007`: User có thể yêu cầu tạo quiz từ phần tóm tắt.

### 4.3 Feature C — Quiz Generation and Grading

- `REQ-FUNC-008`: Hệ thống phải sinh được 5-10 câu hỏi tự luận từ phạm vi đã chọn.
- `REQ-FUNC-009`: Hệ thống phải nhận câu trả lời text và chấm/nhận xét cơ bản.
- `REQ-FUNC-010`: Kết quả quiz phải có phân tích điểm mạnh/yếu ngắn gọn.

### 4.4 Feature D — Hint System

- `REQ-FUNC-011`: Mỗi câu hỏi phải hỗ trợ hint nhiều cấp (L1/L2/L3).
- `REQ-FUNC-012`: Hint không được lộ đáp án trực tiếp ở cấp thấp.
- `REQ-FUNC-013`: Hệ thống phải fallback sang trích đoạn nguồn khi không chắc hint.

### 4.5 Feature E — Feedback and Correction

- `REQ-FUNC-014`: User phải gửi được report/edit với 1 click.
- `REQ-FUNC-015`: Hệ thống phải lưu feedback gồm loại lỗi và ghi chú người dùng.
- `REQ-FUNC-016`: Correction lặp lại phải được gắn cờ để cải tiến prompt/retrieval.

### 4.6 Grounding and Safety

- `REQ-FUNC-017`: Mọi output học thuật quan trọng phải có citation hợp lệ.
- `REQ-FUNC-018`: Nếu similarity retrieval dưới ngưỡng thì hệ thống phải cảnh báo "không đủ chắc chắn".
- `REQ-FUNC-019`: Không được trả lời chắc chắn cho nội dung ngoài tài liệu mà không dán nhãn.

---

## 5. Non-functional requirements

### 5.1 Performance

- `REQ-NFR-001`: P95 response time mục tiêu <= 3.0s cho luồng ngắn; với luồng xử lý file lớn chấp nhận 5-10s.
- `REQ-NFR-002`: Timeout rate <= 5% trong pilot nội bộ.

### 5.2 Reliability

- `REQ-NFR-003`: API phải có cơ chế xử lý lỗi chuẩn và trả thông báo có thể hành động.
- `REQ-NFR-004`: Hệ thống không được fail im lặng.

### 5.3 Security and privacy

- `REQ-NFR-005`: Secrets phải quản lý qua environment variables.
- `REQ-NFR-006`: Tài liệu upload chỉ truy cập bởi người dùng được phép trong môi trường pilot.
- `REQ-NFR-007`: Ghi log không chứa dữ liệu nhạy cảm ngoài mục đích vận hành.

### 5.4 Maintainability

- `REQ-NFR-008`: API schema phải versioned và có validation.
- `REQ-NFR-009`: Prompt templates phải tách file và quản lý version.

### 5.5 Cost

- `REQ-NFR-010`: Cost trung bình mục tiêu <= $0.02/query (theo tuần).

---

## 6. Acceptance criteria

- `AC-001`: User upload tài liệu và nhận được summary có citation.
- `AC-002`: User tạo quiz và nhận được >=5 câu hỏi liên quan tài liệu.
- `AC-003`: User dùng hint 3 cấp trên ít nhất 1 câu quiz.
- `AC-004`: User gửi feedback report/edit thành công.
- `AC-005`: Hệ thống trả cảnh báo khi không đủ bằng chứng grounding.
- `AC-006`: GAR >= 85% trên bộ test chuẩn pilot.

---

## 7. Measurement and monitoring

- Theo dõi 3 metric lõi: GAR, TSR, P95 latency.
- Theo dõi guardrail: correction rate, no-citation rate, cost/query.
- Dashboard tách theo môn học, loại câu hỏi, độ dài context.

---

## 8. Assumptions and dependencies

- Có API key hợp lệ cho LLM/embedding.
- Có tài liệu test thật từ các môn học mục tiêu.
- Team có đủ vai trò FE/BE/Prompt/QA để tích hợp trong 6 ngày.

---

## 9. Future requirements (post-MVP)

- Thêm Chat Q&A (F5) với grounding đầy đủ.
- Hệ thống review tự động cho lỗi lặp từ feedback logs.
- Tăng mức bảo mật và quản trị người dùng khi triển khai rộng.
