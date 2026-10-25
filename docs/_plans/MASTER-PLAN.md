---
doc: master-plan
title: Kế Hoạch Tổng Thể (Master Plan) — BeautyAI Platform
status: draft
precedence: 5
owner: PM / Tech Lead
last_reviewed: 2026-10-25
---

# KẾ HOẠCH TỔNG THỂ DỰ ÁN (MASTER PLAN) — BeautyAI Platform

> Nguồn chân lý duy nhất về trạng thái, lộ trình và phân rã 9 Phase / các Work Groups (Precedence 5 — Working memory).
> Bảng trạng thái cập nhật liên tục: sau mỗi lần archive change trong chế độ solo.

---

# 1. TÓM TẮT ĐIỀU HÀNH

## 1.1. Các con số chính

| Chỉ số | Giá trị |
|---|---|
| **Tổng khối lượng ước tính** | **552 giờ** (460h công việc + 20% đệm rủi ro) |
| **Nhịp độ** | ≥ 4 giờ/ngày |
| **Thời lượng** | **138 ngày làm việc** ≈ **4,5 tháng** nếu làm hằng ngày · **6,4 tháng** nếu 5 ngày/tuần |
| **Số phase** | **9** |
| **Số work group** | **38** |
| **Yêu cầu chức năng cần triển khai** | 126 FR (75 Must · 49 Should · 5 Could) |
| **Mốc có bản chạy được đầu tiên** | **Hết Phase 2** (~ngày 25) — đăng nhập + xem danh mục |
| **Mốc demo được trọn luồng mua hàng** | **Hết Phase 6** (~ngày 93) |
| **Mốc hoàn chỉnh tính năng** | **Hết Phase 8** (~ngày 129) |

## 1.2. Nguyên tắc chi phối kế hoạch

| # | Nguyên tắc | Vì sao quan trọng với dự án này |
|---|---|---|
| **1** | **Mỗi phase kết thúc bằng một thứ CHẠY ĐƯỢC và DEMO ĐƯỢC** | Với 4,5 tháng, nếu không có bản chạy được định kỳ thì không biết mình đang ở đâu. Không bao giờ có giai đoạn "đang xây, chưa chạy được" dài hơn một phase |
| **2** | **Lát mỏng hoàn thành được trong MỘT buổi 4 giờ** | Phiên bị ngắt giữa một việc lớn là phiên mất. Mọi task ≤ 4h; task > 4h phải chia nhỏ (`RISK-09`) |
| **3** | **Nút thắt là TÍCH HỢP & TUÂN THỦ, không phải viết code** | ⚠️ **Phát hiện quan trọng nhất của kế hoạch này.** AI agent giúp viết code nhanh gấp nhiều lần, nhưng **không** giúp xin tài khoản Zalo OA, cấu hình đường hầm thanh toán, hay biên soạn 200 mục từ điển thành phần nhanh hơn. Kế hoạch được lập theo nút thắt MỚI (`RISK-08`) |
| **4** | **Công việc dữ liệu & tuân thủ đặt SỚM, không để sau** | Từ điển thành phần (`RISK-06`), chọn danh mục Lớp A (`RISK-05`), lớp ẩn danh hóa (`RISK-01`) đều ở Phase 1–2. Nếu để sau, chúng **sẽ không bao giờ được làm** |
| **5** | **QA-first: thiết kế test trước khi code** | `AGENTS.md §3`. Trong một phiên 4h: ~45 phút thiết kế test → ~2,5h triển khai → ~45 phút đóng việc |
| **6** | **Cắt phạm vi theo thang có chuẩn bị trước, không cắt tùy hứng** | §12 là thang cắt phạm vi đã xếp thứ tự. Khi trễ tiến độ, cắt theo thang, không cắt theo cảm tính lúc đang áp lực |

## 1.3. Phân công người ↔ AI agent

> Đây là phần quan trọng nhất để mô hình "1 người + AI" thực sự hiệu quả, chứ không chỉ là "dùng AI viết code".

| Loại công việc | Người làm | Antigravity làm | Tỷ lệ thời gian |
|---|---|---|---|
| **Quyết định kiến trúc, ADR** | ✅ Quyết định | Soạn nháp các phương án, nêu trade-off | 80 / 20 |
| **Thiết kế test & điều kiện chấp nhận** | ✅ Chốt ý định test | Sinh case từ AC, mở rộng ca biên | 40 / 60 |
| **Viết code triển khai** | Review, chỉnh hướng | ✅ Thực thi chính | 20 / 80 |
| **Biên soạn từ điển thành phần (200 mục)** | ✅ **Rà soát & xác nhận** (bắt buộc) | Soạn nháp diễn giải | 50 / 50 |
| **Chọn 200–400 SP danh mục Lớp A** | ✅ **Người quyết định** | Lọc, xếp hạng theo tiêu chí | 70 / 30 |
| **Soạn 12 quy tắc xung đột + nguồn** | ✅ **Người xác minh nguồn** | Soạn nháp từ tài liệu đã cung cấp | 60 / 40 |
| **Tinh chỉnh prompt & golden test** | ✅ Chốt tiêu chí pass | Chạy thử, sinh biến thể | 50 / 50 |
| **Thiết kế giao diện (design brief)** | ✅ Chốt | Dựng mockup HTML từ hệ thống thiết kế có sẵn | 50 / 50 |
| **Tích hợp bên thứ ba** (Zalo OA, VNPay, Gemini) | ✅ **Phần lớn là việc của người** — xin tài khoản, cấu hình, đường hầm | Viết adapter | 70 / 30 |
| **Rà soát tuân thủ nội dung** | ✅ **Người quyết định cuối** | Quét và đề xuất | 60 / 40 |
| **Kiểm thử thủ công & khám phá** | ✅ Chỉ người làm được | — | 100 / 0 |
| **Viết tài liệu, ảnh chụp trạng thái** | Review | ✅ Soạn | 25 / 75 |

