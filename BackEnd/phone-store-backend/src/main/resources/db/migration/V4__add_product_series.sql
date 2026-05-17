-- ============================================================
-- Migration: Add ProductSeries table and series_id to products
-- ============================================================

-- Create product_series table
CREATE TABLE IF NOT EXISTS product_series (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    brand_id BIGINT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_product_series_name_brand UNIQUE (name, brand_id),
    CONSTRAINT fk_product_series_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- Add series_id column to products table
SET @dbname = DATABASE();
SET @tablename = 'products';
SET @columnname = 'series_id';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = @dbname
        AND TABLE_NAME = @tablename
        AND COLUMN_NAME = @columnname
    ) > 0,
    'SELECT 1',
    'ALTER TABLE products ADD COLUMN series_id BIGINT NULL AFTER brand_id'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add foreign key constraint
SET @preparedStatement2 = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = @dbname
        AND TABLE_NAME = @tablename
        AND CONSTRAINT_NAME = 'fk_products_series'
    ) > 0,
    'SELECT 1',
    'ALTER TABLE products ADD CONSTRAINT fk_products_series FOREIGN KEY (series_id) REFERENCES product_series(id) ON DELETE SET NULL'
));
PREPARE alterIfNotExists2 FROM @preparedStatement2;
EXECUTE alterIfNotExists2;
DEALLOCATE PREPARE alterIfNotExists2;
