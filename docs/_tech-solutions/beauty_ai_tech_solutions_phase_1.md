---
doc: tech-solutions-beautyai-phase1
title: Technical Solutions & Architecture Specification — BeautyAI Phase 1 MVP (.NET & React)
status: stable
precedence: 2
owner: Solution Architect / Tech Lead
last_reviewed: 2026-10-26
---

# THIẾT KẾ GIẢI PHÁP KỸ THUẬT & KIẾN TRÚC — BEAUTYAI PHASE 1 (MVP)

> **Dành riêng cho Phase 1 MVP (Thời hạn 30 ngày, Solo Developer).**
> **Ràng buộc công nghệ cốt lõi:** Chỉ sử dụng **.NET 10** cho Backend và **React** cho Frontend; CSDL **PostgreSQL 17**; AI **Google Gemini API**.
> **Triết lý kiến trúc:** Simple-but-Efficient (Đơn giản nhưng mạnh mẽ, bảo trì cao), loại bỏ tối đa các thành phần hạ tầng phức tạp chưa cần thiết (No Redis, No MQ, No Kubernetes), tối ưu hóa thời gian phát triển để launch sản phẩm chạy thực tế.

---

## 1. TỔNG QUAN NGĂN XẾP CÔNG NGHỆ (TECH STACK)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   FRONTEND: React 19 + Vite (SPA)                      │
│   - React 19 / TypeScript / JSX (Tận dụng UI docs/_ui-ux_design/phase_1)│
│   - Styling: CSS Modules / Vanilla Responsive Design                   │
│   - API Client: openapi-fetch (ADR-008) / Axios REST Client            │
│   - State Management: React Context API (Auth, Cart, SkinProfile)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON REST APIs (/api/v1/...)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    BACKEND: C# .NET 10 Web API                         │
│   - Clean Architecture: Api -> Application -> Domain <- Infrastructure │
│   - ORM & Data Access: EF Core 10 (Commands) + Dapper (High-speed Query│
│   - Auth: JWT (JSON Web Token) / PBKDF2 Password Hashing               │
│   - OpenAPI Specification: Microsoft.AspNetCore.OpenApi auto-gen       │
│   - Background Tasks: .NET BackgroundService (In-Process)             │
│   - Cache: IMemoryCache (In-Memory cho Category, INCI Dictionary)      │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
┌───────────────────▼─────────────┐   ┌──────────────▼───────────────────┐
│     DATABASE: PostgreSQL 17     │   │     AI ENGINE: Google Gemini     │
│   - Chạy trên Docker Compose    │   │   - Gemini 2.5 Flash API         │
│   - Index tối ưu tập 1M Review  │   │   - Grounding sản phẩm sàn       │
│   - Ràng buộc CHECK khoa học    │   │   - Safety Guardrails y khoa     │
└─────────────────────────────────┘   └──────────────────────────────────┘
```

---

## 2. KIẾN TRÚC PHÂN TẦNG CLEAN ARCHITECTURE (.NET 10)

Tuân thủ nghiêm ngặt quy tắc phụ thuộc một chiều (Dependency Rule) và kiểm thử tự động tại `BeautyAI.ArchitectureTests`:

### 2.1. `BeautyAI.Domain` (Core Nghiệp Vụ — Thuần C#, 0 Dependency)
- **Entities:**
  - `User`: Quản lý tài khoản, mật khẩu băm, quyền hạn (`Role: CUSTOMER | ADMIN`).
  - `SkinProfile`: Hồ sơ da (`SkinType`, `IsSensitive`, `SkinConcerns`, `AllergyBlacklist`).
  - `Product`: Thông tin sản phẩm, thương hiệu, danh mục, giá bán VND, dung tích, hình ảnh.
  - `Ingredient`: Danh mục hoạt chất quốc tế INCI, tên tiếng Việt, nhóm công năng, mức độ an toàn.
  - `ProductIngredient`: Bảng liên kết sản phẩm - thành phần kèm vị trí nồng độ (`OrderIndex`).
  - `ConflictRule`: Bộ quy tắc xung đột da liễu giữa cặp hoạt chất (`IngredientAId`, `IngredientBId`, `Reason`, `Recommendation`).
  - `Cart` & `CartItem`: Giỏ hàng phiên làm việc của khách hàng.
  - `Order` & `OrderItem`: Đơn hàng snapshot giá, thông tin giao hàng COD và trạng thái xử lý.
  - `Review`: Đánh giá 1–5 sao kèm loại da của người đánh giá (`UserSkinType`).
- **Invariants & Domain Rules:**
  - **INV-01:** Tuyệt đối không có bất kỳ thuộc tính hay trường dữ liệu nào mang tên `SafetyScore`, `HazardScore` (bảo vệ uy tín khoa học theo BRD). Thay thế bằng `SuitabilityScore` (0–100%).
  - **BR-PRICE-01:** Toàn bộ tiền tệ xử lý duy nhất bằng **VND (₫)**, kiểu số nguyên `long` hoặc `decimal(18,0)` không chứa số lẻ thập phân.

### 2.2. `BeautyAI.Application` (Use Cases & Business Logic)
- Không phụ thuộc vào EF Core hay HttpContext (Decoupled).
- **Services & Use Cases:**
  - `IAuthService` & `AuthService`: Đăng ký, đăng nhập, đổi mật khẩu, kiểm tra quyền hạn.
  - `ISkinProfileService`: Lưu trữ hồ sơ da, cập nhật danh sách Allergy Blacklist.
  - `IProductService`: Tìm kiếm sản phẩm, lọc theo loại da, công tắc "An toàn cho da tôi".
  - `IInciAnalyzerService`: Parser chuỗi thành phần tự do, bóc tách công năng, đối chiếu Skin ID.
  - `IConflictDetectorService`: Quét giỏ hàng, phát hiện các cặp hoạt chất kỵ nhau, sinh giải pháp giãn cữ AM/PM.
  - `IRoutineBuilderService`: Thuật toán sinh Routine từ kết quả Skin Quiz, hỗ trợ Chat-to-Cart.
  - `IOrderService`: Tạo đơn hàng COD, tra cứu lịch sử đơn, cập nhật trạng thái đơn (Admin).
  - `IAiAssistantService`: Tích hợp Gemini API, đính kèm context Skin ID và danh mục sản phẩm sàn.
  - `IReviewService`: Lấy danh sách review, lọc review theo loại da người dùng.

### 2.3. `BeautyAI.Infrastructure` (Data Access & External Adapters)
- **Database Context:** `BeautyAIDbContext` triển khai bằng Entity Framework Core 10 cho các thao tác ghi (Create/Update/Delete) và quản lý Migration.
- **High-speed Query (Dapper):** Sử dụng Dapper thực thi các câu truy vấn phức tạp trên bảng sản phẩm và tập 1 triệu review nhằm đạt thời gian phản hồi < 50ms.
- **Provider Adapters:**
  - `GeminiApiClient` (trong `Infrastructure/Providers/`): Đóng gói `HttpClient` gọi Gemini REST API với cấu hình timeout 10 giây và cơ chế tự động thử lại khi gặp rate limit.
  - `JwtTokenService`: Ký và xác thực mã thông báo JWT bằng thuật toán HMAC-SHA256 an toàn.
  - `Pbkdf2PasswordHasher`: Mã hóa băm mật khẩu chuẩn bảo mật cao.

### 2.4. `BeautyAI.Api` (Presentation & HTTP Endpoints)
- Cung cấp danh mục REST API chuẩn `/api/v1/...` (JSON UTC ISO-8601).
- Tự động phát hành tài liệu OpenAPI Specification tại `docs/api/BeautyAI.Api.json` khi build (ADR-008).
- Global Exception Middleware xử lý lỗi tập trung, trả về format lỗi chuẩn:
  ```json
  { "error": { "code": "ALLERGY_DETECTED", "message": "Sản phẩm chứa thành phần dị ứng của bạn." } }
  ```

---

## 3. THIẾT KẾ LƯỢC ĐỒ CSDL POSTGRESQL 17 (DATABASE SCHEMA)

Lược đồ CSDL Phase 1 được tối giản hóa còn **10 bảng trọng tâm**, đảm bảo toàn vẹn dữ liệu và tốc độ truy vấn vượt trội:

```sql
-- 1. Bảng Người dùng
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 2. Bảng Hồ sơ da (Digital Skin ID)
CREATE TABLE skin_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    skin_type VARCHAR(50) NOT NULL CHECK (skin_type IN ('Oily', 'Dry', 'Combination', 'Normal')),
    is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
    skin_concerns TEXT[] DEFAULT '{}', -- Mảng các vấn đề: Acne, DarkSpots, Aging...
    allergy_ingredients TEXT[] DEFAULT '{}', -- Mảng tên hoạt chất dị ứng (Allergy Blacklist)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Danh mục sản phẩm (2 cấp)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    display_order INT DEFAULT 0
);

