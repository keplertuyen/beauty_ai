-- Migration: Add selling_status (soft delete / lifecycle) and updated_at to products
-- ADR-014 & CHANGE-ADMIN-PRODUCT-CRUD (2026-11-20)

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS selling_status VARCHAR(20) NOT NULL DEFAULT 'Active';

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NULL;

CREATE INDEX IF NOT EXISTS idx_products_selling_status ON products(selling_status);
