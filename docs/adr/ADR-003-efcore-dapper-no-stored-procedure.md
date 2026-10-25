---
doc: adr-adr-003
title: ADR-003 — Truy cập dữ liệu: EF Core làm chính, Dapper cho báo cáo
status: accepted
precedence: 2
owner: SA / Tech Lead
last_reviewed: 2026-10-25
---

# ADR-003 — Truy cập dữ liệu: EF Core làm chính, Dapper cho báo cáo


| | |
|---|---|
| **Trạng thái** | ✅ Đã chấp nhận |
| **Bối cảnh** | PRD v2.0 đề xuất "EF Core cho CRUD + Dapper kết hợp Stored Procedure cho báo cáo doanh thu". Cần quyết định có giữ cách tiếp cận lai này không. |

**Quyết định:** **Giữ cách tiếp cận lai, nhưng bỏ Stored Procedure.**

| Loại truy vấn | Công cụ | Lý do |
|---|---|---|
| CRUD nghiệp vụ, điều hướng quan hệ, migration | **EF Core 10 + Npgsql** | Năng suất cao; migration là nguồn chân lý của lược đồ; tận dụng ràng buộc & quan hệ đã khai báo |
| Truy vấn lọc danh mục phức tạp (lọc theo nhiều hoạt chất + chứng nhận + giá + sắp xếp) | **EF Core với truy vấn biên dịch**; nếu đo được là chậm thì chuyển sang **Dapper + SQL viết tay** | Đo trước, tối ưu sau (`NFR-PERF-03` = 500ms là ngưỡng quyết định) |
| Báo cáo tổng hợp (doanh thu theo ngày/tháng/quý, top sản phẩm) | **Dapper + SQL viết tay trong tệp `.sql` có phiên bản** | Truy vấn tổng hợp viết bằng SQL rõ ràng hơn LINQ; Dapper nhanh và nhẹ |
| ~~Stored Procedure~~ | ❌ **Không dùng** | Lý do: SP nằm **ngoài** hệ thống migration → dễ sai lệch giữa code và DB; khó review trong PR; khó kiểm thử. SQL viết tay trong tệp có phiên bản đạt được **cùng hiệu năng** mà **không mất khả năng kiểm soát** |

> **Đây là một thay đổi có chủ đích so với PRD v2.0.** Nếu Chủ sản phẩm muốn giữ Stored Procedure vì lý do học thuật (minh họa kỹ năng SQL), có thể giữ **một** SP minh họa cho báo cáo doanh thu, nhưng phải được quản lý trong migration. Cần quyết định — xem `OQ-TD-01`.

---




**Điều kiện xem lại quyết định:** Xem lại khi quy mô hệ thống vượt ngưỡng Tier 1 hoặc yêu cầu nghiệp vụ thay đổi.

**Bất biến phát sinh:** INV-02 (giao dịch tồn kho)
