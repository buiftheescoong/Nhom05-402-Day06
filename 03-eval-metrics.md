# Eval Metrics — AI Tutor Q&A (VinUni/VinSchool)

> Mục tiêu: định nghĩa rõ 3 metric để quyết định **go / no-go** cho AI Tutor dựa trên AI Product Canvas (Value / Trust / Feasibility).

---

## 1) Scope đánh giá

### Use case trong scope

- Chatbot trả lời câu hỏi học tập từ slide/tài liệu lớp.
- Trả lời phải có căn cứ nguồn (trang/slide/tài liệu).
- User có thể báo sai và sửa (feedback loop).

### Ngoài scope giai đoạn này

- Giải sâu bài toán ký hiệu phức tạp trong PDF.
- Sinh nội dung mới ngoài tài liệu môn học.

---

## 2) Bộ 3 eval metrics (metric + threshold + red flag)

| # | Metric | Vì sao quan trọng (Canvas) | Cách đo ngắn gọn | Threshold (đạt) | Red flag (báo động) |
| --- | --- | --- | --- | --- | --- |
| 1 | **Grounded Answer Rate (GAR)** | **Trust**: giảm hallucination, bảo vệ niềm tin user | Chấm mẫu câu trả lời theo rubric: "đúng theo tài liệu + có trích nguồn hợp lệ" | **>= 85%** trên bộ test chuẩn | **< 75%** trong 2 vòng đo liên tiếp hoặc bất kỳ lỗi nghiêm trọng bị phản ánh lặp lại |
| 2 | **Task Success @1-turn (TSR)** | **Value**: user nhận được câu trả lời dùng được ngay, giảm thời gian đọc tài liệu | % phiên hỏi đáp mà user đánh dấu "đã giải quyết" ngay lượt đầu (hoặc không hỏi lại trong 2 phút) | **>= 70%** | **< 55%** hoặc tỷ lệ hỏi lại cùng chủ đề tăng >20% tuần/tuần |
| 3 | **P95 Response Time** | **Feasibility**: giữ trải nghiệm mượt, phù hợp ràng buộc latency | Đo p95 thời gian từ lúc gửi câu hỏi đến lúc nhận câu trả lời hoàn chỉnh | **<= 3.0 giây** | **> 4.5 giây** kéo dài >1 ngày hoặc >5% request timeout |

---

## 3) Định nghĩa đo chi tiết (để team đo giống nhau)

### Metric 1 — Grounded Answer Rate (GAR)

#### Công thức GAR

`GAR = (Số câu trả lời "đúng + có trích dẫn đúng") / (Tổng câu trả lời được chấm)`

#### Rubric chấm 1 câu trả lời

- `Pass` khi thỏa cả 2:
  - Nội dung đúng với tài liệu học phần.
  - Có trích dẫn nguồn truy vết được (tên tài liệu + vị trí trang/slide hợp lý).
- `Fail` nếu:
  - Khẳng định sai kiến thức.
  - Có vẻ đúng nhưng không có nguồn hoặc nguồn không liên quan.

#### Sample tối thiểu mỗi vòng đo

- 100 câu hỏi đại diện 4 nhóm: khái niệm, so sánh, ví dụ, câu hỏi mẹo/dễ gây hallucination.

### Metric 2 — Task Success @1-turn (TSR)

#### Công thức TSR

`TSR = (Số phiên user giải quyết được ngay lượt đầu) / (Tổng phiên hỏi đáp)`

#### Rule thực thi

- Ưu tiên tín hiệu explicit: nút "Đã hiểu/Đã giải quyết".
- Nếu chưa có nút explicit, dùng proxy:
  - Không hỏi lại trong 2 phút về cùng intent.
  - Không chuyển sang "nhờ người thật" trong phiên.

### Metric 3 — P95 Response Time

#### Công thức P95 latency

`P95 latency = percentile 95 của toàn bộ response_time_ms`

#### Rule đo

- Đo end-to-end ở production-like env.
- Tách dashboard theo loại câu hỏi (ngắn/dài/có trích dẫn nhiều) để tránh hiểu sai bottleneck.

---

## 4) Bổ sung Guardrail metric

### 4.1 Guardrail metric (không tính vào "core 3" nhưng nên đo lường metric này)

