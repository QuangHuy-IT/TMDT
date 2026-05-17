-- ============================================================
-- Migration: TMDT Phone Store - Fix issues
-- Run this script in MySQL after restarting the backend
-- ============================================================

-- Fix 1: Change detail_description column from TEXT to MEDIUMTEXT
-- to allow longer product descriptions
ALTER TABLE products
MODIFY COLUMN detail_description MEDIUMTEXT NOT NULL;

-- Fix 2: Add sort_order column to brands table
-- for drag-and-drop reordering functionality
SET @dbname = DATABASE();
SET @tablename = 'brands';
SET @columnname = 'sort_order';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
        AND TABLE_NAME = @tablename
        AND COLUMN_NAME = @columnname
    ) > 0,
    'SELECT 1',
    'ALTER TABLE brands ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER is_active'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Set initial sort order based on existing brand order (by id)
SET @rank = 0;
UPDATE brands SET sort_order = (@rank := @rank + 1) ORDER BY id ASC;

-- Verify the changes
DESCRIBE products;
DESCRIBE brands;
