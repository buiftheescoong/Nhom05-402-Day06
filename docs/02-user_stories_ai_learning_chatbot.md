# User Stories — AI Chatbot Hỗ Trợ Học Tập

## Phân tích Features Chính

Từ mô tả sản phẩm (tóm tắt tài liệu + sinh câu hỏi kiểm tra có hint), tôi xác định **5 features chính**:

| # | Feature | Loại (Auto/Aug) | Mô tả |
|---|---------|-----------------|--------|
| 1 | **Tải lên & Xử lý tài liệu** | Automation | Học sinh upload tài liệu → AI trích xuất nội dung, nhận dạng cấu trúc (chương, mục, công thức…) |
| 2 | **Tóm tắt tài liệu** | Augmentation | AI tạo bản tóm tắt ngắn gọn theo nhiều cấp độ (overview, chi tiết từng phần) |
| 3 | **Sinh câu hỏi kiểm tra tự luận (Quiz)** | Augmentation | AI tự động tạo bộ câu hỏi tự luận ôn tập dựa trên nội dung tài liệu |
| 4 | **Hệ thống Hint khi làm Quiz** | Augmentation | Khi học sinh không trả lời được, AI cung cấp gợi ý nhiều cấp độ thay vì đưa đáp án ngay |
| 5 | **Chat hỏi đáp về tài liệu** | Augmentation | Học sinh hỏi bất kỳ câu gì liên quan đến tài liệu → AI trả lời dựa trên nội dung đã upload |

> [!NOTE]
> Feature 1 là nền tảng (phải hoạt động tốt để các feature còn lại có ý nghĩa). Feature 2–4 là core value. Feature 5 là bổ trợ nhưng tăng stickiness.

---

## Feature 1: Tải lên & Xử lý tài liệu

**Trigger:** Học sinh upload file PDF/DOCX/ảnh chụp bài giảng → AI xử lý, trích xuất nội dung → Hiển thị kết quả xử lý cho học sinh xác nhận.

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| **Happy — AI đúng, tự tin** | User thấy gì sau khi upload? Flow kết thúc ra sao? | File upload thành công → AI hiển thị outline dàn ý tài liệu (các chương/mục chính) + thông báo "Sẵn sàng tóm tắt & tạo quiz". User thấy đúng → nhấn "Tiếp tục" → chuyển sang tóm tắt hoặc tạo quiz. |
| **Low-confidence — AI không chắc** | System báo "không chắc" bằng cách nào? User quyết thế nào? | AI nhận dạng được ~70% nội dung (VD: file scan mờ, có công thức phức tạp) → Hiện cảnh báo vàng "⚠️ Một số phần có thể chưa chính xác" + highlight đoạn lỗi → User có thể chỉnh sửa text trực tiếp hoặc re-upload file rõ hơn. |
| **Failure — AI sai** | User biết AI sai bằng cách nào? Recover ra sao? | File quá mờ / định dạng lạ → AI không đọc được → Hiện thông báo đỏ "Không thể xử lý file này" + gợi ý: (1) Upload ảnh rõ hơn, (2) Chuyển sang định dạng PDF, (3) Copy-paste text trực tiếp vào ô chat. Không bao giờ im lặng fail. |
| **Correction — user sửa** | User sửa bằng cách nào? Data đó đi vào đâu? | User thấy outline bị sai (VD: công thức toán bị nhận nhầm) → Click vào đoạn sai → Sửa text trực tiếp trong editor inline → Nhấn "Xác nhận" → Bản đã sửa trở thành source-of-truth cho tóm tắt & quiz. Dữ liệu correction lưu vào log để cải thiện OCR/parsing pipeline. |

---

## Feature 2: Tóm tắt tài liệu

**Trigger:** Học sinh nhấn "Tóm tắt" hoặc chat "tóm tắt chương 3 cho mình" → AI phân tích nội dung → Trả về bản tóm tắt.

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| **Happy — AI đúng, tự tin** | User thấy gì? Flow kết thúc ra sao? | AI trả về bản tóm tắt cấu trúc: **Key Points** (3–5 ý chính dạng bullet) + **Tóm tắt chi tiết** (1–2 đoạn). Cuối tóm tắt có nút "📝 Tạo quiz từ phần này" và "🔍 Tóm tắt sâu hơn". User đọc → thấy đủ ý → tiếp tục ôn bài hoặc tạo quiz. |
| **Low-confidence — AI không chắc** | System báo "không chắc" bằng cách nào? User quyết thế nào? | Tài liệu có thuật ngữ chuyên ngành nặng hoặc nội dung mơ hồ → AI hiển thị tóm tắt kèm ghi chú: "💡 *Phần này mình chưa chắc lắm, bạn kiểm tra lại nhé*" + highlight đoạn uncertain bằng màu vàng + kèm trích dẫn gốc từ tài liệu (reference) để user tự đối chiếu. |
| **Failure — AI sai** | User biết AI sai bằng cách nào? Recover ra sao? | AI tóm tắt bị **bỏ sót ý quan trọng** hoặc **hiểu sai logic** (VD: tóm tắt ngược nghĩa) → User so sánh với tài liệu gốc → Phát hiện thiếu/sai → Nhấn 👎 hoặc "Sai rồi" → Hiện panel so sánh tóm tắt vs. tài liệu gốc song song (split-view). Đây là failure nguy hiểm nhất vì user có thể **không biết bị sai** nếu không kiểm tra. |
| **Correction — user sửa** | User sửa bằng cách nào? Data đó đi vào đâu? | User nhấn 👎 → Chọn loại lỗi: (1) Thiếu ý quan trọng, (2) Sai nội dung, (3) Quá dài/ngắn → Nếu chọn (1)(2): có thể nhập ghi chú "thiếu phần XYZ" hoặc sửa trực tiếp tóm tắt → AI regenerate dựa trên feedback → Correction data → feedback log (user_id, doc_id, error_type, user_note) → dùng để fine-tune prompt/model qua thời gian. |

