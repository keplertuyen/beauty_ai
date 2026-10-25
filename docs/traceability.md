---
doc: traceability
title: Ma Trận Truy Xuất Yêu Cầu (Requirements Traceability Matrix) — BeautyAI Platform
status: draft
precedence: 2
owner: QA / Tech Lead
last_reviewed: 2026-10-25
---

# Ma Trận Truy Xuất Yêu Cầu (Traceability Matrix) — BeautyAI Platform

## Purpose
Tạo chuỗi liên kết xuyên suốt từ mục tiêu kinh doanh đến điều kiện chấp nhận, ca kiểm thử và việc triển khai thực tế (`AGENTS.md §2.8`).

## Matrix
| Business Goal | Requirement ID | Acceptance Criteria ID | Test Case ID | Implementation Task / WG | PR / Commit | Release | Status |
|---|---|---|---|---|---|---|---|
| BO-01 Tìm kiếm & Lọc thông minh | FR-AUTH-01 | AC-AUTH-01 | TC-AUTH-01 | WG-P2-01 | — | v1.0 | Ready for implementation |
| BO-01 Tìm kiếm & Lọc thông minh | FR-CAT-01 | AC-CAT-01 | TC-CAT-01 | WG-P3-01 | — | v1.0 | Ready for implementation |
| BO-01 Tìm kiếm & Lọc thông minh | FR-CAT-02 | AC-CAT-02 | TC-CAT-02 | WG-P3-01 | — | v1.0 | Ready for implementation |
| BO-04 Minh bạch thành phần INCI | FR-PDP-01 | AC-PDP-01 | TC-PDP-01 | WG-P3-02 | — | v1.0 | Ready for implementation |
| BO-04 Minh bạch thành phần INCI | FR-PDP-02 | AC-PDP-02 | TC-PDP-02 | WG-P3-02 | — | v1.0 | Ready for implementation |
| BO-02 Điểm Phù Hợp theo làn da | FR-PDP-03 | AC-PDP-03 | TC-PDP-03 | WG-P3-02 | — | v1.0 | Ready for implementation |
| BO-03 Cảnh báo dị ứng cá nhân | FR-SKIN-01 | AC-SKIN-01 | TC-SKIN-01 | WG-P4-01 | — | v1.0 | Ready for implementation |
| BO-03 Cảnh báo dị ứng cá nhân | FR-SKIN-02 | AC-SKIN-02 | TC-SKIN-02 | WG-P4-01 | — | v1.0 | Ready for implementation |
| BO-01 Chẩn đoán Skin Quiz 4 tầng | FR-QUIZ-01 | AC-QUIZ-01 | TC-QUIZ-01 | WG-P4-02 | — | v1.0 | Ready for implementation |
| BO-01 Chẩn đoán Skin Quiz 4 tầng | FR-QUIZ-02 | AC-QUIZ-02 | TC-QUIZ-02 | WG-P4-02 | — | v1.0 | Ready for implementation |
| BO-02 Xây dựng chu trình Routine | FR-QUIZ-03 | AC-QUIZ-03 | TC-QUIZ-03 | WG-P4-03 | — | v1.0 | Ready for implementation |
| BO-04 Phân tích thành phần INCI | FR-ING-01 | AC-ING-01 | TC-ING-01 | WG-P5-02 | — | v1.0 | Ready for implementation |
| BO-03 Phát hiện xung đột hoạt chất | FR-CONF-01 | AC-CONF-01 | TC-CONF-01 | WG-P5-01 | — | v1.0 | Ready for implementation |
| BO-03 Phát hiện xung đột hoạt chất | FR-CONF-02 | AC-CONF-02 | TC-CONF-02 | WG-P5-01 | — | v1.0 | Ready for implementation |
| BO-01 So sánh sản phẩm song song | FR-COMP-01 | AC-COMP-01 | TC-COMP-01 | WG-P5-04 | — | v1.0 | Ready for implementation |
| BO-02 Giỏ hàng & phát hiện xung đột | FR-CART-01 | AC-CART-01 | TC-CART-01 | WG-P6-02 | — | v1.0 | Ready for implementation |
| BO-02 Voucher đa tầng | FR-VOUCH-01 | AC-VOUCH-01 | TC-VOUCH-01 | WG-P6-03 | — | v1.0 | Ready for implementation |
| BO-02 Đơn hàng & trừ kho nguyên tử | FR-ORD-01 | AC-ORD-01 | TC-ORD-01 | WG-P6-04 | — | v1.0 | Ready for implementation |
| BO-02 Thanh toán VNPay & COD | FR-PAY-01 | AC-PAY-01 | TC-PAY-01 | WG-P6-05 | — | v1.0 | Ready for implementation |
| BO-05 Trợ lý AI Lumi 3 tầng | FR-CHAT-01 | AC-CHAT-01 | TC-CHAT-01 | WG-P7-01 | — | v1.0 | Ready for implementation |
| BO-05 Trợ lý AI Lumi 3 tầng | FR-CHAT-02 | AC-CHAT-02 | TC-CHAT-02 | WG-P7-02 | — | v1.0 | Ready for implementation |
| BO-05 Trợ lý AI Lumi 3 tầng | FR-CHAT-03 | AC-CHAT-03 | TC-CHAT-03 | WG-P7-03 | — | v1.0 | Ready for implementation |
| BO-05 Handoff tư vấn viên Zalo | FR-CHAT-07 | AC-CHAT-07 | TC-CHAT-07 | WG-P7-05 | — | v1.0 | Ready for implementation |
| BO-07 Quản trị sàn & danh mục | FR-ADM-01 | AC-ADM-01 | TC-ADM-01 | WG-P8-02 | — | v1.0 | Ready for implementation |
| BO-07 Nhật ký kiểm toán an ninh | FR-ADM-10 | AC-ADM-10 | TC-ADM-10 | WG-P8-01 | — | v1.0 | Ready for implementation |

