---
doc: tech-solutions-phase-1
title: Thiết Kế Kỹ Thuật & Kiến Trúc Hệ Thống (Technical Solutions) — BeautyAI Phase 1 (MVP)
status: stable
precedence: 2
owner: Solution Architect / Tech Lead
last_reviewed: 2026-10-26
---

# THIẾT KẾ KỸ THUẬT & KIẾN TRÚC HỆ THỐNG — BEAUTYAI PHASE 1 (MVP)

> **Mục tiêu:** Bản thiết kế kỹ thuật toàn diện (Full Comprehensive Technical Design) cho **Phase 1 MVP (30 ngày)**, đặc tả chi tiết kiến trúc giải pháp, toàn bộ lược đồ CSDL PostgreSQL, các class DTO/Interface trong C# .NET 10, các thuật toán da liễu cốt lõi, cơ chế tích hợp Gemini AI và danh mục API Contracts hoàn chỉnh.
> **Ràng buộc công nghệ bắt buộc:**
> - **Backend:** C# .NET 10 (ASP.NET Core Web API, Entity Framework Core 10 + Dapper).
> - **Frontend:** React 19 + TypeScript + Vite (khai thác toàn bộ mã nguồn sẵn có tại `docs/_ui-ux_design/phase_1/frontend/`).
> - **Database:** PostgreSQL 17 chạy Docker cục bộ trên máy Mac ([ADR-013](file:///Users/trucuyen/Documents/beauty_ai/docs/adr/ADR-013-local-mac-test-deployment.md)).
> - **AI Integration:** Google Gemini API (Grounding sản phẩm sàn + Guardrails y tế).

---

# 1. KIẾN TRÚC TỔNG THỂ & CÁC NGUYÊN TẮC BẤT BIẾN (CLEAN ARCHITECTURE)

## 1.1. Cấu trúc phân tầng Clean Architecture 4 Projects
Mã nguồn backend được tổ chức thành 4 projects độc lập theo chuẩn Clean Architecture, thực thi nghiêm ngặt quy tắc phụ thuộc một chiều hướng tâm (Dependency Inversion Principle):

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   BeautyAI.Api (ASP.NET Core 10)                       │
│  - REST Controllers / Minimal APIs                                     │
│  - OpenAPI Build-time Generator (Microsoft.AspNetCore.OpenApi)         │
│  - Global Exception Handling Middleware & Logging                      │
│  - JWT Bearer Authentication & CORS Policy                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ phụ thuộc
┌───────────────────────────────────▼────────────────────────────────────┐
│                BeautyAI.Application (Tầng Nghiệp Vụ)                   │
│  - DTO Records (Requests & Responses)                                  │
│  - Service Interfaces: IAuthService, IProductService, IQuizService...  │
│  - Repository Interfaces: IProductRepository, IReviewRepository...     │
│  - TUYỆT ĐỐI KHÔNG phụ thuộc Microsoft.EntityFrameworkCore             │
│  - TUYỆT ĐỐI KHÔNG phụ thuộc Microsoft.AspNetCore (Không dính HTTP)    │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    │ phụ thuộc                      │ phụ thuộc
┌───────────────────▼──────────────┐ ┌───────────────▼───────────────────┐
│         BeautyAI.Domain          │ │      BeautyAI.Infrastructure      │
│  - Core Entities: User, Product..│ │  - AppDbContext (EF Core 10)      │
│  - Value Objects: MoneyVnd, INCI │ │  - Dapper Repositories (1M Reviews│
│  - Domain Services:              │ │  - GeminiAiProvider (Adapter Layer│
│    + SuitabilityScoreCalculator  │ │  - HttpClient quản lý tích hợp    │
│    + ConflictDetectorService     │ │  - Chịu trách nhiệm kết nối DB    │
│  - THUẦN C#, 0 DEPENDENCY NUGET  │ │    PostgreSQL 17 qua Docker       │
└──────────────────────────────────┘ └───────────────────────────────────┘
```

## 1.2. Các bất biến kiến trúc bất di bất dịch (Architectural Invariants)
Hệ thống được giám sát tự động bằng bộ test kiến trúc [`tests/BeautyAI.ArchitectureTests`](file:///Users/trucuyen/Documents/beauty_ai/tests/BeautyAI.ArchitectureTests):
1. **INV-01 (Bất biến tối cao về An toàn Mỹ phẩm):**
   - Quét toàn bộ mã nguồn và assembly: **Tuyệt đối không** chứa bất kỳ thuộc tính, trường, phương thức hay class nào mang tên (không phân biệt hoa thường): `SafetyScore`, `SafetyRating`, `HazardScore`, `DangerLevel`, `ToxicityScore`, `SafetyLevel`.
   - *Lý do khoa học:* Mỹ phẩm không có khái niệm an toàn tuyệt đối hay nguy hiểm chung chung; mọi thành phần đều phụ thuộc vào nồng độ và cơ địa nền da của từng người. Mọi điểm số hiển thị đều là **`SuitabilityScore` (Điểm tương thích với hồ sơ da)**.
2. **INV-02 (Cách ly thư viện bên ngoài - Provider Abstraction):**
   - `HttpClient` và mọi thư viện bên thứ 3 (Gemini SDK) **chỉ được xuất hiện** trong namespace `BeautyAI.Infrastructure.Providers`. Tầng Application và Domain chỉ gọi qua interface `IAiProvider`.
3. **INV-03 (Cấm các thư viện cồng kềnh - ADR-009):**
   - Nghiêm cấm đưa vào dự án: `AutoMapper`, `MediatR`, `Hangfire`, `Quartz`, `StackExchange.Redis`.
   - Ánh xạ DTO viết bằng tay (Manual Mapping hoặc Extension Methods) để tối đa hiệu năng và minh bạch luồng code.
4. **INV-04 (Chuẩn tiền tệ duy nhất):**
   - Toàn bộ giá bán và thanh toán trong Phase 1 sử dụng duy nhất đồng **Việt Nam Đồng (VNĐ)** kiểu dữ liệu số nguyên `BIGINT`.

---

# 2. THIẾT KẾ LƯỢC ĐỒ CƠ SỞ DỮ LIỆU (POSTGRESQL 17 SCHEMA)

Lược đồ CSDL được thiết kế chuẩn hóa bậc 3 (3NF), bổ sung các cột JSONB linh hoạt cho các thuộc tính mở rộng và đánh chỉ mục B-Tree kép chuyên sâu để **xử lý mượt mà tập dữ liệu 1 triệu reviews**:

```sql
-- ============================================================================
-- 1. BẢNG NGƯỜI DÙNG & TÀI KHOẢN (USERS)
-- ============================================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'CUSTOMER' NOT NULL CHECK (role IN ('CUSTOMER', 'ADMIN')),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    shipping_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- 2. HỒ SƠ DIGITAL SKIN ID THỐNG NHẤT (SKIN_PROFILES & USER_ALLERGIES)
-- ============================================================================
-- Khối thống nhất theo thứ tự y khoa:
-- 1. Cơ địa nền tảng (Loại da)
-- 2. Vùng cấm kỵ an toàn (Blacklist Dị ứng)
-- 3. Nhu cầu cải thiện (Vấn đề da, Mục tiêu & Ngân sách)
-- ============================================================================
CREATE TABLE skin_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    skin_type VARCHAR(50) NOT NULL CHECK (skin_type IN ('Oily', 'Dry', 'Combination', 'Normal', 'Sensitive')),
    skin_concerns VARCHAR(50)[] NOT NULL, -- ARRAY['Acne', 'Aging', 'DarkSpots', 'Pores', 'Sensitivity', 'Dehydration']
    primary_goal VARCHAR(255),
    budget_level VARCHAR(50) DEFAULT 'Medium' NOT NULL CHECK (budget_level IN ('Low', 'Medium', 'High')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX idx_skin_profiles_user ON skin_profiles(user_id);

-- Bảng chi tiết con: Hoạt chất dị ứng thuộc khối Digital Skin ID (Chuẩn 3NF)
CREATE TABLE user_allergies (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    ingredient_name VARCHAR(255) NOT NULL,
    note VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX idx_user_allergies_user ON user_allergies(user_id);

-- ============================================================================
-- 3. TỪ ĐIỂN THÀNH PHẦN HOÁ HỌC (INGREDIENTS — INCI DICTIONARY)
-- ============================================================================
CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    inci_name VARCHAR(255) UNIQUE NOT NULL,
    vietnamese_name VARCHAR(255) NOT NULL,
    function_group VARCHAR(100) NOT NULL, -- 'Moisturizing', 'Exfoliating', 'Antioxidant', 'Active', 'Preservative'
    comedogenic_rating INT DEFAULT 0 CHECK (comedogenic_rating BETWEEN 0 AND 5),
    irritancy_rating INT DEFAULT 0 CHECK (irritancy_rating BETWEEN 0 AND 5),
    is_active_ingredient BOOLEAN DEFAULT FALSE NOT NULL,
    description TEXT
);
CREATE INDEX idx_ingredients_inci ON ingredients(inci_name);

-- ============================================================================
-- 4. BẢNG DANH MỤC & THƯƠNG HIỆU (CATEGORIES & BRANDS)
-- ============================================================================
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

-- ============================================================================
-- 5. BẢNG SẢN PHẨM & LIÊN KẾT THÀNH PHẦN (PRODUCTS & PRODUCT_INGREDIENTS)
-- ============================================================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- Original Sephora Product Code (e.g. 'P473671')
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    brand_id INT REFERENCES brands(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    price_usd NUMERIC(10, 2) NOT NULL CHECK (price_usd >= 0),
    volume_ml INT,
    description TEXT,
    image_url VARCHAR(500), -- Relative static path (e.g. '/images/products/P505461.webp') or verified CDN URL. Real images are stored as optimized 800px WebP files under frontend public/images/products/. Never store binary/base64 data directly in PostgreSQL.
    ingredient_list_raw TEXT NOT NULL, -- Raw INCI ingredient string from packaging
    target_skin_types VARCHAR(50)[] NOT NULL, -- ARRAY['Oily', 'Combination']
    stock_quantity INT DEFAULT 100 NOT NULL CHECK (stock_quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);

CREATE TABLE product_ingredients (
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id INT REFERENCES ingredients(id) ON DELETE CASCADE,
    position_order INT NOT NULL,
    PRIMARY KEY (product_id, ingredient_id)
);
CREATE INDEX idx_prod_ing_ingredient ON product_ingredients(ingredient_id);

-- ============================================================================
-- 6. BẢNG QUY TẮC XUNG ĐỘT HOẠT CHẤT (CONFLICT_RULES)
-- ============================================================================
CREATE TABLE conflict_rules (
    id SERIAL PRIMARY KEY,
    active_ingredient_a VARCHAR(255) NOT NULL,
    active_ingredient_b VARCHAR(255) NOT NULL,
    severity VARCHAR(50) DEFAULT 'Warning' NOT NULL, -- 'Warning', 'Contraindication'
    reason TEXT NOT NULL,
    recommendation TEXT NOT NULL
);

-- ============================================================================
-- 7. BẢNG ĐÁNH GIÁ SẢN PHẨM (REVIEWS) — TỐI ƯU CHO 1 TRIỆU RECORDS
-- ============================================================================
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    product_code VARCHAR(50), -- Sephora code for direct ETL mapping
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255) DEFAULT 'BeautyAI Shopper' NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    skin_type VARCHAR(50) NOT NULL CHECK (skin_type IN ('Oily', 'Dry', 'Combination', 'Normal', 'Unknown')),
    skin_concerns VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- CHỈ MỤC B-TREE TỐI ƯU TRUY VẤN LỌC REVIEW 1M DƯỚI 50MS
CREATE INDEX idx_reviews_product_skin ON reviews(product_id, skin_type);
CREATE INDEX idx_reviews_product_rating ON reviews(product_id, rating);
CREATE INDEX idx_reviews_product_code ON reviews(product_code);

-- ============================================================================
-- 8. BẢNG ĐƠN HÀNG & CHI TIẾT ĐƠN HÀNG (ORDERS & ORDER_ITEMS)
-- ============================================================================
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    notes TEXT,
    payment_method VARCHAR(50) DEFAULT 'COD' NOT NULL,
    order_status VARCHAR(50) DEFAULT 'Pending' NOT NULL CHECK (order_status IN ('Pending', 'Delivering', 'Completed', 'Cancelled')),
    subtotal_usd NUMERIC(10, 2) NOT NULL CHECK (subtotal_usd >= 0),
    discount_usd NUMERIC(10, 2) DEFAULT 0,
    total_amount_usd NUMERIC(10, 2) NOT NULL CHECK (total_amount_usd >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(order_status);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    unit_price_usd NUMERIC(10, 2) NOT NULL CHECK (unit_price_usd >= 0),
    quantity INT NOT NULL CHECK (quantity > 0)
);

-- ============================================================================
-- 10. BẢNG LƯU CHU TRÌNH DƯỠNG DA (SAVED_ROUTINES)
-- ============================================================================
CREATE TABLE saved_routines (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    routine_name VARCHAR(255) DEFAULT 'Chu trình chuẩn của tôi',
    am_routine JSONB NOT NULL, -- Danh sách sản phẩm buổi sáng
    pm_routine JSONB NOT NULL, -- Danh sách sản phẩm buổi tối
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

---

# 3. CHIẾN LƯỢC DỮ LIỆU & SEEDING (DATA INGESTION & SEED STRATEGY)

Hệ thống tận dụng trực tiếp bộ dữ liệu thực tế có sẵn trong thư mục `docs/_data/cleaned/`:

### 3.1. Nguồn Dữ Liệu Thực Tế Khai Thác
1. **Sản phẩm & Thương hiệu (`docs/_data/cleaned/products_cleaned.csv`)**:
   - Gồm 8.495 sản phẩm mỹ phẩm thật từ Sephora (2.420 sản phẩm chuyên mục Skincare).
   - ETL nạp vào bảng `brands`, `categories`, và `products` (chuẩn hóa giá tiền sang VNĐ với tỷ giá 1 USD = 25.000 VNĐ, lưu mã gốc vào cột `code`).
   - Bóc tách chuỗi `ingredients` phân tách bằng dấu phẩy để nạp vào bảng `ingredients` và `product_ingredients`.
2. **Đánh giá Khách hàng (`docs/_data/cleaned/reviews_cleaned.csv`)**:
   - Gồm **1.094.197 dòng đánh giá thật** có phân loại da (`skin_type`: `combination`, `dry`, `oily`, `normal`, `unknown`).
   - ETL chuẩn hóa `INITCAP(skin_type)` thành (`Combination`, `Dry`, `Oily`, `Normal`, `Unknown`) và nạp vào bảng `reviews` liên kết theo `product_code` / `product_id`.
3. **Quy tắc mua kèm Routine (`docs/_data/cleaned/apriori_rules.csv`)**:
   - Gồm 15.259 luật kết hợp Apriori (`antecedent -> consequent`) hỗ trợ gợi ý routine và sản phẩm mua kèm.

### 3.2. 12 Bộ Quy Tắc Xung Đột Hoạt Chất Y Khoa (Curated Conflict Rules)

Hệ thống được nạp sẵn 12 bộ quy tắc xung đột chuẩn y văn da liễu phục vụ kiểm tra tức thì trong giỏ hàng:

| Cặp hoạt chất A | Cặp hoạt chất B | Mức độ | Cơ chế xung đột khoa học | Khuyến cáo chia lịch sử dụng |
|---|---|---|---|---|
| **Retinol / Tretinoin** | **Salicylic Acid (BHA)** | `Warning` | Phá vỡ hàng rào bảo vệ da, gây bong tróc nặng và bỏng rát. | Dùng BHA tối 2-4-6, Retinol tối 3-5-7. |
| **Retinol / Retinoid** | **Glycolic / Lactic Acid (AHA)** | `Warning` | Kích ứng mạnh, bào mòn lớp sừng bề mặt da. | Dùng AHA sáng/cách ngày, Retinol dùng buổi tối. |
| **Benzoyl Peroxide** | **Retinol / Tretinoin** | `Contraindication` | Benzoyl Peroxide oxy hóa làm mất hoạt tính của Retinol. | Dùng Benzoyl Peroxide buổi sáng, Retinol buổi tối. |
| **Vitamin C (L-Ascorbic Acid)** | **AHA / BHA** | `Warning` | pH quá thấp làm da quá tải acid, gây đỏ rát châm chích. | Dùng Vitamin C buổi sáng (chống oxy hóa), AHA/BHA buổi tối. |
| **Vitamin C (LAA)** | **Niacinamide (nồng độ cao)** | `Warning` | Có thể tương tác tạo phức Niacin làm ửng đỏ da tạm thời. | Thoa cách nhau 20 phút hoặc chia sáng (Vit C) / tối (Niacinamide). |
| **Benzoyl Peroxide** | **Vitamin C** | `Contraindication` | Benzoyl Peroxide là chất oxy hóa mạnh, triệt tiêu Vitamin C. | Tách riêng buổi sáng và tối. |
| **Retinol** | **Vitamin C (LAA)** | `Warning` | Cả hai đều là hoạt chất mạnh, pH hoạt động chênh lệch. | Vitamin C buổi sáng trước kem chống nắng, Retinol buổi tối. |
| **AHA (Glycolic Acid)** | **BHA (Salicylic Acid)** | `Warning` | Nguy cơ tẩy da chết quá đà (Over-exfoliation) nếu nồng độ cao. | Không thoa chung nếu da nhạy cảm; chia xen kẽ ngày. |
| **Hydroquinone** | **Benzoyl Peroxide** | `Contraindication` | Có thể gây sạm đen da tạm thời (nhuộm màu da). | Tuyệt đối không dùng chung trong cùng chu trình. |
| **Copper Peptides** | **Vitamin C (LAA)** | `Warning` | Ion đồng oxy hóa acid ascorbic, làm mất tác dụng của cả hai. | Dùng Peptide buổi sáng, Vitamin C buổi tối (hoặc ngược lại). |
| **Copper Peptides** | **AHA / BHA** | `Warning` | Môi trường acid phá hủy liên kết peptide. | Thoa cách nhau ít nhất 30 phút. |
| **Retinol** | **Tẩy da chết vật lý (Scrub)** | `Warning` | Tổn thương vi mô kết hợp bong sừng gây viêm da tiếp xúc. | Không dùng scrub dạng hạt khi đang treatment Retinol. |

### 3.3. Chiến Lược Thu Thập & Chuẩn Hóa Hình Ảnh Sản Phẩm (Product Imagery Architecture)

Nhằm giải quyết triệt để vấn đề hiển thị sai ảnh sản phẩm và tối ưu hóa hiệu năng trải nghiệm người dùng, hệ thống áp dụng kiến trúc chuẩn hóa hình ảnh sản phẩm như sau:

#### 1. Phân tích nguyên nhân cào sai & trùng lặp ảnh (Root Cause Analysis):
- **Thiếu định danh hình ảnh gốc:** Dataset Kaggle Sephora chỉ cung cấp `product_id` (ví dụ `P469502`), hoàn toàn không có trường link ảnh hoặc Sephora SKU ID (`s-code`).
- **Lỗi phỏng đoán (Heuristic Guessing) & Cào thiếu grounding:** Việc cố gắng tạo link ảnh dựa trên suy đoán SKU hoặc cào ảnh tự động thiếu đối soát thương hiệu dẫn đến việc gán nhầm sản phẩm (ví dụ: nước hoa Yves Saint Laurent hiển thị ảnh son môi, bộ gift set hiển thị chai kem nền, cọ trang điểm hiển thị bảng phấn mắt).
- **Fallback Unsplash thiếu chọn lọc & Trùng ảnh lặp lại:** Pool ảnh dự phòng trước đây chứa các ảnh stock không phù hợp (quả cam, khuôn mặt người mẫu đắp mặt nạ, vòi sen tắm) và thuật toán băm (hash) dựa trên seed ngắn dẫn đến nhiều sản phẩm kế tiếp nhau bị gán chung một ảnh.

#### 2. Kiến trúc lưu trữ ảnh tĩnh (Static Asset Architecture & DQ-08):
- **Vị trí lưu trữ vật lý:** Các tệp ảnh đã xử lý được lưu trữ tập trung tại thư mục tài nguyên tĩnh của Frontend: `src/frontend/public/images/products/{product_id}.webp`.
- **Định danh trong Cơ sở dữ liệu:** Cột `products.image_url` chỉ lưu đường dẫn tương đối (URI: `/images/products/{product_id}.webp`) hoặc URL CDN đã được xác thực.
- **Nguyên tắc bất biến:** **TUYỆT ĐỐI KHÔNG lưu trữ dữ liệu nhị phân (BLOB) hay Base64 trong PostgreSQL.** Việc lưu URI tĩnh giúp database siêu nhẹ, sao lưu nhanh chóng, không gây bloating RAM/Disk, đồng thời tận dụng triệt để cơ chế HTTP Cache, Browser Caching và HTTP/2 multiplexing của web server.

#### 3. Quy chuẩn cào ảnh chính xác (Standardized Scraping & Harvester Protocol):
1. **Search Grounding chính xác SKU:** Truy vấn danh mục chính thức Sephora theo cú pháp `"{Brand}" "{Product Name}" sephora "skuId"` để lấy mã định danh SKU duy nhất của Sephora (ví dụ: `P469502` -> `s2421360`).
2. **Khai thác trực tiếp Sephora CDN:** Tải ảnh gốc độ phân giải cao theo cấu trúc:
   `https://www.sephora.com/productimages/sku/{sku}-main-zoom.jpg`
   với đầy đủ HTTP headers tiêu chuẩn (`User-Agent` Chrome Desktop và `Referer: https://www.sephora.com/`).
3. **Cơ chế Fallback CDN Hãng:** Đối với sản phẩm không còn niêm yết trên Sephora US (như dòng Paula's Choice EU direct), trích xuất ảnh từ CDN chính thức của nhãn hàng (ví dụ: `media.paulaschoice-eu.com`).
4. **Chuẩn hóa tối ưu (Pillow Standardization Pipeline):**
   - Chuyển đổi màu sắc sang không gian RGB chuẩn.
   - Resize theo tỷ lệ tối đa 800x800px với bộ lọc Lanczos cao cấp.
   - Nén sang định dạng hiện đại **WebP** ở chất lượng 85% (dung lượng chỉ 15–40 KB/ảnh mà độ nét hoàn hảo).
5. **Làm sạch Fallback Studio:** Loại bỏ 100% các hình ảnh quả cam, mặt spa; chỉ sử dụng ảnh chụp studio mỹ phẩm trung tính và kết hợp băm đa biến `hash("{product_id}_{product_name}_{brand_name}")` để không bị trùng lặp.
6. **Công cụ tự động hóa:** Tích hợp bộ script quản lý tập trung:
   - `scripts/crawl_product_images.py`: Harvester tự động tải và chuẩn hóa WebP.
   - `scripts/sync_image_data.py`: Đồng bộ dữ liệu ảnh giữa thư mục static, file CSV dataset và PostgreSQL database.

---

# 4. THUẬT TOÁN KHOA HỌC CỐT LÕI (CORE ALGORITHMS)

## 4.1. Thuật toán Đánh giá Kết luận Tương thích (Suitability Verdict — ADR-011 & INV-01)
Được cài đặt trong Domain service `SuitabilityScoreCalculator` kết hợp `CosmeticKnowledgeBase`, đánh giá động mỗi khi người dùng truy cập danh mục, trang chi tiết sản phẩm hoặc công cụ phân tích INCI (tuyệt đối không sử dụng con số `%` hay `SafetyScore /5`):

**Quy tắc phân tầng kết luận (`SuitabilityVerdict`):**
1. **Phân loại Dụng cụ vật lý (`AccessoryTool`):**
   - Nếu sản phẩm thuộc ngành hàng `Tools & Brushes`: Trả về `Verdict = "AccessoryTool"`, `Label = "Accessory / Tool"` (không áp dụng phân tích hóa học INCI, vẫn giữ trong bộ lọc `"Safe for me"`).
2. **Phân loại Mỹ phẩm thiếu dữ liệu INCI (`InsufficientData`):**
   - Nếu sản phẩm là mỹ phẩm nhưng nhà sản xuất không công bố danh sách INCI (`ingredient_list_raw == ""`): Trả về `Verdict = "InsufficientData"`, `Label = "Insufficient INCI Data"` và tự động loại khỏi kết quả khi bật bộ lọc dị ứng `"Safe for me"`.
3. **Quy tắc chặn dị ứng tuyệt đối (`AllergyConflict`):**
   - **BẤT BIẾN:** Nếu sản phẩm chứa **BẤT KỲ** thành phần nào trùng khớp với `Allergy Blacklist` của người dùng:
     - Trả về `Verdict = "AllergyConflict"`, `Label = "Not Suitable — Allergy Alert"`, `HasAllergyWarning = true`, kèm danh sách gộp gọn các chất gây dị ứng trùng khớp.
4. **Kiểm tra trạng thái Hồ sơ da (`RequiresSkinId`):**
   - Nếu khách chưa đăng nhập hoặc đã đăng nhập nhưng chưa thiết lập Digital Skin ID: Trả về `Verdict = "RequiresSkinId"`, mời hoàn tất Skin ID trong 30 giây.
5. **Đánh giá theo Vùng chăm sóc (`TargetCareArea`) & Phân loại Hương liệu / Cồn béo 3 mức (`GoodMatch` vs `MatchWithNotes`):**
   - Nhận diện 7 vùng chăm sóc (`face`, `eye`, `lips`, `hair`, `body`, `fragrance`, `nails`).
   - Không bao giờ cảnh báo nhầm chiết xuất/nước hoa thực vật dịu nhẹ (`Rosa Damascena Flower Water`, `Vanilla`, `Chamomile`) hoặc cồn béo dưỡng ẩm (`Cetearyl Alcohol`, `Cetyl Alcohol`, `Stearyl Alcohol`) là chất gây kích ứng.
   - Nếu phát hiện chất cần lưu ý cho cơ địa người dùng (ví dụ: cồn khô trên da khô/nhạy cảm, hoặc 26 hương liệu EU trên da nhạy cảm ở vùng mặt): Trả về `Verdict = "MatchWithNotes"` kèm hướng dẫn cụ thể. Ngược lại trả về `Verdict = "GoodMatch"`.

## 4.2. Thuật toán Phát hiện Xung đột (Smart Conflict Detector)
Được cài đặt trong `ConflictDetectorService`:
1. **Input:** Danh sách các `product_id` đang có trong giỏ hàng hoặc các bước trong Routine gợi ý.
2. **Bước 1:** Nạp danh sách toàn bộ các thành phần hoạt chất của các sản phẩm trên từ bảng `product_ingredients`.
3. **Bước 2:** Chạy thuật toán so khớp chéo (Cartesian product $P_i \times P_j$) đối chiếu với bảng `conflict_rules`.
4. **Bước 3:** Nếu tìm thấy cặp chất tương xung $(A, B)$ giữa sản phẩm $P_i$ và $P_j$:
   - Tạo đối tượng `ConflictAlert`:
     - `ProductAName`, `ProductBName`.
     - `IngredientAName`, `IngredientBName`.
     - `Severity`: Warning / Contraindication.
     - `Reason`: Giải thích khoa học từ DB.
     - `Recommendation`: Lời khuyên chia lịch sáng/tối hoặc xen kẽ ngày.
5. **Output:** Trả về danh sách cảnh báo `List<ConflictAlert>`.

## 4.3. Thuật toán Bóc tách Bảng Thành phần (INCI Text Parser)
Được sử dụng cho Công cụ Phân tích INCI tự do và ô nhập liệu của Admin:
1. Chuẩn hóa chuỗi văn bản đầu vào: xóa ký tự đặc biệt, chuyển dấu chấm phẩy hoặc dấu gạch chéo thành dấu phẩy `,`.
2. Tách chuỗi theo biểu thức chính quy (Regex): `split(/,\s*|\.\s*|\n/)`.
3. Loại bỏ phần trăm nồng độ (nếu có trong ngoặc, ví dụ `Niacinamide (10%)` ➔ lấy `Niacinamide`).
4. Tìm kiếm gần đúng (fuzzy match / exact match) với cột `inci_name` trong bảng `ingredients`.
5. Đóng gói kết quả phân tích: Số lượng chất an toàn, số lượng hoạt chất, số chất kích ứng và danh sách chi tiết.

---

# 5. THIẾT KẾ DTO & CONTRACTS (C# .NET 10)

Các DTO được định nghĩa bằng C# `record` bất biến (immutable), an toàn kiểu:

```csharp
namespace BeautyAI.Application.DTOs;

// 1. Auth DTOs
public record RegisterRequest(string Email, string Password, string FullName, string? Phone);
public record LoginRequest(string Email, string Password);
public record AuthResponse(string Token, string Email, string FullName, string Role);
public record UserProfileDto(int Id, string Email, string FullName, string? Phone, string? ShippingAddress, DigitalSkinIdDto? SkinProfile);

// 2. Digital Skin ID DTOs (Khối thống nhất theo thứ tự y khoa)
public record AllergyItemDto(int Id, string IngredientName, string? Note);
public record DigitalSkinIdDto(
    int UserId, 
    string FullName, 
    string SkinType,                 // 1. Cơ địa nền tảng
    List<AllergyItemDto> Allergies,  // 2. Vùng cấm kỵ an toàn (Blacklist Dị ứng)
    List<string> SkinConcerns,       // 3. Nhu cầu cải thiện: Vấn đề da
    string PrimaryGoal,              // 3. Mục tiêu dưỡng da
    string BudgetLevel               // 3. Ngân sách
);
public record UpdateDigitalSkinIdRequest(
    string SkinType, 
    List<string> AllergyNames, 
    List<string> SkinConcerns, 
    string PrimaryGoal, 
    string BudgetLevel
);
public record AddAllergyRequest(string IngredientName, string? Note);

// 3. Product & INCI DTOs
public record ProductSummaryDto(int Id, string Name, string Slug, string BrandName, decimal PriceUsd, string? ImageUrl, int? MatchScore, bool HasAllergyWarning);
public record ProductDetailDto(
    int Id, string Name, string Slug, string BrandName, string CategoryName,
    decimal PriceUsd, int? VolumeMl, string? Description, string? ImageUrl,
    int? MatchScore, bool HasAllergyWarning, List<string> AllergyViolations,
    List<ProductIngredientDto> Ingredients, FunctionDistributionDto FunctionDistribution
);
public record ProductIngredientDto(int Id, string InciName, string FunctionGroup, string? Description, int IrritancyRating, int ComedogenicRating, bool IsAllergy);
public record FunctionDistributionDto(int MoisturizingPercent, int ActiveTreatmentPercent, int SoothingPercent, int OtherPercent);

// 4. Conflict DTOs
public record CheckConflictRequest(List<int> ProductIds);
public record ConflictAlertDto(string ProductAName, string ProductBName, string IngredientAName, string IngredientBName, string Severity, string Reason, string Recommendation);

// 5. Routine DTOs (Generated from Digital Skin ID)
public record GenerateRoutineRequest(string? SkinType, string? BudgetLevel);
public record RoutineResultDto(List<ProductSummaryDto> AmRoutine, List<ProductSummaryDto> PmRoutine, decimal TotalCostUsd, List<ConflictAlertDto> InternalConflicts);

// 6. Order DTOs
public record CreateOrderItemRequest(int ProductId, int Quantity);
public record CreateOrderRequest(string RecipientName, string RecipientPhone, string ShippingAddress, string? Notes, string? CouponCode, List<CreateOrderItemRequest> Items);
public record OrderSummaryDto(int Id, string OrderCode, string OrderStatus, decimal TotalAmountUsd, DateTime CreatedAtUtc, List<string> ProductNames);

// 7. Review DTOs
public record ReviewDto(long Id, string AuthorName, int Rating, string SkinType, string? SkinConcerns, string? Content, DateTime CreatedAtUtc);
public record PaginatedList<T>(List<T> Items, int Page, int PageSize, int TotalItems, int TotalPages);
```

---

# 6. TÍCH HỢP TRỢ LÝ AI GEMINI (INFRASTRUCTURE ADAPTER)

## 6.1. Cấu hình Provider trong `BeautyAI.Infrastructure.Providers`
Tuân thủ nghiêm ngặt **Bài 4 của Test kiến trúc** (`ProviderLibrariesOnlyInAdapterLayerTests`), class kết nối HTTP trực tiếp với Google Gemini chỉ nằm trong Infrastructure:

```csharp
namespace BeautyAI.Infrastructure.Providers;

public interface IAiSkincareProvider
{
    Task<string> ConsultAsync(string userMessage, SkinProfileDto? profile, List<ProductSummaryDto> availableProducts, CancellationToken ct = default);
}

public class GeminiSkincareProvider : IAiSkincareProvider
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public GeminiSkincareProvider(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["GEMINI_API_KEY"] ?? throw new InvalidOperationException("Missing GEMINI_API_KEY");
    }

    public async Task<string> ConsultAsync(string userMessage, SkinProfileDto? profile, List<ProductSummaryDto> availableProducts, CancellationToken ct = default)
    {
        // 1. Build System Prompt với Grounding & Guardrails
        var systemInstruction = BuildSystemPrompt(profile, availableProducts);
        
        // 2. Gửi request POST tới endpoint Gemini API
        // https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={_apiKey}
        
        // 3. Nhận phản hồi, lọc kiểm duyệt an toàn và trả về câu trả lời cho người dùng
        return "Nội dung phản hồi tư vấn chuẩn xác...";
    }
}
```

## 6.2. Mẫu System Prompt chuẩn hóa cho Gemini API (Global English)
```text
You are the AI Dermatology & Skincare Advisor for the BeautyAI e-commerce platform.
Your mission is to provide evidence-based skincare routine guidance and product recommendations.

[CURRENT USER DIGITAL SKIN ID]
- Skin Type: {SkinType}
- Allergy Blacklist (STRICT PROHIBITION): {AllergyList}
- Primary Skin Concerns: {Concerns}
- Primary Skincare Goal: {PrimaryGoal}
- Budget Level: {BudgetLevel}

[AVAILABLE IN-STOCK PRODUCT CATALOG]
{ProductsJson}

[STRICT MEDICAL & ETHICAL GUARDRAILS]
1. ZERO-ALLERGY TOLERANCE: Absolutely NEVER recommend any product containing ingredients listed in the user's Allergy Blacklist.
2. MEDICAL BOUNDARY: Never diagnose or prescribe treatments for severe clinical dermatological conditions (cystic acne conglobata, infected eczema, psoriasis, fungal infections). Advise consulting a board-certified dermatologist when encountering clinical pathology.
3. GROUNDING CONSTRAINT: ONLY recommend products from the [AVAILABLE IN-STOCK PRODUCT CATALOG] above, displaying the exact product name and price in USD ($).
4. Tone: Empathetic, scientific, objective, and clear.
```

---

# 7. DANH MỤC RESTFUL API CONTRACTS

| Nhóm chức năng | Method | Endpoint URL | Mã phản hồi | Mô tả tóm tắt |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/v1/auth/register` | `201 Created` | Đăng ký tài khoản khách hàng mới |
| | `POST` | `/api/v1/auth/login` | `200 OK` | Đăng nhập nhận JWT Token |
| | `GET` | `/api/v1/auth/me` | `200 OK` | Lấy thông tin tài khoản hiện tại |
| | `PUT` | `/api/v1/auth/profile` | `200 OK` | Cập nhật họ tên, SĐT, địa chỉ |
| **Digital Skin ID** | `GET` | `/api/v1/skin-profile` | `200 OK` | Lấy trọn bộ hồ sơ Digital Skin ID thống nhất (kèm danh sách dị ứng) |
| | `PUT` | `/api/v1/skin-profile` | `200 OK` | Cập nhật hồ sơ da (Loại da, Dị ứng, Vấn đề da, Mục tiêu, Ngân sách) |
| | `POST` | `/api/v1/skin-profile/allergies` | `201 Created` | Thêm chất dị ứng vào Blacklist |
| | `DELETE` | `/api/v1/skin-profile/allergies/{id}` | `204 No Content` | Xóa chất dị ứng khỏi Blacklist |
| **Catalog** | `GET` | `/api/v1/products` | `200 OK` | Lọc danh mục, tìm kiếm, toggle an toàn |
| | `GET` | `/api/v1/products/{slug}` | `200 OK` | Chi tiết sản phẩm, INCI, Match Score |
| | `GET` | `/api/v1/products/{id}/reviews` | `200 OK` | Lọc 1M reviews theo loại da |
| **Tools & Routine**| `POST` | `/api/v1/tools/analyze-inci` | `200 OK` | Dán văn bản bóc tách bảng thành phần |
| | `POST` | `/api/v1/tools/check-conflict` | `200 OK` | Quét xung đột hoạt chất trong giỏ |
| | `POST` | `/api/v1/routines/generate` | `200 OK` | Tự động sinh chu trình Routine AM/PM từ Digital Skin ID |
| | `POST` | `/api/v1/routines/save` | `201 Created` | Lưu chu trình vào hồ sơ cá nhân |
| **Orders** | `POST` | `/api/v1/orders` | `201 Created` | Đặt hàng thanh toán COD |
| | `GET` | `/api/v1/orders/my-orders` | `200 OK` | Xem lịch sử các đơn hàng đã đặt |
| **AI** | `POST` | `/api/v1/ai/consult` | `200 OK` | Chat tư vấn mỹ phẩm với Gemini API |
| **Admin** | `GET` | `/api/v1/admin/kpis` | `200 OK` | Xem thẻ chỉ số tổng quan |
| | `POST` | `/api/v1/admin/products` | `201 Created` | Thêm sản phẩm mới và dán chuỗi INCI |
| | `PATCH` | `/api/v1/admin/orders/{id}/status`| `200 OK` | Cập nhật trạng thái đơn COD |

---

# 8. MÔI TRƯỜNG TRIỂN KHAI & CHẠY THỬ NGHIỆM (LOCAL DOCKER RUNBOOK)

Hệ thống được đóng gói chạy kiểm thử cục bộ hoàn toàn trên máy Mac theo đúng [ADR-013](file:///Users/trucuyen/Documents/beauty_ai/docs/adr/ADR-013-local-mac-test-deployment.md):
- **PostgreSQL 17 Container:** Chạy trên cổng 5432 qua Docker Compose.
- **Backend API:** Chạy tại `http://localhost:5000` (Swagger UI tại `http://localhost:5000/openapi/v1.json`).
- **Frontend React:** Chạy tại `http://localhost:5173` qua Vite dev server.
- **Lệnh điều hành chuẩn:**
  ```bash
  # Khởi động PostgreSQL
  docker compose up -d postgres
  
  # Khởi chạy toàn bộ hệ thống phát triển
  ./scripts/dev
  ```
