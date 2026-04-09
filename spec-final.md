# SPEC — AI Product Hackathon

**Nhóm:** Nhóm 5 - E402
**Track:** VinUni/VinSchool
**Problem statement (1 câu):** *Học sinh VinUni/VinSchool cần chuẩn bị cho bài giảng của tuần nhưng tài liệu dài và khó hiểu, hiện chủ yếu đọc lại hoặc ghi chú thủ công kém hiệu quả. Nhóm tiến hành tích hợp Agent trong hệ thống LMS thông qua pop-up để hỗ trợ học sinh học tập hiệu quả hơn. Các chức năng chính bao gồm tóm tắt tài liệu, sinh câu hỏi kiểm tra tự luận (Quiz), hệ thống Hint khi làm Quiz và Chat hỏi đáp về tài liệu. Tài liệu được giáo viên tích hợp theo từng buổi, học sinh truy cập vào các buổi học để xem tài liệu, tương tác trước và trong buổi học, ôn tập sau buổi học.*

---

## 1. AI Product Canvas - Team Debate - Trường Sơn - 2A202600313 complete

|   | Value | Trust | Feasibility |
|---|-------|-------|-------------|
| **Câu hỏi** | User nào? Pain gì? AI giải gì? | Khi AI sai thì sao? User sửa bằng cách nào? | Cost/latency bao nhiêu? Risk chính? |
| **Trả lời** | *Học sinh VinUni/VinSchool mất khoảng 1 tiếng mỗi ngày để đọc và tự kiểm tra tài liệu bài giảng dài theo cách thủ công kém hiệu quả, nên AI có thể tóm tắt nội dung theo cấu trúc rõ ràng và tạo quiz gợi ý để rút ngắn còn khoảng 15–20 phút và giúp hiểu sâu hơn.* | *Khi sai: AI có thể tạo câu hỏi không có trong bài hoặc tóm tắt nhầm ý. Sửa: Cung cấp link "Nguồn gốc" trích dẫn từ tài liệu. Cho phép user nhấn "Report/Edit" để điều chỉnh lại kiến thức đúng hoặc nhấn Like/Dislike cho phần tóm tắt, câu hỏi và hint, AI sẽ học lại từ bản sửa đó.* | *Khoảng $0.02/document, latency 5-10s cho việc xử lý file lớn. Hallucination / sai kiến thức khiến tóm tắt hoặc quiz hoặc hint lệch nội dung gốc, và thiết kế hint/quiz kém (quá dễ hoặc quá khó) có thể làm giảm hiệu quả học hoặc dẫn đến hiểu sai.* |

**Automation hay augmentation?** Augmentation
Justify: *Đây là công cụ hỗ trợ học tập (Co-pilot). Mục tiêu là giúp học sinh "tự học tốt hơn" (Self-study) chứ không phải thay thế việc đọc tài liệu. AI đóng vai trò một "gia sư" gợi mở (Socratic Method).*

**Learning signal:**

1. User correction đi vào đâu? Đi vào một lớp Cache/Fine-tuning Layer cục bộ. Nếu nhiều người cùng sửa một lỗi ở cùng một slide, hệ thống sẽ tự động cập nhật lại kiến thức chuẩn cho toàn bộ zone đó.
2. Product thu signal gì để biết tốt lên hay tệ đi?
   a. Tỉ lệ user nhấn xem "Hint" (Nếu nhấn quá nhiều → câu hỏi quá khó/tóm tắt chưa rõ).
   b. Tỉ lệ hoàn thành bộ quiz sau khi đọc tóm tắt.
   c. Độ tương đồng giữa hint và quiz.
3. Data thuộc loại nào? ☑ Domain-specific · ☑ Human-judgment
   - Domain-specific: data và tài liệu học tập đến từ giáo viên.
   - Sau khi đưa vào sử dụng có data đến từ Human-judgment qua feedback loop.

---

## 2. User Stories — 4 paths - Bùi Thế Công - 2A202600008 complete

Mỗi feature chính = 1 bảng. AI trả lời xong → chuyện gì xảy ra?