## Rules
- Mọi yêu cầu cấp Must bắt buộc có ít nhất 1 AC và 1 Test Case trước khi Dev tiến hành triển khai.
- Mọi change request bắt buộc liên kết với ít nhất 1 mã yêu cầu hoặc requirement delta.

---

## 15.3. Truy xuất Mục tiêu kinh doanh → Yêu cầu → Đo lường
- **BO-01 Tìm đúng sản phẩm nhanh hơn:** `FR-QUIZ-01`→`03`, `FR-CAT-03`→`07` | Đo lường: Tỷ lệ hoàn tất quiz ≥ 70% | Sự kiện: `quiz_started`, `quiz_completed`
- **BO-02 Chuyển lời khuyên thành đơn hàng:** `FR-QUIZ-06`, `FR-CHAT-06`, `FR-CART-*` | Đo lường: Tỷ lệ Chat-to-Cart ≥ 25% | Sự kiện: `routine_saved`, `add_to_cart_from_chat`
- **BO-03 Giảm rủi ro mua sai:** `FR-CONF-01`→`04`, `FR-SKIN-03` | Đo lường: 100% giỏ có xung đột được cảnh báo | Sự kiện: `conflict_detected`, `conflict_dismissed`
- **BO-04 Tăng minh bạch thành phần:** `FR-PDP-02`→`04`, `FR-ING-*`, `FR-ADM-04` | Đo lường: ≥ 90% sản phẩm có hồ sơ INCI | Sự kiện: Truy vấn thành phần, mở PDP
- **BO-05 Giảm tải hỗ trợ thủ công:** `FR-CHAT-02`→`03`, `FR-CHAT-07` | Đo lường: ≥ 60% hội thoại giải quyết không cần chuyển người | Sự kiện: `chat_session_started`, `handoff_requested`
- **BO-06 Đảm bảo chất lượng AI:** §14.5 | Đo lường: 100% golden test pass | Sự kiện: Kết quả chạy golden test
- **BO-07 Vận hành được bởi 1 người:** `FR-ADM-*` | Đo lường: ≤ 2 phút/tác vụ quản trị | Sự kiện: Đo tay trong UAT
- **BO-08 Hoàn thành cam kết:** Toàn bộ | Đo lường: 100% FR Must có bằng chứng | Sự kiện: Ma trận §15.2

---

## 15.4. Truy xuất Nỗi đau người dùng → Giải pháp
- **P1 Ma trận INCI không đọc được:** `FR-PDP-02`, `FR-ING-01`→`04`, từ điển tiếng Việt (`BR-ING-04c`) | Persona: PER-01, PER-02
- **P2 Không biết sản phẩm có phù hợp da mình:** `FR-PDP-03` (Điểm Phù Hợp), `FR-PDP-12` ("người có da giống bạn"), `FR-QUIZ-*` | Persona: PER-01, PER-02
- **P3 Tự phối hoạt chất gây tổn thương da:** `FR-CONF-01`→`05`, `FR-QUIZ-05` | Persona: PER-01
- **P4 Không biết mình dị ứng chất nào:** `FR-SKIN-02`→`04` | Persona: PER-02
- **P5 Rào cản mua mỹ phẩm quốc tế:** Song tệ (`BR-PRICE-*`), nội dung tiếng Việt (`I18N-*`), `FR-CHAT-*` | Persona: PER-03
