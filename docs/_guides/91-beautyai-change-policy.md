---
doc: beautyai-change-policy
title: Chính Sách Quản Lý Thay Đổi & Quy Ước Change Folder — BeautyAI Platform
status: stable
precedence: 6
owner: Tech Lead / SA
last_reviewed: 2026-10-25
---

# CHÍNH SÁCH QUẢN LÝ THAY ĐỔI (CHANGE POLICY) — BEAUTYAI

> Tài liệu hướng dẫn thực thi AGENTS.md Rule 7 (Change/Delta Spec) và Rule 12 (Worktree Isolation) cho toàn bộ 47 Work Groups của dự án BeautyAI.

---

## 1. Bảng Quyết Định Quản Lý Thay Đổi (Change Decision Matrix)

| Hạng mục | Quy định cho BeautyAI |
|---|---|
| **Đơn vị mở change** | Một change folder cho **MỖI WORK GROUP** (tương ứng với các plan WG trong `docs/_plans/P1..P9/`) |
| **Loại mặc định** | `FASTLANE` (tiến độ nhanh, tối giản nhưng giữ vững nghiệm thu) |
| **Khi nào dùng `CHANGE`** | Khi có sửa đổi tài liệu Lớp 2 (Contracts: `api-contract`, `data-contracts`, `architecture`, `security-policy`, `llm-policy`, ADRs) hoặc Lớp 3/4 (`requirements.md`, `domain-rules.md`) |
| **Khi nào dùng `BUGFIX`** | Sửa lỗi của các hành vi / tính năng đã bàn giao (thường từ Phase 9+ hoặc hotfix sản phẩm) |
| **Quy ước CHANGE-ID** | `<WG-id>-<slug-ngắn>`, ví dụ: `WG-P1-04-arch-tests-ci`, `WG-P1-03-db-schema` |
| **Tier dự án** | **Tier 1** ⟹ Theo workflow `change-propose.md`, bước 5 **BẮT BUỘC DỪNG CHỜ PHÊ DUYỆT** của con người trước khi sinh code |

---

## 2. Bảy Tiêu Chí Bắt Buộc Của Rule 7 (AGENTS.md §2.7)

Một thay đổi **BẮT BUỘC** phải được tạo folder trong `docs/_changes/<CHANGE-ID>/` nếu thỏa mãn **BẤT KỲ MỘT** trong 7 tiêu chí sau:

1. **Thay đổi bề mặt hợp đồng (Contract surface):** Thay đổi chữ ký API, event signature, response schema, hoặc cột/bảng CSDL.
2. **Tham số heuristic / magic constant mới:** Giới thiệu ngưỡng mới, công thức chấm điểm, trọng số mới trong luồng xử lý sản xuất.
3. **Thay đổi ngữ nghĩa bộ nhớ đệm / thử lại / dự phòng / giới hạn tần suất:** Sửa đổi logic cache, retry, fallback, rate-limit.
4. **Thay đổi tần suất hoặc quạt ra (fan-out) của các lệnh gọi dịch vụ bên ngoài:** Bao gồm Gemini AI, Zalo, GHN, SeABank, v.v.
5. **Chỉnh sửa bất kỳ tệp hợp đồng nào:** (`*-contract.md`, `*-policy.md`, `architecture.md`, `domain-rules.md`, hoặc các tài liệu ở bậc 2/4 của thang Precedence Ladder).
6. **Chạm vào luồng xác thực, phân quyền, bí mật, hoặc dữ liệu cá nhân (PII):** Auth, Authorization, API Keys, Tokens, PII.
7. **Thay đổi nhiều hơn ~30 dòng code** không phải test và không phải doc.

### Nhận định áp dụng cho BeautyAI
Trong dự án BeautyAI, hầu như **mọi Work Group đều thỏa mãn ít nhất một trong 7 tiêu chí trên** (ví dụ: chạm API, DB schema, logic da liễu, gọi AI, hoặc vượt quá 30 dòng code). Do đó, quy tắc chuẩn cho BeautyAI là: **MẶC ĐỊNH MỞ CHANGE FOLDER CHO MỖI WORK GROUP**.

---

## 3. Quy Trình Vòng Đời Change & Worktree Chuẩn (4 Bước DoD Close-out)

Mỗi Work Group / Change tuân thủ nghiêm ngặt 4 bước:

1. **Khởi tạo Worktree & Change Folder:**
   ```bash
   ./syntheprise worktree create change/<WG-id>-<slug>
   ./syntheprise change new "<WG-id> <tên task>" --type FASTLANE
   ```
2. **Đặc tả Delta & Phê duyệt (Tier 1 Gate):**
   - Điền `proposal.md` và `requirements-delta.md` (dùng thẻ `ADDED`, `MODIFIED`, `REMOVED`, `DEPRECATED`).
   - Trình bày giải pháp cho con người và chờ phê duyệt rõ ràng.
3. **Thực thi, Viết Test & Chạy Quality Gate:**
   - Dev thực thi theo test design đã duyệt.
   - `./syntheprise gate` và `./scripts/test` phải **XANH 100%**.
4. **Close-out & Lưu Trữ (Thứ tự bắt buộc không được đảo):**
   - **Bước 4a — State Snapshot trước:** Cập nhật worklog trong `docs/_plans/P{x}/WG-{id}.md` và viết `docs/_states/state_YYYY-MM-DD_slug.md`.
   - **Bước 4b — Archive:** Di chuyển change vào `docs/_changes/_archive/` và merge delta vào tài liệu canonical.
   - **Bước 4c — Cleanup:** Xóa worktree và branch sau khi đã merge vào `main`.
   - **Bước 4d — Mark Closed:** Đánh dấu hoàn tất và giải phóng session lock.