| # | Feature | Loại (Auto/Aug) | Mô tả |
|---|---------|-----------------|--------|
| 1 | **Tải lên & Xử lý tài liệu** | Automation | Giáo viên upload tài liệu → Mở buổi học -> Học sinh nhận được tài liệu -> AI trích xuất nội dung, nhận dạng cấu trúc (chương, mục, công thức…) |
| 2 | **Tóm tắt tài liệu** | Augmentation | AI tạo bản tóm tắt ngắn gọn theo nhiều cấp độ (overview, chi tiết từng phần) |
| 3 | **Sinh câu hỏi kiểm tra tự luận (Quiz)** | Augmentation | AI tự động tạo bộ câu hỏi tự luận ôn tập dựa trên nội dung tài liệu |
| 4 | **Hệ thống Hint khi làm Quiz** | Augmentation | Khi học sinh không trả lời được, AI cung cấp gợi ý nhiều cấp độ thay vì đưa đáp án ngay |
| 5 | **Chat hỏi đáp về tài liệu** | Augmentation | Học sinh hỏi bất kỳ câu gì liên quan đến tài liệu → AI trả lời dựa trên nội dung đã upload |

> Feature 1 là nền tảng (phải hoạt động tốt để các feature còn lại có ý nghĩa). Feature 2–4 là core value. Feature 5 là bổ trợ nhưng tăng stickiness.

### Feature 1: Tải lên & Xử lý tài liệu

**Trigger:** Giáo viên upload file PDF/DOCX/ảnh chụp bài giảng → AI xử lý, trích xuất nội dung → Hiển thị kết quả xử lý cho học sinh xác nhận.

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| Happy — AI đúng, tự tin | User thấy gì sau khi upload? Flow kết thúc ra sao? | File upload thành công → Giáo viên mở buổi học → Học sinh vào lớp → AI hiển thị outline dàn ý tài liệu (các chương/mục chính) + thông báo "Sẵn sàng tóm tắt & tạo quiz". Học sinh thấy đúng → nhấn "Tiếp tục" → chuyển sang tóm tắt hoặc tạo quiz. |
| Low-confidence — AI không chắc | System báo "không chắc" bằng cách nào? User quyết thế nào? | AI nhận dạng được ~70% nội dung (VD: file scan mờ, có công thức phức tạp) → Hiện cảnh báo vàng "⚠️ Một số phần có thể chưa chính xác" + highlight đoạn lỗi → Học sinh có thể chỉnh sửa text trực tiếp hoặc nhờ giáo viên re-upload file rõ hơn. |
| Failure — AI sai | User biết AI sai bằng cách nào? Recover ra sao? | File quá mờ / định dạng lạ → AI không đọc được → Hiện thông báo đỏ "Không thể xử lý file này" + gợi ý: (1) Upload ảnh rõ hơn, (2) Chuyển sang định dạng PDF, (3) Copy-paste text trực tiếp vào ô chat. Không bao giờ im lặng khi fail. |
| Correction — user sửa | User sửa bằng cách nào? Data đó đi vào đâu? | Học sinh thấy outline bị sai (VD: công thức toán bị nhận nhầm) → Click vào đoạn sai → Sửa text trực tiếp trong editor inline → Nhấn "Xác nhận" → Bản đã sửa trở thành source-of-truth cho tóm tắt & quiz. Dữ liệu correction lưu vào log để cải thiện OCR/parsing pipeline. |

### Feature 2: Tóm tắt tài liệu