-- 4. Bảng Thương hiệu
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    logo_url VARCHAR(500)
);

-- 5. Bảng Sản phẩm
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id INT REFERENCES brands(id) ON DELETE RESTRICT,
    category_id INT REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(300) UNIQUE NOT NULL,
    price_vnd BIGINT NOT NULL CHECK (price_vnd >= 0),
    volume VARCHAR(50),
    image_url VARCHAR(500) NOT NULL,
    description TEXT,
    suitable_skin_types VARCHAR(50)[] DEFAULT '{}', -- ['Oily', 'Combination']
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_products_category ON products(category_id, is_active);
CREATE INDEX idx_products_price ON products(price_vnd);

-- 6. Từ điển thành phần INCI
CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    inci_name VARCHAR(200) UNIQUE NOT NULL,
    vietnamese_name VARCHAR(250),
    function_category VARCHAR(100) NOT NULL, -- Dưỡng ẩm, Làm dịu, Chống lão hóa, Tẩy da chết...
    safety_tier VARCHAR(20) NOT NULL CHECK (safety_tier IN ('Safe', 'Caution', 'Irritant')),
    comedogenic_rating INT DEFAULT 0 CHECK (comedogenic_rating BETWEEN 0 AND 5),
    description TEXT
);
CREATE INDEX idx_ingredients_name ON ingredients(inci_name);

