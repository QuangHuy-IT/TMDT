-- Migration: Add helpful_count to reviews table
-- This column tracks how many users found this review helpful

USE phone_store;

-- Add helpful_count column if it doesn't exist
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS `helpful_count` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `is_approved`;

-- Add index on product_id + is_approved for efficient approved review queries
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON reviews(product_id, is_approved);
