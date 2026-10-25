---
doc: observability-runbook
title: Sổ Tay Khả Năng Quan Sát & Vận Hành (Observability Runbook) — BeautyAI Platform
status: draft
precedence: 2
owner: DevOps / Tech Lead
last_reviewed: 2026-10-25
---

# SỔ TAY QUAN SÁT & VẬN HÀNH — BeautyAI Platform

> Nguồn chân lý về cấu trúc nhật ký Serilog, mã tương quan correlation_id, điểm cuối kiểm tra sức khỏe /health và giám sát sự kiện nghiệp vụ (Precedence 2 — Contracts).

---

# 16. KHẢ NĂNG QUAN SÁT, CẤU HÌNH & VẬN HÀNH

## 16.1. Nhật ký

| Hạng mục | Thiết kế |
|---|---|
| **Thư viện** | Serilog, nhật ký có cấu trúc (JSON ra tệp, có màu ra console) |
| **Mã truy vết** | `TraceId` của ASP.NET Core được đưa vào mọi dòng log của một yêu cầu (`NFR-OBS-01`) |
| **Mức độ** | `Debug` (chỉ dev) · `Information` (sự kiện nghiệp vụ) · `Warning` (suy giảm, dữ liệu lạ) · `Error` (lỗi không mong đợi) |
| **Che dữ liệu** | `SensitiveDataMasker` lọc theo tên khóa: `*password*`, `*apikey*`, `*secret*`, `*token*`, `email`, `phone`, `address`, `connectionstring` (`NFR-PRIV-10`, `NFR-OBS-05`) |
| **Lưu trữ** | `logs/beautyai-YYYYMMDD.log`, luân chuyển hằng ngày, **giữ 30 ngày** (`NFR-PRIV-06`) |
| **Không bao giờ ghi** | Mật khẩu · bí mật · nội dung hội thoại chưa che · hồ sơ da gắn danh tính |

## 16.2. Cấu hình

**Ba lớp, ưu tiên từ dưới lên:**

```text
① appsettings.json                  ← mặc định, an toàn commit
② appsettings.{Environment}.json    ← ghi đè theo môi trường
③ Biến môi trường / .env            ← BÍ MẬT (BR-SEC-04)
④ Bảng app_settings trong DB        ← CẤU HÌNH NGHIỆP VỤ Admin sửa được
```

| Loại cấu hình | Nơi đặt | Ví dụ | Admin sửa được? |
|---|---|---|---|
| Bí mật | `.env` | khóa API, chuỗi kết nối, bí mật ký | ❌ |
| Hạ tầng | `appsettings.json` | cổng, origin CORS, mức log | ❌ |
| Chọn nhà cung cấp | Biến môi trường | `Providers__Llm=Gemini|Null` | ❌ |
| **Nghiệp vụ** | **`app_settings` (DB)** | tỷ giá, phí ship, hạn mức LLM, khung giờ hỗ trợ | ✅ (`FR-ADM-09`) |

**Truy cập cấu hình nghiệp vụ:**

```csharp
public interface ISettingsProvider {
    decimal  ExchangeRate       { get; }    // BR-PRICE-03
    decimal  ShippingFeeVnd     { get; }
    decimal  FreeShippingThresholdVnd { get; }
    decimal  ComboDiscountPercent { get; }
    TimeOnly SupportHoursStart  { get; }
    TimeOnly SupportHoursEnd    { get; }
    string?  ZaloOaUrl          { get; }
    int      LlmQuotaUserPerDay { get; }
    TimeSpan LlmTimeout         { get; }
    // … toàn bộ khóa ở §6.8
    void Invalidate();                       // gọi khi Admin lưu
}
```

Triển khai: đọc toàn bộ `app_settings` một lần, đệm trong tiến trình, `Invalidate()` khi Admin lưu → **giá VND toàn sàn đổi ngay** (`FR-ADM-08` AC-01).

> ⚠️ **Nguyên tắc `NFR-MAIN-04`:** nếu bạn thấy một con số trong code mà không phải `0`, `1`, hay hằng số toán học — **nó phải ở `app_settings` hoặc `appsettings.json`**. AI Code Agent đặc biệt hay viết cứng ngưỡng; đây là điểm cần chú ý khi review.

## 16.3. Điểm cuối kiểm tra sức khỏe