| Metric guardrail | Mục đích | Ngưỡng cảnh báo |
| --- | --- | --- |
| **Correction Rate** (% câu trả lời bị user bấm "Sai/Needs fix") | Theo dõi niềm tin và chất lượng thực tế sau launch | >20% trong 3 ngày liên tiếp |
| **No-citation Rate** (% câu trả lời không có nguồn) | Chặn trả lời kiểu "đoán" | >10% theo ngày |
| **Cost per answered query** | Bám ràng buộc feasibility từ Canvas | >$0.02/query theo tuần |

### 4.2 Data slice bắt buộc khi report

Mỗi lần report metric cần tách theo:

- Môn học / học phần.
- Loại câu hỏi (khái niệm, bài tập, tổng hợp).
- Độ dài ngữ cảnh truy xuất (ít/đủ/nhiều chunks).

Lý do: cùng 1 chỉ số tổng có thể che mất lỗi cục bộ (ví dụ một môn tụt mạnh nhưng toàn hệ thống vẫn "ổn").

### 4.3 Launch gate

Chỉ cho phép rollout rộng khi:

- GAR đạt threshold 2 vòng đo liên tiếp.
- TSR đạt threshold ít nhất 1 tuần pilot.
- P95 latency ổn định dưới 3s trong giờ cao điểm.
- Không chạm red flag Trust trong tuần gần nhất.

Nếu chạm red flag:

- Đóng auto-answer cho nhóm câu hỏi liên quan.
- Chuyển fallback: "Chưa đủ chắc chắn, vui lòng xem nguồn gốc + gợi ý gặp TA/giảng viên".

---

## 5) Learning Signal Metrics (Integration Strategy)

Mục tiêu: Metric cho learning signal thành chỉ số đo được để hệ thống cải thiện theo thời gian, không chỉ dừng lại ở việc "ghi nhận feedback".

### 5.1 Ba chỉ số learning signal

| Metric | Định nghĩa | Ý nghĩa product | Threshold (đạt) | Red flag |
| --- | --- | --- | --- | --- |
| **Hint Request Rate (HRR)** | `% phiên user bấm "Hint"` | Đo độ khó hiểu của tóm tắt/câu hỏi gợi mở và mức độ user cần hỗ trợ thêm | 15%-45% (vùng lành mạnh) | >60% (nội dung khó/không rõ) hoặc <5% (feature không được dùng) |
| **Quiz Completion After Summary (QCR)** | `% user hoàn thành quiz sau khi đọc tóm tắt` | Đo adoption và giá trị thực của flow tự học | >=65% | <45% trong 1 tuần |
| **Quiz-Outcome Alignment (QOA)** | Tương quan giữa điểm quiz trên app và điểm học thật (nếu track được) | Kiểm tra quiz có phản ánh năng lực thật hay không | r >= 0.35 (khi đủ mẫu) | r < 0.15 hoặc tương quan âm |

### 5.2 Signal-to-action (bắt buộc có hành động)

| Signal phát hiện | Điều này gợi ý | Hành động hệ thống | SLA |
| --- | --- | --- | --- |
| User nhấn `Report/Edit` và sửa nguồn | Lỗi grounding hoặc nguồn trích chưa đúng | Ghi vào correction store, ưu tiên cập nhật retrieval cache cho cặp câu hỏi tương tự | <=24h |
| Cùng 1 lỗi xuất hiện lặp lại >N lần/tuần | Lỗi hệ thống, không còn là lỗi cá biệt | Mở ticket cải tiến prompt/retrieval, thêm test case vào bộ eval regression | <=48h |
| HRR vượt red flag | Tóm tắt/câu hỏi gợi mở đang quá khó | Rút gọn độ dài summary, đổi style câu hỏi theo mức độ nhận thức thấp hơn | <=72h |

### 5.3 Ràng buộc dữ liệu tối thiểu trước khi kết luận

- Không kết luận metric theo môn nếu chưa đủ `>=100 phiên/môn`.
- Không kết luận metric toàn hệ nếu chưa đủ `>=300 phiên/toàn hệ`.
- Với QOA, chỉ kết luận khi có đủ cặp dữ liệu quiz-va-diem-thuc và phân bố điểm không lệch quá mạnh.

### 5.4 Liên kết với core metrics

Learning signal chỉ có ý nghĩa khi kéo được chất lượng lõi:

- Sau khi xử lý correction, **GAR** phải tăng theo tuần.
- Khi HRR được tối ưu về vùng lành mạnh, **TSR** phải tăng hoặc giữ ổn định.
- Các cải tiến không được làm xấu **P95 latency** vượt ngưỡng.

---