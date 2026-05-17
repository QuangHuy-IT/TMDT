-- Add base_name column if it doesn't exist
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'base_name'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE products ADD COLUMN base_name VARCHAR(255) NULL AFTER name',
    'SELECT ''Column base_name already exists, skipping ADD COLUMN'' AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill base_name for existing products using their current name
UPDATE products SET base_name = name WHERE base_name IS NULL;

-- Make it mandatory for new products (existing rows already updated above)
ALTER TABLE products MODIFY COLUMN base_name VARCHAR(255) NOT NULL;

-- Index for fast search by base_name (used in product listing/search)
SET @index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND INDEX_NAME = 'idx_products_base_name'
);
SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_products_base_name ON products(base_name)',
    'SELECT ''Index idx_products_base_name already exists, skipping CREATE INDEX'' AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index for series + base_name combined (used when browsing by series)
SET @index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND INDEX_NAME = 'idx_products_series_base_name'
);
SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_products_series_base_name ON products(series_id, base_name)',
    'SELECT ''Index idx_products_series_base_name already exists, skipping CREATE INDEX'' AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
