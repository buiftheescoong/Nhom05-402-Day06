# PRD — AI Learning Co-pilot (AI Tutor - Nền tảng học tập thông minh)

## 1. Product overview

**Tên sản phẩm:** AI Tutor (AI Learning Co-pilot)
**Mục tiêu:** Nền tảng học tập kết nối Giáo viên và Học sinh. Giúp giáo viên dễ dàng khởi tạo lớp học/buổi học và phân phối tài liệu; giúp học sinh tự học hiệu quả qua hệ thống tóm tắt tài liệu, tạo bài tập tự luận (quiz), và gợi ý (hint) thông minh.

**Problem statement:** Học sinh khó khăn khi đối mặt với lượng tài liệu dài và cần một môi trường khép kín (theo chuyên đề lớp học) có hệ thống đặt câu hỏi và chấm điểm chuẩn mực. Giáo viên cần một hệ thống đơn giản để cung cấp tài liệu cho học sinh không bị phân tán.

---

## 2. Users & JTBD

- **Giáo viên (Teacher / Admin):**
  - **JTBD chính:** "Tôi muốn một nơi dễ dàng tạo lớp, cung cấp mã PIN, giao tài liệu theo từng buổi (notebooks) để định hướng nguồn học bám sát chương trình, đồng thời kiểm soát việc mở/đóng các buổi học."
- **Học sinh (Student / Primary User):**
  - **JTBD chính:** "Tôi muốn tham gia lớp học ngay bằng mã Code dễ nhớ, có thể chọn buổi học và dùng AI để tóm tắt nhanh, tạo bài kiểm tra thử, và giải thích chi tiết những chỗ tôi không hiểu dựa trên đúng tài liệu giáo viên đã giao."

---

## 3. Kiến trúc giao diện và luồng LMS

Sản phẩm cung cấp hai cổng trải nghiệm chính biệt lập để tối ưu workflows:

### Giáo viên (Teacher Portal)
- **Tạo/Quản lý Lớp (Class):** Cấp mã Code tham gia, thiết lập mã PIN giới hạn quyền Admin.
- **Tạo/Quản lý Buổi học (Notebook):** Tạo các buổi học theo lộ trình (VD: Buổi 1, Buổi 2).
- **Quản lý Tài liệu:** Nhúng/Upload tài liệu (PDF, Word) vào thẳng từng Buổi.
- **Đóng/Mở trạng thái học:** Chỉ khi giáo viên "mở" buổi học, học sinh mới thấy tài liệu và công cụ AI của buổi đó.

### Học sinh (Student Portal)
- **Join Session:** Màn hình nhập Tên và Class Code đê join trực tiếp mà không cần account.
- **List Notebooks:** Khi vào lớp, bên trái (navigation) hiện danh sách các buổi học đang "Mở".
- **Chat/Tài liệu tương tác:** Khu vực xem tài liệu kết hợp hộp thoại Chat AI & Quiz/Summary. Mọi tương tác của học viên đều giới hạn trong bối cảnh (context) file tài liệu thuộc buổi học cụ thể (RAG Grounding).

---

## 4. MVP scope

### In scope (MVP)
- **Hệ thống Quản lý cơ bản:**
  - Giáo viên: Tạo lớp/PIN, Upload tài liệu PDF/DOCX, Đóng/mở bài giảng.
  - Học sinh: Join bằng mã, xem tài liệu, chuyển đổi giữa các bài giảng.
- **Tính năng AI cho Học sinh:**
  - Sinh Tóm tắt (Summary) có cấu trúc từ tài liệu.
  - Chức năng Quiz tự luận + Hint 3 cấp độ.
  - Chat Hỏi đáp Q&A (RAG) chỉ dựa vào nội dung buổi học.
- **Hệ thống Feedback:** Gửi đánh giá/chỉnh sửa report trực tiếp với model output (Like/Dislike).

### Out of scope (giai đoạn MVP Hackathon)
- Phân quyền user quản trị phức tạp (RBAC) nhiều trường học / SSO Login.
- Tracking chi tiết analytics tiến độ từng học viên cho giáo viên.
- Multimedia parsing / OCR nâng cao (Video, Ảnh mờ).
- Thanh toán / Subscriptions.

---

## 5. User stories (MVP)

