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

## 3. MVP scope

## In scope (MVP)

- Upload và xử lý tài liệu (`PDF`, `DOCX`)
- Tóm tắt tài liệu theo cấu trúc rõ ràng
- Sinh quiz tự luận theo nội dung tài liệu
- Hint 3 cấp độ khi làm quiz
- Trích dẫn nguồn cho output AI
- Feedback/correction cơ bản (`Report/Edit`, like/dislike)

## Out of scope (giai đoạn hackathon)

- Chat Q&A tự do (F5)
- Fine-tuning model quy mô lớn
- OCR nâng cao cho ảnh mờ/phức tạp
- Template curriculum theo từng khối/lớp đầy đủ

---

## 4. Value proposition

- Rút ngắn thời gian ôn tài liệu dài từ cách học thủ công sang flow hỗ trợ bởi AI.
- Tăng chất lượng tự học bằng phương pháp gợi mở (Socratic), không lộ đáp án quá sớm.
- Giảm rủi ro học sai nhờ bắt buộc trích dẫn nguồn.

---

## 5. User stories (MVP)

1. **Upload tài liệu**
   - Là học sinh, tôi muốn tải tài liệu lên và biết hệ thống xử lý thành công hay không để bắt đầu ôn tập.
2. **Tóm tắt**
   - Là học sinh, tôi muốn nhận tóm tắt ngắn gọn + key points để hiểu nhanh nội dung chính.
3. **Quiz**
   - Là học sinh, tôi muốn hệ thống tạo câu hỏi tự luận từ tài liệu để tự kiểm tra kiến thức.
4. **Hint**
   - Là học sinh, tôi muốn nhận gợi ý theo cấp độ khi bí ý để tự suy nghĩ trước khi xem đáp án.
5. **Feedback**
   - Là học sinh, tôi muốn báo nội dung AI sai và chỉnh sửa để kết quả tốt hơn ở lần sau.

---

## 6. Functional requirements (product-level)

- `FR1` Upload file và parse nội dung tài liệu.
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

- **Ngày 1-2:** Foundation (infra, parser, prompt baseline, upload UI)
- **Ngày 3-4:** Integration (API + UI flow summarize/quiz/hint)
- **Ngày 5-6:** Polish + eval + demo rehearsal

**Definition of Done (MVP):**
- Demo chạy end-to-end với ít nhất 1 bộ tài liệu thật
- Có output tóm tắt, quiz, hint + citation
- Có report lỗi và fallback khi không chắc chắn
