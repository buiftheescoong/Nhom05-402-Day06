# SRS — Software Requirements Specification (AI Tutor)

## 1. Introduction

### 1.1 Purpose
Tài liệu SRS này cung cấp thông số yêu cầu phần mềm cho AI Tutor - nền tảng LMS thông minh tích hợp trí tuệ nhân tạo. Ứng dụng cung cấp bảng điều khiển (portal) dành riêng cho Giảng Viên và Học Sinh nhằm trao đổi tài liệu qua RAG, ứng dụng Tóm tắt, trắc nghiệm và gợi ý (hint) tự động.

### 1.2 Scope
Hệ thống cho phép:
- **Giáo viên** tạo và thiết lập Class (bảo mật PIN), quản lý các Notebooks (Session/Buổi học) và upload tài liệu học tập vào từng buổi đó. Được quyền bật/tắt buổi học từ xa.
- **Học sinh** gia nhập các lớp học bằng mã Code (không cần SSO/tạo account phức tạp), xem tài liệu, nhận Tóm tắt ngữ cảnh từ tập tài liệu, làm bài tự luận chấm điểm tự động (AI Grader), nhận Hint và chat để làm rõ ý chính.

### 1.3 Definitions
- **Class Code:** Mã định danh do hệ thống hoặc người dùng sinh ra dùng để Học Sinh tham gia.
- **PIN:** Mã mật danh chuyên quyền chỉ dành cho Giáo Viên sở hữu Lớp Học đó.
- **Notebooks:** Các tập tài liệu tương ứng với từng Lesson/Buổi Học của môn học.
- **RAG (Retrieval-Augmented Generation):** Pipeline xử lý câu hỏi dựa trên document đã nạp.
- **GAR/TSR:** Đo lường độ chính xác từ nguồn của LLM trả ra nội dung.

---

## 2. Overall description

### 2.1 Product perspective
Ứng dụng có cấu trúc client-server rõ ràng, thay vì là một Chat Widget nhúng:
- Giao diện Client tách bạch chức năng qua định tuyến Next.js thành `teacher` route và `student` route.
- Server điều phối việc quản lý Metadata (qua **SQLite**) và Embedding Search (qua **Chroma DB**). Server định tuyến LLM API qua provider như Google Gemini hoặc OpenAI tùy cấu hình tại `config.py`.

### 2.2 User classes
- **Teacher (Giáo viên):** Là tập người dùng khởi tạo cấu trúc khóa học. Có quyền truy cập Admin Authentication (bằng PIN), có đặc quyền CRUD với khóa học, file tải lên.
- **Student (Học viên):** Tham gia dưới hình thức read-only content gốc, nhưng được quyền thực hiện LLM Actions trên text content đó. Xác thực mềm qua Class Code + Tên định danh (Session).

### 2.3 Operating environment
- **Client:** Trình duyệt Web tiêu chuẩn.
- **Frontend Stack:** Next.js 16, React 19, Tailwind CSS v4, Zustand.
- **Backend Stack:** FastAPI, SQLAlchemy, uvicorn.
- **Database:** SQLite DB (Relational Database backend), Chroma DB (Local Vector Storage).
- **Architecture Base:** App chạy tốt với mô hình local docker-compose.

### 2.4 Constraints
- Thời gian phát triển giới hạn MVP => Bỏ qua hệ thống xác thực (Auth) tập trung dùng JWT/SSO đa nền tảng, bù lại dùng mã dự phòng Pinned Code cho Authentication bảo mật vòng ngoài.
- Dùng `aiosqlite` thay cho Postgres phức tạp để giúp dự án khởi chạy bằng 1 dòng lệnh.

---

## 3. External interface requirements

### 3.1 User interface
Khác với giao diện trước đây, UI phân rõ quy trình luồng:
- **Landing Page/Routing:** Option lựa chọn "Giáo Viên" hoặc "Học Sinh".
- **Teacher Dashboard:** Tích hợp form Tạo Lớp (kèm mã PIN chống phá hoại), Tạo Notebook. Bên trong Notebook (Detail) là interface Upload File. Hỗ trợ Toggle Visibility (Mở/Trong Cập Nhật) cho phép học viên thấy tài liệu hay chưa.
- **Student Dashboard:** Màn Login bằng Code lớp + Tên. Chuyển vào Workspace có Navigation Sidebar chứa các "Active" notebooks (do SQLite Database đổ về). Main screen khu vực giữa chứa Viewer Tài Liệu, Right-panel chứa AI Actions (Summary, Quiz, Hint).

### 3.2 Software interfaces
- **LLM/API Routing layer:** Router backend sẽ dựa trên Langchain wrapper như `langchain-google-genai` và `langchain-openai` để redirect prompt đến logic provider cụ thể cấu hình theo biến môi trường API keys.
- **Embedding / Vectorize:** PyMuPDF / python-docx đọc các khối văn bản, Langchain Text Splitter sẽ băm nhỏ. Dữ liệu đẩy xuống Chroma persistent store directory nằm tại `./data/chroma`.
- **DB Interface:** `aiosqlite` cung cấp Async sessions đến Database.