```jsonc
// GET /health  — NFR-OBS-03
{
  "status": "Healthy",              // Healthy | Degraded | Unhealthy
  "checks": {
    "application": { "status": "Healthy", "version": "1.0.0" },
    "database":    { "status": "Healthy", "latencyMs": 3 },
    "llm":         { "status": "Degraded", "provider": "Null",
                     "note": "Chưa cấu hình khóa API — trợ lý chạy ở Tầng 1" },
    "payment":     { "status": "Healthy", "provider": "VnPaySandbox" },
    "handoff":     { "status": "Healthy", "provider": "ZaloDeepLink" },
    "email":       { "status": "Degraded", "provider": "NoOp" }
  },
  "dataQuality": {                   // ⟸ hữu ích bất ngờ cho vận hành
    "productsWithIngredients": "92%",       // BO-04 · DQ-01
    "ingredientDictCoverage":  "87%",       // DQ-02
    "recommendationDataVersion": 3,
    "recommendationComputedAt": "2026-11-15T10:00:00Z"
  }
}
```

> 💡 **Quyết định đáng chú ý:** đưa **chất lượng dữ liệu** vào `/health`. Lý do: với hệ thống này, "khỏe" không chỉ là "tiến trình đang chạy" — nếu tỷ lệ phủ thành phần tụt xuống 40% thì tính năng cốt lõi mất giá trị dù mọi tiến trình đều sống. Đây là kiểm tra sức khỏe **theo nghiệp vụ**, không chỉ theo kỹ thuật.

## 16.4. Sự kiện nghiệp vụ cần ghi nhận (`NFR-OBS-04`)

| Sự kiện | Thuộc tính | Phục vụ KPI |
|---|---|---|
| `quiz_started` / `quiz_completed` | `sessionId`, `stepReached` | `BO-01` |
| `routine_shown` / `routine_add_to_cart` | `routineId`, `stepCount`, `totalUsd` | `BO-02` |
| `conflict_detected` | `severity`, `evidenceTier`, `ruleId`, `context` (cart/routine) | `BO-03` |
| `cart_adjusted_after_conflict` | `conflictId`, `action` | `BO-03` |
| `allergy_warning_shown` | `productId`, `ingredientCount` | `BO-03` |
| `conversation_resolved_tier` | `tier` (RULES/LLM/ZALO), `latencyMs` | `BO-05` |
| `handoff_requested` | `reason`, `profileConsentGiven`, `withinSupportHours` | `BO-05` |
| `llm_call` | `model`, `promptTokens`, `completionTokens`, `estimatedCostUsd`, `latencyMs` | `RISK-03` |
| `llm_degraded` | `reason` (quota/timeout/error) | `RISK-03` |
| `llm_hallucinated_product` | `droppedProductIds` | `RISK-04` — **tín hiệu chất lượng mô hình** |
| `compliance_filter_triggered` | `bannedTerm`, `action` (replaced/blocked) | `RISK-02` |
| `order_created` / `order_status_changed` | `orderCode`, `from`, `to` | `BO-02` |
| `suitability_score_shown` | `productId`, `score`, `factorCount` | `BO-04` |

> 📌 **`llm_hallucinated_product` là sự kiện quan trọng mà ít hệ thống ghi nhận.** Nó cho biết mô hình đang bịa bao nhiêu — số này tăng là tín hiệu phải xem lại prompt hoặc đổi mô hình. Không có nó thì không biết chặng 6 đang phải làm việc nhiều hay ít.

## 16.5. Bảng điều khiển vận hành (Admin)

| Khối | Nội dung | FR |
|---|---|---|
| Doanh thu | Hôm nay / 7 ngày / 30 ngày, biểu đồ | `FR-ADM-01`, `FR-ADM-11` |
| Đơn hàng | Số đơn theo trạng thái; đơn chờ xử lý | `FR-ADM-01` |
| Tồn kho | SP hết hàng / sắp hết (< 10) | `FR-ADM-12` |
| **Chất lượng dữ liệu** | Tỷ lệ phủ thành phần (`BO-04`), số thành phần chưa phân tích theo tần suất | `FR-ADM-12` |
| **Sử dụng AI** | Tỷ lệ giải quyết theo tầng (`BO-05`), **chi phí tích lũy** (`RISK-03`), số lần suy giảm, số lần bịa sản phẩm | `FR-ADM-14` AC-03 |
| **Chất lượng AI** | Tỷ lệ pass golden test lần gần nhất (`BO-06`), phản hồi hữu ích/không hữu ích | `FR-ADM-14` |
| Chuyển tiếp | Hàng đợi theo trạng thái, thời gian chờ trung bình | `FR-ADM-15` |
| Tuân thủ | Số lần bộ lọc quảng cáo kích hoạt (`RISK-02`) | — |

---

