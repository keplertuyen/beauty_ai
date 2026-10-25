# BẢN ĐẶC TẢ YÊU CẦU PHẦN MỀM HOÀN CHỈNH (PRD & SOFTWARE SPECIFICATION)
## Nền Tảng Thương Mại Điện Tử Mỹ Phẩm Thông Minh & Trợ Lý AI Chăm Sóc Da Cá Nhân Hóa (BeautyAI)

> **Dự án:** BeautyAI Platform  
> **Phiên bản:** 2.0 (Tailored & Production-Ready for Sephora Dataset)  
> **Áp dụng:** Phù hợp với kiến trúc thực tế của đồ án tốt nghiệp và khung năng lực phát triển phần mềm.

---

## 1. TỔNG QUAN DỰ ÁN & TẦM NHÌN SẢN PHẨM

### 1.1. Bối cảnh & Nỗi đau của người tiêu dùng mỹ phẩm
- **Ma trận thành phần (INCI) phức tạp:** Người tiêu dùng rất khó tự đọc hiểu danh sách hàng chục hóa chất tiếng Anh in sau bao bì, dẫn đến rủi ro kích ứng hoặc chọn sai sản phẩm cho tình trạng da.
- **Trào lưu "Skintellectual" của thế hệ trẻ:** Khách hàng hiện đại không chỉ mua hàng theo quảng cáo mà đặc biệt quan tâm tới hoạt chất (Niacinamide, BHA, Retinol), chứng nhận thuần chay (Vegan), không thử nghiệm trên động vật (Cruelty-Free), và độ lành tính.
- **Xung đột hoạt chất nguy hiểm:** Rất nhiều người dùng tự phối hợp các hoạt chất mạnh (như BHA, Retinol, AHA, Vitamin C nồng độ cao) trong cùng một buổi dẫn đến tổn thương hàng rào bảo vệ da (skin barrier).
- **Rào cản khi mua mỹ phẩm quốc tế:** Dữ liệu sản phẩm chuẩn quốc tế thường niêm yết bằng USD, thiếu tư vấn thành phần bằng tiếng Việt, và thiếu các công cụ đối soát an toàn trực quan.

### 1.2. Tầm nhìn & Định vị sản phẩm
Xây dựng **BeautyAI** — Nền tảng thương mại điện tử mỹ phẩm cao cấp tích hợp AI, kết hợp trải nghiệm mua sắm mượt mà, minh bạch dữ liệu thành phần khoa học, cùng hệ thống gợi ý cá nhân hóa đa tầng dựa trên 8,494 sản phẩm chính hãng và hơn 1.1 triệu đánh giá thực tế.

### 1.3. Đề xuất giá trị độc nhất (USP)
1. **Multi-Engine Smart Recommendation:** Kết hợp đồng thời 4 mô hình gợi ý (Skin Quiz 4 tầng, TF-IDF Content-Based, TruncatedSVD Collaborative Filtering, và Apriori Association Rules).
2. **Transparent Clean Beauty Engine:** Số hóa hồ sơ thành phần (INCI), phân tích chỉ số an toàn (Safety Score 1-10) và chỉ số gây bít tắc lỗ chân lông (Comedogenic Rating 0-5).
3. **Smart Conflict Detector:** Cảnh báo tự động các cặp hoạt chất kỵ nhau khi người dùng thêm sản phẩm vào giỏ hoặc xây dựng chu trình dưỡng da.
4. **Routine Builder & Chat-to-Cart:** Khảo sát tình trạng da và tự động tạo chu trình 3-5 bước (Sáng/Tối) kèm nút "Thêm toàn bộ Routine vào giỏ hàng".
5. **Hỗ trợ Song tệ Linh hoạt (Dual Currency VND & USD):** Mua sắm thuận tiện với tỷ giá quy đổi tức thời, đảm bảo lưu vết chính xác giá trị giao dịch.

---

## 2. BENCHMARK ĐỐI THỦ & BÀI HỌC ÁP DỤNG

