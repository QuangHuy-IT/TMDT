-- ============================================================
-- Migration: TMDT Phone Store - Fix short_description column
-- Run this script in MySQL to prevent data truncation errors
-- ============================================================

-- Change short_description from VARCHAR(500) to MEDIUMTEXT
-- This allows much longer short descriptions without truncation
ALTER TABLE products
MODIFY COLUMN short_description MEDIUMTEXT NOT NULL;
