---
doc: tech-solutions-phase-1
title: Thiết Kế Kỹ Thuật & Kiến Trúc Hệ Thống (Technical Solutions) — BeautyAI Phase 1 (MVP)
status: stable
precedence: 2
owner: Solution Architect / Tech Lead
last_reviewed: 2026-10-26
---

# THIẾT KẾ KỸ THUẬT & KIẾN TRÚC HỆ THỐNG — BEAUTYAI PHASE 1 (MVP)

> **Mục tiêu:** Cung cấp giải pháp kỹ thuật, lược đồ cơ sở dữ liệu và hợp đồng kiến trúc chuẩn xác phục vụ triển khai Phase 1 MVP trong 30 ngày cho Solo Developer.
> **Ràng buộc công nghệ bắt buộc:**
> - **Backend:** C# .NET 10 (ASP.NET Core Web API, EF Core 10 + Dapper).
> - **Frontend:** React + Vite (khai thác trực tiếp mã nguồn tại `docs/_ui-ux_design/phase_1/frontend/`).
> - **Database:** PostgreSQL 17 (Docker cục bộ).
> - **AI Integration:** Google Gemini API (Grounding + System Prompt Guardrails).

---

## 1. Kiến Trúc Tổng Thể (Clean Architecture)

Hệ thống tuân thủ mô hình **Clean Architecture 4 tầng** độc lập, được bảo vệ tuyệt đối bằng bộ kiểm thử kiến trúc máy thực thi [`tests/BeautyAI.ArchitectureTests`](file:///Users/trucuyen/Documents/beauty_ai/tests/BeautyAI.ArchitectureTests):

```text
┌─────────────────────────────────────────────────────────────┐
│                 BeautyAI.Api (ASP.NET Core 10)              │
│       - Controllers / Minimal APIs                          │
│       - Build-time OpenAPI Generator (ADR-008)              │
│       - Auth Middleware, Global Exception & CORS            │
└──────────────────────────────┬──────────────────────────────┘
                               │ phụ thuộc
┌──────────────────────────────▼──────────────────────────────┐
│           BeautyAI.Application (Logic Nghiệp Vụ)            │
│       - DTOs, Use Cases / Command-Query Handlers            │
│       - Repository & Provider Interfaces (I*Repository)     │
│       - KHÔNG phụ thuộc EF Core, KHÔNG phụ thuộc HTTP       │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               │ phụ thuộc                    │ phụ thuộc
┌──────────────▼──────────────┐ ┌─────────────▼───────────────┐
│     BeautyAI.Domain         │ │  BeautyAI.Infrastructure    │
│  - Core Entities & Value Obj│ │  - PostgreSQL DbContext     │
│  - 12 Cặp quy tắc xung đột  │ │  - Dapper Read Repositories │
│  - Thuật toán Suitability   │ │  - Gemini AI Provider       │
│  - Thuần C#, 0 Dependency   │ │  - Tầng Adapter bên ngoài   │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## 2. Lược Đồ Cơ Sở Dữ Liệu Tối Ưu Cho Phase 1 (PostgreSQL 17)

Lược đồ CSDL được tinh giản từ bản đầy đủ, loại bỏ các bảng Zalo/Currency/Audit phức tạp, tập trung tối đa vào hiệu năng đọc/ghi và **chỉ mục chuyên sâu phục vụ tập dữ liệu 1 triệu reviews**:

```sql
-- 1. BẢNG NGƯỜI DÙNG & PHÂN QUYỀN
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'CUSTOMER' NOT NULL, -- 'CUSTOMER', 'ADMIN'
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    shipping_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. HỒ SƠ DA CÁ NHÂN (DIGITAL SKIN ID - USP)
CREATE TABLE skin_profiles (
    user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    skin_type VARCHAR(50) NOT NULL, -- 'Oily', 'Dry', 'Combination', 'Normal'
    is_sensitive BOOLEAN DEFAULT FALSE NOT NULL,
    concerns JSONB NOT NULL DEFAULT '[]', -- ['Acne', 'Aging', 'Pores', 'Pigmentation']
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. TỪ ĐIỂN THÀNH PHẦN INCI
CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    inci_name VARCHAR(255) UNIQUE NOT NULL,
    vietnamese_name VARCHAR(255),
    function_group VARCHAR(100), -- 'Moisturizing', 'Exfoliating', 'Antioxidant', 'Active'
    comedogenic_rating INT DEFAULT 0, -- 0 đến 5
    irritancy_rating INT DEFAULT 0, -- 0 đến 5
    is_active_ingredient BOOLEAN DEFAULT FALSE,
    description TEXT
);

-- 4. DANH SÁCH DỊ ỨNG CÁ NHÂN (ALLERGY BLACKLIST - USP)
CREATE TABLE user_allergies (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    ingredient_id INT REFERENCES ingredients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, ingredient_id)
);

