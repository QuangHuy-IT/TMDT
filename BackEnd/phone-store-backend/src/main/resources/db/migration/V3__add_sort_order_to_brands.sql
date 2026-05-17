-- ============================================================
-- Migration: Add sort_order column to brands table
-- Run this script in MySQL to enable drag-and-drop reordering
-- ============================================================

-- Add sort_order column (only if it doesn't exist)
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

-- Set initial sort order based on existing brand order (by id) if not already set
UPDATE brands SET sort_order = id WHERE sort_order = 0 OR sort_order IS NULL;
