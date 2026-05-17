-- V6: Refactor to parent-product + child-variants architecture.
--
-- OLD MODEL: Each product = 1 variant (duplicate description, images, specs)
-- NEW MODEL: 1 product = N variants (normalized, share product data)
--
-- Changes:
--   1. Add `storage_label` column to product_variants (denormalized for display)
--   2. Add `slug` column to product_variants (UNIQUE, used for SEO-friendly URLs)
--   3. Backfill `storage_label` from `storage_gb`
--   4. Backfill `slug` = {product_slug}-{ram}gb-{storage}gb-{color}
--   5. Fix duplicate slugs by appending variant id
--   6. Add unique index on variant slug

-- ── 1. Add storage_label column ───────────────────────────────────────────────
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_variants'
      AND COLUMN_NAME = 'storage_label'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE product_variants ADD COLUMN storage_label VARCHAR(40) NULL AFTER ram_gb',
    'SELECT ''Column storage_label already exists, skipping'' AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── 2. Backfill storage_label from storage_gb ─────────────────────────────────
UPDATE product_variants
SET storage_label = CASE
    WHEN storage_gb % 1024 = 0 THEN CONCAT(storage_gb / 1024, 'TB')
    WHEN storage_gb IS NOT NULL THEN CONCAT(storage_gb, 'GB')
    ELSE NULL
END
WHERE storage_gb IS NOT NULL
  AND storage_gb > 0
  AND (storage_label IS NULL OR storage_label = '');

-- ── 3. Add slug column ────────────────────────────────────────────────────────
SET @column_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_variants'
      AND COLUMN_NAME = 'slug'
);
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE product_variants ADD COLUMN slug VARCHAR(500) NULL AFTER is_active',
    'SELECT ''Column slug already exists, skipping'' AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── 4. Backfill slug ───────────────────────────────────────────────────────────
-- Format: {product-slug}[-{ram}gb][-{storage}gb][-{color-normalized}]
UPDATE product_variants pv
JOIN products p ON pv.product_id = p.id
SET pv.slug = CONCAT(
    COALESCE(p.slug, CONCAT('product-', p.id)),
    IF(pv.ram_gb IS NOT NULL AND pv.ram_gb > 0,
       CONCAT('-', pv.ram_gb, 'gb'), ''),
    IF(pv.storage_gb IS NOT NULL AND pv.storage_gb > 0,
       CONCAT('-',
         IF(pv.storage_gb % 1024 = 0,
            CONCAT(pv.storage_gb / 1024, 'tb'),
            CONCAT(pv.storage_gb, 'gb'))), ''),
    IF(pv.color IS NOT NULL AND pv.color != '',
       CONCAT('-', LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
           pv.color, ' ', ''), 'Đ','d'), 'Ê','e'), 'Ô','o'), 'Ơ','o'))),
       '')
)
WHERE pv.slug IS NULL OR pv.slug = '';

-- ── 5. Fix duplicate slugs ────────────────────────────────────────────────────
-- For slugs that appear multiple times, append variant id
UPDATE product_variants pv
JOIN (
    SELECT id, slug,
           ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) AS rn
    FROM product_variants
    WHERE slug IS NOT NULL AND slug != ''
) dup ON pv.id = dup.id
SET pv.slug = CONCAT(pv.slug, '-', pv.id)
WHERE dup.rn > 1;

-- ── 6. Add unique index on variant slug ──────────────────────────────────────
SET @index_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_variants'
      AND INDEX_NAME = 'uk_product_variants_slug'
);
SET @sql = IF(@index_exists = 0,
    'CREATE UNIQUE INDEX uk_product_variants_slug ON product_variants(slug)',
    'SELECT ''Index uk_product_variants_slug already exists, skipping'' AS msg'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
