Đọc xong spec rồi. Đây là plan MVP cho 6 người — focus vào core value, cắt hết những gì không cần thiết cho hackathon.

---

## 🎯 MVP Scope — Cắt gì, giữ gì

**Giữ (must-have):** Vỏ LMS (**Day 01…Day N** + danh sách tài liệu + **viewer**) → **popup chat** (floating, ngữ cảnh Day + tài liệu đang xem) → F2 Summarize → F3 Quiz → F4 Hint (luồng xử lý tài liệu gắn với Day/tài liệu đã chọn, không còn màn upload độc lập là trục chính)

**Cắt khỏi MVP:** Chat Q&A **tự do toàn hệ thống** không gắn tài liệu (khác với chat ngữ cảnh trong popup), correction flywheel đầy đủ, OCR ảnh mờ, grade-level curriculum templates, CMS quản lý Day/tài liệu đầy đủ (chỉ cần **seed** hoặc thêm tối giản)

**Stack:** Next.js + FastAPI + Claude API + ChromaDB (local) + PyMuPDF

---

## 👥 Phân công 6 người

| Người | Role | Owns |
|---|---|---|
| **P1** | Infra / Lead | Repo setup, Docker, deploy (Vercel + Railway), API keys, CI |
| **P2** | Frontend | Shell LMS: tab Day + danh sách tài liệu, **viewer** (PDF/slide/ảnh), **widget chat floating + popup**; Summary / Quiz / Hint trong ngữ cảnh tài liệu đang mở |
| **P3** | Backend / RAG | PDF/DOCX parsing, chunking, embedding, ChromaDB retrieval |
| **P4** | Prompt Engineer | Prompts cho summarize, quiz gen, hint (3 levels), grading |
| **P5** | Backend / API | FastAPI routes nối P3+P4, response schema, error handling |
| **P6** | Eval / QA | Test cases, GAR spot-check, demo data, slide deck |

---

## 🗓️ Timeline — 3 giai đoạn

### Ngày 1–2 — Foundation
- P1: Khởi repo, setup môi trường, Docker compose
- P3: Parser chạy được PDF/DOCX → raw text → chunks → embed vào Chroma
- P4: Viết + test 4 prompts core (summary, quiz_gen, hint_l1/l2/l3, grader) trên Playground trước
- P2: Wireframe + setup Next.js: **sidebar Day**, **danh sách tài liệu**, **viewer**, **nút chat góc phải + popup**; mock dữ liệu **Day 01** = 1 slide bài giảng + 1 PDF tham khảo

### Ngày 3–4 — Integration
- P5: Xây endpoints (có thể gắn `day_id` / `document_id` trong body): ví dụ ingest tài liệu, `POST /summarize`, `POST /quiz`, `POST /hint`, và route chat ngữ cảnh nếu tách riêng
- P2: Kết nối UI với API: **chọn Day → chọn tài liệu → viewer** → mở popup → quiz flow (câu hỏi → trả lời → chấm → hint)
- P4: Tune prompts dựa trên output thật từ P3's chunks
- P6: Chuẩn bị 3–5 bộ tài liệu test thật (môn Toán, Lý, Văn)

### Ngày 5–6 — Polish + Demo
- P1 + P5: Fix bugs, log basic metrics (response time, error rate)
- P2: Source citation UI (highlight đoạn gốc), loading states, error messages
- P4: Thêm citation vào prompt output — bắt buộc để hit GAR ≥85%
- P6: Chạy eval 20 queries, tính GAR thủ công, làm slide demo
- **Toàn team:** Demo rehearsal, cắt feature nếu không kịp

---

## ⚡ Quyết định kỹ thuật nhanh

```
Document pipeline:
PDF/DOCX → PyMuPDF/python-docx → chunk 500 tokens overlap 50
→ text-embedding-3-small → ChromaDB (local, đủ cho MVP)

Per-request flow:
chọn Day + tài liệu → viewer hiển thị → (optional) mở popup chat với context day_id + document_id
ingest/parse tài liệu → embed → store (theo document)
summarize → retrieve top-k chunks → Claude prompt → return
quiz → retrieve chunks → generate 5 câu → return
hint → question context → 3-level hint prompt → return per click

Grounding rule (hard):
Mọi output PHẢI có field `source_chunk_id`. Nếu retrieval trả về
similarity < 0.7 → trả về cảnh báo thay vì hallucinate.
```

---

## 🚨 Risk & Mitigation cho 6 ngày

| Risk | Mitigation |
|---|---|
| Prompt quality kém → GAR thấp | P4 dành nguyên ngày 1 test prompts, không đợi infra |
| Integration hell ngày 3–4 | P5 định nghĩa schema JSON ngay ngày 1, P2 mock API trước |
| Không có tài liệu test thật | P6 chuẩn bị từ ngày 1, không đợi feature xong |
| Scope creep (chat không gắn tài liệu / multi-doc tự do) | PM (P6) giữ scope — chỉ chat **ngữ cảnh** trong popup theo tài liệu đang xem |

---

**Bottom line:** Ngày 5 end of day phải có demo end-to-end: **Day → tài liệu → viewer → popup chat → summarize/quiz/hint** với ít nhất **Day 01** (slide + PDF) và tài liệu thật. Ngày 6 chỉ polish và rehearse. Đừng add feature mới sau ngày 4.