**Trigger:** Học sinh nhấn "Tóm tắt" hoặc chat "tóm tắt tài liệu này cho mình" → AI phân tích nội dung → Trả về bản tóm tắt.

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| Happy — AI đúng, tự tin | User thấy gì? Flow kết thúc ra sao? | AI trả về bản tóm tắt cấu trúc: **Key Points** (3–5 ý chính dạng bullet) + **Tóm tắt chi tiết** (1–2 đoạn). Cuối tóm tắt có nút "📝 Tạo quiz từ phần này" và "🔍 Tóm tắt sâu hơn". Học sinh đọc → thấy đủ ý → tiếp tục ôn bài hoặc tạo quiz. |
| Low-confidence — AI không chắc | System báo "không chắc" bằng cách nào? User quyết thế nào? | Tài liệu có thuật ngữ chuyên ngành nặng hoặc nội dung mơ hồ → AI hiển thị tóm tắt kèm ghi chú: "💡 *Phần này mình chưa chắc lắm, bạn kiểm tra lại nhé*" + highlight đoạn uncertain bằng màu vàng + kèm trích dẫn gốc từ tài liệu để học sinh tự đối chiếu. |
| Failure — AI sai | User biết AI sai bằng cách nào? Recover ra sao? | AI tóm tắt bị bỏ sót ý quan trọng hoặc hiểu sai logic → Học sinh so sánh với tài liệu gốc → Phát hiện thiếu/sai → Nhấn 👎 hoặc "Báo lỗi" → Hiện panel so sánh tóm tắt vs. tài liệu gốc song song (split-view). Đây là failure nguy hiểm nhất vì học sinh có thể **không biết bị sai** nếu không kiểm tra. Cần chú ý theo dõi bài giảng trong lớp để nhận biết được sự khác biệt trong thông tin mà AI đưa ra.|
| Correction — user sửa | User sửa bằng cách nào? Data đó đi vào đâu? | Học sinh nhấn 👎 → Chọn loại lỗi: (1) Thiếu ý quan trọng, (2) Sai nội dung, (3) Quá dài/ngắn → Nếu chọn (1)(2): có thể nhập ghi chú "thiếu phần XYZ" hoặc sửa trực tiếp tóm tắt → AI regenerate dựa trên feedback → Correction data → feedback log (user_id, doc_id, error_type, user_note). |

### Feature 3: Sinh câu hỏi kiểm tra (Quiz Generation)

**Trigger:** Học sinh chọn phạm vi ôn tập (chương/mục/toàn bộ) + chọn độ khó (cơ bản/nâng cao) → AI sinh bộ câu hỏi tự luận.

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| Happy — AI đúng, tự tin | User thấy gì? Flow kết thúc ra sao? | AI sinh 5–10 câu hỏi tự luận, trộn đều các mức nhận biết / thông hiểu / vận dụng. User viết câu trả lời → submit → AI chấm bài tự luận (VD: "✅ Đúng 90% — bạn trả lời đầy đủ ý chính, thiếu phần giải thích về…") kèm đáp án mẫu. Cuối quiz: hiện dashboard điểm tổng + phân tích ý yếu cần ôn lại. |
| Low-confidence — AI không chắc | System báo "không chắc" bằng cách nào? User quyết thế nào? | AI gặp nội dung khó sinh câu hỏi rõ ràng (VD: tài liệu triết học, nội dung chủ quan) → Sinh câu hỏi kèm tag "⚠️ Câu hỏi này mang tính tham khảo" → Cuối quiz, hiện ghi chú: "Một số câu có thể có nhiều đáp án hợp lý. Nếu bạn thấy không phù hợp, nhấn 🚩 để báo." |
| Failure — AI sai | User biết AI sai bằng cách nào? Recover ra sao? | Hai dạng lỗi: (1) AI sinh câu hỏi có đáp án mẫu sai → User viết đúng nhưng AI chấm sai; (2) AI chấm bài tự luận không chính xác. User nhấn 🚩 "Chấm sai" → Hệ thống hiện đáp án mẫu + trích dẫn tài liệu gốc để user tự đối chiếu. **Rủi ro lớn:** Học sinh tin điểm AI chấm → nghĩ mình đã hiểu đủ nhưng thực ra chưa. Cần hỏi lại giáo viên trong giờ học để chắc chắn mình nắm kiến thức|
| Correction — user sửa | User sửa bằng cách nào? Data đó đi vào đâu? | User nhấn 🚩 → Chọn: (1) Đáp án mẫu sai, (2) Chấm điểm không chính xác, (3) Câu hỏi khó hiểu, (4) Không liên quan đến tài liệu → Data vào `quiz_correction_log` → Nếu ≥3 user báo cùng lỗi → Auto-flag câu hỏi → Admin review hoặc AI auto-regenerate. |

