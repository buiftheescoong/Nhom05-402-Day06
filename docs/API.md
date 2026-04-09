# API Reference - AI Tutor LMS

Base URL: `http://localhost:8000`

## Teacher APIs (`/api/teacher`)

### Tạo lớp học
```
POST /api/teacher/courses
Body: { "name": "Toán 10A1" }
Response: { id, name, join_code, teacher_pin, created_at, updated_at, session_count, student_count }
```
> Trả về `join_code` (chia sẻ cho học sinh) và `teacher_pin` (giữ bí mật).

### Đăng nhập lớp (giáo viên)
```
POST /api/teacher/courses/auth
Body: { "join_code": "ABC123", "teacher_pin": "456789" }
Response: CourseTeacherResponse (bao gồm teacher_pin)
```

### Lấy thông tin lớp
```
GET /api/teacher/courses/{course_id}
Response: CourseTeacherResponse
```

### Cập nhật tên lớp
```
PUT /api/teacher/courses/{course_id}
Body: { "name": "Tên mới" }
```

### Xóa lớp
```
DELETE /api/teacher/courses/{course_id}
```

### Danh sách buổi học
```
GET /api/teacher/courses/{course_id}/sessions
Response: SessionResponse[]
```

### Tạo buổi học
```
POST /api/teacher/courses/{course_id}/sessions
Body: { "title": "Buổi 1 - Giới thiệu", "description": "" }
Response: SessionResponse
```

### Cập nhật buổi học
```
PUT /api/teacher/sessions/{session_id}
Body: { "title": "...", "description": "...", "order": 0 }
```

### Mở/Đóng buổi học
```
PUT /api/teacher/sessions/{session_id}/toggle
Response: { "ok": true, "is_open": true/false }
```
> Toggle trạng thái. Khi `is_open=true`, học sinh mới thấy buổi này.

### Xóa buổi học
```
DELETE /api/teacher/sessions/{session_id}
```

### Upload tài liệu cho buổi
```
POST /api/teacher/sessions/{session_id}/documents/upload
Content-Type: multipart/form-data
Body: file (PDF, DOCX, TXT, DOC)
Response: DocumentResponse
```

### Danh sách tài liệu của buổi
```
GET /api/teacher/sessions/{session_id}/documents
Response: DocumentResponse[]
```

### Xóa tài liệu
```
DELETE /api/teacher/documents/{doc_id}
```

---

## Student APIs (`/api/student`)

### Tham gia lớp (lần đầu)
```
POST /api/student/join
Body: { "join_code": "ABC123", "name": "Nguyễn Văn A" }
Response: { student_id, student_name, course_id, course_name, joined_at }
```
> Tạo student mới + enrollment. Lưu `student_id` ở frontend (localStorage).

### Vào lại lớp (đã join trước đó)
```
POST /api/student/rejoin
Body: { "join_code": "ABC123", "name": "Nguyễn Văn A" }
Response: EnrollmentResponse
```
> Tìm student theo tên trong lớp này. Dùng khi học sinh quay lại.

### Lấy thông tin học sinh
```
GET /api/student/{student_id}
Response: { id, name, created_at }
```

### Danh sách lớp đã tham gia
```
GET /api/student/{student_id}/courses
Response: CourseResponse[]
```

### Danh sách buổi đã mở (trong lớp)
```
GET /api/student/{student_id}/courses/{course_id}/sessions
Response: SessionResponse[] (chỉ các buổi có is_open=true)
```
> Kiểm tra enrollment trước. Nếu chưa join → 403.

### Tài liệu của buổi
```
GET /api/student/sessions/{session_id}/documents
Response: DocumentResponse[] (chỉ khi buổi đã mở)
```

---

## AI Feature APIs

### Chat hỏi đáp (`/api/chat`)
```
POST /api/chat
Body: { "session_id": "...", "student_id": "...", "message": "..." }
Response: { id, role, content, sources, created_at }

GET /api/chat/history/{session_id}?student_id=...
Response: ChatResponse[]
```

### Tóm tắt (`/api/summary`)
```
POST /api/summary/generate
Body: { "session_id": "...", "student_id": "...", "document_id": null, "scope": "full" }
Response: { id, content, key_points, confidence, scope, created_at }
```

### Quiz (`/api/quiz`)
```
POST /api/quiz/generate
Body: { "session_id": "...", "student_id": "...", "difficulty": "medium", "count": 5 }
Response: { id, scope, difficulty, questions: [...], created_at }

POST /api/quiz/evaluate
Body: { "question_id": "...", "user_answer": "...", "student_id": "..." }
Response: { score, feedback, model_answer, hints_used }

POST /api/quiz/hint
Body: { "question_id": "...", "current_level": 0 }
Response: { hint, level, max_level, score_penalty }
```

### Feedback (`/api/feedback`)
```
POST /api/feedback
Body: { "target_type": "chat|summary|quiz", "target_id": "...", "feedback_type": "like|dislike|report", "user_note": "" }
```

---

## Health Check
```
GET /api/health
Response: { "status": "ok" }
```