-- 5. DANH MỤC & THƯƠNG HIỆU
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id INT REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    origin_country VARCHAR(100)
);

-- 6. SẢN PHẨM & LIÊN KẾT THÀNH PHẦN
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    brand_id INT REFERENCES brands(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    price_vnd BIGINT NOT NULL CHECK (price_vnd >= 0),
    volume_ml INT,
    description TEXT,
    image_url VARCHAR(500),
    ingredient_list_raw TEXT NOT NULL, -- Bảng thành phần nguyên bản dạng chuỗi
    target_skin_types VARCHAR(100)[], -- ['Oily', 'Combination']
    stock_quantity INT DEFAULT 100 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE product_ingredients (
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id INT REFERENCES ingredients(id) ON DELETE CASCADE,
    position_order INT NOT NULL, -- Thứ tự nồng độ xuất hiện trên bao bì
    PRIMARY KEY (product_id, ingredient_id)
);

-- 7. QUY TẮC XUNG ĐỘT HOẠT CHẤT (SMART CONFLICT RULES - USP)
CREATE TABLE conflict_rules (
    id SERIAL PRIMARY KEY,
    active_ingredient_a VARCHAR(255) NOT NULL,
    active_ingredient_b VARCHAR(255) NOT NULL,
    severity VARCHAR(50) DEFAULT 'Warning' NOT NULL, -- 'Warning', 'Contraindication'
    reason_vi TEXT NOT NULL,
    recommendation_vi TEXT NOT NULL
);

-- 8. ĐÁNH GIÁ SẢN PHẨM (TỐI ƯU CHO 1M RECORDS DATASET)
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255) DEFAULT 'Ẩn danh',
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    skin_type VARCHAR(50) NOT NULL, -- 'Oily', 'Dry', 'Combination', 'Normal'
    skin_concerns VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tối ưu hóa truy vấn lọc 1 triệu review theo sản phẩm & loại da
CREATE INDEX idx_reviews_product_skin ON reviews(product_id, skin_type);
CREATE INDEX idx_reviews_product_rating ON reviews(product_id, rating);

-- 9. ĐƠN HÀNG & CHI TIẾT ĐƠN HÀNG (COD CHECKOUT)
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'COD' NOT NULL,
    order_status VARCHAR(50) DEFAULT 'Pending' NOT NULL, -- 'Pending', 'Delivering', 'Completed', 'Cancelled'
    subtotal_vnd BIGINT NOT NULL,
    discount_vnd BIGINT DEFAULT 0,
    total_amount_vnd BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    unit_price_vnd BIGINT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0)
);

