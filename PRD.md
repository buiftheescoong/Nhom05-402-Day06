# PRD — AI Learning Co-pilot (VinUni/VinSchool)

## 1. Product overview

**Tên sản phẩm:** AI Learning Co-pilot  
**Mục tiêu:** Giúp học sinh/sinh viên tự học hiệu quả hơn từ tài liệu dài bằng cách tóm tắt có cấu trúc, tạo quiz tự luận, và gợi ý nhiều cấp độ thay vì đưa đáp án ngay.

**Problem statement:** Người học mất nhiều thời gian đọc tài liệu và khó tự đánh giá đã hiểu bài hay chưa.

---

## 2. Users & JTBD

- **Primary users:** Học sinh VinSchool, sinh viên VinUni đang ôn thi.
- **JTBD chính:** "Khi tôi có tài liệu dài để ôn thi, tôi muốn hiểu nhanh ý chính và tự kiểm tra mức độ hiểu, để học hiệu quả hơn trong thời gian ngắn."

---

## 2.1 Kiến trúc giao diện và luồng LMS

Trợ lý AI hoạt động **nhúng trong trang học tập (LMS)**, không phải màn hình độc lập chỉ để upload.

- **Thanh điều hướng trái theo buổi/ngày:** Tab **Day 01, Day 02, Day 03, … Day N**. Mỗi Day là một nhóm nguồn tài liệu của buổi đó.
- **Tài liệu trong Day:** Mỗi Day chứa danh sách mục (slide bài giảng, PDF tham khảo, ảnh PNG, …). Người học **chọn một tài liệu** để xem ở **vùng nội dung chính** (viewer PDF/slide/ảnh).
- **Trợ lý AI (chatbot):** Nút **floating góc dưới bên phải**; mặc định **đóng**. Khi bấm mới mở **hộp chat (popup/panel)**. Ngữ cảnh AI gắn với **Day đang chọn** và **tài liệu đang mở** (grounding/RAG).
- **Giả định hackathon:** Danh sách Day và tài liệu có thể **seed sẵn** hoặc thêm qua luồng tối giản (không bắt buộc full CMS); ví dụ **Day 01:** 1 slide bài giảng + 1 PDF tài liệu tham khảo.

---

## 3. MVP scope

## In scope (MVP)

- **Vỏ LMS:** Điều hướng theo Day, danh sách tài liệu theo Day, viewer tài liệu trên vùng chính
- **Widget chat:** Nút góc phải dưới + popup chat; chat **ngữ cảnh** theo tài liệu/Day đang xem (không phải chat rời toàn hệ thống)
- **Xử lý nội dung:** Parse/embed tài liệu đã gắn với Day (`PDF`, `DOCX`, slide/ảnh theo khả năng MVP)
- Tóm tắt tài liệu theo cấu trúc rõ ràng
- Sinh quiz tự luận theo nội dung tài liệu
- Hint 3 cấp độ khi làm quiz
- Trích dẫn nguồn cho output AI
- Feedback/correction cơ bản (`Report/Edit`, like/dislike)

## Out of scope (giai đoạn hackathon)

- Chat Q&A **tự do toàn hệ thống** không gắn tài liệu (khác với popup chat ngữ cảnh trong MVP)
- Fine-tuning model quy mô lớn
- OCR nâng cao cho ảnh mờ/phức tạp
- Template curriculum theo từng khối/lớp đầy đủ
- CMS đầy đủ cho giáo viên quản lý Day/tài liệu (chỉ cần seed hoặc thêm tối giản)

---

## 4. Value proposition

- Rút ngắn thời gian ôn tài liệu dài từ cách học thủ công sang flow hỗ trợ bởi AI.
- Tăng chất lượng tự học bằng phương pháp gợi mở (Socratic), không lộ đáp án quá sớm.
- Giảm rủi ro học sai nhờ bắt buộc trích dẫn nguồn.

---

## 5. User stories (MVP)

1. **Chọn Day và xem tài liệu**
   - Là học sinh, tôi muốn chọn **Day** (ví dụ Day 01) và chọn **một tài liệu** trong danh sách để xem slide/PDF/ảnh ở màn hình chính.
