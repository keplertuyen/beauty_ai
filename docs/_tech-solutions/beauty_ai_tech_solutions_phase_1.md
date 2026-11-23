---
doc: tech-solutions-phase-1
title: Thiết Kế Kỹ Thuật & Kiến Trúc Hệ Thống (Technical Solutions) — BeautyAI Phase 1 (MVP)
status: stable
precedence: 2
owner: Solution Architect / Tech Lead
last_reviewed: 2026-11-23
---

# THIẾT KẾ KỸ THUẬT & KIẾN TRÚC HỆ THỐNG — BEAUTYAI PHASE 1 (MVP)

> **Mục tiêu:** Bản thiết kế kỹ thuật toàn diện (Full Comprehensive Technical Design) cho **Phase 1 MVP (30 ngày)**, đặc tả chi tiết kiến trúc giải pháp, toàn bộ lược đồ CSDL PostgreSQL, các class DTO/Interface trong C# .NET 10, các thuật toán da liễu cốt lõi, cơ chế tích hợp Gemini AI và danh mục API Contracts hoàn chỉnh.
> **Ràng buộc công nghệ bắt buộc:**
> - **Backend:** C# .NET 10 (ASP.NET Core Web API, Entity Framework Core 10 + Dapper).
> - **Frontend:** React 19 + TypeScript + Vite (khai thác toàn bộ mã nguồn sẵn có tại `docs/_ui-ux_design/phase_1/frontend/`).
> - **Database:** PostgreSQL 17 chạy Docker cục bộ trên máy Mac ([ADR-013](file:///Users/trucuyen/Documents/beauty_ai/docs/adr/ADR-013-docker-compose-deploy-test.md)).
> - **AI Integration:** Google Gemini 2.5 Flash API (`GeminiSkincareProvider` + Scientific Rule-Based Fallback, Grounding sản phẩm sàn + Guardrails y tế).

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
│  - Service Interfaces: IAuthService, IProductService, IRoutineService..│
│  - Repository Interfaces: IProductRepository, IOrderRepository...      │
│  - TUYỆT ĐỐI KHÔNG phụ thuộc Microsoft.EntityFrameworkCore             │
│  - TUYỆT ĐỐI KHÔNG phụ thuộc Microsoft.AspNetCore (Không dính HTTP)    │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    │ phụ thuộc                      │ phụ thuộc
┌───────────────────▼──────────────┐ ┌───────────────▼───────────────────┐
│         BeautyAI.Domain          │ │      BeautyAI.Infrastructure      │
│  - Core Entities: User, Product..│ │  - AppDbContext (EF Core 10)      │
│  - Domain Knowledge & Services:  │ │  - Repositories (EF Core + B-Tree)│
│    + CosmeticKnowledgeBase       │ │  - GeminiSkincareProvider (Adapter│
│    + SuitabilityScoreCalculator  │ │  - HttpClient quản lý tích hợp    │
│    + ConflictDetectorService     │ │  - Chịu trách nhiệm kết nối DB    │
│  - THUẦN C#, 0 DEPENDENCY NUGET  │ │    PostgreSQL 17 qua Docker       │
└──────────────────────────────────┘ └───────────────────────────────────┘
```

## 1.2. Các bất biến kiến trúc bất di bất dịch (Architectural Invariants)
Hệ thống được giám sát tự động bằng bộ 12 bài test kiến trúc [`tests/BeautyAI.ArchitectureTests`](file:///Users/trucuyen/Documents/beauty_ai/tests/BeautyAI.ArchitectureTests):
1. **INV-01 (Bất biến tối cao về An toàn Mỹ phẩm):**
   - Quét toàn bộ mã nguồn và assembly (`NoSafetyScoreAnywhereTests`): **Tuyệt đối không** chứa bất kỳ thuộc tính, trường, phương thức hay class nào mang tên (không phân biệt hoa thường): `SafetyScore`, `SafetyRating`, `HazardScore`, `DangerLevel`, `ToxicityScore`, `SafetyLevel`.
   - *Lý do khoa học:* Mỹ phẩm không có khái niệm an toàn tuyệt đối hay nguy hiểm chung chung; mọi thành phần đều phụ thuộc vào nồng độ và cơ địa nền da của từng người. Mọi đánh giá hiển thị đều là **`SuitabilityVerdict` (Kết luận tương thích dạng chữ với hồ sơ da cá nhân)**.
2. **INV-02 (Cách ly thư viện bên ngoài - Provider Abstraction):**
   - `HttpClient` và mọi thư viện bên thứ 3 (Gemini API) **chỉ được xuất hiện** trong namespace `BeautyAI.Infrastructure.Providers` (`ProviderLibrariesOnlyInAdapterLayerTests`). Tầng Application và Domain chỉ gọi qua interface `IAiSkincareProvider`.
3. **INV-03 (Cấm các thư viện cồng kềnh - ADR-009):**
   - Nghiêm cấm đưa vào dự án (`ForbiddenPackagesTests`): `AutoMapper`, `MediatR`, `Hangfire`, `Quartz`, `StackExchange.Redis`.
   - Ánh xạ DTO viết bằng tay (Manual Mapping) để tối đa hiệu năng và minh bạch luồng code.
4. **INV-04 (Chuẩn tiền tệ & Bảo mật phân quyền Admin):**
   - Toàn bộ giá bán và thanh toán trong Phase 1 sử dụng duy nhất đồng **Đô la Mỹ (`USD $`, `NUMERIC(10, 2)`)** đồng bộ nguyên bản với tập dữ liệu quốc tế Sephora.
   - Toàn bộ `AdminController` bắt buộc bảo vệ bởi `[Authorize(Roles = "Admin")]` (kiểm chứng bởi `AdminAuthorizationTests`).

---

# 2. THIẾT KẾ LƯỢC ĐỒ CƠ SỞ DỮ LIỆU (POSTGRESQL 17 SCHEMA)

Lược đồ CSDL chuẩn hóa 10 bảng (tệp chính thức tại [`docs/db-schema/schema_phase_1.sql`](file:///Users/trucuyen/Documents/beauty_ai/docs/db-schema/schema_phase_1.sql)), sử dụng cột mảng / JSONB linh hoạt và đánh chỉ mục B-Tree kép chuyên sâu để **xử lý mượt mà tập dữ liệu 1.09 triệu reviews dưới 20ms**:

```sql
-- ============================================================================
-- 1. BẢNG NGƯỜI DÙNG & TÀI KHOẢN (USERS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(500) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    shipping_address TEXT,
    role VARCHAR(50) DEFAULT 'Customer' NOT NULL CHECK (role IN ('Customer', 'Admin')),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- 2. HỒ SƠ DIGITAL SKIN ID THỐNG NHẤT (SKIN_PROFILES & USER_ALLERGIES)
-- ============================================================================
CREATE TABLE IF NOT EXISTS skin_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    skin_type VARCHAR(50) NOT NULL CHECK (skin_type IN ('Oily', 'Dry', 'Combination', 'Normal', 'Sensitive')),
    skin_concerns VARCHAR(50)[] NOT NULL, -- ARRAY['Acne', 'Aging', 'DarkSpots', 'Pores', 'Sensitivity', 'Dehydration']
    primary_goal VARCHAR(255),
    budget_level VARCHAR(50) DEFAULT 'Medium' NOT NULL CHECK (budget_level IN ('Low', 'Medium', 'High')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_skin_profiles_user ON skin_profiles(user_id);

-- Bảng chi tiết con: Hoạt chất dị ứng thuộc khối Digital Skin ID (Chuẩn 3NF)
CREATE TABLE IF NOT EXISTS user_allergies (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    ingredient_name VARCHAR(255) NOT NULL,
    note VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_allergies_user ON user_allergies(user_id);

-- ============================================================================
-- 3. TỪ ĐIỂN THÀNH PHẦN HOÁ HỌC (INGREDIENTS — INCI DICTIONARY)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ingredients (
    id SERIAL PRIMARY KEY,
    inci_name VARCHAR(255) UNIQUE NOT NULL,
    function_group VARCHAR(100) DEFAULT 'Other' NOT NULL, -- 'Exfoliating', 'Antioxidant', 'Hydrating', 'Soothing', 'Active'
    description TEXT,
    is_active_ingredient BOOLEAN DEFAULT FALSE NOT NULL,
    comedogenic_rating INT DEFAULT 0 CHECK (comedogenic_rating BETWEEN 0 AND 5),
    irritation_rating INT DEFAULT 0 CHECK (irritation_rating BETWEEN 0 AND 5)
);
CREATE INDEX IF NOT EXISTS idx_ingredients_inci ON ingredients(inci_name);

-- ============================================================================
-- 4. BẢNG DANH MỤC & THƯƠNG HIỆU (CATEGORIES & BRANDS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id INT REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    origin_country VARCHAR(100) DEFAULT 'United States'
);

-- ============================================================================
-- 5. BẢNG SẢN PHẨM & LIÊN KẾT THÀNH PHẦN (PRODUCTS & PRODUCT_INGREDIENTS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- Original Sephora Product Code (e.g. 'P473671')
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    brand_id INT REFERENCES brands(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    price_usd NUMERIC(10, 2) NOT NULL CHECK (price_usd >= 0),
    volume_ml INT,
    description TEXT,
    image_url VARCHAR(500), -- Relative static path (e.g. '/images/products/P505461.webp')
    ingredient_list_raw TEXT NOT NULL, -- Raw INCI ingredient string from packaging
    target_skin_types VARCHAR(50)[] NOT NULL, -- ARRAY['Oily', 'Combination']
    stock_quantity INT DEFAULT 100 NOT NULL CHECK (stock_quantity >= 0),
    selling_status VARCHAR(20) DEFAULT 'Active' NOT NULL, -- 'Active' | 'Draft' | 'Discontinued' (ADR-014 soft delete)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NULL
);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_selling_status ON products(selling_status);

CREATE TABLE IF NOT EXISTS product_ingredients (
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id INT REFERENCES ingredients(id) ON DELETE CASCADE,
    position_order INT NOT NULL,
    PRIMARY KEY (product_id, ingredient_id)
);
CREATE INDEX IF NOT EXISTS idx_prod_ing_ingredient ON product_ingredients(ingredient_id);

-- ============================================================================
-- 6. BẢNG QUY TẮC XUNG ĐỘT HOẠT CHẤT (CONFLICT_RULES)
-- ============================================================================
CREATE TABLE IF NOT EXISTS conflict_rules (
    id SERIAL PRIMARY KEY,
    active_ingredient_a VARCHAR(255) NOT NULL,
    active_ingredient_b VARCHAR(255) NOT NULL,
    severity VARCHAR(50) DEFAULT 'Warning' NOT NULL, -- 'Warning', 'Contraindication'
    reason TEXT NOT NULL,
    recommendation TEXT NOT NULL
);

-- ============================================================================
-- 7. BẢNG ĐÁNH GIÁ SẢN PHẨM (REVIEWS) — TỐI ƯU CHO 1.09 TRIỆU RECORDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS reviews (
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

-- CHỈ MỤC B-TREE TỐI ƯU TRUY VẤN LỌC REVIEW 1M DƯỚI 20MS
CREATE INDEX IF NOT EXISTS idx_reviews_product_skin ON reviews(product_id, skin_type);
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews(product_id, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_product_code ON reviews(product_code);

-- ============================================================================
-- 8. BẢNG ĐƠN HÀNG & CHI TIẾT ĐƠN HÀNG (ORDERS & ORDER_ITEMS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    recipient_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'COD' NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'Pending' NOT NULL,
    order_status VARCHAR(50) DEFAULT 'Pending' NOT NULL CHECK (order_status IN ('Pending', 'Delivering', 'Completed', 'Cancelled')),
    total_amount_usd NUMERIC(10, 2) NOT NULL CHECK (total_amount_usd >= 0),
    conflict_acknowledged BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_usd NUMERIC(10, 2) NOT NULL CHECK (unit_price_usd >= 0),
    total_price_usd NUMERIC(10, 2) NOT NULL CHECK (total_price_usd >= 0)
);

-- ============================================================================
-- 10. BẢNG LƯU CHU TRÌNH DƯỠNG DA (SAVED_ROUTINES)
-- ============================================================================
CREATE TABLE IF NOT EXISTS saved_routines (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    routine_name VARCHAR(255) NOT NULL,
    routine_type VARCHAR(50) DEFAULT 'Morning' NOT NULL CHECK (routine_type IN ('Morning', 'Night', 'Treatment')),
    items JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

---

# 3. CHIẾN LƯỢC DỮ LIỆU & SEEDING (DATA INGESTION & SEED STRATEGY)

Hệ thống tận dụng trực tiếp bộ dữ liệu thực tế có sẵn trong thư mục `docs/_data/cleaned/`:

### 3.1. Nguồn Dữ Liệu Thực Tế Khai Thác
1. **Sản phẩm & Thương hiệu (`docs/_data/cleaned/products_cleaned.csv`)**:
   - Gồm 8.494 sản phẩm mỹ phẩm thật từ Sephora (bao phủ 9 ngành hàng và 62 danh mục con, trong đó có 2.420 sản phẩm chuyên mục Skincare).
   - ETL nạp vào bảng `brands`, `categories`, và `products` (giữ nguyên giá gốc chuẩn USD `price_usd`, lưu mã gốc vào cột `code`, trạng thái `selling_status = 'Active'`).
   - Bóc tách chuỗi `ingredients` phân tách bằng dấu phẩy để nạp vào bảng `ingredients` và `product_ingredients`.
2. **Đánh giá Khách hàng (`docs/_data/cleaned/reviews_cleaned.csv`)**:
   - Gồm **1.094.197 dòng đánh giá thật** có phân loại da (`skin_type`: `combination`, `dry`, `oily`, `normal`, `unknown`).
   - ETL chuẩn hóa `INITCAP(skin_type)` thành (`Combination`, `Dry`, `Oily`, `Normal`, `Unknown`) và nạp vào bảng `reviews` liên kết theo `product_code` / `product_id`.
3. **Quy tắc mua kèm Routine (`docs/_data/cleaned/apriori_rules.csv`)**:
   - Gồm 15.259 luật kết hợp Apriori (`antecedent -> consequent`) hỗ trợ gợi ý routine và sản phẩm tương đồng.

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

// 3. Product & 3-Tier INCI Formula Breakdown DTOs
public record ProductSummaryDto(
    int Id, string Code, string Name, string Slug, string BrandName, string CategoryName,
    decimal PriceUsd, int? VolumeMl, string? ImageUrl, decimal Rating, int ReviewsCount,
    string[] TargetSkinTypes, string SuitabilityVerdict, string SuitabilityLabel,
    bool HasAllergyWarning, string? MatchedAllergen = null, string? SuitabilityReason = null,
    bool HasIngredients = true, bool IsNonCosmeticTool = false, string Department = "Skincare"
);

public record ProductDetailDto(
    int Id, string Code, string Name, string Slug, string BrandName, string CategoryName,
    decimal PriceUsd, int? VolumeMl, string? Description, string? ImageUrl,
    string IngredientListRaw, decimal Rating, int ReviewsCount, string[] TargetSkinTypes,
    int StockQuantity, IReadOnlyList<ProductIngredientDto> Ingredients,
    string SuitabilityVerdict, string SuitabilityLabel, bool HasAllergyWarning,
    string? MatchedAllergen = null, string? SuitabilityReason = null,
    bool HasIngredients = true, bool IsNonCosmeticTool = false, string Department = "Skincare",
    ProductFormulaBreakdownDto? FormulaBreakdown = null
);

public record ProductFormulaBreakdownDto(
    string TargetArea, string BenefitsTitle, IReadOnlyList<string> Benefits,
    IReadOnlyList<KeyIngredientDto> KeyIngredients, IReadOnlyList<FunctionalGroupDto> FunctionalGroups,
    IReadOnlyList<FormulaCautionDto> Cautions, string? FragranceDisclosure,
    int TotalIngredientsCount, IReadOnlyList<string> RawInciList
);

// 4. Conflict & INCI Analyzer Tool DTOs
public record ConflictCheckRequest(IReadOnlyList<int> ProductIds);
public record ConflictDetailDto(string ProductA, string ProductB, string IngredientA, string IngredientB, string Severity, string Reason, string Recommendation);
public record ConflictCheckResponse(bool HasConflict, IReadOnlyList<ConflictDetailDto> Conflicts);

// 5. Routine DTOs (Generated from Digital Skin ID)
public record GenerateRoutineRequest(string? SkinType = null, string? BudgetLevel = null, List<string>? SkinConcerns = null, string? PrimaryGoal = null);
public record RoutineStepDto(int StepOrder, string StepName, string Timing, string Description, ProductSummaryDto Product);
public record RoutineResultDto(List<ProductSummaryDto> AmRoutine, List<ProductSummaryDto> PmRoutine, List<RoutineStepDto> DetailedSteps, decimal TotalCostUsd, List<ConflictDetailDto> InternalConflicts);
public record SaveRoutineRequest(string RoutineName, string RoutineType, List<int> ProductIds, string? Notes = null);

// 6. Order DTOs (COD — No CouponCode in Phase 1)
public record CreateOrderItemRequest(int ProductId, int Quantity);
public record CreateOrderRequest(string RecipientName, string PhoneNumber, string ShippingAddress, string? Notes = null, bool ConflictAcknowledged = false, IReadOnlyList<CreateOrderItemRequest>? Items = null);
public record OrderDto(int OrderId, string OrderCode, string RecipientName, string PhoneNumber, string ShippingAddress, string PaymentMethod, string PaymentStatus, string Status, decimal TotalUsd, bool ConflictAcknowledged, DateTime CreatedAt, IReadOnlyList<OrderItemDto> Items);

// 7. Review & Admin DTOs
public record ProductReviewDto(long Id, int ProductId, string AuthorName, int Rating, string SkinType, string? SkinConcerns, string? Content, DateTime CreatedAt);
public record AdminKpisDto(int TotalProducts, int TotalOrders, decimal TotalRevenueUsd, int ActiveUsers, int PendingOrders);
public record AdminProductDto(int Id, string Code, string Name, string Slug, int BrandId, string BrandName, int CategoryId, string CategoryName, string Department, decimal PriceUsd, int? VolumeMl, int StockQuantity, string SellingStatus, string? Description, string? ImageUrl, string IngredientListRaw, string[] TargetSkinTypes, decimal Rating, int ReviewsCount, DateTime CreatedAtUtc, DateTime? UpdatedAtUtc);
public record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize, int Pages);
```

---

# 6. TÍCH HỢP TRỢ LÝ AI GEMINI (INFRASTRUCTURE ADAPTER)

## 6.1. Cấu hình Provider trong `BeautyAI.Infrastructure.Providers`
Tuân thủ nghiêm ngặt **Bài 4 của Test kiến trúc** (`ProviderLibrariesOnlyInAdapterLayerTests`), interface `IAiSkincareProvider` nằm tại tầng Application và class kết nối HTTP trực tiếp với Google Gemini 2.5 Flash chỉ nằm trong Infrastructure (`GeminiSkincareProvider`), đi kèm cơ chế dự phòng dựa trên bộ quy tắc khoa học (`GenerateRuleBasedFallback`):

```csharp
namespace BeautyAI.Infrastructure.Providers;

public class GeminiSkincareProvider : IAiSkincareProvider
{
    private readonly HttpClient _httpClient;
    private readonly string? _apiKey;

    public GeminiSkincareProvider(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["GEMINI_API_KEY"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
    }

    public async Task<string> ConsultAsync(
        string userMessage,
        DigitalSkinIdDto? skinId,
        IReadOnlyList<ProductSummaryDto> availableProducts,
        CancellationToken cancellationToken = default)
    {
        // 1. Build System Instruction với Grounding & Guardrails
        var systemPrompt = BuildSystemPrompt(skinId, availableProducts);
        
        // 2. Nếu có API Key, gọi POST tới Gemini 2.5 Flash API:
        // https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}
        
        // 3. Nếu offline hoặc hết quota, tự động fallback sang GenerateRuleBasedFallback
        return GenerateRuleBasedFallback(userMessage, skinId, availableProducts);
    }
}
```

## 6.2. Mẫu System Prompt chuẩn hóa cho Gemini API (Global English)
```text
You are Lumi, the AI Dermatology & Skincare Advisor for the BeautyAI platform.
Your mission is to provide evidence-based skincare routine guidance and product recommendations.

[USER DIGITAL SKIN ID]
- Skin Type: {SkinType}
- Safety Blacklist (STRICT ALLERGEN PROHIBITION): {AllergyList}
- Primary Concerns: {Concerns}
- Primary Skincare Goal: {PrimaryGoal}
- Budget Preference: {BudgetLevel}

[AVAILABLE IN-STOCK PRODUCT CATALOG]
{ProductsJson}

[STRICT CLINICAL & ETHICAL GUARDRAILS]
1. ZERO-ALLERGY TOLERANCE: Absolutely NEVER recommend any product containing ingredients listed in the user's Allergy Blacklist.
2. MEDICAL BOUNDARY: Never diagnose or prescribe treatments for severe clinical dermatological conditions (cystic acne conglobata, infected eczema, psoriasis, fungal infections). Advise consulting a board-certified dermatologist when encountering clinical pathology.
3. GROUNDING CONSTRAINT: ONLY recommend products from the [AVAILABLE IN-STOCK PRODUCT CATALOG] above, displaying the exact product name and price in USD ($).
4. Tone: Empathetic, scientific, objective, and clear.
```

---

# 7. DANH MỤC RESTFUL API CONTRACTS

| Nhóm chức năng | Method | Endpoint URL | Mã phản hồi | Mô tả tóm tắt |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/v1/auth/register` | `200 OK` | Đăng ký tài khoản khách hàng mới (băm PBKDF2, trả JWT) |
| | `POST` | `/api/v1/auth/login` | `200 OK` | Đăng nhập nhận JWT Token |
| | `GET` | `/api/v1/auth/me` | `200 OK` | Lấy thông tin tài khoản hiện tại kèm Digital Skin ID |
| | `PUT` | `/api/v1/auth/profile` | `200 OK` | Cập nhật họ tên, SĐT, địa chỉ nhận hàng |
| **Digital Skin ID** | `GET` | `/api/v1/skin-profile` | `200 OK` | Lấy trọn bộ hồ sơ Digital Skin ID thống nhất (kèm danh sách dị ứng) |
| | `PUT` | `/api/v1/skin-profile` | `200 OK` | Cập nhật hồ sơ da (Loại da, Dị ứng, Vấn đề da, Mục tiêu, Ngân sách) |
| | `POST` | `/api/v1/skin-profile/allergies` | `201 Created` | Thêm chất dị ứng vào Blacklist |
| | `DELETE` | `/api/v1/skin-profile/allergies/{id}` | `204 No Content` | Xóa chất dị ứng khỏi Blacklist |
| **Catalog & Reviews** | `GET` | `/api/v1/products` | `200 OK` | Lọc danh mục, tìm kiếm, lọc loại da/giá, toggle `safe_for_me` |
| | `GET` | `/api/v1/products/{id}` | `200 OK` | Chi tiết sản phẩm (theo ID/Slug/Code), Bảng INCI 3 tầng, `SuitabilityVerdict` |
| | `GET` | `/api/v1/products/{id}/similar` | `200 OK` | Gợi ý sản phẩm tương tự cùng danh mục (tự động loại trừ chất dị ứng) |
| | `GET` | `/api/v1/products/categories` | `200 OK` | Danh sách danh mục sản phẩm |
| | `GET` | `/api/v1/products/brands` | `200 OK` | Danh sách thương hiệu mỹ phẩm |
| | `GET` | `/api/v1/products/{id}/reviews` | `200 OK` | Lọc 1.09M reviews theo loại da (`skin_type`) & phân trang (< 20ms) |
| | `POST` | `/api/v1/products/{id}/reviews` | `201 Created` | Gửi nhận xét đánh giá mới cho sản phẩm |
| | `POST` | `/api/v1/reviews` | `201 Created` | Gửi nhận xét đánh giá sản phẩm (endpoint tương thích) |
| **Tools & Routine**| `POST` | `/api/v1/tools/analyze-inci` | `200 OK` | Phân tích bảng thành phần INCI 3 tầng theo 7 vùng chăm sóc (`[Authorize]`) |
| | `GET` | `/api/v1/tools/skintype-guide` | `200 OK` | Cẩm nang hoạt chất theo loại da và vùng chăm sóc (`[Authorize]`) |
| | `POST` | `/api/v1/tools/check-conflict` | `200 OK` | Quét xung đột hoạt chất trong giỏ hàng theo 12 quy tắc y khoa |
| | `POST` | `/api/v1/routines/generate` | `200 OK` | Tự động sinh chu trình Routine AM/PM từ Digital Skin ID |
| | `POST` | `/api/v1/routines/save` | `201 Created` | Lưu chu trình vào hồ sơ cá nhân (`[Authorize]`) |
| | `GET` | `/api/v1/routines/my-routines` | `200 OK` | Lấy danh sách các chu trình đã lưu (`[Authorize]`) |
| | `DELETE` | `/api/v1/routines/{id}` | `204 No Content` | Xóa chu trình đã lưu (`[Authorize]`) |
| **Orders** | `POST` | `/api/v1/orders` | `201 Created` | Đặt hàng thanh toán COD, trừ tồn kho, sinh mã `BA-YYYYMMDD-XXXX` |
| | `GET` | `/api/v1/orders/my-orders` | `200 OK` | Xem lịch sử các đơn hàng COD đã đặt |
| **AI** | `POST` | `/api/v1/ai/consult` | `200 OK` | Tư vấn mỹ phẩm với Gemini 2.5 Flash + thẻ sản phẩm gợi ý tương tác |
| **Admin** (`Admin` role) | `GET` | `/api/v1/admin/dashboard` | `200 OK` | Bảng điều khiển KPI & thống kê dữ liệu thật trên 8.494 SP & 1.09M reviews |
| | `GET` | `/api/v1/admin/kpis` | `200 OK` | Xem 4 thẻ chỉ số KPI tổng quan |
| | `GET` | `/api/v1/admin/products` | `200 OK` | Danh sách sản phẩm quản trị (lọc `query`, `brand`, `category`, `status`, phân trang) |
| | `GET` | `/api/v1/admin/products/{id}` | `200 OK` | Chi tiết sản phẩm quản trị ở mọi trạng thái |
| | `POST` | `/api/v1/admin/products` | `201 Created` | Thêm sản phẩm mới và đồng bộ chuỗi INCI vào `product_ingredients` |
| | `PUT` | `/api/v1/admin/products/{id}` | `200 OK` | Cập nhật sản phẩm & đồng bộ lại INCI khi thay đổi |
| | `DELETE` | `/api/v1/admin/products/{id}` | `204 No Content` | Ngừng bán sản phẩm (soft delete: `selling_status = Discontinued`) |
| | `PATCH` | `/api/v1/admin/products/{id}/restore` | `200 OK` | Khôi phục sản phẩm về trạng thái `Active` |
| | `GET` | `/api/v1/admin/orders` | `200 OK` | Danh sách đơn hàng COD quản trị |
| | `PATCH` | `/api/v1/admin/orders/{id}/status`| `200 OK` | Cập nhật trạng thái đơn COD (`Pending` ➔ `Delivering` ➔ `Completed` / `Cancelled`) |

---

# 8. MÔI TRƯỜNG TRIỂN KHAI & CHẠY THỬ NGHIỆM (LOCAL DOCKER RUNBOOK)

Hệ thống được đóng gói chạy kiểm thử cục bộ hoàn toàn trên máy Mac theo đúng [ADR-013](file:///Users/trucuyen/Documents/beauty_ai/docs/adr/ADR-013-docker-compose-deploy-test.md):
- **PostgreSQL 17 Container:** Chạy trên cổng 5432 qua Docker Compose.
- **Backend API:** Chạy tại `http://localhost:5000` (OpenAPI spec tại `http://localhost:5000/openapi/v1.json`).
- **Frontend React:** Chạy tại `http://localhost:5173` qua Vite dev server.
- **Lệnh điều hành chuẩn:**
  ```bash
  # Khởi động PostgreSQL
  docker compose up -d postgres
  
  # Khởi chạy toàn bộ hệ thống phát triển
  ./scripts/dev
  ```
