# PLAYBOOK THỰC THI DỰ ÁN — **BeautyAI**
## Sổ tay thao tác hằng ngày cho Trung (Kiến trúc & Chỉ huy) + Antigravity (Thực thi)

| Thuộc tính | Giá trị |
|---|---|
| **Mã tài liệu** | `Playbook_BeautyAI_V1.0` |
| **Phiên bản** | V1.1 — *đã rà soát khớp Syntheprise Framework v6.0.1* |
| **Ngày lập** | 2026-10-21 |
| **Vị trí trong repo** | `docs/_guides/90-beautyai-playbook.md` *(thư mục `_guides/` dùng quy ước số thứ tự)* |
| **Lớp precedence (Syntheprise Framework)** | **6 — Informational.** Đây là **sổ tay thao tác**. Nó **không bao giờ** ghi đè hợp đồng kỹ thuật (lớp 2), yêu cầu nghiệp vụ (lớp 3), hay quy tắc miền (lớp 4) |
| **Dùng cùng** | `BRD_BeautyAI_V1.0.md` · `Technical_Design_BeautyAI_V1.0.md` · `Plan_BeautyAI_V1.0.md` |
| **Đối tượng** | Trung (người quyết định) · Antigravity (agent thực thi) |

---

# PHẦN 0 — CÁCH DÙNG PLAYBOOK NÀY

## 0.1. Playbook này là gì và không là gì

| Playbook này **LÀ** | Playbook này **KHÔNG LÀ** |
|---|---|
| Sổ tay thao tác: mỗi ngày mở ra, lấy một task, làm, đóng | Tài liệu đặc tả — đặc tả ở `BRD` |
| Thư viện **prompt copy-paste được** cho Antigravity | Tài liệu kiến trúc — kiến trúc ở `Technical_Design` |
| Danh mục kiểm tra "xong khi nào" cho từng task | Kế hoạch tiến độ — tiến độ ở `Plan` |
| Nơi ghi lại **prompt gốc** để tái lập được toàn bộ dự án | Nguồn chân lý về bất kỳ quyết định nào |

> ⚠️ **Nguyên tắc vàng:** nếu playbook này nói khác với `Technical_Design` hoặc `BRD`, **hai tài liệu đó thắng**. Playbook chỉ hướng dẫn *cách làm*, không định nghĩa *làm gì*.

## 0.2. Ba lớp tài liệu — Antigravity phải đọc theo thứ tự này

```text
LỚP 0    ·  LUẬT CAO NHẤT           core-principles.md · .agents/rules/
             ↓ không bao giờ vi phạm     (safety · change-management
                                          · provider-abstraction · ui-ux-standards)
LỚP 1    ·  HIẾN PHÁP DỰ ÁN         AGENTS.md · .agents/agents.md
             ↓
LỚP 2    ·  HỢP ĐỒNG KỸ THUẬT      Technical_Design → docs/architecture.md · data-contracts.md
             ↓ thắng về CÁCH làm        api-contract.md · design-system.md · security-policy.md
                                        testing-strategy.md · llm-policy.md · tech-stack.md
LỚP 3    ·  YÊU CẦU NGHIỆP VỤ      BRD → requirements.md · docs/_requirements/
             ↓ thắng về LÀM GÌ          + docs/_changes/*/requirements-delta.md (đang mở)
LỚP 4    ·  QUY TẮC MIỀN           BRD §7, §17.2 → docs/domain-rules.md
             ↓
LỚP 5    ·  KẾ HOẠCH & THIẾT KẾ    Plan → docs/_plans/ · docs/_states/ · docs/_ui-ux_design/
             ↓
LỚP 6    ·  SỔ TAY (tài liệu này)  docs/_guides/90-beautyai-playbook.md
                                   + README · CHANGELOG · docs/_review/ · docs/_research/
```

> ⚠️ **Lưu ý về lớp 3:** `requirements-delta.md` của một change **đang mở** có thẩm quyền ngang `requirements.md`. Nghĩa là khi đang làm trong một change folder, delta đó **là** yêu cầu hiện hành.
>
> ⚠️ **Lưu ý về lớp 0:** `.agents/rules/safety.md` có thẩm quyền **cao hơn** `AGENTS.md`. Mọi prompt mở buổi làm việc phải để nó ở đầu danh sách đọc.

## 0.3. Cấu trúc một thẻ công việc (task card)

Mọi task trong playbook này có đúng 6 phần:

```text
┌────────────────────────────────────────────────────────────────┐
│ ▸ MÃ TASK — Tên task                                           │
│   Giờ · Phase · Work group · FR/BR liên quan · Phụ thuộc       │
├────────────────────────────────────────────────────────────────┤
│ 🎯 MỤC TIÊU        — một câu, nói rõ xong thì có gì            │
│ 👤 NGƯỜI LÀM       — việc chỉ Trung làm được (quyết định,      │
│                      xác minh, xin tài khoản, kiểm thử tay)    │
│ 🤖 PROMPT          — khối copy-paste nguyên văn cho Antigravity │
│ ✅ XONG KHI        — danh mục kiểm tra, không mơ hồ            │
│ 🔍 KIỂM CHỨNG      — lệnh chạy được, không phải "xem có ổn"    │
│ ⛔ KHÔNG ĐƯỢC      — bất biến dễ bị phá trong task này         │
└────────────────────────────────────────────────────────────────┘
```

## 0.4. Mười sáu nhóm công việc — bản đồ toàn dự án

| Nhóm | Tên | Phase | Giờ | Số task | Kết quả nhìn thấy được |
|---|---|---|---|---|---|
| **A** | Nền tảng tri thức *(ĐÃ XONG)* | P0 | — | 5 | 3 tài liệu + prototype cập nhật |
| **B** | Khởi tạo dự án | P1 | 20 | 4 | Repo chạy được, CI xanh |
| **C** | Dữ liệu & Cơ sở dữ liệu | P1 | 52 | 6 | DB có dữ liệu sạch đã kiểm tra |
| **D** | Backend nền tảng | P2 | 28 | 4 | API có xác thực, OpenAPI sinh tự động |
| **E** | Frontend nền tảng | P2 | 16 | 3 | ✅ **Bản chạy được đầu tiên** |
| **F** | Danh mục, Tìm kiếm & Smart Filter | P3 | 28 | 3 | Duyệt & lọc 8.494 sản phẩm |
| **G** | PDP, INCI & Điểm Phù Hợp | P3 | 36 | 4 | ✅ **Demo được USP minh bạch thành phần** |
| **H** | Digital Skin ID, Quiz & Routine | P4 | 60 | 5 | Cá nhân hóa hoạt động |
| **I** | Conflict Detector, Analyzer & So sánh | P5 | 48 | 4 | ✅ **Demo được điểm khác biệt khoa học** |
| **J** | Giỏ hàng & Voucher | P6 | 42 | 3 | Giỏ + voucher đa tầng |
| **K** | Thanh toán & Đơn hàng | P6 | 54 | 4 | ✅ **Demo trọn luồng mua hàng** |
| **L** | Trợ lý AI 3 tầng | P7 | 72 | 6 | ✅ Hội thoại + chuyển tiếp Zalo |
| **M** | Admin, Đánh giá & Hỗ trợ | P8 | 72 | 6 | ✅ **Hoàn chỉnh tính năng** |
| **N** | Kiểm thử & Demo cuối | P9 | 36 | 5 | ✅ **NGHIỆM THU** |
| **P** | Thư viện prompt tái dùng | — | — | 9 | Prompt mẫu cho mọi tình huống |
| **Q** | Bảng tra nhanh & checklist | — | — | — | In ra dán cạnh màn hình |
| | | **Tổng** | **552** | **62 task thực thi**<br>+ 9 prompt mẫu | |

## 0.5. Ba nguyên tắc chi phối cách làm việc với Antigravity

| # | Nguyên tắc | Vì sao |
|---|---|---|
| **1** | **Luôn đưa đường dẫn tài liệu, không dán nội dung tài liệu** | Agent đọc được tệp. Dán nội dung vào prompt làm loãng ngữ cảnh và dễ lệch so với bản thật trong repo |
| **2** | **Thiết kế test TRƯỚC, code SAU — không bao giờ đảo** | `AGENTS.md §3`. Agent rất giỏi viết test khớp với code đã viết — đó chính là thứ cần tránh |
| **3** | **Khi agent đề xuất đổi stack / lược đồ / xác thực / triển khai → DỪNG** | `AGENTS.md §2.2`. Phải có ADR và bạn phê duyệt trước. Dùng prompt `P-07` ở Phần 15 |

## 0.6. Mười hai bất biến — dán vào mọi prompt quan trọng

> Đây là **danh sách phải nhắc lại** trong prompt khi task chạm vào vùng liên quan.
> **Nguồn chân lý: `Technical_Design` §4.4** (lớp 2). Bảng dưới là bản sao để tra nhanh — nếu lệch, `Technical_Design` thắng. Bảng đầy đủ kèm task phụ trách ở **Q2** (Phần 16).

| Mã | Bất biến | Kiểm thử | Nhắc trong nhóm |
|---|---|---|---|
| `INV-01` | **Không có chỉ số "an toàn / nguy hiểm"** ở bất kỳ đâu | `DC-07` | B · C · G · I |
| `INV-02` | **Tồn kho không bao giờ âm** | test đồng thời | C · K |
| `INV-03` | Quy tắc bằng chứng **cấp B/C không bao giờ ở mức CAO** | `FR-CONF-01` AC-02c | C · I · M |
| `INV-04` | **Không gửi dữ liệu gắn danh tính** cho nhà cung cấp LLM | `GC-17` | D · L |
| `INV-05` | **Mã sản phẩm do LLM bịa không bao giờ ra tới giao diện** | `GC-15` | L |
| `INV-06` | **Từ ngữ gây hiểu nhầm là thuốc không bao giờ ra tới giao diện** | `GC-16` | L · M |
| `INV-07` | **Admin không có đường nào đọc hồ sơ da của khách** | `E2E-08` | M |
| `INV-08` | **Mật khẩu không bao giờ ở dạng rõ** trong DB, log, hay API | `DC-19` | D |
| `INV-09` | **Đơn hàng bất biến** trước thay đổi giá/tên sản phẩm | `E2E-07` | K |
| `INV-10` | **Quiz tất định** — cùng đầu vào, cùng kết quả | `GC-02` | H |
| `INV-11` | **Routine buổi sáng luôn có bước chống nắng** | `FR-QUIZ-03` AC-02 | H |
| `INV-12` | **Trợ lý AI không thể thực hiện giao dịch** | `GC-13` | L |

Thêm ba bất biến **không mang mã `INV-*`**: thứ tự 6 bước tính tiền (`BR-CART-06`) · máy trạng thái đơn hàng (`BR-ORD-13`) · DTO sinh tự động (`ADR-008`).

## 0.7. Nhịp một ngày làm việc (4 giờ)

```text
┌─ 00:00–00:15 ─ MỞ PHIÊN ──────────────────────────────────────┐
│  Dùng prompt P-01 (Phần 15)                                    │
│  • Đọc docs/_states/ bản mới nhất → dòng "VIỆC TIẾP THEO"      │
│  • Mở playbook, lấy 1–2 task vừa 4 giờ                         │
│  • ./syntheprise worktree create feat/<module>-<slug>          │
│  • Nếu task thỏa tiêu chí change → /change-propose             │
└────────────────────────────────────────────────────────────────┘
┌─ 00:15–01:00 ─ THIẾT KẾ TEST ─────────────────────────────────┐
│  Dùng prompt P-02 (Phần 15)                                    │
│  ⚠️ BẮT BUỘC trước khi viết dòng code nào                      │
└────────────────────────────────────────────────────────────────┘
┌─ 01:00–03:30 ─ TRIỂN KHAI ────────────────────────────────────┐
│  Dùng prompt 🤖 của task trong playbook                        │
│  Review từng lát, không chờ tới cuối                           │
└────────────────────────────────────────────────────────────────┘
┌─ 03:30–04:00 ─ ĐÓNG PHIÊN ────────────────────────────────────┐
│  Dùng prompt P-05 (Phần 15)                                    │
│  ⚠️ KHÔNG BỎ. Ảnh chụp trạng thái trước, rồi mới archive       │
└────────────────────────────────────────────────────────────────┘
```

## 0.8. Vòng đời `docs/_changes/` — quy tắc bắt buộc, không phải tùy chọn ⭐⭐

> ⚠️ **Đây là phần dễ bỏ qua nhất và là vi phạm framework tốn kém nhất.**
> `AGENTS.md` Rule 7 nói: một thay đổi **PHẢI** đi qua `docs/_changes/<CHANGE-ID>/` nếu thỏa **bất kỳ MỘT** trong 7 tiêu chí. Và `.agents/workflows/change-propose.md` ghi rõ: *"Forbidden: implementing a non-trivial change with no change folder."*

**Bảy tiêu chí — thỏa một là phải mở change folder:**

```text
1. Đổi contract surface — chữ ký API/event, lược đồ phản hồi, hay cột/bảng DB
2. Thêm heuristic, ngưỡng, hay magic constant mới vào đường chạy production
3. Đổi semantics của cache / retry / fallback / rate-limit
4. Đổi tần suất hay fan-out của lệnh gọi ra ngoài
5. Sửa bất kỳ tệp contract (*-contract.md, *-policy.md, hay docs ở lớp 2/4)
6. Chạm authentication, authorization, secrets, hay luồng PII
7. Đổi hơn ~30 dòng code không phải test, không phải doc
```

**Hệ quả thực tế cho BeautyAI:** gần như **mọi task** từ C1 đến M6 thỏa ít nhất một tiêu chí. Nghĩa là **mặc định là PHẢI có change folder**, không phải ngoại lệ.

**Mức độ phù hợp cho dự án solo — một change folder cho MỖI WORK GROUP, không phải mỗi task:**

| Đơn vị | Số folder | Đánh giá |
|---|---|---|
| Mỗi task | 62 | Quá nặng — biến 4 giờ/ngày thành việc giấy tờ |
| **Mỗi work group** | **38** | ✅ **Chọn cái này.** Đủ thỏa Rule 7, overhead hợp lý |
| Mỗi phase | 9 | Quá thô — delta quá lớn để review có ý nghĩa |

**Ba loại change (`--type`):**

| Loại | Khi nào dùng | Trong BeautyAI |
|---|---|---|
| `FASTLANE` | Lát công việc đã có yêu cầu rõ trong `requirements.md`, không đổi contract | **Mặc định cho hầu hết work group** |
| `CHANGE` | Đổi contract, đổi yêu cầu, hay phát sinh ngoài kế hoạch | Khi `Technical_Design` cần sửa |
| `BUGFIX` | Sửa lỗi của hành vi đã bàn giao | Phase 9 trở đi |

**Vòng đời một work group:**

```text
MỞ    ./syntheprise worktree create feat/<wg>-<slug>
      ./syntheprise change new "<tên work group>" --type FASTLANE
      → tạo docs/_changes/<CHANGE-ID>/ từ docs/_changes/CHANGE-template/
      → điền proposal.md (phạm vi · lý do · rủi ro · bảng phê duyệt)
      → điền requirements-delta.md (ADDED / MODIFIED / REMOVED / DEPRECATED)
      ⚠️ Tier 1 ⟹ DỪNG chờ phê duyệt trước khi hiện thực (change-propose.md bước 5)

LÀM   /qa-test-design → test trước
      → hiện thực → ./syntheprise gate + /test-gate

ĐÓNG  ./syntheprise close-out   (xem P-02 — 4 bước, KHÔNG được bỏ bước)
```

> 💡 **Vì sao đáng làm dù thấy nặng:** `requirements-delta.md` của một change đang mở có **thẩm quyền ngang `requirements.md`** (lớp 3). Đó là cơ chế duy nhất của framework cho phép bạn *vừa* tuân thủ yêu cầu gốc *vừa* điều chỉnh nó có kiểm soát. Không có change folder, mọi điều chỉnh trở thành sửa tay vào tài liệu lớp 2/3 — đúng thứ Rule 7 cấm.

## 0.9. Quy ước ký hiệu trong playbook

| Ký hiệu | Nghĩa |
|---|---|
| 👤 | Việc **chỉ người làm được** — không giao cho agent |
| 🤖 | Khối prompt copy-paste cho Antigravity |
| ⭐ | Task có giá trị cao bất thường — làm trước nếu thiếu thời gian |
| ⛔ | Bất biến dễ bị phá trong task này |
| 🔁 | Task lặp lại nhiều lần (vd mỗi lần mở rộng từ điển thành phần) |
| 🔗 | Task chặn task khác — trễ là trễ dây |

---

# PHẦN 1 — NHÓM A: NỀN TẢNG TRI THỨC ✅ *(đã hoàn thành 21/10/2026)*

> Nhóm này đã xong. Lưu lại ở đây vì **hai lý do thực dụng**: ① để tái lập được toàn bộ dự án từ đầu nếu cần; ② để biết chính xác tài liệu nào sinh ra từ prompt nào, khi cần cập nhật tài liệu thì biết sửa prompt nào.

## ▸ A1 — Prompt gốc của dự án *(nguyên văn, đã lưu tại `Prompt-1.md`)*

**Bối cảnh khi dùng:** đầu vào là `PRD_BeautyAI_Tailored.md` (bản nháp v2.0) + `frontend_beautyai/` (prototype 13 trang). Đầu ra là 3 tài liệu + prototype cập nhật.

```text
Tôi muốn xây dựng một hệ thống "Nền Tảng Thương Mại Điện Tử Mỹ Phẩm Thông Minh &
Trợ Lý AI Chăm Sóc Da Cá Nhân Hóa (BeautyAI)" và các bản phác thảo sơ bộ về dự án
đính kèm:

* BRD: /Users/trung.huynh/Library/CloudStorage/Dropbox/Business/Projects/T.Uyen/PRD_BeautyAI_Tailored.md
* Prototype: /Users/trung.huynh/Library/CloudStorage/Dropbox/Business/Projects/T.Uyen/frontend_beautyai

Là một BA, SA và PM, hãy review, nghiên cứu các nền tảng đang có trên thị trường,
và phân tích, đánh giá và đề xuất các cập nhật nếu có. Output sẽ bao gồm:

1. Tài liệu yêu cầu hoàn chỉnh (Software requirement specification) và đầy đủ theo
tiêu chuẩn xây dựng phần mềm để cả business team, BA, developer, SA và PM đều có thể
đọc và hiểu dễ dàng. Xuất ra tài liệu
/Users/trung.huynh/Library/CloudStorage/Dropbox/Business/Projects/T.Uyen/BRD_BeautyAI_V1.0.md

2. Dựa vào tài liệu yêu cầu của bước (1), hãy xây dựng tài liệu giải pháp kỹ thuật
đầy đủ và chuẩn chỉnh của hệ thống (Web App) theo phát triển phần mềm và bao gồm ít
nhất các phần sau:
- Kiến trúc tổng quan của hệ thống
- Mô hình các component (các nhóm tính năng chính) đầy đủ của hệ thống
- Mô hình quan hệ hướng đối tượng (ORM) của hệ thống (sẽ được tham khảo để thiết kế database)
- Thiết kế của các business flow chính của hệ thống
- Các công nghệ của hệ thống (khuyến dùng .NET for backend và React for Frontend)
  và thêm vào tất cả những công nghệ cần thiết khác.
- AI Chatbot sẽ kết hợp predefine rules + pre AI model từ Gemini, và route sang Zalo
  user cho những câu hỏi chuyên sau và phức tạp.
- Mô hình CI/CD: deploy và test trên local host (Macbook), Github
- Framework sử dụng để phát triển software này: /Volumes/WOKRING/Projects/Syntheprise-framework
  kết hợp với Antigravity
- Authentication đơn giản với username và password lưu ở local database

Xuất tài liệu ra:
/Users/trung.huynh/Library/CloudStorage/Dropbox/Business/Projects/T.Uyen/Technical_Design_BeautyAI_V1.0.md

Tài liệu sẽ được tham khảo bởi SA, Dev team, BA và cả AI.

3. Dựa vào (1) và (2) Project plan lê kế hoạch đầy đủ để tôi và Antigravity Ai Code
Agent thực hiện solo dự án mỗi ngày ít nhất 4 giờ. Nên chia làm từng phase
- Thiết kế DB, project structure, kiến trúc dự án và các framework cần thiết
- Gom thành các phase cho cho các nhóm tính năng liên quan cho toàn hệ thống
- Testing và final Demo

Xuất tài liệu ra:
/Users/trung.huynh/Library/CloudStorage/Dropbox/Business/Projects/T.Uyen/Plan_BeautyAI_V1.0.md

4. Cập nhật prototype (các file html và các file liên quan ) nếu cần.

Hãy làm các việc 1,2,3,4 theo tuần tự.

Các tài liệu dùng toàn bộ là tiếng việt.
```

**Kết quả thực tế:**

| Đầu ra | Quy mô |
|---|---|
| `BRD_BeautyAI_V1.0.md` | 2.840 dòng · 126 FR có điều kiện chấp nhận · 70+ quy tắc nghiệp vụ |
| `Technical_Design_BeautyAI_V1.0.md` | 5.210 dòng · 12 ADR · 35 thực thể ORM · 35 bảng DDL |
| `Plan_BeautyAI_V1.0.md` | 1.354 dòng · 9 phase · 38 work group · 552 giờ |
| `frontend_beautyai/` | 13 → **17 trang** (4 trang mới) |

## ▸ A2 — Bốn quyết định đã làm lệch hướng so với bản nháp

> Khi cần giải thích vì sao V1.0 khác PRD v2.0, dùng bảng này. Chi tiết tại `BRD` §4.

| # | Phát hiện | Quyết định |
|---|---|---|
| **1** | "Safety Score 1–10" theo mô hình Yuka/EWG **sai về phương pháp khoa học** (chấm nguy hại mà bỏ qua nồng độ), **rủi ro pháp lý**, và là **điểm dễ bị chất vấn nhất** khi bảo vệ | ❌ Loại bỏ. Thay bằng **Điểm Phù Hợp 0–100 theo hồ sơ da từng người** + trạng thái pháp lý CosIng EU → `INV-01` |
| **2** | PRD ghi "Niacinamide + Vitamin C kỵ nhau" — **đây là huyền thoại đã bị phản bác** | Hệ thống **chủ động đính chính**, không cảnh báo. Sau rà soát bằng chứng, **chỉ 1 cặp đạt mức đỏ: Retinoid + Benzoyl Peroxide**, kèm sắc thái *Adapalene bền hơn Tretinoin* → `INV-03` |
| **3** | 8.494 sản phẩm Sephora là **hàng Mỹ, không có số công bố mỹ phẩm tại VN** | **Chiến lược danh mục hai lớp**: 200–400 SKU bán được (Lớp A) + toàn bộ cho lớp trí tuệ thành phần (Lớp B) |
| **4** | **Thiếu hoàn toàn phần tuân thủ pháp lý.** Hồ sơ da = dữ liệu nhạy cảm; gọi Gemini = chuyển dữ liệu xuyên biên giới; quy định quảng cáo cấm dùng hình ảnh/tên bác sĩ | **Ẩn danh hóa bắt buộc** (`INV-04`) · **bộ lọc tuân thủ ở đầu ra** (`INV-06`) · đổi nhân dạng trợ lý · 3 trang pháp lý |

## ▸ A3 — Bốn thay đổi kiến trúc so với bản nháp

| Hạng mục | PRD v2.0 | V1.0 | ADR |
|---|---|---|---|
| Backend | .NET + FastAPI song song | **Một backend .NET**, ML tính sẵn ngoại tuyến bằng Python | ADR-001 |
| Database | Supabase (cloud) | **PostgreSQL 17 Docker cục bộ** | ADR-002 |
| Xác thực | JWT | **Cookie httpOnly + PBKDF2** | ADR-004 |
| Báo cáo | Stored Procedure | SQL viết tay trong tệp có phiên bản | ADR-003 |

## ▸ A4 — Prompt tái tạo tài liệu khi cần cập nhật

Khi một tài liệu cần sửa lớn (không phải sửa vài dòng), **đừng viết lại từ đầu** — dùng prompt dưới đây để cập nhật có kiểm soát.

🤖 **Prompt cập nhật tài liệu:**

```text
Cập nhật tài liệu <TÊN TÀI LIỆU> theo thay đổi sau: <MÔ TẢ THAY ĐỔI>

Quy trình bắt buộc:
1. Đọc tài liệu hiện tại ĐẦY ĐỦ trước khi sửa.
2. Xác định MỌI mục bị ảnh hưởng — kể cả mục ở tài liệu KHÁC
   (BRD ↔ Technical_Design ↔ Plan tham chiếu chéo nhau rất nhiều).
3. Trước khi sửa, báo cho tôi danh sách: mục nào sửa, sửa gì, ảnh hưởng tới
   tài liệu nào khác. CHỜ tôi xác nhận.
4. Sau khi sửa, cập nhật:
   - Bảng lịch sử phiên bản
   - Mọi tham chiếu chéo tới mục vừa sửa
   - Ma trận truy xuất nếu thay đổi chạm vào FR/BR
5. Giữ nguyên tiếng Việt, giữ nguyên cách đánh mã (FR-*, BR-*, NFR-*, ADR-*, INV-*).

TUYỆT ĐỐI KHÔNG:
- Đổi mã định danh đã tồn tại (mã là bất biến, không tái sử dụng)
- Xóa một FR/BR — nếu không cần nữa thì đánh dấu DEPRECATED kèm lý do
- Thêm yêu cầu nghiệp vụ vào Technical_Design (vi phạm AGENTS.md §2.6)
- Thêm quyết định kiến trúc vào BRD
```

## ▸ A5 — Prompt cập nhật prototype

🤖 **Prompt:**

```text
Cập nhật prototype trong frontend_beautyai/ theo thay đổi: <MÔ TẢ>

Đọc trước:
- BRD_BeautyAI_V1.0.md §10 (yêu cầu giao diện) và §10.3 (danh sách màn hình)
- Technical_Design_BeautyAI_V1.0.md §10 (thiết kế frontend)
- frontend_beautyai/README.md (trạng thái hiện tại của prototype)

Nguyên tắc bắt buộc:
1. TÁI SỬ DỤNG hệ thống thiết kế trong css/style.css — KHÔNG phát minh token màu,
   spacing, radius mới. Mọi giá trị lấy từ :root. (ADR-007 · UI-03)
2. Mọi màn hình phải có đủ 4 trạng thái: đang tải · rỗng · lỗi · suy giảm. (UI-05)
3. Thông tin truyền bằng màu PHẢI có cách truyền thứ hai (chữ hoặc biểu tượng). (NFR-A11Y-02)
4. KHÔNG hiển thị bất kỳ chỉ số nào mang nghĩa "an toàn/nguy hiểm". (INV-01)
5. KHÔNG dùng từ: điều trị · chữa · trị mụn · trị nám · đặc trị · khỏi hẳn ·
   dứt điểm · hiệu quả 100% · tốt nhất · số 1. (INV-06)
   Ngoại lệ duy nhất: câu disclaimer ("không phải chẩn đoán, điều trị...").
6. Trợ lý AI KHÔNG được mang bất kỳ hàm ý nghề y nào — không "da liễu",
   không "chuyên gia", không avatar áo blouse trắng. (BR-AI-14)
7. Sao lưu tệp gốc vào _backup_truoc_cap_nhat/ trước khi sửa.

Sau khi sửa, TỰ KIỂM CHỨNG và báo kết quả:
- Phân tích cấu trúc HTML từng trang (thẻ mở/đóng khớp nhau)
- Kiểm tra mọi liên kết nội bộ trỏ tới tệp tồn tại
- node --check cho js/main.js và mọi khối <script> inline
- Grep danh sách từ bị cấm ở điểm 5 trên toàn bộ trang
- Grep "Safety Score", "EWG", "điểm an toàn" trên toàn bộ trang
```

---
# PHẦN 2 — NHÓM B: KHỞI TẠO DỰ ÁN

| | |
|---|---|
| **Phase** | P1 · `WG-P1-01`, `WG-P1-02`, `WG-P1-04` |
| **Giờ** | 24 (6 ngày) |
| **Kết quả** | Repo có cấu trúc Syntheprise đầy đủ · 12 ADR · CI 5 job xanh · **vòng đời change đã tập chạy** |
| **Đặc điểm** | 🔗 **Chặn toàn bộ dự án.** Không làm xong nhóm này thì không có nơi để code |

> 💡 **Vì sao nhóm này không phải "việc giấy tờ":** `AGENTS.md §0` quy định thứ tự ưu tiên tài liệu, và **Antigravity đọc chính các tệp đó** để sinh code. Tài liệu đặt sai lớp ⟹ agent đọc sai ngữ cảnh ⟹ code sai. Đây là **công việc cấu hình cho agent**.

---

## ▸ B1 — Khởi tạo repo từ Syntheprise Framework

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 6 | P1 | `WG-P1-01` | — |

🎯 **MỤC TIÊU** — Có một repo chạy được (`./scripts/build` và `./scripts/test` xanh) **trước khi** viết dòng code nghiệp vụ nào.

👤 **NGƯỜI LÀM** *(toàn bộ task này — agent chưa có repo để làm việc)*

```bash
# 1. Khởi tạo từ framework
cd /Volumes/WOKRING/Projects/Syntheprise-framework
./syntheprise blueprint list                 # xác nhận dotnet-react-rn có sẵn
./syntheprise new ../beautyai \
    --blueprint dotnet-react-rn \
    --tier 1 \
    --adapter all \
    --mode solo

# 2. Xác nhận bộ khung chạy được TRƯỚC khi làm gì khác
cd ../beautyai
./scripts/build && ./scripts/test            # phải XANH

# 3. Sinh adapter cho Antigravity + Claude Code + Codex
./syntheprise sync
./syntheprise sync --check                   # phải không báo sai lệch
```

**Giải thích bốn tham số:**

| Tham số | Giá trị | Vì sao |
|---|---|---|
| `--blueprint` | `dotnet-react-rn` | Khớp chính xác ràng buộc .NET + React. Blueprint đã được chứng nhận bằng build thật trên CI |
| `--tier` | `1` | Tier 0 bỏ traceability (mà `BRD` §15 cần); Tier 2 quá nặng cho một người. **Tier 1 = unit + contract/integration + traceability cho yêu cầu Must** |
| `--adapter` | `all` | Không khóa vào một công cụ — nếu sau này đổi agent vẫn dùng được |
| `--mode` | `solo` | Các vai BA/QA/Dev/SA **vẫn tồn tại**, chỉ nhịp thay đổi: cập nhật MASTER-PLAN sau mỗi lần archive change, không phải sau mỗi PR |

> ⚠️ **Kiểm trước khi chạy:** `README.md` của framework chỉ có ví dụ `--mode team`. `AGENTS.md §1` nói mode khai trong `.syntheprise-quality.yml` (`project.mode`, mặc định `team`). Chạy `./syntheprise new --help` để xác nhận cờ `--mode` tồn tại. Nếu **không có**, bỏ cờ đó và đặt `project.mode: solo` trong `.syntheprise-quality.yml` ở bước tiếp theo — kết quả tương đương.

**Tiếp theo, điền tay 4 tệp:**

1. `project-charter.md` — phạm vi · tier 1 · chủ sở hữu · tiêu chí thành công · **ghi rõ phần mobile React Native là chỗ dành sẵn cho V2, không phát triển ở V1.0**
2. `.syntheprise-quality.yml` — `project.mode: solo`, `coverage.line_threshold: 70`, `coverage.branch_threshold: 60`
3. `.env.example` — toàn bộ khóa, **không giá trị thật** (danh sách khóa ở `Technical_Design` §3.5)
4. `global.json` — ghim phiên bản .NET SDK

**Và tạo `docker-compose.yml`:**

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: beautyai
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?Đặt POSTGRES_PASSWORD trong .env}
      POSTGRES_DB: beautyai
    ports: ["5432:5432"]
    volumes: ["./data/pg:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U beautyai"]
      interval: 5s
      timeout: 3s
      retries: 10
```

✅ **XONG KHI**

```text
☐ ./scripts/build XANH
☐ ./scripts/test XANH
☐ ./syntheprise sync --check không báo sai lệch
☐ docker compose up -d postgres → pg_isready trả về "accepting connections"
☐ project-charter.md đã điền, nêu rõ mobile là chỗ dành sẵn cho V2
☐ .env trong .gitignore · .env.example có commit, không chứa giá trị thật
☐ git log có commit đầu tiên theo Conventional Commits
```

🔍 **KIỂM CHỨNG**

```bash
./scripts/build && ./scripts/test && ./syntheprise sync --check
docker compose exec -T postgres pg_isready -U beautyai
git check-ignore .env && echo "✓ .env đã bị ignore"
grep -c '=' .env.example    # phải > 0; và không dòng nào có giá trị thật
```

⛔ **KHÔNG ĐƯỢC**

- **Xóa thư mục mobile React Native** — sẽ phá cấu trúc blueprint đã được chứng nhận. Giữ nguyên, không phát triển.
- **Sửa tay** `CLAUDE.md`, `.claude/commands/`, `.codex/prompts/` — đây là tệp **sinh tự động** bởi `syntheprise sync`. Sửa nguồn ở `.agents/` và `AGENTS.md` rồi chạy lại sync.
- Bắt đầu viết code khi `./scripts/test` còn đỏ.

---

## ▸ B2 — Chạy `/kickoff` để biến intake thành tài liệu canonical ⭐🔗

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 8 | P1 | `WG-P1-02` | B1 |

🎯 **MỤC TIÊU** — Ba tài liệu lớn (BRD · Technical_Design · Plan) được tách và đặt vào **đúng lớp precedence** trong repo, để Antigravity đọc đúng ngữ cảnh ở mọi task sau.

> ⭐ **Dùng workflow `/kickoff` của framework, không viết quy trình riêng.**
> `AGENTS.md §5` ghi rõ đường đi: `syntheprise new` → điền `docs/_intake/` → `syntheprise kickoff`. Workflow `.agents/workflows/kickoff.md` tồn tại chính xác cho việc này — nó là "nửa sau có AI hỗ trợ của `syntheprise new`", theo đúng khẩu hiệu *"AI drafts, humans decide"*. Viết một quy trình trích xuất riêng là **bỏ qua công cụ có sẵn** và mất phần phê duyệt của người mà `/kickoff` đã thiết kế.

👤 **NGƯỜI LÀM** — Ba việc, theo thứ tự:

```bash
# 1. Đọc hướng dẫn intake của framework
cat docs/_intake/README.md
cat docs/_guides/18-project-initializer.md

# 2. Sao chép 3 tài liệu vào intake inbox
cp /Users/trung.huynh/Library/CloudStorage/Dropbox/Business/Projects/T.Uyen/{BRD,Technical_Design,Plan}_BeautyAI_V1.0.md \
   docs/_intake/

# 3. Điền các tệp intake mà README.md yêu cầu
#    (requirements-brief · tech-stack-notes · domain-rules-notes
#     · constraints · integrations · ui-ux/)
#    → với BeautyAI, mỗi tệp này chỉ cần TRỎ tới mục tương ứng
#      trong 3 tài liệu trên, không cần viết lại nội dung
```

🤖 **PROMPT**

```text
Chạy workflow /kickoff.

ĐỌC TRƯỚC (bắt buộc, theo thứ tự):
1. .agents/rules/safety.md          ← lớp 0, thẩm quyền cao nhất
2. .agents/rules/change-management.md
3. core-principles.md
4. AGENTS.md — đặc biệt §0 (thang arbitration) và §6 (taxonomy docs/)
5. .agents/workflows/kickoff.md     ← workflow bạn sẽ thực thi
6. docs/_intake/README.md
7. docs/_intake/BRD_BeautyAI_V1.0.md
8. docs/_intake/Technical_Design_BeautyAI_V1.0.md
9. docs/_intake/Plan_BeautyAI_V1.0.md

Thực thi các bước của kickoff.md. Bảng dưới là ĐÍCH mà kickoff phải đạt
cho dự án này — dùng nó làm bản đồ, nhưng tuân theo quy trình và các
điểm dừng-chờ-phê-duyệt của kickoff.md:

Từ BRD (lớp 3 — Requirements):
  §8 + §12          → requirements.md  +  docs/_requirements/M01.md … M15.md
  §7 + §17.2        → docs/domain-rules.md                       (lớp 4)
  §15               → docs/traceability.md  (bộ khung, chưa điền bằng chứng)
  §1.4              → docs/glossary.md
  §3                → docs/_research/market-benchmark-2026-10.md (lớp 6)
  §16               → docs/_review/risk-register.md

Từ Technical_Design (lớp 2 — Contracts):
  §1–4              → docs/architecture.md
  §2 (12 ADR)       → docs/adr/ADR-001....md … ADR-012....md  (MỖI ADR MỘT TỆP)
  §5–6              → docs/data-contracts.md + docs/db-schema/schema.sql
  §7                → docs/api-contract.md
  §9                → docs/llm-policy.md          ← BẮT BUỘC vì dự án có LLM
  §10               → docs/design-system.md
  §11               → docs/security-policy.md
  §12               → docs/tech-stack.md
  §15               → docs/deployment-runbook.md
  §16               → docs/observability-runbook.md
  §17               → docs/testing-strategy.md
  §17 (quản trị QA) → docs/qa-governance.md          ← AGENTS.md §5 context map
  §17.5 (mẫu)       → docs/test-matrix-template.md   ← AGENTS.md §5 context map
  §4.4 (12 bất biến)→ giữ trong docs/architecture.md, KHÔNG nhân bản
                       (playbook chỉ tham chiếu, không là nguồn)

Từ Plan (lớp 5 — Working memory):
  §2                → docs/_plans/MASTER-PLAN.md
  §3–11             → docs/_plans/P1/PHASE-PLAN.md … P9/PHASE-PLAN.md
                       + một WG-P<n>-<NN>.md cho mỗi work group
  §10 (UI/UX)       → docs/_ui-ux_design/  (artifact có phiên bản;
                       xem README của thư mục + .agents/rules/ui-ux-standards.md)

Playbook (lớp 6):
  Playbook_BeautyAI_V1.0.md → docs/_guides/90-beautyai-playbook.md

QUY TẮC BẮT BUỘC:
1. Mỗi tệp giữ frontmatter YAML chuẩn của framework: doc · title · status ·
   precedence · owner · last_reviewed. Lấy mẫu từ tệp template có sẵn trong repo.
2. GIỮ NGUYÊN mọi mã định danh: FR-* · BR-* · NFR-* · DC-* · DQ-* · CMP-* ·
   INV-* · ADR-* · RISK-* · GC-*. Mã là BẤT BIẾN.
3. Dùng tham chiếu chéo, KHÔNG nhân bản nội dung. Nếu requirements.md cần nhắc
   một quy tắc, nó LINK tới docs/domain-rules.md, không copy nội dung.
4. KHÔNG đưa kiến trúc vào requirements.md. KHÔNG đưa yêu cầu nghiệp vụ vào
   docs/architecture.md. (AGENTS.md §2.6)
5. Mọi thư mục trong taxonomy AGENTS.md §6 PHẢI tồn tại, kể cả khi còn rỗng —
   tạo .gitkeep nếu cần.

SAU KHI XONG, báo cho tôi:
- Bảng: mục nguồn → tệp đích → số dòng
- Danh sách mã định danh đã trích (đếm theo loại: bao nhiêu FR, bao nhiêu BR...)
- Kết quả ./syntheprise gate
- Bất kỳ mục nào trong 3 tài liệu mà bạn KHÔNG biết đặt vào đâu → liệt kê riêng,
  ĐỪNG tự đoán.
```

✅ **XONG KHI**

```text
☐ requirements.md có đủ 126 FR, mỗi FR giữ nguyên mã và điều kiện chấp nhận
☐ docs/_requirements/ có 15 tệp module M01…M15
☐ docs/domain-rules.md có đủ 70+ BR-* và bảng 12 quy tắc xung đột (§17.2 của BRD)
☐ docs/adr/ có đúng 12 tệp ADR-001 … ADR-012
☐ docs/llm-policy.md tồn tại (bắt buộc — dự án có LLM)
☐ docs/_plans/ có MASTER-PLAN.md + 9 thư mục P1…P9 + 38 tệp WG
☐ Mọi thư mục trong taxonomy AGENTS.md §6 tồn tại
☐ ./syntheprise gate XANH (gồm kiểm tra doc-drift)
```

🔍 **KIỂM CHỨNG**

```bash
./syntheprise gate
python scripts/doctor.py --quality-gate

# Đếm mã định danh — so với số liệu trong BRD
grep -roh 'FR-[A-Z]*-[0-9]*' requirements.md docs/_requirements/ | sort -u | wc -l   # ≈126
grep -roh 'BR-[A-Z]*-[0-9]*' docs/domain-rules.md | sort -u | wc -l                  # ≈70
ls docs/adr/*.md | wc -l                                                              # =12
ls docs/_plans/P*/WG-*.md | wc -l                                                     # =38

# Kiểm tra phân tầng không bị lẫn
grep -niE 'PostgreSQL|EF Core|Docker|cookie httpOnly' requirements.md \
  && echo "⚠️ CÓ KIẾN TRÚC LẪN VÀO REQUIREMENTS — phải sửa" \
  || echo "✓ requirements.md sạch kiến trúc"
```

⛔ **KHÔNG ĐƯỢC**

- Đổi bất kỳ mã định danh nào. Mã là bất biến — nếu đổi, mọi tham chiếu chéo giữa 3 tài liệu sẽ vỡ.
- Copy nội dung giữa các tệp thay vì link. Nội dung trùng lặp sẽ **trôi khỏi nhau** và tạo hai nguồn chân lý.
- Đưa chi tiết lưu trữ / xác thực / triển khai vào `requirements.md`.

---

## ▸ B3 — Viết 12 ADR thành 12 tệp riêng

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 2 | P1 | `WG-P1-02` | B2 |

🎯 **MỤC TIÊU** — Mỗi quyết định kiến trúc có một tệp ADR độc lập, để sau này sửa một quyết định không phải đọc cả tài liệu 5.000 dòng.

🤖 **PROMPT**

```text
Tách §2 của docs/_intake/Technical_Design_BeautyAI_V1.0.md thành 12 tệp ADR riêng
trong docs/adr/.

Đặt tên: ADR-<số>-<slug-ngắn>.md
  ADR-001-single-backend-offline-ml.md
  ADR-002-postgresql-local-docker.md
  ADR-003-efcore-dapper-no-stored-procedure.md
  ADR-004-cookie-auth-pbkdf2.md
  ADR-005-ai-seven-stage-pipeline.md
  ADR-006-zalo-deeplink-handoff.md
  ADR-007-keep-prototype-design-system.md
  ADR-008-openapi-generated-dto.md
  ADR-009-no-redis-mq-hangfire-tier1.md
  ADR-010-order-snapshot.md
  ADR-011-suitability-score-computed-on-read.md
  ADR-012-string-product-id.md

Mỗi tệp có cấu trúc:
---
doc: adr-<số>
title: <Tiêu đề quyết định>
status: accepted
precedence: 2
owner: SA / Tech Lead
last_reviewed: 2026-10-21
---

# ADR-<số> — <Tiêu đề>

## Trạng thái
Đã chấp nhận · 2026-10-21

## Bối cảnh
<vì sao phải quyết định — gồm ràng buộc liên quan>

## Các phương án đã xét
<bảng so sánh — GIỮ NGUYÊN bảng từ Technical_Design §2>

## Quyết định
<chọn gì>

## Lý do
<đánh số, giữ nguyên lập luận gốc>

## Hệ quả
<gồm cả hệ quả tiêu cực và điều kiện để xem lại quyết định>

## Bất biến phát sinh
<liên kết tới INV-* nếu ADR này sinh ra một bất biến>

QUY TẮC:
- GIỮ NGUYÊN toàn bộ lập luận và bảng so sánh — không rút gọn.
  ADR tồn tại để người sau hiểu VÌ SAO, nên phần lý do là phần quan trọng nhất.
- Mỗi ADR ghi rõ "điều kiện để xem lại quyết định này" trong mục Hệ quả.
  Ví dụ ADR-009: "xem lại khi có hơn 1 phiên bản ứng dụng chạy song song".
- Nếu ADR nào trong Technical_Design §2 thiếu mục nào, BÁO cho tôi, đừng tự bịa.
```

✅ **XONG KHI** — 12 tệp tồn tại · mỗi tệp có đủ 7 mục · mỗi ADR có "điều kiện xem lại" · `./syntheprise gate` xanh.

---

## ▸ B4 — Test kiến trúc & CI 5 job ⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 6 | P1 | `WG-P1-04` | B1 |

🎯 **MỤC TIÊU** — Biến các quyết định kiến trúc từ *lời trong tài liệu* thành **ràng buộc máy thực thi được**, và CI chặn merge khi vi phạm.

> ⭐ **Vì sao task này đáng làm sớm:** quyết định kiến trúc **sẽ bị xói mòn theo thời gian** nếu chỉ nằm trong tài liệu. Một agent đọc PRD cũ, hoặc chính bạn 3 tháng sau, sẽ thêm `safety_score` vào vì "chắc thiếu". Test kiến trúc là thứ duy nhất ngăn được điều đó.

🤖 **PROMPT**

```text
Tạo dự án tests/BeautyAI.ArchitectureTests và cấu hình GitHub Actions.

ĐỌC TRƯỚC:
- docs/architecture.md §3.3 (quy tắc phụ thuộc giữa 4 project)
- docs/tech-stack.md (danh sách thư viện ĐƯỢC và KHÔNG ĐƯỢC dùng)
- docs/testing-strategy.md
- .agents/rules/provider-abstraction.md
- Technical_Design §15.3 (định nghĩa 5 job CI)

PHẦN 1 — Test kiến trúc (dùng NetArchTest hoặc tương đương):

Bài 1 · DomainHasNoDependenciesTests
  BeautyAI.Domain.csproj KHÔNG có PackageReference nào.
  Lý do: Domain phải thuần C#, kiểm thử được không cần hạ tầng.

Bài 2 · ApplicationDoesNotReferenceEfCoreTests
  BeautyAI.Application KHÔNG tham chiếu Microsoft.EntityFrameworkCore.
  Application chỉ biết interface I*Repository, không biết EF Core tồn tại.

Bài 3 · ApplicationDoesNotReferenceAspNetTests
  BeautyAI.Application KHÔNG tham chiếu Microsoft.AspNetCore.* hay HttpContext.
  Lý do: nghiệp vụ không được phụ thuộc HTTP.

Bài 4 · ProviderLibrariesOnlyInAdapterLayerTests
  HttpClient và mọi thư viện nhà cung cấp CHỈ xuất hiện trong
  BeautyAI.Infrastructure/Providers/. Thực thi .agents/rules/provider-abstraction.md.

Bài 5 · NoSafetyScoreAnywhereTests  ← QUAN TRỌNG NHẤT
  Quét toàn bộ assembly, KHÔNG thuộc tính nào có tên chứa (không phân biệt hoa/thường):
    SafetyScore · SafetyRating · HazardScore · DangerLevel · ToxicityScore · SafetyLevel
  Thông điệp lỗi phải giải thích rõ:
    "INV-01: BeautyAI KHÔNG chấm điểm an toàn/nguy hiểm (xem docs/adr/ và
     BRD §4.3 G-01). Dùng SuitabilityScore (phù hợp với hồ sơ da) thay thế."

Bài 6 · ForbiddenPackagesTests
  KHÔNG có PackageReference tới: AutoMapper · MediatR · Hangfire · Quartz ·
  StackExchange.Redis. Mỗi thư viện này đã có quyết định loại bỏ trong
  docs/tech-stack.md và docs/adr/ADR-009.

PHẦN 2 — GitHub Actions (.github/workflows/quality-gate.yml), 5 job:

job backend:        setup-dotnet (đọc global.json) · service container postgres:17 ·
                    restore · build -warnaserror · test --collect coverage ·
                    scripts/check-coverage.py --line 70 --branch 60 ·
                    chạy riêng ArchitectureTests và GoldenTests
job frontend:       setup-node 22 · npm ci · typecheck · lint · test · build
job openapi-drift:  build API · export openapi.json · npx openapi-typescript ·
                    diff với src/frontend/src/api/schema.d.ts · FAIL nếu khác
                    (thông điệp lỗi phải nói: "Chạy npm run gen:api")
job security:       gitleaks · dotnet list package --vulnerable · FAIL nếu có lỗ hổng
job syntheprise:    ./syntheprise gate · ./syntheprise sync --check ·
                    scripts/check-change-completeness.py (chỉ với pull_request)

Trigger: push và pull_request.

TUYỆT ĐỐI KHÔNG:
- Tắt hoặc nới bất kỳ test kiến trúc nào để build xanh. Test đỏ nghĩa là
  code sai, không phải test sai.
- Thêm -warnaserror:false.
- Hạ ngưỡng coverage xuống dưới 70/60.
```

✅ **XONG KHI**

```text
☐ 6 test kiến trúc PASS
☐ Thử thêm tay thuộc tính "SafetyScore" vào một entity → Bài 5 PHẢI ĐỎ
   (test bằng cách thêm, chạy test, xác nhận đỏ, rồi xóa đi)
☐ Thử thêm PackageReference AutoMapper → Bài 6 PHẢI ĐỎ (rồi xóa đi)
☐ 5 job CI xanh trên nhánh main
☐ Đẩy một commit cố ý sai (vd đổi schema.d.ts) → job openapi-drift PHẢI ĐỎ
```

🔍 **KIỂM CHỨNG**

```bash
dotnet test tests/BeautyAI.ArchitectureTests
gh run list --limit 1 --json conclusion,name   # phải success
```

> 💡 **Mẹo kiểm chứng test:** một test chỉ đáng tin khi bạn đã **thấy nó đỏ**. Hai bước "thử thêm tay rồi xóa đi" ở trên không phải thủ tục — đó là cách duy nhất biết test thực sự hoạt động.

---

## ▸ B5 — Vòng đời change & worktree isolation ⭐⭐🔗

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 4 | P1 | `WG-P1-04` | B1 |

🎯 **MỤC TIÊU** — Thiết lập và **tập chạy một lần** vòng đời change + worktree, trước khi nó trở thành thói quen sai.

> ⭐⭐ **Vì sao task này tồn tại:** `AGENTS.md` Rule 7 (change folder) và Rule 12 (worktree isolation) đều là **bất biến có hook enforce** — `scripts/check-worktree-isolation.py` chạy ở pre-commit và `scripts/check-change-completeness.py` chạy ở CI trên pull request. Nếu không tập ở đây, bạn sẽ gặp chúng lần đầu vào giữa task C1, lúc đang tập trung vào việc khác.

🤖 **PROMPT**

```text
Thiết lập và kiểm chứng vòng đời change + worktree isolation.

ĐỌC TRƯỚC (bắt buộc, theo thứ tự — lớp 0 trước):
1. .agents/rules/safety.md              ← protected actions
2. .agents/rules/change-management.md   ← nguồn chính của Rule 7
3. .agents/rules/worktree-isolation.md  ← nguồn chính của Rule 12
4. AGENTS.md §2 rule 7 và rule 12 · §4 (Change/Delta Spec) · §7 (DoD close-out)
5. .agents/workflows/change-propose.md
6. docs/_changes/CHANGE-template/  (đọc từng tệp mẫu)
7. docs/_guides/08-syntheprise-cli.md

PHẦN 1 — Xác nhận hạ tầng tồn tại:
  ls docs/_changes/CHANGE-template/     → proposal · requirements-delta
                                           · design · test-plan · tasks · review
  ls docs/_changes/_archive/            → phải tồn tại (có .gitkeep nếu rỗng)
  ls docs/_dashboard/                   → phải tồn tại
  ls docs/_ui-ux_design/                → phải tồn tại
  ls scripts/check-worktree-isolation.py scripts/check-change-completeness.py
                                        → phải tồn tại
  python scripts/doctor.py --quality-gate
     → xác nhận KHÔNG báo thiếu thư mục nào trong taxonomy AGENTS.md §6

  Thiếu thư mục nào → tạo + .gitkeep, rồi chạy lại doctor.py.

PHẦN 2 — Ghi bảng quyết định change cho BeautyAI vào
  docs/_guides/91-beautyai-change-policy.md:

  | Đơn vị mở change | một change folder cho MỖI WORK GROUP (38 folder) |
  | Loại mặc định    | FASTLANE |
  | Khi nào CHANGE   | khi phải sửa tài liệu lớp 2 (contracts) hay lớp 3/4 |
  | Khi nào BUGFIX   | sửa lỗi của hành vi đã bàn giao (Phase 9+) |
  | Quy ước CHANGE-ID| <WG-id>-<slug-ngắn>, vd WG-P1-03-db-schema |
  | Tier             | 1 ⟹ change-propose.md bước 5 BẮT BUỘC dừng chờ phê duyệt |

  Ghi rõ: 7 tiêu chí của Rule 7, và nhận định rằng với BeautyAI gần như
  mọi work group thỏa ít nhất một tiêu chí ⟹ mặc định là CÓ change folder.

PHẦN 3 — TẬP CHẠY MỘT VÒNG ĐẦY ĐỦ (đây là phần quan trọng nhất):
  Dùng chính work group B làm bài tập — nó đã xong, nên an toàn để tập.

  1. ./syntheprise worktree create chore/wg-p1-04-change-lifecycle
  2. ./syntheprise change new "WG-P1-04 change lifecycle" --type FASTLANE
  3. Điền proposal.md và requirements-delta.md (dùng ADDED/MODIFIED/
     REMOVED/DEPRECATED)
  4. DỪNG — báo cho tôi phê duyệt (Tier 1 bắt buộc)
  5. Sau phê duyệt: commit phần việc của B5
  6. ./syntheprise gate  +  workflow /test-gate
     ⚠️ /test-gate là WORKFLOW, không phải subcommand của ./syntheprise.
        AGENTS.md rule 10 yêu cầu CẢ HAI xanh.
  7. ./syntheprise close-out → thực hiện ĐÚNG 4 bước thứ tự của DoD §7:
       a. Cập nhật worklog trong docs/_plans/P1/WG-P1-04.md
          + viết docs/_states/state_<YYYY-MM-DD>_<slug>.md
          ⚠️ Snapshot phải nằm trong CÙNG commit với archive — nguyên tử,
             không bao giờ là một PR đuôi.
       b. git mv docs/_changes/<CHANGE-ID>/ → docs/_changes/_archive/
          + merge delta đã chấp nhận vào tài liệu canonical
       c. Xóa branch (local + remote) · git worktree remove
          · xác nhận checkout chính đang ở main và đã pull
       d. Đánh dấu change CLOSED · ./syntheprise close-out --release

PHẦN 4 — Thêm vào CI (nếu B4 chưa có):
  job syntheprise phải gồm:
    ./syntheprise gate
    ./syntheprise sync --check
    python scripts/check-change-completeness.py   (chỉ với pull_request)
    python scripts/check-worktree-isolation.py
    python scripts/doctor.py --quality-gate

TUYỆT ĐỐI KHÔNG:
- Commit trực tiếp trên checkout chính (branch main) — Rule 12.
  Mọi task có bước ghi git chạy trong worktree riêng.
- Archive change folder TRƯỚC khi state snapshot tồn tại.
  DoD §7: "Never archive/cleanup/persist-memory before the state snapshot
  exists. The snapshot is a gate for the archive step."
- Chạy hai phiên close-out đồng thời trên cùng checkout — phải serialize
  qua session lock.
- Dùng SYNTHEPRISE_ALLOW_PRIMARY_BRANCH=1 để đi đường tắt. Đó là cửa
  thoát của chủ sở hữu cho tình huống ngoại lệ, không phải quy trình.
- Hiện thực một thay đổi không tầm thường mà không có change folder
  (change-propose.md: "Forbidden").
```

✅ **XONG KHI**

```text
☐ docs/_changes/CHANGE-template/ · _archive/ · _dashboard/ · _ui-ux_design/
  — tất cả tồn tại
☐ python scripts/doctor.py --quality-gate KHÔNG báo thiếu thư mục
☐ docs/_guides/91-beautyai-change-policy.md ghi rõ bảng quyết định
☐ ĐÃ CHẠY TRỌN MỘT VÒNG: worktree → change new → phê duyệt → gate
  → /test-gate → close-out 4 bước → archive → cleanup → --release  ← bắt buộc
☐ docs/_changes/_archive/ có đúng 1 change folder sau bài tập
☐ docs/_states/ có snapshot tên ĐÚNG định dạng state_<YYYY-MM-DD>_<slug>.md
☐ Thử commit trên main → pre-commit hook CHẶN (rồi hoàn tác)  ← kiểm chứng thật
☐ Checkout chính đang ở main, sạch, đã pull
☐ job syntheprise ở CI gồm đủ 5 lệnh
```

🔍 **KIỂM CHỨNG**

```bash
python scripts/doctor.py --quality-gate
ls docs/_changes/CHANGE-template/ docs/_changes/_archive/
ls docs/_states/state_20*.md                    # định dạng ISO
git branch --show-current                        # phải là main
git status --porcelain                            # phải rỗng
git worktree list                                 # chỉ còn checkout chính

# Kiểm chứng hook thật sự chặn
git switch main && echo "test" >> README.md && git add README.md
git commit -m "test: phai bi chan" && echo "⚠️ HOOK KHÔNG CHẶN" || echo "✓ Hook chặn đúng"
git checkout -- README.md
```

⛔ **KHÔNG ĐƯỢC** — Bỏ Phần 3. Đọc quy trình không giống chạy quy trình; vòng close-out có 4 bước có thứ tự và một cổng (snapshot trước archive) mà chỉ chạy thật mới nhớ được.

---

## 📋 Danh mục kiểm tra kết thúc NHÓM B

```text
☐ ./scripts/build · ./scripts/test · ./syntheprise gate — tất cả XANH
☐ Workflow /test-gate XANH (riêng với ./syntheprise gate — AGENTS.md rule 10)
☐ python scripts/doctor.py --quality-gate XANH
☐ 12 ADR trong docs/adr/, mỗi tệp có "điều kiện xem lại quyết định"
☐ 126 FR trong requirements.md + docs/_requirements/ (giữ nguyên mã)
☐ 70+ BR trong docs/domain-rules.md + bảng 12 quy tắc xung đột
☐ docs/qa-governance.md · docs/test-matrix-template.md tồn tại
☐ 38 tệp WG trong docs/_plans/
☐ Mọi thư mục taxonomy AGENTS.md §6 tồn tại (gồm _changes · _dashboard
  · _ui-ux_design · _review · _research)
☐ 6 test kiến trúc PASS — đã kiểm chứng bằng cách làm chúng đỏ có chủ đích
☐ 5 job CI xanh
☐ Đã tập trọn một vòng change + close-out (B5 Phần 3)
☐ Ảnh chụp trạng thái: docs/_states/state_<YYYY-MM-DD>_nhom-b-xong.md
```

---

# PHẦN 3 — NHÓM C: DỮ LIỆU & CƠ SỞ DỮ LIỆU

| | |
|---|---|
| **Phase** | P1 · `WG-P1-03`, `WG-P1-05`→`08` |
| **Giờ** | 52 (13 ngày) |
| **Kết quả** | DB có **dữ liệu sạch đã kiểm tra chất lượng** — nền tảng của toàn bộ giá trị sản phẩm |
| **Rủi ro xử lý** | `RISK-05` (xuất xứ danh mục) · `RISK-06` (khối lượng từ điển) · `RISK-13` (chất lượng bóc tách INCI) |

> ⭐⭐ **Nhóm này là nhóm quan trọng nhất và dễ bị đánh giá thấp nhất của toàn dự án.**
> 52 giờ, trong đó **~26 giờ là việc người không giao được cho agent**: biên soạn diễn giải thành phần, chọn danh mục Lớp A, xác minh nguồn quy tắc xung đột.
> **Không có từ điển thành phần ⟹ không có phân tích INCI ⟹ không có USP ⟹ chỉ còn là một sàn TMĐT bình thường.**

---

## ▸ C1 — Lược đồ DB & Migration 🔗

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 10 | P1 | `WG-P1-03` | B2 |

🎯 **MỤC TIÊU** — 35 bảng · 38 index · 40+ ràng buộc `CHECK` tồn tại trong DB, sinh ra từ migration.

🤖 **PROMPT**

```text
Tạo mô hình dữ liệu và migration đầu tiên.

ĐỌC TRƯỚC (bắt buộc, đọc HẾT, không đọc lướt):
- docs/data-contracts.md — 35 thực thể, thuộc tính, quan hệ, hành vi khi xóa
- docs/db-schema/schema.sql — DDL tham chiếu đã rà soát
- docs/architecture.md §3.3 — quy tắc phụ thuộc giữa 4 project
- docs/domain-rules.md — các DC-01…DC-22 (ràng buộc dữ liệu)

LÀM THEO ĐÚNG THỨ TỰ:

Bước 1 — Tạo 4 project .NET theo docs/architecture.md:
  src/BeautyAI.Domain/           (KHÔNG PackageReference nào)
  src/BeautyAI.Application/      (chỉ tham chiếu Domain)
  src/BeautyAI.Infrastructure/   (tham chiếu Domain + Application)
  src/BeautyAI.Api/              (tham chiếu cả ba)

Bước 2 — Viết entity trong BeautyAI.Domain/Entities/:
  THUẦN C#. KHÔNG Data Annotation. KHÔNG using Microsoft.EntityFrameworkCore.
  Enum trong Domain/Enums/. Value object trong Domain/ValueObjects/
  (Money · OrderCode · HandoffCode · Address).

Bước 3 — Viết cấu hình Fluent API trong
  Infrastructure/Persistence/Configurations/, MỘT TỆP MỘT ENTITY,
  dùng IEntityTypeConfiguration<T>.
  Lý do tách tệp: dễ review trong PR, và giữ Domain sạch khỏi EF Core.

Bước 4 — Migration extension TRƯỚC migration bảng:
  CREATE EXTENSION citext, unaccent, pg_trgm
  + hàm vn_normalize(text)

  ⚠️ ĐIỂM CỰC DỄ SAI: unaccent() dạng MỘT tham số KHÔNG phải IMMUTABLE,
  nên KHÔNG dùng được trong index. PHẢI viết dạng HAI tham số:

    CREATE OR REPLACE FUNCTION vn_normalize(txt text)
    RETURNS text AS $$
      SELECT lower(public.unaccent('public.unaccent', coalesce(txt, '')))
    $$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

  Nếu làm sai, CREATE INDEX báo lỗi "functions in index expression must be
  marked IMMUTABLE" và rất khó đoán nguyên nhân.

Bước 5 — Migration InitialCreate với đủ 35 bảng.
  Sau khi sinh, ĐỐI CHIẾU TỪNG DÒNG với docs/db-schema/schema.sql.
  Đặc biệt kiểm 4 ràng buộc bất biến ở tầng dữ liệu:
    ck_cr_tier_severity  — cấp B/C không được mức CAO        (INV-03)
    ck_hr_consent        — không đồng ý thì không lưu hồ sơ da
    ck_products_stock    — tồn kho >= 0                      (INV-02)
    ck_ar_thresholds     — luật mua kèm phải đạt ngưỡng

Bước 6 — Cấu hình chuẩn (áp dụng cho MỌI entity):
  • DateTimeOffset → timestamptz (BR-DATA-02, UTC)
  • Enum → varchar + ràng buộc CHECK, KHÔNG lưu số
    (lý do: đọc được trực tiếp trong DB, thêm giá trị mới không phá dữ liệu cũ)
  • Email → kiểu citext (BR-AUTH-01)
  • Dữ liệu bán cấu trúc → jsonb
  • Product có RowVersion (xmin) để phát hiện xung đột cập nhật đồng thời
  • KHÔNG Lazy Loading — dùng Include tường minh
  • AsNoTracking() là mặc định cho query đọc
  • Index khai báo trong Fluent API, KHÔNG chỉ trong SQL tay
    (để migration mang theo index, tránh lệch giữa môi trường)

Bước 7 — Viết tests/BeautyAI.IntegrationTests/Persistence/SchemaConstraintTests.cs
  dùng Testcontainers PostgreSQL 17. MỖI ràng buộc CHECK có một test
  cố ý chèn dữ liệu sai và kỳ vọng DB TỪ CHỐI.

TUYỆT ĐỐI KHÔNG:
- Thêm cột safety_score hay bất kỳ tên nào mang nghĩa an toàn/nguy hiểm  (INV-01)
- Đổi products.product_id sang số tự tăng — phải giữ VARCHAR(50) mã gốc  (ADR-012)
- Bỏ bất kỳ ràng buộc CHECK nào vì "EF Core không hỗ trợ trực tiếp" —
  dùng migrationBuilder.Sql() nếu cần
- Dùng dấu nháy KÉP cho giá trị mặc định chuỗi. Trong PostgreSQL nháy kép là
  tên đối tượng. Phải là DEFAULT 'CUSTOMER', không phải DEFAULT "CUSTOMER".
  (Đây là lỗi thật trong bản nháp PRD v2.0 — xem BRD §4.3 G-06)

SAU KHI XONG, báo:
- Số bảng · số index · số ràng buộc CHECK thực tế trong migration
- Danh sách thực thể trong docs/data-contracts.md mà bạn KHÔNG tạo được và vì sao
- Kết quả dotnet test tests/BeautyAI.IntegrationTests
```

✅ **XONG KHI**

```text
☐ dotnet ef database update → 35 bảng tồn tại
☐ 38 index tồn tại (đếm trong pg_indexes)
☐ 40+ ràng buộc CHECK tồn tại
☐ SchemaConstraintTests PASS — mỗi CHECK có test chèn dữ liệu sai và bị từ chối
☐ Test kiến trúc Bài 1 vẫn PASS (Domain không có PackageReference)
☐ Thử tạo quy tắc xung đột cấp B với mức CAO → DB TỪ CHỐI (INV-03)
☐ Thử UPDATE tồn kho thành -1 → DB TỪ CHỐI (INV-02)
☐ Migration áp dụng được từ DB RỖNG (xóa data/pg rồi chạy lại)
```

🔍 **KIỂM CHỨNG**

```bash
docker compose down -v && docker compose up -d postgres && sleep 5
dotnet ef database update --project src/BeautyAI.Infrastructure --startup-project src/BeautyAI.Api

docker compose exec -T postgres psql -U beautyai -d beautyai -c "
SELECT 'bảng' loai, count(*) FROM information_schema.tables WHERE table_schema='public'
UNION ALL SELECT 'index', count(*) FROM pg_indexes WHERE schemaname='public'
UNION ALL SELECT 'check', count(*) FROM information_schema.table_constraints
          WHERE constraint_type='CHECK' AND constraint_schema='public';"

# INV-01 — không cột nào mang nghĩa an toàn
docker compose exec -T postgres psql -U beautyai -d beautyai -c "
SELECT table_name||'.'||column_name FROM information_schema.columns
WHERE column_name ILIKE '%safety%' OR column_name ILIKE '%hazard%';"   # phải RỖNG

dotnet test tests/BeautyAI.IntegrationTests
```

⛔ **KHÔNG ĐƯỢC** — Xem mục "TUYỆT ĐỐI KHÔNG" trong prompt. Bốn điều đó là bất biến, không phải khuyến nghị.

---

## ▸ C2 — Đường ống dữ liệu: danh mục & chọn Lớp A ⭐👤

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 10 (trong đó **4 giờ là việc người**) | P1 | `WG-P1-05` | C1 |

🎯 **MỤC TIÊU** — Có `products.csv` đã gắn nhãn hai lớp: **200–400 sản phẩm Lớp A bán được** + phần còn lại là Lớp B tham khảo.

> 🔑 **Đây là xử lý trực tiếp cho `RISK-05`** — lỗ hổng lớn nhất nếu không xử lý. Dữ liệu Sephora là hàng Mỹ, phần lớn không có số công bố mỹ phẩm tại Việt Nam. Trình bày như danh mục bán được là điều mà bất kỳ người thẩm định có kinh nghiệm cũng sẽ chỉ ra.

🤖 **PROMPT (phần agent làm — 6 giờ)**

```text
Tạo tools/data-pipeline/ và script 01_extract_catalog.py + 08_download_images.py.

ĐỌC TRƯỚC:
- Technical_Design §14.2 (đặc tả từng script)
- BRD §4.4 (chiến lược danh mục hai lớp)
- BRD §9.5 (ngưỡng chất lượng dữ liệu DQ-01…DQ-08)
- BRD §9.6 (danh sách dữ liệu khởi tạo)

Bước 1 — Thiết lập môi trường:
  venv · requirements.txt (pandas 2.2 · scikit-learn 1.5 · mlxtend 0.23 · Pillow 11)
  config.py đọc đường dẫn và ngưỡng từ .env — KHÔNG viết cứng đường dẫn

Bước 2 — 01_extract_catalog.py:
  Đầu vào : product_info.csv của dataset
  Đầu ra  : brands.csv · categories.csv · products.csv · rejected.csv

  Xử lý:
  a) Chuẩn hóa tên thương hiệu (bỏ khoảng trắng dư, thống nhất hoa/thường) → sinh slug
  b) Dựng cây danh mục 3 cấp từ primary/secondary/tertiary_category
  c) Sinh slug sản phẩm, đảm bảo DUY NHẤT (thêm hậu tố khi trùng)
  d) Suy ra routine_step từ danh mục cấp 3
  e) Mặc định selling_status = 'THAM_KHAO' cho TẤT CẢ sản phẩm
     ⚠️ Việc chọn sản phẩm nào thành 'DANG_BAN' là QUYẾT ĐỊNH CỦA NGƯỜI — xem bước 3
  f) Dòng thiếu dữ liệu bắt buộc → rejected.csv kèm LÝ DO cụ thể, không im lặng bỏ

Bước 3 — Tạo công cụ HỖ TRỢ tôi chọn Lớp A (không tự chọn):
  Xuất candidates_layer_a.csv có các cột giúp tôi quyết định:
    product_id · name · brand_name · routine_step · price_usd
    · so_thanh_phan_nhan_dien_duoc · co_anh · rating · reviews_count
    · thuong_hieu_pho_bien_o_vn (cột trống để tôi điền Y/N)
  Sắp xếp theo routine_step rồi theo reviews_count giảm dần,
  để tôi thấy ngay mỗi bước routine có bao nhiêu ứng viên tốt.

  In ra bảng tổng hợp: mỗi routine_step có bao nhiêu ứng viên.

Bước 4 — 08_download_images.py:
  Tải ảnh của sản phẩm Lớp A · chuyển WebP · resize max 800px · chất lượng 82
  → frontend/public/media/products/<product_id>.webp
  Sản phẩm Lớp B dùng ảnh placeholder theo danh mục.
  Giới hạn tần suất ≤ 2 yêu cầu/giây, có thử lại — tôn trọng máy chủ nguồn.
  Ghi image_local_url vào products.csv.

TUYỆT ĐỐI KHÔNG:
- Tự chọn danh sách Lớp A. Đây là quyết định nghiệp vụ của tôi.
- Ghi trực tiếp vào database. Python CHỈ tạo CSV; việc nạp do
  tools/BeautyAI.Seeder (.NET) làm, để dùng CÙNG ràng buộc của ứng dụng. (ADR-001)
- Tham chiếu trực tiếp CDN của bên thứ ba cho ảnh. Phải tải về cục bộ. (DQ-08)
```

👤 **NGƯỜI LÀM — 4 giờ: chọn 200–400 sản phẩm Lớp A**

Mở `candidates_layer_a.csv`, điền cột `thuong_hieu_pho_bien_o_vn` và chọn theo **ba tiêu chí, theo thứ tự ưu tiên**:

| # | Tiêu chí | Vì sao quan trọng |
|---|---|---|
| **1** | **Phân bố đều qua MỌI bước routine** | Nếu Lớp A không có sản phẩm chống nắng nào, Routine Builder sẽ **luôn thiếu bước bắt buộc** → vi phạm `INV-11`. **Tối thiểu 3 sản phẩm cho mỗi bước routine.** |
| **2** | Thương hiệu thực tế có mặt ở Việt Nam | Để demo thuyết phục và để Phase sau thương mại hóa được |
| **3** | Đủ dữ liệu thành phần | Sản phẩm không có bảng INCI thì không demo được USP |

```bash
# Sau khi chọn, kiểm tra phân bố — BƯỚC NÀY BẮT BUỘC
python3 - <<'EOF'
import pandas as pd
df = pd.read_csv('output/products.csv')
a = df[df.selling_status=='DANG_BAN']
print(f"Tổng Lớp A: {len(a)}  (mục tiêu 200–400)")
print(a.groupby('routine_step').size().sort_values())
thieu = a.groupby('routine_step').size()
thieu = thieu[thieu < 3]
if len(thieu): print("⚠️ CÁC BƯỚC CÓ DƯỚI 3 SẢN PHẨM — PHẢI BỔ SUNG:\n", thieu)
else: print("✓ Mọi bước routine có ≥ 3 sản phẩm")
EOF
```

✅ **XONG KHI**

```text
☐ products.csv có 200–400 dòng selling_status='DANG_BAN'
☐ MỌI routine_step có ≥ 3 sản phẩm Lớp A      ← điều kiện cho INV-11
☐ 100% sản phẩm Lớp A có đủ: tên · thương hiệu · danh mục · giá · ảnh cục bộ  (DQ-03)
☐ 100% ảnh Lớp A lưu tại frontend/public/media/products/  (DQ-08)
☐ rejected.csv có lý do cụ thể cho từng dòng bị loại
```

---

## ▸ C3 — Từ điển thành phần ⭐⭐👤🔁

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 18 (trong đó **12 giờ là việc người**) | P1 | `WG-P1-06` | C1 |

🎯 **MỤC TIÊU** — Từ điển **150–200 hoạt chất phổ biến nhất**, có diễn giải tiếng Việt **đã được người rà soát**, phủ > 90% nhu cầu thực tế.

> ⭐⭐ **Đây là work group quan trọng nhất của toàn dự án và cũng dễ bị đánh giá thấp nhất (`RISK-06`).**
> 18 giờ = 4,5 ngày **chỉ làm dữ liệu, không viết code**. Nhưng:
> - Không có từ điển ⟹ không có phân tích INCI ⟹ **không có USP**
> - 200 mục phủ > 90% nhu cầu. Làm 2.000 mục ở giai đoạn này là vô nghĩa
> - **AI soạn nháp được, nhưng người PHẢI rà soát** — một diễn giải sai về hoạt chất là **sai thông tin sức khỏe**, nghiêm trọng hơn nhiều một lỗi code

🤖 **PROMPT (phần agent làm — 6 giờ)**

```text
Tạo 02_build_ingredient_dict.py.

ĐỌC TRƯỚC:
- Technical_Design §14.2 (đặc tả script 02)
- docs/domain-rules.md — BR-ING-01…BR-ING-07, đặc biệt BR-ING-04c (nguồn dữ liệu)
- BRD §13.6 (bản quyền & nguồn dữ liệu — CMP-25…CMP-30)

Bước 1 — Nạp danh pháp từ CosIng (Ủy ban châu Âu):
  tên INCI chuẩn · số CAS/EC · chức năng · trạng thái pháp lý
  · giới hạn nồng độ từ các phụ lục (chất bị cấm, chất bị hạn chế)

Bước 2 — Đếm TẦN SUẤT xuất hiện của mỗi thành phần trong toàn dataset,
  xếp hạng giảm dần. Đây là cơ sở để ưu tiên: biên soạn 200 thành phần
  phổ biến nhất hiệu quả hơn nhiều so với 200 thành phần ngẫu nhiên.

Bước 3 — Xuất ingredients_todo.csv — top 150–200 theo tần suất, với các cột:
  inci_name · tan_so_xuat_hien · so_san_pham_chua_no · cosing_status
  · concentration_limit
  + CÁC CỘT ĐỂ TRỐNG CHO TÔI ĐIỀN:
    vietnamese_name · primary_function · description · comedogenic_rating

Bước 4 — Soạn NHÁP phần diễn giải cho từng mục, ghi vào
  ingredients_draft.csv (tệp RIÊNG, không ghi vào todo).
  Mỗi diễn giải 2–3 câu, trả lời: thành phần này LÀM GÌ trên da.

  ⚠️ Quy tắc ngôn từ BẮT BUỘC (BR-AI-13 · CMP-04):
  KHÔNG dùng: điều trị · chữa · trị mụn · trị nám · đặc trị · khỏi hẳn ·
              dứt điểm · hiệu quả 100% · tốt nhất · số 1 · kháng viêm
  DÙNG      : hỗ trợ cải thiện · giúp làm dịu · phù hợp với da… ·
              hỗ trợ điều tiết · giúp da đều màu hơn

  ⚠️ KHÔNG viết bất kỳ thứ gì mang nghĩa "an toàn/nguy hiểm" (INV-01).
     Chỉ viết: công năng + trạng thái pháp lý theo CosIng.

Bước 5 — Xuất danh sách tên đồng nghĩa đã biết → ingredient_synonyms.csv
  (vd Tocopherol ≡ Vitamin E · Ascorbic Acid ≡ Vitamin C ·
      Sodium Hyaluronate ≡ Hyaluronic Acid)
  Mục tiêu ~80 cặp. Đây là thứ làm tăng tỷ lệ phủ nhận diện INCI rõ rệt nhất.

Bước 6 — Xuất active_groups.csv — 15 nhóm hoạt chất theo BRD §17.2.
  ⚠️ PHẢI tách VITAMIN_C_THUAN (L-Ascorbic Acid) và VITAMIN_C_DAN_XUAT
     (Sodium Ascorbyl Phosphate, Ascorbyl Glucoside, Tetrahexyldecyl Ascorbate...).
     Các dẫn xuất ổn định ở pH trung tính và KHÔNG có cùng lưu ý như L-AA.
     Gộp chung hai nhóm này là lỗi phổ biến của các ứng dụng tương tự.

TUYỆT ĐỐI KHÔNG:
- Thu thập (crawl/scrape/mine) nội dung từ INCIDecoder, EWG Skin Deep, hay CosDNA.
  Điều khoản sử dụng của các nguồn này CẤM RÕ RÀNG việc đó, cấm sao chép không có
  văn bản đồng ý, và cấm sử dụng thương mại. (CMP-25 · CMP-26)
  Nguồn duy nhất được dùng là CosIng (dữ liệu công vụ EU) + tự biên soạn.
- Đặt is_reviewed = true. Cột đó CHỈ tôi đặt sau khi rà soát.
- Gán comedogenic_rating nếu không có nguồn — để NULL, nghĩa là "chưa có dữ liệu".
```

👤 **NGƯỜI LÀM — 12 giờ: rà soát từng mục**

```text
Quy trình rà soát (khoảng 3–4 phút/mục × 200 mục ≈ 12 giờ):

Với MỖI thành phần trong ingredients_draft.csv:
  1. Đọc diễn giải nháp của agent
  2. Kiểm: nó có nói đúng thành phần này LÀM GÌ không?
  3. Kiểm: có từ nào trong danh sách cấm không?
  4. Kiểm: có hàm ý "an toàn/nguy hiểm" không?
  5. Sửa nếu cần, rồi đặt is_reviewed = true
  6. Nếu không chắc về một thành phần → để is_reviewed = false,
     nó sẽ hiển thị là "Chưa phân tích" trên giao diện. Đó là kết quả
     ĐÚNG, tốt hơn nhiều so với một diễn giải sai.

Mẹo tiết kiệm thời gian: làm theo nhóm công năng. Rà 20 chất dưỡng ẩm
liên tiếp nhanh hơn nhiều so với rà xen kẽ các nhóm khác nhau.
```

> 🔁 **Task lặp lại:** từ điển sẽ được mở rộng dần trong suốt dự án. Ở Phase 8, `FR-ADM-04` AC-04 cho bạn một màn hình **lọc thành phần chưa đánh giá, sắp theo số sản phẩm chứa nó** — biến việc mở rộng từ *"còn 5.000 thành phần chưa làm"* thành *"làm 20 thành phần tiếp theo này sẽ tăng tỷ lệ phủ thêm 4%"*.

✅ **XONG KHI**

```text
☐ 150–200 thành phần có is_reviewed = true
☐ Tỷ lệ phủ ≥ 85% cho thành phần xuất hiện ≥ 50 lần trong dataset  (DQ-02)
☐ ~80 cặp tên đồng nghĩa
☐ 15 nhóm hoạt chất, có TÁCH VITAMIN_C_THUAN và VITAMIN_C_DAN_XUAT
☐ 0 từ trong danh sách cấm xuất hiện trong trường description
☐ 0 cột/giá trị nào mang nghĩa an toàn/nguy hiểm
```

🔍 **KIỂM CHỨNG**

```bash
python3 - <<'EOF'
import pandas as pd, re
df = pd.read_csv('output/ingredients_seed.csv')
print(f"Đã rà soát: {df.is_reviewed.sum()}/{len(df)}")

cam = ['điều trị','chữa','trị mụn','trị nám','đặc trị','khỏi hẳn','dứt điểm',
       'hiệu quả 100','tốt nhất','số 1','kháng viêm','an toàn','nguy hiểm']
viphạm = df[df.description.fillna('').str.lower().apply(
    lambda s: any(w in s for w in cam))]
if len(viphạm):
    print(f"⚠️ {len(viphạm)} mục VI PHẠM ngôn từ:")
    print(viphạm[['inci_name','description']].head(10).to_string())
else:
    print("✓ Không có vi phạm ngôn từ")

ag = pd.read_csv('output/active_groups.csv')
assert 'VITAMIN_C_THUAN' in ag.code.values and 'VITAMIN_C_DAN_XUAT' in ag.code.values, \
    "⚠️ PHẢI tách Vitamin C thuần và dẫn xuất"
print("✓ Nhóm Vitamin C đã tách đúng")
EOF
```

---

## ▸ C4 — Mười hai quy tắc xung đột ⭐👤

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 2 (**toàn bộ là việc người**) | P1 | `WG-P1-06` | C3 |

🎯 **MỤC TIÊU** — 12 quy tắc xung đột hoạt chất, **mỗi quy tắc có nguồn đã được bạn tự mở ra đọc và xác minh**.

> ⭐ **Đây là nơi sinh ra điểm khác biệt khoa học của BeautyAI.** Nếu làm đúng, bạn có một thứ thật để trình bày. Nếu làm sai (cảnh báo bừa, không nguồn), sản phẩm trở thành *một Yuka phiên bản Việt* — đúng thứ nó muốn khác biệt với.

👤 **NGƯỜI LÀM — toàn bộ**

Mở bảng `BRD` §17.2 (12 quy tắc đã soạn sẵn). Với **từng** quy tắc:

```text
1. Mở URL nguồn, ĐỌC. Không chỉ kiểm tra link có mở được.
2. Xác nhận: nguồn có thực sự nói điều mà quy tắc tuyên bố không?
3. Xác nhận cấp bằng chứng:
     Cấp A = có nghiên cứu định lượng đã bình duyệt
     Cấp B = cơ chế vững, thiếu dữ liệu định lượng
     Cấp C = lý thuyết hợp lý, hoặc huyền thoại đang bị phản bác
4. Nếu không xác minh được nguồn → BỎ quy tắc đó, hoặc hạ cấp bằng chứng.
   KHÔNG đưa vào hệ thống. Ràng buộc ck_cr_sourceurl ở DB sẽ từ chối —
   và đó là CHỦ ĐÍCH.
5. Ghi vào conflict_rules.csv.
```

**Hai quy tắc quan trọng nhất — kiểm tra kỹ hơn những quy tắc khác:**

| Quy tắc | Vì sao quan trọng | Phải xác nhận được gì |
|---|---|---|
| **Retinoid + Benzoyl Peroxide** (mức `CAO`, cấp A) | Đây là **cặp DUY NHẤT** được phép cảnh báo đỏ | Nghiên cứu về mức phân hủy định lượng · **và** sắc thái *Adapalene bền hơn Tretinoin* · **và** mức phân hủy phụ thuộc công thức |
| **Vitamin C + Niacinamide** (mức `THÔNG_TIN`, cấp C) | Hệ thống phải **ĐÍNH CHÍNH huyền thoại**, không cảnh báo | Điều kiện để phản ứng xảy ra đáng kể: pH 2 + 90°C + > 75 giờ · phức hợp thuận nghịch, không đáng kể ở pH sinh lý |

```bash
# Kiểm tra sau khi soạn — BẮT BUỘC
python3 - <<'EOF'
import pandas as pd
df = pd.read_csv('output/conflict_rules.csv')

# 1. Mọi quy tắc có nguồn
assert df.source_url.notna().all() and (df.source_url.str.strip()!='').all(), \
    "⚠️ Có quy tắc KHÔNG CÓ NGUỒN"

# 2. INV-03 — cấp B/C không được mức CAO
sai = df[(df.evidence_tier.isin(['B','C'])) & (df.severity=='CAO')]
assert len(sai)==0, f"⚠️ VI PHẠM INV-03:\n{sai[['group_a','group_b','evidence_tier','severity']]}"

# 3. Chỉ MỘT cặp ở mức CAO
cao = df[df.severity=='CAO']
assert len(cao)==1, f"⚠️ Có {len(cao)} cặp ở mức CAO, kỳ vọng ĐÚNG 1"
print(f"✓ Cặp duy nhất mức CAO: {cao.iloc[0].group_a} ✕ {cao.iloc[0].group_b}")

# 4. Mọi quy tắc có phương án xử lý (BR-CONF-05)
assert df.remediation.notna().all(), "⚠️ Có cảnh báo KHÔNG CÓ phương án xử lý"

# 5. Cặp Retinoid+BPO phải có sắc thái Adapalene
bpo = df[(df.severity=='CAO')].iloc[0]
assert 'Adapalene' in str(bpo.professional_note), \
    "⚠️ THIẾU sắc thái 'Adapalene bền hơn Tretinoin' — đây là điểm khác biệt chuyên môn"

print(f"✓ {len(df)} quy tắc hợp lệ · phân bố cấp bằng chứng:")
print(df.evidence_tier.value_counts().to_string())
EOF
```

✅ **XONG KHI** — 12 quy tắc · 100% có nguồn đã xác minh · **đúng 1 cặp ở mức CAO** · 0 vi phạm `INV-03` · cặp Retinoid+BPO có sắc thái Adapalene · 100% có phương án xử lý.

---

## ▸ C5 — Bóc tách INCI & lấy mẫu đánh giá

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 8 | P1 | `WG-P1-07` | C3 |

🎯 **MỤC TIÊU** — Liên kết sản phẩm ↔ thành phần (~150.000 dòng) với **tỷ lệ phủ trung thực**, và ~50.000 đánh giá có nhãn loại da.

🤖 **PROMPT**

```text
Tạo 03_parse_inci.py và 04_sample_reviews.py.

ĐỌC TRƯỚC:
- Technical_Design §14.2 (đặc tả script 03 và 04)
- docs/domain-rules.md — BR-ING-06 (chuẩn hóa INCI) · BR-ING-07 (giữ thứ tự)
  · BR-ING-04b (thành phần chưa nhận diện) · BR-DATA-04 (lấy mẫu review)

03_parse_inci.py — thuật toán chuẩn hóa, làm ĐÚNG 8 bước:
  1. Cắt theo dấu phẩy (xử lý cả dấu ; và dấu đầu dòng)
  2. Bỏ nội dung trong ngoặc mô tả — NHƯNG GIỮ ngoặc chứa tên hóa học thay thế
     (vd "Tocopherol (Vitamin E)" → giữ cả hai để khớp được)
  3. Chuẩn hóa chữ hoa/thường · bỏ khoảng trắng dư · bỏ dấu * † chỉ chú thích
  4. Khớp CHÍNH XÁC theo tên INCI chuẩn
  5. Không khớp → thử tên ĐỒNG NGHĨA
  6. Không khớp → thử KHỚP MỜ (độ tương đồng ≥ 0,92)
     ⚠️⚠️ KHÔNG TỰ ĐỘNG ÁP DỤNG khớp mờ.
     Ghi vào fuzzy_review.csv để TÔI xác nhận từng dòng.
     LÝ DO: khớp mờ sai sẽ gán một thành phần cho sản phẩm KHÔNG chứa nó
     ⟹ cảnh báo dị ứng SAI ⟹ mất niềm tin không lấy lại được.
     Thà để "Chưa phân tích" còn hơn gán sai. (RISK-13)
  7. Vẫn không khớp → lưu NGUYÊN VĂN vào product_unmatched_ingredients.csv
  8. GIỮ NGUYÊN display_order — thứ tự mang thông tin về nồng độ tương đối (BR-ING-07)

  Đầu ra:
    product_ingredients.csv
    product_unmatched_ingredients.csv
    fuzzy_review.csv              ← cần tôi xác nhận
    coverage_report.md            ← báo cáo tỷ lệ phủ, phải TRUNG THỰC

04_sample_reviews.py:
  Lọc: độ dài ≥ 20 ký tự · ngôn ngữ nhận dạng được · bỏ trùng lặp nội dung
       · ưu tiên dòng có skin_type hợp lệ
  Lấy mẫu PHÂN TẦNG theo (skin_type × product):
    sản phẩm Lớp A lấy NHIỀU hơn — để FR-PDP-12 có đủ ≥ 5 review/nhóm tương đồng
    sản phẩm Lớp B lấy ít
  Ẩn danh hóa: author_id → băm một chiều → external_author_ref.
    KHÔNG lưu bất kỳ dữ liệu định danh nào từ dataset.
  Mục tiêu ~50.000 dòng.

TUYỆT ĐỐI KHÔNG:
- Tự động áp dụng khớp mờ (xem bước 6)
- Thay đổi thứ tự thành phần (BR-ING-07)
- Gán giá trị mặc định cho thành phần chưa nhận diện — phải để trạng thái
  "chưa phân tích" và tính vào tỷ lệ phủ (BR-ING-04b)
- Làm tròn hay thổi phồng tỷ lệ phủ trong coverage_report.md.
  Tỷ lệ phủ TRUNG THỰC là một tính năng, không phải điểm yếu —
  giao diện sẽ hiển thị nó cho người dùng.
```

👤 **NGƯỜI LÀM — 1,5 giờ:** rà soát `fuzzy_review.csv`, xác nhận hoặc từ chối từng dòng khớp mờ.

✅ **XONG KHI**

```text
☐ ≥ 90% sản phẩm có ít nhất một thành phần nhận diện được       (DQ-01)
☐ ≥ 60% mẫu đánh giá có nhãn loại da hợp lệ                     (DQ-06)
☐ fuzzy_review.csv đã được rà soát hết — không còn dòng chờ
☐ coverage_report.md báo tỷ lệ phủ trung bình và phân bố
☐ product_unmatched_ingredients.csv có dữ liệu (nếu rỗng → nghi ngờ script sai)
```

---

## ▸ C6 — Gợi ý tính sẵn & Seeder 🔗

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 6 | P1 | `WG-P1-08` | C1, C2, C3, C4, C5 |

🎯 **MỤC TIÊU** — Toàn bộ dữ liệu nằm trong DB, qua **cùng `DbContext` và cùng ràng buộc của ứng dụng**, và Seeder chạy lại được không tạo trùng.

🤖 **PROMPT**

```text
Tạo 05_compute_similarity.py · 06_compute_association_rules.py · 07_compliance_scan.py
và dự án tools/BeautyAI.Seeder.

ĐỌC TRƯỚC:
- Technical_Design §14.2 (script 05, 06, 07) và §8.10 (luồng nạp dữ liệu)
- docs/adr/ADR-001-single-backend-offline-ml.md
- docs/domain-rules.md — BR-REC-07 (sản phẩm tương tự) · BR-REC-08 (luật mua kèm)
  · BR-DATA-05 (nội dung không chứa tuyên bố điều trị) · BR-DATA-06 (phiên bản dữ liệu)
- BRD §9.6 (18 tập dữ liệu khởi tạo, theo đúng thứ tự phụ thuộc)

05_compute_similarity.py:
  TF-IDF trên tài liệu ghép = tên thành phần + danh mục + nhãn đặc tính
  → cosine similarity → top 8 mỗi sản phẩm
  Loại trừ: chính sản phẩm đó · sản phẩm NGUNG_BAN/NHAP
  Ghi version (tăng dần) + computed_at  (BR-DATA-06)
  Kèm notebook notebooks/02-tfidf-similarity.ipynb trình bày phương pháp
  — notebook là SẢN PHẨM BÀN GIAO HỌC THUẬT, không phải tệp nháp.

06_compute_association_rules.py:
  Apriori (mlxtend).
  ⚠️ Dataset KHÔNG có dữ liệu giỏ hàng thật. Dùng XẤP XỈ: nhóm theo author_id
     các sản phẩm cùng được một người đánh giá → coi là "đã dùng cùng nhau".
  ⚠️ PHẢI ghi rõ hạn chế này vào đầu tệp script VÀ vào notebook.
     Giao diện cũng sẽ nêu rõ (FR-PDP-09 AC-02).
  Lọc ngưỡng: support ≥ 0,005 · confidence ≥ 0,20 · lift > 1  (BR-REC-08)
  (Ràng buộc ck_ar_thresholds ở DB cũng chặn dữ liệu không đạt — hai lớp phòng thủ)

07_compliance_scan.py:
  Quét mô tả sản phẩm Lớp A tìm từ gây hiểu nhầm là thuốc, SO KHỚP KHÔNG PHÂN BIỆT DẤU
  (người và mô hình có thể viết "dieu tri", "DIỀU TRỊ", "đ.iều trị").
  Đầu ra: compliance_report.md + description_replacements.csv để TÔI rà soát.
  Gắn cờ riêng các trường hợp CHẶN CỨNG cần tôi viết lại tay.

tools/BeautyAI.Seeder (dự án .NET console):
  • ÁP DỤNG MIGRATION trước khi nạp
  • Nạp theo ĐÚNG thứ tự phụ thuộc của BRD §9.6 (18 tập dữ liệu)
  • IDEMPOTENT: chạy lại KHÔNG tạo bản ghi trùng (upsert theo khóa tự nhiên)
  • Mật khẩu admin đọc từ biến môi trường Admin__BootstrapPassword.
    Nếu biến không có → TỪ CHỐI CHẠY với thông báo rõ. KHÔNG viết cứng.
  • SAU KHI NẠP, kiểm tra chất lượng và FAIL nếu không đạt ngưỡng BRD §9.5:
      DQ-01 ≥ 90% · DQ-02 ≥ 85% · DQ-03 = 100% · DQ-04 = 100%
      · DQ-06 ≥ 60% · DQ-07 = 100% · DQ-08 = 100%
    In bảng kết quả từng ngưỡng: đạt/không đạt + giá trị thực tế.

TUYỆT ĐỐI KHÔNG:
- Để Python ghi trực tiếp vào database. Python CHỈ tạo CSV.
  Seeder (.NET) nạp qua CÙNG DbContext → mọi vi phạm ràng buộc bị phát hiện
  NGAY LÚC NẠP với thông báo rõ, thay vì phát hiện khi ứng dụng chạy sai. (ADR-001)
- Che hay làm đẹp số liệu chất lượng dữ liệu.
- Nạp luật mua kèm không đạt ngưỡng.
```

✅ **XONG KHI**

```text
☐ docker compose down -v && up → migration → Seeder → MỌI ngưỡng DQ ĐẠT
☐ Chạy Seeder LẦN HAI → không tạo bản ghi trùng (đếm trước/sau giống nhau)
☐ Bỏ biến Admin__BootstrapPassword → Seeder TỪ CHỐI CHẠY
☐ 4 notebook trong tools/data-pipeline/notebooks/ chạy được từ đầu đến cuối
☐ compliance_report.md đã được rà soát, 100% sản phẩm Lớp A sạch ngôn từ  (DQ-05)
```

🔍 **KIỂM CHỨNG**

```bash
docker compose down -v && docker compose up -d postgres && sleep 5
dotnet run --project tools/BeautyAI.Seeder -- --all        # phải in bảng DQ, tất cả ĐẠT

# Idempotent
docker compose exec -T postgres psql -U beautyai -d beautyai -t -c \
  "SELECT count(*) FROM products;" > /tmp/truoc.txt
dotnet run --project tools/BeautyAI.Seeder -- --all
docker compose exec -T postgres psql -U beautyai -d beautyai -t -c \
  "SELECT count(*) FROM products;" > /tmp/sau.txt
diff /tmp/truoc.txt /tmp/sau.txt && echo "✓ Seeder idempotent"

# Điều kiện cho INV-11 — mọi bước routine có sản phẩm bán được
docker compose exec -T postgres psql -U beautyai -d beautyai -c "
SELECT routine_step, count(*) FROM products
WHERE selling_status='DANG_BAN' GROUP BY routine_step ORDER BY 2;"
```

---

## 📋 Danh mục kiểm tra kết thúc NHÓM C

```text
☐ 35 bảng · 38 index · 40+ CHECK trong DB
☐ ~8.494 sản phẩm Lớp B + 200–400 Lớp A, mọi bước routine có ≥ 3 sản phẩm Lớp A
☐ 150–200 thành phần đã rà soát · ~80 cặp đồng nghĩa · 15 nhóm hoạt chất
☐ 12 quy tắc xung đột, 100% có nguồn đã xác minh, ĐÚNG 1 cặp mức CAO
☐ ~150.000 liên kết sản phẩm–thành phần · ~50.000 đánh giá
☐ ~8.494×8 dòng tương đồng · ~15.000 luật mua kèm đạt ngưỡng
☐ MỌI ngưỡng chất lượng dữ liệu DQ-01…DQ-08 ĐẠT
☐ Seeder idempotent · chạy được từ DB rỗng
☐ 4 notebook học thuật chạy được
☐ Ảnh chụp trạng thái: docs/_states/state_<YYYY-MM-DD>_nhom-c-xong.md
```

> 🎉 **Hết nhóm C là hết Phase 1.** Bạn chưa có giao diện nào, nhưng bạn có thứ quý hơn: **dữ liệu sạch, đã kiểm tra chất lượng, với tỷ lệ phủ trung thực**. Từ đây mọi tính năng đều có nền để đứng.

---
# PHẦN 4 — NHÓM D: BACKEND NỀN TẢNG

| | |
|---|---|
| **Phase** | P2 · `WG-P2-01`→`04` |
| **Giờ** | 28 (7 ngày) |
| **Kết quả** | API chạy được · xác thực hoạt động · hạ tầng chung xong một lần dùng mãi |
| **Đặc điểm** | 🔗 Chặn mọi nhóm tính năng. Làm cẩu thả ở đây ⟹ sửa lặp lại ở 10 nhóm sau |

> 💡 **Nguyên tắc của nhóm này:** mọi thứ làm ở đây sẽ được **dùng lại hàng trăm lần**. Một `ProblemDetails` không chuẩn, một `IClock` thiếu, một chính sách CORS sai ⟹ bạn sẽ gặp lại nó ở mọi endpoint. Bỏ ra 28 giờ ở đây để tiết kiệm hàng trăm giờ về sau.

---

## ▸ D1 — Hạ tầng dùng chung ⭐🔗

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 8 | P2 | `WG-P2-01` | C1 |

🎯 **MỤC TIÊU** — Mọi thứ *dùng chung* của backend tồn tại và đã có test, **trước** khi viết endpoint nghiệp vụ đầu tiên.

🤖 **PROMPT**

```text
Xây dựng hạ tầng dùng chung cho backend.

ĐỌC TRƯỚC:
- docs/architecture.md §3 (4 lớp) và §4 (component map)
- docs/api-contract.md §7.2 (định dạng lỗi) và §7.3 (phân trang)
- docs/observability-runbook.md
- docs/tech-stack.md

Làm đủ 10 hạng mục:

1. Result<T> / Result (Domain) — kiểu trả về cho mọi use case.
   KHÔNG dùng exception cho luồng nghiệp vụ dự kiến được.
   Lý do: hết hàng, mật khẩu sai, voucher không hợp lệ là KẾT QUẢ, không phải lỗi
   hệ thống. Dùng exception cho chúng làm mất kiểu và khó kiểm thử.
   Exception chỉ dành cho lỗi thật ngoài dự kiến.

2. ErrorCode (Domain) — enum MÃ LỖI ỔN ĐỊNH, phải khớp 1-1 với
   docs/api-contract.md §7.2. Mã lỗi là HỢP ĐỒNG — frontend dựa vào nó.
   Vd: PRODUCT_OUT_OF_STOCK · VOUCHER_EXPIRED · AI_QUOTA_EXCEEDED ·
       CONFLICT_NOT_ACKNOWLEDGED · HANDOFF_CONSENT_REQUIRED

3. Middleware ProblemDetails (RFC 7807) — chuyển mọi lỗi thành
   { type, title, status, detail, errors, traceId, errorCode }
   traceId lấy từ Activity.Current. MỖI phản hồi lỗi PHẢI có traceId —
   đây là cách duy nhất nối một báo lỗi của người dùng với log.
   ⚠️ Môi trường Production: KHÔNG BAO GIỜ trả stack trace. (CMP-21)

4. Middleware RequestId — gán X-Request-Id, đưa vào LogContext của Serilog.

5. Serilog — ghi JSON có cấu trúc.
   ⚠️ TUYỆT ĐỐI KHÔNG ghi: mật khẩu · token · nội dung chat · hồ sơ da
      · địa chỉ · số điện thoại. (CMP-20)
   Viết một enricher LỌC các trường này theo tên, để sau này ai thêm log
   cũng không rò rỉ được.

6. Phân trang — PagedResult<T> { items, page, pageSize, totalItems, totalPages }
   ⚠️ Mọi endpoint danh sách PHẢI phân trang. Giới hạn pageSize tối đa 100 —
   nếu không, một yêu cầu pageSize=100000 sẽ làm sập ứng dụng.

7. IClock + SystemClock — KHÔNG dùng DateTimeOffset.UtcNow trực tiếp trong
   nghiệp vụ. Lý do: không có IClock thì không kiểm thử được logic
   "voucher hết hạn", "quota reset lúc nửa đêm", "đơn hàng quá 24h".
   Đây là thứ bạn sẽ cảm ơn ở nhóm J và L.

8. FluentValidation — tự động đăng ký validator, map lỗi sang
   ProblemDetails.errors theo tên trường.

9. Swashbuckle — tài liệu OpenAPI, nhóm theo tag module, ví dụ cho mỗi
   endpoint, mô tả đủ để sinh client tự động.

10. Health check: /health/live (ứng dụng còn chạy)
                 /health/ready (DB kết nối được)
    + /api/version trả về phiên bản assembly + hash commit.

TUYỆT ĐỐI KHÔNG:
- Dùng exception cho luồng nghiệp vụ dự kiến được
- Trả lỗi không có traceId
- Trả endpoint danh sách không phân trang
- Dùng DateTimeOffset.UtcNow trực tiếp trong Application hay Domain
- Ghi dữ liệu cá nhân vào log
```

✅ **XONG KHI**

```text
☐ Gọi một endpoint lỗi → nhận ProblemDetails có đủ traceId và errorCode
☐ ErrorCode khớp 1-1 với docs/api-contract.md §7.2 (đối chiếu từng mã)
☐ Test: gọi với pageSize=100000 → bị chặn về 100
☐ Grep toàn bộ src/BeautyAI.Application và Domain: 0 lần DateTimeOffset.UtcNow
☐ Test: enricher Serilog lọc được trường password/token (test đơn vị)
☐ /health/ready trả 200 khi DB sống, 503 khi DB chết (tắt docker để thử)
☐ /swagger mở được, mỗi endpoint có ví dụ
```

🔍 **KIỂM CHỨNG**

```bash
grep -rn 'DateTimeOffset\.UtcNow\|DateTime\.UtcNow' \
  src/BeautyAI.Application src/BeautyAI.Domain \
  && echo "⚠️ CÒN DÙNG TRỰC TIẾP — phải thay bằng IClock" \
  || echo "✓ Không dùng trực tiếp"

curl -s localhost:5000/api/products/khong-ton-tai | jq '.traceId, .errorCode'
curl -s localhost:5000/health/ready -o /dev/null -w '%{http_code}\n'

docker compose stop postgres
curl -s localhost:5000/health/ready -o /dev/null -w '%{http_code}\n'   # phải 503
docker compose start postgres
```

---

## ▸ D2 — Xác thực & phân quyền ⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 10 | P2 | `WG-P2-02` | D1 |

🎯 **MỤC TIÊU** — Đăng ký · đăng nhập · đăng xuất · đổi mật khẩu · phân quyền theo vai, **đúng chuẩn an toàn mật khẩu**.

> ⛔ **Nhóm này không có chỗ cho "tạm thế đã, sau sửa".** Một lỗi lưu mật khẩu không sửa được về sau — mọi mật khẩu đã lưu sai đều phải buộc đổi lại. Làm đúng ngay lần đầu.

🤖 **PROMPT**

```text
Hiện thực module xác thực M01.

ĐỌC TRƯỚC (bắt buộc đọc HẾT):
- docs/_requirements/M01.md — FR-AUTH-01…09
- docs/domain-rules.md — BR-AUTH-01…09
- docs/security-policy.md §11 — ĐẶC BIỆT §11.1 (băm mật khẩu) và §11.3 (cookie)
- docs/adr/ADR-004-cookie-auth-pbkdf2.md

Bước 1 — Băm mật khẩu:
  DÙNG Microsoft.AspNetCore.Identity.PasswordHasher<AppUser>
  (PBKDF2-HMAC-SHA512 · 100.000 vòng · muối 128-bit · định dạng v3)

  ⛔ TUYỆT ĐỐI KHÔNG:
    - Tự viết thuật toán băm
    - Dùng SHA256/MD5 trực tiếp (quá nhanh ⟹ dò được)
    - Dùng muối cố định hay không muối
    - Mã hóa hai chiều (mật khẩu phải KHÔNG giải được, kể cả bởi bạn)
  (BR-AUTH-02 — đây là bất biến INV-08)

Bước 2 — Cookie session:
  HttpOnly=true · Secure=true (kể cả localhost qua HTTPS)
  · SameSite=Lax · sliding expiration 7 ngày
  ⛔ KHÔNG lưu token vào localStorage/sessionStorage — bị XSS đọc được.
     Lý do chọn cookie thay vì JWT-trong-localStorage: xem ADR-004.

Bước 3 — Chống dò mật khẩu (BR-AUTH-04):
  Sai 5 lần trong 15 phút → khóa 15 phút.
  Đếm theo CẢ email VÀ địa chỉ IP (chỉ đếm theo email ⟹ kẻ tấn công
  khóa được tài khoản người khác; chỉ đếm theo IP ⟹ vượt được bằng
  nhiều IP).

Bước 4 — Chống liệt kê người dùng (BR-AUTH-05):
  ⚠️ Email sai và mật khẩu sai PHẢI trả về:
     - CÙNG một thông báo ("Email hoặc mật khẩu không đúng")
     - CÙNG một mã lỗi
     - và THỜI GIAN PHẢN HỒI TƯƠNG ĐƯƠNG
  Điểm cực dễ sai: nếu email không tồn tại thì không có băm để so,
  hàm trả về NGAY ⟹ nhanh hơn rõ rệt ⟹ kẻ tấn công đo thời gian là biết
  email nào có thật.
  CÁCH SỬA: khi không tìm thấy người dùng, VẪN thực hiện một phép so băm
  với một băm giả cố định, rồi mới trả về thất bại.

Bước 5 — Đổi mật khẩu (FR-AUTH-06):
  Bắt buộc nhập mật khẩu hiện tại. Sau khi đổi thành công →
  VÔ HIỆU HÓA MỌI session khác (BR-AUTH-07). Nếu không làm, kẻ đã chiếm
  session vẫn vào được sau khi chủ tài khoản đổi mật khẩu.

Bước 6 — Phân quyền theo vai (BR-AUTH-09):
  Policy "AdminOnly". ⚠️ Áp dụng Ở TẦNG ENDPOINT, không chỉ ẩn nút ở UI.
  Ẩn nút chỉ là trang trí — kẻ tấn công gọi API trực tiếp.

Bước 7 — Hợp nhất giỏ hàng khi đăng nhập (BR-CART-08):
  Giỏ khách (theo cookie ẩn danh) + giỏ đã có của tài khoản
  → cộng số lượng, giới hạn theo tồn kho hiện tại.

Bước 8 — Test (viết TRƯỚC khi hiện thực):
  Đơn vị : độ mạnh mật khẩu · giới hạn thử · chuẩn hóa email citext
  Tích hợp: luồng đăng ký→đăng nhập→đăng xuất · cookie đúng cờ
           · 401 khi chưa đăng nhập · 403 khi không đủ vai
  An toàn: email sai và mật khẩu sai cho CÙNG phản hồi
           · thời gian phản hồi hai trường hợp lệch < 50ms
           · đổi mật khẩu vô hiệu hóa session khác
```

✅ **XONG KHI**

```text
☐ Đăng ký → DB lưu password_hash định dạng PBKDF2 v3 (bắt đầu bằng "AQAAAA")
☐ Grep toàn repo: KHÔNG có chuỗi mật khẩu rõ nào được lưu
☐ Test thời gian: email sai vs mật khẩu sai lệch < 50ms  ← BẮT BUỘC
☐ Sai 5 lần → lần 6 bị khóa, kèm thông báo rõ thời gian còn lại
☐ Đổi mật khẩu → session khác bị đăng xuất (test bằng 2 cookie khác nhau)
☐ Gọi endpoint admin bằng tài khoản thường → 403 (không phải 404, không phải 200)
☐ Giỏ khách hợp nhất đúng khi đăng nhập
```

🔍 **KIỂM CHỨNG**

```bash
# Băm đúng định dạng
docker compose exec -T postgres psql -U beautyai -d beautyai -t -c \
  "SELECT left(password_hash, 8) FROM users LIMIT 3;"   # phải thấy AQAAAA

# Đo thời gian — chống liệt kê người dùng
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -w 'email-sai   %{time_total}\n' -X POST localhost:5000/api/auth/login \
    -H 'Content-Type: application/json' -d '{"email":"khongtontai@x.com","password":"Abc12345!"}'
  curl -s -o /dev/null -w 'matkhau-sai %{time_total}\n' -X POST localhost:5000/api/auth/login \
    -H 'Content-Type: application/json' -d '{"email":"admin@beautyai.vn","password":"saibeng"}'
done
# Hai nhóm số phải TƯƠNG ĐƯƠNG. Lệch rõ ⟹ chưa sửa bước 4.

dotnet test --filter "Category=Security"
```

---

## ▸ D3 — Hồ sơ người dùng, địa chỉ, ẩn danh hóa ⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 6 | P2 | `WG-P2-03` | D2 |

🎯 **MỤC TIÊU** — Hồ sơ · địa chỉ · **`DeIdentificationService`** · xuất và xóa dữ liệu cá nhân.

> ⭐ **Vì sao `DeIdentificationService` được làm Ở ĐÂY, Phase 2 — ba phase TRƯỚC khi có LLM:**
> Nếu để đến Phase 7 (khi tích hợp Gemini), nó sẽ bị **bỏ qua vì gấp**. Làm trước nghĩa là khi LLM xuất hiện, dịch vụ ẩn danh hóa **đã tồn tại và đã có test** — không thể bỏ qua được nữa. Đây là một quyết định về *thứ tự*, không phải về nội dung. (`INV-04`)

🤖 **PROMPT**

```text
Hiện thực module M02 (hồ sơ) và DeIdentificationService.

ĐỌC TRƯỚC:
- docs/_requirements/M02.md — FR-PROF-01…08
- docs/domain-rules.md — BR-PROF-01…06, BR-AI-16
- docs/security-policy.md §11.5 (ẩn danh hóa trước khi gửi ra ngoài biên giới)
- docs/llm-policy.md
- BRD §13.3 (PDPL 2025 · Nghị định 356/2025 — chuyển dữ liệu qua biên giới)

PHẦN 1 — Hồ sơ & địa chỉ:
  CRUD hồ sơ · CRUD địa chỉ (tối đa 10, đúng MỘT địa chỉ mặc định)
  Xóa địa chỉ mặc định → tự đặt địa chỉ còn lại mới nhất làm mặc định
  Xóa địa chỉ đã dùng trong đơn hàng → KHÔNG ảnh hưởng đơn hàng đó,
    vì đơn hàng lưu BẢN CHỤP địa chỉ (ADR-010)

PHẦN 2 — Hồ sơ da:
  skin_type · concerns (nhiều) · sensitivity_level · allergy_inci_ids
  · budget_band · pregnancy_status
  ⚠️ Cờ allow_ai_sharing MẶC ĐỊNH FALSE. (BR-PROF-05)
     Mặc định là "không chia sẻ", người dùng phải chủ động bật.

PHẦN 3 — DeIdentificationService (QUAN TRỌNG NHẤT):

  public interface IDeIdentificationService {
      SafeLlmContext Sanitize(ChatContext ctx);
  }

  Luật:
  1. allow_ai_sharing = false  ⟹  trả SafeLlmContext { HasProfile = false }.
     KHÔNG gửi gì về hồ sơ da. Không ngoại lệ.
  2. allow_ai_sharing = true   ⟹  CHỈ gửi:
       - skinType, concerns, sensitivityLevel   (phân loại, không định danh)
       - budgetBand: chuyển SỐ thành KHOẢNG (<300k · 300–700k · 700k–1.5tr · >1.5tr)
         ⚠️ Lý do: ngân sách chính xác "487.000đ" là dữ liệu có thể định danh
            khi kết hợp với dữ liệu khác. Khoảng thì không.
       - avoidIngredients: TÊN INCI (tên hóa học công khai, không định danh)
       - pregnancyStatus (chỉ khi người dùng đã bật chia sẻ)
  3. TUYỆT ĐỐI KHÔNG gửi, trong mọi hoàn cảnh:
       userId · email · họ tên · số điện thoại · địa chỉ
       · lịch sử đơn hàng · ID giỏ hàng · ID phiên · địa chỉ IP
  4. Hàm này là ĐIỂM DUY NHẤT mà dữ liệu người dùng được phép đi ra ngoài.

  Viết test BAO PHỦ TOÀN BỘ:
    - Reflection trên SafeLlmContext: KHÔNG thuộc tính nào tên chứa
      userId/email/phone/address/name  → test này chặn việc thêm trường
      nhầm trong tương lai
    - allow_ai_sharing=false → HasProfile=false và mọi trường khác rỗng
    - Ngân sách 487000 → "300–700k", KHÔNG phải "487000"
    - Serialize SafeLlmContext ra JSON rồi grep: 0 lần xuất hiện email mẫu

PHẦN 4 — Quyền của chủ thể dữ liệu (FR-PROF-07, FR-PROF-08):
  Xuất dữ liệu : JSON gồm hồ sơ · địa chỉ · đơn hàng · hồ sơ da
                 · lịch sử chat · đánh giá
  Xóa hồ sơ da : xóa riêng hồ sơ da mà KHÔNG xóa tài khoản
                 (FR-PROF-08 — đây là yêu cầu bắt buộc của PDPL)

TUYỆT ĐỐI KHÔNG:
- Để allow_ai_sharing mặc định true
- Thêm bất kỳ trường định danh nào vào SafeLlmContext
- Gửi ngân sách dưới dạng số chính xác
- Viết lối đi vòng qua DeIdentificationService
```

✅ **XONG KHI**

```text
☐ Test reflection trên SafeLlmContext PASS
☐ allow_ai_sharing mặc định false (kiểm trong DB sau khi tạo hồ sơ mới)
☐ Ngân sách 487000 → chuỗi "300–700k"
☐ Serialize SafeLlmContext → JSON không chứa email/tên/sđt/địa chỉ
☐ Xuất dữ liệu trả JSON đủ 6 loại dữ liệu
☐ Xóa hồ sơ da hoạt động và KHÔNG xóa tài khoản
☐ Tối đa 10 địa chỉ · đúng 1 mặc định · xóa mặc định thì tự chọn lại
```

---

## ▸ D4 — Nhật ký kiểm toán & cấu hình hệ thống

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 4 | P2 | `WG-P2-04` | D1 |

🎯 **MỤC TIÊU** — Mọi hành động quản trị để lại dấu vết **không sửa được**; cấu hình nghiệp vụ đổi được **không cần biên dịch lại**.

🤖 **PROMPT**

```text
Hiện thực nhật ký kiểm toán và cấu hình hệ thống.

ĐỌC TRƯỚC: docs/_requirements/M15.md · docs/domain-rules.md BR-ADM-05…08
          · docs/observability-runbook.md

PHẦN 1 — Nhật ký kiểm toán (FR-ADM-10):
  Bảng audit_logs: actor_user_id · action · entity_type · entity_id
                   · before_json · after_json · ip_address · created_at
  Ghi cho MỌI thao tác admin: tạo/sửa/xóa sản phẩm · đổi trạng thái đơn
                   · sửa thành phần · duyệt đánh giá · đổi cấu hình

  ⚠️ CHỈ GHI THÊM. KHÔNG có endpoint sửa hay xóa nhật ký.
  Lý do: nhật ký sửa được thì không còn là nhật ký. Nếu cần xóa theo
  chính sách lưu trữ, làm bằng tác vụ dọn dẹp theo thời gian, không
  bằng endpoint.

  ⚠️ before_json/after_json PHẢI lọc trường cá nhân — nhật ký không
  được trở thành kho dữ liệu cá nhân thứ hai.

PHẦN 2 — Cấu hình hệ thống (FR-ADM-11):
  Bảng system_settings (key · value_json · description · updated_at
                        · updated_by)
  Các khóa bắt buộc:
    exchange_rate_usd_vnd · free_shipping_threshold · shipping_fee_flat
    · ai_quota_guest · ai_quota_user · ai_quota_admin
    · zalo_oa_id · zalo_oa_url · data_quality_thresholds

  ⚠️ Tỷ giá PHẢI đọc từ đây, KHÔNG viết cứng ở bất kỳ đâu.
  (Bản prototype trước viết cứng EXCHANGE_RATE = 25000 — xem BRD §4.3 G-08)

  Cache trong bộ nhớ 5 phút, có nút xóa cache ngay khi admin sửa.

TUYỆT ĐỐI KHÔNG:
- Tạo endpoint sửa/xóa audit log
- Ghi dữ liệu cá nhân vào before_json/after_json
- Viết cứng tỷ giá, phí giao hàng, hay quota ở bất kỳ đâu trong code
```

✅ **XONG KHI**

```text
☐ Thao tác admin bất kỳ → có dòng audit_logs mới
☐ KHÔNG tồn tại endpoint PUT/DELETE nào trên audit_logs (kiểm trong swagger)
☐ Grep toàn repo: 0 lần viết cứng 25000 hay 24000 (tỷ giá)
☐ Admin đổi tỷ giá → giá hiển thị đổi trong ≤ 5 phút (hoặc ngay nếu xóa cache)
```

🔍 **KIỂM CHỨNG**

```bash
grep -rn '2[45]000' src/ --include=*.cs --include=*.ts --include=*.tsx \
  | grep -iv 'test\|spec\|comment' \
  && echo "⚠️ CÓ THỂ CÒN VIẾT CỨNG TỶ GIÁ" || echo "✓ Không viết cứng"

curl -s localhost:5000/swagger/v1/swagger.json \
  | jq -r '.paths | to_entries[] | select(.key|test("audit")) | "\(.key): \(.value|keys|join(","))"'
# chỉ được thấy "get"
```

---

## 📋 Danh mục kiểm tra kết thúc NHÓM D

```text
☐ ProblemDetails có traceId ở MỌI phản hồi lỗi
☐ 0 lần DateTimeOffset.UtcNow trong Application/Domain
☐ Mật khẩu PBKDF2 v3 · chống dò · chống liệt kê người dùng (đã đo thời gian)
☐ Đổi mật khẩu vô hiệu hóa session khác
☐ DeIdentificationService tồn tại, có test reflection, MẶC ĐỊNH không chia sẻ
☐ Audit log chỉ ghi thêm
☐ Tỷ giá đọc từ system_settings, không viết cứng
☐ Coverage backend ≥ 70% dòng / 60% nhánh
☐ Ảnh chụp trạng thái: docs/_states/state_<YYYY-MM-DD>_nhom-d-xong.md
```

---

# PHẦN 5 — NHÓM E: FRONTEND NỀN TẢNG

| | |
|---|---|
| **Phase** | P2 · `WG-P2-05`→`07` |
| **Giờ** | 16 (4 ngày) |
| **Kết quả** | React chạy · **DTO sinh tự động từ OpenAPI** · hệ thống thiết kế trích từ prototype |
| **Đặc điểm** | ⭐ `WG-P2-06` (DTO sinh tự động) là **thứ ngăn lệch kiểu giữa backend và frontend suốt cả dự án** |

---

## ▸ E1 — Khởi tạo React + hệ thống thiết kế từ prototype ⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 6 | P2 | `WG-P2-05` | B1 |

🎯 **MỤC TIÊU** — Ứng dụng React chạy, với **hệ thống thiết kế trích xuất từ prototype đã cập nhật** — không thiết kế lại từ đầu.

> ⭐ **Vì sao giữ thiết kế prototype (`ADR-007`):** prototype đã có 17 trang với ngôn ngữ thiết kế nhất quán, bảng màu, kiểu chữ, khoảng cách. Thiết kế lại là **tự nguyện bỏ đi vài chục giờ công đã bỏ ra** và tạo thêm rủi ro không nhất quán. Việc ở đây là **trích xuất**, không phải sáng tạo.

🤖 **PROMPT**

```text
Khởi tạo frontend React và trích xuất hệ thống thiết kế từ prototype.

ĐỌC TRƯỚC:
- docs/design-system.md §10 — token đã trích từ prototype
- docs/tech-stack.md — phiên bản cụ thể từng thư viện
- .agents/rules/ui-ux-standards.md — chuẩn UI/UX của framework
- Prototype gốc trong docs/_intake/frontend_beautyai/ —
  ĐỌC css/ và các tệp html để lấy giá trị token THỰC TẾ

Bước 1 — Khởi tạo:
  Vite 6 + React 19 + TypeScript 5.7 (strict: true)
  Thư viện theo ĐÚNG phiên bản trong docs/tech-stack.md:
    react-router-dom v7 · @tanstack/react-query v5 · zustand v5
    · react-hook-form + zod · recharts · vitest + @testing-library/react
    · playwright + @axe-core/playwright
  ⚠️ KHÔNG thêm thư viện ngoài danh sách mà không hỏi tôi trước.

Bước 2 — Token thiết kế (src/styles/tokens.css):
  Trích TỪ PROTOTYPE, không tự chọn: màu · kiểu chữ · thang khoảng cách
  · bán kính · đổ bóng · breakpoint
  Khai báo dưới dạng CSS custom property trên :root.
  ⚠️ Sau bước này, KHÔNG được dùng giá trị màu/khoảng cách viết trực tiếp
     trong component. Chỉ dùng var(--...).

Bước 3 — Bố cục ứng dụng:
  AppShell · Header (ô tìm kiếm · badge giỏ hàng · menu người dùng)
  · Footer · Sidebar (chỉ admin)
  Điều hướng từ prototype. Vùng mốc ARIA đúng:
  header · nav · main · footer, mỗi vùng có aria-label khi lặp.

Bước 4 — Component UI cơ bản (src/components/ui/):
  Button · Input · Select · Checkbox · Radio · Badge · Card · Modal
  · Toast · Skeleton · EmptyState · Pagination · Tabs · Accordion
  · Tooltip · Breadcrumb

  Yêu cầu BẮT BUỘC cho MỌI component (.agents/rules/ui-ux-standards.md):
    • Điều hướng bàn phím đầy đủ · chỉ báo tiêu điểm RÕ RÀNG
      (không bao giờ outline: none mà không thay bằng chỉ báo khác)
    • Vùng chạm ≥ 44×44px — không nhỏ hơn, kể cả trên desktop
    • Nhãn ARIA đúng
    • Tương phản ≥ 4,5:1 cho chữ thường, ≥ 3:1 cho chữ lớn
    • Modal: bẫy tiêu điểm · Esc đóng · trả tiêu điểm về nơi gọi

Bước 5 — ErrorBoundary + trang 404 + trang lỗi 500
  Dùng lại thiết kế 404.html đã có trong prototype.

Bước 6 — Mỗi component có một test Vitest cơ bản + một kiểm tra axe.

Bước 7 — Ghi artifact thiết kế vào docs/_ui-ux_design/ (lớp 5):
  Chạy workflow /ux-design (.agents/workflows/ux-design.md).
  ⚠️ ĐỌC README của docs/_ui-ux_design/ trước — thư mục này có quy ước
     đánh phiên bản riêng của framework.
  Nội dung cần ghi:
    • bảng token đã trích (màu · chữ · khoảng cách · bán kính · bóng)
    • ảnh chụp 17 trang prototype làm đường cơ sở trực quan
    • ma trận component: component nào thay cho phần nào của prototype
    • các điểm prototype KHÔNG chuyển sang React và lý do
  ⚠️ docs/design-system.md (lớp 2) là HỢP ĐỒNG — nó quy định token và
     quy tắc. docs/_ui-ux_design/ (lớp 5) là ARTIFACT — nó ghi lại quá
     trình và bản nháp. Đừng lẫn hai thứ: nếu có mâu thuẫn, lớp 2 thắng.

TUYỆT ĐỐI KHÔNG:
- Thiết kế lại giao diện. Trích xuất từ prototype. (ADR-007)
- Thêm thư viện UI dựng sẵn (Material UI, Ant Design, Chakra) —
  sẽ phá ngôn ngữ thiết kế của prototype.
- Viết giá trị màu/khoảng cách trực tiếp trong component.
- Dùng outline: none mà không có chỉ báo tiêu điểm thay thế.
```

✅ **XONG KHI**

```text
☐ npm run dev chạy, trang chủ hiển thị đúng ngôn ngữ thiết kế prototype
☐ npm run typecheck · lint · test — tất cả xanh
☐ Grep src/components/: 0 lần viết trực tiếp mã màu hex
☐ Mọi component UI điều hướng được bằng Tab, có chỉ báo tiêu điểm thấy rõ
☐ Mọi component UI pass kiểm tra axe
☐ Modal bẫy tiêu điểm, Esc đóng, trả tiêu điểm về nút gọi
☐ Vùng chạm ≥ 44×44 (kiểm bằng devtools trên 3 component nhỏ nhất)
☐ docs/_ui-ux_design/ có artifact theo quy ước phiên bản của thư mục
☐ doctor.py không báo thiếu docs/_ui-ux_design/
```

🔍 **KIỂM CHỨNG**

```bash
cd src/frontend && npm run typecheck && npm run lint && npm run test
grep -rnE '#[0-9a-fA-F]{3,6}' src/components/ | grep -v tokens \
  && echo "⚠️ CÓ MÀU VIẾT TRỰC TIẾP" || echo "✓ Chỉ dùng token"
grep -rn 'outline:\s*none' src/ | grep -v ':focus-visible' \
  && echo "⚠️ CÓ outline:none KHÔNG THAY THẾ" || echo "✓ OK"
```

---

## ▸ E2 — DTO sinh tự động từ OpenAPI ⭐⭐🔗

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 4 | P2 | `WG-P2-06` | D1, E1 |

🎯 **MỤC TIÊU** — Kiểu TypeScript **sinh tự động** từ OpenAPI của backend, và **CI chặn merge khi lệch**.

> ⭐⭐ **Đây là 4 giờ mang lại nhiều giá trị nhất trong Phase 2.**
> Không có nó: backend đổi tên một trường, frontend không biết, lỗi xuất hiện lúc chạy — và bạn mất 30 phút mỗi lần để tìm ra. Nhân với số lần đổi DTO trong 9 phase ⟹ hàng chục giờ.
> Có nó: backend đổi trường ⟹ `npm run typecheck` **đỏ ngay**, chỉ đúng dòng. Và job `openapi-drift` ở CI chặn merge nếu quên sinh lại. (`ADR-008`)

🤖 **PROMPT**

```text
Thiết lập sinh DTO tự động từ OpenAPI.

ĐỌC TRƯỚC: docs/adr/ADR-008-openapi-generated-dto.md
          · docs/api-contract.md · Technical_Design §15.3 (job openapi-drift)

Bước 1 — Script backend xuất đặc tả:
  scripts/export-openapi.sh — build API, gọi /swagger/v1/swagger.json,
  ghi ra artifacts/openapi.json

Bước 2 — Script frontend sinh kiểu:
  package.json: "gen:api": "openapi-typescript ../../artifacts/openapi.json
                            -o src/api/schema.d.ts"

Bước 3 — Khách HTTP:
  openapi-fetch, cấu hình sẵn: baseUrl · credentials: 'include' (cho cookie)
  · xử lý ProblemDetails tập trung → ném AppError có errorCode kiểu hóa

Bước 4 — Lớp bọc TanStack Query:
  Quy ước khóa query: ['products', 'list', params] · ['products', id]
  Cấu hình: staleTime 5 phút cho dữ liệu danh mục · 0 cho giỏ hàng
  Xử lý lỗi toàn cục: 401 → điều hướng đăng nhập · 403 → trang không có quyền
  · 5xx → toast kèm traceId (để người dùng báo lỗi kèm mã)

Bước 5 — Zustand store:
  authStore (người dùng hiện tại) · cartBadgeStore (số lượng)
  · uiStore (toast, modal)
  ⚠️ KHÔNG dùng Zustand cho dữ liệu máy chủ — đó là việc của TanStack Query.
     Zustand chỉ cho trạng thái giao diện phía khách.

Bước 6 — Job CI openapi-drift (nếu B4 chưa làm):
  Build API → xuất openapi.json → chạy openapi-typescript
  → diff với tệp đã commit → FAIL nếu khác.
  Thông điệp lỗi phải nói: "Chạy npm run gen:api rồi commit lại"

TUYỆT ĐỐI KHÔNG:
- Viết tay interface TypeScript trùng với DTO của backend.
  Mọi kiểu DTO PHẢI từ schema.d.ts. (ADR-008)
- Sửa tay src/api/schema.d.ts — tệp sinh tự động.
- Dùng any cho dữ liệu phản hồi API.
```

✅ **XONG KHI**

```text
☐ npm run gen:api sinh được schema.d.ts
☐ Grep src/: 0 interface viết tay trùng tên DTO backend
☐ Grep src/api/: 0 lần dùng "any"
☐ Thử đổi tên một trường DTO ở backend, sinh lại → typecheck ĐỎ đúng dòng
   (rồi hoàn tác)
☐ Job openapi-drift ở CI ĐỎ khi schema.d.ts cũ   ← phải kiểm chứng thật
☐ Lỗi 5xx hiện toast có traceId
```

---

## ▸ E3 — Khung E2E & khả năng tiếp cận

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 6 | P2 | `WG-P2-07` | E1, E2 |

🎯 **MỤC TIÊU** — Khung Playwright và kiểm tra khả năng tiếp cận **sẵn sàng từ đầu**, để 8 luồng E2E thêm dần vào trong các phase sau mà không phải dựng lại.

🤖 **PROMPT**

```text
Thiết lập khung kiểm thử E2E và khả năng tiếp cận.

ĐỌC TRƯỚC: docs/testing-strategy.md · BRD §14 (8 luồng E2E)
          · .agents/rules/ui-ux-standards.md

Bước 1 — Cấu hình Playwright:
  3 thiết bị: Desktop Chrome 1440 · iPhone 14 · Pixel 7
  Tự khởi động backend + frontend trước khi chạy
  Chụp ảnh và quay video khi thất bại (để chẩn đoán nhanh)

Bước 2 — Tiện ích dùng chung (e2e/fixtures/):
  loginAsUser() · loginAsAdmin() · seedTestData() · clearCart()
  ⚠️ Mỗi test phải TỰ LẬP — không phụ thuộc test khác chạy trước.
     Test phụ thuộc thứ tự là nguồn gốc của "test chập chờn".

Bước 3 — Bộ khung 8 luồng E2E của BRD §14 — tạo tệp với test.skip()
  và ghi chú "sẽ bật ở Phase X":
    E2E-01 Khách mua hàng           → bật Phase 5
    E2E-02 Skin ID → Routine → mua  → bật Phase 6
    E2E-03 Phát hiện xung đột        → bật Phase 6
    E2E-04 Trợ lý AI 3 tầng          → bật Phase 7
    E2E-05 Chuyển Zalo               → bật Phase 7
    E2E-06 Admin quản lý sản phẩm    → bật Phase 8
    E2E-07 Đánh giá có kiểm duyệt    → bật Phase 8
    E2E-08 Quyền dữ liệu cá nhân     → bật Phase 8
  ⚠️ Việc tạo khung sẵn có lý do: nó biến "viết E2E" từ một việc
     dễ bị bỏ qua thành một test ĐANG SKIP mà bạn thấy mỗi lần chạy.

Bước 4 — Kiểm tra khả năng tiếp cận:
  Tiện ích checkA11y(page) dùng @axe-core/playwright
  Mức: WCAG 2.1 AA
  Chạy trên MỌI trang chính. Vi phạm mức "serious" hoặc "critical" → FAIL.

Bước 5 — Thêm job e2e vào CI, chạy sau job backend và frontend.
```

✅ **XONG KHI**

```text
☐ npx playwright test chạy được trên cả 3 thiết bị
☐ 8 tệp E2E tồn tại ở trạng thái skip, có ghi chú phase sẽ bật
☐ checkA11y chạy trên trang chủ: 0 vi phạm serious/critical
☐ Job e2e trong CI xanh
☐ Test E2E chạy được ĐỘC LẬP (chạy riêng 1 test bất kỳ → pass)
```

---

## 📋 Danh mục kiểm tra kết thúc NHÓM E — và kết thúc Phase 2

```text
☐ React chạy với ngôn ngữ thiết kế của prototype
☐ 16 component UI, tất cả pass axe, điều hướng bàn phím đầy đủ
☐ DTO sinh tự động · job openapi-drift ĐÃ KIỂM CHỨNG là chặn được
☐ Khung E2E 8 luồng sẵn sàng (skip) · checkA11y hoạt động
☐ 5 job CI xanh
☐ Ảnh chụp trạng thái: docs/_states/state_<YYYY-MM-DD>_phase-2-xong.md

🎉 MỐC: Kết thúc Phase 2 bạn có "bộ xương" hoàn chỉnh —
   API chạy, xác thực hoạt động, frontend có hệ thống thiết kế,
   kiểu dữ liệu tự đồng bộ hai đầu. Từ đây mỗi nhóm tính năng
   là THÊM VÀO, không phải dựng lại.
```

---
# PHẦN 6 — NHÓM F: DANH MỤC · TÌM KIẾM · LỌC THÔNG MINH

| | |
|---|---|
| **Phase** | P3 · `WG-P3-01`→`03` |
| **Giờ** | 28 (7 ngày) |
| **Kết quả** | Người dùng tìm và lọc được sản phẩm · **Lọc Thông Minh là tính năng khác biệt đầu tiên** |

> ⭐ **"Lọc Thông Minh" (`FR-CAT-08`) là tính năng đầu tiên mà đối thủ không có.**
> Mọi sàn TMĐT đều lọc theo giá/thương hiệu. Rất ít sàn lọc được *"bỏ qua sản phẩm chứa thành phần tôi dị ứng"* và *"chỉ hiện sản phẩm phù hợp loại da tôi"*. Tính năng này **chỉ làm được vì nhóm C đã xây từ điển thành phần** — đây là lúc 18 giờ đầu tư ở C3 bắt đầu trả lại.

---

## ▸ F1 — Danh mục & chi tiết cơ bản

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 10 | P3 | `WG-P3-01` | D1, E2, C6 |

🎯 **MỤC TIÊU** — Trang danh sách sản phẩm · cây danh mục · trang thương hiệu, có phân trang và **phân biệt rõ Lớp A / Lớp B**.

🤖 **PROMPT**

```text
Hiện thực module M03 (danh mục) — phần backend và frontend.

ĐỌC TRƯỚC:
- docs/_requirements/M03.md — FR-CAT-01…07
- docs/domain-rules.md — BR-CAT-01…09, BR-PRICE-01…04
- docs/api-contract.md §7.4 (endpoint danh mục)
- BRD §4.4 (chiến lược hai lớp)

BACKEND:
  GET /api/products          — danh sách, phân trang, sắp xếp
  GET /api/products/{slug}   — chi tiết
  GET /api/categories        — cây 3 cấp
  GET /api/brands            — danh sách thương hiệu
  GET /api/brands/{slug}     — sản phẩm của một thương hiệu

  Sắp xếp: mới nhất · giá tăng · giá giảm · đánh giá cao · phổ biến
  ⚠️ Sắp xếp theo "đánh giá cao" PHẢI dùng cận dưới khoảng tin cậy Wilson,
     KHÔNG dùng điểm trung bình thô. (BR-CAT-07)
     Lý do: một sản phẩm 5,0★ với 1 đánh giá sẽ luôn đứng trên sản phẩm
     4,7★ với 500 đánh giá — đó là xếp hạng sai. Wilson xử lý đúng
     điều này bằng cách tính đến SỐ LƯỢNG đánh giá.

  ⚠️ Mặc định CHỈ hiện sản phẩm selling_status='DANG_BAN' (Lớp A).
     Lớp B chỉ xuất hiện khi có tham số rõ ràng ?include_reference=true.
     Lý do: Lớp B không bán được, hiện mặc định sẽ gây thất vọng.

  Giá: lưu USD, hiển thị VND.
  ⚠️ Quy tắc làm tròn (BR-PRICE-02): LÀM TRÒN LÊN đến 1.000đ.
     Math.Ceiling(usd * rate / 1000) * 1000
     Làm tròn xuống có nghĩa bán rẻ hơn giá dự kiến — không được.
  Tỷ giá đọc từ system_settings (D4), KHÔNG viết cứng.

FRONTEND:
  Trang /products — lưới sản phẩm · thanh lọc · sắp xếp · phân trang
  ⚠️ Mọi tham số lọc/sắp xếp/trang PHẢI ở URL query string.
     Lý do: người dùng chia sẻ link lọc được, nút Back hoạt động đúng,
     và tải lại trang không mất bộ lọc. (BR-CAT-09)

  Thẻ sản phẩm: ảnh (lazy load, có kích thước cố định để tránh nhảy layout)
               · tên · thương hiệu · giá VND · số đánh giá
               · badge "Tham khảo" cho Lớp B

  Trạng thái rỗng: khi không có kết quả, KHÔNG hiện lưới trống.
    Hiện: "Không tìm thấy sản phẩm phù hợp" + GỢI Ý nới bộ lọc nào
    (vd "Thử bỏ bộ lọc khoảng giá") + nút xóa toàn bộ bộ lọc.

TUYỆT ĐỐI KHÔNG:
- Sắp xếp theo điểm trung bình thô
- Làm tròn giá xuống
- Viết cứng tỷ giá
- Hiện Lớp B mặc định
- Lưu trạng thái bộ lọc chỉ trong React state (phải ở URL)
```

✅ **XONG KHI**

```text
☐ /products hiện Lớp A, phân trang hoạt động
☐ Sắp xếp "đánh giá cao": sản phẩm 5,0★/1 review KHÔNG đứng trên 4,7★/500 review
☐ Copy URL có bộ lọc → mở tab mới → bộ lọc giữ nguyên
☐ Nút Back trả về đúng bộ lọc trước
☐ Giá 10,50 USD với tỷ giá 25.000 → 263.000đ (làm tròn LÊN từ 262.500)
☐ Admin đổi tỷ giá → giá hiển thị đổi theo
☐ Trạng thái rỗng có gợi ý cụ thể, không phải lưới trống
☐ Lazy load ảnh có kích thước cố định — không nhảy layout khi tải
```

🔍 **KIỂM CHỨNG**

```bash
# Wilson: so hai sản phẩm
curl -s 'localhost:5000/api/products?sort=rating&pageSize=20' \
  | jq -r '.items[] | "\(.ratingAverage)★ (\(.reviewCount)) \(.name)"' | head -20
# Sản phẩm có ít review KHÔNG được chiếm đầu bảng

# Làm tròn lên
curl -s 'localhost:5000/api/products?pageSize=5' \
  | jq -r '.items[] | "\(.priceUsd) USD → \(.priceVnd) VND"'
# priceVnd phải chia hết cho 1000 và >= priceUsd*rate
```

---

## ▸ F2 — Tìm kiếm tiếng Việt ⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 8 | P3 | `WG-P3-02` | F1 |

🎯 **MỤC TIÊU** — Tìm kiếm **không dấu, chịu lỗi chính tả**, hoạt động đúng với tiếng Việt.

> 🔑 **Vì sao task này đáng 8 giờ:** người Việt gõ *"kem chong nang"* chứ không phải *"kem chống nắng"*, và gõ *"niacinamid"* thiếu chữ cuối. Tìm kiếm khớp chính xác sẽ trả về **0 kết quả** cho cả hai — và người dùng rời đi, kết luận rằng sàn không có hàng.

🤖 **PROMPT**

```text
Hiện thực tìm kiếm tiếng Việt (FR-CAT-05, FR-CAT-06).

ĐỌC TRƯỚC: docs/_requirements/M03.md · docs/domain-rules.md BR-CAT-05, BR-CAT-06
          · docs/db-schema/schema.sql (index GIN pg_trgm)

Bước 1 — Dùng hàm vn_normalize() đã tạo ở C1 cho CẢ truy vấn VÀ dữ liệu.
  Index GIN pg_trgm trên vn_normalize(name) và vn_normalize(brand_name).
  ⚠️ PHẢI chuẩn hóa cả hai phía. Chuẩn hóa chỉ một phía là lỗi phổ biến
     và kết quả là tìm kiếm vẫn không ra.

Bước 2 — Chiến lược 3 tầng, chạy theo thứ tự, dừng khi có đủ kết quả:
  Tầng 1 — Khớp tiền tố: vn_normalize(name) LIKE 'tu-khoa%'
           → kết quả chính xác nhất, xếp đầu
  Tầng 2 — Khớp chứa: vn_normalize(name) LIKE '%tu-khoa%'
  Tầng 3 — Khớp mờ trigram: similarity(vn_normalize(name), 'tu-khoa') > 0,3
           → chịu được lỗi chính tả

  Gộp kết quả, loại trùng, xếp theo tầng rồi theo độ tương đồng.

Bước 3 — Tìm kiếm cả trong tên THÀNH PHẦN:
  Gõ "niacinamide" → trả về sản phẩm CHỨA niacinamide, không chỉ sản phẩm
  có chữ đó trong tên. Đây là điều đối thủ thường không làm được.
  Hiện rõ trong kết quả: "Chứa thành phần: Niacinamide".

Bước 4 — Gợi ý tự động (autocomplete):
  Endpoint GET /api/search/suggest?q=...
  Trả 3 nhóm: sản phẩm (5) · thương hiệu (3) · thành phần (3)
  Debounce 250ms ở frontend. Giới hạn 10 yêu cầu/phút/IP.

Bước 5 — Khi không có kết quả (QUAN TRỌNG cho trải nghiệm):
  KHÔNG chỉ hiện "Không tìm thấy".
  Hiện: "Không tìm thấy '<từ khóa>'"
      + "Có phải bạn muốn tìm: <gợi ý gần nhất bằng trigram>"
      + 6 sản phẩm phổ biến cùng danh mục (nếu đoán được danh mục)
      + ô "Gửi yêu cầu sản phẩm" (ghi vào bảng để biết người dùng muốn gì)

Bước 6 — Test BẮT BUỘC các cặp sau (viết thành test tự động):
  "kem chong nang"  → ra sản phẩm "Kem Chống Nắng"
  "niacinamid"      → ra sản phẩm chứa Niacinamide (thiếu chữ e)
  "vitamin c"       → ra cả "Vitamin C" và "Ascorbic Acid"
  "retinol"         → ra sản phẩm chứa Retinol
  "cerave"          → ra thương hiệu CeraVe (sai hoa/thường)
  "tay te bao chet" → ra sản phẩm tẩy tế bào chết

TUYỆT ĐỐI KHÔNG:
- Chỉ chuẩn hóa một phía
- Dùng ILIKE '%...%' đơn thuần mà không có index — sẽ quét toàn bảng
- Trả trang "Không tìm thấy" trống không gợi ý gì
```

✅ **XONG KHI**

```text
☐ 6 cặp test ở bước 6 PASS (viết thành test tự động, không kiểm tay)
☐ Tìm "niacinamide" trả sản phẩm CHỨA nó, có nhãn "Chứa thành phần"
☐ Autocomplete trả 3 nhóm, debounce hoạt động (kiểm bằng network tab)
☐ Trang không kết quả có gợi ý + sản phẩm thay thế + ô gửi yêu cầu
☐ EXPLAIN ANALYZE cho thấy có DÙNG index GIN (không Seq Scan)
☐ Thời gian phản hồi p95 < 300ms với dữ liệu đầy đủ
```

🔍 **KIỂM CHỨNG**

```bash
for q in "kem chong nang" "niacinamid" "vitamin c" "retinol" "cerave" "tay te bao chet"; do
  n=$(curl -s "localhost:5000/api/products?q=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$q")" | jq '.totalItems')
  echo "$q → $n kết quả"
  [ "$n" -gt 0 ] || echo "  ⚠️ THẤT BẠI"
done

docker compose exec -T postgres psql -U beautyai -d beautyai -c "
EXPLAIN ANALYZE SELECT product_id FROM products
WHERE vn_normalize(name) LIKE '%kem-chong-nang%' LIMIT 20;"
# Phải thấy "Bitmap Index Scan", KHÔNG phải "Seq Scan"
```

---

## ▸ F3 — Lọc Thông Minh ⭐⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 10 | P3 | `WG-P3-03` | F1, D3 |

🎯 **MỤC TIÊU** — Bộ lọc dựa trên **hồ sơ da của chính người dùng** — tính năng khác biệt đầu tiên của sản phẩm.

🤖 **PROMPT**

```text
Hiện thực Lọc Thông Minh (FR-CAT-08).

ĐỌC TRƯỚC: docs/_requirements/M03.md FR-CAT-08 (đọc TOÀN BỘ điều kiện chấp nhận)
          · docs/domain-rules.md BR-CAT-08, BR-ING-04b
          · Prototype products.html (đã có nút "Phù hợp với tôi" ở V1.0)

BA bộ lọc thông minh:

1. "Phù hợp với loại da của tôi"
   Lọc theo nhãn đặc tính sản phẩm khớp skin_type trong hồ sơ.
   Chỉ bật khi người dùng ĐÃ có hồ sơ da. Chưa có → hiện nút
   "Tạo hồ sơ da để dùng bộ lọc này" dẫn tới Skin Quiz.

2. "Không chứa thành phần tôi dị ứng"
   Loại sản phẩm chứa bất kỳ INCI trong allergy_inci_ids của hồ sơ.

   ⚠️⚠️ ĐIỂM QUAN TRỌNG NHẤT CỦA TASK NÀY (BR-ING-04b):
   Nếu sản phẩm có tỷ lệ phủ nhận diện INCI < 100%, hệ thống
   KHÔNG THỂ khẳng định là nó không chứa chất gây dị ứng.

   Xử lý ĐÚNG:
     - Vẫn hiện sản phẩm đó, NHƯNG gắn nhãn:
       "Chưa phân tích đầy đủ (38/52 thành phần) — không thể xác nhận"
     - KHÔNG âm thầm loại nó khỏi kết quả
     - KHÔNG âm thầm coi nó là an toàn

   Xử lý SAI (không được làm):
     - Loại nó đi ⟹ người dùng tưởng không có sản phẩm phù hợp
     - Giữ nó không nhãn ⟹ người dùng tưởng đã được kiểm tra ⟹ NGUY HIỂM

   Đây là chỗ mà sự trung thực về dữ liệu quan trọng hơn trải nghiệm mượt.

3. "Trong ngân sách của tôi"
   Lọc theo budget_band trong hồ sơ.

GIAO DIỆN:
  Cụm 3 nút bật/tắt ở đầu thanh lọc, tách khỏi bộ lọc thường.
  Mỗi nút có tooltip giải thích nó làm gì.
  Khi bật, hiện dòng tóm tắt: "Đang lọc theo hồ sơ da của bạn:
  da dầu · tránh Fragrance, Alcohol Denat · ngân sách 300–700k"
  + liên kết "Sửa hồ sơ".

  ⚠️ Trạng thái bật/tắt PHẢI ở URL query string (BR-CAT-09).

TRẠNG THÁI RỖNG ĐẶC BIỆT:
  Nếu 3 bộ lọc thông minh cùng bật mà ra 0 kết quả, KHÔNG hiện trang trống.
  Hiện: "Không có sản phẩm nào thỏa cả 3 điều kiện"
      + chỉ rõ bộ lọc NÀO đang loại nhiều nhất
        (vd "Bộ lọc ngân sách đang loại 187 sản phẩm")
      + nút tắt riêng từng bộ lọc
  Lý do: người dùng cần biết PHẢI NỚI CÁI GÌ, không phải đoán.

TUYỆT ĐỐI KHÔNG:
- Âm thầm loại sản phẩm có dữ liệu thành phần không đầy đủ
- Khẳng định "không chứa X" khi tỷ lệ phủ < 100%
- Dùng từ "an toàn" ở bất kỳ đâu trong tính năng này  (INV-01)
- Lưu trạng thái bộ lọc chỉ trong React state
```

✅ **XONG KHI**

```text
☐ 3 bộ lọc hoạt động với tài khoản có hồ sơ da
☐ Tài khoản chưa có hồ sơ → hiện nút dẫn tới Skin Quiz, không hiện lỗi
☐ Sản phẩm có tỷ lệ phủ < 100% VẪN HIỆN, có nhãn cảnh báo rõ ràng
   ← điều kiện quan trọng nhất
☐ Grep: 0 lần dùng từ "an toàn"/"safe" trong tính năng này
☐ Trạng thái 3 nút ở URL, chia sẻ link giữ nguyên
☐ 3 bộ lọc cùng bật ra 0 kết quả → hiện bộ lọc nào loại nhiều nhất
☐ Dòng tóm tắt hiện đúng nội dung hồ sơ
```

---

## 📋 Danh mục kiểm tra kết thúc NHÓM F

```text
☐ Danh mục · tìm kiếm · 3 bộ lọc thông minh hoạt động
☐ 6 cặp test tìm kiếm tiếng Việt PASS
☐ Xếp hạng dùng Wilson, không dùng trung bình thô
☐ Giá làm tròn LÊN, tỷ giá từ cấu hình
☐ Dữ liệu thành phần không đầy đủ được GẮN NHÃN, không bị loại
☐ Mọi trạng thái lọc ở URL
☐ 0 lần dùng từ "an toàn" trong toàn nhóm
☐ Ảnh chụp trạng thái: docs/_states/state_<YYYY-MM-DD>_nhom-f-xong.md
```

---

# PHẦN 7 — NHÓM G: TRANG CHI TIẾT · PHÂN TÍCH INCI · ĐIỂM PHÙ HỢP

| | |
|---|---|
| **Phase** | P3 · `WG-P3-04`→`07` |
| **Giờ** | 36 (9 ngày) |
| **Kết quả** | Trang chi tiết sản phẩm **minh bạch về dữ liệu** · Điểm Phù Hợp · gợi ý có giải thích |
| **Đặc điểm** | ⭐⭐ Nhóm hiện thực `INV-01` — bất biến quan trọng nhất của sản phẩm |

> ⭐⭐ **Đây là nhóm làm nên hoặc phá vỡ tính chính trực của sản phẩm.**
> `Điểm Phù Hợp` là câu trả lời cho câu hỏi *"BeautyAI khác Yuka ở đâu?"*:
> - Yuka nói *"sản phẩm này 32/100 — xấu"* ⟹ một tuyên bố phổ quát về chất lượng, không có cơ sở khoa học, và đã bị kiện ở Pháp
> - BeautyAI nói *"phù hợp 96/100 **với hồ sơ da của bạn**, dựa trên 38/52 thành phần nhận diện được, vì các lý do sau…"* ⟹ một tuyên bố **có phạm vi**, **có nguồn**, **có thể kiểm chứng**

---

## ▸ G1 — Trang chi tiết & bảng INCI minh bạch ⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 10 | P3 | `WG-P3-04` | F1 |

🎯 **MỤC TIÊU** — Trang chi tiết với bảng thành phần **nói thật về điều nó không biết**.

🤖 **PROMPT**

```text
Hiện thực trang chi tiết sản phẩm và bảng INCI (FR-PDP-01…06).

ĐỌC TRƯỚC:
- docs/_requirements/M04.md — FR-PDP-01…06
- docs/domain-rules.md — BR-ING-01…07  (ĐỌC KỸ BR-ING-01)
- Prototype product-detail.html (đã cập nhật V1.0 — THEO ĐÚNG bố cục đó)

Bố cục (theo prototype):
  Thư viện ảnh · tên · thương hiệu · giá · nút thêm giỏ
  · Thẻ Điểm Phù Hợp (G2 sẽ làm — tạm để chỗ)
  · Bảng thành phần
  · Vì sao được gợi ý (G3)
  · Người có làn da giống bạn nói gì (G4)
  · Sản phẩm tương tự · thường mua kèm (G3)

BẢNG THÀNH PHẦN — các cột ĐÚNG như sau:
  # · Tên INCI · Tên tiếng Việt · Chức năng
  · Trạng thái (CosIng EU) · Comedogenic (tham khảo)

  ⛔ KHÔNG có cột nào tên "An toàn", "Độ an toàn", "Mức nguy hiểm",
     "Safety", hay bất kỳ biến thể. (INV-01 · BR-ING-01)

  Cột "Trạng thái (CosIng EU)" chỉ nhận các giá trị:
     "Được dùng"  ·  "Giới hạn nồng độ"  ·  "Bị hạn chế"  ·  "Chưa có dữ liệu"
  Đây là TRẠNG THÁI PHÁP LÝ theo quy định EU — một sự kiện khách quan,
  không phải đánh giá của BeautyAI.

  Cột Comedogenic: hiện kèm chữ "(tham khảo)" và tooltip giải thích
  thang điểm này có hạn chế, không áp dụng đồng đều cho mọi loại da.

  ⚠️ GIỮ NGUYÊN thứ tự thành phần từ nhãn gốc (BR-ING-07).
     Thứ tự mang thông tin về nồng độ tương đối — xáo trộn là làm mất dữ liệu.

PHẦN MINH BẠCH (bắt buộc, không phải tùy chọn):
  Dòng trên bảng: "Đã nhận diện 38/52 thành phần (73%)"
  Mục <details> mở được: "14 thành phần chưa nhận diện"
    → liệt kê NGUYÊN VĂN từng thành phần chưa khớp
    → kèm câu: "Chúng tôi chưa có dữ liệu diễn giải cho các thành phần này.
       Điều này không có nghĩa chúng có vấn đề — chỉ là từ điển của chúng tôi
       chưa bao gồm."

  ⚠️ Vì sao phần này BẮT BUỘC: nó biến điểm yếu (dữ liệu chưa đầy đủ)
  thành điểm mạnh (sự trung thực). Người dùng tin một hệ thống nói
  "tôi không biết 14 thành phần" hơn một hệ thống im lặng.

Dị ứng: nếu người dùng có hồ sơ da với allergy_inci_ids, các dòng trùng
  được HIỆN RÕ (viền + nhãn "Bạn đã đánh dấu tránh thành phần này"),
  đặt ở ĐẦU bảng.

TUYỆT ĐỐI KHÔNG:
- Thêm cột hay nhãn nào mang nghĩa an toàn/nguy hiểm  (INV-01)
- Sắp xếp lại thứ tự thành phần
- Ẩn thành phần chưa nhận diện
- Gán giá trị mặc định cho comedogenic khi không có dữ liệu
```

✅ **XONG KHI**

```text
☐ Bảng INCI hiện đủ cột đúng tên, 0 cột mang nghĩa an toàn
☐ Thứ tự thành phần khớp 100% với dữ liệu gốc (test so sánh display_order)
☐ Dòng "Đã nhận diện X/Y (Z%)" hiện số THẬT, không làm đẹp
☐ Mục "thành phần chưa nhận diện" liệt kê nguyên văn, có câu giải thích
☐ Thành phần người dùng đánh dấu tránh hiện ở ĐẦU bảng, có nhãn
☐ Grep toàn bộ frontend: 0 lần "Safety"/"An toàn"/"Nguy hiểm" (ngoài phần
  giải thích vì sao KHÔNG có điểm an toàn)
☐ Test E2E: xem chi tiết sản phẩm, pass axe
```

---

## ▸ G2 — Điểm Phù Hợp ⭐⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 10 | P3 | `WG-P3-05` | G1, D3 |

🎯 **MỤC TIÊU** — Điểm Phù Hợp 0–100, **tính theo hồ sơ da từng người**, **tính lúc đọc**, **giải thích được từng điểm**.

> ⭐⭐ **Đây là hiện thực của `INV-01`.** Đọc `ADR-011` trước khi bắt đầu. Ba đặc tính không thể thương lượng:
> 1. **Theo người** — cùng một sản phẩm có điểm khác nhau với hai hồ sơ da khác nhau. Nếu điểm giống nhau, bạn đã làm ra một Safety Score.
> 2. **Tính lúc đọc** — không lưu vào DB. Lưu lại nghĩa là nó trở thành thuộc tính CỦA SẢN PHẨM, tức là một Safety Score trá hình.
> 3. **Giải thích được** — mỗi điểm cộng/trừ có một dòng lý do mà người dùng đọc được.

🤖 **PROMPT**

```text
Hiện thực Điểm Phù Hợp (FR-PDP-07).

ĐỌC TRƯỚC (bắt buộc, đọc HẾT trước khi viết dòng code đầu tiên):
- docs/adr/ADR-011-suitability-score-computed-on-read.md
- docs/_requirements/M04.md FR-PDP-07 (toàn bộ điều kiện chấp nhận)
- docs/domain-rules.md BR-SUIT-01…08
- BRD §4.3 G-01 (vì sao bỏ Safety Score) và §17.3 (công thức chi tiết)
- Prototype product-detail.html — thẻ Điểm Phù Hợp (đã có ở V1.0)

BA ĐẶC TÍNH KHÔNG THỂ THAY ĐỔI:

  1. THEO NGƯỜI — đầu vào là (product, skinProfile).
     Không có hồ sơ da ⟹ KHÔNG hiện điểm.
     Thay vào đó hiện: "Tạo hồ sơ da để xem mức độ phù hợp"
     ⛔ KHÔNG hiện điểm mặc định hay điểm trung bình.

  2. TÍNH LÚC ĐỌC — KHÔNG lưu vào bảng products hay bất kỳ bảng nào.
     ⛔ KHÔNG thêm cột suitability_score vào DB.
     ⛔ KHÔNG cache theo product_id (chỉ được cache theo
        cặp (product_id, profile_hash) với TTL ngắn, nếu cần hiệu năng).

  3. GIẢI THÍCH ĐƯỢC — trả về danh sách yếu tố:
     [ { label, delta, reason } ]
     Vd: { "Phù hợp loại da dầu", +4,
           "Sản phẩm có nhãn đặc tính 'dành cho da dầu'" }
         { "Chứa Alcohol Denat", -1,
           "Bạn đã đánh dấu tránh thành phần này" }

CÔNG THỨC (theo BRD §17.3):
  Điểm gốc 70, cộng/trừ theo các yếu tố, kẹp trong [0, 100].
  Mỗi yếu tố có delta GIỚI HẠN — không yếu tố nào được quyết định một mình.

HIỂN THỊ (theo prototype):
  Vòng tròn điểm + nhãn mức ("Rất phù hợp" / "Phù hợp" / "Cân nhắc")
  + dòng phạm vi BẮT BUỘC:
    "Dựa trên hồ sơ da của bạn và 38/52 thành phần nhận diện được (73%)"
  + mục mở được "Vì sao có điểm này" liệt kê từng yếu tố với delta
  + liên kết "Sửa hồ sơ da"

  ⚠️ Dòng phạm vi là phần KHÔNG ĐƯỢC BỎ. Nó là thứ phân biệt
  "96/100 phù hợp với bạn, dựa trên dữ liệu có hạn" với
  "96/100 — sản phẩm tốt".

  ⚠️ Nếu tỷ lệ phủ < 50%: hiện thêm cảnh báo rõ ràng
    "Dữ liệu thành phần của sản phẩm này còn hạn chế, điểm phù hợp
     có độ tin cậy thấp."

TEST BẮT BUỘC:
  Đơn vị:
    - Cùng product + 2 skinProfile khác nhau → ĐIỂM KHÁC NHAU
      ← test quan trọng nhất, chứng minh nó không phải Safety Score
    - Không hồ sơ → trả null, không trả số
    - Mọi điểm nằm trong [0, 100]
    - Tổng delta của các yếu tố + 70 = điểm cuối (tính minh bạch)
    - 22 golden case trong BRD §17.5 cho ra điểm kỳ vọng
  Kiến trúc:
    - Test Bài 5 (NoSafetyScore) vẫn PASS
    - Test MỚI: không bảng nào trong DB có cột tên chứa "suitability"
      ← chứng minh nó không bị lưu

TUYỆT ĐỐI KHÔNG:
- Lưu điểm vào DB dưới bất kỳ hình thức
- Hiện điểm khi không có hồ sơ da
- Hiện điểm không kèm dòng phạm vi
- Dùng từ "an toàn"/"nguy hiểm" trong nhãn mức
- Để một yếu tố đơn lẻ quyết định toàn bộ điểm
```

✅ **XONG KHI**

```text
☐ Test: cùng sản phẩm, 2 hồ sơ → 2 điểm KHÁC NHAU      ← bắt buộc
☐ Test: không bảng nào có cột chứa "suitability"       ← bắt buộc
☐ Không hồ sơ → hiện nút tạo hồ sơ, KHÔNG hiện điểm
☐ Dòng phạm vi luôn hiện kèm điểm
☐ Tỷ lệ phủ < 50% → hiện cảnh báo độ tin cậy thấp
☐ Mục "Vì sao có điểm này" liệt kê đủ yếu tố, tổng delta khớp điểm
☐ 22 golden case PASS
☐ Test kiến trúc Bài 5 vẫn PASS
```

🔍 **KIỂM CHỨNG**

```bash
docker compose exec -T postgres psql -U beautyai -d beautyai -c "
SELECT table_name||'.'||column_name FROM information_schema.columns
WHERE column_name ILIKE '%suitab%' OR column_name ILIKE '%safety%';"
# PHẢI RỖNG

dotnet test --filter "FullyQualifiedName~Suitability"
dotnet test --filter "FullyQualifiedName~GoldenCase"
dotnet test tests/BeautyAI.ArchitectureTests
```

---

## ▸ G3 — Gợi ý sản phẩm có giải thích ⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 8 | P3 | `WG-P3-06` | G2, C6 |

🎯 **MỤC TIÊU** — "Sản phẩm tương tự" · "Thường mua kèm" · **"Vì sao sản phẩm này được gợi ý"** — mỗi gợi ý nói rõ **vì sao**.

> 🔑 **Panel "Vì sao" là tính năng nhỏ với tác động lớn.** Mọi sàn TMĐT có "sản phẩm liên quan" mà không ai biết vì sao chúng liên quan. Nói ra lý do biến gợi ý từ *quảng cáo* thành *tư vấn*.

🤖 **PROMPT**

```text
Hiện thực gợi ý sản phẩm (FR-PDP-08, FR-PDP-09, FR-PDP-11).

ĐỌC TRƯỚC: docs/_requirements/M04.md · docs/domain-rules.md BR-REC-01…09
          · Prototype product-detail.html — panel "Vì sao sản phẩm này được
            gợi ý" (đã có ở V1.0, theo đúng bố cục đó)

1. Sản phẩm tương tự (FR-PDP-08):
   Đọc từ bảng product_similarity (đã tính offline ở C6).
   Lọc bỏ: sản phẩm NGUNG_BAN · hết hàng · chính nó.
   ⚠️ Hiện kèm LÝ DO tương đồng, không chỉ hiện danh sách:
      "Tương tự vì cùng chứa Niacinamide, Hyaluronic Acid và
       cùng nhóm sản phẩm dưỡng ẩm"

2. Thường mua kèm (FR-PDP-09):
   Đọc từ bảng association_rules.
   ⚠️ AC-02 BẮT BUỘC: hiện rõ nguồn gốc dữ liệu —
      "Dựa trên dữ liệu người dùng đánh giá cùng lúc hai sản phẩm
       (không phải dữ liệu giỏ hàng thực tế)"
      Lý do: dataset không có dữ liệu giỏ hàng; nói rõ là trung thực,
      che đi là phóng đại.
   Hiện lift/confidence dưới dạng người đọc được:
      "78% người dùng sản phẩm này cũng dùng sản phẩm kia"

3. Panel "Vì sao sản phẩm này được gợi ý" (FR-PDP-11) — làm theo
   prototype, với các dòng yếu tố:
      +3  Phù hợp loại da dầu của bạn
      +4  Chứa Niacinamide — bạn đã quan tâm thành phần này
      +4  Trong ngân sách 300–700k của bạn
      +1  Đánh giá tốt từ người có làn da tương tự (4,3/5)
      +1  Không chứa thành phần bạn đánh dấu tránh
      −1  Chứa Fragrance — có thể gây kích ứng với da nhạy cảm
   Kèm dòng cuối: "Tổng: 82/100 phù hợp với hồ sơ của bạn"

   ⚠️ Các yếu tố PHẢI khớp với yếu tố mà G2 trả về — KHÔNG tính hai lần
      bằng hai công thức khác nhau. Dùng CÙNG một dịch vụ.

TUYỆT ĐỐI KHÔNG:
- Hiện gợi ý không có lý do
- Che nguồn gốc dữ liệu luật mua kèm
- Tính yếu tố giải thích bằng công thức khác với G2
- Gợi ý sản phẩm NGUNG_BAN hay hết hàng
```

✅ **XONG KHI**

```text
☐ Sản phẩm tương tự hiện kèm lý do tương đồng cụ thể
☐ Thường mua kèm hiện rõ hạn chế nguồn dữ liệu  ← AC-02
☐ Panel "Vì sao" hiện đúng các yếu tố, tổng khớp Điểm Phù Hợp của G2
☐ 0 sản phẩm NGUNG_BAN/hết hàng xuất hiện trong gợi ý
☐ Không có hồ sơ da → panel "Vì sao" hiện nút tạo hồ sơ thay vì yếu tố
```

---

## ▸ G4 — Đánh giá theo nhóm da tương tự ⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 8 | P3 | `WG-P3-07` | G1, C5 |

🎯 **MỤC TIÊU** — "Người có làn da **giống bạn** nói gì" — lọc đánh giá theo nhóm da, **kể cả khi tin tức là xấu**.

> 🔑 **Đây là tính năng tạo niềm tin mạnh nhất trong nhóm G.** Một sàn bình thường hiện "4,1/5 từ 500 đánh giá". BeautyAI hiện: *"4,3/5 từ 47 người da dầu như bạn — nhưng chỉ 3,2/5 từ người da nhạy cảm"*. Dòng thứ hai làm người dùng tin dòng thứ nhất.

🤖 **PROMPT**

```text
Hiện thực đánh giá theo nhóm da tương tự (FR-PDP-12).

ĐỌC TRƯỚC: docs/_requirements/M04.md FR-PDP-12
          · docs/domain-rules.md BR-REV-01…08
          · Prototype product-detail.html — khối "Người có làn da giống bạn
            nói gì" (đã có ở V1.0)

Logic:
  Lọc đánh giá theo nhóm da tương tự người dùng
  (cùng skin_type, và nếu có thì cùng sensitivity_level).

  ⚠️ Ngưỡng tối thiểu: ≥ 5 đánh giá trong nhóm mới hiện số liệu nhóm.
     Dưới 5 → hiện "Chưa đủ đánh giá từ người có làn da giống bạn
     (hiện có 3)" và chỉ hiện số liệu tổng.
     Lý do: 2 đánh giá không phải một mẫu — hiện "5,0/5 từ nhóm của bạn"
     dựa trên 2 người là gây hiểu nhầm.

HIỂN THỊ (theo prototype):
  Dòng 1: "4,3/5 — từ 47 người có làn da dầu như bạn"
  Dòng 2: "4,1/5 — trung bình toàn bộ 500 đánh giá"
  + 2–3 đánh giá nguyên văn từ nhóm tương tự

  ⚠️⚠️ BẮT BUỘC — CẢNH BÁO NGHỊCH CHIỀU:
  Nếu có nhóm da nào có điểm THẤP RÕ RỆT (≥ 0,8 điểm dưới mức tổng
  và nhóm đó có ≥ 5 đánh giá), PHẢI hiện:
    "Lưu ý: người có da nhạy cảm đánh giá sản phẩm này 3,2/5 —
     thấp hơn mức trung bình"

  Hiện cảnh báo này KỂ CẢ KHI nó làm giảm khả năng bán được sản phẩm.
  Đây là điều khiến người dùng tin những gì BeautyAI nói.

Kiểm duyệt (BR-REV-06): đánh giá do người dùng gửi vào trạng thái
  CHO_DUYET, không hiện ngay. (Nhóm M làm phần duyệt.)
  Đánh giá từ dataset khởi tạo đã ở trạng thái DA_DUYET.

TUYỆT ĐỐI KHÔNG:
- Hiện số liệu nhóm khi < 5 đánh giá
- Ẩn cảnh báo nghịch chiều vì sợ ảnh hưởng doanh số
- Hiện đánh giá chưa duyệt
- Hiện thông tin định danh của người đánh giá (chỉ dùng external_author_ref)
```

✅ **XONG KHI**

```text
☐ Nhóm ≥ 5 đánh giá → hiện cả điểm nhóm và điểm tổng
☐ Nhóm < 5 → hiện thông báo chưa đủ, chỉ hiện điểm tổng
☐ Cảnh báo nghịch chiều HIỆN khi có nhóm thấp hơn ≥ 0,8 điểm
   ← tìm một sản phẩm thật trong dữ liệu để kiểm chứng điều này
☐ 2–3 đánh giá nguyên văn từ nhóm tương tự
☐ 0 đánh giá CHO_DUYET xuất hiện ở trang công khai
☐ 0 thông tin định danh người đánh giá bị hiện
```

---

## 📋 Danh mục kiểm tra kết thúc NHÓM G — và kết thúc Phase 3

```text
☐ Bảng INCI có cột đúng, 0 cột an toàn, giữ nguyên thứ tự
☐ Tỷ lệ phủ hiện số THẬT · thành phần chưa nhận diện liệt kê nguyên văn
☐ Điểm Phù Hợp: theo người · không lưu DB · giải thích được · có dòng phạm vi
☐ Test "2 hồ sơ → 2 điểm khác nhau" PASS
☐ Gợi ý có lý do · luật mua kèm nói rõ hạn chế dữ liệu
☐ Đánh giá nhóm tương tự · cảnh báo nghịch chiều hoạt động
☐ 22 golden case PASS · test kiến trúc PASS
☐ Ảnh chụp trạng thái: docs/_states/state_<YYYY-MM-DD>_phase-3-xong.md

🎉 MỐC: Kết thúc Phase 3, phần KHÁC BIỆT của sản phẩm đã tồn tại và
   chạy được. Nếu phải demo cho ai đó ở thời điểm này, bạn đã có thứ
   để demo — và thứ đó không giống bất kỳ sàn TMĐT mỹ phẩm nào khác.
```

---
# PHẦN 8 — NHÓM H: SKIN ID · QUIZ · ROUTINE BUILDER

| | |
|---|---|
| **Phase** | P4 · `WG-P4-01`→`05` |
| **Giờ** | 60 (15 ngày) |
| **Kết quả** | Hồ sơ da · bài quiz 8 bước · Routine Builder sáng/tối · nhật ký da |
| **Đặc điểm** | ⭐ Nhóm sinh ra **dữ liệu đầu vào** cho Điểm Phù Hợp và Lọc Thông Minh |

> 💡 **Vòng khép kín của sản phẩm nằm ở nhóm này.** Trước nhóm H, Điểm Phù Hợp và Lọc Thông Minh *có logic nhưng không có dữ liệu* — vì chưa có cách để người dùng tạo hồ sơ da. Sau nhóm H, mọi thứ đã làm ở nhóm F và G mới thực sự hoạt động cho người dùng thật.

---

## ▸ H1 — Skin Quiz 8 bước ⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 14 | P4 | `WG-P4-01` | D3, E1 |

🎯 **MỤC TIÊU** — Bài quiz 8 bước, **lưu được giữa chừng**, dùng được cho cả khách chưa đăng nhập.

🤖 **PROMPT**

```text
Hiện thực Skin Quiz (FR-SKIN-01…05).

ĐỌC TRƯỚC:
- docs/_requirements/M05.md — FR-SKIN-01…05 (toàn bộ điều kiện chấp nhận)
- docs/domain-rules.md — BR-SKIN-01…09
- Prototype skin-quiz.html — theo đúng bố cục và bước
- docs/llm-policy.md §9.2 (chủ đề bị chặn) — quiz KHÔNG được hỏi về bệnh da

8 BƯỚC (theo prototype):
  1. Loại da          — chọn 1: dầu · khô · thường · hỗn hợp · chưa rõ
  2. Vấn đề quan tâm  — chọn nhiều: mụn · thâm · lỗ chân lông · nếp nhăn
                        · xỉn màu · khô ráp · dầu nhờn
  3. Mức nhạy cảm     — chọn 1: không · nhẹ · trung bình · cao
  4. Thành phần tránh — tìm kiếm và chọn nhiều từ từ điển INCI
  5. Ngân sách        — chọn 1 khoảng (không nhập số)
  6. Thói quen hiện tại — số bước đang dùng · đã dùng retinoid/AHA chưa
  7. Mang thai/cho bú — chọn 1: không · đang mang thai · đang cho bú
                        · không muốn trả lời
  8. Đồng ý chia sẻ với AI — mặc định TẮT, có giải thích rõ gửi gì

⚠️ BƯỚC 7 — xử lý ĐẶC BIỆT:
  Câu hỏi mang thai KHÔNG phải để chẩn đoán. Nó dùng để:
    - Lọc nhóm hoạt chất không khuyến nghị trong thai kỳ (Retinoid, cao BHA)
    - Hiện thông báo: "Chúng tôi sẽ không gợi ý sản phẩm chứa Retinoid.
      Với thai kỳ, hãy tham vấn bác sĩ trước khi dùng bất kỳ sản phẩm nào."
  ⛔ KHÔNG được diễn giải thành bất kỳ lời khuyên y tế nào.
  Có lựa chọn "không muốn trả lời" — và lựa chọn đó phải được tôn trọng
  (không nhắc lại, không hỏi lại).

⚠️ BƯỚC 4 — thành phần tránh:
  Tìm kiếm trong từ điển INCI đã làm ở C3, có gợi ý tự động.
  Cho phép nhập thành phần KHÔNG có trong từ điển → lưu dạng văn bản tự do
  trong trường riêng, và hiện: "Chúng tôi chưa có dữ liệu về thành phần này,
  nên chưa thể tự động lọc. Bạn vẫn có thể ghi lại để tham khảo."

LƯU GIỮA CHỪNG (FR-SKIN-04) — BẮT BUỘC:
  Khách chưa đăng nhập : lưu localStorage theo từng bước
  Đã đăng nhập         : lưu DB theo từng bước (bảng skin_quiz_drafts)
  Quay lại trang       : hỏi "Tiếp tục từ bước 5?" + nút bắt đầu lại
  ⚠️ Lý do bắt buộc: quiz 8 bước mà mất dữ liệu khi tải lại trang là
     lý do bỏ giữa chừng phổ biến nhất. Tỷ lệ hoàn thành quiz quyết định
     bao nhiêu người dùng có hồ sơ da — tức là quyết định bao nhiêu người
     thấy được giá trị của sản phẩm.

KẾT QUẢ (FR-SKIN-05):
  Thẻ "Skin ID" tóm tắt hồ sơ · nút "Xem routine gợi ý" (H3)
  · nút "Sửa hồ sơ"
  Khách chưa đăng nhập: hiện "Đăng ký để lưu hồ sơ" — và khi đăng ký,
  hồ sơ nháp ở localStorage được chuyển vào tài khoản.

INV-10 — QUIZ TẤT ĐỊNH (bất biến, `Technical_Design` §4.4 · `BR-REC-09`):
  Cùng một bộ câu trả lời PHẢI cho ra cùng một kết quả, mọi lúc.
  ⛔ KHÔNG dùng bất kỳ yếu tố ngẫu nhiên nào: không Random, không
     Guid.NewGuid() làm tiêu chí sắp xếp, không phụ thuộc thứ tự
     trả về của DB, không phụ thuộc thời điểm chạy.
  ✅ Tiêu chí sắp xếp CUỐI CÙNG luôn là `product_id ↑` để phá thế
     hòa một cách tất định.
  Kiểm thử: `GC-02` — chạy cùng đầu vào 20 lần, kỳ vọng 20 kết quả
  byte-identical.
  ⚠️ Vì sao đây là bất biến: nếu quiz cho kết quả khác nhau giữa hai
     lần làm, người dùng mất niềm tin ngay — và bạn không gỡ lỗi được
     bất kỳ báo cáo nào về kết quả sai.

GIAO DIỆN:
  Chỉ báo tiến độ rõ (bước 3/8) · nút Quay lại ở mọi bước
  · điều hướng bàn phím đầy đủ (phím mũi tên chọn đáp án, Enter sang bước sau)
  · pass axe

TUYỆT ĐỐI KHÔNG:
- Để bước 8 (đồng ý AI) mặc định BẬT
- Diễn giải câu trả lời mang thai thành lời khuyên y tế
- Hỏi về bệnh da (vảy nến, viêm da, eczema) — đây là chủ đề bị chặn
- Bắt buộc đăng nhập mới làm được quiz
- Mất dữ liệu nháp khi tải lại trang
- Dùng yếu tố ngẫu nhiên ở bất kỳ đâu trong tính toán kết quả  (INV-10)
```

✅ **XONG KHI**

```text
☐ 8 bước hoạt động, điều hướng tiến/lùi đúng
☐ Làm đến bước 5, tải lại trang → hỏi "Tiếp tục từ bước 5?"  ← bắt buộc
☐ Khách làm xong quiz → đăng ký → hồ sơ nháp chuyển vào tài khoản
☐ Bước 8 mặc định TẮT (kiểm trong DB)
☐ Chọn "đang mang thai" → hiện thông báo tham vấn bác sĩ, KHÔNG có lời khuyên
☐ Chọn "không muốn trả lời" → không bị hỏi lại
☐ Nhập thành phần ngoài từ điển → lưu được, có thông báo hạn chế
☐ 0 câu hỏi về bệnh da
☐ **`GC-02`: chạy cùng đầu vào 20 lần → 20 kết quả giống hệt nhau** ← INV-10
☐ Grep tính năng quiz: 0 lần `Random` · `Guid.NewGuid()` trong tính toán kết quả
☐ Mọi truy vấn xếp hạng có tiêu chí cuối là `product_id ↑`
☐ Điều hướng bàn phím đầy đủ · pass axe
```

🔍 **KIỂM CHỨNG**

```bash
dotnet test --filter "FullyQualifiedName~GC02|FullyQualifiedName~QuizDeterminism"
grep -rnE 'new Random|Random\.Shared|Guid\.NewGuid' src/BeautyAI.Application/Quiz src/BeautyAI.Application/Routine \
  && echo "⚠️ VI PHẠM INV-10" || echo "✓ Tất định"
```

---

## ▸ H2 — Quản lý & phiên bản hồ sơ da

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 8 | P4 | `WG-P4-02` | H1 |

🎯 **MỤC TIÊU** — Sửa hồ sơ · lưu **phiên bản** · xem lịch sử thay đổi.

🤖 **PROMPT**

```text
Hiện thực quản lý hồ sơ da (FR-SKIN-06…08).

ĐỌC TRƯỚC: docs/_requirements/M05.md · docs/domain-rules.md BR-SKIN-06…09

1. Sửa hồ sơ: dùng lại các bước quiz, nhưng cho sửa riêng từng phần
   (không bắt làm lại cả 8 bước).

2. Phiên bản hồ sơ (BR-SKIN-07):
   Mỗi lần sửa → tạo bản ghi mới trong skin_profile_versions,
   bản cũ GIỮ LẠI.
   ⚠️ Lý do quan trọng: đơn hàng và lịch sử chat tham chiếu tới
      PHIÊN BẢN hồ sơ tại thời điểm đó. Nếu ghi đè, một đơn hàng
      cũ sẽ hiện "được gợi ý dựa trên hồ sơ da hiện tại" — sai sự thật.

3. Lịch sử thay đổi: trang hiện các phiên bản, cái gì đã đổi, khi nào.
   Hiện dạng người đọc được: "15/03: đổi loại da từ 'thường' sang 'hỗn hợp'"

4. Xóa hồ sơ da (FR-PROF-08, đã làm phần backend ở D3):
   Nút ở trang hồ sơ, có xác nhận 2 bước, giải thích hệ quả
   ("Điểm Phù Hợp và Lọc Thông Minh sẽ không hoạt động nữa").
   Xóa hồ sơ KHÔNG xóa tài khoản.

5. Cờ allow_ai_sharing (theo prototype profile.html đã cập nhật V1.0):
   Nút bật/tắt + mục mở được hiện CHÍNH XÁC dữ liệu sẽ được gửi:
     "Khi bật, chúng tôi gửi tới Gemini: loại da (hỗn hợp) ·
      vấn đề quan tâm (mụn, thâm) · mức nhạy cảm (trung bình) ·
      khoảng ngân sách (300–700k) · thành phần tránh (Fragrance)
      Chúng tôi KHÔNG gửi: tên · email · số điện thoại · địa chỉ ·
      lịch sử đơn hàng"
   ⚠️ Nội dung này phải sinh TỪ DeIdentificationService thật, không viết tay —
      để nếu dịch vụ đổi, phần hiển thị đổi theo. Đây là cách giữ cho
      lời hứa với người dùng luôn đúng.

TUYỆT ĐỐI KHÔNG:
- Ghi đè hồ sơ cũ (phải tạo phiên bản mới)
- Viết tay nội dung mô tả dữ liệu gửi đi (phải sinh từ dịch vụ thật)
- Xóa tài khoản khi người dùng chỉ xóa hồ sơ da
```

✅ **XONG KHI**

```text
☐ Sửa hồ sơ → bản cũ còn trong skin_profile_versions
☐ Trang lịch sử hiện các thay đổi dạng người đọc được
☐ Mục "dữ liệu sẽ gửi" sinh từ DeIdentificationService (test: đổi dịch vụ →
  nội dung hiển thị đổi theo)
☐ Xóa hồ sơ da → tài khoản còn nguyên, đơn hàng cũ còn nguyên
☐ Nút bật/tắt chia sẻ AI hoạt động, mặc định tắt
```

---

## ▸ H3 — Routine Builder ⭐⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 16 | P4 | `WG-P4-03` | H1, G2 |

🎯 **MỤC TIÊU** — Routine sáng/tối theo thứ tự đúng, **không bao giờ thiếu bước bắt buộc** (`INV-11`).

> ⭐⭐ **`INV-11` là bất biến có hậu quả thực tế nhất của cả hệ thống.**
> Một routine thiếu bước **làm sạch** hoặc **chống nắng** không phải là lời khuyên thiếu sót — nó là lời khuyên **có hại**. Đặc biệt là chống nắng: gợi ý một routine có Retinol mà không có chống nắng là gợi ý một routine làm da tệ hơn. Đây là lý do `INV-11` được thực thi bằng test, không chỉ bằng ghi chú.

🤖 **PROMPT**

```text
Hiện thực Routine Builder (FR-ROUT-01…06).

ĐỌC TRƯỚC (bắt buộc đọc HẾT):
- docs/_requirements/M06.md — FR-ROUT-01…06
- docs/domain-rules.md — BR-ROUT-01…12  (ĐỌC KỸ BR-ROUT-03 về INV-11)
- BRD §17.2 (12 quy tắc xung đột — routine phải tránh xếp chúng cùng buổi)
- Prototype routine-builder.html

THỨ TỰ BƯỚC (BR-ROUT-01) — không thay đổi:
  Sáng: Làm sạch → Toner → Tinh chất chuyên biệt → Dưỡng ẩm → Chống nắng
  Tối : Tẩy trang → Làm sạch → Toner → Tinh chất chuyên biệt → Dưỡng ẩm

  ⚠️ Nhãn hiển thị là "Tinh chất chuyên biệt", KHÔNG phải "Đặc trị".
     "Đặc trị" là từ ngụ ý điều trị bệnh → vi phạm quy định quảng cáo
     mỹ phẩm (CMP-04). Enum nội bộ vẫn là DAC_TRI — chỉ nhãn hiển thị đổi.

INV-11 — BƯỚC BẮT BUỘC (BR-ROUT-03):
  Routine sáng PHẢI có: Làm sạch · Chống nắng
  Routine tối  PHẢI có: Làm sạch

  Nếu không tìm được sản phẩm phù hợp cho bước bắt buộc:
    ⛔ KHÔNG bỏ bước đó đi
    ✅ Hiện bước đó với trạng thái "Chưa tìm được sản phẩm phù hợp"
       + GIẢI THÍCH vì sao bước này bắt buộc
         (vd "Chống nắng là bước quan trọng nhất của routine ban ngày,
          đặc biệt khi dùng các hoạt chất như Retinol hay AHA/BHA")
       + gợi ý nới điều kiện nào (ngân sách? thành phần tránh?)
       + nút "Xem tất cả sản phẩm chống nắng"

  Đây là bất biến được thực thi bằng TEST, không phải bằng ghi chú.

TRÁNH XUNG ĐỘT (BR-ROUT-05):
  Khi chọn sản phẩm cho các bước, KHÔNG xếp hai sản phẩm có cặp hoạt chất
  xung đột mức CAO vào CÙNG MỘT BUỔI.
  Nếu người dùng cần cả hai → tách sáng/tối, và GIẢI THÍCH vì sao đã tách.
  (Dùng lại ConflictDetectionService của nhóm I nếu đã có; nếu chưa,
   tạo interface và hiện thực tối thiểu, nhóm I sẽ hoàn thiện.)

CHỌN SẢN PHẨM CHO MỖI BƯỚC:
  Xếp hạng theo Điểm Phù Hợp của G2 (dùng CÙNG dịch vụ, không viết lại
  công thức) · lọc theo ngân sách · lọc theo thành phần tránh
  · lọc theo thai kỳ nếu có
  Mỗi bước gợi ý 1 sản phẩm chính + 2 phương án thay thế.

TÙY CHỈNH (FR-ROUT-04):
  Người dùng đổi sản phẩm cho từng bước · thêm/bớt bước không bắt buộc
  ⛔ KHÔNG cho bỏ bước BẮT BUỘC. Nút xóa ở các bước đó bị vô hiệu,
     có tooltip giải thích.

LƯU & CHIA SẺ (FR-ROUT-05, FR-ROUT-06):
  Lưu routine theo tên · nhiều routine/người · đặt một routine hoạt động
  Xuất PDF hoặc ảnh để chia sẻ
  ⚠️ Bản xuất PHẢI có dòng từ chối trách nhiệm:
     "Đây là gợi ý sản phẩm dựa trên hồ sơ da bạn cung cấp,
      không phải lời khuyên y tế. Với vấn đề da liễu, hãy tham vấn bác sĩ."

TEST BẮT BUỘC (viết TRƯỚC khi hiện thực):
  - Hồ sơ không có sản phẩm chống nắng phù hợp → routine sáng VẪN có
    bước chống nắng ở trạng thái "chưa tìm được"   ← test INV-11
  - Ngân sách rất thấp (< 100k) → mọi bước bắt buộc vẫn hiện
  - Dị ứng nhiều thành phần → mọi bước bắt buộc vẫn hiện
  - Mang thai → không sản phẩm Retinoid nào trong routine
  - Hai sản phẩm xung đột CAO → không cùng buổi
  - Thứ tự bước luôn đúng, không phụ thuộc thứ tự chọn sản phẩm

TUYỆT ĐỐI KHÔNG:
- Bỏ bước bắt buộc khi không tìm được sản phẩm  (INV-11)
- Cho người dùng xóa bước bắt buộc
- Dùng nhãn "Đặc trị"
- Tính Điểm Phù Hợp bằng công thức riêng
- Xuất PDF/ảnh không có dòng từ chối trách nhiệm
```

✅ **XONG KHI**

```text
☐ 6 test ở mục trên PASS                              ← bắt buộc
☐ Hồ sơ ngân sách cực thấp → routine sáng VẪN có bước chống nắng
   (ở trạng thái "chưa tìm được" + giải thích)         ← INV-11
☐ Nút xóa ở bước bắt buộc bị vô hiệu, có tooltip
☐ Grep frontend: 0 lần nhãn hiển thị "Đặc trị"
☐ Mang thai → 0 sản phẩm Retinoid trong routine
☐ PDF/ảnh xuất ra có dòng từ chối trách nhiệm
☐ Thứ tự bước đúng trong mọi trường hợp
```

🔍 **KIỂM CHỨNG**

```bash
dotnet test --filter "FullyQualifiedName~Routine"
grep -rn '>Đặc trị<\|"Đặc trị"' src/frontend/src/ \
  && echo "⚠️ CÒN NHÃN ĐẶC TRỊ" || echo "✓ Đã đổi nhãn"
```

---

## ▸ H4 — Nhật ký da & theo dõi tiến triển

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 12 | P4 | `WG-P4-04` | H2 |

🎯 **MỤC TIÊU** — Người dùng ghi nhận tình trạng da theo thời gian và **tự thấy** mối liên hệ — không để hệ thống suy luận nhân quả.

> ⚠️ **Ranh giới của tính năng này rất quan trọng.** Nhật ký da là một *công cụ ghi chép*, không phải một *hệ thống chẩn đoán*. Hệ thống hiện biểu đồ và sự kiện; **người dùng tự rút ra kết luận**. Mọi câu kiểu *"sản phẩm X đang gây mụn cho bạn"* là tuyên bố nhân quả mà hệ thống không có cơ sở để đưa ra.

🤖 **PROMPT**

```text
Hiện thực nhật ký da (FR-ROUT-07…10).

ĐỌC TRƯỚC: docs/_requirements/M06.md · docs/domain-rules.md BR-ROUT-07…12
          · BRD §13.4 (giới hạn tuyên bố)

1. Ghi nhật ký:
   Ngày · tình trạng tổng quát (1–5) · các vấn đề quan sát được (chọn nhiều)
   · ảnh (tùy chọn, lưu CỤC BỘ, không gửi đi đâu) · ghi chú tự do
   · routine đang dùng (tự điền từ routine hoạt động)

2. Biểu đồ tiến triển:
   Recharts · trục thời gian · điểm tình trạng
   Đánh dấu mốc khi routine thay đổi (vạch dọc + nhãn)
   ⚠️ Hiện mốc thay đổi là ĐỦ. Hệ thống KHÔNG nối hai điều đó thành
      câu nhân quả.

3. Ngôn từ BẮT BUỘC — đây là phần dễ sai nhất:

   ⛔ KHÔNG ĐƯỢC viết:
      "Sản phẩm X đang gây mụn cho bạn"
      "Routine này hiệu quả với bạn"
      "Tình trạng da bạn đã cải thiện nhờ Niacinamide"
      "Bạn nên dừng sản phẩm Y"

   ✅ ĐƯỢC viết:
      "Bạn ghi nhận tình trạng tăng từ 3 lên 4 trong 6 tuần qua"
      "Bạn đổi routine vào 15/03"
      "Trong 2 tuần sau khi đổi routine, bạn ghi nhận ít mụn hơn"
      ← câu này mô tả sự kiện và thời gian, KHÔNG nói nguyên nhân

   Khác biệt: câu đầu là CHẨN ĐOÁN (hệ thống không được làm);
   câu sau là TRÌNH BÀY DỮ LIỆU người dùng tự ghi (hệ thống được làm).

4. Ảnh: lưu trong cơ sở dữ liệu/ổ cục bộ.
   ⛔ KHÔNG gửi ảnh ra bất kỳ dịch vụ bên ngoài nào, kể cả để phân tích.
      Ảnh da là dữ liệu sức khỏe. (CMP-18)
   Có nút xóa ảnh riêng lẻ.

5. Nhắc nhở (FR-ROUT-10): tùy chọn, mặc định TẮT.
   Chỉ nhắc trong ứng dụng, không gửi email/SMS trong V1.0.

TUYỆT ĐỐI KHÔNG:
- Viết bất kỳ câu nào gán nhân quả giữa sản phẩm và tình trạng da
- Gửi ảnh da ra ngoài hệ thống
- Đưa ra lời khuyên dừng/tiếp tục sản phẩm
- Bật nhắc nhở mặc định
```

✅ **XONG KHI**

```text
☐ Ghi và xem nhật ký hoạt động
☐ Biểu đồ hiện mốc đổi routine (vạch dọc)
☐ Grep toàn bộ tính năng: 0 câu gán nhân quả (dùng danh sách từ cấm)
☐ Ảnh lưu cục bộ, KHÔNG có lệnh gọi mạng nào gửi ảnh ra ngoài
☐ Nhắc nhở mặc định TẮT
☐ Xóa ảnh riêng lẻ hoạt động
```

🔍 **KIỂM CHỨNG**

```bash
# Ngôn từ nhân quả
grep -rniE 'gây (mụn|kích ứng|dị ứng) cho bạn|hiệu quả với bạn|nhờ (niacinamide|retinol)|bạn nên (dừng|ngừng|bỏ)' \
  src/frontend/src/features/skin-journal/ src/BeautyAI.Application/ \
  && echo "⚠️ CÓ CÂU GÁN NHÂN QUẢ" || echo "✓ Không gán nhân quả"

# Ảnh không ra ngoài
grep -rn 'fetch\|axios\|HttpClient' src/frontend/src/features/skin-journal/ \
  | grep -i 'image\|photo\|anh'
# Chỉ được thấy lệnh gọi tới API nội bộ của chính ứng dụng
```

---

## ▸ H5 — Tích hợp hồ sơ vào toàn hệ thống

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 10 | P4 | `WG-P4-05` | H1, H3, F3, G2 |

🎯 **MỤC TIÊU** — Hồ sơ da **thực sự thay đổi trải nghiệm** ở mọi nơi trong ứng dụng.

🤖 **PROMPT**

```text
Nối hồ sơ da vào toàn bộ các tính năng đã làm.

ĐỌC TRƯỚC: BRD §14 E2E-02 (Skin ID → Routine → mua)
          · docs/_requirements/M03.md FR-CAT-08 · M04.md FR-PDP-07, FR-PDP-11

Nối hồ sơ vào:
  1. Lọc Thông Minh (F3)  — 3 bộ lọc giờ có dữ liệu thật
  2. Điểm Phù Hợp (G2)    — hiện điểm thật thay vì nút tạo hồ sơ
  3. Panel "Vì sao" (G3)   — yếu tố thật
  4. Đánh giá nhóm tương tự (G4) — nhóm thật theo loại da
  5. Routine Builder (H3)
  6. Trang chủ — khối "Gợi ý cho hồ sơ da của bạn"
  7. Header — chỉ báo "Đã có Skin ID" / nút "Tạo Skin ID"

Trạng thái CHƯA CÓ HỒ SƠ — làm đúng ở MỌI nơi trên:
  Hiện lời mời tạo hồ sơ, giải thích CỤ THỂ sẽ được gì
  (vd "Tạo Skin ID để xem sản phẩm này phù hợp bao nhiêu với da bạn")
  ⛔ KHÔNG hiện giá trị mặc định
  ⛔ KHÔNG hiện lỗi hay khoảng trống
  ⛔ KHÔNG chặn người dùng dùng ứng dụng khi chưa có hồ sơ

BẬT E2E-02 (đã tạo khung ở E3):
  Luồng đầy đủ: làm quiz 8 bước → xem Skin ID → xem routine gợi ý
  → thêm sản phẩm trong routine vào giỏ → thấy Điểm Phù Hợp ở chi tiết
  → thấy 3 bộ lọc thông minh hoạt động
  Chạy trên cả 3 thiết bị.

TUYỆT ĐỐI KHÔNG:
- Hiện giá trị mặc định khi chưa có hồ sơ
- Chặn chức năng cơ bản khi chưa có hồ sơ
- Dùng lời mời chung chung ("Tạo hồ sơ để có trải nghiệm tốt hơn") —
  phải nói CỤ THỂ được gì ở CHÍNH chỗ đó
```

✅ **XONG KHI**

```text
☐ E2E-02 PASS trên 3 thiết bị
☐ 7 điểm tích hợp hoạt động với hồ sơ thật
☐ Tài khoản chưa có hồ sơ: mọi điểm trên hiện lời mời CỤ THỂ, không lỗi
☐ Khách chưa đăng nhập dùng được danh mục, tìm kiếm, giỏ hàng bình thường
☐ Tạo hồ sơ → quay lại trang chi tiết → Điểm Phù Hợp hiện ngay
```

---

## 📋 Danh mục kiểm tra kết thúc NHÓM H — và kết thúc Phase 4

```text
☐ Quiz 8 bước · lưu giữa chừng đã kiểm chứng · khách làm được
☐ Hồ sơ có phiên bản · mô tả dữ liệu gửi AI sinh từ dịch vụ thật
☐ Routine Builder: INV-11 được test, nhãn "Tinh chất chuyên biệt"
☐ Nhật ký da: 0 câu gán nhân quả · ảnh không ra ngoài
☐ Hồ sơ nối vào 7 điểm · E2E-02 PASS
☐ Ảnh chụp trạng thái: docs/_states/state_<YYYY-MM-DD>_phase-4-xong.md

🎉 MỐC: Vòng khép kín đã hoàn chỉnh. Người dùng tạo hồ sơ → hệ thống
   dùng hồ sơ ở mọi nơi → người dùng thấy giá trị → tạo lý do quay lại.
```

---

# PHẦN 9 — NHÓM I: XUNG ĐỘT · PHÂN TÍCH THÀNH PHẦN · SO SÁNH

| | |
|---|---|
| **Phase** | P5 · `WG-P5-01`→`04` |
| **Giờ** | 48 (12 ngày) |
| **Kết quả** | Phát hiện xung đột **phân cấp bằng chứng** · trình phân tích INCI · so sánh sản phẩm |
| **Đặc điểm** | ⭐⭐ Nhóm hiện thực `INV-03` — tính chính trực khoa học của sản phẩm |

> ⭐⭐ **Nhóm này là nơi BeautyAI chứng minh nó khác các ứng dụng chấm điểm thành phần.**
> Những ứng dụng đó cảnh báo *mọi thứ* ở *cùng một mức*, không nguồn — tạo ra lo lắng mà không tạo ra hiểu biết. BeautyAI cảnh báo **theo cấp bằng chứng**, **có nguồn**, **có phương án xử lý**, và — điều quan trọng nhất — **chủ động nói ra những cặp nó KHÔNG cảnh báo, kèm lý do**.

---

## ▸ I1 — Phát hiện xung đột phân cấp bằng chứng ⭐⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 14 | P5 | `WG-P5-01` | C4, G1 |

🎯 **MỤC TIÊU** — `ConflictDetectionService` tôn trọng cấp bằng chứng (`INV-03`) và **không bao giờ cảnh báo mà không có phương án xử lý**.

🤖 **PROMPT**

```text
Hiện thực ConflictDetectionService (FR-CONF-01…05).

ĐỌC TRƯỚC (bắt buộc đọc HẾT):
- docs/_requirements/M07.md — FR-CONF-01…05
- docs/domain-rules.md — BR-CONF-01…08, ĐẶC BIỆT:
    BR-CONF-01b (phân cấp bằng chứng)
    BR-CONF-02b (đính chính huyền thoại Vitamin C + Niacinamide)
    BR-CONF-02c (cặp duy nhất mức CAO)
    BR-CONF-05  (mọi cảnh báo phải có phương án xử lý)
- BRD §17.2 (bảng 12 quy tắc đầy đủ)
- Prototype cart.html — panel xung đột 3 tầng (đã cập nhật V1.0,
  THEO ĐÚNG bố cục và ngôn từ đó)

LOGIC CỐT LÕI:
  Đầu vào : danh sách sản phẩm (giỏ hàng, routine, hoặc so sánh)
  Xử lý   : map sản phẩm → nhóm hoạt chất → tra conflict_rules
  Đầu ra  : danh sách ConflictFinding {
              groupA, groupB, severity, evidenceTier,
              explanation, remediation, sourceUrl, professionalNote
            }

INV-03 — PHÂN CẤP BẰNG CHỨNG (bất biến, thực thi 3 lớp):
  Cấp A → được phép mức CAO
  Cấp B → TỐI ĐA mức LƯU_Ý
  Cấp C → CHỈ mức THÔNG_TIN

  Ba lớp thực thi:
    Lớp 1 — ràng buộc ck_cr_tier_severity ở DB (đã có từ C1)
    Lớp 2 — kiểm tra trong ConflictDetectionService, ném lỗi nếu vi phạm
    Lớp 3 — test đơn vị thử tạo vi phạm và kỳ vọng bị từ chối

  Vì sao ba lớp: dữ liệu có thể vào DB bằng nhiều đường (seeder, admin,
  migration). Một lớp không đủ.

QUY TẮC DỮ LIỆU — CẶP DUY NHẤT MỨC CAO (BR-CONF-02c):
  Retinoid (Tretinoin) + Benzoyl Peroxide — và CHỈ cặp này.
  Kèm sắc thái BẮT BUỘC: "Adapalene bền hơn Tretinoin khi dùng cùng BPO;
  mức phân hủy phụ thuộc công thức cụ thể."
  ⚠️ Nếu có cặp thứ hai ở mức CAO, một trong hai đã bị gán sai cấp.
     Test phải đếm và kỳ vọng ĐÚNG 1.

ĐÍNH CHÍNH HUYỀN THOẠI (BR-CONF-02b) — tính năng chủ động:
  Vitamin C + Niacinamide ở mức THÔNG_TIN với nội dung ĐÍNH CHÍNH:
    "Nhiều nguồn cho rằng không nên dùng cùng. Phản ứng tạo niacin
     chỉ đáng kể ở pH ~2 và nhiệt độ ~90°C trong hơn 75 giờ —
     điều kiện không xảy ra trên da. Ở pH sinh lý, phức hợp tạo thành
     là thuận nghịch và không đáng kể. Bạn có thể dùng cùng."

  ⚠️ Đây KHÔNG phải cảnh báo — đây là ĐÍNH CHÍNH.
     Giao diện phải phân biệt rõ hai thứ (biểu tượng khác, màu khác).

  ⚠️ Panel "Những cặp chúng tôi KHÔNG cảnh báo — và vì sao" là
     TÍNH NĂNG BẮT BUỘC, không phải tùy chọn. Nó ở prototype cart.html.
     Lý do: nó chứng minh hệ thống có lập trường khoa học, không chỉ
     liệt kê cảnh báo.

BR-CONF-05 — MỌI CẢNH BÁO PHẢI CÓ PHƯƠNG ÁN XỬ LÝ:
  ⛔ KHÔNG cảnh báo nào được hiện mà không kèm cách giải quyết.
  Vd với Retinoid + BPO:
    "Tách thành 2 buổi: BPO buổi sáng, Retinoid buổi tối"
    + nút "Tự động tách thành 2 buổi trong routine của tôi"
  Lý do: cảnh báo không có giải pháp chỉ tạo lo lắng. Mục đích của
  phát hiện xung đột là GIÚP dùng được cả hai, không phải ngăn dùng.

HIỂN THỊ (theo prototype cart.html V1.0):
  3 tầng trực quan khác nhau:
    CAO      — viền đỏ · biểu tượng cảnh báo · nguồn PubMed hiện rõ
    LƯU_Ý    — viền vàng · biểu tượng thông tin
    THÔNG_TIN— viền xám · biểu tượng bóng đèn
  Mỗi cảnh báo: giải thích · phương án xử lý · liên kết nguồn
                · ghi chú chuyên môn (mở được)
  + panel mở được "Những cặp chúng tôi KHÔNG cảnh báo — và vì sao"

TEST BẮT BUỘC:
  - Thử tạo quy tắc cấp B mức CAO → BỊ TỪ CHỐI (cả ở DB và ở service)
  - Đếm quy tắc mức CAO = ĐÚNG 1
  - Mọi ConflictFinding có remediation khác rỗng
  - Mọi ConflictFinding có sourceUrl khác rỗng
  - Giỏ có Retinol + BPO → phát hiện mức CAO
  - Giỏ có Vitamin C + Niacinamide → mức THÔNG_TIN với nội dung đính chính,
    KHÔNG phải cảnh báo
  - 22 golden case của BRD §17.5 cho kết quả kỳ vọng

TUYỆT ĐỐI KHÔNG:
- Cho cấp B/C đạt mức CAO
- Thêm cặp thứ hai ở mức CAO
- Hiện cảnh báo không có phương án xử lý
- Hiện cảnh báo không có nguồn
- Cảnh báo Vitamin C + Niacinamide (phải ĐÍNH CHÍNH)
- Bỏ panel "những cặp chúng tôi không cảnh báo"
```

✅ **XONG KHI**

```text
☐ Thử tạo cấp B mức CAO → bị từ chối ở CẢ DB và service   ← bắt buộc
☐ Đếm mức CAO = ĐÚNG 1                                     ← bắt buộc
☐ 100% finding có remediation và sourceUrl
☐ Retinol + BPO → mức CAO, có sắc thái Adapalene
☐ Vitamin C + Niacinamide → ĐÍNH CHÍNH, không phải cảnh báo
☐ Panel "những cặp không cảnh báo" tồn tại và mở được
☐ 3 tầng hiển thị khác nhau rõ rệt về trực quan
☐ 22 golden case PASS
```

🔍 **KIỂM CHỨNG**

```bash
docker compose exec -T postgres psql -U beautyai -d beautyai -c "
SELECT evidence_tier, severity, count(*) FROM conflict_rules
GROUP BY 1,2 ORDER BY 1,2;"
# KHÔNG được có dòng (B,CAO) hay (C,CAO); (A,CAO) phải đúng 1

docker compose exec -T postgres psql -U beautyai -d beautyai -c "
SELECT count(*) FROM conflict_rules
WHERE remediation IS NULL OR trim(remediation)='' 
   OR source_url IS NULL OR trim(source_url)='';"
# phải = 0

dotnet test --filter "FullyQualifiedName~Conflict"
```

---

## ▸ I2 — Trình phân tích thành phần ⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 12 | P5 | `WG-P5-02` | I1, C3 |

🎯 **MỤC TIÊU** — Dán bảng thành phần bất kỳ → nhận phân tích, **với tỷ lệ phủ nói thật**.

🤖 **PROMPT**

```text
Hiện thực trình phân tích thành phần (FR-ANLZ-01…05).

ĐỌC TRƯỚC: docs/_requirements/M08.md · docs/domain-rules.md BR-ING-04b…07
          · Prototype ingredient-analyzer.html (đã cập nhật V1.0)

1. Đầu vào:
   Ô dán văn bản (bảng thành phần từ nhãn sản phẩm bất kỳ)
   Dùng CÙNG thuật toán chuẩn hóa 8 bước của script 03 ở C5 —
   không viết lại logic khác.
   ⚠️ Nếu thuật toán khác nhau giữa đường ống dữ liệu và đường ống
      người dùng, hai nơi sẽ cho kết quả khác nhau cho cùng một đầu vào.
      Tách logic chuẩn hóa thành MỘT dịch vụ dùng chung.

2. Kết quả — trình bày đúng ba phần:
   a) Bảng thành phần nhận diện được: tên INCI · tiếng Việt · chức năng
      · trạng thái CosIng
   b) Danh sách CHƯA nhận diện được: hiện NGUYÊN VĂN + lời giải thích
      "Chúng tôi chưa có dữ liệu cho các thành phần này"
   c) Dòng tỷ lệ phủ: "Nhận diện được 24/31 thành phần (77%)"

   ⚠️ Phần (b) KHÔNG được ẩn hay thu nhỏ. Nó quan trọng bằng phần (a).

3. Phát hiện xung đột trong chính bảng đó:
   Dùng ConflictDetectionService của I1.
   ⚠️ Không viết logic xung đột riêng cho trình phân tích.

4. Đối chiếu với hồ sơ da (nếu người dùng đã có):
   Đánh dấu thành phần người dùng đã ghi tránh
   Hiện mức phù hợp theo hồ sơ — nhưng:
   ⚠️ KHÔNG hiện một con số "Điểm Phù Hợp" cho bảng thành phần dán vào.
      Lý do: Điểm Phù Hợp cần nhiều dữ liệu hơn bảng INCI (nhãn đặc tính,
      đánh giá, danh mục) mà một bảng dán vào không có. Hiện một con số
      sẽ là con số không có cùng ý nghĩa với con số ở trang chi tiết.
      Thay vào đó hiện: danh sách yếu tố khớp/không khớp hồ sơ.

5. Tìm sản phẩm trong danh mục có bảng thành phần tương tự
   (dùng product_similarity hoặc so trùng tập thành phần).

6. Chia sẻ kết quả: tạo liên kết có mã ngắn, hết hạn 30 ngày.
   ⚠️ Liên kết chia sẻ KHÔNG chứa hồ sơ da của người dùng —
      chỉ chứa bảng thành phần và phân tích chung.

TUYỆT ĐỐI KHÔNG:
- Viết lại thuật toán chuẩn hóa INCI (dùng dịch vụ chung)
- Viết lại logic phát hiện xung đột (dùng dịch vụ của I1)
- Ẩn thành phần chưa nhận diện
- Hiện một con số Điểm Phù Hợp cho bảng dán vào
- Để liên kết chia sẻ chứa hồ sơ da
```

✅ **XONG KHI**

```text
☐ Dán bảng thành phần thật từ một sản phẩm → kết quả đúng
☐ Thành phần chưa nhận diện hiện nguyên văn, không bị ẩn
☐ Tỷ lệ phủ hiện số thật
☐ Xung đột phát hiện bằng CÙNG dịch vụ của I1 (kiểm bằng cách sửa
  một quy tắc → cả hai nơi đổi theo)
☐ Dán bảng có Retinol + BPO → hiện cảnh báo mức CAO
☐ KHÔNG hiện số Điểm Phù Hợp
☐ Liên kết chia sẻ không chứa hồ sơ da (kiểm nội dung liên kết)
```

---

## ▸ I3 — So sánh sản phẩm

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 10 | P5 | `WG-P5-03` | G2, I1 |

🎯 **MỤC TIÊU** — So sánh 2–4 sản phẩm theo tiêu chí **khách quan**, không xếp hạng "tốt nhất".

🤖 **PROMPT**

```text
Hiện thực so sánh sản phẩm (FR-CMP-01…04).

ĐỌC TRƯỚC: docs/_requirements/M09.md · Prototype compare.html (đã cập nhật V1.0)
          · docs/domain-rules.md BR-CMP-01…05

Bảng so sánh — các hàng:
  Ảnh · tên · thương hiệu · giá VND · danh mục
  · Điểm Phù Hợp với hồ sơ của bạn (nếu có hồ sơ)
  · Tỷ lệ phủ nhận diện thành phần
  · Số thành phần · thành phần chính (5 đầu)
  · Thành phần bạn đánh dấu tránh (nếu có)
  · Đánh giá: điểm tổng + điểm nhóm da của bạn
  · Trạng thái bán (Lớp A / Lớp B tham khảo)

⛔ KHÔNG có hàng nào tên "Độ an toàn", "Safety Score", hay tương tự. (INV-01)
   (Prototype cũ có hàng này — đã bỏ ở V1.0, đừng thêm lại.)

⛔ KHÔNG có nhãn "Tốt nhất", "Đáng mua nhất", "Khuyên dùng nhất".
   Lý do: "tốt nhất" là tuyên bố so sánh bị cấm trong quảng cáo mỹ phẩm
   (CMP-05), và cũng không có cơ sở — tốt nhất cho ai?
   ✅ Được dùng: "Phù hợp nhất với hồ sơ của bạn" — có phạm vi rõ ràng.

PHÁT HIỆN XUNG ĐỘT GIỮA CÁC SẢN PHẨM SO SÁNH:
  Nếu 2 sản phẩm đang so sánh có cặp hoạt chất xung đột, hiện cảnh báo:
  "Nếu dùng cả hai sản phẩm này, lưu ý: <cảnh báo> — <phương án xử lý>"
  Dùng ConflictDetectionService của I1.

Giao diện:
  Thêm sản phẩm vào so sánh từ trang danh mục và trang chi tiết
  Tối đa 4 · tối thiểu 2 · lưu trong URL (chia sẻ được)
  Trên di động: bảng cuộn ngang, cột đầu (tên tiêu chí) ghim lại
  Làm nổi ô khác biệt giữa các sản phẩm (để dễ thấy chúng khác nhau ở đâu)

TUYỆT ĐỐI KHÔNG:
- Thêm hàng mang nghĩa an toàn  (INV-01)
- Dùng nhãn "tốt nhất" không có phạm vi  (CMP-05)
- Viết lại logic xung đột
```

✅ **XONG KHI**

```text
☐ So sánh 2–4 sản phẩm, bảng hiện đủ hàng
☐ 0 hàng mang nghĩa an toàn
☐ Grep: 0 lần "tốt nhất"/"đáng mua nhất" không có phạm vi
☐ Hai sản phẩm xung đột → hiện cảnh báo + phương án xử lý
☐ URL chứa danh sách so sánh, chia sẻ được
☐ Trên di động: cột tiêu chí ghim, cuộn ngang mượt
☐ Ô khác biệt được làm nổi
```

---

## ▸ I4 — Bật E2E-03 & hoàn thiện Phase 5

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 12 | P5 | `WG-P5-04` | I1, I2, I3 |

🎯 **MỤC TIÊU** — Luồng phát hiện xung đột chạy đầu-cuối, và 22 golden case được bật trong CI.

🤖 **PROMPT**

```text
Bật E2E-03 và hoàn thiện bộ golden case.

ĐỌC TRƯỚC: BRD §14 E2E-03 · BRD §17.5 (22 golden case)
          · docs/testing-strategy.md

PHẦN 1 — E2E-03 (phát hiện xung đột):
  Luồng: tạo hồ sơ da → thêm sản phẩm có Retinol vào giỏ
       → thêm sản phẩm có Benzoyl Peroxide
       → thấy cảnh báo mức CAO với nguồn và phương án xử lý
       → mở panel "những cặp chúng tôi không cảnh báo"
       → thấy đính chính Vitamin C + Niacinamide
       → tích xác nhận đã đọc cảnh báo → nút thanh toán mới bật
  Chạy trên 3 thiết bị.

PHẦN 2 — 22 golden case thành bộ test chạy trong CI:
  Mỗi case: đầu vào (danh sách sản phẩm + hồ sơ da) → kết quả kỳ vọng
  Đặt trong tests/BeautyAI.GoldenTests/
  Dữ liệu case trong tệp JSON riêng (dễ thêm case mới không sửa code)

  ⚠️ Bộ golden case là LƯỚI AN TOÀN cho mọi thay đổi sau này.
     Khi bạn sửa công thức Điểm Phù Hợp ở Phase 8 và golden case đỏ,
     đó là lúc bạn biết mình vừa làm đổi hành vi — và quyết định có
     muốn đổi hay không. Không có nó, bạn chỉ phát hiện khi người dùng báo.

  Thêm job CI chạy riêng GoldenTests, báo rõ case nào đỏ.

PHẦN 3 — Rà soát tuân thủ ngôn từ toàn bộ frontend đã làm (Phase 2–5):
  Quét toàn bộ chuỗi hiển thị tìm:
    điều trị · chữa · trị mụn · trị nám · đặc trị · khỏi hẳn · dứt điểm
    · hiệu quả 100% · tốt nhất · số 1 · an toàn · nguy hiểm · kháng viêm
  So khớp KHÔNG PHÂN BIỆT DẤU.
  Loại trừ hợp lệ: các câu giải thích vì sao hệ thống KHÔNG dùng những từ đó.
  Báo cáo ra docs/_review/compliance-scan-phase5.md
```

✅ **XONG KHI**

```text
☐ E2E-03 PASS trên 3 thiết bị
☐ 22 golden case trong CI, tất cả PASS
☐ Job CI riêng cho GoldenTests, báo rõ case đỏ
☐ Rà soát ngôn từ: 0 vi phạm thật trong toàn bộ frontend Phase 2–5
☐ Coverage backend ≥ 70/60 · frontend ≥ 70/60
☐ Ảnh chụp trạng thái: docs/_states/state_<YYYY-MM-DD>_phase-5-xong.md
```

🔍 **KIỂM CHỨNG**

```bash
npx playwright test e2e/E2E-03-conflict-detection.spec.ts
dotnet test tests/BeautyAI.GoldenTests
./syntheprise gate
```

> 🎉 **MỐC: Kết thúc Phase 5, phần "trí tuệ" của sản phẩm đã xong — và nó xong TRƯỚC phần thương mại (giỏ hàng, thanh toán).**
> Đây là một chọn lựa có chủ đích trong kế hoạch: nếu phải dừng dự án ở đây, bạn vẫn có một sản phẩm có giá trị (một công cụ phân tích thành phần và tư vấn routine). Nếu làm thương mại trước, dừng ở giữa sẽ để lại một sàn TMĐT không có gì khác biệt.

---
# PHẦN 10 — NHÓM J: GIỎ HÀNG · VOUCHER

| | |
|---|---|
| **Phase** | P6 · `WG-P6-01`→`03` |
| **Giờ** | 42 (10,5 ngày) |
| **Kết quả** | Giỏ hàng · voucher 6 bước tính toán **có thứ tự xác định** · panel xung đột trong giỏ |
| **Đặc điểm** | ⭐ Nhóm có nhiều **lỗi tính tiền tiềm ẩn** nhất của toàn dự án |

> ⚠️ **Vì sao nhóm này nguy hiểm:** mọi lỗi ở đây là **lỗi tiền**. Một voucher tính sai thứ tự, một phí giao hàng tính trên giá trước giảm, một làm tròn sai chiều — tất cả đều dẫn đến con số mà người dùng thấy khác con số bị trừ. Đây là loại lỗi phá vỡ niềm tin nhanh nhất và khó giải thích nhất.

---

## ▸ J1 — Giỏ hàng

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 14 | P6 | `WG-P6-01` | D2, F1 |

🎯 **MỤC TIÊU** — Giỏ hàng cho **cả khách và người đã đăng nhập**, hợp nhất đúng khi đăng nhập, tồn kho kiểm tra đúng lúc.

🤖 **PROMPT**

```text
Hiện thực giỏ hàng (FR-CART-01…08).

ĐỌC TRƯỚC:
- docs/_requirements/M10.md — FR-CART-01…08
- docs/domain-rules.md — BR-CART-01…10
- docs/data-contracts.md (bảng carts, cart_items)
- Prototype cart.html (đã cập nhật V1.0)

1. Giỏ khách (chưa đăng nhập):
   Định danh bằng cookie ẩn danh (HttpOnly, 30 ngày).
   Lưu trong DB, KHÔNG chỉ localStorage.
   ⚠️ Lý do: localStorage mất khi người dùng đổi thiết bị hoặc xóa
      dữ liệu trình duyệt. Và giỏ hàng trong DB cho phép bạn biết
      có bao nhiêu giỏ bị bỏ — một chỉ số quan trọng.

2. Hợp nhất khi đăng nhập (BR-CART-08) — đã làm ở D2, nối vào đây:
   Cộng số lượng · kẹp theo tồn kho hiện tại
   · hiện thông báo rõ nếu phải giảm số lượng vì tồn kho

3. Thao tác: thêm · đổi số lượng · xóa · xóa toàn bộ
   ⚠️ Chỉ cho thêm sản phẩm selling_status='DANG_BAN' (Lớp A).
      Sản phẩm Lớp B: nút "Thêm vào giỏ" bị vô hiệu, tooltip giải thích
      "Sản phẩm tham khảo — chưa có sẵn để đặt hàng"

4. Kiểm tra tồn kho (BR-CART-04):
   ⚠️ Kiểm tại 3 thời điểm, với ý nghĩa KHÁC NHAU:
     a) Khi thêm vào giỏ   — kiểm tra sơ bộ, báo ngay nếu hết
     b) Khi xem giỏ        — cập nhật lại, báo nếu tồn kho đã giảm
     c) Khi tạo đơn hàng   — kiểm tra QUYẾT ĐỊNH, trong giao dịch (nhóm K)
   Chỉ (c) là ràng buộc thật. (a) và (b) là trải nghiệm tốt.
   ⛔ KHÔNG giữ (reserve) tồn kho khi thêm vào giỏ — sẽ tạo tồn kho ảo
      bị khóa bởi những giỏ hàng không bao giờ thanh toán.

5. Hiển thị giá:
   Giá mỗi món · số lượng · tổng mỗi dòng · tạm tính
   ⚠️ Dùng giá HIỆN TẠI, không phải giá lúc thêm vào giỏ.
      Nếu giá đã đổi, hiện thông báo: "Giá sản phẩm X đã thay đổi
      từ 250.000đ thành 280.000đ"
      Lý do: giá cũ trong giỏ là nguồn tranh chấp. Nói rõ là trung thực.

6. Panel xung đột trong giỏ (dùng ConflictDetectionService của I1):
   Theo prototype cart.html V1.0 — 3 tầng, có nguồn, có phương án xử lý,
   có panel "những cặp chúng tôi không cảnh báo".

   ⚠️ BR-CART-09 — nếu có cảnh báo mức CAO:
      Checkbox "Tôi đã đọc và hiểu lưu ý trên" PHẢI được tích
      trước khi nút thanh toán hoạt động.
      ⛔ KHÔNG chặn hoàn toàn việc mua. Người dùng có quyền mua cả hai
         sản phẩm — nhiệm vụ của hệ thống là đảm bảo họ ĐÃ ĐỌC, không
         phải quyết định thay họ.

7. Giỏ trống: hiện trạng thái rỗng có ích —
   gợi ý sản phẩm theo hồ sơ da (nếu có) hoặc sản phẩm phổ biến,
   không phải trang trắng.

TUYỆT ĐỐI KHÔNG:
- Giữ tồn kho khi thêm vào giỏ
- Cho thêm sản phẩm Lớp B vào giỏ
- Dùng giá cũ lưu trong giỏ
- Chặn hoàn toàn thanh toán khi có xung đột (chỉ yêu cầu xác nhận đã đọc)
- Lưu giỏ chỉ ở localStorage
```

✅ **XONG KHI**

```text
☐ Khách thêm sản phẩm → đóng trình duyệt → mở lại → giỏ còn nguyên
☐ Khách có giỏ 2 món → đăng nhập (tài khoản đã có 1 món) → giỏ có 3 món
☐ Giỏ hợp nhất vượt tồn kho → tự giảm + có thông báo rõ
☐ Nút thêm giỏ ở sản phẩm Lớp B bị vô hiệu, có tooltip
☐ Giá đổi sau khi thêm → hiện thông báo thay đổi giá
☐ Thêm Retinol + BPO → hiện cảnh báo CAO · nút thanh toán mờ
  → tích checkbox → nút thanh toán bật    ← bắt buộc
☐ Tồn kho KHÔNG bị giữ khi thêm vào giỏ (kiểm stock_quantity không đổi)
☐ Giỏ trống hiện gợi ý, không phải trang trắng
```

---

## ▸ J2 — Voucher & công cụ tính tiền ⭐⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 16 | P6 | `WG-P6-02` | J1 |

🎯 **MỤC TIÊU** — Công cụ tính tiền với **6 bước có thứ tự xác định** (`BR-CART-06`), và **một dòng giải thích cho mỗi bước**.

> ⭐⭐ **Thứ tự 6 bước của `BR-CART-06` là bất biến tài chính của hệ thống.**
> Thứ tự tính toán quyết định con số cuối cùng. Nếu phí giao hàng tính *trước* khi trừ giảm giá, miễn phí giao hàng theo ngưỡng sẽ sai. Nếu voucher phần trăm áp *sau* voucher tiền mặt, kết quả khác hẳn khi áp ngược lại. **Thứ tự phải cố định, và phải được test.**

🤖 **PROMPT**

```text
Hiện thực voucher và công cụ tính tiền (FR-CART-09…12).

ĐỌC TRƯỚC (bắt buộc đọc HẾT):
- docs/_requirements/M10.md — FR-CART-09…12
- docs/domain-rules.md — BR-VOUCH-01…12, BR-PRICE-01…06
- BRD §17.4 (bảng 6 bước tính toán với ví dụ số cụ thể)
- Prototype cart.html — bảng tóm tắt 6 bước (đã có ở V1.0)

BR-CART-06 — SÁU BƯỚC, THỨ TỰ CỐ ĐỊNH, KHÔNG ĐỔI:

  Bước 1 · Tạm tính        = Σ (giá hiện tại × số lượng)
  Bước 2 · Giảm theo sản phẩm (nếu sản phẩm có giá khuyến mại riêng)
  Bước 3 · Giảm theo voucher — áp dụng theo thứ tự:
             3a. Voucher phần trăm trước
             3b. Voucher tiền mặt sau
             (⚠️ thứ tự này là quy ước CỐ ĐỊNH, ghi rõ trong tài liệu)
  Bước 4 · Phí giao hàng   = tính TRÊN giá trị SAU bước 3
             Miễn phí nếu giá trị sau bước 3 ≥ free_shipping_threshold
  Bước 5 · Giảm phí giao hàng (nếu có voucher freeship riêng)
  Bước 6 · Tổng cuối       = (sau bước 3) + (sau bước 5)

  Làm tròn: CHỈ làm tròn ở BƯỚC 6, làm tròn LÊN tới 1.000đ.
  ⚠️ Làm tròn ở từng bước sẽ tích lũy sai số. Giữ độ chính xác
     decimal suốt 5 bước đầu, chỉ làm tròn kết quả cuối.
  ⚠️ Dùng decimal, KHÔNG dùng double/float cho tiền. (BR-PRICE-05)
     double 0.1 + 0.2 ≠ 0.3 — không bao giờ dùng cho tiền.

QUY TẮC VOUCHER (BR-VOUCH-01…12):
  • Mã không phân biệt hoa/thường, bỏ khoảng trắng hai đầu
  • Kiểm: tồn tại · còn hiệu lực (dùng IClock!) · còn lượt
         · đạt giá trị đơn tối thiểu · đúng đối tượng (mọi người / người mới)
  • Giới hạn lượt dùng: tổng và theo mỗi người
  • ⚠️ Chỉ áp dụng ĐỒNG THỜI tối đa: 1 voucher giảm giá + 1 voucher freeship
     Lý do: cho phép nhiều voucher giảm giá tạo tổ hợp không lường được
     và là lỗ hổng kinh doanh phổ biến.
  • Voucher giảm phần trăm có mức giảm TỐI ĐA (vd 20% nhưng không quá 100k)
  • ⚠️ Lượt dùng chỉ được TRỪ khi đơn hàng được TẠO THÀNH CÔNG,
     không phải khi áp mã. Và phải trừ TRONG CÙNG giao dịch với đơn hàng.
     (Nếu trừ lúc áp mã, người dùng áp rồi bỏ sẽ làm mất lượt.)

GIẢI THÍCH TỪNG BƯỚC (BR-PRICE-06) — BẮT BUỘC:
  Công cụ tính PHẢI trả về danh sách dòng giải thích:
    [ { label, amount, note } ]
  Ví dụ:
    { "Tạm tính (4 sản phẩm)",        1.250.000, null }
    { "Giảm giá sản phẩm",              -50.000, "Serum Niacinamide đang khuyến mại" }
    { "Voucher BEAUTY20 (-20%)",       -240.000, "Giảm tối đa 240.000đ" }
    { "Phí giao hàng",                        0, "Miễn phí cho đơn từ 500.000đ" }
    { "Tổng cộng",                       960.000, null }

  ⚠️ Người dùng PHẢI hiểu được con số cuối từ các dòng này.
     Nếu cộng các dòng không ra tổng, đó là lỗi.

TEST BẮT BUỘC (viết TRƯỚC khi hiện thực):
  - Ví dụ số cụ thể trong BRD §17.4 → kết quả khớp CHÍNH XÁC
  - Tổng các dòng giải thích = tổng cuối (test tính chất)
  - Voucher hết hạn → bị từ chối (dùng IClock giả để test)
  - Voucher hết lượt → bị từ chối
  - Áp 2 voucher giảm giá → voucher thứ hai bị từ chối
  - Áp 1 giảm giá + 1 freeship → cả hai được áp
  - Voucher 20% max 100k với đơn 1.000.000 → giảm ĐÚNG 100.000, không 200.000
  - Phí giao hàng tính trên giá SAU giảm (test ngưỡng miễn phí)
  - Giá trị tiền luôn là decimal (test kiểu)
  - Làm tròn chỉ ở bước cuối, LÊN
  - Áp voucher rồi BỎ → lượt dùng KHÔNG bị trừ

TUYỆT ĐỐI KHÔNG:
- Đổi thứ tự 6 bước  (BR-CART-06)
- Tính phí giao hàng trước khi trừ giảm giá
- Dùng double/float cho tiền
- Làm tròn ở từng bước
- Trừ lượt voucher khi áp mã
- Cho áp 2 voucher giảm giá cùng lúc
- Trả tổng cuối không có dòng giải thích
```

✅ **XONG KHI**

```text
☐ Ví dụ số trong BRD §17.4 cho kết quả KHỚP CHÍNH XÁC   ← bắt buộc
☐ Test tính chất: tổng dòng giải thích = tổng cuối       ← bắt buộc
☐ 11 test ở mục trên PASS
☐ Grep: 0 lần dùng double/float cho giá trị tiền
☐ Áp voucher rồi bỏ → used_count không đổi trong DB
☐ Bảng tóm tắt 6 bước hiện ở giỏ hàng, người đọc hiểu được tổng
☐ Voucher 20% max 100k với đơn 1tr → giảm đúng 100k
```

🔍 **KIỂM CHỨNG**

```bash
grep -rnE '\b(double|float)\b' src/BeautyAI.Domain src/BeautyAI.Application \
  | grep -iE 'price|amount|total|discount|fee|gia|tien' \
  && echo "⚠️ CÓ DÙNG double/float CHO TIỀN" || echo "✓ Chỉ dùng decimal"

dotnet test --filter "FullyQualifiedName~PricingCalculator"
dotnet test --filter "FullyQualifiedName~Voucher"
```

---

## ▸ J3 — Giỏ hàng bị bỏ & sản phẩm yêu thích

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 12 | P6 | `WG-P6-03` | J1 |

🎯 **MỤC TIÊU** — Danh sách yêu thích · theo dõi giỏ bị bỏ · nhắc trong ứng dụng (**không email, không SMS ở V1.0**).

🤖 **PROMPT**

```text
Hiện thực yêu thích và giỏ hàng bị bỏ (FR-CART-13…15).

ĐỌC TRƯỚC: docs/_requirements/M10.md · docs/domain-rules.md BR-CART-11…13
          · BRD §13.5 (quy định về tiếp thị trực tiếp)

1. Danh sách yêu thích:
   Thêm/bớt từ trang danh mục và chi tiết · trang riêng xem danh sách
   Yêu cầu đăng nhập (khác giỏ hàng — vì cần lưu dài hạn)
   Hiện Điểm Phù Hợp cho từng món (nếu có hồ sơ)
   Thông báo trong ứng dụng khi món yêu thích: giảm giá · hết hàng · có lại hàng

2. Theo dõi giỏ bị bỏ:
   Đánh dấu giỏ không hoạt động > 24 giờ (dùng IClock)
   Dùng để: thống kê ở trang admin · nhắc TRONG ỨNG DỤNG khi quay lại

   ⛔ KHÔNG gửi email hay SMS nhắc giỏ hàng ở V1.0.
      Lý do: tiếp thị trực tiếp cần sự đồng ý rõ ràng theo quy định,
      và hệ thống chưa có cơ chế quản lý đồng ý tiếp thị, cũng chưa có
      cơ chế hủy đăng ký. Làm nửa vời là vi phạm. (CMP-22)
      Ghi điều này vào docs/_plans/ như một mục V2.

3. Nhắc trong ứng dụng:
   Khi người dùng quay lại và có giỏ bị bỏ, hiện banner nhẹ:
   "Bạn còn 3 sản phẩm trong giỏ" + nút xem giỏ + nút bỏ qua
   ⚠️ Bỏ qua phải được NHỚ — không hiện lại banner đó trong phiên này.

4. Dọn dẹp: giỏ khách không hoạt động > 90 ngày → xóa
   (tác vụ dọn dẹp chạy khi ứng dụng khởi động, không cần Hangfire — ADR-009)

TUYỆT ĐỐI KHÔNG:
- Gửi email/SMS nhắc giỏ hàng ở V1.0
- Hiện lại banner nhắc sau khi người dùng bỏ qua
- Cho thêm yêu thích khi chưa đăng nhập (phải mời đăng nhập)
```

✅ **XONG KHI**

```text
☐ Thêm/bớt yêu thích hoạt động, có trang riêng
☐ Món yêu thích giảm giá → có thông báo trong ứng dụng
☐ Giỏ bị bỏ > 24h được đánh dấu (test bằng IClock giả)
☐ Banner nhắc hiện khi quay lại, bỏ qua được nhớ
☐ Grep: 0 lệnh gọi gửi email/SMS trong tính năng này
☐ Tác vụ dọn dẹp giỏ > 90 ngày hoạt động
```

---

## 📋 Danh mục kiểm tra kết thúc NHÓM J

```text
☐ Giỏ khách + hợp nhất khi đăng nhập
☐ 6 bước tính tiền đúng thứ tự · ví dụ BRD §17.4 khớp chính xác
☐ Mọi tiền dùng decimal · làm tròn chỉ ở bước cuối, LÊN
☐ Lượt voucher chỉ trừ khi tạo đơn thành công
☐ Mọi tổng có dòng giải thích, cộng lại khớp
☐ Panel xung đột + checkbox xác nhận gating thanh toán
☐ Yêu thích · nhắc trong ứng dụng · 0 email/SMS
☐ Ảnh chụp trạng thái: docs/_states/state_<YYYY-MM-DD>_nhom-j-xong.md
```

---

# PHẦN 11 — NHÓM K: THANH TOÁN · ĐƠN HÀNG

| | |
|---|---|
| **Phase** | P6 · `WG-P6-04`→`07` |
| **Giờ** | 54 (13,5 ngày) |
| **Kết quả** | Đặt hàng · quản lý đơn · **giảm tồn kho nguyên tử** (`INV-02`) · bản chụp đơn hàng (`INV-09`) |
| **Đặc điểm** | ⭐⭐ Nhóm có hậu quả không thể hoàn tác nếu làm sai |

> ⚠️ **Hai bất biến của nhóm này đều liên quan đến việc "không thể sửa về sau":**
> - `INV-02` **giảm tồn kho nguyên tử** — bán quá tồn kho là sai lệch vật lý, không phải lỗi hiển thị. Không có cách sửa trong hệ thống; phải xin lỗi khách.
> - `INV-09` **bản chụp đơn hàng** — nếu đơn hàng tham chiếu sản phẩm và giá *hiện tại*, thì khi sản phẩm bị sửa giá hay bị xóa, **hóa đơn cũ sẽ đổi nội dung**. Đó là lỗi không sửa được vì dữ liệu gốc đã mất.

---

## ▸ K1 — Tạo đơn hàng & giảm tồn kho nguyên tử ⭐⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 16 | P6 | `WG-P6-04` | J2 |

🎯 **MỤC TIÊU** — Tạo đơn hàng trong **một giao dịch**, với giảm tồn kho **nguyên tử** và **bản chụp đầy đủ**.

🤖 **PROMPT**

```text
Hiện thực tạo đơn hàng (FR-ORD-01…04).

ĐỌC TRƯỚC (bắt buộc đọc HẾT):
- docs/_requirements/M11.md — FR-ORD-01…04
- docs/domain-rules.md — BR-ORD-01…12
- docs/adr/ADR-010-order-snapshot.md
- Technical_Design §8.4 (luồng tạo đơn hàng, có sơ đồ trình tự)

INV-02 — GIẢM TỒN KHO NGUYÊN TỬ (bất biến quan trọng nhất):

  ⛔ CÁCH SAI (đừng làm, dù nó trông tự nhiên hơn):
     var p = await db.Products.FindAsync(id);
     if (p.StockQuantity >= qty) {        // ← đọc
         p.StockQuantity -= qty;          // ← rồi ghi
         await db.SaveChangesAsync();
     }
     Giữa lúc đọc và lúc ghi, một yêu cầu khác có thể làm điều tương tự.
     Cả hai thấy đủ hàng, cả hai trừ → tồn kho âm, hoặc bán quá.
     Đây là lỗi KHÔNG xuất hiện khi test một mình, chỉ xuất hiện khi
     có hai người mua cùng lúc — tức là xuất hiện ở production.

  ✅ CÁCH ĐÚNG — một câu lệnh UPDATE có điều kiện:
     var rows = await db.Database.ExecuteSqlInterpolatedAsync($@"
         UPDATE products
         SET stock_quantity = stock_quantity - {qty}
         WHERE product_id = {id} AND stock_quantity >= {qty}");

     if (rows == 0) {
         // Không đủ hàng — PostgreSQL đã kiểm tra và từ chối NGUYÊN TỬ
         return Result.Fail(ErrorCode.PRODUCT_OUT_OF_STOCK);
     }

  Và ràng buộc ck_products_stock (stock_quantity >= 0) ở DB là lớp
  phòng thủ thứ hai: nếu logic nào đó bỏ sót, DB vẫn từ chối.

GIAO DỊCH — TOÀN BỘ các việc sau trong MỘT giao dịch:
  1. Kiểm tra giỏ hàng không rỗng
  2. Kiểm tra cảnh báo xung đột mức CAO đã được xác nhận (BR-ORD-05)
     → chưa xác nhận: CONFLICT_NOT_ACKNOWLEDGED
  3. Tính lại tiền BẰNG CÙNG công cụ của J2
     ⚠️ KHÔNG tin số tiền do frontend gửi lên. Tính lại ở server.
        Nếu khác số frontend hiện → từ chối, báo giá đã đổi.
  4. Giảm tồn kho NGUYÊN TỬ cho từng món (cách đúng ở trên)
  5. Trừ lượt voucher (BR-VOUCH-11) — TRONG giao dịch này
  6. Tạo đơn hàng + các dòng đơn hàng với BẢN CHỤP đầy đủ
  7. Xóa giỏ hàng
  8. Ghi audit log

  Bất kỳ bước nào thất bại → ROLLBACK TOÀN BỘ.
  ⚠️ Không được có trạng thái trung gian: đơn hàng tạo mà tồn kho
     chưa trừ, hay tồn kho trừ mà đơn hàng không tạo.

INV-09 — BẢN CHỤP ĐƠN HÀNG (ADR-010):
  Dòng đơn hàng LƯU BẢN CHỤP, không chỉ lưu khóa ngoại:
    product_id (để tham chiếu) + product_name + brand_name
    + unit_price_vnd + image_url + variant_info
  Đơn hàng lưu bản chụp địa chỉ giao hàng (không chỉ address_id)
  Đơn hàng lưu bản chụp các dòng giải thích tính tiền (JSON)

  ⚠️ Lý do: sản phẩm có thể bị đổi tên, đổi giá, hoặc bị xóa.
     Hóa đơn phải giữ nguyên nội dung tại thời điểm mua — đó là
     yêu cầu pháp lý, không chỉ là tiện lợi.

  Test: tạo đơn → đổi tên và giá sản phẩm → xem lại đơn
        → đơn hàng hiện TÊN VÀ GIÁ CŨ

Mã đơn hàng: dạng người đọc được, không tuần tự dễ đoán
  (vd BA-20261021-7F3K) · DUY NHẤT · lưu dạng value object OrderCode

TUYỆT ĐỐI KHÔNG:
- Dùng mẫu đọc-rồi-ghi cho tồn kho  (INV-02)
- Tin số tiền do frontend gửi
- Tạo đơn hàng ngoài giao dịch
- Chỉ lưu khóa ngoại sản phẩm trong dòng đơn hàng  (INV-09)
- Cho phép tạo đơn khi chưa xác nhận cảnh báo mức CAO
- Trừ lượt voucher ngoài giao dịch tạo đơn
```

✅ **XONG KHI**

```text
☐ Grep: 0 lần mẫu đọc-rồi-ghi cho stock_quantity
☐ Test đồng thời: 10 yêu cầu song song mua sản phẩm còn 5 cái
  → ĐÚNG 5 đơn thành công, 5 đơn thất bại OUT_OF_STOCK,
    tồn kho cuối = 0, KHÔNG âm                        ← bắt buộc
☐ Test: tạo đơn → đổi tên + giá sản phẩm → đơn hàng hiện dữ liệu CŨ  ← bắt buộc
☐ Test: mô phỏng lỗi ở bước 7 → toàn bộ rollback (tồn kho về nguyên,
  voucher không bị trừ, đơn không tồn tại)
☐ Gửi tổng tiền sai từ frontend → bị từ chối
☐ Chưa xác nhận xung đột CAO → CONFLICT_NOT_ACKNOWLEDGED
☐ Mã đơn hàng duy nhất, không tuần tự
```

🔍 **KIỂM CHỨNG**

```bash
grep -rnE 'StockQuantity\s*-=|StockQuantity\s*=\s*.*-\s*' src/ --include=*.cs \
  | grep -v Test \
  && echo "⚠️ CÓ THỂ CÒN ĐỌC-RỒI-GHI" || echo "✓ Không có"

dotnet test --filter "FullyQualifiedName~ConcurrentOrder"
dotnet test --filter "FullyQualifiedName~OrderSnapshot"

# Tồn kho không bao giờ âm
docker compose exec -T postgres psql -U beautyai -d beautyai -c \
  "SELECT count(*) FROM products WHERE stock_quantity < 0;"   # phải 0
```

---

## ▸ K2 — Máy trạng thái đơn hàng ⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 12 | P6 | `WG-P6-05` | K1 |

🎯 **MỤC TIÊU** — Trạng thái đơn hàng chỉ chuyển theo **các bước cho phép** (`BR-ORD-13`), và **hoàn tồn kho khi hủy**.

🤖 **PROMPT**

```text
Hiện thực máy trạng thái đơn hàng (FR-ORD-05…08).

ĐỌC TRƯỚC: docs/_requirements/M11.md · docs/domain-rules.md BR-ORD-13…20
          · Technical_Design §6.4 (máy trạng thái, đặt trong Domain)

MÁY TRẠNG THÁI — đặt trong BeautyAI.Domain (thuần C#, không EF Core):

  private static readonly Dictionary<OrderStatus, OrderStatus[]> Allowed = new() {
      [CHO_XU_LY]     = [DA_THANH_TOAN, DA_HUY],
      [DA_THANH_TOAN] = [DANG_GIAO, DA_HUY],
      [DANG_GIAO]     = [DA_GIAO],
      [DA_GIAO]       = [],       // trạng thái cuối
      [DA_HUY]        = []        // trạng thái cuối
  };

  ⚠️ Mọi chuyển trạng thái PHẢI đi qua phương thức của entity Order,
     KHÔNG gán trực tiếp order.Status = ...
     Cách làm: để setter là private, cung cấp các phương thức
     MarkPaid() · MarkShipping() · MarkDelivered() · Cancel(reason)
     Mỗi phương thức kiểm tra bảng Allowed và trả Result.

  ⚠️ Vì sao đặt trong Domain: logic này phải kiểm thử được không cần DB,
     và phải được áp dụng BẤT KỂ ai gọi (admin, hệ thống, API).

HỦY ĐƠN (BR-ORD-16) — quan trọng:
  Người dùng hủy được khi: CHO_XU_LY hoặc DA_THANH_TOAN
  Admin hủy được ở mọi trạng thái trước DA_GIAO

  ⚠️ Hủy đơn PHẢI HOÀN TỒN KHO, trong CÙNG giao dịch:
     UPDATE products SET stock_quantity = stock_quantity + {qty} ...
  ⚠️ Và PHẢI hoàn lượt voucher đã dùng:
     UPDATE vouchers SET used_count = used_count - 1 ...
     (nếu không, một người hủy đơn sẽ mất lượt voucher oan)
  ⚠️ Chống hủy hai lần: kiểm tra trạng thái TRONG giao dịch, không
     chỉ ở tầng API. Hai yêu cầu hủy đồng thời không được hoàn tồn kho
     hai lần. Dùng khóa bản ghi (SELECT ... FOR UPDATE) hoặc kiểm tra
     trạng thái trong câu UPDATE có điều kiện.

LỊCH SỬ TRẠNG THÁI:
  Bảng order_status_history: order_id · from · to · changed_by
  · reason · changed_at
  Ghi cho MỌI lần chuyển.

GIAO DIỆN:
  Người dùng: danh sách đơn · chi tiết đơn · nút hủy (khi được phép)
             · dòng thời gian trạng thái
  Admin     : danh sách đơn có lọc · đổi trạng thái · lý do hủy bắt buộc

TUYỆT ĐỐI KHÔNG:
- Gán trực tiếp order.Status
- Cho chuyển trạng thái không có trong bảng Allowed
- Hủy đơn mà không hoàn tồn kho và lượt voucher
- Để hủy hai lần hoàn tồn kho hai lần
- Đặt logic máy trạng thái ngoài Domain
```

✅ **XONG KHI**

```text
☐ Grep: 0 lần gán trực tiếp order.Status (setter private)
☐ Test mọi cặp chuyển trạng thái: hợp lệ → thành công, không hợp lệ → từ chối
☐ Test: DA_GIAO → DANG_GIAO bị từ chối (không lùi được)
☐ Hủy đơn → tồn kho hoàn đúng · lượt voucher hoàn đúng   ← bắt buộc
☐ Test đồng thời: 2 yêu cầu hủy cùng lúc → tồn kho hoàn ĐÚNG 1 lần ← bắt buộc
☐ Mọi lần chuyển có dòng trong order_status_history
☐ Admin hủy đơn bắt buộc nhập lý do
```

🔍 **KIỂM CHỨNG**

```bash
grep -rn '\.Status\s*=' src/ --include=*.cs | grep -v Test | grep -v 'private' \
  && echo "⚠️ CÓ GÁN TRỰC TIẾP" || echo "✓ OK"

dotnet test --filter "FullyQualifiedName~OrderStateMachine"
dotnet test --filter "FullyQualifiedName~ConcurrentCancel"
```

---

## ▸ K3 — Luồng thanh toán & COD

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 14 | P6 | `WG-P6-06` | K1 |

🎯 **MỤC TIÊU** — Luồng thanh toán 3 bước, **COD và chuyển khoản** (không cổng thanh toán trực tuyến ở V1.0).

🤖 **PROMPT**

```text
Hiện thực luồng thanh toán (FR-ORD-09…12).

ĐỌC TRƯỚC: docs/_requirements/M11.md · docs/domain-rules.md BR-ORD-21…26
          · BRD §4.5 (phạm vi thanh toán V1.0)
          · Prototype checkout.html

PHẠM VI V1.0 — chỉ hai phương thức:
  1. COD (thu tiền khi nhận hàng)
  2. Chuyển khoản ngân hàng (hiện thông tin tài khoản + mã đơn để ghi chú)

  ⛔ KHÔNG tích hợp cổng thanh toán trực tuyến (VNPay, Momo, Stripe) ở V1.0.
     Lý do: cần hợp đồng thương mại, xác minh doanh nghiệp, và xử lý
     webhook hoàn tiền — đều vượt phạm vi V1.0. Ghi vào kế hoạch V2.
  ⛔ KHÔNG thu hay lưu thông tin thẻ dưới bất kỳ hình thức nào.
     Không có trường nhập số thẻ ở bất kỳ đâu trong hệ thống.

LUỒNG 3 BƯỚC:
  Bước 1 — Địa chỉ giao hàng
    Chọn địa chỉ đã lưu, hoặc nhập mới
    Khách chưa đăng nhập: nhập tên · điện thoại · địa chỉ · email (tùy chọn)
    ⚠️ Validate số điện thoại Việt Nam, nhưng không quá chặt —
       chấp nhận cả định dạng có +84 và 0

  Bước 2 — Phương thức & xem lại
    Chọn COD hoặc chuyển khoản
    Hiện BẢNG 6 BƯỚC TÍNH TIỀN của J2 — đầy đủ, không rút gọn
    Hiện lại cảnh báo xung đột (nếu có) + checkbox xác nhận
    ⚠️ Người dùng phải thấy CHÍNH XÁC số tiền sẽ trả trước khi xác nhận

  Bước 3 — Xác nhận
    Nút "Đặt hàng" → gọi API tạo đơn (K1)
    Chống nhấn hai lần: vô hiệu nút ngay khi nhấn + khóa phía server
    bằng khóa idempotency (mã do client sinh, server nhớ 10 phút)
    ⚠️ Nhấn hai lần tạo hai đơn là lỗi hay gặp và gây hậu quả thật.

  Sau khi đặt:
    Trang xác nhận có mã đơn · tóm tắt · hướng dẫn tiếp theo
    Chuyển khoản → hiện thông tin tài khoản + mã đơn để ghi vào nội dung
    ⚠️ KHÔNG gửi email xác nhận ở V1.0 (chưa có hạ tầng gửi mail
       và chưa có cơ chế đồng ý). Hiện rõ trên trang: "Vui lòng lưu
       mã đơn hàng này."

Khách mua không đăng nhập (FR-ORD-11):
  Cho phép. Tạo đơn với thông tin nhập tay.
  Tra cứu đơn bằng mã đơn + số điện thoại (không cần tài khoản).
  ⚠️ Giới hạn 5 lần tra cứu/phút/IP để tránh dò mã đơn.

TUYỆT ĐỐI KHÔNG:
- Tích hợp cổng thanh toán trực tuyến ở V1.0
- Có bất kỳ trường nhập thông tin thẻ
- Để nhấn hai lần tạo hai đơn
- Hiện tổng tiền rút gọn ở bước xem lại
- Gửi email ở V1.0
```

✅ **XONG KHI**

```text
☐ Luồng 3 bước hoạt động cho cả khách và người đã đăng nhập
☐ Grep toàn repo: 0 trường nhập số thẻ / cvv / card
☐ Nhấn "Đặt hàng" hai lần nhanh → ĐÚNG 1 đơn được tạo   ← bắt buộc
☐ Bảng 6 bước tính tiền hiện đầy đủ ở bước xem lại
☐ Cảnh báo xung đột + checkbox hiện lại ở bước 2
☐ Tra cứu đơn bằng mã + điện thoại hoạt động, có giới hạn tần suất
☐ Trang xác nhận nhắc lưu mã đơn
☐ E2E-01 (khách mua hàng) PASS trên 3 thiết bị
```

---

## ▸ K4 — Hoàn thiện & bật E2E-01

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 12 | P6 | `WG-P6-07` | K1, K2, K3 |

🎯 **MỤC TIÊU** — Luồng thương mại chạy đầu-cuối, chịu được tải đồng thời.

🤖 **PROMPT**

```text
Hoàn thiện nhóm K và bật E2E-01.

ĐỌC TRƯỚC: BRD §14 E2E-01 · docs/testing-strategy.md

PHẦN 1 — E2E-01 (khách mua hàng), chạy trên 3 thiết bị:
  Vào trang chủ → tìm sản phẩm → xem chi tiết → thêm giỏ
  → xem giỏ → áp voucher → thấy bảng 6 bước
  → thanh toán 3 bước → đặt hàng → thấy trang xác nhận có mã đơn
  → tra cứu đơn bằng mã + điện thoại

PHẦN 2 — Test đồng thời (BẮT BUỘC, không bỏ):
  Kịch bản A — tồn kho:
    Sản phẩm còn 5 cái · 10 yêu cầu mua song song
    Kỳ vọng: đúng 5 thành công · 5 thất bại · tồn kho = 0 · không âm

  Kịch bản B — voucher:
    Voucher còn 3 lượt · 10 yêu cầu dùng song song
    Kỳ vọng: đúng 3 thành công · used_count = 3, không vượt

  Kịch bản C — hủy đơn:
    2 yêu cầu hủy cùng một đơn, song song
    Kỳ vọng: 1 thành công · 1 thất bại · tồn kho hoàn đúng 1 lần

  ⚠️ Ba kịch bản này là loại test mà bỏ qua thì không biết mình sai
     cho đến khi có người dùng thật. Chúng phải nằm trong CI.

PHẦN 3 — Trang đơn hàng của tôi:
  Danh sách đơn · lọc theo trạng thái · chi tiết đơn
  · dòng thời gian trạng thái · nút hủy khi được phép
  · nút "Mua lại" (thêm lại các món còn bán được vào giỏ, báo món nào
    không còn)

PHẦN 4 — Rà soát: mọi endpoint ghi dữ liệu có kiểm tra quyền sở hữu.
  ⚠️ Người dùng A KHÔNG được xem/hủy đơn của người dùng B.
  Viết test cho điều này — đây là lỗi phân quyền phổ biến nhất.
```

✅ **XONG KHI**

```text
☐ E2E-01 PASS trên 3 thiết bị
☐ 3 kịch bản test đồng thời PASS và nằm trong CI   ← bắt buộc
☐ Trang đơn hàng của tôi hoạt động · "Mua lại" xử lý món hết hàng
☐ Test: người dùng A không xem/hủy được đơn của B   ← bắt buộc
☐ Coverage backend ≥ 70/60
☐ Ảnh chụp trạng thái: docs/_states/state_<YYYY-MM-DD>_phase-6-xong.md
```

🔍 **KIỂM CHỨNG**

```bash
dotnet test --filter "Category=Concurrency"
npx playwright test e2e/E2E-01-guest-purchase.spec.ts
dotnet test --filter "FullyQualifiedName~Ownership"
./syntheprise gate
```

> 🎉 **MỐC: Kết thúc Phase 6, BeautyAI là một sàn thương mại điện tử hoàn chỉnh — với phần trí tuệ đã có từ Phase 3–5.** Ba phase còn lại thêm trợ lý AI, quản trị, và kiểm thử cuối.

---
# PHẦN 12 — NHÓM L: TRỢ LÝ AI BA TẦNG

| | |
|---|---|
| **Phase** | P7 · `WG-P7-01`→`06` |
| **Giờ** | 72 (18 ngày) — **nhóm lớn nhất của dự án** |
| **Kết quả** | Trợ lý AI: luật định trước → Gemini có ràng buộc → chuyển Zalo |
| **Đặc điểm** | ⭐⭐⭐ Nhóm có **rủi ro tuân thủ cao nhất**. Bốn bất biến: `INV-04` · `INV-05` · `INV-06` · `INV-12` |

> ⚠️⚠️ **Đọc trước khi bắt đầu nhóm này.**
> Đây là nhóm duy nhất mà một lỗi có thể gây **hậu quả pháp lý**, không chỉ hậu quả kỹ thuật. Ba loại rủi ro:
> 1. **Tư vấn y tế** — một mô hình ngôn ngữ nói *"bạn bị viêm da tiếp xúc, nên dùng…"* là hành nghề y không phép. (`CMP-11`)
> 2. **Quảng cáo sai quy định** — mô hình nói *"sản phẩm này điều trị mụn"* là quảng cáo mỹ phẩm như thuốc. (`CMP-04`)
> 3. **Chuyển dữ liệu qua biên giới** — gửi hồ sơ da kèm danh tính ra ngoài là vi phạm PDPL 2025. (`CMP-18`)
>
> Kiến trúc 7 tầng dưới đây được thiết kế để **mỗi rủi ro có một tầng chặn riêng**, và mỗi tầng đều **chặn được một mình** nếu các tầng khác lỗi.

---

## 🏗 Đường ống 7 tầng — đọc kỹ sơ đồ này trước mọi task của nhóm L

```text
  Câu hỏi của người dùng
         ↓
  ┌──────────────────────────────────────────────────────────┐
  │ 1. MedicalGuardClassifier     CHẶN chủ đề y tế            │  ← L2
  │    Phát hiện câu hỏi về bệnh da, thuốc, chẩn đoán        │
  │    → KHÔNG gọi LLM. Chuyển Zalo hoặc khuyên gặp bác sĩ.  │
  └──────────────────────────────────────────────────────────┘
         ↓ (không phải chủ đề y tế)
  ┌──────────────────────────────────────────────────────────┐
  │ 2. QuotaGuard                 Giới hạn lượt gọi          │  ← L4
  │    Khách 5/ngày · người dùng 20/ngày · admin 100/ngày    │
  └──────────────────────────────────────────────────────────┘
         ↓
  ┌──────────────────────────────────────────────────────────┐
  │ 3. IntentMatcher              LUẬT ĐỊNH TRƯỚC            │  ← L1
  │    Khớp ý định → trả lời ngay, KHÔNG gọi LLM             │
  │    Đây là tầng xử lý phần lớn câu hỏi thường gặp         │
  └──────────────────────────────────────────────────────────┘
         ↓ (không khớp luật nào)
  ┌──────────────────────────────────────────────────────────┐
  │ 4. DeIdentificationService    ẨN DANH HÓA (INV-04)       │  ← đã có ở D3
  │    Chỉ gửi phân loại, không gửi danh tính                │
  └──────────────────────────────────────────────────────────┘
         ↓
  ┌──────────────────────────────────────────────────────────┐
  │ 5. Gemini                     ToolChoice.Required        │  ← L3
  │    BẮT BUỘC gọi hàm tra cứu danh mục.                    │
  │    Mô hình KHÔNG được tự sinh tên sản phẩm.              │
  └──────────────────────────────────────────────────────────┘
         ↓
  ┌──────────────────────────────────────────────────────────┐
  │ 6. GroundingValidator         KIỂM CHỨNG (INV-05)        │  ← L3
  │    Mọi tên sản phẩm trong câu trả lời PHẢI có trong      │
  │    kết quả tra cứu. Không có → loại bỏ câu đó.           │
  └──────────────────────────────────────────────────────────┘
         ↓
  ┌──────────────────────────────────────────────────────────┐
  │ 7. AdvertisingComplianceFilter LỌC Ở ĐẦU RA (INV-06)     │  ← L3
  │    Quét câu trả lời tìm từ vi phạm. Không chỉ ở prompt.  │
  └──────────────────────────────────────────────────────────┘
         ↓
  Câu trả lời tới người dùng
```

> 🔑 **Nguyên tắc thiết kế quan trọng nhất:** tầng 7 **lọc ở đầu ra, không chỉ ở prompt**.
> Viết trong prompt *"đừng dùng từ điều trị"* là một **lời đề nghị** với mô hình — nó có thể không tuân theo, đặc biệt khi câu hỏi được diễn đạt khéo. Lọc ở đầu ra là một **ràng buộc** — nó kiểm tra kết quả thật. Đây là khác biệt giữa hy vọng và đảm bảo. (`BR-AI-13`)

---

## ▸ L1 — Tầng luật định trước ⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 12 | P7 | `WG-P7-01` | D1 |

🎯 **MỤC TIÊU** — Tầng luật xử lý được **phần lớn câu hỏi thường gặp** mà **không gọi LLM** — nhanh hơn, rẻ hơn, và **chắc chắn đúng**.

> 💡 **Vì sao tầng luật đi TRƯỚC LLM, không phải sau:** với câu *"phí giao hàng bao nhiêu?"*, một luật định trước cho câu trả lời **chính xác, tức thì, miễn phí**. Gọi LLM cho câu đó là chậm hơn, tốn tiền, và có khả năng sai. Tầng luật không phải là phương án dự phòng — nó là **tầng chính**.

🤖 **PROMPT**

```text
Hiện thực tầng luật định trước (FR-AI-01…04).

ĐỌC TRƯỚC:
- docs/_requirements/M12.md — FR-AI-01…04
- docs/domain-rules.md — BR-AI-01…06
- docs/llm-policy.md §9.1 (ranh giới của trợ lý)
- Prototype expert-consult.html (đã cập nhật V1.0 — mảng RULES trong JS
  là điểm khởi đầu, chuyển sang backend)

CẤU TRÚC:
  Bảng ai_intent_rules:
    intent_code · patterns (jsonb: mảng mẫu khớp)
    · response_template · requires_context (jsonb)
    · priority · is_active

  Khớp mẫu: chuẩn hóa câu hỏi bằng vn_normalize() rồi khớp từ khóa
  + khớp mờ trigram cho câu gần giống.
  Nhiều luật khớp → chọn priority cao nhất.

CÁC NHÓM Ý ĐỊNH BẮT BUỘC CÓ (tối thiểu 40 luật):

  Nhóm A — Thông tin vận hành (trả lời chính xác, không cần LLM):
    phí giao hàng · thời gian giao · chính sách đổi trả
    · phương thức thanh toán · cách tra cứu đơn · cách dùng voucher
    → đọc giá trị thật từ system_settings, không viết cứng trong mẫu

  Nhóm B — Giải thích thành phần:
    "niacinamide là gì" · "retinol dùng thế nào" · "AHA và BHA khác gì"
    → đọc từ từ điển thành phần (C3), trả lời bằng diễn giải ĐÃ RÀ SOÁT
    ⚠️ Chỉ trả lời về thành phần có is_reviewed = true.
       Chưa rà soát → nói "chúng tôi chưa có thông tin về thành phần này"

  Nhóm C — Xung đột hoạt chất:
    "retinol và BHA dùng cùng được không" · "vitamin C với niacinamide"
    → đọc từ conflict_rules (C4), trả lời ĐÚNG CẤP BẰNG CHỨNG
    ⚠️ Vitamin C + Niacinamide PHẢI trả lời ĐÍNH CHÍNH, không cảnh báo
       (BR-CONF-02b)

  Nhóm D — Điều hướng:
    "tôi muốn tìm kem chống nắng" → gợi ý dùng Lọc Thông Minh + liên kết
    "làm sao biết loại da tôi" → dẫn tới Skin Quiz

  Nhóm E — Về chính hệ thống:
    "điểm phù hợp là gì" · "vì sao không có điểm an toàn"
    → giải thích lập trường của hệ thống (quan trọng: đây là nơi
      giải thích vì sao BeautyAI KHÔNG chấm điểm an toàn)

PERSONA (BR-AI-14) — áp dụng ở MỌI câu trả lời của mọi tầng:
  ✅ "Trợ lý tư vấn sản phẩm của BeautyAI"
  ⛔ KHÔNG BAO GIỜ: bác sĩ · dược sĩ · chuyên gia da liễu · chuyên gia
     · bác sĩ da liễu · nhà khoa học
  ⛔ KHÔNG dùng ngôi thứ nhất kiểu chuyên gia: "theo kinh nghiệm của tôi"
     "tôi khuyên bạn nên điều trị"

  Thanh từ chối trách nhiệm CỐ ĐỊNH ở đầu giao diện chat (theo prototype):
  "Trợ lý tư vấn sản phẩm — không thay thế lời khuyên y tế.
   Với vấn đề da liễu, hãy tham vấn bác sĩ."
  ⚠️ Thanh này KHÔNG được cuộn mất. Luôn hiện.

CÂU CHÀO (FR-AI-02):
  Nói rõ LÀM ĐƯỢC GÌ và KHÔNG LÀM ĐƯỢC GÌ, ngay từ đầu:
  "Mình có thể giúp bạn: tìm sản phẩm theo loại da · giải thích thành phần
   · kiểm tra hoạt chất dùng chung được không · hướng dẫn đặt hàng.
   Mình không thể: chẩn đoán bệnh da · kê thuốc · thay thế bác sĩ."
  ⚠️ Nói trước giới hạn là cách giảm câu hỏi ngoài phạm vi hiệu quả nhất.

TUYỆT ĐỐI KHÔNG:
- Gọi LLM khi luật đã khớp
- Dùng persona bác sĩ/chuyên gia ở bất kỳ đâu
- Viết cứng phí giao hàng/thời gian giao trong mẫu trả lời
- Trả lời về thành phần chưa rà soát
- Để thanh từ chối trách nhiệm cuộn mất
```

✅ **XONG KHI**

```text
☐ ≥ 40 luật trong ai_intent_rules, phủ 5 nhóm A–E
☐ Hỏi "phí giao hàng bao nhiêu" → trả lời đúng giá trị từ system_settings,
  KHÔNG gọi LLM (kiểm bằng log: 0 lần gọi Gemini)
☐ Hỏi "vitamin C với niacinamide" → ĐÍNH CHÍNH, không cảnh báo
☐ Hỏi "retinol và benzoyl peroxide" → cảnh báo CAO có nguồn
☐ Hỏi về thành phần chưa rà soát → nói chưa có thông tin
☐ Grep toàn bộ mẫu trả lời: 0 lần "bác sĩ"/"dược sĩ"/"chuyên gia" mô tả
  CHÍNH trợ lý (được phép khi khuyên gặp bác sĩ)
☐ Câu chào nói rõ cả làm được và không làm được
☐ Thanh từ chối trách nhiệm cố định, không cuộn mất
```

---

## ▸ L2 — Bộ chặn chủ đề y tế ⭐⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 12 | P7 | `WG-P7-02` | L1 |

🎯 **MỤC TIÊU** — Chặn **mọi** câu hỏi y tế **trước khi** nó tới LLM, và chuyển hướng **một cách có ích**.

> ⚠️ **Vì sao tầng này ở VỊ TRÍ SỐ 1, trước cả kiểm tra quota:**
> Nếu một câu hỏi y tế đi qua được, nó sẽ tới LLM — và một mô hình ngôn ngữ **sẽ trả lời**, vì nó được huấn luyện để hữu ích. Câu trả lời đó là tư vấn y tế từ một hệ thống không có giấy phép. Tầng chặn phải ở trước, không phải ở sau.

🤖 **PROMPT**

```text
Hiện thực MedicalGuardClassifier (FR-AI-05, FR-AI-06).

ĐỌC TRƯỚC (bắt buộc đọc HẾT):
- docs/_requirements/M12.md — FR-AI-05, FR-AI-06
- docs/llm-policy.md §9.2 (danh sách chủ đề bị chặn — ĐẦY ĐỦ)
- docs/domain-rules.md — BR-AI-07…12
- BRD §13.2 (quy định hành nghề y · CMP-11…CMP-17)
- Prototype expert-consult.html — mảng BLOCKED trong JS, có demo vảy nến

DANH SÁCH CHỦ ĐỀ BỊ CHẶN (đọc đầy đủ ở docs/llm-policy.md §9.2):
  Nhóm 1 — Bệnh da có tên:
    vảy nến · viêm da · eczema · chàm · zona · nấm da · lupus
    · rosacea · trứng cá đỏ · mề đay · tổ đỉa · thủy đậu
    · u da · ung thư da · nốt ruồi bất thường

  Nhóm 2 — Thuốc và điều trị y tế:
    isotretinoin · tretinoin kê đơn · corticoid · kháng sinh
    · thuốc bôi theo đơn · laser · peel da y tế · tiêm · filler

  Nhóm 3 — Yêu cầu chẩn đoán:
    "tôi bị gì" · "đây có phải là..." · "có nguy hiểm không"
    · "có cần đi khám không" · gửi ảnh hỏi bệnh

  Nhóm 4 — Thai kỳ và y tế đặc thù:
    dùng thuốc khi mang thai · cho con bú · tương tác với thuốc đang dùng

  Nhóm 5 — Tình trạng cấp tính:
    sưng · đau · chảy dịch · sốt · lan rộng nhanh · khó thở
    ⚠️ Nhóm này ưu tiên CAO NHẤT — khuyên đi khám NGAY,
       không chuyển Zalo (Zalo không phải kênh cấp cứu)

KHỚP MẪU — yêu cầu:
  So khớp KHÔNG PHÂN BIỆT DẤU (vn_normalize) — "vay nen", "VẢY NẾN",
  "vẩy nến" đều phải bị chặn.
  Khớp cả dạng viết tắt và viết sai thường gặp.
  Khớp cả khi từ khóa nằm giữa câu dài.

  ⚠️ Chấp nhận CHẶN NHẦM hơn là BỎ SÓT.
     Một câu hỏi về sản phẩm bị chặn nhầm → người dùng hơi bất tiện,
     và có thể hỏi lại cách khác.
     Một câu hỏi y tế bị bỏ sót → hệ thống đưa tư vấn y tế.
     Hai hậu quả này không cùng mức.

PHẢN HỒI KHI CHẶN — phải CÓ ÍCH, không chỉ từ chối:

  Nhóm 1–4:
    "Câu hỏi của bạn liên quan đến vấn đề da liễu cần chuyên môn y tế,
     và mình là trợ lý tư vấn sản phẩm nên không thể trả lời.

     Mình có thể giúp bạn bằng hai cách:
     • Chuyển bạn tới chuyên viên của BeautyAI qua Zalo
       (họ có thể tư vấn kỹ hơn về sản phẩm phù hợp)
     • Giúp bạn tìm sản phẩm chăm sóc da hằng ngày phù hợp loại da

     Với vấn đề da liễu, bạn nên tham vấn bác sĩ da liễu."
    + nút "Chuyển sang Zalo" (L5)
    + nút "Tìm sản phẩm chăm sóc hằng ngày"

  Nhóm 5 (cấp tính) — KHÁC HẲN:
    "Các dấu hiệu bạn mô tả cần được bác sĩ xem trực tiếp, càng sớm
     càng tốt. Bạn nên đến cơ sở y tế gần nhất hoặc gọi cho bác sĩ.

     Mình không thể tư vấn về tình trạng này."
    ⛔ KHÔNG hiện nút chuyển Zalo cho nhóm 5.
       Zalo là kênh tư vấn sản phẩm, không phải kênh y tế cấp cứu.
       Chuyển sang Zalo trong tình huống cấp tính là làm CHẬM việc
       người đó cần làm.
    ⛔ KHÔNG gợi ý sản phẩm nào.

GHI NHẬN:
  Mọi lần chặn → ghi vào ai_blocked_queries (chủ đề, nhóm, thời điểm)
  ⚠️ KHÔNG lưu nội dung câu hỏi đầy đủ — chỉ lưu nhóm chủ đề đã phát hiện.
     Lý do: nội dung câu hỏi y tế là dữ liệu sức khỏe. (CMP-18)
  Dùng để: cải thiện bộ luật · biết người dùng hỏi gì

TEST BẮT BUỘC — tối thiểu 30 câu:
  15 câu PHẢI bị chặn, phủ cả 5 nhóm, gồm:
    "tôi bị vảy nến dùng gì" · "toi bi vay nen dung gi" (không dấu)
    · "da tôi sưng đỏ và đau" (nhóm 5)
    · "dùng tretinoin khi mang thai được không"
    · "đây có phải nấm da không"
  15 câu PHẢI ĐƯỢC qua, gồm:
    "kem chống nắng nào phù hợp da dầu"
    · "niacinamide là gì" · "phí giao hàng bao nhiêu"
    · "retinol và BHA dùng cùng được không" (câu hỏi về hoạt chất
      trong mỹ phẩm — KHÔNG phải câu hỏi y tế)

  ⚠️ Cặp cuối quan trọng: phải phân biệt được "retinol trong mỹ phẩm"
     (được trả lời) với "tretinoin kê đơn" (bị chặn).

TUYỆT ĐỐI KHÔNG:
- Để câu hỏi y tế đi tới LLM
- Chuyển Zalo cho tình trạng cấp tính (nhóm 5)
- Gợi ý sản phẩm khi đã chặn vì lý do y tế
- Lưu nội dung đầy đủ câu hỏi y tế
- Trả lời "tôi không thể giúp" mà không đưa lựa chọn nào
```

✅ **XONG KHI**

```text
☐ 30 câu test PASS (15 chặn · 15 qua)                      ← bắt buộc
☐ Câu không dấu bị chặn như câu có dấu
☐ Nhóm 5 → khuyên đi khám, KHÔNG có nút Zalo, KHÔNG gợi ý sản phẩm
☐ Nhóm 1–4 → có nút Zalo + nút tìm sản phẩm hằng ngày
☐ Phân biệt được "retinol mỹ phẩm" (qua) với "tretinoin kê đơn" (chặn)
☐ ai_blocked_queries chỉ lưu nhóm chủ đề, KHÔNG lưu nội dung
☐ Log xác nhận: 0 lần gọi Gemini cho 15 câu bị chặn
```

🔍 **KIỂM CHỨNG**

```bash
dotnet test --filter "FullyQualifiedName~MedicalGuard"

docker compose exec -T postgres psql -U beautyai -d beautyai -c \
  "SELECT column_name FROM information_schema.columns
   WHERE table_name='ai_blocked_queries';"
# KHÔNG được có cột lưu nội dung câu hỏi đầy đủ
```

---

## ▸ L3 — Tích hợp Gemini có ràng buộc ⭐⭐⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 16 | P7 | `WG-P7-03` | L2, D3 |

🎯 **MỤC TIÊU** — Gemini trả lời **chỉ dựa trên danh mục thật**, với **ba lớp ràng buộc** ở đầu ra.

> ⚠️⚠️ **Đây là task có rủi ro cao nhất của toàn dự án.** Một mô hình ngôn ngữ **sẽ bịa tên sản phẩm** nếu được phép, vì nó được huấn luyện để trả lời đầy đủ. Ba lớp ràng buộc dưới đây đều cần thiết; bỏ một lớp là mở một đường cho câu trả lời sai lọt ra.

🤖 **PROMPT**

```text
Tích hợp Gemini với ba lớp ràng buộc.

ĐỌC TRƯỚC (bắt buộc đọc HẾT, không đọc lướt):
- docs/llm-policy.md — TOÀN BỘ
- docs/_requirements/M12.md — FR-AI-07…10
- docs/domain-rules.md — BR-AI-13…18
- docs/adr/ADR-005-ai-seven-stage-pipeline.md
- .agents/rules/provider-abstraction.md  ← quyết định nơi đặt code
- src/BeautyAI.Application/.../IDeIdentificationService.cs (đã có ở D3)

VỊ TRÍ CODE (theo provider-abstraction.md):
  Interface IAiChatProvider → BeautyAI.Application
  Hiện thực GeminiChatProvider → BeautyAI.Infrastructure/Providers/Gemini/
  ⛔ HttpClient và SDK của Gemini CHỈ xuất hiện trong thư mục Providers/.
     Test kiến trúc Bài 4 (từ B4) thực thi điều này.
  Lý do: nếu sau này đổi nhà cung cấp, chỉ thay một thư mục.

LỚP RÀNG BUỘC 1 — ToolChoice.Required (BR-AI-15):
  Khai báo công cụ cho Gemini:
    search_products(skin_type, concerns, routine_step, budget_band,
                    avoid_ingredients) → trả danh sách sản phẩm THẬT
    get_ingredient_info(inci_name)     → trả diễn giải ĐÃ RÀ SOÁT
    get_conflict_info(group_a, group_b)→ trả quy tắc xung đột có nguồn

  ⚠️ Đặt ToolChoice = Required. Mô hình BẮT BUỘC gọi hàm, không được
     trả lời trực tiếp từ tri thức của nó.

  ⛔⛔ INV-12 — TRỢ LÝ AI KHÔNG THỂ THỰC HIỆN GIAO DỊCH
     (bất biến, `Technical_Design` §4.4 · kiểm thử `GC-13`):
     Cả BA hàm trên đều CHỈ ĐỌC. KHÔNG được khai báo cho Gemini
     bất kỳ công cụ nào có TÁC DỤNG PHỤ:
       ❌ add_to_cart        ❌ apply_voucher     ❌ create_order
       ❌ cancel_order       ❌ update_profile    ❌ delete_anything
       ❌ send_message       ❌ create_handoff
     Trợ lý được phép GỢI Ý hành động và trả về một liên kết/nút để
     NGƯỜI DÙNG tự bấm — không bao giờ tự thực hiện.
     Vì sao: một mô hình bị dẫn dắt bằng câu hỏi khéo mà có công cụ
     ghi dữ liệu là một lỗ hổng không thể bù bằng prompt. Cách chặn
     duy nhất đáng tin là KHÔNG khai báo công cụ đó.

     Kiểm thử bắt buộc: test đọc danh sách tool đã khai báo cho provider,
     kỳ vọng MỌI tool đều nằm trong allowlist chỉ-đọc. Thêm một tool
     mới mà không cập nhật allowlist → test ĐỎ.

  ⚠️ Các hàm này đọc từ DB thật. Mọi tên sản phẩm trong câu trả lời
     phải đến từ đây.

LỚP RÀNG BUỘC 2 — GroundingValidator (INV-05):
  Sau khi nhận câu trả lời của Gemini:
    1. Trích mọi chuỗi trông như tên sản phẩm (khớp với danh mục
       bằng tên và trigram)
    2. Với mỗi tên: kiểm tra nó CÓ trong kết quả của hàm search_products
       đã gọi ở lượt này
    3. Không có → câu chứa tên đó BỊ LOẠI khỏi phản hồi
    4. Nếu loại hết → trả lời bằng tầng luật thay thế, hoặc chuyển Zalo

  ⚠️ Ghi log mọi lần loại bỏ, kèm tên bị bịa. Dùng để đo tỷ lệ bịa
     và cải thiện prompt. Nếu tỷ lệ cao, đó là dấu hiệu prompt có vấn đề.

LỚP RÀNG BUỘC 3 — AdvertisingComplianceFilter (INV-06 · BR-AI-13):
  Quét câu trả lời ở ĐẦU RA (không chỉ dặn trong prompt) tìm:
    điều trị · chữa · trị mụn · trị nám · đặc trị · khỏi hẳn · dứt điểm
    · hiệu quả 100% · tốt nhất · số 1 · an toàn tuyệt đối · kháng viêm
    · giảm viêm · kháng khuẩn · tái tạo tế bào · xóa nám · xóa nhăn
  So khớp KHÔNG PHÂN BIỆT DẤU.

  Khi phát hiện:
    - Thay bằng từ tuân thủ nếu có mapping an toàn
      ("hỗ trợ cải thiện" thay "điều trị")
    - Không có mapping → LOẠI câu đó
    - Ghi log để biết prompt cần sửa

  ⚠️ Lý do lớp này bắt buộc dù prompt đã dặn: prompt là đề nghị,
     bộ lọc là ràng buộc. Mô hình có thể bỏ qua đề nghị, đặc biệt khi
     câu hỏi được diễn đạt theo cách dẫn dắt.

PROMPT HỆ THỐNG — các yêu cầu:
  • Persona: "trợ lý tư vấn sản phẩm của BeautyAI" (BR-AI-14)
  • Chỉ nói về sản phẩm trong danh mục, qua các hàm tra cứu
  • Không chẩn đoán, không kê thuốc, không nói về bệnh
  • Không dùng danh sách từ bị cấm
  • Khi không biết → nói không biết, đề nghị chuyển Zalo
  • Trả lời bằng tiếng Việt, ngắn gọn, thân thiện nhưng không suồng sã
  • Luôn nêu rõ khi thông tin có giới hạn

  ⚠️ Prompt hệ thống lưu trong tệp dưới version control
     (docs/prompts/system-prompt-v1.md), KHÔNG viết inline trong code.
     Lý do: cần theo dõi thay đổi prompt như theo dõi thay đổi code.

ẨN DANH HÓA (INV-04):
  ⚠️ Dữ liệu người dùng CHỈ đi qua DeIdentificationService (D3).
     Viết test: GeminiChatProvider KHÔNG có đường nào nhận ChatContext
     thô — chỉ nhận SafeLlmContext.
     Thực thi bằng kiểu: tham số của phương thức là SafeLlmContext,
     không phải ChatContext.

XỬ LÝ LỖI & SUY GIẢM:
  Gemini lỗi/quá thời gian (8 giây) → không báo lỗi kỹ thuật cho người dùng.
  Thay vào đó: thử tầng luật, hoặc nói
  "Mình chưa trả lời được câu này. Bạn có muốn mình chuyển sang
   chuyên viên qua Zalo không?"
  Thử lại 1 lần với backoff. Lỗi liên tiếp 5 lần → tắt tầng LLM
  trong 5 phút (circuit breaker), chỉ dùng tầng luật.

TUYỆT ĐỐI KHÔNG:
- Để ToolChoice khác Required
- Bỏ GroundingValidator vì "mô hình đủ tốt rồi"
- Chỉ dặn trong prompt mà không lọc ở đầu ra
- Truyền ChatContext thô vào provider
- Đặt HttpClient/SDK Gemini ngoài thư mục Providers/
- Viết prompt hệ thống inline trong code
- Hiện lỗi kỹ thuật của Gemini cho người dùng
- Lưu khóa API trong code (đọc từ biến môi trường)
```

✅ **XONG KHI**

```text
☐ ToolChoice = Required (kiểm trong code và trong log request)
☐ **`GC-13`: mọi tool khai báo cho LLM đều chỉ-đọc, có allowlist**  ← INV-12
☐ Thử thêm một tool có tác dụng phụ → test allowlist ĐỎ (rồi xóa đi)
☐ Test: giả lập Gemini trả tên sản phẩm KHÔNG có trong danh mục
  → câu đó BỊ LOẠI                                       ← bắt buộc
☐ Test: giả lập Gemini trả lời chứa "điều trị mụn"
  → bị lọc hoặc thay thế                                 ← bắt buộc
☐ Test kiểu: GeminiChatProvider chỉ nhận SafeLlmContext  ← bắt buộc
☐ Test kiến trúc Bài 4 PASS (HttpClient chỉ trong Providers/)
☐ Prompt hệ thống ở docs/prompts/, không inline
☐ Gemini lỗi → suy giảm sang tầng luật, không hiện lỗi kỹ thuật
☐ 5 lỗi liên tiếp → circuit breaker mở
☐ Khóa API đọc từ biến môi trường, không có trong git (gitleaks xanh)
```

🔍 **KIỂM CHỨNG**

```bash
dotnet test --filter "FullyQualifiedName~Grounding"
dotnet test --filter "FullyQualifiedName~ComplianceFilter"
dotnet test tests/BeautyAI.ArchitectureTests

grep -rn 'HttpClient\|GenerativeAI' src/ --include=*.cs \
  | grep -v 'Infrastructure/Providers' | grep -v Test \
  && echo "⚠️ SDK RÒ RA NGOÀI PROVIDERS" || echo "✓ OK"

gitleaks detect --source . --no-banner
```

---

## ▸ L4 — Quota & lịch sử chat

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 10 | P7 | `WG-P7-04` | L3 |

🎯 **MỤC TIÊU** — Giới hạn lượt gọi LLM (kiểm soát chi phí) · lưu lịch sử chat **có kiểm soát quyền riêng tư**.

🤖 **PROMPT**

```text
Hiện thực quota và lịch sử chat (FR-AI-11…14).

ĐỌC TRƯỚC: docs/_requirements/M12.md · docs/domain-rules.md BR-AI-19…24
          · docs/llm-policy.md §9.4 (lưu trữ hội thoại)

QUOTA (BR-AI-19):
  Giới hạn ĐỌC TỪ system_settings (D4), không viết cứng:
    khách      : 5 lượt gọi LLM/ngày
    người dùng : 20 lượt gọi LLM/ngày
    admin      : 100 lượt gọi LLM/ngày

  ⚠️ Chỉ đếm lượt gọi LLM THẬT. Câu trả lời từ tầng luật KHÔNG tính quota.
     Lý do: tầng luật không tốn tiền, và đếm nó sẽ khuyến khích người dùng
     hỏi những câu phức tạp hơn để không "lãng phí" quota — ngược mục đích.

  Reset lúc 00:00 giờ Việt Nam (dùng IClock — đây là lý do IClock tồn tại).

  Hết quota → thông báo rõ:
  "Bạn đã dùng hết 20 lượt tư vấn AI hôm nay. Lượt mới sẽ có lúc 0h.
   Trong lúc này, mình vẫn trả lời được các câu hỏi thường gặp,
   hoặc bạn có thể chuyển sang chuyên viên qua Zalo."
  ⚠️ Hết quota KHÔNG chặn tầng luật — người dùng vẫn hỏi được
     câu thường gặp.

LỊCH SỬ CHAT (BR-AI-21):
  Bảng chat_sessions + chat_messages
  Lưu: nội dung tin nhắn · tầng đã xử lý (luật/LLM/chặn)
      · sản phẩm được gợi ý · bản chụp hồ sơ da ĐÃ ẨN DANH (nếu có)

  ⚠️ Ràng buộc ck_hr_consent (từ C1) đảm bảo: không đồng ý chia sẻ
     thì skin_snapshot_json PHẢI NULL. DB thực thi điều này.

  Người dùng:
    xem lại lịch sử · tiếp tục hội thoại cũ
    · XÓA một hội thoại · XÓA toàn bộ lịch sử
  ⚠️ Nút xóa phải thật xóa, không chỉ ẩn. (CMP-19)

  Khách chưa đăng nhập: lưu theo cookie phiên, xóa sau 7 ngày.

ĐO LƯỜNG (cho trang admin ở nhóm M):
  Đếm theo ngày: lượt tầng luật · lượt LLM · lượt bị chặn
  · lượt chuyển Zalo · lượt bị GroundingValidator loại
  · lượt bị ComplianceFilter lọc

  ⚠️ Hai chỉ số cuối là chỉ số CHẤT LƯỢNG quan trọng nhất của nhóm L.
     Tỷ lệ bị loại cao = prompt hoặc công cụ tra cứu có vấn đề.

TUYỆT ĐỐI KHÔNG:
- Tính quota cho câu trả lời từ tầng luật
- Chặn tầng luật khi hết quota
- Viết cứng giá trị quota
- Lưu hồ sơ da khi chưa được đồng ý
- Để nút xóa chỉ ẩn mà không xóa thật
```

✅ **XONG KHI**

```text
☐ Quota đọc từ system_settings, admin đổi được
☐ Câu từ tầng luật KHÔNG trừ quota (test: hỏi 10 câu luật → quota không đổi)
☐ Hết quota → tầng luật VẪN hoạt động
☐ Reset đúng 0h giờ Việt Nam (test bằng IClock giả)
☐ Không đồng ý chia sẻ → skin_snapshot_json là NULL (DB thực thi)
☐ Xóa lịch sử → dữ liệu thật mất khỏi DB
☐ 6 chỉ số đo lường ghi nhận đúng
```

---

## ▸ L5 — Chuyển sang Zalo ⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 12 | P7 | `WG-P7-05` | L2, L3 |

🎯 **MỤC TIÊU** — Chuyển hội thoại sang chuyên viên qua Zalo, **mang theo ngữ cảnh**, với **đồng ý rõ ràng từng mục**.

🤖 **PROMPT**

```text
Hiện thực chuyển Zalo (FR-AI-15…18).

ĐỌC TRƯỚC: docs/_requirements/M12.md · docs/domain-rules.md BR-AI-25…30
          · docs/adr/ADR-006-zalo-deeplink-handoff.md
          · BRD §13.7 (đồng ý chuyển dữ liệu cho bên thứ ba)
          · Prototype expert-consult.html — khối #handoffCard với mã BA-7F3K

CƠ CHẾ (theo ADR-006):
  Deep link Zalo + MÃ PHIÊN ngắn, không dùng ZNS hay Follow-Up API.
  Lý do chọn: ZNS cần phê duyệt mẫu tin và hợp đồng doanh nghiệp;
  Follow-Up cần người dùng đã theo dõi OA. Deep link + mã phiên
  hoạt động ngay, không phụ thuộc phê duyệt. (xem ADR-006 đầy đủ)

MÃ PHIÊN:
  Dạng BA-XXXX, dùng Crockford Base32 (bỏ các ký tự dễ nhầm: I, L, O, U)
  Vd: BA-7F3K
  ⚠️ Vì sao Crockford Base32: mã này được người dùng ĐỌC và CHUYÊN VIÊN
     NHẬP LẠI. Bỏ I/L/O/U loại bỏ nhầm lẫn 0↔O và 1↔I↔L.
  Hết hạn 24 giờ · dùng một lần · không đoán được từ mã trước

ĐỒNG Ý TỪNG MỤC (BR-AI-27) — quan trọng nhất của task này:
  Trước khi tạo mã, hiện bản XEM TRƯỚC chính xác những gì sẽ chuyển,
  với checkbox RIÊNG cho từng mục:

    ☐ Nội dung hội thoại (5 tin nhắn gần nhất)      [xem trước]
    ☐ Hồ sơ da (loại da hỗn hợp, mụn, nhạy cảm vừa) [xem trước]
    ☐ Sản phẩm đang xem / trong giỏ                  [xem trước]

  ⚠️ MỖI mục một checkbox, MẶC ĐỊNH TẤT CẢ TẮT.
  ⚠️ Mỗi mục có nút "xem trước" hiện ĐÚNG nội dung sẽ chuyển —
     không phải mô tả chung chung.
  ⚠️ Không tích gì → vẫn chuyển được, nhưng chuyên viên không có
     ngữ cảnh. Nói rõ điều đó: "Chuyên viên sẽ cần hỏi lại từ đầu."

  ⛔ KHÔNG chuyển bất kỳ mục nào mà người dùng không tích.
  ⛔ KHÔNG dùng một checkbox chung cho cả ba mục.
     Lý do: người dùng có thể muốn chia sẻ hội thoại nhưng không muốn
     chia sẻ hồ sơ da. Gộp lại là tước đi lựa chọn đó.

LUỒNG:
  1. Hiện bản xem trước + 3 checkbox
  2. Người dùng tích các mục muốn chuyển → nhấn "Tạo mã"
  3. Hệ thống tạo handoff_request với CHỈ các mục đã tích
  4. Hiện thẻ: mã BA-7F3K · hướng dẫn · nút mở Zalo
  5. Nút mở Zalo → deep link tới OA (URL từ system_settings)
  6. Người dùng gửi mã cho chuyên viên trong Zalo
  7. Chuyên viên nhập mã ở trang admin (nhóm M) → xem ngữ cảnh

HIỂN THỊ CHO CHUYÊN VIÊN (trang admin, nhóm M làm phần UI):
  Chỉ hiện các mục người dùng đã đồng ý.
  Mục không được đồng ý → hiện "Người dùng chưa chia sẻ phần này".
  ⚠️ KHÔNG hiện thông tin định danh của người dùng trừ khi họ
     đã đồng ý chia sẻ hội thoại có chứa nó.

KHI NÀO ĐỀ XUẤT CHUYỂN ZALO:
  • Chủ đề y tế nhóm 1–4 (KHÔNG phải nhóm 5)
  • Gemini không trả lời được / GroundingValidator loại hết
  • Người dùng hỏi về đơn hàng cụ thể cần tra cứu
  • Người dùng yêu cầu gặp người thật
  • Hết quota và câu hỏi không khớp tầng luật

TUYỆT ĐỐI KHÔNG:
- Dùng một checkbox chung cho nhiều mục dữ liệu
- Để checkbox mặc định bật
- Chuyển mục chưa được tích
- Hiện mô tả chung thay vì nội dung thật ở bản xem trước
- Đề xuất Zalo cho tình trạng cấp tính (nhóm 5)
- Viết cứng URL của Zalo OA
- Dùng ký tự dễ nhầm trong mã phiên
```

✅ **XONG KHI**

```text
☐ Mã dạng BA-XXXX, không chứa I/L/O/U, hết hạn 24h, dùng một lần
☐ 3 checkbox RIÊNG, mặc định TẤT CẢ TẮT              ← bắt buộc
☐ Mỗi mục có xem trước hiện nội dung THẬT
☐ Tích 1 mục → chỉ mục đó được chuyển (kiểm trong DB)  ← bắt buộc
☐ Không tích gì → vẫn chuyển được, có thông báo rõ
☐ Nhóm 5 (cấp tính) KHÔNG hiện lựa chọn Zalo
☐ URL Zalo OA đọc từ system_settings
☐ Trang chuyên viên chỉ hiện mục đã đồng ý
```

---

## ▸ L6 — Bật E2E-04, E2E-05 & đo chất lượng AI

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 10 | P7 | `WG-P7-06` | L1–L5 |

🎯 **MỤC TIÊU** — Luồng AI chạy đầu-cuối và có **bộ test chất lượng chạy trong CI**.

🤖 **PROMPT**

```text
Bật E2E-04, E2E-05 và xây bộ đánh giá chất lượng AI.

ĐỌC TRƯỚC: BRD §14 E2E-04, E2E-05 · docs/llm-policy.md §9.5 (đánh giá)

PHẦN 1 — E2E-04 (trợ lý AI 3 tầng), 3 thiết bị:
  Hỏi câu thường gặp → trả lời từ tầng luật, nhanh
  → Hỏi câu cần LLM → trả lời có tên sản phẩm THẬT từ danh mục
  → Hỏi câu y tế → bị chặn, hiện lựa chọn
  → Dùng hết quota → tầng luật vẫn hoạt động

PHẦN 2 — E2E-05 (chuyển Zalo), 3 thiết bị:
  Hỏi câu y tế → thấy đề xuất chuyển Zalo
  → mở bản xem trước → tích 2/3 mục → tạo mã
  → thấy mã BA-XXXX → admin nhập mã → thấy ĐÚNG 2 mục đã tích,
    mục thứ ba hiện "chưa chia sẻ"

PHẦN 3 — Bộ đánh giá chất lượng AI (tests/BeautyAI.AiEvalTests):
  Tệp JSON chứa ≥ 60 câu hỏi với kết quả kỳ vọng:
    20 câu phải do tầng luật trả lời (kỳ vọng: tier = RULE)
    15 câu phải bị chặn            (kỳ vọng: tier = BLOCKED, đúng nhóm)
    15 câu đi tới LLM              (kỳ vọng: tier = LLM, mọi tên sản phẩm
                                     có trong danh mục)
    10 câu phải dẫn tới đề xuất Zalo

  Với các câu đi tới LLM, kiểm:
    ✓ 0 tên sản phẩm bịa (GroundingValidator không loại gì)
    ✓ 0 từ vi phạm quảng cáo
    ✓ 0 persona bác sĩ/chuyên gia
    ✓ Có từ chối trách nhiệm khi nói về công năng

  ⚠️ Bộ này dùng Gemini THẬT, nên:
     - Chạy theo yêu cầu (workflow_dispatch) và theo lịch tuần,
       KHÔNG chạy mỗi lần push (tốn tiền và chậm)
     - Có chế độ dùng bản ghi phản hồi (fixture) để chạy offline trong CI
     - Báo cáo dạng bảng: bao nhiêu câu đạt/không đạt theo từng tiêu chí

PHẦN 4 — Trang theo dõi (chuẩn bị cho nhóm M):
  Endpoint trả 6 chỉ số của L4 theo ngày, để nhóm M dựng biểu đồ.
```

✅ **XONG KHI**

```text
☐ E2E-04 PASS trên 3 thiết bị
☐ E2E-05 PASS trên 3 thiết bị, đồng ý từng mục hoạt động đúng
☐ Bộ đánh giá ≥ 60 câu, có chế độ offline dùng fixture
☐ 0 tên sản phẩm bịa trong toàn bộ bộ đánh giá     ← bắt buộc
☐ 0 từ vi phạm quảng cáo trong toàn bộ bộ đánh giá  ← bắt buộc
☐ 0 persona bác sĩ/chuyên gia
☐ Job CI chạy bộ đánh giá offline mỗi lần push, bản thật theo lịch tuần
☐ Ảnh chụp trạng thái: docs/_states/state_<YYYY-MM-DD>_phase-7-xong.md
```

🔍 **KIỂM CHỨNG**

```bash
dotnet test tests/BeautyAI.AiEvalTests -- --mode=fixture
npx playwright test e2e/E2E-04-ai-assistant.spec.ts e2e/E2E-05-zalo-handoff.spec.ts
```

> 🎉 **MỐC: Kết thúc Phase 7, trợ lý AI hoạt động — và nó hoạt động TRONG RÀNG BUỘC.** Điều đáng chú ý không phải là nó trả lời được, mà là nó **không trả lời** những gì nó không nên trả lời.

---

# PHẦN 13 — NHÓM M: QUẢN TRỊ · ĐÁNH GIÁ · HỖ TRỢ

| | |
|---|---|
| **Phase** | P8 · `WG-P8-01`→`06` |
| **Giờ** | 72 (18 ngày) |
| **Kết quả** | Trang quản trị · kiểm duyệt đánh giá · trung tâm hỗ trợ · **công cụ mở rộng từ điển** |
| **Đặc điểm** | ⭐ Nhóm làm cho hệ thống **vận hành được mà không cần bạn can thiệp vào DB** |

> 💡 **Mục tiêu thật của nhóm này:** sau Phase 8, bạn (hoặc người khác) có thể vận hành BeautyAI **chỉ bằng giao diện** — thêm sản phẩm, xử lý đơn, duyệt đánh giá, mở rộng từ điển thành phần, xem chỉ số AI. Không cần mở `psql`. Đó là khác biệt giữa một bản demo và một hệ thống dùng được.

---

## ▸ M1 — Quản trị sản phẩm & danh mục

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 14 | P8 | `WG-P8-01` | D2, D4, F1 |

🎯 **MỤC TIÊU** — CRUD sản phẩm · thương hiệu · danh mục · tồn kho, với **kiểm tra tuân thủ ngôn từ ở đầu vào**.

🤖 **PROMPT**

```text
Hiện thực quản trị sản phẩm (FR-ADM-01…05).

ĐỌC TRƯỚC: docs/_requirements/M13.md — FR-ADM-01…05
          · docs/domain-rules.md BR-ADM-01…08
          · Prototype admin*.html

CRUD sản phẩm:
  Tạo · sửa · đổi trạng thái bán (DANG_BAN / THAM_KHAO / NGUNG_BAN / NHAP)
  · cập nhật tồn kho · tải ảnh · gán thành phần
  ⛔ KHÔNG xóa cứng sản phẩm. Chỉ đổi trạng thái NGUNG_BAN.
     Lý do: sản phẩm bị xóa sẽ phá liên kết của đơn hàng cũ.
     (Bản chụp đơn hàng ở INV-09 bảo vệ nội dung, nhưng liên kết
      tham chiếu vẫn nên giữ.)

KIỂM TRA TUÂN THỦ NGÔN TỪ Ở ĐẦU VÀO (BR-ADM-03) — bắt buộc:
  Khi admin nhập mô tả sản phẩm, quét tìm từ vi phạm quảng cáo
  (cùng danh sách và cùng dịch vụ với AdvertisingComplianceFilter của L3
   — KHÔNG viết lại danh sách riêng).

  Phát hiện →
    - CHẶN lưu nếu là từ chặn cứng (điều trị, chữa, đặc trị...)
    - CẢNH BÁO cho phép lưu nếu là từ cần xem xét
    - Gợi ý từ thay thế tuân thủ
  Hiện rõ từ nào vi phạm, ở vị trí nào trong văn bản.

  ⚠️ Vì sao chặn ở đầu vào dù đã có lọc ở đầu ra của AI:
     mô tả sản phẩm do admin nhập hiện TRỰC TIẾP trên trang, không
     đi qua đường ống AI. Nó cần bộ lọc riêng ở điểm nhập.

Tải ảnh:
  Chuyển WebP · resize max 800px · lưu cục bộ
  Kiểm tra: định dạng thật (đọc magic bytes, KHÔNG tin phần mở rộng)
  · kích thước ≤ 5MB · không phải tệp thực thi đổi tên
  ⚠️ Tin phần mở rộng tệp là lỗ hổng tải tệp phổ biến nhất.

Nhập/xuất hàng loạt:
  Xuất CSV danh sách sản phẩm · nhập CSV cập nhật tồn kho và giá
  ⚠️ Nhập CSV phải: xem trước thay đổi TRƯỚC khi áp dụng
                  · chạy trong giao dịch
                  · báo cáo dòng nào lỗi và vì sao
                  · KHÔNG áp dụng một phần

Kiểm tra quyền: mọi endpoint có policy AdminOnly (từ D2).
Ghi audit log: mọi thao tác (từ D4).

TUYỆT ĐỐI KHÔNG:
- Xóa cứng sản phẩm
- Cho lưu mô tả có từ chặn cứng
- Viết lại danh sách từ vi phạm (dùng dịch vụ chung với L3)
- Tin phần mở rộng tệp khi tải ảnh
- Áp dụng nhập CSV một phần
```

✅ **XONG KHI**

```text
☐ CRUD sản phẩm hoạt động, không có xóa cứng
☐ Nhập mô tả có "điều trị mụn" → BỊ CHẶN, chỉ rõ từ vi phạm  ← bắt buộc
☐ Dùng CÙNG dịch vụ lọc với L3 (test: sửa danh sách → cả hai nơi đổi)
☐ Tải tệp .exe đổi tên thành .jpg → BỊ TỪ CHỐI              ← bắt buộc
☐ Nhập CSV có 1 dòng lỗi → KHÔNG áp dụng gì, báo rõ dòng lỗi
☐ Mọi thao tác có audit log
☐ Tài khoản thường gọi endpoint admin → 403
```

---

## ▸ M2 — Quản trị đơn hàng & người dùng

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 12 | P8 | `WG-P8-02` | K2, M1 |

🎯 **MỤC TIÊU** — Xử lý đơn hàng · quản lý người dùng, với **ranh giới quyền riêng tư rõ ràng**.

🤖 **PROMPT**

```text
Hiện thực quản trị đơn hàng và người dùng (FR-ADM-06…09).

ĐỌC TRƯỚC: docs/_requirements/M13.md · docs/domain-rules.md BR-ADM-09…14
          · docs/security-policy.md §11.6 (nguyên tắc tối thiểu cần biết)

ĐƠN HÀNG:
  Danh sách có lọc (trạng thái · khoảng ngày · mã đơn · điện thoại)
  Chi tiết đơn · đổi trạng thái (qua máy trạng thái của K2, không gán trực tiếp)
  · lý do hủy bắt buộc · in phiếu giao hàng
  Xuất CSV theo khoảng ngày (dùng ClosedXML cho .xlsx nếu cần)

NGƯỜI DÙNG:
  Danh sách · tìm theo email/điện thoại · xem đơn hàng của một người
  · vô hiệu hóa tài khoản (không xóa)

  ⚠️⚠️ INV-07 — ADMIN KHÔNG CÓ ĐƯỜNG NÀO ĐỌC HỒ SƠ DA CỦA KHÁCH
  (bất biến, `Technical_Design` §4.4 · `BR-SEC-03` · `NFR-PRIV-08`
   · kiểm thử `E2E-08`):
  ⛔ Admin KHÔNG được xem:
     - Hồ sơ da chi tiết của người dùng
     - Nội dung lịch sử chat
     - Nhật ký da và ảnh da

  Lý do: đây là dữ liệu sức khỏe. Nguyên tắc tối thiểu cần biết:
  admin cần xử lý ĐƠN HÀNG, không cần biết tình trạng da của khách.
  Chỉ ngoại lệ: chuyên viên xem ngữ cảnh chuyển Zalo (L5) —
  và chỉ các mục người dùng đã TÍCH ĐỒNG Ý.

  Admin ĐƯỢC xem: tên · email · điện thoại · địa chỉ giao hàng
                 · lịch sử đơn hàng · ngày tạo tài khoản
  (những dữ liệu cần để xử lý đơn)

  ⚠️ Viết TEST cho điều này: endpoint admin KHÔNG trả về trường
     skin_profile, chat_messages, skin_journal.

ĐẶT LẠI MẬT KHẨU BỞI ADMIN:
  ⛔ Admin KHÔNG xem được mật khẩu (không thể — đã băm một chiều)
  ⛔ Admin KHÔNG đặt mật khẩu mới trực tiếp cho người dùng
  ✅ Admin tạo được một mã đặt lại một lần, hết hạn 1 giờ, gửi cho
     người dùng qua kênh ngoài; người dùng tự đặt mật khẩu mới
  Lý do: admin đặt mật khẩu trực tiếp nghĩa là admin biết mật khẩu
  của người dùng — phá vỡ nguyên tắc chỉ chủ tài khoản biết mật khẩu.

TUYỆT ĐỐI KHÔNG:
- Cho admin xem hồ sơ da, lịch sử chat, hay nhật ký da
- Cho admin đặt mật khẩu trực tiếp
- Xóa tài khoản người dùng (chỉ vô hiệu hóa)
- Gán trực tiếp trạng thái đơn hàng
```

✅ **XONG KHI**

```text
☐ Test: endpoint admin KHÔNG trả skin_profile/chat_messages/skin_journal (INV-07)
  ← bắt buộc
☐ Đổi trạng thái đơn đi qua máy trạng thái (trạng thái sai → từ chối)
☐ Hủy đơn bắt buộc lý do · tồn kho hoàn đúng
☐ Admin không có cách nào đặt mật khẩu trực tiếp
☐ Vô hiệu hóa tài khoản → không đăng nhập được, dữ liệu còn
☐ Xuất CSV/XLSX đơn hàng hoạt động
```

---

## ▸ M3 — Mở rộng từ điển thành phần ⭐🔁

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 12 | P8 | `WG-P8-03` | M1, C3 |

🎯 **MỤC TIÊU** — Công cụ biến việc mở rộng từ điển từ **việc không bao giờ xong** thành **việc có ưu tiên rõ ràng**.

> ⭐ **Đây là task giải quyết `RISK-06` về dài hạn.** Sau C3 bạn có 200 thành phần. Còn khoảng 5.000 thành phần chưa có. Nhìn vào con số đó thì công việc trông vô vọng. Công cụ này đổi câu hỏi từ *"còn 5.000 thành phần"* thành *"20 thành phần tiếp theo này sẽ tăng tỷ lệ phủ thêm 4%"* — một việc làm được trong một buổi.

🤖 **PROMPT**

```text
Hiện thực công cụ quản trị thành phần (FR-ADM-04).

ĐỌC TRƯỚC: docs/_requirements/M13.md FR-ADM-04 (TOÀN BỘ điều kiện chấp nhận)
          · docs/domain-rules.md BR-ING-01…07

MÀN HÌNH CHÍNH — "Thành phần chưa đánh giá":
  Bảng gồm các cột:
    tên INCI · số sản phẩm chứa nó · tỷ lệ % danh mục bị ảnh hưởng
    · trạng thái CosIng · đã có bản nháp AI chưa

  Sắp xếp MẶC ĐỊNH theo "số sản phẩm chứa nó" GIẢM DẦN.
  ⚠️ Đây là điểm cốt lõi của task. Thứ tự này cho biết nên làm gì TIẾP,
     thay vì để bạn chọn ngẫu nhiên trong 5.000 mục.

  Hiện ở đầu trang:
    "Tỷ lệ phủ hiện tại: 73%. Đánh giá 20 thành phần đầu danh sách này
     sẽ tăng lên khoảng 77%."
  ⚠️ Con số dự báo này tính thật từ dữ liệu, không ước lượng.

MÀN HÌNH BIÊN TẬP MỘT THÀNH PHẦN:
  Trái : dữ liệu CosIng (chỉ đọc) · danh sách sản phẩm chứa nó
  Phải : form điền tên tiếng Việt · chức năng · diễn giải
         · comedogenic (để trống được) · tên đồng nghĩa

  Nút "Sinh bản nháp" → gọi Gemini sinh diễn giải nháp
  ⚠️ Bản nháp AI KHÔNG tự động đặt is_reviewed = true.
     Nó điền vào form để BẠN sửa và xác nhận. (BR-ING-05)
     Nút "Lưu và đánh dấu đã rà soát" là hành động RIÊNG, do người nhấn.

  Kiểm tra ngôn từ khi lưu: dùng CÙNG dịch vụ của L3/M1.
  Phát hiện từ vi phạm → chặn lưu, chỉ rõ từ.

QUẢN LÝ TÊN ĐỒNG NGHĨA:
  Thêm/bớt cặp đồng nghĩa · xem thành phần nào được hưởng lợi
  ⚠️ Thêm một cặp đồng nghĩa có thể tăng tỷ lệ phủ nhiều hơn
     biên soạn 10 thành phần mới. Hiện dự báo tác động cho từng cặp.

QUẢN LÝ NHÓM HOẠT CHẤT & QUY TẮC XUNG ĐỘT:
  Xem/sửa 15 nhóm hoạt chất
  Xem/sửa 12 quy tắc xung đột
  ⚠️ Form sửa quy tắc xung đột PHẢI:
     - Bắt buộc có source_url (không để trống)
     - Bắt buộc có remediation (không để trống)
     - CHẶN chọn mức CAO khi cấp bằng chứng là B hoặc C  (INV-03)
       → vô hiệu lựa chọn "CAO" trong dropdown, có giải thích
     - Cảnh báo nếu tạo cặp thứ hai ở mức CAO
  (DB cũng chặn qua ck_cr_tier_severity — hai lớp)

CHẠY LẠI BÓC TÁCH INCI:
  Nút "Bóc tách lại toàn bộ danh mục" (chạy nền, hiện tiến độ)
  → sau khi thêm thành phần mới, chạy lại để cập nhật liên kết
  Hiện kết quả: tỷ lệ phủ trước → sau

TUYỆT ĐỐI KHÔNG:
- Tự động đặt is_reviewed = true cho bản nháp AI
- Cho lưu quy tắc xung đột không có nguồn hoặc không có phương án xử lý
- Cho chọn mức CAO với cấp bằng chứng B/C
- Sắp xếp danh sách chưa đánh giá theo thứ tự khác (phải theo tác động)
- Viết lại dịch vụ kiểm tra ngôn từ
```

✅ **XONG KHI**

```text
☐ Danh sách chưa đánh giá sắp theo số sản phẩm chứa nó, giảm dần
☐ Dự báo tỷ lệ phủ hiện đúng (so với tính tay trên 20 mục đầu)
☐ Bản nháp AI KHÔNG tự đánh dấu đã rà soát                 ← bắt buộc
☐ Form quy tắc xung đột: KHÔNG chọn được CAO với cấp B/C    ← bắt buộc
☐ Form quy tắc xung đột: bắt buộc nguồn và phương án xử lý
☐ Lưu diễn giải có từ vi phạm → bị chặn
☐ Thêm cặp đồng nghĩa → hiện dự báo tác động
☐ Chạy lại bóc tách → tỷ lệ phủ cập nhật, hiện trước/sau
```

---

## ▸ M4 — Kiểm duyệt đánh giá

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 12 | P8 | `WG-P8-04` | G4, M1 |

🎯 **MỤC TIÊU** — Người dùng viết đánh giá · admin duyệt, với **kiểm tra ngôn từ y tế trong đánh giá**.

🤖 **PROMPT**

```text
Hiện thực đánh giá và kiểm duyệt (FR-REV-01…06).

ĐỌC TRƯỚC: docs/_requirements/M14.md · docs/domain-rules.md BR-REV-01…10
          · BRD §13.4 (nội dung do người dùng tạo)

NGƯỜI DÙNG VIẾT ĐÁNH GIÁ:
  Chỉ người ĐÃ MUA sản phẩm (có đơn ở trạng thái DA_GIAO) mới đánh giá được
  ⚠️ Mỗi người một đánh giá mỗi sản phẩm (sửa được, không thêm mới)
  Nội dung: điểm 1–5 · tiêu đề · nội dung · ảnh (tùy chọn)
           · loại da (tự điền từ hồ sơ, sửa được)

  Trạng thái ban đầu: CHO_DUYET (BR-REV-06) — không hiện ngay

KIỂM TRA TỰ ĐỘNG KHI GỬI:
  1. Ngôn từ quảng cáo vi phạm (dùng dịch vụ chung)
     → cảnh báo người viết, cho sửa
  2. ⚠️ TUYÊN BỐ Y TẾ trong đánh giá:
     Phát hiện câu kiểu "sản phẩm này chữa khỏi vảy nến cho tôi"
     → KHÔNG chặn người dùng viết (đó là trải nghiệm của họ)
     → nhưng GẮN CỜ cho admin xem xét
     → nếu duyệt, hiện kèm ghi chú:
       "Đây là trải nghiệm cá nhân của người dùng, không phải tuyên bố
        của BeautyAI về công năng sản phẩm."

     ⚠️ Vì sao xử lý thế này: chặn hoàn toàn là kiểm duyệt trải nghiệm
        thật của người dùng; hiện không ghi chú là để một tuyên bố y tế
        xuất hiện trên trang bán hàng. Gắn cờ + ghi chú là đường giữa.
  3. Spam: liên kết ngoài · số điện thoại · trùng lặp nội dung
     → tự động từ chối

ADMIN KIỂM DUYỆT:
  Danh sách CHO_DUYET · xem nội dung · duyệt / từ chối (có lý do)
  · các đánh giá bị gắn cờ hiện RIÊNG, ở đầu danh sách
  Duyệt hàng loạt cho đánh giá không bị gắn cờ
  ⚠️ Đánh giá bị gắn cờ KHÔNG duyệt hàng loạt được — phải xem từng cái.

HỮU ÍCH / KHÔNG HỮU ÍCH:
  Người dùng đánh dấu · dùng để sắp xếp
  Một người một phiếu mỗi đánh giá

HIỂN THỊ (nối với G4):
  Chỉ hiện DA_DUYET · nhóm theo loại da · cảnh báo nghịch chiều
  Sắp xếp: hữu ích nhất · mới nhất · điểm cao · điểm thấp

TUYỆT ĐỐI KHÔNG:
- Cho đánh giá khi chưa mua
- Hiện đánh giá CHO_DUYET
- Chặn người dùng viết về trải nghiệm y tế của họ
- Hiện đánh giá có tuyên bố y tế mà không có ghi chú
- Cho duyệt hàng loạt đánh giá bị gắn cờ
```

✅ **XONG KHI**

```text
☐ Chưa mua → không viết được đánh giá
☐ Đánh giá mới ở CHO_DUYET, không hiện công khai
☐ Đánh giá có tuyên bố y tế → gắn cờ, hiện riêng cho admin   ← bắt buộc
☐ Duyệt đánh giá gắn cờ → hiện kèm ghi chú trải nghiệm cá nhân
☐ Đánh giá gắn cờ KHÔNG duyệt hàng loạt được
☐ Spam (có liên kết ngoài) tự động từ chối
☐ E2E-07 PASS
```

---

## ▸ M5 — Trung tâm hỗ trợ & trang theo dõi AI

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 12 | P8 | `WG-P8-05` | L6, M2 |

🎯 **MỤC TIÊU** — Trung tâm hỗ trợ · trang chuyên viên nhập mã Zalo · **trang theo dõi chất lượng AI**.

🤖 **PROMPT**

```text
Hiện thực trung tâm hỗ trợ và trang theo dõi AI (FR-SUP-01…05).

ĐỌC TRƯỚC: docs/_requirements/M14.md · Prototype support.html (đã cập nhật V1.0)

PHẦN 1 — Trung tâm hỗ trợ (người dùng):
  Câu hỏi thường gặp, nhóm theo chủ đề, tìm kiếm được
  ⚠️ Nội dung FAQ lấy từ bảng ai_intent_rules (L1) — KHÔNG viết lại.
     Lý do: nếu viết hai nơi, chúng sẽ trôi khỏi nhau, và người dùng
     sẽ nhận hai câu trả lời khác nhau cho cùng câu hỏi.

  ⚠️ FAQ phải có mục giải thích VÌ SAO BeautyAI không chấm điểm an toàn
     (đã có ở prototype support.html V1.0 — giữ nguyên nội dung đó).
     Đây là nơi lập trường của sản phẩm được giải thích đầy đủ.

  Form liên hệ: chủ đề · nội dung · đính kèm (tùy chọn)
  → tạo ticket, hiện mã ticket để tra cứu

PHẦN 2 — Trang chuyên viên (nhập mã Zalo):
  Ô nhập mã BA-XXXX → hiện ngữ cảnh người dùng đã đồng ý chia sẻ (L5)
  Mục không được đồng ý → "Người dùng chưa chia sẻ phần này"
  ⚠️ Mã dùng một lần. Nhập lại mã đã dùng → báo đã sử dụng.
  ⚠️ Ghi audit log mỗi lần xem ngữ cảnh (ai xem, khi nào, mã nào).

PHẦN 3 — Trang theo dõi chất lượng AI (quan trọng):
  Biểu đồ theo ngày (Recharts), 6 chỉ số từ L4:
    lượt tầng luật · lượt LLM · lượt bị chặn
    · lượt chuyển Zalo
    · lượt bị GroundingValidator loại     ← chỉ số chất lượng
    · lượt bị ComplianceFilter lọc        ← chỉ số chất lượng

  + bảng: 20 chủ đề bị chặn nhiều nhất (theo NHÓM, không nội dung)
  + bảng: 20 câu hỏi không khớp luật nào và phải gọi LLM
    ⚠️ Bảng này là danh sách việc cần làm: mỗi câu trong đó là một
       luật định trước nên viết. Viết luật cho 10 câu hàng đầu sẽ
       giảm chi phí LLM đáng kể.
  + chi phí LLM ước tính theo ngày

  ⚠️ Hai chỉ số "bị loại" tăng = dấu hiệu prompt hoặc công cụ tra cứu
     có vấn đề. Đặt ngưỡng cảnh báo: > 5% lượt LLM bị loại → hiện
     banner cảnh báo trên trang.

PHẦN 4 — Trang sức khỏe hệ thống:
  Trạng thái DB · trạng thái Gemini (circuit breaker mở/đóng)
  · ngưỡng chất lượng dữ liệu hiện tại (DQ-01…DQ-08)
  · số sản phẩm theo lớp · tỷ lệ phủ INCI hiện tại

TUYỆT ĐỐI KHÔNG:
- Viết lại nội dung FAQ (phải lấy từ ai_intent_rules)
- Bỏ mục giải thích vì sao không có điểm an toàn
- Cho mã Zalo dùng nhiều lần
- Hiện nội dung câu hỏi y tế trong trang theo dõi (chỉ hiện nhóm)
```

✅ **XONG KHI**

```text
☐ FAQ lấy từ ai_intent_rules (sửa luật → FAQ đổi theo)
☐ FAQ có mục giải thích vì sao không chấm điểm an toàn
☐ Mã Zalo dùng một lần · có audit log mỗi lần xem
☐ Trang theo dõi hiện đủ 6 chỉ số
☐ Bảng "câu hỏi phải gọi LLM" hiện đúng — dùng được để viết luật mới
☐ Tỷ lệ bị loại > 5% → hiện banner cảnh báo
☐ Trang sức khỏe hiện ngưỡng DQ hiện tại
```

---

## ▸ M6 — Bật E2E-06, E2E-07, E2E-08

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 10 | P8 | `WG-P8-06` | M1–M5 |

🎯 **MỤC TIÊU** — Ba luồng E2E cuối, gồm **luồng quyền dữ liệu cá nhân**.

🤖 **PROMPT**

```text
Bật E2E-06, E2E-07, E2E-08.

ĐỌC TRƯỚC: BRD §14 (3 luồng này) · BRD §13.3 (quyền chủ thể dữ liệu)

E2E-06 — Admin quản lý sản phẩm:
  Đăng nhập admin → tạo sản phẩm mới → nhập mô tả có "điều trị"
  → BỊ CHẶN → sửa lại → lưu được → gán thành phần
  → đặt DANG_BAN → thấy sản phẩm ở trang danh mục công khai
  → kiểm audit log có bản ghi

E2E-07 — Đánh giá có kiểm duyệt:
  Người dùng có đơn DA_GIAO → viết đánh giá → thấy "đang chờ duyệt"
  → không hiện công khai
  → admin duyệt → hiện công khai
  → viết đánh giá có tuyên bố y tế → bị gắn cờ
  → admin thấy ở danh sách riêng → duyệt → hiện kèm ghi chú

E2E-08 — Quyền dữ liệu cá nhân (quan trọng nhất của ba luồng):
  Tạo tài khoản → làm quiz hồ sơ da → bật chia sẻ AI
  → chat với trợ lý → đặt một đơn hàng
  → xuất dữ liệu cá nhân → kiểm tra JSON có đủ 6 loại dữ liệu
  → tắt chia sẻ AI → chat lại → kiểm tra log: KHÔNG gửi hồ sơ da
  → xóa hồ sơ da → kiểm tra: hồ sơ mất, tài khoản còn, đơn hàng còn
  → xóa lịch sử chat → kiểm tra DB: thật mất

  ⚠️ Luồng này kiểm chứng các cam kết về quyền riêng tư là THẬT,
     không chỉ là văn bản trong chính sách. Nó phải chạy trong CI.

Chạy cả ba trên 3 thiết bị.
```

✅ **XONG KHI**

```text
☐ E2E-06, E2E-07, E2E-08 PASS trên 3 thiết bị
☐ Tổng 8/8 luồng E2E PASS (không còn test.skip nào)
☐ E2E-08 xác nhận: tắt chia sẻ → KHÔNG gửi hồ sơ (kiểm trong log)
☐ E2E-08 xác nhận: xóa dữ liệu là xóa thật trong DB
☐ Coverage backend ≥ 70/60 · frontend ≥ 70/60
☐ Ảnh chụp trạng thái: docs/_states/state_<YYYY-MM-DD>_phase-8-xong.md
```

🔍 **KIỂM CHỨNG**

```bash
npx playwright test                       # cả 8 luồng
grep -rn 'test.skip' e2e/ && echo "⚠️ CÒN TEST BỊ SKIP" || echo "✓ Không còn skip"
./syntheprise gate
```

---
# PHẦN 14 — NHÓM N: KIỂM THỬ TOÀN DIỆN & DEMO

| | |
|---|---|
| **Phase** | P9 · `WG-P9-01`→`05` |
| **Giờ** | 36 (9 ngày) |
| **Kết quả** | Hệ thống đã kiểm thử toàn diện · tài liệu bàn giao · demo chạy được |
| **Đặc điểm** | ⭐ Nhóm **xác nhận 12 bất biến** một lần cuối, và **không được rút ngắn** |

> ⚠️ **Đây là nhóm dễ bị cắt nhất và không nên cắt.**
> Khi tới Phase 9, bạn đã làm 8 phase và muốn xong. Nhưng nhóm N là nơi phát hiện những thứ chỉ xuất hiện khi toàn hệ thống chạy cùng nhau — và nếu phát hiện sau demo thì đã muộn. Mục §13 của `Plan_BeautyAI_V1.0.md` có thang giảm phạm vi 10 bước; **nhóm N nằm trong vùng "không bao giờ cắt"**.

---

## ▸ N1 — Rà soát 12 bất biến ⭐⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 8 | P9 | `WG-P9-01` | M6 |

🎯 **MỤC TIÊU** — Xác nhận **từng bất biến một**, bằng **kiểm chứng máy thực thi được**, không bằng việc đọc code.

🤖 **PROMPT**

```text
Rà soát toàn diện 12 bất biến của hệ thống.

ĐỌC TRƯỚC: BRD §17.1 (bảng 12 bất biến) · docs/traceability.md
          · toàn bộ tests/BeautyAI.ArchitectureTests

Với MỖI bất biến, làm ba việc:
  1. Chạy kiểm chứng tự động (script hoặc test)
  2. Xác nhận kết quả đúng
  3. Nếu CHƯA có kiểm chứng tự động → VIẾT NÓ NGAY

BẢNG KIỂM CHỨNG — chạy từng dòng:

INV-01 · Không chấm điểm an toàn
  → Test kiến trúc Bài 5 (B4)
  → Grep DB: không cột nào chứa safety/hazard/suitability
  → Grep frontend: không chuỗi hiển thị nào mang nghĩa an toàn
  → Xác nhận Điểm Phù Hợp cho 2 hồ sơ khác nhau ra 2 số khác nhau

INV-02 · Giảm tồn kho nguyên tử
  → Test đồng thời K4 kịch bản A
  → Query DB: không sản phẩm nào có stock_quantity < 0
  → Grep: không mẫu đọc-rồi-ghi nào

INV-03 · Phân cấp bằng chứng
  → Query: không quy tắc nào (tier B|C, severity CAO)
  → Test service từ chối tạo vi phạm
  → Form admin không chọn được CAO với tier B/C

INV-04 · Ẩn danh hóa bắt buộc trước khi gửi tới LLM          (GC-17)
  → Test kiểu: provider chỉ nhận SafeLlmContext
  → Test reflection: SafeLlmContext không có trường định danh
  → E2E-08: tắt chia sẻ → log không có hồ sơ da

INV-05 · Mã sản phẩm LLM bịa không ra tới giao diện          (GC-15)
  → Test giả lập LLM bịa tên → câu bị loại
  → Bộ đánh giá AI: 0 tên bịa trong 60 câu

INV-06 · Từ ngữ gây hiểu nhầm là thuốc không ra giao diện    (GC-16)
  → Test giả lập LLM trả câu vi phạm → bị lọc
  → Test nhập mô tả admin có từ chặn cứng → bị chặn
  → Xác nhận CÙNG một dịch vụ dùng ở L3 và M1

INV-07 · Admin không có đường nào đọc hồ sơ da               (E2E-08)
  → Test: endpoint admin không trả skin_profile / chat_messages
         / skin_journal
  → Rà soát swagger: không endpoint nào lộ các trường đó

INV-08 · Mật khẩu không bao giờ ở dạng rõ                    (DC-19)
  → Query DB: password_hash bắt đầu bằng AQAAAA (PBKDF2 v3)
  → Grep log thật sau E2E: 0 lần mật khẩu rõ
  → Rà soát DTO: không DTO nào trả trường mật khẩu

INV-09 · Đơn hàng bất biến trước thay đổi nguồn              (E2E-07)
  → Test: đổi tên+giá sản phẩm → đơn cũ hiện dữ liệu cũ
  → Query: order_items có đủ cột bản chụp

INV-10 · Quiz tất định                                       (GC-02)
  → Chạy cùng đầu vào 20 lần → 20 kết quả giống hệt
  → Grep: 0 lần Random / Guid.NewGuid trong tính toán kết quả
  → Mọi truy vấn xếp hạng có tiêu chí cuối product_id ↑

INV-11 · Routine AM luôn có bước chống nắng        (FR-QUIZ-03 AC-02)
  → Test: hồ sơ ngân sách cực thấp → vẫn có bước chống nắng
  → Test: dị ứng nhiều → vẫn có bước làm sạch
  → UI: nút xóa ở bước bắt buộc bị vô hiệu

INV-12 · Trợ lý AI không thể thực hiện giao dịch             (GC-13)
  → Đọc danh sách tool khai báo cho provider → mọi tool CHỈ ĐỌC
  → Thử thêm tool có tác dụng phụ → test allowlist ĐỎ

BA BẤT BIẾN KHÔNG MANG MÃ INV-* — rà soát cùng lúc:

BR-CART-06 · Thứ tự 6 bước tính tiền
  → Test ví dụ BRD §17.4 khớp chính xác
  → Test tính chất: tổng dòng giải thích = tổng cuối
  → Grep: 0 lần double/float cho tiền

BR-ORD-13 · Máy trạng thái đơn hàng
  → Test mọi cặp chuyển trạng thái
  → Grep: setter Status là private

ADR-008 · DTO sinh tự động
  → Job CI openapi-drift
  → Grep: 0 interface viết tay trùng DTO backend

BR-CONF-02c · Đúng một cặp ở mức CAO (quy tắc dữ liệu, không phải INV)
  → Query: count(*) WHERE severity='CAO' = 1
  → Cặp đó là Retinoid + BPO, có sắc thái Adapalene

ĐẦU RA — docs/_review/invariant-audit-v1.0.md:
  Bảng: bất biến · nguồn (Technical_Design §4.4) · cách kiểm chứng · lệnh chạy · kết quả · ngày
  ⚠️ Mọi dòng phải ĐẠT. Một dòng không đạt là một lỗi phải sửa
     TRƯỚC khi sang N2, không phải một ghi chú để sau.
```

✅ **XONG KHI**

```text
☐ 12/12 bất biến INV-* + 4 bất biến không mang mã INV đều có kiểm chứng tự động
☐ 16/16 kiểm chứng ĐẠT
☐ docs/_review/invariant-audit-v1.0.md hoàn chỉnh
☐ Mọi kiểm chứng chạy được bằng một lệnh (script scripts/audit-invariants.sh)
```

🔍 **KIỂM CHỨNG**

```bash
./scripts/audit-invariants.sh      # viết script này nếu chưa có
# Phải in 16 dòng, tất cả ĐẠT
```

---

## ▸ N2 — Rà soát tuân thủ pháp lý toàn hệ thống ⭐⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 8 | P9 | `WG-P9-02` | N1 |

🎯 **MỤC TIÊU** — Xác nhận **30 mục tuân thủ** (`CMP-01`…`CMP-30`) của `BRD` §13.

🤖 **PROMPT**

```text
Rà soát tuân thủ pháp lý toàn hệ thống.

ĐỌC TRƯỚC: BRD §13 TOÀN BỘ (CMP-01…CMP-30)
          · docs/security-policy.md · docs/llm-policy.md

Chia thành 5 khối, rà từng khối:

KHỐI 1 — Quảng cáo mỹ phẩm (CMP-01…CMP-10):
  Quét TOÀN BỘ chuỗi hiển thị của hệ thống (frontend + mẫu trả lời AI
  + mô tả sản phẩm trong DB) tìm từ vi phạm, so khớp KHÔNG PHÂN BIỆT DẤU.
  Phạm vi quét: src/frontend/src/**/*.{ts,tsx}
              · ai_intent_rules.response_template
              · products.description (Lớp A)
              · ingredients.description
  Loại trừ hợp lệ: câu giải thích vì sao hệ thống KHÔNG dùng từ đó.
  ⚠️ Ghi rõ từng loại trừ vào báo cáo, có lý do — không loại trừ im lặng.

KHỐI 2 — Hành nghề y (CMP-11…CMP-17):
  Xác nhận: 0 persona bác sĩ/chuyên gia · 0 chẩn đoán · 0 kê thuốc
  · thanh từ chối trách nhiệm hiện ở MỌI trang có nội dung tư vấn
  · bộ chặn y tế hoạt động (chạy lại 30 câu test của L2)
  · nhóm cấp tính khuyên đi khám, không chuyển Zalo

KHỐI 3 — Dữ liệu cá nhân (CMP-18…CMP-24):
  Xác nhận:
  · Ẩn danh hóa trước mọi lệnh gọi ra ngoài biên giới
  · allow_ai_sharing mặc định false
  · Xuất dữ liệu hoạt động, đủ 6 loại
  · Xóa dữ liệu là xóa thật
  · Log không chứa dữ liệu cá nhân (grep log thật sau khi chạy E2E)
  · Admin không xem được hồ sơ da / chat / nhật ký
  · Chuyển Zalo có đồng ý từng mục
  · Ảnh da không ra ngoài hệ thống
  · 0 email/SMS tiếp thị ở V1.0

KHỐI 4 — Bản quyền & nguồn dữ liệu (CMP-25…CMP-30):
  Xác nhận:
  · Từ điển thành phần từ CosIng + tự biên soạn, KHÔNG thu thập từ
    INCIDecoder/EWG/CosDNA
  · Dataset Sephora ghi rõ nguồn và giấy phép ở trang methodology
  · Ảnh sản phẩm lưu cục bộ, không nhúng CDN bên thứ ba
  · Mọi quy tắc xung đột có nguồn dẫn được
  · Trang methodology.html giải thích phương pháp và hạn chế dữ liệu
  · Trang ranking-criteria.html giải thích cách xếp hạng

KHỐI 5 — An toàn ứng dụng:
  · gitleaks: 0 bí mật trong git
  · dotnet list package --vulnerable: 0 lỗ hổng
  · npm audit: 0 lỗ hổng mức cao/nghiêm trọng
  · Mọi endpoint ghi có kiểm tra quyền sở hữu
  · Mọi endpoint admin có AdminOnly
  · Không trả stack trace ở môi trường Production
  · Tải tệp kiểm tra magic bytes

ĐẦU RA — docs/_review/compliance-audit-v1.0.md:
  Bảng: mục CMP · yêu cầu · cách kiểm chứng · kết quả · bằng chứng
  + danh sách loại trừ có lý do
  + danh sách mục chưa đạt kèm kế hoạch sửa
```

✅ **XONG KHI**

```text
☐ 30/30 mục CMP được rà soát
☐ 0 vi phạm thật (loại trừ có lý do ghi rõ)
☐ gitleaks · dotnet vulnerable · npm audit: tất cả sạch
☐ Grep log thật sau E2E: 0 dữ liệu cá nhân
☐ docs/_review/compliance-audit-v1.0.md hoàn chỉnh
☐ Mục chưa đạt: đã sửa, không để lại
```

🔍 **KIỂM CHỨNG**

```bash
gitleaks detect --source . --no-banner
dotnet list package --vulnerable --include-transitive
(cd src/frontend && npm audit --audit-level=high)
./scripts/compliance-scan.sh          # quét ngôn từ toàn hệ thống
```

---

## ▸ N3 — Kiểm thử hiệu năng & khả năng tiếp cận

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 8 | P9 | `WG-P9-03` | N1 |

🎯 **MỤC TIÊU** — Đạt ngưỡng hiệu năng của `NFR` và **WCAG 2.1 AA trên mọi trang**.

🤖 **PROMPT**

```text
Kiểm thử hiệu năng và khả năng tiếp cận.

ĐỌC TRƯỚC: BRD §11 (NFR-01…NFR-20) · .agents/rules/ui-ux-standards.md

PHẦN 1 — Hiệu năng API (với dữ liệu ĐẦY ĐỦ, không dữ liệu rỗng):
  Ngưỡng theo NFR:
    Danh sách sản phẩm   p95 < 300ms
    Tìm kiếm             p95 < 300ms
    Chi tiết sản phẩm    p95 < 400ms (gồm tính Điểm Phù Hợp)
    Giỏ hàng             p95 < 200ms
    Tạo đơn hàng         p95 < 800ms
    Tầng luật AI         p95 < 200ms
    Tầng LLM             p95 < 5s

  Dùng k6 hoặc bombardier. 50 người dùng đồng thời, 2 phút.

  ⚠️ Nếu không đạt: tìm nguyên nhân bằng EXPLAIN ANALYZE, KHÔNG
     thêm cache để che. Nguyên nhân thường gặp:
     - Thiếu index (kiểm bằng EXPLAIN)
     - Vấn đề N+1 query (kiểm bằng log SQL của EF Core)
     - Tải dữ liệu không cần thiết (thiếu Select/projection)
  Ghi lại nguyên nhân và cách sửa vào báo cáo.

PHẦN 2 — Hiệu năng frontend:
  Lighthouse trên 6 trang chính (chủ · danh mục · chi tiết · giỏ
  · thanh toán · chat):
    Performance ≥ 80 · Accessibility ≥ 95 · Best Practices ≥ 90
  Kiểm riêng: CLS < 0,1 (không nhảy layout) · LCP < 2,5s

PHẦN 3 — Khả năng tiếp cận, MỌI trang:
  axe-core WCAG 2.1 AA — 0 vi phạm serious/critical
  + kiểm tay bằng bàn phím: đi hết được MỌI luồng chính chỉ bằng Tab,
    Shift+Tab, Enter, Space, Esc, phím mũi tên
  + kiểm chỉ báo tiêu điểm thấy rõ ở mọi phần tử tương tác
  + kiểm với trình đọc màn hình (VoiceOver trên macOS) ít nhất
    2 luồng: mua hàng và chat

  ⚠️ Kiểm tay là bắt buộc. axe phát hiện được khoảng một nửa vấn đề
     tiếp cận; phần còn lại chỉ phát hiện được khi thực sự dùng
     bàn phím và trình đọc màn hình.

PHẦN 4 — Kiểm thử trên thiết bị thật:
  iPhone Safari · Android Chrome · Desktop Chrome/Firefox/Safari
  Kiểm: vùng chạm ≥ 44px · không cuộn ngang ngoài ý muốn
       · bàn phím ảo không che ô nhập · hình ảnh không nhảy

ĐẦU RA — docs/_review/performance-a11y-report-v1.0.md:
  Bảng ngưỡng · kết quả · đạt/không đạt
  + với mục không đạt: nguyên nhân gốc và cách đã sửa
```

✅ **XONG KHI**

```text
☐ Mọi ngưỡng p95 ĐẠT với dữ liệu đầy đủ
☐ Lighthouse 6 trang: Performance ≥ 80 · Accessibility ≥ 95
☐ axe: 0 vi phạm serious/critical trên MỌI trang
☐ Đi hết luồng mua hàng và luồng chat CHỈ bằng bàn phím
☐ Kiểm trình đọc màn hình 2 luồng chính
☐ Kiểm trên 3 thiết bị thật
☐ Báo cáo có nguyên nhân gốc cho mỗi mục từng không đạt
```

---

## ▸ N4 — Tài liệu bàn giao & vận hành

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 6 | P9 | `WG-P9-04` | N2 |

🎯 **MỤC TIÊU** — Tài liệu để **người khác (hoặc chính bạn sau 6 tháng)** chạy và hiểu được hệ thống.

🤖 **PROMPT**

```text
Hoàn thiện tài liệu bàn giao.

ĐỌC TRƯỚC: AGENTS.md §6 (taxonomy) · docs/traceability.md
          · toàn bộ docs/ hiện có

1. README.md gốc repo:
   Dự án là gì · kiến trúc một đoạn · yêu cầu môi trường
   · 5 lệnh để chạy từ đầu (clone → docker → migrate → seed → run)
   ⚠️ Tự kiểm: xóa toàn bộ, clone lại, làm đúng theo README.
      Nếu không chạy được, README sai.

2. docs/deployment-runbook.md:
   Chạy local trên macOS từng bước · biến môi trường (đầy đủ, có giải thích)
   · chạy migration · chạy seeder · khắc phục 10 sự cố thường gặp
   ⚠️ Mục khắc phục sự cố phải gồm những lỗi BẠN ĐÃ GẶP trong dự án,
      không phải lỗi giả định. Xem lại docs/_states/ để nhớ lại.

3. docs/observability-runbook.md:
   Đọc log ở đâu · hiểu traceId · health check nghĩa là gì
   · circuit breaker của Gemini · trang theo dõi AI đọc thế nào
   · chỉ số nào cần để ý và ngưỡng nào là bất thường

4. docs/traceability.md — HOÀN THIỆN:
   Bảng: FR-* → tệp hiện thực → test chứng minh
   ⚠️ Mọi yêu cầu mức Must PHẢI có ít nhất một test chỉ được.
      Yêu cầu Must không có test là yêu cầu chưa được chứng minh.
   Chạy scripts/check-traceability.py để xác nhận không thiếu.

5. docs/_guides/admin-guide.md (MỚI):
   Hướng dẫn cho người vận hành (không phải lập trình viên):
   thêm sản phẩm · xử lý đơn · duyệt đánh giá
   · mở rộng từ điển thành phần (quy trình ưu tiên theo tác động)
   · đọc trang theo dõi AI · đổi cấu hình hệ thống
   ⚠️ Viết cho người không biết code. Không nhắc tên bảng DB hay endpoint.

6. docs/_guides/data-pipeline-guide.md (MỚI):
   Chạy lại từng script · khi nào cần chạy lại · cách thêm dữ liệu mới
   · 4 notebook giải thích phương pháp

7. CHANGELOG.md:
   Phiên bản 1.0.0 · mọi tính năng chính · các quyết định quan trọng
   · hạn chế đã biết (ghi THẬT, gồm cả tỷ lệ phủ INCI thực tế)

8. docs/_review/known-limitations-v1.0.md (MỚI, quan trọng):
   Danh sách TRUNG THỰC những gì V1.0 chưa làm:
   · tỷ lệ phủ từ điển thành phần thực tế
   · luật mua kèm dựa trên xấp xỉ, không phải giỏ hàng thật
   · không có cổng thanh toán trực tuyến
   · không có email/SMS
   · danh mục Lớp A giới hạn
   · mobile React Native là chỗ dành sẵn, chưa phát triển
   ⚠️ Tài liệu này quan trọng với người đọc bên ngoài hơn mọi tài liệu
      khác. Nó là thứ phân biệt một dự án được hiểu rõ với một dự án
      được phóng đại.
```

✅ **XONG KHI**

```text
☐ Clone repo mới, làm đúng README → chạy được   ← bắt buộc tự kiểm
☐ traceability.md: 100% yêu cầu Must có test chỉ được
☐ scripts/check-traceability.py xanh
☐ admin-guide.md viết cho người không biết code
☐ known-limitations-v1.0.md trung thực, đầy đủ
☐ Mục khắc phục sự cố gồm lỗi thật đã gặp
☐ ./syntheprise gate xanh
```

---

## ▸ N5 — Demo cuối & đóng dự án ⭐

| Giờ | Phase | WG | Phụ thuộc |
|---|---|---|---|
| 6 | P9 | `WG-P9-05` | N1–N4 |

🎯 **MỤC TIÊU** — Một bản demo **chạy được, có kịch bản, trung thực về hạn chế**.

🤖 **PROMPT**

```text
Chuẩn bị demo cuối và đóng dự án.

ĐỌC TRƯỚC: BRD §2 (mục tiêu kinh doanh) · BRD §4 (điểm khác biệt)
          · docs/_review/known-limitations-v1.0.md

PHẦN 1 — Dữ liệu demo:
  Script scripts/seed-demo.sh tạo trạng thái demo sạch:
    1 tài khoản admin · 3 tài khoản người dùng với 3 hồ sơ da KHÁC NHAU
    (da dầu+mụn · da khô+nhạy cảm · da hỗn hợp+lão hóa)
    · vài đơn hàng ở các trạng thái khác nhau
    · vài đánh giá đã duyệt và chờ duyệt
    · 2 voucher còn hiệu lực
  ⚠️ Ba hồ sơ khác nhau là CHỦ ĐÍCH: để demo được điều quan trọng nhất —
     cùng một sản phẩm cho ba Điểm Phù Hợp khác nhau.

PHẦN 2 — Kịch bản demo (docs/_guides/demo-script.md), 20 phút:

  Mở đầu (2 phút) — vấn đề:
    "Sàn mỹ phẩm hiện tại cho bạn bộ lọc theo giá và thương hiệu.
     Không sàn nào trả lời được câu hỏi thật của người mua:
     sản phẩm này có phù hợp với DA CỦA TÔI không?"

  Màn 1 (4 phút) — Điểm Phù Hợp theo người:
    Đăng nhập hồ sơ A (da dầu) → mở một sản phẩm → điểm 88
    Đăng nhập hồ sơ B (da nhạy cảm) → MỞ CÙNG SẢN PHẨM → điểm 61
    → mở "Vì sao có điểm này" ở cả hai, chỉ ra yếu tố khác nhau
    ⭐ Đây là màn quan trọng nhất. Nó chứng minh đây không phải
       một điểm chất lượng sản phẩm.

  Màn 2 (3 phút) — Minh bạch dữ liệu:
    Chỉ vào "38/52 thành phần (73%)" → mở danh sách chưa nhận diện
    "Chúng tôi nói rõ mình không biết gì. Các ứng dụng chấm điểm
     thành phần thường không làm vậy."

  Màn 3 (4 phút) — Xung đột phân cấp bằng chứng:
    Thêm Retinol + Benzoyl Peroxide → cảnh báo CAO, có nguồn PubMed,
    có phương án tách buổi, có sắc thái Adapalene
    → mở panel "những cặp chúng tôi KHÔNG cảnh báo"
    → chỉ vào đính chính Vitamin C + Niacinamide
    ⭐ Màn này chứng minh lập trường khoa học, không chỉ liệt kê cảnh báo.

  Màn 4 (3 phút) — Trợ lý AI trong ràng buộc:
    Hỏi "phí giao hàng" → trả lời tức thì từ tầng luật
    Hỏi "kem chống nắng cho da dầu" → LLM, tên sản phẩm THẬT
    Hỏi "tôi bị vảy nến dùng gì" → BỊ CHẶN, hiện lựa chọn Zalo
    → tạo mã chuyển Zalo, tích 2/3 mục đồng ý
    ⭐ Nhấn mạnh: điều đáng chú ý là nó KHÔNG trả lời câu thứ ba.

  Màn 5 (2 phút) — Routine không thiếu bước:
    Hồ sơ ngân sách thấp → routine vẫn có bước chống nắng,
    ở trạng thái "chưa tìm được sản phẩm phù hợp" + giải thích

  Kết (2 phút) — HẠN CHẾ:
    Mở known-limitations-v1.0.md và nói THẬT:
    tỷ lệ phủ thực tế · luật mua kèm là xấp xỉ · chưa có thanh toán
    trực tuyến · danh mục Lớp A giới hạn
    ⭐ Phần này không phải điểm yếu của bài demo. Nó là phần làm cho
       bốn màn trước đáng tin.

PHẦN 3 — Ghi lại demo:
  Quay video hoặc GIF cho từng màn, lưu docs/_guides/demo-assets/
  (dùng được khi trình bày không có môi trường chạy)

PHẦN 4 — CẮT PHÁT HÀNH qua workflow /release-baseline:

  ⛔ KHÔNG chạy `git tag` trực tiếp. AGENTS.md rule 11 nói rõ: một bản
     phát hành CHỈ được cắt qua workflow /release-baseline, và việc tạo
     hay push thẻ là PROTECTED ACTION cần chủ sở hữu xác nhận
     (.agents/rules/safety.md).

  ĐỌC TRƯỚC: docs/_guides/16-release-versioning.md
           · .agents/rules/safety.md
           · .agents/workflows/release-baseline.md (nếu có)

  Thực thi /release-baseline theo đúng chuỗi của nó:
     deploy → migrate → smoke check → semver tag → CHANGELOG
  Ở bước semver tag: DỪNG, trình bày cho tôi, chờ tôi xác nhận rõ ràng.

  ⚠️ Phiên bản sản phẩm (thẻ git + CHANGELOG, do /release-baseline điều
     khiển) TÁCH BIỆT với phiên bản kit Syntheprise Framework (tệp VERSION).
     Đừng đổi VERSION.

PHẦN 5 — Đóng dự án:
  1. Cập nhật docs/_plans/MASTER-PLAN.md: mọi phase xong
  2. Ảnh chụp trạng thái cuối:
     docs/_states/state_<YYYY-MM-DD>_v1.0-hoan-thanh.md   (ngày ISO)
  3. ./syntheprise dashboard → cập nhật docs/_dashboard/status.md
  4. docs/_review/retrospective-v1.0.md:
     · Điều gì làm tốt
     · Điều gì ước làm khác
     · Ước lượng giờ so với thực tế (theo work group)
     · Bài học cho V2
     ⚠️ Mục ước lượng vs thực tế là phần có giá trị nhất cho lần sau.
  5. docs/_plans/V2-BACKLOG.md:
     Mọi thứ đã hoãn: cổng thanh toán · email/SMS · mobile
     · mở rộng từ điển · Zalo ZNS · gợi ý bằng học máy trực tuyến
  6. Xác nhận docs/_changes/ RỖNG (mọi change đã archive) —
     scripts/check-change-completeness.py xanh
```

✅ **XONG KHI**

```text
☐ scripts/seed-demo.sh tạo được trạng thái demo từ DB rỗng
☐ 3 hồ sơ da khác nhau → cùng sản phẩm cho 3 điểm khác nhau  ← bắt buộc
☐ Chạy đủ kịch bản 20 phút, 5 màn, không lỗi
☐ Video/GIF cho 5 màn
☐ Thẻ v1.0.0 cắt qua **/release-baseline**, có tôi xác nhận ở bước tag
☐ docs/_changes/ RỖNG — mọi change đã archive
☐ docs/_dashboard/status.md cập nhật
☐ MASTER-PLAN cập nhật · retrospective · V2-BACKLOG
☐ ./syntheprise gate xanh · 5 job CI xanh · 8/8 E2E PASS
☐ Phần kết demo nói thật về hạn chế
```

🔍 **KIỂM CHỨNG**

```bash
docker compose down -v && docker compose up -d postgres && sleep 5
./scripts/seed-demo.sh
./scripts/build && ./scripts/test
npx playwright test
./syntheprise gate
python scripts/doctor.py --quality-gate
python scripts/check-change-completeness.py
# Workflow /test-gate (riêng với syntheprise gate — AGENTS.md rule 10)
# Thẻ phát hành: chạy workflow /release-baseline, KHÔNG `git tag` tay
```

---

## 📋 Danh mục kiểm tra kết thúc DỰ ÁN

```text
☐ 12/12 bất biến INV-* + 4 bất biến không mang mã INV đều có kiểm chứng tự động, tất cả ĐẠT
☐ 30/30 mục tuân thủ CMP rà soát xong, 0 vi phạm thật
☐ Mọi ngưỡng hiệu năng ĐẠT · WCAG 2.1 AA trên mọi trang
☐ 8/8 luồng E2E PASS trên 3 thiết bị
☐ 22 golden case PASS · bộ đánh giá AI PASS
☐ Coverage ≥ 70/60 cả hai phía
☐ 5 job CI xanh · ./syntheprise gate xanh
☐ README clone-chạy-được đã tự kiểm
☐ Traceability 100% yêu cầu Must
☐ known-limitations trung thực
☐ Demo 20 phút chạy được, có ghi lại
☐ Thẻ v1.0.0 · retrospective · V2-BACKLOG

🎉 HOÀN THÀNH V1.0
```

---

# PHẦN 15 — NHÓM P: THƯ VIỆN PROMPT MẪU

> 💡 **Cách dùng phần này:** chín prompt dưới đây dùng **hằng ngày**, không phụ thuộc task cụ thể. Sao chép, thay phần trong `<...>`, dán vào Antigravity.

---

## P-01 · Bắt đầu một buổi làm việc

```text
Tôi đang làm việc trên dự án BeautyAI.

ĐỌC TRƯỚC (theo đúng thứ tự, không bỏ bước — lớp 0 trước):
1. .agents/rules/safety.md              ← lớp 0, thẩm quyền cao nhất
2. .agents/rules/change-management.md
3. core-principles.md
4. AGENTS.md — đặc biệt §0 (thang arbitration) · §2 rule 7 và 12 · §7 (DoD)
5. docs/_plans/MASTER-PLAN.md — tình trạng tổng thể
6. docs/_plans/<phase-hiện-tại>/PHASE-PLAN.md
7. docs/_states/ — ảnh chụp trạng thái MỚI NHẤT
8. docs/_changes/ — có change nào ĐANG MỞ không?
   ⚠️ requirements-delta.md của một change đang mở có thẩm quyền
      NGANG requirements.md (lớp 3). Nếu có, đọc nó.
9. docs/_guides/91-beautyai-change-policy.md
10. docs/_guides/90-beautyai-playbook.md — phần của task hôm nay

Hôm nay tôi làm task <mã task, vd C3> trong playbook.

Trước khi bắt đầu, hãy báo cho tôi:
a) Tóm tắt trạng thái hiện tại (1 đoạn)
b) Task này phụ thuộc gì — đã xong hết chưa?
c) Các tài liệu nào cần đọc cho task này (theo playbook)
d) Bất biến nào áp dụng — dẫn mã INV-* theo Technical_Design §4.4
e) Task này thỏa tiêu chí nào của AGENTS.md rule 7?
   → Nếu thỏa bất kỳ tiêu chí: PHẢI mở change folder. Đề xuất
     CHANGE-ID và --type theo 91-beautyai-change-policy.md.
   → Nếu work group này đã có change folder mở: dùng cái đó.
f) Lệnh worktree cần chạy (Rule 12 — task có bước ghi git không được
   chạy trên checkout chính)
g) Bất kỳ điều gì trong trạng thái hiện tại khiến bạn nghĩ task này
   chưa nên làm bây giờ

ĐỪNG bắt đầu viết code cho đến khi tôi xác nhận.
```

> 💡 **Mục (e) và (f) là phần hay bị quên nhất.** Cả hai đều có hook enforce: `check-change-completeness.py` ở CI và `check-worktree-isolation.py` ở pre-commit. Hỏi ở đầu phiên rẻ hơn nhiều so với gặp hook chặn lúc đang commit.

---

## P-02 · Kết thúc một buổi làm việc *(nghi thức close-out — `AGENTS.md §7`)*

> ⚠️ **Prompt này thực thi Definition of Done §7 của framework.** Bốn bước có **thứ tự cố định** và một **cổng**: state snapshot phải tồn tại *trước* khi archive. Framework ghi rõ: *"Never archive/cleanup/persist-memory before the state snapshot exists."*

```text
Kết thúc buổi làm việc. Thực thi nghi thức close-out của AGENTS.md §7.

ĐỌC TRƯỚC:
1. .agents/rules/safety.md              ← protected actions (push, tag, xóa)
2. .agents/rules/worktree-isolation.md
3. AGENTS.md §7 (Definition of Done — mục Close-out)
4. docs/_guides/91-beautyai-change-policy.md

TRƯỚC TIÊN, xác nhận tiền đề:
  ☐ Đang ở worktree riêng, KHÔNG phải checkout chính
     (git worktree list · git branch --show-current)
  ☐ Đã acquire session lock: ./syntheprise close-out
  ☐ Không có phiên close-out nào khác đang chạy trên cùng checkout
  Nếu một tiền đề không thỏa → DỪNG, báo cho tôi. Đừng tự xử lý.

BƯỚC 1 — ẢNH CHỤP TRẠNG THÁI TRƯỚC (đây là CỔNG, không bỏ được):
  a) Cập nhật worklog trong docs/_plans/<phase>/<WG-id>.md
  b) Viết docs/_states/state_<YYYY-MM-DD>_<slug>.md
     ⚠️ Ngày phải là ISO (vd state_2026-10-28_wg-p1-03-db-schema.md)
        — scripts/doctor.py tìm đúng định dạng này.
     Nội dung:
       1. Task + CHANGE-ID đã làm hôm nay
       2. Đã hoàn thành: tệp tạo/sửa · test thêm · kết quả gate
       3. CHƯA hoàn thành: đang dở CHÍNH XÁC ở đâu, tệp nào chưa hoàn chỉnh
       4. Quyết định hôm nay — có cần ADR không
       5. Vấn đề phát hiện nhưng chưa xử lý
       6. Việc tiếp theo theo playbook
       7. Điều tôi cần biết trước buổi sau
  c) Commit (a) và (b) TRONG CÙNG commit với bước 2.
     ⚠️ Nguyên tử. KHÔNG BAO GIỜ là một PR đuôi.

BƯỚC 2 — ARCHIVE (chỉ khi work group đã XONG; đang dở thì dừng ở bước 1):
  a) Merge delta đã được chấp nhận vào tài liệu canonical
     ⚠️ Chỉ merge phần ĐÃ PHÊ DUYỆT trong requirements-delta.md
  b) git mv docs/_changes/<CHANGE-ID>/ docs/_changes/_archive/

BƯỚC 3 — CLEANUP:
  a) Xóa PR branch (local + remote)
  b) git worktree remove <đường dẫn worktree>
  c) Xác nhận checkout chính đang ở main và đã pull

BƯỚC 4 — ĐÓNG:
  a) Đánh dấu change CLOSED
  b) Cập nhật docs/_plans/MASTER-PLAN.md nếu có work group hoàn thành
  c) ./syntheprise dashboard   (cập nhật docs/_dashboard/status.md)
  d) ./syntheprise close-out --release   ← nhả session lock

BÁO CÁO cho tôi: đã làm bước nào, bước nào bỏ và vì sao.

TUYỆT ĐỐI KHÔNG:
- Archive / cleanup / đóng change trước khi state snapshot tồn tại
- Tách snapshot và archive thành hai commit
- Archive một change khi work group còn dở (dừng ở bước 1 là đúng)
- Xóa branch hay push mà chưa có xác nhận của tôi (protected action)
- Bỏ --release (session lock treo sẽ chặn phiên sau)
```

> 💡 **Nếu buổi làm việc kết thúc giữa một work group:** làm **bước 1, dừng lại**, giữ worktree và change folder mở. Bước 2–4 chỉ chạy khi work group thực sự xong. Snapshot vẫn bắt buộc — đó là thứ buổi sau đọc để tiếp tục.

---

## P-03 · Hiện thực một task của playbook

```text
Hiện thực task <mã task> theo playbook.

BƯỚC 0 — Tiền đề (xác nhận trước khi làm gì khác):
  ☐ Đang ở worktree riêng, không phải checkout chính   (Rule 12)
  ☐ Change folder của work group này đang MỞ            (Rule 7)
     → chưa có: /change-propose trước, rồi quay lại bước 1
     → đã có: đọc proposal.md và requirements-delta.md của nó

BƯỚC 1 — Đọc (báo cho tôi bạn đã đọc gì):
  .agents/rules/safety.md · core-principles.md
  + danh sách tài liệu ở mục ĐỌC TRƯỚC của task <mã> trong
    docs/_guides/90-beautyai-playbook.md
  + requirements-delta.md của change đang mở (nếu có)

BƯỚC 2 — Trình bày kế hoạch TRƯỚC KHI viết code:
  - Những tệp bạn sẽ tạo/sửa
  - Những test bạn sẽ viết TRƯỚC (QA-first)
  - Bất biến áp dụng — dẫn mã INV-* theo Technical_Design §4.4,
    và cách bạn đảm bảo từng cái
  - Có cần cập nhật requirements-delta.md không
  - Bất kỳ điểm nào trong yêu cầu mà bạn thấy chưa rõ
  ĐỢI tôi xác nhận.  (AGENTS.md rule 9 — Tier 1 bắt buộc)

BƯỚC 3 — /qa-test-design → viết TEST trước, chạy cho ĐỎ,
  cho tôi xem kết quả đỏ.

BƯỚC 4 — Hiện thực đến khi test XANH.

BƯỚC 5 — Chạy đủ:
  ./scripts/build
  ./scripts/test
  ./syntheprise gate
  workflow /test-gate        ← RIÊNG với syntheprise gate (rule 10)
  python scripts/doctor.py --quality-gate
  + các lệnh ở mục KIỂM CHỨNG của task

BƯỚC 6 — Báo cáo theo mục XONG KHI của task,
  đánh dấu từng dòng ĐẠT / KHÔNG ĐẠT.
  Dòng KHÔNG ĐẠT: nói rõ vì sao, ĐỪNG báo xong.

BƯỚC 7 — Cập nhật worklog trong docs/_plans/<phase>/<WG-id>.md
  (yêu cầu của DoD §7). Đóng phiên bằng P-02.

TUYỆT ĐỐI KHÔNG:
- Hiện thực khi chưa có change folder (change-propose.md: "Forbidden")
- Commit trên checkout chính                            (Rule 12)
- Bỏ qua mục TUYỆT ĐỐI KHÔNG của task
- Đổi stack, lược đồ DB, cách xác thực, hay cách triển khai
  (nếu bạn nghĩ cần đổi → DỪNG, trình bày cho tôi, chờ quyết định — Rule 2)
- Sửa trực tiếp tài liệu canonical lớp 2/3/4 — phải qua
  requirements-delta.md của change                       (Rule 7 · §4)
- Báo xong khi còn dòng XONG KHI chưa đạt
- Nới ngưỡng coverage hay tắt test để build xanh
```

---

## P-04 · Khi cần thay đổi một quyết định đã chốt

```text
Tôi cần xem lại một quyết định kiến trúc.

Quyết định hiện tại: <ADR-xxx hoặc mô tả>
Vấn đề phát sinh: <mô tả cụ thể, có bằng chứng>

ĐỌC TRƯỚC:
- docs/adr/<ADR liên quan>.md — đặc biệt mục "Hệ quả" và
  "điều kiện để xem lại quyết định"
- .agents/workflows/change-propose.md
- AGENTS.md §0 (thang arbitration)

LÀM:
1. Đọc ADR hiện tại, nhắc lại CHÍNH XÁC lý do quyết định ban đầu
   và điều kiện xem lại đã ghi
2. Vấn đề tôi nêu có thỏa điều kiện xem lại không?
   Nếu KHÔNG → nói rõ, và đề xuất cách giải quyết vấn đề TRONG
   quyết định hiện tại
3. Nếu CÓ → chạy workflow /change-propose, loại CHANGE (không FASTLANE,
   vì đây là thay đổi contract):
   a. ./syntheprise change new "<mô tả>" --type CHANGE
      → tạo docs/_changes/<CHANGE-ID>/ từ docs/_changes/CHANGE-template/
   b. proposal.md     — phạm vi · lý do nghiệp vụ · rủi ro · bảng phê duyệt
   c. requirements-delta.md — dùng ADDED / MODIFIED / REMOVED / DEPRECATED
   d. Xác định contract bị ảnh hưởng: architecture · data · API · UI
      · security · LLM · test
   e. ADR mới, hoặc đặt ADR cũ thành status: superseded
      kèm trường superseded_by
      ⚠️ AGENTS.md §0: tài liệu status: superseded là tài liệu CHẾT.
         Không xóa nó — đặt trạng thái và trỏ sang bản thay thế.
   f. Rủi ro di cư dữ liệu
4. DỪNG chờ phê duyệt — Tier 1 bắt buộc (change-propose.md bước 5).
   KHÔNG tự thay đổi gì.

⚠️ Nhắc: tài liệu ở lớp precedence cao hơn (contracts · requirements ·
domain-rules) KHÔNG được thay đổi để khớp với code. Code phải khớp
tài liệu, hoặc tài liệu phải được sửa qua Change Spec có chủ đích.
```

---

## P-05 · Rà soát trước khi kết thúc một work group

```text
Rà soát work group <mã WG> trước khi đóng.

ĐỌC: docs/_plans/<phase>/<WG>.md · docs/_guides/90-beautyai-playbook.md phần tương ứng
   · docs/traceability.md

KIỂM TRA VÀ BÁO CÁO TỪNG MỤC:

1. Mọi dòng XONG KHI của mọi task trong WG này — ĐẠT/KHÔNG
2. Mọi lệnh KIỂM CHỨNG — chạy và dán kết quả
3. ./scripts/build · ./scripts/test · ./syntheprise gate
   + workflow /test-gate + python scripts/doctor.py --quality-gate
3b. Change folder của WG này: requirements-delta.md đã đầy đủ chưa?
    Phần nào trong delta ĐÃ ĐƯỢC PHÊ DUYỆT và sẵn sàng merge vào
    tài liệu canonical khi archive?
4. Coverage: backend ≥ 70/60 · frontend ≥ 70/60
5. Test kiến trúc: còn PASS?
6. 22 golden case: còn PASS?
7. Bất biến liên quan WG này: kiểm chứng lại
8. Traceability: mọi FR của WG này có test chỉ được chưa?
9. Rà soát ngôn từ: 0 vi phạm trong code mới của WG này?
10. Có nợ kỹ thuật nào tạo ra trong WG này? Ghi vào đâu?

Với MỖI mục KHÔNG ĐẠT: nói rõ vấn đề, đề xuất cách sửa, đừng tự sửa
quyết định thiết kế.

Cuối cùng: WG này ĐÃ SẴN SÀNG đóng chưa? Nếu chưa, còn gì?
```

---

## P-06 · Gỡ lỗi có hệ thống

```text
Gỡ lỗi: <mô tả hiện tượng>

ĐỪNG đoán. Làm theo thứ tự:

BƯỚC 1 — Tái hiện:
  Viết một test THẤT BẠI tái hiện đúng lỗi này.
  Cho tôi xem test đỏ. Nếu không tái hiện được bằng test, nói rõ
  và mô tả chính xác các bước tái hiện bằng tay.

BƯỚC 2 — Thu hẹp:
  Lỗi ở tầng nào: DB · Infrastructure · Application · Api · frontend?
  Bằng chứng nào cho thấy điều đó?
  Dùng: log có traceId · EXPLAIN ANALYZE · log SQL của EF Core
       · console/network của trình duyệt

BƯỚC 3 — Nguyên nhân gốc:
  Nói rõ nguyên nhân, KHÔNG phải triệu chứng.
  "Thiếu await" là nguyên nhân. "Dữ liệu không hiện" là triệu chứng.

BƯỚC 4 — Sửa:
  Sửa nguyên nhân gốc. Cho tôi xem test chuyển XANH.

BƯỚC 5 — Phòng ngừa:
  Loại lỗi này có thể xảy ra ở chỗ khác không? Ở đâu?
  Có nên thêm một test kiến trúc hay một quy tắc lint để chặn
  loại lỗi này về sau?

TUYỆT ĐỐI KHÔNG:
- Thêm try/catch để lỗi không nổi lên
- Sửa triệu chứng ở frontend khi nguyên nhân ở backend
- "Sửa" bằng cách đổi kỳ vọng của test
- Thêm cache để che vấn đề hiệu năng
```

---

## P-07 · Cập nhật tài liệu sau khi code thay đổi

```text
Code đã thay đổi. Cập nhật tài liệu cho khớp.

Thay đổi: <mô tả>

ĐỌC: AGENTS.md §0 và §6 · docs/traceability.md

LÀM:
1. Xác định tài liệu nào bị ảnh hưởng, theo lớp precedence:
   Lớp 2 Contracts : architecture · api-contract · data-contracts · adr
   Lớp 3 Requirements: requirements.md · docs/_requirements/
   Lớp 4 Domain rules: domain-rules.md
   Lớp 5 Working mem : _plans · _states
   Lớp 6 Thông tin   : playbook · _guides · _research

2. ⚠️ QUAN TRỌNG — kiểm hướng của thay đổi:
   Nếu code khác tài liệu ở LỚP 2, 3, hay 4:
   → KHÔNG tự sửa tài liệu để khớp code
   → Đây là một thay đổi có chủ đích hay một lỗi?
   → Nếu có chủ đích: cần Change Spec (dùng P-04)
   → Nếu là lỗi: sửa CODE, không sửa tài liệu

   Chỉ tự cập nhật tài liệu lớp 5 và 6.

3. Cập nhật docs/traceability.md nếu có FR mới hoặc test mới

4. Chạy ./syntheprise gate — nó kiểm doc-drift

5. Báo cho tôi: tài liệu nào đã sửa · tài liệu nào CẦN Change Spec
```

---

## P-08 · Rà soát tuân thủ (chạy định kỳ)

```text
Rà soát tuân thủ cho phần code mới nhất.

ĐỌC: BRD §13 (CMP-01…CMP-30) · docs/llm-policy.md
   · docs/security-policy.md

QUÉT 5 KHỐI:

KHỐI 1 — Ngôn từ quảng cáo:
  Quét chuỗi hiển thị tìm (so khớp KHÔNG PHÂN BIỆT DẤU):
  điều trị · chữa · trị mụn · trị nám · đặc trị · khỏi hẳn · dứt điểm
  · hiệu quả 100% · tốt nhất · số 1 · kháng viêm · giảm viêm
  · kháng khuẩn · xóa nám · xóa nhăn
  Phạm vi: frontend · ai_intent_rules · products.description
          · ingredients.description

KHỐI 2 — Điểm an toàn (INV-01):
  Quét: safety · hazard · danger · toxic · độ an toàn · mức nguy hiểm
  Phạm vi: code · DB columns · chuỗi hiển thị
  Loại trừ: câu giải thích vì sao hệ thống KHÔNG dùng khái niệm này

KHỐI 3 — Persona (BR-AI-14):
  Quét mẫu trả lời và prompt: bác sĩ · dược sĩ · chuyên gia da liễu
  · chuyên gia (mô tả CHÍNH trợ lý)
  Được phép: khi khuyên người dùng GẶP bác sĩ

KHỐI 4 — Dữ liệu cá nhân:
  Grep log thật sau khi chạy E2E: email · số điện thoại · địa chỉ
  · nội dung chat · hồ sơ da
  Kiểm SafeLlmContext không có trường định danh

KHỐI 5 — Bí mật:
  gitleaks · kiểm .env không trong git · kiểm không khóa API trong code

BÁO CÁO:
  Bảng: khối · phát hiện · tệp:dòng · là vi phạm thật hay loại trừ hợp lệ
  Với loại trừ: ghi rõ LÝ DO
  Với vi phạm thật: đề xuất cách sửa

Ghi kết quả vào docs/_review/compliance-scan-<ngày>.md
```

---

## P-09 · Khi bị kẹt

```text
Tôi đang kẹt ở <mô tả>.

ĐỪNG viết code ngay. Trả lời 6 câu này trước:

1. Vấn đề CHÍNH XÁC là gì? (một câu, không mô tả triệu chứng chung)
2. Yêu cầu nào trong tài liệu liên quan? (dẫn FR-* / BR-* cụ thể)
3. Tài liệu đã nói gì về tình huống này? (dẫn mục cụ thể)
   Nếu tài liệu KHÔNG nói gì → đó là một lỗ hổng yêu cầu, cần quyết định
   của tôi, không phải cần bạn đoán.
4. Có bất biến nào bị liên quan? Nó giới hạn các phương án thế nào?
5. Ba phương án giải quyết, mỗi phương án:
   - Cách làm (ngắn)
   - Đánh đổi
   - Ảnh hưởng tới bất biến nào
   - Giờ ước tính
6. Phương án nào bạn khuyên và vì sao?

Nếu vấn đề này đòi đổi một quyết định kiến trúc đã chốt,
NÓI RÕ điều đó và dùng quy trình P-04 thay vì tự giải quyết.
```

---

# PHẦN 16 — NHÓM Q: BẢNG TRA NHANH

---

## Q1 · Bản đồ 16 nhóm công việc

| Nhóm | Tên | Phase | Task | Giờ | Chặn gì |
|---|---|---|---|---|---|
| **A** | Yêu cầu & Giải pháp | P0 | 5 | ✓ xong | tất cả |
| **B** | Khởi tạo dự án | P1 | **5** | **24** | tất cả |
| **C** | Dữ liệu & CSDL | P1 | 6 | 52 | F, G, I, L |
| **D** | Backend nền tảng | P2 | 4 | 28 | F→M |
| **E** | Frontend nền tảng | P2 | 3 | 16 | F→M |
| **F** | Danh mục · Tìm kiếm | P3 | 3 | 28 | G, J |
| **G** | Chi tiết · Điểm Phù Hợp | P3 | 4 | 36 | H, I, J |
| **H** | Skin ID · Routine | P4 | 5 | 60 | — |
| **I** | Xung đột · Phân tích | P5 | 4 | 48 | J |
| **J** | Giỏ hàng · Voucher | P6 | 3 | 42 | K |
| **K** | Thanh toán · Đơn hàng | P6 | 4 | 54 | M |
| **L** | Trợ lý AI 3 tầng | P7 | 6 | 72 | M |
| **M** | Quản trị · Đánh giá | P8 | 6 | 72 | N |
| **N** | Kiểm thử & Demo | P9 | 5 | 36 | — |
| **P** | Thư viện prompt | — | 9 | — | dùng hằng ngày |
| **Q** | Bảng tra nhanh | — | — | — | dùng hằng ngày |
| | | | **63** + 9 prompt | **556** | |

---

## Q2 · Mười hai bất biến — bảng in ra dán cạnh máy

> ⚠️ **Nguồn chân lý của bảng này là `Technical_Design` §4.4.** Nếu playbook và `Technical_Design` nói khác nhau về số hiệu hay nội dung một bất biến, `Technical_Design` thắng (lớp 2 > lớp 6). Không được đổi số hiệu — mã bất biến là bất biến.

| # | Bất biến | Thực thi ở đâu | Kiểm thử | Task |
|---|---|---|---|---|
| `INV-01` | Không tồn tại chỉ số "an toàn/nguy hiểm" nào trong lược đồ, API, hay giao diện | Rà soát lược đồ + kiểm chuỗi hiển thị | `DC-07` · nghiệm thu #6 | B4 · C1 · G1 · G2 · I3 |
| `INV-02` | Tồn kho **không bao giờ** âm | Cập nhật có điều kiện nguyên tử trong DB | `FR-ORD-03` AC-04 · test đồng thời | C1 · K1 · K4 |
| `INV-03` | Quy tắc xung đột cấp B/C **không bao giờ** ở mức `CAO` | Ràng buộc `CHECK` ở DB **và** `EvidenceTierGuard` ở code | `FR-CONF-01` AC-02c | C1 · C4 · I1 · M3 |
| `INV-04` | Dữ liệu gửi tới nhà cung cấp LLM **không bao giờ** chứa thông tin gắn danh tính | `DeIdentificationService` — chặng 4, bắt buộc trong đường ống | `GC-17` · kiểm thử nhật ký | **D3** · L3 |
| `INV-05` | Mã sản phẩm do LLM nêu mà không có trong DB **không bao giờ** đến giao diện | `GroundingValidator` — chặng 6 | `GC-15` | L3 · L6 |
| `INV-06` | Văn bản chứa từ ngữ gây hiểu nhầm là thuốc **không bao giờ** đến giao diện | `ComplianceFilter` — chặng 7 | `GC-16` | L3 · M1 · M3 |
| `INV-07` | Admin **không có đường nào** đọc hồ sơ da của khách | Không tồn tại endpoint; kiểm chủ sở hữu ở Application | `E2E-08` | **M2** · M6 |
| `INV-08` | Mật khẩu **không bao giờ** ở dạng rõ trong DB, log, hay phản hồi API | `PasswordHasherAdapter` + `SensitiveDataMasker` + rà soát DTO | `DC-19` · nghiệm thu #11 | **D2** |
| `INV-09` | Đơn hàng đã tạo **không bao giờ** đổi giá/tên sản phẩm khi dữ liệu nguồn đổi | Bản chụp trong `order_items` (ADR-010) | `E2E-07` | **K1** |
| `INV-10` | Cùng đầu vào quiz → cùng kết quả | Sắp xếp tất định, không có yếu tố ngẫu nhiên | `GC-02` | **H1** · H3 |
| `INV-11` | Routine AM **luôn** có bước chống nắng | `RoutineBuilderService` | `FR-QUIZ-03` AC-02 | **H3** · C2 |
| `INV-12` | Trợ lý AI **không thể** thực hiện giao dịch | Không khai báo tool nào có tác dụng phụ cho LLM | `GC-13` | **L3** |

**Ba bất biến KHÔNG mang mã `INV-*` nhưng cũng là bất biến** *(theo `Technical_Design` §4.2)*:

| Bất biến | Nguồn | Task |
|---|---|---|
| Thứ tự **6 bước** tính tiền — đổi thứ tự = đổi số tiền khách trả | `BR-CART-06` | J2 · K1 · K3 |
| Máy trạng thái đơn hàng — chỉ chuyển theo bước cho phép | `BR-ORD-13` | K2 |
| DTO frontend **sinh tự động** từ OpenAPI, không viết tay | `ADR-008` | E2 |

---

## Q3 · Lệnh dùng hằng ngày

```bash
# Khởi động môi trường
docker compose up -d postgres

# MỞ PHIÊN — worktree + change (Rule 12 + Rule 7)
./syntheprise worktree create feat/<wg-id>-<slug>
./syntheprise change new "<tên work group>" --type FASTLANE
ls docs/_changes/                       # change nào đang mở?

# Vòng lặp phát triển
./scripts/build
./scripts/test
./syntheprise gate
python scripts/doctor.py --quality-gate
# + workflow /test-gate — là WORKFLOW, không phải subcommand (rule 10)

# ĐÓNG PHIÊN — 4 bước, snapshot trước archive (DoD §7)
./syntheprise close-out                 # acquire session lock
#   1. worklog + docs/_states/state_<YYYY-MM-DD>_<slug>.md  (CÙNG commit)
#   2. git mv docs/_changes/<ID>/ docs/_changes/_archive/
#   3. xóa branch · git worktree remove · về main
./syntheprise dashboard                 # cập nhật docs/_dashboard/status.md
./syntheprise close-out --release       # nhả lock

# Dựng lại DB từ đầu
docker compose down -v && docker compose up -d postgres && sleep 5
dotnet ef database update --project src/BeautyAI.Infrastructure --startup-project src/BeautyAI.Api
dotnet run --project tools/BeautyAI.Seeder -- --all

# Sinh lại DTO sau khi đổi API
./scripts/export-openapi.sh
(cd src/frontend && npm run gen:api)

# Kiểm thử
dotnet test                                      # tất cả
dotnet test tests/BeautyAI.ArchitectureTests     # bất biến kiến trúc
dotnet test tests/BeautyAI.GoldenTests           # 22 golden case
dotnet test --filter "Category=Concurrency"      # test đồng thời
npx playwright test                              # 8 luồng E2E

# Rà soát
./scripts/audit-invariants.sh
./scripts/compliance-scan.sh
gitleaks detect --source . --no-banner
python scripts/check-change-completeness.py
python scripts/check-worktree-isolation.py

# Đồng bộ adapter sau khi sửa AGENTS.md hay .agents/
./syntheprise sync && ./syntheprise sync --check

# Phát hành — CHỈ qua workflow /release-baseline (rule 11)
# ⛔ không bao giờ `git tag` tay; tạo/push thẻ là protected action
```

---

## Q4 · Danh sách từ CẤM trong chuỗi hiển thị

```text
TUYỆT ĐỐI KHÔNG (chặn cứng — vi phạm quy định quảng cáo mỹ phẩm):
  điều trị · chữa · trị mụn · trị nám · trị thâm · đặc trị
  · khỏi hẳn · dứt điểm · hiệu quả 100% · cam kết khỏi
  · kháng viêm · giảm viêm · kháng khuẩn · diệt khuẩn
  · xóa nám · xóa nhăn · tái tạo tế bào

KHÔNG (vi phạm quy định so sánh):
  tốt nhất · số 1 · hàng đầu · vượt trội nhất · đáng mua nhất
  (được dùng khi có phạm vi rõ: "phù hợp nhất với hồ sơ của bạn")

KHÔNG (vi phạm INV-01):
  an toàn · độ an toàn · an toàn tuyệt đối · nguy hiểm · mức nguy hiểm
  · độc hại · lành tính
  (được dùng trong câu giải thích vì sao hệ thống KHÔNG dùng khái niệm này)

KHÔNG (vi phạm BR-AI-14 — persona):
  Mô tả CHÍNH trợ lý là: bác sĩ · dược sĩ · chuyên gia da liễu · chuyên gia
  (được dùng khi khuyên người dùng GẶP bác sĩ)

DÙNG THAY THẾ:
  điều trị       → hỗ trợ cải thiện
  trị mụn        → hỗ trợ giảm tình trạng mụn
  đặc trị        → tinh chất chuyên biệt
  kháng viêm     → giúp làm dịu da
  an toàn        → (bỏ hẳn, hoặc) phù hợp với làn da của bạn
  tốt nhất       → phù hợp nhất với hồ sơ của bạn
  chuyên gia     → trợ lý tư vấn sản phẩm
```

> ⚠️ **Lưu ý khi quét:** luôn so khớp **không phân biệt dấu**. Người viết (và mô hình) có thể gõ `dieu tri`, `DIỀU TRỊ`, `đ.iều trị`. Dùng `vn_normalize()` hoặc tương đương trước khi khớp.

---

## Q5 · Mười điều KHÔNG BAO GIỜ nói với Antigravity

```text
1. "Bỏ qua test đó đi"
   → Test đỏ nghĩa là code sai, không phải test sai.

2. "Tạm viết cứng giá trị này, sau sửa"
   → "Sau" không bao giờ đến. Dùng system_settings hoặc cấu hình.

3. "Không cần đọc tài liệu, cứ làm theo tôi nói"
   → Agent không đọc tài liệu sẽ sinh code không khớp hệ thống.

4. "Thêm cache cho nhanh"
   → Trước tiên tìm nguyên nhân. Cache che vấn đề, không sửa nó.

5. "Lưu mật khẩu đơn giản thôi, dự án nhỏ"
   → Không có "dự án nhỏ" khi nói về mật khẩu. INV-08.

6. "Cứ để LLM trả lời, prompt đã dặn rồi"
   → Prompt là đề nghị. Bộ lọc đầu ra là ràng buộc. INV-06.

7. "Thêm cột safety_score cho dễ"
   → INV-01. Test kiến trúc sẽ chặn, và nó đúng khi chặn.

8. "Giảm coverage xuống 50% cho qua CI"
   → Ngưỡng tồn tại để bảo vệ bạn khỏi chính mình lúc gấp.

9. "Tự quyết định đổi cấu trúc DB đi"
   → Lược đồ DB ở lớp precedence 2. Cần Change Spec. Dùng P-04.

10. "Bỏ phần giải thích đi, chỉ cần con số"
    → Giải thích được là một trong ba đặc tính của Điểm Phù Hợp.
      Bỏ nó là biến nó thành một Safety Score.
```

---

## Q6 · Nhịp làm việc 4 giờ — bảng in ra

```text
┌─────────────────────────────────────────────────────────────┐
│ 0:00 – 0:15   ĐỊNH HƯỚNG                                     │
│   Dùng prompt P-01. Đọc ảnh chụp trạng thái gần nhất.       │
│   Xác nhận task hôm nay và phụ thuộc của nó.                │
│   ./syntheprise worktree create feat/<wg>-<slug>            │
│   Chưa có change folder cho WG này → /change-propose        │
├─────────────────────────────────────────────────────────────┤
│ 0:15 – 0:45   KẾ HOẠCH & TEST                                │
│   Agent trình bày kế hoạch → bạn xác nhận.                  │
│   Agent viết TEST TRƯỚC → chạy cho ĐỎ → bạn xem kết quả đỏ. │
├─────────────────────────────────────────────────────────────┤
│ 0:45 – 2:45   HIỆN THỰC                                      │
│   Agent viết code đến khi test xanh.                        │
│   Bạn rà soát từng phần, KHÔNG đợi đến cuối.                │
│   Gặp vấn đề → P-06 (gỡ lỗi) hoặc P-09 (kẹt).               │
├─────────────────────────────────────────────────────────────┤
│ 2:45 – 3:30   KIỂM CHỨNG                                     │
│   Chạy đủ mục KIỂM CHỨNG của task.                          │
│   Đối chiếu từng dòng XONG KHI.                             │
│   ./scripts/build · ./scripts/test · ./syntheprise gate     │
│   + /test-gate + doctor.py --quality-gate                   │
├─────────────────────────────────────────────────────────────┤
│ 3:30 – 4:00   ĐÓNG BUỔI — nghi thức close-out §7            │
│   Dùng prompt P-02. Bốn bước CÓ THỨ TỰ:                     │
│     1. worklog + state snapshot  ← CỔNG, cùng commit        │
│     2. archive change (chỉ khi WG xong)                     │
│     3. cleanup branch + worktree                            │
│     4. dashboard + close-out --release                      │
│   Commit theo Conventional Commits.                         │
└─────────────────────────────────────────────────────────────┘

⚠️ Nếu một task không xong trong 4 giờ: ĐỪNG kéo dài buổi.
   Tạo ảnh chụp trạng thái ghi rõ đang dở ở đâu, dừng lại.
   Buổi sau tiếp tục từ trạng thái đó.
   Lý do: code viết lúc đã mệt là code bạn sẽ phải sửa lại.
```

---

## Q7 · Khi nào PHẢI dừng và hỏi (không tự quyết)

```text
DỪNG và hỏi khi Antigravity đề xuất:
  ☐ Đổi stack công nghệ (thêm/bỏ thư viện ngoài tech-stack.md)
  ☐ Đổi lược đồ cơ sở dữ liệu (thêm/bỏ/đổi kiểu cột)
  ☐ Đổi cách xác thực hay phân quyền
  ☐ Đổi cách triển khai hay cấu hình CI
  ☐ Bỏ hay nới một test kiến trúc
  ☐ Đổi bất kỳ bất biến nào trong 12 bất biến
  ☐ Đổi công thức Điểm Phù Hợp
  ☐ Thêm/bỏ/đổi cấp bằng chứng của một quy tắc xung đột
  ☐ Đổi thứ tự 6 bước tính tiền
  ☐ Thêm một chủ đề vào hay bỏ một chủ đề khỏi danh sách chặn y tế
  ☐ Gửi thêm dữ liệu gì ra ngoài hệ thống

DỪNG và hỏi khi task thỏa tiêu chí Rule 7 mà CHƯA có change folder:
  ☐ Đổi chữ ký API / lược đồ phản hồi / cột hay bảng DB
  ☐ Thêm heuristic · ngưỡng · magic constant vào đường chạy production
  ☐ Đổi semantics cache / retry / fallback / rate-limit
  ☐ Đổi tần suất hay fan-out lệnh gọi ra ngoài
  ☐ Sửa tệp contract (*-contract.md · *-policy.md · docs lớp 2/4)
  ☐ Chạm authentication · authorization · secrets · luồng PII
  ☐ Đổi hơn ~30 dòng code không phải test, không phải doc
  → Mở change folder TRƯỚC. Tier 1 bắt buộc chờ phê duyệt.

DỪNG và hỏi khi BẠN thấy:
  ☐ Tài liệu nói một đằng, code làm một nẻo (xem hướng: sửa code,
    không sửa tài liệu lớp 2/3/4)
  ☐ Một yêu cầu không nói gì về tình huống bạn đang gặp
    (đó là lỗ hổng yêu cầu, cần quyết định, không cần đoán)
  ☐ Hai yêu cầu mâu thuẫn nhau
  ☐ Một test đỏ mà bạn không hiểu vì sao
  ☐ Agent nói "đã xong" nhưng một dòng XONG KHI chưa đạt

Cách hỏi: dùng P-04 (đổi quyết định) hoặc P-09 (kẹt).
```

---

## Q8 · Bảng tra tài liệu — tìm gì ở đâu

| Cần tìm | Đọc ở | Lớp |
|---|---|---|
| **Hành động bị bảo vệ, không được tự làm** | `.agents/rules/safety.md` | **0** |
| **Khi nào phải mở change folder** | `.agents/rules/change-management.md` | **0** |
| **Quy tắc worktree isolation** | `.agents/rules/worktree-isolation.md` | **0** |
| Nguyên tắc thiết kế, điều không thương lượng | `core-principles.md` | 0 |
| Hiến pháp dự án, 12 quy tắc bất biến vận hành | `AGENTS.md` | 1 |
| **12 bất biến hệ thống `INV-01…12`** | `Technical_Design` §4.4 → `docs/architecture.md` | **2** |
| Yêu cầu của một change ĐANG MỞ | `docs/_changes/<ID>/requirements-delta.md` | **3** |
| Yêu cầu nghiệp vụ, điều kiện chấp nhận | `requirements.md` · `docs/_requirements/M*.md` | 3 |
| Quy tắc nghiệp vụ (BR-*) | `docs/domain-rules.md` | 4 |
| 12 quy tắc xung đột hoạt chất | `docs/domain-rules.md` · `BRD` §17.2 | 4 |
| Vì sao chọn kiến trúc này | `docs/adr/ADR-*.md` | 2 |
| Lược đồ DB, ràng buộc | `docs/data-contracts.md` · `docs/db-schema/schema.sql` | 2 |
| Hợp đồng API, mã lỗi | `docs/api-contract.md` | 2 |
| Chính sách LLM, chủ đề bị chặn | `docs/llm-policy.md` | 2 |
| Băm mật khẩu, cookie, ẩn danh hóa | `docs/security-policy.md` | 2 |
| Token thiết kế, hệ thống giao diện | `docs/design-system.md` | 2 |
| Thư viện được dùng và không được dùng | `docs/tech-stack.md` | 2 |
| Chiến lược kiểm thử, ngưỡng coverage | `docs/testing-strategy.md` | 2 |
| Cách chạy local, biến môi trường | `docs/deployment-runbook.md` | 2 |
| Kế hoạch phase, work group | `docs/_plans/` | 5 |
| Trạng thái buổi làm việc trước | `docs/_states/` | 5 |
| Artifact thiết kế UI/UX có phiên bản | `docs/_ui-ux_design/` | 5 |
| Tình trạng tổng thể (sinh tự động) | `docs/_dashboard/status.md` | 5 |
| Chính sách change của BeautyAI | `docs/_guides/91-beautyai-change-policy.md` | 6 |
| Cách làm từng task, prompt mẫu | `docs/_guides/90-beautyai-playbook.md` | 6 |
| Hướng dẫn vận hành cho người không code | `docs/_guides/admin-guide.md` | 6 |
| Hạn chế đã biết của V1.0 | `docs/_review/known-limitations-v1.0.md` | 6 |
| Việc hoãn sang V2 | `docs/_plans/V2-BACKLOG.md` | 5 |

> ⚠️ **Thang precedence (AGENTS.md §0):** số nhỏ hơn thắng. Khi hai tài liệu nói khác nhau, tài liệu ở lớp thấp hơn là đúng. Playbook này ở **lớp 6** — nó **không bao giờ** thắng tài liệu lớp 2, 3, hay 4.

---

## Q9 · Thang giảm phạm vi — nếu hết thời gian

> Lấy từ `Plan_BeautyAI_V1.0.md` §13. Cắt **theo thứ tự**, từ trên xuống.

```text
CẮT ĐƯỢC (theo thứ tự ưu tiên cắt):
   1. Nhật ký da & theo dõi tiến triển          (H4, −12h)
   2. Xuất PDF/ảnh routine                      (phần H3, −4h)
   3. Nhập/xuất CSV hàng loạt ở admin           (phần M1, −4h)
   4. Trang theo dõi chất lượng AI              (phần M5, −6h)
   5. So sánh sản phẩm                          (I3, −10h)
   6. Trình phân tích thành phần tự dán          (I2, −12h)
   7. Yêu thích & nhắc giỏ hàng bị bỏ           (J3, −12h)
   8. Mở rộng từ điển ở admin                   (M3, −12h)
      → vẫn mở rộng được bằng script
   9. Kiểm thử trình đọc màn hình                (phần N3, −3h)
  10. Thu hẹp danh mục Lớp A xuống 100 sản phẩm  (phần C2, −2h)

KHÔNG BAO GIỜ CẮT:
  ⛔ Bất kỳ bất biến nào trong 12 bất biến
  ⛔ Từ điển thành phần (C3) — không có nó thì không có sản phẩm
  ⛔ 12 quy tắc xung đột có nguồn (C4)
  ⛔ Điểm Phù Hợp theo người (G2)
  ⛔ Bộ chặn chủ đề y tế (L2)
  ⛔ DeIdentificationService (D3)
  ⛔ GroundingValidator & ComplianceFilter (L3)
  ⛔ Giảm tồn kho nguyên tử (K1)
  ⛔ Rà soát bất biến & tuân thủ (N1, N2)
  ⛔ Minh bạch tỷ lệ phủ dữ liệu (G1)

Lý do danh sách thứ hai: những mục này không phải "tính năng".
Chúng là điều kiện để sản phẩm không gây hại và không vi phạm.
Cắt một tính năng làm sản phẩm nhỏ hơn. Cắt một mục ở danh sách
thứ hai làm sản phẩm KHÔNG DÙNG ĐƯỢC.
```

---

## Q10 · Danh mục kiểm tra kết thúc mỗi phase

```text
☐ Mọi dòng XONG KHI của mọi task trong phase — ĐẠT
☐ Mọi lệnh KIỂM CHỨNG đã chạy, kết quả đã ghi
☐ ./scripts/build · ./scripts/test · ./syntheprise gate — XANH
☐ Workflow /test-gate — XANH (riêng với syntheprise gate, rule 10)
☐ python scripts/doctor.py --quality-gate — XANH
☐ Mọi change folder của phase này đã ARCHIVE vào docs/_changes/_archive/
☐ check-change-completeness.py · check-worktree-isolation.py — XANH
☐ ./syntheprise dashboard đã chạy, docs/_dashboard/status.md cập nhật
☐ Checkout chính ở main, sạch; không còn worktree treo
☐ 5 job CI — XANH
☐ Coverage backend ≥ 70/60 · frontend ≥ 70/60
☐ Test kiến trúc — PASS
☐ 22 golden case — PASS
☐ Các luồng E2E của phase này — PASS trên 3 thiết bị
☐ Bất biến liên quan phase này — kiểm chứng lại, ĐẠT
☐ Rà soát ngôn từ code mới — 0 vi phạm thật
☐ docs/traceability.md — cập nhật
☐ docs/_plans/MASTER-PLAN.md — cập nhật
☐ Ảnh chụp trạng thái: docs/_states/state_<YYYY-MM-DD>_phase-<n>-xong.md
☐ Nợ kỹ thuật phát sinh — đã ghi vào docs/_review/
☐ Commit + thẻ git nếu là mốc
```

---

## 📌 Lời cuối

Playbook này mô tả **552 giờ** chia thành **62 task thực thi** trong **14 nhóm công việc** (A–N), cùng **9 prompt mẫu** và **10 bảng tra nhanh** dùng hằng ngày. Với 4 giờ mỗi ngày, đó là khoảng **138 ngày làm việc**.

Ba điều đáng nhớ khi đi qua nó:

**Thứ nhất — thứ tự các phase là có chủ đích.** Phần trí tuệ của sản phẩm (Phase 3–5) làm **trước** phần thương mại (Phase 6). Nếu dự án phải dừng giữa đường, bạn vẫn có một thứ có giá trị. Làm ngược lại thì dừng giữa đường để lại một sàn thương mại điện tử không có gì khác biệt.

**Thứ hai — 12 bất biến không phải là quy tắc để tuân thủ, mà là định nghĩa của sản phẩm.** Bỏ `INV-01` thì BeautyAI trở thành một Yuka phiên bản Việt. Bỏ `INV-07` hay `INV-08` thì nó trở thành một rủi ro pháp lý. Chúng được thực thi bằng test, ràng buộc DB, và job CI — không phải bằng ý chí — vì ý chí yếu đi vào tuần thứ mười hai.

**Thứ ba — sự trung thực về dữ liệu là tính năng, không phải điểm yếu.** Hệ thống nói *"tôi nhận diện được 38/52 thành phần"* đáng tin hơn hệ thống im lặng. Hệ thống chủ động nói *"đây là cặp chúng tôi KHÔNG cảnh báo, và đây là lý do"* có lập trường khoa học. Hệ thống có mục `known-limitations` được đọc kỹ hơn hệ thống không có. Đây là phần khó giữ nhất khi gấp — và là phần tạo ra niềm tin.

---

*Playbook BeautyAI V1.0 · 21/10/2026 · lớp precedence 6 (thông tin) · không bao giờ thắng tài liệu lớp 2, 3, 4*