### Feature 4: Hệ thống Hint khi làm Quiz

**Trigger:** Học sinh đang làm quiz tự luận → Không biết cách trả lời → Nhấn nút "💡 Gợi ý" → AI cung cấp hint theo cấp độ tăng dần.

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| Happy — AI đúng, tự tin | User thấy gì? Flow kết thúc ra sao? | Học sinh nhấn "💡 Gợi ý" → **Hint cấp 1:** Gợi ý hướng suy nghĩ → **Hint cấp 2:** Thu hẹp phạm vi → **Hint cấp 3:** Gần như đáp án. Mỗi lần nhấn hint, điểm câu đó giảm nhẹ (10 → 8 → 5 → 3). Học sinh thấy hint hữu ích → nhớ ra → trả lời đúng. |
| Low-confidence — AI không chắc | System báo "không chắc" bằng cách nào? User quyết thế nào? | Nội dung câu hỏi quá chuyên sâu → Thay vì hint truyền thống, AI hiển thị: "📖 Tham khảo lại đoạn này trong tài liệu" + trích dẫn đoạn văn gốc liên quan (RAG reference). Học sinh tự đọc và suy luận. |
| Failure — AI sai | User biết AI sai bằng cách nào? Recover ra sao? | AI cho hint dẫn sai hướng → Học sinh theo hint → Trả lời sai → Xem đáp án → Phát hiện hint không liên quan. **Recover:** Ở màn xem lại đáp án, hiện nút "Hint có hữu ích không?" (👍/👎). Nếu 👎 → Log + regenerate hint cho lần sau. |
| Correction — user sửa | User sửa bằng cách nào? Data đó đi vào đâu? | Sau mỗi câu quiz, Học sinh thấy phần "Hint bạn đã dùng" → Đánh giá 👍/👎 cho từng hint → Nếu 👎: ghi chú "hint sai chỗ nào" → Data vào `hint_feedback_log(question_id, hint_level, rating, user_note)`. |

### Feature 5: Chat hỏi đáp về tài liệu (RAG-based Q&A)

**Trigger:** Học sinh đang đọc tóm tắt hoặc làm quiz → Thắc mắc → Gõ câu hỏi vào chat → AI trả lời dựa trên nội dung tài liệu đã upload.

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| Happy — AI đúng, tự tin | User thấy gì? Flow kết thúc ra sao? | AI trả lời rõ ràng, có cấu trúc + kèm trích dẫn nguồn từ tài liệu (VD: "Theo slide 15, chương 3…"). Cuối câu trả lời có: (1) "Bạn hiểu chưa?" (👍/👎), (2) "Hỏi thêm" để drill-down. |
| Low-confidence — AI không chắc | System báo "không chắc" bằng cách nào? User quyết thế nào? | Câu hỏi nằm ngoài phạm vi tài liệu → AI trả lời: "📚 *Tài liệu của bạn không đề cập trực tiếp đến vấn đề này. Đây là hiểu biết chung của mình, bạn nên kiểm tra thêm:*" + câu trả lời + gợi ý từ khóa. Rõ ràng phân biệt "từ tài liệu" vs. "kiến thức chung". |
| Failure — AI sai | User biết AI sai bằng cách nào? Recover ra sao? | AI hallucinate — trả lời tự tin nhưng nội dung không có trong tài liệu hoặc sai fact → Học sinh có thể không biết bị sai. **Mitigation:** (1) Luôn kèm trích dẫn nguồn, (2) Hiển thị nút "📄 Xem đoạn gốc" để học sinh verify, (3) Nếu câu hỏi ngoài scope, chuyển sang mode "tham khảo". |
| Correction — user sửa | User sửa bằng cách nào? Data đó đi vào đâu? | Học sinh nhấn 👎 → AI hỏi "Chỗ nào sai?" → Học sinh giải thích → Data vào `qa_feedback_log(session_id, question, ai_answer, user_feedback, corrected_info)` → Cải thiện RAG retrieval + thêm vào few-shot prompt examples. |