| Đối thủ | Điểm mạnh | Điểm hạn chế | Bài học tối ưu cho BeautyAI |
|---|---|---|---|
| **Hasaki.vn** | Logistics mạnh, giỏ hàng tối ưu, danh mục lớn. | Giao diện dày đặc banner, chưa có công cụ đọc hiểu chuyên sâu thành phần. | Học hỏi kiến trúc giỏ hàng, checkout nhanh; nâng cấp giao diện tinh gọn và trợ lý thành phần. |
| **Watsons VN** | Thương hiệu uy tín, hệ thống loyalty tốt. | Bộ lọc theo hoạt chất chưa sâu, ứng dụng di động còn độ trễ. | Tối ưu hóa bộ lọc Smart Filter (Vegan, Cruelty-free, Hoạt chất chính). |
| **Incidecoder** | Cơ sở dữ liệu thành phần chuẩn xác, phân tích chi tiết. | Trang tra cứu thuần túy, không có tính năng thương mại điện tử và mua sắm. | Tích hợp bảng giải nghĩa thành phần khoa học trực tiếp vào trang chi tiết sản phẩm (PDP). |
| **Olive Young** | Thiết kế phẳng tối giản, thời thượng, chuẩn Gen Z. | Rào cản ngôn ngữ và vận chuyển quốc tế đối với người dùng Việt Nam. | Áp dụng ngôn ngữ thiết kế Flat & Clean, thẻ tag trực quan và trải nghiệm xem sản phẩm sang trọng. |

---

## 3. QUY CHUẨN THIẾT KẾ UI/UX

- **Phong cách chủ đạo:** Flat Design & Minimalist Aesthetics kết hợp tông màu ấm cao cấp (Warm Elegant Nude & Rose Gold) và sắc xanh lá dịu mát (Clean Skincare Sage) đại diện cho mỹ phẩm sạch.
- **Thẻ bo góc mềm mại:** Border-radius từ 12px đến 16px tạo cảm giác lành tính, thân thiện với làn da.
- **Không gian thoáng đãng:** Sử dụng khoảng trắng hợp lý, loại bỏ các hiệu ứng bóng đổ nặng nề hoặc banner nhấp nháy gây rối mắt.
- **Tương tác trực quan:**
  - Ngăn kéo giỏ hàng trượt (Cart Drawer) thêm nhanh sản phẩm không cần tải lại trang.
  - Biểu đồ phân bổ tỷ lệ công năng thành phần (Dưỡng ẩm, Làm dịu, Chống oxy hóa, Đặc trị) hiển thị dạng thanh trực quan qua thư viện Recharts.
  - Nút chuyển đổi nhanh tiền tệ (VND / USD) và ngôn ngữ (VI / EN) ngay trên thanh điều hướng Navbar.

---

## 4. KIẾN TRÚC KỸ THUẬT TỔNG THỂ (HYBRID DUAL-ENGINE ARCHITECTURE)

Hệ thống áp dụng mô hình phân tách trách nhiệm tối ưu:

```text
                       React 18 + Vite Frontend (:5173)
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
      .NET 8 WebAPI (:5000)                   FastAPI AI Service (:8000)
   (Lõi Thương Mại & Giao Dịch)              (Lõi Trí Tuệ Nhân Tạo & ML)
   ├── Clean Architecture                   ├── Skin Quiz 4 tầng Deterministic
   ├── JWT Auth & Role-based access         ├── TF-IDF Cosine Similarity (CB)
   ├── Product Catalog & Smart Filter       ├── TruncatedSVD Collaborative Filtering
   ├── Cart, Order & Voucher Engine         ├── Apriori Rule Mining (Combo mua kèm)
   ├── EF Core ORM + Dapper Stored Procs    ├── Smart Conflict Detector (Kỵ chất)
   └── Quản lý Tỷ giá Song tệ VND/USD       └── Ingredient Safety Analyzer
                   │                                     │
                   └──────────────────┬──────────────────┘
                                      ▼
                        PostgreSQL Database (Supabase)
                         + In-RAM DataFrames (Tầng 3)
```