### Cho Giáo viên
1. **Tạo lớp:** Là giáo viên, tôi muốn tạo nhanh một không gian lớp và có Mã Lớp để gửi cho sinh viên.
2. **Tạo lộ trình:** Là giáo viên, tôi muốn tạo từng "Buổi học" (Notebooks) và tải file học liệu lên đó.
3. **Phân phối:** Là giáo viên, tôi muốn có nút gạt bật/tắt để chỉ định học sinh có được phép truy cập xem bài hay chưa.

### Cho Học sinh
4. **Tham gia:** Là học sinh, tôi muốn nhập Code + Tên để vào thẳng lớp mà không cần email hay đăng ký tài khoản rườm rà.
5. **Chọn Buổi và xem tài liệu:** Là học sinh, tôi muốn chọn buổi học (ví dụ Buổi 01) đang học để màn hình hiển thị ngay các tài liệu liên quan.
6. **Mở trợ lý AI:** Là học sinh, tôi muốn dùng công cụ trợ lý để Tóm tắt những ý chính mục tiêu, giúp đọc lướt nhanh các khai niệm trọng tâm.
7. **Tự luyện (Quiz & Hint):** Là học sinh, tôi muốn AI tự động mix câu hỏi tự luận. Khi gặp bài khó, tôi dùng nút "Hint L1-L2-L3" để nhận nhắc nhở gợi mở tư duy thay vì xem đáp án liền.
8. **Feedback:** Là học sinh, nếu AI trả lời sai kiến thức tài liệu, tôi có thể bấm Report để hệ thống lưu log.

---

## 6. Functional requirements (product-level)

- `FR_T1` Teacher portal cho phép tạo lớp ẩn dưới PIN code mật.
- `FR_T2` Teacher có thể khởi tạo Notebook định kỳ, tải tài liệu định dạng .pdf/.docx lên hệ thống RAG pipeline.
- `FR_S1` Student portal xác thực bằng Code lớp, tự động điều hướng sang dashboard có sidebar duyệt các active notebooks.
- `FR_AI1` Chunk/Vectorize các tài liệu mới upload thành embedding (Lưu tại ChromaDB).
- `FR_AI2` Lệnh "Tóm tắt" trích xuất ý chính dạng bullet-points + citation vị trí văn bản.
- `FR_AI3` LLM tự phân tích scope văn bản và sinh 5-10 câu hỏi dạng tự luận có chức năng tự động grading & nhận xét.
- `FR_AI4` Cung cấp luồng hint từng bước L1 -> L3 không spoil đáp án cuối.
- `FR_AI5` Mọi câu trả lời chat RAG phải Grounded và có Citation (chỉ tới document nội bộ). Nếu ngoài miền tài liệu, fallback thông báo rõ ràng.

---

## 7. Success metrics & Launch gates (MVP Goals)

### Core metrics
- **GAR (Grounded Answer Rate):** >= 85%
- **TSR (Task Success @1-turn):** >= 70%
- **P95 latency:** <= 3.0-5.0s cho luồng trả lời ngắn text-chat RAG.
- **Tỉ lệ sinh câu hỏi hợp lệ:** >= 90%.

### Launch gate
- Mọi flow phải chạy xuyên suốt: Giáo viên tạo lớp (sinh mã code) -> Học sinh nhập mã code truy cập đúng resource -> Chức năng Chat RAG / Summary phân tích đúng content đã upload mà không sập.

---

## 8. Risks & mitigations

1. **Hallucination / Trả lời ảo kiến thức ngoài LMS:**
   - Mitigation: RAG strict prompt instruction, giới hạn Similarity search threshold, fallback template tĩnh nếu không có matching chunk.
2. **Cost API LLM bùng nổ khi scale dữ liệu nhiều batch:**
   - Mitigation: Setup file `config` định tuyến các task đơn giản sang mô hình open/vi mô hình rẻ tiền hơn (như Gemini 1.5-flash).
3. **Xung đột phiên truy cập khi code đơn giản:**
   - Mitigation: Hạn chế data lọt ngoài nhóm bằng cách bảo vệ bằng ID phiên của frontend/Zustand store.

---

## 9. Definition of Done (Hackathon Run)

- Demo E2E chạy trên Docker/Render/Railway... (cả BE/FE).
- Split hai luồng rõ ràng Giáo - Trò.
- Đầy đủ tính năng phân tích RAG (Hint, Quiz, Summary). Cảnh báo minh bạch trên UI khi file quá lớn.