---

## 3. Eval metrics + threshold - Nông Trung Kiên - 2A202600414 complete

**Optimize precision hay recall?** ☑ Precision
Tại sao? Trong ngữ cảnh học tập, một câu trả lời/tóm tắt sai còn nguy hiểm hơn là không trả lời — học sinh có thể học sai kiến thức và thi sai.
Nếu sai ngược lại thì chuyện gì xảy ra? Nếu chọn precision nhưng low recall → user không tìm thấy câu trả lời cần → hỏi lại nhiều lần → bỏ dùng.

| Metric | Threshold | Red flag (dừng khi) |
|--------|-----------|---------------------|
| **Grounded Answer Rate (GAR)** — % câu trả lời đúng theo tài liệu + có trích nguồn hợp lệ | ≥85% trên bộ test chuẩn | <75% trong 2 vòng đo liên tiếp hoặc bất kỳ lỗi nghiêm trọng lặp lại |
| **Task Success @1-turn (TSR)** — % phiên user giải quyết được ngay lượt đầu | ≥70% | <55% hoặc tỷ lệ hỏi lại cùng chủ đề tăng >20% tuần/tuần |
| **P95 Response Time** — 95% thời gian phản hồi end-to-end | ≤3.0 giây | >4.5 giây kéo dài >1 ngày hoặc >5% request timeout |

**Guardrail metrics (bổ sung):**

| Metric guardrail | Ngưỡng cảnh báo |
|-----------------|-----------------|
| Correction Rate (% câu trả lời bị user bấm "Sai/Needs fix") | >20% trong 3 ngày liên tiếp |
| No-citation Rate (% câu trả lời không có nguồn) | >10% theo ngày |
| Cost per answered query | >$0.02/query theo tuần |

**Launch gate:** Chỉ rollout rộng khi GAR đạt threshold 2 vòng đo liên tiếp, TSR đạt threshold ít nhất 1 tuần pilot, P95 latency ổn định dưới 3s trong giờ cao điểm, và không chạm red flag Trust trong tuần gần nhất.

---

## 4. Top 3 failure modes - Đăng Nghĩa - 2A202600437 complete

*Liệt kê cách product có thể fail — không phải list features.*
*"Failure mode nào user KHÔNG BIẾT bị sai? Đó là cái nguy hiểm nhất."*

| # | Trigger | Hậu quả | Mitigation |
|---|---------|---------|------------|
| 1 | AI tóm tắt kiến thức sai / chọn sai đáp án | Học sinh học sai kiến thức, mất trust rất nhanh | Rule-based validation, answer checker, có nút like, dislike, report lỗi |
| 2 | AI Prompt không ràng buộc grade level, difficulty mapping kém | AI tạo câu hỏi quá dễ hoặc quá khó so với trình độ học sinh | Giới hạn theo lớp / môn / chapter / độ khó, template theo curriculum |
| 3 | AI cho đáp án quá nhanh thay vì để học sinh tự suy nghĩ | Không phát triển tư duy, outcome học tập giảm | Gợi ý từng bước, hint first → answer later, khuyến khích tự làm trước |

---

## 5. ROI 3 kịch bản - Bùi Lâm Tiến - 2A202600004 complete

*Giả sử có khoảng 900 học sinh tại VinUni/VinSchool*

|   | Conservative | Realistic | Optimistic |
|---|-------------|-----------|------------|
| **Assumption** | 180 users/ngày (20%) · 3 docs/ngày | 540 users/ngày (60%) · 4 docs/ngày | 810 users/ngày (90%) · 5 docs/ngày |
| **Tổng cost/tháng** | **$159** | **$354** | **$576** |
| **Subscription** | $1/HS → $900/tháng | $2/HS → $1,800/tháng | $4/HS → $3,600/tháng |
| **Net/tháng** | **+$741** (margin 82%) | **+$1,446** (margin 80%) | **+$3,024** (margin 84%) |