### 4.1. Phân định vai trò các công nghệ
- **Frontend (React 18 + Vite):** Đảm bảo tốc độ tải trang dưới 1 giây, điều hướng mượt mà qua React Router DOM v7, quản lý trạng thái tập trung với React Context, chuyển động tinh tế với Framer Motion.
- **Backend Commerce (.NET 8 WebAPI):** Triển khai theo mô hình Clean Architecture (Domain, Application, Infrastructure, WebAPI). Sử dụng EF Core cho nghiệp vụ CRUD và Dapper kết hợp Stored Procedures cho các báo cáo doanh thu tối ưu cao.
- **Backend AI (Python FastAPI):** Chuyên trách xử lý khoa học dữ liệu, nạp 8,494 sản phẩm từ RAM DataFrame để phục vụ các thuật toán gợi ý và phân tích thành phần với độ trễ dưới 50ms.
- **Cơ sở dữ liệu:** PostgreSQL lưu trữ người dùng, hồ sơ da, đơn hàng, giỏ hàng, mã giảm giá và danh mục; kết hợp lưu trữ dự phòng ngoại tuyến JSON/SQLite.

---

## 5. ĐẶC TẢ YÊU CẦU CHỨC NĂNG CHI TIẾT (FRD)

### Module 1: Danh mục & Bộ lọc Thông minh (Smart Filter)
- **Tìm kiếm đa tiêu chí:** Tìm kiếm tức thì theo tên sản phẩm, thương hiệu, công dụng.
- **Lọc theo chứng nhận:** Thuần chay (Vegan: 2,623 sản phẩm), Không thử nghiệm trên động vật (Cruelty-Free: 1,775 sản phẩm), Mỹ phẩm sạch (Clean at Sephora: 1,534 sản phẩm).
- **Lọc loại trừ (Free-of):** Không cồn khô (Alcohol-free), Không hương liệu (Fragrance-free), Không paraben, Không dầu khoáng (kết hợp nhãn highlights và quét danh sách thành phần).
- **Lọc theo hoạt chất trọng tâm:** Lọc sản phẩm chứa Niacinamide (516 SP), Salicylic Acid / BHA (402 SP), Vitamin C (379 SP), Hyaluronic Acid (289 SP), Glycolic Acid / AHA (277 SP), Centella Rau má (145 SP), Retinol (106 SP).

### Module 2: Trang Chi Tiết Sản Phẩm (PDP) & Phân Tích INCI
- **Thông tin niêm yết:** Hiển thị thương hiệu, dung tích, giá gốc, giá khuyến mãi, điểm đánh giá sao và số lượt yêu thích.
- **Hỗ trợ song tệ:** Hiển thị giá USD chuẩn kèm giá quy đổi VND tương ứng theo tỷ giá hiện hành.
- **Tab Phân tích Thành phần Khoa học:**
  - Điểm Safety Score nội bộ (1-10) biểu thị mức độ an toàn và lành tính.
  - Điểm Comedogenic (0-5) cảnh báo mức độ gây bít tắc sinh nhân mụn.
  - Biểu đồ phân bổ tỷ lệ công năng thành phần (Dưỡng ẩm, Làm dịu, Chống lão hóa, Hoạt chất đặc trị).
- **Sản phẩm tương tự & Mua kèm:**
  - Cụm "Sản phẩm tương tự" do mô hình TF-IDF tính toán.
  - Cụm "Thường được mua và kết hợp cùng" dựa trên 15,258 luật khai phá Apriori.
- **Đánh giá gắn nhãn loại da:** Hiển thị đánh giá của cộng đồng có kèm nhãn loại da (Oily, Dry, Normal, Combination, Sensitive) của người viết bài.

### Module 3: Hồ Sơ Da Cá Nhân & Cảnh Báo Dị Ứng (Digital Skin ID)
- **Lưu trữ hồ sơ cá nhân:** Loại da, tình trạng da hiện tại và danh sách thành phần từng bị dị ứng (Allergy Blacklist).
- **Cảnh báo dị ứng tự động:** Khi người dùng xem bất kỳ sản phẩm nào có chứa chất nằm trong danh sách dị ứng của mình, hệ thống lập tức hiển thị thẻ cảnh báo viền đỏ nổi bật.

