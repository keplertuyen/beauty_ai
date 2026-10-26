-- ============================================================================
-- BEAUTYAI PHASE 1 — POSTGRESQL 17 SCHEMA DEFINITION
-- ============================================================================
-- Độc lập cho Phase 1 MVP (Chuẩn hóa cột code Sephora và 1.09M Reviews)
-- Bất biến: Không có cột safety_score / hazard_score (INV-01)
-- ============================================================================

-- 1. BẢNG NGƯỜI DÙNG (USERS)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(500) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'Customer' NOT NULL CHECK (role IN ('Customer', 'Admin')),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. HỒ SƠ DIGITAL SKIN ID (SKIN_PROFILES)
CREATE TABLE IF NOT EXISTS skin_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    skin_type VARCHAR(50) NOT NULL CHECK (skin_type IN ('Oily', 'Dry', 'Combination', 'Normal')),
    skin_concerns VARCHAR(50)[] NOT NULL, -- ARRAY['Acne', 'Aging', 'DarkSpots', 'Pores', 'Sensitivity', 'Dehydration']
    primary_goal VARCHAR(255),
    budget_level VARCHAR(50) DEFAULT 'Medium' NOT NULL CHECK (budget_level IN ('Low', 'Medium', 'High')),
    last_quiz_completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_skin_profiles_user ON skin_profiles(user_id);

-- 3. DANH MỤC THÀNH PHẦN HOẠT CHẤT (INGREDIENTS)
CREATE TABLE IF NOT EXISTS ingredients (
    id SERIAL PRIMARY KEY,
    inci_name VARCHAR(255) UNIQUE NOT NULL,
    common_name_vi VARCHAR(255),
    description_vi TEXT,
    is_active_ingredient BOOLEAN DEFAULT FALSE NOT NULL,
    comedogenic_rating INT DEFAULT 0 CHECK (comedogenic_rating BETWEEN 0 AND 5),
    irritation_rating INT DEFAULT 0 CHECK (irritation_rating BETWEEN 0 AND 5)
);
CREATE INDEX IF NOT EXISTS idx_ingredients_inci ON ingredients(inci_name);

-- 4. DANH SÁCH HOẠT CHẤT DỊ ỨNG CỦA NGƯỜI DÙNG (USER_ALLERGIES — BLACKLIST)
CREATE TABLE IF NOT EXISTS user_allergies (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    ingredient_name VARCHAR(255) NOT NULL,
    note VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_allergies_user ON user_allergies(user_id);

-- 5. DANH MỤC SẢN PHẨM & THƯƠNG HIỆU (CATEGORIES & BRANDS)
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
    origin_country VARCHAR(100)
);

-- 6. BẢNG SẢN PHẨM (PRODUCTS) — CHUẨN HÓA MÃ SEPHORA
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- Mã sản phẩm từ dataset (VD: 'P473671')
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    brand_id INT REFERENCES brands(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    price_vnd BIGINT NOT NULL CHECK (price_vnd >= 0),
    volume_ml INT,
    description TEXT,
    image_url VARCHAR(500),
    ingredient_list_raw TEXT NOT NULL, -- Chuỗi thành phần nguyên bản từ bao bì
    target_skin_types VARCHAR(50)[] NOT NULL, -- ARRAY['Oily', 'Combination']
    stock_quantity INT DEFAULT 100 NOT NULL CHECK (stock_quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);

-- 7. LIÊN KẾT SẢN PHẨM & THÀNH PHẦN (PRODUCT_INGREDIENTS)
CREATE TABLE IF NOT EXISTS product_ingredients (
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id INT REFERENCES ingredients(id) ON DELETE CASCADE,
    position_order INT NOT NULL,
    PRIMARY KEY (product_id, ingredient_id)
);
CREATE INDEX IF NOT EXISTS idx_prod_ing_ingredient ON product_ingredients(ingredient_id);

-- 8. BẢNG QUY TẮC XUNG ĐỘT HOẠT CHẤT (CONFLICT_RULES)
CREATE TABLE IF NOT EXISTS conflict_rules (
    id SERIAL PRIMARY KEY,
    active_ingredient_a VARCHAR(255) NOT NULL,
    active_ingredient_b VARCHAR(255) NOT NULL,
    severity VARCHAR(50) DEFAULT 'Warning' NOT NULL, -- 'Warning', 'Contraindication'
    reason_vi TEXT NOT NULL,
    recommendation_vi TEXT NOT NULL
);

-- 9. BẢNG ĐÁNH GIÁ SẢN PHẨM (REVIEWS) — TỐI ƯU 1 TRIỆU RECORDS
CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    product_code VARCHAR(50), -- Mã Sephora để ánh xạ trực tiếp khi import ETL
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255) DEFAULT 'Khách hàng BeautyAI' NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    skin_type VARCHAR(50) NOT NULL CHECK (skin_type IN ('Oily', 'Dry', 'Combination', 'Normal', 'Unknown')),
    skin_concerns VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- CHỈ MỤC B-TREE TỐI ƯU TRUY VẤN LỌC REVIEW 1M DƯỚI 50MS
CREATE INDEX IF NOT EXISTS idx_reviews_product_skin ON reviews(product_id, skin_type);
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews(product_id, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_product_code ON reviews(product_code);

-- 10. BẢNG ĐƠN HÀNG & CHI TIẾT ĐƠN HÀNG (ORDERS & ORDER_ITEMS)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    recipient_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'COD' NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'Pending' NOT NULL,
    order_status VARCHAR(50) DEFAULT 'Pending' NOT NULL,
    total_amount_vnd BIGINT NOT NULL CHECK (total_amount_vnd >= 0),
    conflict_acknowledged BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_vnd BIGINT NOT NULL CHECK (unit_price_vnd >= 0),
    total_price_vnd BIGINT NOT NULL CHECK (total_price_vnd >= 0)
);

-- 11. BẢNG ROUTINE ĐÃ LƯU CỦA NGƯỜI DÙNG (SAVED_ROUTINES)
CREATE TABLE IF NOT EXISTS saved_routines (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    routine_name VARCHAR(255) NOT NULL,
    routine_type VARCHAR(50) DEFAULT 'Morning' NOT NULL CHECK (routine_type IN ('Morning', 'Night', 'Treatment')),
    items JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