**Kill criteria:** cost > revenue liên tục 2 tháng · hint rate > 80% · quiz completion < 40%

**Notes:**
- **Cost:** Bao gồm chi phí inference LLM và hạ tầng cho RAG system (server, vector DB, monitoring and logging, storage).
- **Subscription $1/$2/$4:** Conservative $1/HS định vị như add-on rẻ để trường dễ approve ngân sách. Realistic $2/HS tương đương 1 ly trà sữa/tháng — dễ bán cho phụ huynh. Optimistic $4/HS vẫn thấp hơn 1h gia sư, trong khi margin đạt 84%.

---

## 6. Mini AI spec (1 trang) - Trần Ngọc Huy - 2A202600298 complete

**Product giải gì, cho ai**

AI Tutor là công cụ tự học dành cho học sinh VinUni/VinSchool. Vấn đề cốt lõi: học sinh mất quá nhiều thời gian đọc hiểu tài liệu dài mà vẫn không chắc mình hiểu đúng hay chưa. Sản phẩm giải quyết hai điểm đau song song — tóm tắt tài liệu theo cấu trúc để đọc nhanh hơn, và tạo quiz kèm hint để tự kiểm tra mức độ hiểu mà không cần giáo viên.

**AI làm gì — Augmentation, không phải Automation**

AI đóng vai trò gia sư gợi mở (Socratic), không thay thế việc học. Mọi output — tóm tắt, câu hỏi, hint, câu trả lời chat — đều hiển thị kèm trích dẫn nguồn gốc từ tài liệu để học sinh tự đối chiếu và quyết định có tin hay không. Học sinh luôn là người ra quyết định cuối cùng; AI chỉ cung cấp gợi ý và giảm công đọc.

**Ưu tiên Precision hơn Recall**

Trong ngữ cảnh học tập, một câu trả lời sai tự tin còn nguy hiểm hơn không trả lời — học sinh có thể ghi nhớ và thi theo kiến thức sai. Vì vậy, hệ thống ưu tiên độ chính xác: khi không đủ chắc, AI phải nói rõ "chưa chắc" và trỏ về tài liệu gốc thay vì đoán. Ngưỡng cứng: Grounded Answer Rate ≥ 85%; nếu xuống dưới 75% hai vòng liên tiếp thì tắt auto-answer và chuyển sang fallback.

**Risk chính**

Risk lớn nhất không phải là AI sai — mà là AI sai mà học sinh không biết. Khi tóm tắt hoặc đáp án mẫu bị lệch nội dung gốc mà không có cảnh báo, học sinh học theo và và hiểu sai kiến thức. Để chặn risk này, mọi output bắt buộc kèm trích dẫn có thể truy vết; nếu không tìm được trích dẫn thì hiện cảnh báo thay vì im lặng trả lời. Học sinh khi học trên lớp nghe giảng từ thầy cô có thể nắm bắt được kiến thức chính xác, sau đó dựa vào trích dẫn để feedback lại cho AI. Risk thứ hai là AI tạo hint/quiz quá dễ hoặc quá khó do không ràng buộc grade level — mitigation là template theo curriculum và giới hạn theo lớp/môn/chương.

**Data flywheel**

Mỗi lần học sinh nhấn 👍/👎, nhấn "Report/Edit", hoặc đánh giá hint, dữ liệu đó đi vào correction store. Khi nhiều học sinh báo cùng một lỗi trên cùng một đoạn tài liệu, hệ thống tự động cập nhật retrieval cache cho toàn zone đó. Theo thời gian, ba chỉ số learning signal — Hint Request Rate, Quiz Completion Rate, và Quiz-Outcome Alignment — sẽ phản ánh liệu chất lượng có thực sự cải thiện hay không. Flywheel chỉ có ý nghĩa nếu nó kéo được GAR tăng và TSR giữ ổn định sau mỗi lần cập nhật.