### Module 4: Trợ Lý Tư Vấn Da Liễu & Kiểm Tra Xung Đột (AI Consultant & Conflict Detector)
- **Skin Quiz 4 tầng:**
  - Tầng 1: Lọc đúng danh mục cấp 3 (tertiary_category).
  - Tầng 2: Khớp từ khóa loại da trong highlights (+3 điểm).
  - Tầng 3: Khớp từng vấn đề da trong highlights (+2 điểm/vấn đề).
  - Tầng 4: Lọc ngân sách và sắp xếp theo Điểm -> Rating -> Loves count.
- **Routine Builder Sáng/Tối:** Tự động sắp xếp các sản phẩm đề xuất thành chu trình khoa học (Bước 1: Làm sạch -> Bước 2: Cân bằng -> Bước 3: Đặc trị -> Bước 4: Dưỡng ẩm -> Bước 5: Chống nắng).
- **Chat-to-Cart:** Khách hàng có thể bấm 1 nút để thêm toàn bộ các bước trong chu trình vào giỏ hàng kèm ưu đãi combo.
- **Bộ kiểm tra xung đột hoạt chất (Smart Conflict Detector):** Tự động phát hiện và cảnh báo khi khách hàng kết hợp các chất kỵ nhau trong giỏ hàng (ví dụ: AHA/BHA dùng chung Retinol trong cùng routine, hoặc Niacinamide dùng chung Vitamin C nguyên chất nồng độ cao).

### Module 5: Giỏ Hàng, Mã Giảm Giá & Thanh Toán (Cart & Checkout)
- **Giỏ hàng real-time:** Thêm/sửa/xóa sản phẩm, tự động tính tổng tiền theo đồng tiền đang chọn (VND hoặc USD).
- **Voucher đa tầng:** Áp dụng đồng thời mã giảm giá từ nhãn hàng, mã ưu đãi sàn và mã miễn phí vận chuyển.
- **Cổng thanh toán đa dạng:** Thanh toán khi nhận hàng (COD) và thanh toán trực tuyến qua cổng VNPay Sandbox (tự động quy đổi sang VND để giao dịch).
- **Lưu vết đơn hàng:** Ghi nhận tỷ giá exchange_rate tại thời điểm checkout, lưu song song cả tổng tiền USD và tổng tiền VND để kiểm toán minh bạch.

### Module 6: Bảng Điều Khiển Quản Trị (Admin Dashboard)
- **Báo cáo doanh thu:** Thống kê doanh thu theo ngày/tháng/quý sử dụng Stored Procedure tối ưu qua Dapper.
- **Quản lý danh mục & sản phẩm:** Xem, tìm kiếm, chỉnh sửa thông tin tồn kho và giá bán.
- **Cấu hình tỷ giá:** Cho phép Quản trị viên cập nhật tỷ giá quy đổi USD/VND của toàn sàn.
- **Xuất dữ liệu Excel:** Hỗ trợ trích xuất báo cáo đơn hàng và sản phẩm phục vụ đối soát.

---

## 6. MÔ HÌNH CƠ SỞ DỮ LIỆU CHUẨN HÓA (DATABASE SCHEMA)

Cơ sở dữ liệu PostgreSQL được thiết kế chặt chẽ, tối ưu cho EF Core và giữ nguyên mã sản phẩm `product_id` dạng chuỗi để tương thích hoàn toàn với các mô hình Machine Learning:

