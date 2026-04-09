# Prototype Readme

## 1. Mô tả prototype
Agent được tích hợp trong LMS của VinUni/VinSchool, hỗ trợ học sinh chuẩn bị bài trước cho lớp học với khả năng tóm tắt bài giảng, đưa ra các câu hỏi quiz củng cố kiến thức và đưa ra hint theo nhiều cấp độ cho người dùng. Tài liệu được giáo viên tích hợp theo từng buổi, học sinh truy cập vào các buổi học để xem tài liệu, tương tác trước và trong buổi học, ôn tập sau buổi học.

## 2. Thông tin chung
- **Level:** Working
- **Link prototype:** [https://github.com/buiftheescoong/Nhom05-402-Day06](https://github.com/buiftheescoong/Nhom05-402-Day06)
- **Tools và API đã dùng:** OpenAPI (gpt-4o), RAG, Chroma DB, FastAPI LangChain, Next.js

## 3. Phân công công việc
*(Các phần trong spec-draft đã được phân công hôm qua)*

- **Chung:** Revised problem statement - từ App độc lập thành tích hợp vào LMS cho các trường.
- **Bùi Thế Công:** Xây dựng memory cho chatbot, fix bug khi AI tạo quiz context dài, cải thiện luồng UI/UX.
- **Bùi Lâm Tiến:** Hoàn thiện lại SPEC final, workflow, prototype demo, prototype-readme, hỗ trợ validate agent, test PDF.
- **Trần Thượng Trường Sơn:** Build codebase (vibe coding front-back dựa trên spec ban đầu), hoàn thiện các chức năng về xử lí PDF, context dài.
- **Trần Ngọc Huy:** Hỗ trợ sửa backend, xây dựng hệ thống prompt, system prompt theo cấu trúc.
- **Trường Đăng Nghĩa:** Cải tiến prompt cho Agent, test Agent, hỗ trợ test frontend.
- **Nông Trung Kiên:** Logic backend (chức năng tải tài liệu), merge branch và xử lý conflict mã nguồn.