-- 7. Bảng liên kết Sản phẩm - Thành phần
CREATE TABLE product_ingredients (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id INT REFERENCES ingredients(id) ON DELETE RESTRICT,
    order_index INT NOT NULL, -- Thứ tự nồng độ giảm dần
    PRIMARY KEY (product_id, ingredient_id)
);
CREATE INDEX idx_product_ingredients_lookup ON product_ingredients(ingredient_id, product_id);

-- 8. Bộ quy tắc xung đột hoạt chất (Conflict Rules)
CREATE TABLE conflict_rules (
    id SERIAL PRIMARY KEY,
    ingredient_a_name VARCHAR(150) NOT NULL,
    ingredient_b_name VARCHAR(150) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'WARNING' CHECK (severity IN ('WARNING', 'DANGER')),
    reason TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    UNIQUE (ingredient_a_name, ingredient_b_name)
);

-- 9. Đơn hàng (Orders & Items)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    order_code VARCHAR(30) UNIQUE NOT NULL, -- ORD-20261026-XXXX
    total_amount_vnd BIGINT NOT NULL CHECK (total_amount_vnd >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SHIPPING', 'DELIVERED', 'CANCELLED')),
    payment_method VARCHAR(20) NOT NULL DEFAULT 'COD',
    recipient_name VARCHAR(150) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    order_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    unit_price_vnd BIGINT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0)
);

