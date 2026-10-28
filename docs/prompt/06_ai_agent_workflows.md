---
doc: prompt-ai-agent-workflows
title: Tổng Hợp Prompt Điều Phối AI Agent (Syntheprise Framework Workflows)
status: stable
precedence: 5
owner: AI Lead / Tech Lead
last_reviewed: 2026-10-28
---

# TỔNG HỢP PROMPT ĐIỀU PHỐI AI AGENT — Syntheprise Framework

> **Mục đích:** Tập hợp các prompt và quy trình slash-commands dùng để điều phối AI Coding Agents (Antigravity, GPT Codex, Claude Code) trong suốt vòng đời dự án BeautyAI.

---

## 🧭 Bảng Tra Cứu Slash Commands & Agent Prompts

### 1. Phân Tích & Đặc Tả Yêu Cầu (Requirements & Intake)
- **`/kickoff`**: Khởi động dự án mới từ ghi chú `docs/_intake/`, sinh bộ tài liệu chuẩn theo thang ưu tiên constitution.
- **`/requirements`**: Điền hoặc rà soát lỗ hổng yêu cầu người dùng (`requirements.md`, `docs/_requirements/`).
- **`/discovery`**: Chuyển đổi biên bản phỏng vấn khách hàng thành tài liệu yêu cầu có cấu trúc.

### 2. Thiết Kế Kiến Trúc & Quyết Định Kỹ Thuật (Architecture & Design)
- **`/architecture-options`**: Phân tích 2–3 phương án kiến trúc, đánh giá trade-offs, mức độ phù hợp và đề xuất giải pháp tối ưu.
- **`/adr`**: Soạn thảo Architecture Decision Record (ADR) bất biến lưu trữ vào `docs/adr/`.
- **`/ux-design`**: Lập bản thiết kế UI/UX (user flows, wireframes, component states) trước khi viết code giao diện.

### 3. Quy Trình QA-First & Kiểm Thử (Testing & QA)
- **`/qa-test-design`**: Thiết kế ma trận kiểm thử và tiêu chí nghiệm thu (Acceptance Criteria) TRƯỚC KHI lập trình viên cài đặt code, chống confirmation bias.
- **`/test-gate`**: Chạy toàn bộ các tầng kiểm thử (Architecture Tests, Unit Tests, Frontend Tests), chặn tiến trình nếu có lỗi.
- **`/quality-gate`**: Chạy bộ kiểm tra chất lượng Syntheprise Doctor (15 tiêu chí).

### 4. Quản Lý Thay Đổi & Thực Hiện (Change Management & Implementation)
- **`/change-propose`**: Tạo hồ sơ thay đổi chính thức tại `docs/_changes/<CHANGE-ID>/`.
- **`/change-design`**: Thiết kế kỹ thuật và chia nhỏ danh sách tasks cho yêu cầu thay đổi đã duyệt.
- **`/worklog`**: Cập nhật tiến độ liên tục vào Work-Group Plan.
- **`/change-archive`**: Hợp nhất thay đổi vào tài liệu nguồn và lưu trữ hồ sơ thay đổi vào `_archive/`.

### 5. Giám Sát & Trạng Thái (Monitoring & Snapshot)
- **`/dashboard`**: Tái tạo bảng điều khiển tổng hợp trạng thái dự án.
- **`/state`**: Ghi snapshot trạng thái làm việc cuối phiên vào `docs/_states/`.
- **`/release-baseline`**: Quy trình đóng gói bản phát hành: Deploy ➔ Migrate ➔ Smoke test ➔ Semver tag ➔ Cập nhật CHANGELOG.
