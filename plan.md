Đọc xong spec rồi. Đây là plan MVP cho 6 người — focus vào core value, cắt hết những gì không cần thiết cho hackathon.

---

## 🎯 MVP Scope — Cắt gì, giữ gì

**Giữ (must-have):** F1 Upload → F2 Summarize → F3 Quiz → F4 Hint
**Cắt khỏi MVP:** F5 Chat Q&A (tăng complexity, thêm sau), correction flywheel, OCR ảnh mờ, grade-level curriculum templates

**Stack:** Next.js + FastAPI + Claude API + ChromaDB (local) + PyMuPDF

---

## 👥 Phân công 6 người

| Người | Role | Owns |
|---|---|---|
| **P1** | Infra / Lead | Repo setup, Docker, deploy (Vercel + Railway), API keys, CI |
| **P2** | Frontend | Upload UI, Summary view, Quiz UI, Hint UI |
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
- P2: Wireframe UI, setup Next.js, build upload component

### Ngày 3–4 — Integration
- P5: Xây 4 endpoints: `POST /upload`, `POST /summarize`, `POST /quiz`, `POST /hint`
- P2: Kết nối UI với API, build quiz flow (câu hỏi → trả lời → chấm → hint)
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
upload → parse → embed → store
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
| Scope creep (muốn làm F5 Chat) | PM (P6) giữ scope — F5 là stretch goal, không phải MVP |

---

**Bottom line:** Ngày 5 end of day phải có demo chạy được end-to-end với 1 bộ tài liệu thật. Ngày 6 chỉ polish và rehearse. Đừng add feature mới sau ngày 4.