2. **Mở trợ lý AI**
   - Là học sinh, tôi muốn bấm nút góc dưới phải để **mở hộp chat** và hỏi/học dựa trên **tài liệu đang mở** và **Day hiện tại**.
3. **Tóm tắt**
   - Là học sinh, tôi muốn nhận tóm tắt ngắn gọn + key points để hiểu nhanh nội dung chính.
4. **Quiz**
   - Là học sinh, tôi muốn hệ thống tạo câu hỏi tự luận từ tài liệu đang xem để tự kiểm tra kiến thức.
5. **Hint**
   - Là học sinh, tôi muốn nhận gợi ý theo cấp độ khi bí ý để tự suy nghĩ trước khi xem đáp án.
6. **Feedback**
   - Là học sinh, tôi muốn báo nội dung AI sai và chỉnh sửa để kết quả tốt hơn ở lần sau.

---

## 6. Functional requirements (product-level)

- `FR0` Hiển thị điều hướng Day, danh sách tài liệu theo Day, và viewer khi người dùng chọn tài liệu.
- `FR0b` Widget chat floating (đóng/mở popup); ngữ cảnh chat gắn với `day_id` + `document_id` đang xem.
- `FR1` Parse/embed nội dung tài liệu đã gắn với Day (upload độc lập không còn là luồng chính; có thể seed hoặc API tối giản).
- `FR2` Sinh tóm tắt có cấu trúc (key points + summary body).
- `FR3` Sinh quiz 5-10 câu theo phạm vi tài liệu.
- `FR4` Chấm câu trả lời tự luận và đưa nhận xét.
- `FR5` Cung cấp hint 3 cấp (gợi mở -> thu hẹp -> gần đáp án).
- `FR6` Mọi câu trả lời quan trọng phải có trích dẫn nguồn.
- `FR7` Cho phép user gửi correction (`Report/Edit`, thumbs).
- `FR8` Khi AI không chắc chắn phải fallback an toàn, không trả lời bịa.

---

## 7. Success metrics & launch gates

## Core metrics

- **GAR (Grounded Answer Rate):** >= 85%
- **TSR (Task Success @1-turn):** >= 70%
- **P95 latency:** <= 3.0s cho luồng trả lời ngắn

## Guardrails

- Correction rate <= 20% (theo ngày, rolling)
- No-citation rate <= 10%
- Cost per answered query <= $0.02

## Launch gate

- GAR đạt ngưỡng trong 2 vòng đo liên tiếp
- TSR đạt ngưỡng ít nhất 1 tuần pilot
- Không chạm red flag trust trong tuần gần nhất

---

## 8. Risks & mitigations

1. **Hallucination / sai kiến thức**
   - Mitigation: grounding bắt buộc, source citation, fallback khi similarity thấp.
2. **Quiz/hint lệch độ khó**
   - Mitigation: ràng buộc theo grade/chapter, theo dõi hint rate để tune.
3. **User tin kết quả sai mà không biết**
   - Mitigation: "Xem đoạn gốc", report 1-click, hiển thị độ chắc chắn.
4. **Rủi ro dữ liệu nội bộ**
   - Mitigation: bảo mật server, phân quyền truy cập, logging tối thiểu.

---

## 9. Rollout plan (hackathon)

- **Ngày 1-2:** Foundation (infra, parser, prompt baseline, **shell LMS: Day + viewer + popup chat**, seed Day 01: slide + PDF)
- **Ngày 3-4:** Integration (API + UI flow summarize/quiz/hint trong ngữ cảnh tài liệu đang mở)
- **Ngày 5-6:** Polish + eval + demo rehearsal

**Definition of Done (MVP):**

- Demo chạy end-to-end: **chọn Day → chọn tài liệu → viewer → (mở popup chat)** → tóm tắt/quiz/hint với ít nhất một Day có tài liệu thật (ví dụ Day 01: slide + PDF)
- Có output tóm tắt, quiz, hint + citation
- Có report lỗi và fallback khi không chắc chắn