-- 10. Đánh giá sản phẩm (Hỗ trợ Dataset 1 triệu review)
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewer_name VARCHAR(150) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    user_skin_type VARCHAR(50) CHECK (user_skin_type IN ('Oily', 'Dry', 'Combination', 'Normal', 'Unknown')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Index tối ưu truy vấn lọc review theo Loại da của tập 1M records:
CREATE INDEX idx_reviews_product_skintype ON reviews(product_id, user_skin_type, rating DESC);
```

---

## 4. THIẾT KẾ CÁC THUẬT TOÁN USP CỐT LÕI

### 4.1. Thuật toán Tính Điểm Phù Hợp (Suitability / Match Score)
*Mục đích:* Đưa ra % phù hợp của sản phẩm với làn da khách hàng mà không vi phạm nguyên tắc INV-01.

```csharp
public int CalculateMatchScore(Product product, SkinProfile profile)
{
    // Bước 1: Kiểm tra Allergy Blacklist (Ràng buộc cứng)
    var productIngredients = product.Ingredients.Select(i => i.InciName.ToLower()).ToHashSet();
    foreach (var allergen in profile.AllergyIngredients)
    {
        if (productIngredients.Contains(allergen.ToLower()))
        {
            return 0; // Kích ứng cơ địa: Điểm 0 tuyệt đối và gắn cờ cảnh báo đỏ
        }
    }

    int score = 65; // Điểm nền tảng

    // Bước 2: Khớp Loại da (+20 điểm)
    if (product.SuitableSkinTypes.Contains(profile.SkinType))
    {
        score += 20;
    }

    // Bước 3: Khớp Da nhạy cảm (+10 điểm nếu lành tính, -20 nếu chứa hoạt chất dễ kích ứng)
    if (profile.IsSensitive)
    {
        bool hasIrritants = product.Ingredients.Any(i => i.SafetyTier == "Irritant");
        score += hasIrritants ? -25 : 10;
    }

    // Bước 4: Khớp Vấn đề da quan tâm (+5 điểm cho mỗi vấn đề giải quyết được, tối đa +15)
    int concernMatchCount = product.Ingredients
        .Count(i => profile.SkinConcerns.Any(c => MatchesConcern(i.FunctionCategory, c)));
    score += Math.Min(concernMatchCount * 5, 15);

    return Math.Clamp(score, 10, 99);
}
```

### 4.2. Thuật toán Phát Hiện Xung Đột Hoạt Chất (Conflict Detector)
*Mục đích:* Quét toàn bộ sản phẩm trong giỏ hàng, đối chiếu cặp hoạt chất kỵ nhau.

```csharp
public List<ConflictAlert> DetectConflicts(List<CartItem> cartItems, List<ConflictRule> rules)
{
    var alerts = new List<ConflictAlert>();
    
    // Thu thập tất cả các cặp sản phẩm trong giỏ hàng (Tổ hợp C(n, 2))
    for (int i = 0; i < cartItems.Count; i++)
    {
        for (int j = i + 1; j < cartItems.Count; j++)
        {
            var p1 = cartItems[i].Product;
            var p2 = cartItems[j].Product;

            foreach (var rule in rules)
            {
                bool match1 = p1.HasIngredient(rule.IngredientAName) && p2.HasIngredient(rule.IngredientBName);
                bool match2 = p1.HasIngredient(rule.IngredientBName) && p2.HasIngredient(rule.IngredientAName);

                if (match1 || match2)
                {
                    alerts.Add(new ConflictAlert
                    {
                        ProductA = p1.Name,
                        ProductB = p2.Name,
                        IngredientA = rule.IngredientAName,
                        IngredientB = rule.IngredientBName,
                        Severity = rule.Severity,
                        Explanation = rule.Reason,
                        Recommendation = rule.Recommendation
                    });
                }
            }
        }
    }
    return alerts;
}
```

### 4.3. Thuật toán Gợi ý Routine Builder (Chat-to-Cart)
*Mục đích:* Từ kết quả Skin Quiz 4 câu hỏi -> Tạo 1 bộ Routine AM/PM tối ưu ngân sách và không kỵ nhau.
1. Lấy danh mục sản phẩm bắt buộc:
   - AM: Sữa rửa mặt -> Toner/Serum -> Kem dưỡng -> Kem chống nắng.
   - PM: Tẩy trang -> Sữa rửa mặt -> Serum đặc trị -> Kem dưỡng khóa ẩm.
2. Với mỗi bước, chọn sản phẩm có `MatchScore` cao nhất cho Skin Profile và nằm trong khoảng ngân sách.
3. Rà soát chéo: Nếu bước Serum PM (chứa Retinol) mà bước Toner (chứa BHA), hệ thống tự động hoán đổi sản phẩm Toner sang loại cấp ẩm phục hồi (Centella / Hyaluronic Acid) để loại bỏ xung đột.
4. Trả về payload danh sách Product IDs -> Frontend kích hoạt 1 nút **"Chat-to-Cart"** thêm đồng loạt vào giỏ hàng.

---

## 5. TÍCH HỢP GEMINI AI BACKEND GATEWAY

Tích hợp trực tiếp Google Gemini API qua backend .NET nhằm bảo mật API Key và áp dụng Guardrails y khoa:

```csharp
public async Task<AiChatResponse> AskSkincareAssistantAsync(string userMessage, Guid? userId)
{
    // Lấy context hồ sơ da nếu user đã đăng nhập
    SkinProfile profile = userId.HasValue ? await _profileRepo.GetByUserIdAsync(userId.Value) : null;
    
    // Lấy top 30 sản phẩm nổi bật của sàn để AI grounding
    var topProducts = await _productRepo.GetTopSellingProductsAsync(30);

    var systemPrompt = $@"
Bạn là Chuyên gia tư vấn mỹ phẩm & chăm sóc da liễu thông minh của BeautyAI.
Nhiệm vụ của bạn là tư vấn chu trình chăm sóc da khoa học, an toàn, dễ hiểu.

QUY TẮC AN TOÀN TUYỆT ĐỐI (GUARDRAILS):
1. Bạn KHÔNG PHẢI BÁC SĨ. Tuyệt đối KHÔNG chẩn đoán bệnh lý da liễu nghiêm trọng (như viêm da tiếp xúc cấp tính, vảy nến, chàm lở loét, mụn mủ bội nhiễm). Nếu người dùng mô tả các triệu chứng này, hãy lịch sự khuyên họ đến bệnh viện da liễu thăm khám.
2. Tuyệt đối KHÔNG sử dụng khái niệm 'SafetyScore' hay 'Điểm an toàn'. Hãy giải thích theo sự phù hợp với từng nền da.
3. Luôn ưu tiên giới thiệu các sản phẩm đang có bán tại BeautyAI sau đây:
{string.Join("\n", topProducts.Select(p => $"- {p.Name} ({p.PriceVnd:N0}đ): phù hợp {string.Join(",", p.SuitableSkinTypes)}"))}

HỒ SƠ DA CỦA KHÁCH HÀNG HIỆN TẠI:
- Loại da: {profile?.SkinType ?? "Chưa xác định"}
- Da nhạy cảm: {(profile?.IsSensitive == true ? "Có" : "Không")}
- Danh sách dị ứng (Allergy Blacklist - TUYỆT ĐỐI TRÁNH): {string.Join(", ", profile?.AllergyIngredients ?? new List<string>())}
";

    // Gọi Gemini API qua HttpClient
    var response = await _geminiClient.GenerateContentAsync(systemPrompt, userMessage);
    return new AiChatResponse { Reply = response };
}
```

---

## 6. DANH MỤC REST API CHÍNH (PHASE 1 CONTRACT)

| Method | Endpoint | Quyền | Chức năng |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | GUEST | Đăng ký tài khoản mới |
| `POST` | `/api/v1/auth/login` | GUEST | Đăng nhập & cấp JWT |
| `GET` | `/api/v1/auth/me` | CUSTOMER | Xem thông tin cá nhân & Profile |
| `PUT` | `/api/v1/auth/profile` | CUSTOMER | Cập nhật thông tin cá nhân |
| `GET` | `/api/v1/skin-profile` | CUSTOMER | Lấy Digital Skin ID & Allergy Blacklist |
| `PUT` | `/api/v1/skin-profile` | CUSTOMER | Cập nhật Skin Type, Concerns & Blacklist |
| `GET` | `/api/v1/categories` | ALL | Cây danh mục 2 cấp |
| `GET` | `/api/v1/products` | ALL | Danh sách sản phẩm (hỗ trợ filter, paging, sort, switch "An toàn cho da") |
| `GET` | `/api/v1/products/{id}` | ALL | Chi tiết sản phẩm, bảng INCI, tính Match Score |
| `POST` | `/api/v1/inci/analyze` | ALL | Phân tích chuỗi INCI tự do dán vào textarea |
| `POST` | `/api/v1/cart/conflicts` | ALL | Quét danh sách sản phẩm trong giỏ hàng tìm xung đột |
| `POST` | `/api/v1/quiz/routine` | ALL | Sinh Routine AM/PM từ câu trả lời Quiz |
| `POST` | `/api/v1/orders` | CUSTOMER | Tạo đơn hàng mới (COD) |
| `GET` | `/api/v1/orders/my-orders`| CUSTOMER | Xem lịch sử đơn hàng của tôi |
| `POST` | `/api/v1/ai/consult` | ALL | Chat với trợ lý Gemini AI |
| `GET` | `/api/v1/reviews/product/{id}`| ALL | Lấy đánh giá sản phẩm (hỗ trợ lọc theo `skin_type`) |
| `POST` | `/api/v1/reviews` | CUSTOMER | Gửi đánh giá cho sản phẩm đã mua |
| `GET` | `/api/v1/admin/dashboard` | ADMIN | Thống kê KPI tổng quan |
| `POST` | `/api/v1/admin/products` | ADMIN | Tạo mới sản phẩm |
| `PUT` | `/api/v1/admin/products/{id}`| ADMIN | Cập nhật sản phẩm & INCI |
| `PUT` | `/api/v1/admin/orders/{id}/status`| ADMIN | Cập nhật trạng thái đơn hàng |

---

## 7. MÔ HÌNH TRIỂN KHAI & VẬN HÀNH DÀNH CHO SOLO DEV

- **Local Development:**
  - Database: `docker compose up -d postgres` (Port 5432).
  - Backend: `dotnet run --project src/BeautyAI.Api` (Port 5000/5001).
  - Frontend: `npm run dev` trong `docs/_ui-ux_design/phase_1` hoặc `src/frontend` (Port 5173).
- **Production Launch (Deploy Test trên máy Mac / VPS Ubuntu):**
  - Đóng gói Docker Compose duy nhất ([ADR-013](file:///Users/trucuyen/Documents/beauty_ai/docs/adr/ADR-013-local-mac-test-deployment.md)): `beautyai-api` + `beautyai-web` + `postgres:17`.
  - Một lệnh duy nhất: `./scripts/deploy-test` đưa toàn bộ hệ thống lên sóng chỉ trong 60 giây.