---

## Feature 3: Sinh câu hỏi kiểm tra (Quiz Generation)

**Trigger:** Học sinh chọn phạm vi ôn tập (chương/mục/toàn bộ) + chọn độ khó (cơ bản/nâng cao) → AI sinh bộ câu hỏi tự luận.

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| **Happy — AI đúng, tự tin** | User thấy gì? Flow kết thúc ra sao? | AI sinh 5–10 câu hỏi tự luận, trộn đều các mức nhận biết / thông hiểu / vận dụng. Mỗi câu hiển thị đề bài rõ ràng + ô nhập câu trả lời dạng text. User viết câu trả lời → submit → AI chấm bài tự luận: đánh giá mức độ đúng (VD: "✅ Đúng 90% — bạn trả lời đầy đủ ý chính, thiếu phần giải thích về…") kèm đáp án mẫu để user so sánh. Cuối quiz: hiện dashboard điểm tổng + phân tích ý yếu cần ôn lại. |
| **Low-confidence — AI không chắc** | System báo "không chắc" bằng cách nào? User quyết thế nào? | AI gặp nội dung khó sinh câu hỏi rõ ràng (VD: tài liệu triết học, nội dung chủ quan) → Sinh câu hỏi kèm tag "⚠️ Câu hỏi này mang tính tham khảo" → Cuối quiz, hiện ghi chú: "Một số câu có thể có nhiều đáp án hợp lý. Nếu bạn thấy không phù hợp, nhấn 🚩 để báo." |
| **Failure — AI sai** | User biết AI sai bằng cách nào? Recover ra sao? | Hai dạng lỗi: (1) AI sinh câu hỏi có **đáp án mẫu sai** → User viết đúng nhưng AI chấm sai/thấp điểm → Bực bội; (2) AI **chấm bài tự luận không chính xác** — đánh giá quá khắt khe hoặc quá dễ dãi (VD: cho 100% khi câu trả lời chỉ đúng một phần). User nhấn 🚩 "Chấm sai" trên câu đó → Hệ thống hiện đáp án mẫu + trích dẫn tài liệu gốc để user tự đối chiếu, kèm nút "Bỏ qua & tiếp tục". **Rủi ro lớn:** User tin điểm AI chấm → nghĩ mình đã hiểu đủ nhưng thực ra chưa. Cần mitigation mạnh. |
| **Correction — user sửa** | User sửa bằng cách nào? Data đó đi vào đâu? | User nhấn 🚩 → Chọn: (1) Đáp án mẫu sai, (2) Chấm điểm không chính xác, (3) Câu hỏi khó hiểu, (4) Không liên quan đến tài liệu → Nếu (1)(2): user viết giải thích tại sao sai + đáp án đúng theo họ → Data vào `quiz_correction_log(quiz_id, question_id, user_answer, ai_model_answer, ai_score, user_correction, error_type)` → Nếu ≥3 user báo cùng lỗi → Auto-flag câu hỏi → Admin review hoặc AI auto-regenerate câu hỏi + đáp án mẫu. |

---

## Feature 4: Hệ thống Hint khi làm Quiz

