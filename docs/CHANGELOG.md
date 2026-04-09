# Changelog

## v2.0.0 - Tích hợp LMS (2026-04-09)

### Thay đổi lớn: Chuyển từ Notebook sang Course/Session

Ứng dụng đã được tái cấu trúc từ mô hình "học sinh tự upload tài liệu" sang mô hình LMS tích hợp.

### Thêm mới

**Backend:**
- Model `Course` (lớp học) với `join_code` và `teacher_pin`
- Model `Session` (buổi học) với `is_open` toggle
- Model `Student` và `Enrollment` (quản lý tham gia lớp)
- Router `/api/teacher/*` - CRUD lớp, buổi, upload tài liệu, mở/đóng buổi
- Router `/api/student/*` - join lớp, xem buổi đã mở, xem tài liệu
- Thêm `student_id` vào Chat, Summary, Quiz để lưu lịch sử riêng mỗi học sinh
- API `rejoin` cho học sinh quay lại lớp

**Frontend:**
- Trang chủ với 2 lựa chọn: Giáo viên / Học sinh
- Trang giáo viên: tạo lớp, đăng nhập lớp, dashboard quản lý buổi + tài liệu
- Trang học sinh: join lớp, danh sách buổi đã mở, giao diện học 3 cột
- Store `useTeacher.ts` cho teacher dashboard
- Store `useSession.ts` thay thế `useNotebook.ts` cho student session

### Xóa bỏ

- Model `Notebook` (thay bằng Course + Session)
- Router `/api/notebooks/*`
- Router `/api/documents/upload` cho học sinh (chuyển sang teacher-only)
- Upload functionality trong SourcePanel (giờ chỉ hiển thị tài liệu read-only)

### Thay đổi

- `Document.notebook_id` → `Document.session_id`
- `ChatMessage.notebook_id` → `ChatMessage.session_id` + thêm `student_id`
- `Summary.notebook_id` → `Summary.session_id` + thêm `student_id`
- `Quiz.notebook_id` → `Quiz.session_id` + thêm `student_id`
- ChromaDB collection naming: `notebook_{id}` → `session_{id}`
- Tất cả API request/response cập nhật tương ứng

### Lưu ý khi nâng cấp

- **Database cần được tạo lại** vì schema thay đổi hoàn toàn
- Xóa file `data/aitutor.db` cũ trước khi chạy
- Xóa thư mục `data/chroma/` cũ nếu có dữ liệu cũ

---

## v1.0.0 - Phiên bản gốc

- Học sinh tự tạo notebook và upload tài liệu
- Tóm tắt, quiz, chat hỏi đáp với AI
- Layout 3 cột kiểu NotebookLM