```sql
-- 1. Bảng nhãn hiệu
CREATE TABLE brands (
    brand_id INT PRIMARY KEY,
    brand_name VARCHAR(255) NOT NULL,
    logo_url TEXT
);

-- 2. Bảng danh mục đa cấp
CREATE TABLE categories (
    category_id INT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    category_level VARCHAR(20) NOT NULL, -- Primary, Secondary, Tertiary
    parent_id INT REFERENCES categories(category_id)
);

-- 3. Bảng sản phẩm chính
CREATE TABLE products (
    product_id VARCHAR(50) PRIMARY KEY, -- Giữ mã P473671 của Sephora
    product_name VARCHAR(500) NOT NULL,
    brand_id INT REFERENCES brands(brand_id),
    category_id INT REFERENCES categories(category_id),
    price_usd NUMERIC(10, 2) NOT NULL,
    value_price_usd NUMERIC(10, 2),
    rating NUMERIC(4, 2) DEFAULT 0.0,
    reviews_count INT DEFAULT 0,
    loves_count INT DEFAULT 0,
    stock_quantity INT DEFAULT 100,
    highlights TEXT,
    ingredients_text TEXT,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_cruelty_free BOOLEAN DEFAULT FALSE,
    is_clean BOOLEAN DEFAULT FALSE,
    is_fragrance_free BOOLEAN DEFAULT FALSE,
    is_paraben_free BOOLEAN DEFAULT FALSE,
    is_alcohol_free BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Từ điển thành phần khoa học
CREATE TABLE ingredients (
    ingredient_id SERIAL PRIMARY KEY,
    inci_name VARCHAR(255) UNIQUE NOT NULL,
    vietnamese_name VARCHAR(255),
    safety_score INT CHECK (safety_score BETWEEN 1 AND 10),
    comedogenic_rating INT CHECK (comedogenic_rating BETWEEN 0 AND 5),
    primary_function VARCHAR(100), -- Dưỡng ẩm, Làm dịu, Chống oxy hóa, Đặc trị
    description TEXT
);

-- 5. Bảng nối Sản phẩm - Thành phần
CREATE TABLE product_ingredients (
    product_id VARCHAR(50) REFERENCES products(product_id) ON DELETE CASCADE,
    ingredient_id INT REFERENCES ingredients(ingredient_id) ON DELETE RESTRICT,
    ingredient_order INT NOT NULL,
    is_key_active BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (product_id, ingredient_id)
);

-- 6. Bảng người dùng
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT "user", -- user, admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Hồ sơ da & danh sách dị ứng
CREATE TABLE skin_profiles (
    user_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    skin_type VARCHAR(50), -- Oily, Dry, Combination, Normal, Sensitive
    skin_concerns TEXT[], -- Mụn, Lão hóa, Nám, Lỗ chân lông...
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE skin_profile_allergies (
    user_id INT REFERENCES skin_profiles(user_id) ON DELETE CASCADE,
    ingredient_id INT REFERENCES ingredients(ingredient_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, ingredient_id)
);

-- 8. Giỏ hàng & Danh sách yêu thích
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(product_id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    UNIQUE(user_id, product_id)
);

CREATE TABLE wishlist_items (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(product_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 9. Mã giảm giá (Vouchers)
CREATE TABLE vouchers (
    voucher_id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    voucher_type VARCHAR(50) NOT NULL, -- Brand, Platform, Freeship
    discount_percent NUMERIC(5, 2) DEFAULT 0.0,
    discount_amount_usd NUMERIC(10, 2) DEFAULT 0.0,
    min_order_usd NUMERIC(10, 2) DEFAULT 0.0,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_to TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 10. Đơn hàng & Chi tiết đơn hàng (Lưu vết song tệ)
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    status VARCHAR(50) DEFAULT "pending", -- pending, paid, shipped, cancelled
    currency VARCHAR(10) DEFAULT "USD", -- Tiền tệ người dùng chọn lúc checkout
    exchange_rate NUMERIC(10, 2) NOT NULL, -- Tỷ giá USD -> VND tại thời điểm đặt
    subtotal_usd NUMERIC(10, 2) NOT NULL,
    discount_usd NUMERIC(10, 2) DEFAULT 0.0,
    total_usd NUMERIC(10, 2) NOT NULL,
    total_vnd NUMERIC(15, 0) NOT NULL, -- Quy đổi chính thức
    payment_method VARCHAR(50) NOT NULL, -- COD, VNPay
    payment_status VARCHAR(50) DEFAULT "unpaid",
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(product_id),
    quantity INT NOT NULL,
    unit_price_usd NUMERIC(10, 2) NOT NULL,
    total_price_usd NUMERIC(10, 2) NOT NULL
);

-- 11. Bảng cấu hình hệ thống
CREATE TABLE app_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 7. ĐỊNH DẠNG PHẢN HỒI JSON CHUẨN CỦA TRỢ LÝ AI (AI OUTPUT SCHEMA)

Dù trợ lý AI hoạt động theo cơ chế quy tắc (Rule-based) hay mô hình ngôn ngữ lớn (LLM), API đều tuân thủ cấu trúc JSON đồng nhất để Frontend dễ dàng kết xuất giao diện:

```json
{
  "message": "Da bạn thuộc nhóm hỗn hợp thiên dầu đang có mụn ẩn. Bạn nên ưu tiên làm sạch dịu nhẹ và sử dụng Salicylic Acid (BHA) để làm sạch sâu cổ nang lông, kết hợp gel dưỡng ẩm phục hồi mỏng nhẹ.",
  "skin_type_detected": "Combination_Oily",
  "identified_concerns": ["Acne", "Clogged_Pores"],
  "warnings": [
    "Tránh dùng chung BHA với Retinol trong cùng một buổi tối để hạn chế kích ứng.",
    "Bắt buộc thoa kem chống nắng bảo vệ quang phổ rộng vào ban ngày."
  ],
  "routine_steps": [
    {
      "step_number": 1,
      "step_name": "Làm sạch (Cleanser)",
      "time_of_day": "Both",
      "recommended_product": {
        "product_id": "P503197",
        "product_name": "Juneberry & Collagen Hydrating Cold Cream Cleanser",
        "price_usd": 39.0,
        "price_vnd": 990000,
        "match_score": 96
      }
    },
    {
      "step_number": 2,
      "step_name": "Tẩy da chết hóa học (BHA)",
      "time_of_day": "Night",
      "recommended_product": {
        "product_id": "P473671",
        "product_name": "Salicylic Acid 2% Exfoliating Blemish Solution",
        "price_usd": 14.5,
        "price_vnd": 368000,
        "match_score": 94
      }
    }
  ],
  "can_add_all_to_cart": true,
  "combo_discount_percent": 5
}
```

---

## 8. LỘ TRÌNH TRIỂN KHAI THỰC TẾ (4 PHASES)

| Giai đoạn | Trọng tâm | Kết quả bàn giao chính |
|---|---|---|
| **Phase 1** | Chuẩn hóa Dữ liệu & Triển khai Lõi .NET + FastAPI | - Nạp dữ liệu sản phẩm sạch vào PostgreSQL.<br>- Khởi dựng .NET 8 WebAPI (Catalog, JWT Auth, Song tệ).<br>- Tinh chỉnh FastAPI chạy song song phục vụ AI Recommender. |
| **Phase 2** | Nâng cấp Trải nghiệm Khách hàng & Bộ lọc Thông minh | - Triển khai Smart Filter (Vegan, Cruelty-free, Hoạt chất).<br>- Tab phân tích thành phần & biểu đồ công năng trên PDP.<br>- Chuyển đổi linh hoạt song tệ VND/USD trên toàn bộ giao diện. |
| **Phase 3** | Trợ lý Chăm sóc da, Conflict Detector & Routine | - Nâng cấp Skin Quiz xuất chu trình Sáng/Tối.<br>- Tích hợp tính năng Chat-to-Cart và kiểm tra xung đột hoạt chất trong giỏ hàng.<br>- Quản lý hồ sơ da Digital Skin ID và cảnh báo dị ứng. |
| **Phase 4** | Giỏ hàng, Voucher Đa tầng, Thanh toán & Báo cáo | - Áp dụng Voucher đa tầng và tích hợp VNPay Sandbox.<br>- Báo cáo quản trị doanh thu với Stored Procedures và Dapper.<br>- Hoàn thiện hồ sơ báo cáo đồ án và kiểm thử chất lượng 100%. |