**Trigger:** Học sinh đang làm quiz tự luận → Không biết cách trả lời → Nhấn nút "💡 Gợi ý" → AI cung cấp hint theo cấp độ tăng dần, giúp gợi mở tư duy thay vì đưa sẵn câu trả lời.

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| **Happy — AI đúng, tự tin** | User thấy gì? Flow kết thúc ra sao? | User nhấn "💡 Gợi ý" → **Hint cấp 1:** Gợi ý hướng suy nghĩ (VD: "Hãy nhớ lại định luật Newton thứ 2") → Vẫn không biết → Nhấn lần 2 → **Hint cấp 2:** Thu hẹp phạm vi (VD: "Công thức liên quan đến F, m, a") → Nhấn lần 3 → **Hint cấp 3:** Gần như đáp án (VD: "F = m × ?"). Mỗi lần nhấn hint, điểm câu đó giảm nhẹ (10 → 8 → 5 → 3). User thấy hint hữu ích → nhớ ra → trả lời đúng. |
| **Low-confidence — AI không chắc** | System báo "không chắc" bằng cách nào? User quyết thế nào? | Nội dung câu hỏi quá chuyên sâu, AI không chắc hint nào phù hợp → Thay vì hint truyền thống, AI hiển thị: "📖 Tham khảo lại đoạn này trong tài liệu" + trích dẫn đoạn văn gốc liên quan (kiểu RAG reference). User tự đọc và suy luận. Đây là fallback an toàn hơn so với hint sai. |
| **Failure — AI sai** | User biết AI sai bằng cách nào? Recover ra sao? | AI cho hint **dẫn sai hướng** (VD: gợi ý công thức không liên quan) → User theo hint → Trả lời sai → Xem đáp án giải thích → Phát hiện hint không liên quan → Mất niềm tin. **Recover:** Ở màn xem lại đáp án, hiện nút "Hint có hữu ích không?" (👍/👎). Nếu 👎 → Log + regenerate hint cho lần sau. |
| **Correction — user sửa** | User sửa bằng cách nào? Data đó đi vào đâu? | Sau mỗi câu quiz (khi xem đáp án), user thấy phần "Hint bạn đã dùng" → Đánh giá 👍/👎 cho từng hint → Nếu 👎: tùy chọn ghi chú "hint sai chỗ nào" → Data vào `hint_feedback_log(question_id, hint_level, rating, user_note)` → Dùng để improve prompt sinh hint (few-shot examples từ hint tốt, loại bỏ pattern hint xấu). |

---

## Feature 5: Chat hỏi đáp về tài liệu (RAG-based Q&A)

**Trigger:** Học sinh đang đọc tóm tắt hoặc làm quiz → Thắc mắc → Gõ câu hỏi vào chat (VD: "Giải thích rõ hơn định luật bảo toàn năng lượng") → AI trả lời dựa trên nội dung tài liệu đã upload.

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| **Happy — AI đúng, tự tin** | User thấy gì? Flow kết thúc ra sao? | AI trả lời rõ ràng, có cấu trúc + kèm trích dẫn nguồn từ tài liệu (VD: "Theo slide 15, chương 3…"). Cuối câu trả lời có: (1) "Bạn hiểu chưa?" (👍/👎), (2) "Hỏi thêm" để drill-down. User hiểu → 👍 → tiếp tục học. |
| **Low-confidence — AI không chắc** | System báo "không chắc" bằng cách nào? User quyết thế nào? | Câu hỏi nằm **ngoài phạm vi tài liệu** hoặc tài liệu không đề cập rõ → AI trả lời: "📚 *Tài liệu của bạn không đề cập trực tiếp đến vấn đề này. Đây là hiểu biết chung của mình, bạn nên kiểm tra thêm:*" + câu trả lời + gợi ý từ khóa Google/tài liệu tham khảo. Rõ ràng phân biệt giữa "từ tài liệu" vs. "kiến thức chung". |
| **Failure — AI sai** | User biết AI sai bằng cách nào? Recover ra sao? | AI **hallucinate** — trả lời tự tin nhưng nội dung không có trong tài liệu hoặc sai fact → User có thể **không biết bị sai** (failure mode nguy hiểm nhất). **Mitigation:** (1) Luôn kèm trích dẫn nguồn — nếu không tìm được trích dẫn, bắt buộc hiện cảnh báo, (2) Hiển thị nút "📄 Xem đoạn gốc" để user verify, (3) Nếu câu hỏi ngoài scope, KHÔNG trả lời chắc chắn mà chuyển sang mode "tham khảo". |
| **Correction — user sửa** | User sửa bằng cách nào? Data đó đi vào đâu? | User nhấn 👎 hoặc reply "sai rồi" → AI hỏi "Chỗ nào sai? Bạn có thể chỉ ra để mình cải thiện" → User giải thích → Data vào `qa_feedback_log(session_id, question, ai_answer, user_feedback, corrected_info)` → Dùng để: (1) Cải thiện RAG retrieval (đoạn nào nên match cho câu hỏi này), (2) Thêm vào few-shot prompt examples. |

---


> [!IMPORTANT]
> **Failure mode nguy hiểm nhất:** AI trả lời/tóm tắt **sai mà user không biết** → Học sinh học sai kiến thức → Thi sai. Đây là lý do mọi output AI đều cần kèm **trích dẫn nguồn gốc** (reference back to original document) để user có thể verify.

## Ghi chú Thiết kế Chung

| Nguyên tắc | Áp dụng |
|------------|---------|
| **Luôn kèm trích dẫn nguồn** | Mọi tóm tắt, câu trả lời, quiz đều link back đến đoạn gốc trong tài liệu |
| **Gradual reveal cho Hint** | 3 cấp độ hint: hướng suy nghĩ → thu hẹp → gần đáp án. Không bao giờ cho đáp án trực tiếp |
| **1-click feedback mọi nơi** | 👍/👎 ở cuối mỗi tóm tắt, mỗi câu quiz, mỗi hint, mỗi câu trả lời chat |
| **Phân biệt rõ "từ tài liệu" vs. "kiến thức chung"** | Badge/tag visual khác nhau cho nội dung trích từ tài liệu vs. AI tự sinh |
| **Không im lặng fail** | Khi AI không xử lý được → luôn hiện hướng dẫn cụ thể user làm gì tiếp |