---

## 4. System features and functional requirements

### 4.1 Tính năng Quản trị lớp học (FR_T - Teacher)
- **`REQ-T01` Khởi tạo lớp học:** Giáo viên tạo một "Class", bao gồm Name và Setting mã PIN. Hệ thống cấp Class Code tự động.
- **`REQ-T02` Quản lý Notebook:** Tính năng khởi động/xóa một "Notebook" đại diện cho session của buổi lên lớp.
- **`REQ-T03` Kiểm soát Public/Private:** Cập nhật trường boolean cho phép hiển thị Notebook cho sinh viên hay che hoàn toàn.

### 4.2 Xử lý dữ liệu (FR_DOC - Processing)
- **`REQ-DOC1` File Support:** Nhận file chuẩn `PDF` hoặc `DOCX` vào `/uploads`.
- **`REQ-DOC2` RAG Indexing:** Tài liệu upload vào Notebook ID nào sẽ được nhúng parameter tương ứng tại metadata chunk ở ChromaDB `{"class_id": x, "notebook_id": y}`. Tăng tối đa sức mạnh Search filter ngắt biệt lập.

### 4.3 Tính năng Học tập của Học sinh (FR_S - Student)
- **`REQ-S01` Phiên đăng nhập:** Xác nhận bằng Class Code để truy xuất Data Class.
- **`REQ-S02` Chọn bài giảng:** API `student.py` filter những Notebook đang có cờ "Active" để lấy list tài liệu. Mở PDF viewer/markdown.
- **`REQ-S03` Tóm tắt:** Module tóm tắt (`summary.py`) đọc tài liệu theo ID và đúc kết nội dung dài thành gạch đầu dòng kèm Citation gốc.
- **`REQ-S04` Generate Quiz & Hint:** RAG Prompt để đúc ra 5-10 câu học thuật. Nút gọi Hint 3 cấp độ (L1/L2/L3) sinh ý tưởng theo sát đáp án đích. Tránh tiết lộ lời giải trực diện.
- **`REQ-S05` Grader:** Khi người dùng submit bài, AI làm giáo khảo chấm điểm ý và phân bổ nhận xét.
- **`REQ-S06` Strict Context Chat:** Mọi query hỏi đáp trong Sidebar chat chỉ truy quét vector thuộc Notebook ID. Tránh nhắc đáp án của Notebook môn khác/buổi sau (Bảo mật context). Fallback "Nội dung này không có trong tài liệu" nếu RAG score similarity nằm vị thế out-of-bounds.

---

## 5. Non-functional requirements (NFR)

- **Performance:** Yêu cầu xử lý API latency tóm tắt text ngắn khoảng 3s. Lấy RAG context chunk chỉ phản hồi chớp nhoáng phục vụ Chat UX.
- **Maintainability:** Code phân tầng Controller (Routers FastAPI), Services (Logic LLM) và Repository Model DB nhằm rạch ròi trách nhiệm cho scale app. Đồng bộ Typescript bên React App Router.
- **Cost control:** Hỗ trợ config routing qua API Gemini khi rate-limit / billing OpenAI tăng vọt mà không cần build lại core RAG.

---

## 6. Acceptance criteria (AC)

- `AC01`: Teacher gen Mã Lớp xong thì Student nhập mã đó thành công đi vào phòng học.
- `AC02`: Chặn Student login nếu sai mã code, chặn người sửa settings lớp nếu xài sai mã PIN Admin.
- `AC03`: Tải một file lên thành công thì hệ thống phải sinh Embedding chạy ngầm qua thư viện không sập luồng Fastapi của user.
- `AC04`: Sinh viên hỏi câu RAG chat phải gen ra markdown chính xác kèm block citation.

---

## 7. Schema Definition (Overview Configuration)

Lược đồ Object Relations tại backend cho ứng dụng (Tham chiếu bằng SQLAlchemy) bao gồm:
- **Class Model:** Lưu `id`, `name`, `code` (Unique), `pin_hash`.
- **Notebook Model:** `id`, `class_id` (với Foreign Key ràng buộc), `title`, `is_active` (boolean toggle trạng thái hiển thị).
- **Document Model:** Lưu trữ metadata liên kết `notebook_id` và logic filepath trong hệ OS folder lưu `/uploads`. Trạng thái parse status `success/pending/failed`.
- **Vector Metadata (ChromaDB):** Mỗi Vector Text được gán map filter dict `{"document_id": string, "notebook_id": string, "class_id": string}` để cách ly dữ liệu khi Retriever bốc nguồn.
