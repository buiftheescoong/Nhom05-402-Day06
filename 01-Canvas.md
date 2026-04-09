# SPEC — AI Product Hackathon

**Nhóm:** Nhóm 5 - E402  
**Track:** VinUni-VinSchool  
**Problem statement (1 câu):** *Học sinh VinSchool ôn thi gặp khó khăn với tài liệu dài và tự đánh giá mức độ hiểu; hiện chủ yếu đọc lại hoặc ghi chú thủ công kém hiệu quả. AI có thể tóm tắt tài liệu và tạo quiz tương tác kèm gợi ý để hỗ trợ hiểu sâu và tự kiểm tra.*

---

## 1. AI Product Canvas

| Thành phần | Câu hỏi | Trả lời |
|---|---|---|
| **Value** | User nào? Pain gì? AI giải gì? | **User:** Sinh viên VinUni / Học sinh VinSchool đang ôn thi. <br><br> **Pain:** Tài liệu đọc (readings) quá dài, khó tự kiểm tra xem mình đã hiểu bài chưa. <br><br> **AI giải:** Tóm tắt ý chính theo cấu trúc hint cây + tạo quiz tương tác có hint (gợi mở) để kích thích tư duy thay vì đưa đáp án thẳng. |
| **Trust** | Khi AI sai thì sao? User sửa bằng cách nào? | **Khi sai:** AI có thể tạo câu hỏi không có trong bài hoặc tóm tắt nhầm ý. <br><br> **Sửa:** Cung cấp link "Nguồn gốc" trích dẫn từ trang mấy trong PDF. Cho phép user nhấn "Report/Edit" để điều chỉnh lại kiến thức đúng, AI sẽ học lại từ bản sửa đó. |
| **Feasibility** | Cost/latency bao nhiêu? Risk chính? | **Cost/Latency:** Khoảng $0.02/document; latency 5-10s cho việc xử lý file lớn. <br><br> **Risk:** AI tạo câu hỏi quá dễ/ngớ ngẩn (hallucinate độ khó) hoặc vi phạm bản quyền tài liệu nội bộ nếu không bảo mật server. |

---

## 2. Chiến lược tích hợp (Integration Strategy)

- **Automation hay Augmentation?**
  - [ ] Automation; [x] Augmentation
  - **Justify:** Đây là công cụ hỗ trợ học tập (Co-pilot). Mục tiêu là giúp học sinh "tự học tốt hơn" (self-study) chứ không phải thay thế việc đọc tài liệu. AI đóng vai trò một "gia sư" gợi mở (Socratic Method).

- **Learning signal:**
  - **User correction đi vào đâu?** Đi vào một lớp **Cache/Fine-tuning Layer** cục bộ. Nếu nhiều người cùng sửa một lỗi ở cùng một slide, hệ thống sẽ tự động cập nhật lại kiến thức chuẩn cho toàn bộ zone đó.
  - **Product thu signal gì để biết tốt lên hay tệ đi?**
    1. Tỉ lệ user nhấn xem "Hint" (nếu nhấn quá nhiều -> câu hỏi quá khó/tóm tắt chưa rõ).
    2. Tỉ lệ hoàn thành bộ quiz sau khi đọc tóm tắt.
    3. Độ tương quan giữa điểm quiz trên app và điểm thi thật (nếu có thể track).

- **Data thuộc loại nào?**
  - [ ] User-specific; [x] Domain-specific (giáo trình, slide, hand-out của VinUni/VinSchool); [ ] Real-time; [ ] Human-judgment.
  - **Có marginal value không?** Rất cao. Các LLM công cộng (ChatGPT, Gemini) không được tiếp cận với giáo trình nội bộ hoặc slide bài giảng riêng biệt của từng giáo sư tại Vin. Đây chính là giá trị cốt lõi (moat) của sản phẩm.