> 🔑 **Điều này giải thích vì sao ước lượng là 460 giờ dù "AI viết code hộ".** Khoảng **40% khối lượng** là công việc chỉ người làm được: quyết định, xác minh nguồn, biên soạn dữ liệu chuyên môn, xin tài khoản, kiểm thử thủ công. AI tăng tốc 60% còn lại, không tăng tốc 40% này.

## 1.4. Cấu trúc một phiên làm việc 4 giờ

```text
┌─ 00:00–00:15  MỞ PHIÊN ──────────────────────────────────────────────┐
│ • Đọc docs/_states/ bản ghi gần nhất → nhớ lại đang ở đâu            │
│ • Đọc WG plan hiện tại → chọn 1–2 task cho phiên này                 │
│ • Tạo worktree nếu bắt đầu việc mới:                                 │
│     ./syntheprise worktree create feat/<module>-<slug>               │
│ • Nếu là việc cần change folder (§13.4 TD): /change-propose          │
└──────────────────────────────────────────────────────────────────────┘
┌─ 00:15–01:00  THIẾT KẾ TEST (QA-first — BẮT BUỘC) ──────────────────┐
│ • Đọc FR + AC trong requirements.md                                  │
│ • Đọc BR-* liên quan trong docs/domain-rules.md                      │
│ • /qa-test-design → ma trận test: happy · biên · âm                  │
│ • ⚠️ Người CHỐT ý định test; AI mở rộng case                          │
│ • Cập nhật docs/traceability.md                                      │
└──────────────────────────────────────────────────────────────────────┘
┌─ 01:00–03:30  TRIỂN KHAI (Antigravity thực thi, người chỉ hướng) ───┐
│ • Đưa cho agent: AGENTS.md → TD phần liên quan → FR+AC → test đã thiết kế│
│ • Agent viết code; người review từng lát, không chờ tới cuối         │
│ • Chạy test liên tục; không để tới cuối phiên mới chạy               │
│ • ⚠️ Nếu agent đề xuất đổi stack/lược đồ/xác thực → DỪNG, cần ADR     │
└──────────────────────────────────────────────────────────────────────┘
┌─ 03:30–04:00  ĐÓNG PHIÊN (BẮT BUỘC, không bỏ) ──────────────────────┐
│ • ./syntheprise gate   → phải XANH                                   │
│ • Cập nhật worklog trong WG plan                                     │
│ • ⚠️ GHI ẢNH CHỤP TRẠNG THÁI TRƯỚC:                                   │
│     docs/_states/state_2026-10-25_<slug>.md                        │
│     (commit trong CÙNG commit — nguyên tử, AGENTS.md §7)             │
│ • Commit (Conventional Commits, có mã FR/change) + push + PR nếu xong│
│ • Nếu đóng change: /change-archive → cleanup worktree                │
│ • Ghi 1 dòng "việc tiếp theo là gì" vào ảnh chụp trạng thái           │
└──────────────────────────────────────────────────────────────────────┘
```

> 💡 **Vì sao 45 phút cuối là bắt buộc:** với nhịp 4h/ngày và dự án 4,5 tháng, **chi phí lớn nhất không phải viết code mà là nhớ lại mình đang làm gì.** Ảnh chụp trạng thái cuối phiên giảm thời gian "khởi động lại" ở phiên sau từ ~30 phút xuống ~10 phút. Trên 138 phiên, đó là tiết kiệm ~46 giờ — nhiều hơn cả một phase nhỏ.

---

# 2. MASTER PLAN — 9 PHASE

