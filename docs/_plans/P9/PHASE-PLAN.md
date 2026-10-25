---
doc: phase-plan-p9
title: Phase 9 Plan — KIỂM THỬ TOÀN DIỆN, GIA CỐ & DEMO CUỐI
status: draft
precedence: 5
owner: PM / Tech Lead
last_reviewed: 2026-10-25
---

# PHASE 9 — KIỂM THỬ TOÀN DIỆN, GIA CỐ & DEMO CUỐI

# 11. PHASE 9 — KIỂM THỬ TOÀN DIỆN, GIA CỐ & DEMO CUỐI

| | |
|---|---|
| **Mục tiêu** | ✅ **NGHIỆM THU** — đủ bằng chứng chất lượng, demo chạy ổn định kể cả khi mất mạng |
| **Khối lượng** | **36 giờ** · 9 ngày |
| **Vì sao là phase riêng** | Nếu gộp testing vào phase tính năng, nó **sẽ bị cắt** khi áp lực tiến độ. `BO-06` và `BO-08` yêu cầu bằng chứng, không yêu cầu lời hứa |

### `WG-P9-01` — Hoàn thiện 8 luồng E2E · **12h**

| Task | Giờ | Luồng |
|---|---|---|
| `E2E-01` Khách mới → mua hàng COD | 1,5 | — |
| `E2E-02` Quiz → Routine → Chat-to-Cart → VNPay | 2 | — |
| `E2E-03` Cảnh báo dị ứng xuyên hệ thống (5 điểm hiển thị) | 1,5 | — |
| `E2E-04` Phát hiện xung đột đúng mức độ (gồm đính chính huyền thoại) | 1,5 | — |
| `E2E-05` Trợ lý 3 tầng + chuyển tiếp Zalo | 2 | — |
| `E2E-06` Suy giảm có kiểm soát khi AI lỗi | 1,5 | — |
| `E2E-07` Vận hành Admin trọn vòng | 1 | — |
| `E2E-08` Kiểm soát quyền truy cập | 1 | — |

### `WG-P9-02` — Rà soát bất biến & bảo mật · **8h**

| Task | Giờ | Bất biến |
|---|---|---|
| ⭐ Rà soát toàn giao diện: **không có chỉ số "an toàn/nguy hiểm" nào** | 1 | `INV-01` |
| ⭐ Rà soát toàn giao diện: **không có hàm ý nghề y nào** | 1 | `BR-AI-14` |
| ⭐ Rà soát log: **không có dữ liệu cá nhân chưa che** | 1,5 | `NFR-PRIV-10` |
| ⭐ Rà soát tải gửi LLM: **không có dữ liệu gắn danh tính** | 1 | `INV-04` |
| Thử lỗ hổng truy cập: đổi mã trên địa chỉ cho mọi endpoint có mã | 1,5 | `NFR-SEC-03` |
| Kiểm tra bí mật: `gitleaks` toàn lịch sử git | 0,5 | `NFR-SEC-05` |
| Kiểm tra thông báo lỗi: không có dấu vết ngăn xếp / tên bảng / phiên bản | 1 | `NFR-SEC-06` |
| Kiểm tra header bảo mật + CSP | 0,5 | §11.4 TD |

### `WG-P9-03` — Khả năng truy cập & trạng thái màn hình · **6h**

| Task | Giờ | NFR |
|---|---|---|
| Chạy `axe` cho 12 màn hình luồng chính; sửa lỗi nghiêm trọng | 2,5 | `NFR-A11Y-01` |
| Kiểm tra điều hướng **chỉ bằng bàn phím** cho luồng mua hàng | 1,5 | `NFR-A11Y-03` |
| ⭐ Rà soát **đủ 4 trạng thái** trên mọi màn hình đã triển khai | 1,5 | `UI-05` |
| Kiểm tra `prefers-reduced-motion` + độ tương phản | 0,5 | `NFR-A11Y-04`, `07` |

### `WG-P9-04` — Hiệu năng & chất lượng dữ liệu · **4h**

| Task | Giờ | NFR |
|---|---|---|
| Đo & xác nhận 12 ngưỡng `NFR-PERF-01`→`12` | 2 | — |
| Kiểm thử tải 20 người dùng đồng thời | 1 | `NFR-PERF-12` |
| Xác nhận lại 8 ngưỡng chất lượng dữ liệu `DQ-01`→`08` | 0,5 | §9.5 BRD |
| Kiểm tra kích thước gói JS ≤ 300KB gzip | 0,5 | `NFR-PERF-11` |

### `WG-P9-05` — Chuẩn bị demo & bàn giao · **6h**

| Task | Giờ | Rủi ro |
|---|---|---|
| ⭐ **Chế độ demo ngoại tuyến** — `./scripts/demo --offline` + làm nóng đệm AI | 1,5 | `RISK-16` |
| ⭐ **Sao lưu + PHỤC HỒI THỬ** thành công | 1 | `NFR-REL-05` |
| Tạo 5 tài khoản khách mẫu có hồ sơ da khác nhau | 0,5 | §9.6 BRD |
| ⭐ **TỔNG DUYỆT lần 1 (online)** — toàn bộ luồng demo | 1 | `RISK-16` |
| ⭐ **TỔNG DUYỆT lần 2 (ngoại tuyến)** | 1 | `RISK-16` |
| Hoàn thiện ma trận truy xuất: **mọi FR Must có bằng chứng** | 0,5 | `BO-08` |
| `/release-baseline`: gắn thẻ phiên bản + CHANGELOG | 0,5 | `AGENTS.md §2.11` |

## 11.1. Tiêu chí nghiệm thu dự án (18 điểm — `BRD` §14.3)

```text
☐  1. 100% FR mức Must đã triển khai và có bằng chứng kiểm thử
☐  2. Mọi quy tắc nghiệp vụ ở BRD §7 có ít nhất một test tự động
☐  3. 8 luồng E2E chạy thành công
☐  4. 22/22 golden test pass                                          (BO-06)
☐  5. Coverage: dòng ≥ 70% · nhánh ≥ 60%
☐  6. ⭐ Không còn chỉ số "an toàn/nguy hiểm" nào trên toàn giao diện  (INV-01)
☐  7. ⭐ Bộ lọc tuân thủ hoạt động ở đầu ra AI (thử 20 câu mồi)        (CMP-04)
☐  8. ⭐ Không dữ liệu gắn danh tính nào gửi tới nhà cung cấp LLM      (INV-04)
☐  9. ⭐ Disclaimer hiển thị ở đủ 4 vị trí                             (CMP-17)
☐ 10. ⭐ Admin không truy cập được hồ sơ da của khách                  (INV-07)
☐ 11. ⭐ Mật khẩu lưu dạng băm có muối (kiểm chứng bằng truy vấn DB)   (DC-19)
☐ 12. Mọi màn hình đã triển khai có đủ 4 trạng thái                   (UI-05)
☐ 13. Kiểm tra WCAG AA luồng chính — không còn lỗi nghiêm trọng
☐ 14. ./syntheprise gate pass
☐ 15. Không có bí mật nào trong mã nguồn hay lịch sử git
☐ 16. ⭐ Sao lưu đã được PHỤC HỒI THỬ thành công ít nhất một lần
☐ 17. Chất lượng dữ liệu đạt mọi ngưỡng ở BRD §9.5
☐ 18. Mọi tài liệu & ADR cập nhật khớp mã đã triển khai (doc-drift pass)
```

---

