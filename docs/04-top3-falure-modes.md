# Top 3 failure modes

## Liệt kê cách product có thể fail — không phải list features. "Failure mode nào user KHÔNG BIẾT bị sai? Đó là cái nguy hiểm nhất."

|   | **Trigger** | **Hậu quả** | **Mitigation** |
|---|-------|-------|-------------|
| 1 | AI tóm tắt kiến thức sai/Chọn sai đáp án | Học sinh học sai kiến thức, mất trust rất nhanh | Rule-based validation, answer checker, có nút report lỗi |
| 2| AI Prompt không ràng buộc grade level, difficulty mapping kém | AI tạo câu hỏi quá dễ hoặc quá khó so với trình độ học sinh | Giới hạn theo lớp / môn / chapter / độ khó, template theo curriculum |
| 3| AI cho đáp án quá nhanh thay vì để học sinh tự suy nghĩ | Không phát triển tư duy, outcome học tập giảm | Gợi ý từng bước, hint first → answer later, khuyến khích tự làm trước |