| Phase | Tên | Mục tiêu | Giờ | Ngày | Mốc tích lũy | Trạng thái |
|---|---|---|---|---|---|---|
| **P1** | **Nền tảng: Dữ liệu, Kiến trúc, Khung dự án** | Có bộ khung chạy được + dữ liệu sạch trong DB | **72** | 18 | ngày 18 | ☐ Chưa bắt đầu |
| **P2** | **Tài khoản, Xác thực & Vỏ ứng dụng** | ✅ **Bản chạy được đầu tiên** — đăng nhập, điều hướng | **32** | 8 | ngày 26 | ☐ |
| **P3** | **Danh mục, Tìm kiếm, PDP & Wishlist** | ✅ Duyệt & xem sản phẩm với phân tích INCI | **64** | 16 | ngày 42 | ☐ |
| **P4** | **Digital Skin ID, Skin Quiz & Routine Builder** | ✅ Cá nhân hóa hoạt động | **60** | 15 | ngày 57 | ☐ |
| **P5** | **Conflict Detector, Ingredient Analyzer & So sánh** | ✅ Lớp trí tuệ thành phần hoàn chỉnh | **48** | 12 | ngày 69 | ☐ |
| **P6** | **Giỏ hàng, Voucher, Thanh toán & Đơn hàng** | ✅ **Demo trọn luồng mua hàng** | **96** | 24 | ngày 93 | ☐ |
| **P7** | **Trợ lý AI "Lumi" 3 tầng** | ✅ Hội thoại + chuyển tiếp Zalo | **72** | 18 | ngày 111 | ☐ |
| **P8** | **Admin Console, Đánh giá & Hỗ trợ** | ✅ **Hoàn chỉnh tính năng** | **72** | 18 | ngày 129 | ☐ |
| **P9** | **Kiểm thử toàn diện, Gia cố & Demo cuối** | ✅ **Nghiệm thu** | **36** | 9 | **ngày 138** | ☐ |
| | | **Tổng** | **552** | **138** | | |

## 2.1. Sơ đồ phụ thuộc giữa các phase

```text
P1 Nền tảng
 │  (DB · khung dự án · dữ liệu · từ điển thành phần · quy tắc xung đột)
 ▼
P2 Tài khoản & Vỏ ứng dụng
 │
 ├──────────────────────┬──────────────────────┐
 ▼                      ▼                      │
P3 Danh mục & PDP    (song song được một phần)  │
 │                                              │
 ├──────────┬───────────────────┐               │
 ▼          ▼                   ▼               │
P4 Skin ID  P5 Conflict      P6 Giỏ hàng ◄──────┘
& Quiz      & Analyzer       & Thanh toán
 │              │                 │
 └──────┬───────┴─────────────────┘
        ▼
    P7 Trợ lý AI
   (cần P3·P4·P5·P6 — vì trợ lý gọi mọi năng lực trên)
        │
        ▼
    P8 Admin Console
   (cần mọi thực thể đã tồn tại để quản trị được)
        │
        ▼
    P9 Kiểm thử & Demo

⚠️ ĐƯỜNG GĂNG (critical path):  P1 → P2 → P3 → P6 → P7 → P8 → P9
   Chậm bất kỳ phase nào trên đường này là chậm toàn dự án.
   P4 và P5 có độ linh hoạt: lùi được tối đa ~1 tuần mà không ảnh hưởng ngày kết thúc.
```

## 2.2. Vì sao thứ tự này

| Quyết định về trình tự | Lý do |
|---|---|
| **P1 làm dữ liệu TRƯỚC code tính năng** | Toàn bộ giá trị của BeautyAI nằm ở dữ liệu thành phần. Code không có dữ liệu không demo được gì. Và `RISK-06` (khối lượng từ điển bị đánh giá thấp) **phải** được đối diện sớm, lúc còn kịp điều chỉnh phạm vi |
| **P2 nhỏ và sớm** | Để có **bản chạy được ở ngày 26**, không phải ngày 90. Có bản chạy được sớm đổi hoàn toàn cảm giác về tiến độ và cho phép phát hiện vấn đề hạ tầng sớm |
| **P3 trước P4** | Quiz cần sản phẩm + dữ liệu thành phần để xếp hạng. Không thể test Quiz mà không có danh mục |
| **P5 sau P4** | Conflict Detector phải tích hợp vào Routine Builder (`BR-CONF-06`) nên Routine phải có trước |
| **P6 là phase lớn nhất (96h)** | Chứa phần nhiều quy tắc nghiệp vụ tinh vi nhất: thứ tự voucher 6 bước, đóng băng tỷ giá, trừ tồn kho đồng thời, máy trạng thái, callback thanh toán. **Đây là phase dễ bị đánh giá thấp nhất** |
| **P7 sau P6** | Trợ lý AI **gọi lại** mọi năng lực: tìm sản phẩm (P3), xây routine (P4), kiểm tra xung đột (P5), chuẩn bị giỏ (P6). Làm P7 trước sẽ phải làm hai lần |
| **P8 gần cuối** | Admin quản trị các thực thể — cần thực thể tồn tại trước. Và Admin là phần **ít rủi ro nhất**, phù hợp để làm khi đã quen nhịp |
| **P9 riêng, không gộp vào P8** | `BO-06`, `BO-08` yêu cầu bằng chứng kiểm thử đầy đủ. Nếu gộp testing vào phase tính năng, nó **sẽ bị cắt** khi áp lực tiến độ |

---