-- 10. CHU TRÌNH DƯỠNG DA ĐÃ LƯU (SAVED ROUTINES)
CREATE TABLE saved_routines (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    routine_name VARCHAR(255) DEFAULT 'Chu trình của tôi',
    am_routine JSONB NOT NULL,
    pm_routine JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

---

## 3. Thuật Toán Cốt Lõi (Core Algorithms)

### 3.1. Thuật toán Điểm Tương Thích (Suitability Match Score — ADR-011)
Điểm số được tính toán động (Computed-on-Read) khi người dùng xem sản phẩm:
$$\text{Score} = \text{Base} (50) + \Delta_{\text{SkinType}} (\pm 25) + \Delta_{\text{Concerns}} (+25) - \text{Penalty}_{\text{Allergy}} (-1000)$$

- **Quy tắc tuyệt đối:** Nếu sản phẩm chứa bất kỳ chất nào trong `Allergy Blacklist` của người dùng:
  - $\text{Score} = 0\%$
  - Trả về cờ cảnh báo `HasAllergyWarning = true` và danh sách tên các chất vi phạm.

### 3.2. Thuật toán Phát Hiện Xung Đột Hoạt Chất (Smart Conflict Detector)
Thực thi tại Domain layer khi kiểm tra giỏ hàng hoặc các bước trong Routine:
1. Lấy danh sách toàn bộ các thành phần của các sản phẩm đang có trong giỏ hàng.
2. Đối chiếu với 12 quy tắc khoa học trong bảng `conflict_rules`.
3. Nếu phát hiện cặp kỵ nhau (ví dụ $P_1$ chứa `Retinol`, $P_2$ chứa `Salicylic Acid` / BHA):
   - Trả về cảnh báo: `Severity: "Warning"`.
   - `Message`: *"Sản phẩm {A} và {B} khi dùng cùng lúc có nguy cơ gây kích ứng/bào mòn da."*
   - `Schedule`: *"Khuyên dùng luân phiên: Sản phẩm {A} buổi sáng/tối 2-4-6, Sản phẩm {B} tối 3-5-7."*

### 3.3. Tích Hợp Trợ Lý AI Gemini (Grounding & Guardrail)
1. **Endpoint tích hợp:** `POST /api/v1/ai/consult`.
2. **System Prompt Injection:**
   ```text
   Bạn là Trợ lý Chuyên gia Da liễu BeautyAI.
   Hồ sơ da người dùng: Loại da={SkinType}, Nhạy cảm={IsSensitive}, Dị ứng={Allergies}.
   Danh mục sản phẩm hiện có: {ProductGroundingJson}.
   RÀNG BUỘC TUYỆT ĐỐI:
   1. Tuyệt đối không chẩn đoán bệnh da liễu nặng (viêm da mủ, chàm, vảy nến). Hãy khuyên đi khám bác sĩ.
   2. Tuyệt đối không gợi ý sản phẩm chứa chất dị ứng của người dùng.
   3. Chỉ đề xuất các sản phẩm có trong danh mục cung cấp kèm link và giá tiền.
   ```

---

## 4. Danh Mục API Endpoints (.NET 10 Web API)

| Nhóm | Method | Đường dẫn Endpoint | Mô tả |
|---|---|---|---|
| **Auth** | `POST` | `/api/v1/auth/register` | Đăng ký tài khoản |
| | `POST` | `/api/v1/auth/login` | Đăng nhập nhận JWT / Cookie |
| | `GET` | `/api/v1/auth/me` | Lấy thông tin tài khoản & Skin ID |
| | `PUT` | `/api/v1/auth/profile` | Cập nhật thông tin cá nhân |
| **Skin ID** | `PUT` | `/api/v1/skin-profile` | Cập nhật hồ sơ da (loại da, vấn đề) |
| | `GET` | `/api/v1/skin-profile/allergies` | Danh sách chất dị ứng |
| | `POST` | `/api/v1/skin-profile/allergies` | Thêm chất dị ứng vào Blacklist |
| | `DELETE` | `/api/v1/skin-profile/allergies/{id}` | Xóa chất dị ứng |
| **Catalog** | `GET` | `/api/v1/products` | Danh mục lọc, tìm kiếm, toggle an toàn |
| | `GET` | `/api/v1/products/{slug}` | Chi tiết sản phẩm, INCI, Match Score |
| | `GET` | `/api/v1/products/{id}/reviews` | Lọc 1M reviews theo loại da |
| **Tools** | `POST` | `/api/v1/tools/analyze-inci` | Dán văn bản bóc tách INCI tự do |
| | `POST` | `/api/v1/tools/check-conflict` | Kiểm tra xung đột danh sách sản phẩm |
| | `POST` | `/api/v1/tools/skin-quiz` | Tính toán Routine AM/PM từ kết quả Quiz |
| **Cart & Order** | `POST` | `/api/v1/orders` | Đặt hàng COD |
| | `GET` | `/api/v1/orders/my-orders` | Xem lịch sử đơn hàng của tôi |
| **AI** | `POST` | `/api/v1/ai/consult` | Chat tư vấn với Gemini API |
| **Admin** | `GET` | `/api/v1/admin/kpis` | Thống kê số lượng, doanh thu |
| | `POST` | `/api/v1/admin/products` | Thêm mới sản phẩm & INCI |
| | `PATCH` | `/api/v1/admin/orders/{id}/status` | Đổi trạng thái đơn hàng |

---

## 5. Kế Hoạch Triển Khai & Kiểm Định An Toàn

1. **Local Docker Environment:** CSDL PostgreSQL 17 và ứng dụng chạy thông qua Docker Compose cục bộ trên máy Mac theo đúng [ADR-013](file:///Users/trucuyen/Documents/beauty_ai/docs/adr/ADR-013-local-mac-test-deployment.md).
2. **CI 5 Jobs:** Toàn bộ code push lên GitHub phải qua 5 job của [`.github/workflows/quality-gate.yml`](file:///Users/trucuyen/Documents/beauty_ai/.github/workflows/quality-gate.yml) để đảm bảo không bị sai lệch kiểu và không chứa lỗ hổng bảo mật.
