Giả sử có khoảng 900 học sinh tại VinSchool

| | **Conservative** | **Realistic** | **Optimistic** |
|---|---|---|---|
| **Assumption** | 180 users/ngày (20%) · 3 docs/ngày | 540 users/ngày (60%) · 4 docs/ngày | 810 users/ngày (90%) · 5 docs/ngày |
| **Tổng cost/tháng** | **$159** | **$354** | **$576** |
| **Subscription** | $1/HS → $900/tháng | $2/HS → $1,800/tháng | $4/HS → $3,600/tháng |
| **Net/tháng** | **+$741** (margin 82%) | **+$1,446** (margin 80%) | **+$3,024** (margin 84%) |

**Kill criteria:** cost > revenue liên tục 2 tháng · hint rate > 80% · quiz completion < 40%

---

**Notes theo từng phần:**

**Cost**
Bao gồm chi phi inference LLM và hạ tầng cho RAG system (server, vector DB, monitoring and logging, storage.)

**Subscription $1/$2/$4**
Mức này thấp hơn break-even gốc rất nhiều, khả thi vì cost đã được tối ưu. Conservative $1/HS định vị như add-on rẻ để trường dễ approve ngân sách. Realistic $2/HS tương đương 1 ly trà sữa/tháng — dễ bán cho phụ huynh. Optimistic $4/HS vẫn thấp hơn 1h gia sư, trong khi margin đạt 84%.