-- Migration: Phase 1 Pre-Release Schema Sync
-- Date: 2026-11-27
-- Adds users.shipping_address, orders.notes, Admin Console V2 columns/tables, and product sorting columns.
-- Safe to run multiple times (idempotent).

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS shipping_address TEXT NULL;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS selling_status VARCHAR(20) NOT NULL DEFAULT 'Active',
    ADD COLUMN IF NOT EXISTS department VARCHAR(50) NOT NULL DEFAULT 'Skincare',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS size_display VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS loves_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3, 2) NULL,
    ADD COLUMN IF NOT EXISTS reviews_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_selling_status ON products(selling_status);
CREATE INDEX IF NOT EXISTS idx_products_department ON products(department);
CREATE INDEX IF NOT EXISTS idx_products_sorting ON products(reviews_count DESC, avg_rating DESC NULLS LAST, loves_count DESC);

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS notes TEXT NULL,
    ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS admin_notes TEXT NULL;

ALTER TABLE reviews
    ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS moderation_reason VARCHAR(500) NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_is_hidden ON reviews(is_hidden);

CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    ticket_code VARCHAR(32) NOT NULL UNIQUE,
    user_id INT NULL REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'New',
    admin_reply TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
