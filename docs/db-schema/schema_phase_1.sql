-- ============================================================================
-- BEAUTYAI PHASE 1 — POSTGRESQL 17 SCHEMA DEFINITION (GLOBAL ENGLISH & USD)
-- ============================================================================
-- Independent Schema for Phase 1 MVP (Sephora Dataset & 1.09M Reviews)
-- Core Invariant: No safety_score or hazard_score column (INV-01)
-- Currency: USD ($) | Nomenclature: International INCI Standard
-- ============================================================================

-- 1. USERS TABLE
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

-- 2. UNIFIED DIGITAL SKIN ID (SKIN_PROFILES & USER_ALLERGIES)
-- Dermatology Order:
-- 1. Baseline Physiology (Skin Type)
-- 2. Safety Boundaries (Allergy Blacklist)
-- 3. Targeted Goals (Skin Concerns, Goals & Budget)
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

-- Child Table: Personal Allergy Blacklist (3NF Normalized)
CREATE TABLE IF NOT EXISTS user_allergies (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    ingredient_name VARCHAR(255) NOT NULL,
    note VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_allergies_user ON user_allergies(user_id);

-- 3. INCI INGREDIENTS DICTIONARY
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

-- 4. CATEGORIES & BRANDS
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

-- 5. PRODUCTS (SEPHORA CATALOG MAPPED)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- Original Sephora ID (e.g. 'P473671')
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    brand_id INT REFERENCES brands(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id) ON DELETE CASCADE,
    price_usd NUMERIC(10, 2) NOT NULL CHECK (price_usd >= 0),
    volume_ml INT,
    description TEXT,
    image_url VARCHAR(500),
    ingredient_list_raw TEXT NOT NULL, -- Raw INCI ingredient string from packaging
    target_skin_types VARCHAR(50)[] NOT NULL, -- ARRAY['Oily', 'Combination']
    stock_quantity INT DEFAULT 100 NOT NULL CHECK (stock_quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);

-- 6. PRODUCT INGREDIENTS JOIN TABLE
CREATE TABLE IF NOT EXISTS product_ingredients (
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id INT REFERENCES ingredients(id) ON DELETE CASCADE,
    position_order INT NOT NULL,
    PRIMARY KEY (product_id, ingredient_id)
);
CREATE INDEX IF NOT EXISTS idx_prod_ing_ingredient ON product_ingredients(ingredient_id);

-- 7. ACTIVE INGREDIENT CONFLICT RULES
CREATE TABLE IF NOT EXISTS conflict_rules (
    id SERIAL PRIMARY KEY,
    active_ingredient_a VARCHAR(255) NOT NULL,
    active_ingredient_b VARCHAR(255) NOT NULL,
    severity VARCHAR(50) DEFAULT 'Warning' NOT NULL, -- 'Warning', 'Contraindication'
    reason TEXT NOT NULL,
    recommendation TEXT NOT NULL
);

-- 8. PRODUCT REVIEWS (OPTIMIZED FOR 1M DATASET)
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

-- COMPOSITE B-TREE INDEXES FOR SUB-50MS FILTERING
CREATE INDEX IF NOT EXISTS idx_reviews_product_skin ON reviews(product_id, skin_type);
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews(product_id, rating);
CREATE INDEX IF NOT EXISTS idx_reviews_product_code ON reviews(product_code);

-- 9. ORDERS & ORDER ITEMS
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    recipient_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'COD' NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'Pending' NOT NULL,
    order_status VARCHAR(50) DEFAULT 'Pending' NOT NULL,
    total_amount_usd NUMERIC(10, 2) NOT NULL CHECK (total_amount_usd >= 0),
    conflict_acknowledged BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_usd NUMERIC(10, 2) NOT NULL CHECK (unit_price_usd >= 0),
    total_price_usd NUMERIC(10, 2) NOT NULL CHECK (total_price_usd >= 0)
);

-- 10. SAVED USER ROUTINES
CREATE TABLE IF NOT EXISTS saved_routines (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    routine_name VARCHAR(255) NOT NULL,
    routine_type VARCHAR(50) DEFAULT 'Morning' NOT NULL CHECK (routine_type IN ('Morning', 'Night', 'Treatment')),
    items JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
