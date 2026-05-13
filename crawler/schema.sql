-- =============================================
-- DATABASE SCHEMA: ecommerce_phone
-- Ecommerce Phone Store - Full Schema
-- =============================================

CREATE DATABASE IF NOT EXISTS ecommerce_phone
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ecommerce_phone;

-- =============================================
-- TABLE: brands
-- =============================================
CREATE TABLE IF NOT EXISTS brands (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)    NOT NULL,
  slug        VARCHAR(120)    NOT NULL,
  logo_url    VARCHAR(500)    NULL,
  is_active   TINYINT(1)      NOT NULL DEFAULT 1,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_brands_slug (slug),
  UNIQUE KEY uq_brands_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE: categories
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name        VARCHAR(200)    NOT NULL,
  slug        VARCHAR(220)    NOT NULL,
  parent_id   INT UNSIGNED    NULL,
  is_active   TINYINT(1)      NOT NULL DEFAULT 1,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug),
  KEY idx_categories_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE: products
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name                VARCHAR(500)    NOT NULL,
  slug                VARCHAR(520)    NOT NULL,
  brand_id            INT UNSIGNED    NULL,
  category_id         INT UNSIGNED    NULL,
  short_description   TEXT            NULL,
  detail_description  LONGTEXT        NULL,
  sale                INT             NOT NULL DEFAULT 0 COMMENT '% giảm giá',
  warranty_months     INT             NOT NULL DEFAULT 12 COMMENT 'Số tháng bảo hành',
  status              ENUM('ACTIVE','INACTIVE','OUT_OF_STOCK') NOT NULL DEFAULT 'ACTIVE',
  is_featured         TINYINT(1)      NOT NULL DEFAULT 0,
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  KEY idx_products_brand (brand_id),
  KEY idx_products_category (category_id),
  KEY idx_products_status (status),
  CONSTRAINT fk_products_brand     FOREIGN KEY (brand_id)    REFERENCES brands(id)     ON DELETE SET NULL,
  CONSTRAINT fk_products_category  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE: product_variants
-- Mỗi tổ hợp RAM/ROM/màu là 1 variant
-- =============================================
CREATE TABLE IF NOT EXISTS product_variants (
  id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  product_id      INT UNSIGNED    NOT NULL,
  sku             VARCHAR(100)    NOT NULL,
  color           VARCHAR(100)    NULL,
  ram_gb          SMALLINT        NULL COMMENT 'RAM in GB',
  storage_gb      SMALLINT        NULL COMMENT 'Storage in GB',
  price           BIGINT          NOT NULL DEFAULT 0 COMMENT 'Giá bán (VND)',
  compare_at_price BIGINT         NULL COMMENT 'Giá gốc để so sánh (VND)',
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_variants_sku (sku),
  KEY idx_variants_product (product_id),
  KEY idx_variants_price (price),
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE: product_images
-- =============================================
CREATE TABLE IF NOT EXISTS product_images (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  product_id  INT UNSIGNED    NOT NULL,
  image_url   VARCHAR(1000)   NOT NULL,
  alt_text    VARCHAR(300)    NULL,
  is_primary  TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Ảnh đại diện chính',
  sort_order  SMALLINT        NOT NULL DEFAULT 0,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_images_product (product_id),
  KEY idx_images_primary (product_id, is_primary),
  CONSTRAINT fk_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TABLE: product_specifications
-- Thông số kỹ thuật dạng key-value
-- =============================================
CREATE TABLE IF NOT EXISTS product_specifications (
  id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  product_id  INT UNSIGNED    NOT NULL,
  spec_key    VARCHAR(200)    NOT NULL COMMENT 'Tên thông số (vd: cpu, screen_size)',
  spec_value  VARCHAR(1000)   NOT NULL COMMENT 'Giá trị thông số',
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_specs_product (product_id),
  KEY idx_specs_key (spec_key),
  CONSTRAINT fk_specs_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SAMPLE DATA: Seed brands và categories
-- =============================================

INSERT IGNORE INTO brands (name, slug) VALUES
  ('Apple',    'apple'),
  ('Samsung',  'samsung'),
  ('Xiaomi',   'xiaomi'),
  ('OPPO',     'oppo'),
  ('realme',   'realme'),
  ('vivo',     'vivo'),
  ('Tecno',    'tecno'),
  ('Nokia',    'nokia'),
  ('Motorola', 'motorola'),
  ('OnePlus',  'oneplus'),
  ('ASUS',     'asus'),
  ('Sony',     'sony');

INSERT IGNORE INTO categories (name, slug) VALUES
  ('Điện thoại', 'dien-thoai'),
  ('Máy tính bảng', 'may-tinh-bang'),
  ('Laptop', 'laptop'),
  ('Phụ kiện', 'phu-kien');

-- =============================================
-- SAMPLE INSERT: Ví dụ 1 sản phẩm đầy đủ
-- =============================================

-- Lấy brand_id và category_id
SET @brand_id = (SELECT id FROM brands WHERE name = 'Apple' LIMIT 1);
SET @cat_id   = (SELECT id FROM categories WHERE slug = 'dien-thoai' LIMIT 1);

-- Insert product
INSERT IGNORE INTO products (
  name, slug, brand_id, category_id,
  short_description, sale, warranty_months, status, is_featured
) VALUES (
  'iPhone 15 Pro Max 256GB',
  'iphone-15-pro-max-256gb',
  @brand_id,
  @cat_id,
  'iPhone 15 Pro Max với chip A17 Pro, camera 48MP, màn hình 6.7 inch Super Retina XDR',
  5,
  12,
  'ACTIVE',
  1
);

SET @product_id = LAST_INSERT_ID();

-- Insert variants
INSERT IGNORE INTO product_variants (product_id, sku, color, ram_gb, storage_gb, price, compare_at_price) VALUES
  (@product_id, 'IP-8-256-BLACK-A1B2',    'Titan Đen',   8, 256,  32990000, 34990000),
  (@product_id, 'IP-8-256-WHITE-C3D4',    'Titan Trắng', 8, 256,  32990000, 34990000),
  (@product_id, 'IP-8-256-BLUE-E5F6',     'Titan Xanh',  8, 256,  32990000, 34990000),
  (@product_id, 'IP-8-512-BLACK-G7H8',    'Titan Đen',   8, 512,  37990000, 39990000),
  (@product_id, 'IP-8-1024-BLACK-I9J0',   'Titan Đen',   8, 1024, 44990000, 46990000);

-- Insert images
INSERT IGNORE INTO product_images (product_id, image_url, is_primary, sort_order) VALUES
  (@product_id, 'https://cellphones.com.vn/media/catalog/product/i/p/ip15pm-titan-black-1.jpg', 1, 0),
  (@product_id, 'https://cellphones.com.vn/media/catalog/product/i/p/ip15pm-titan-black-2.jpg', 0, 1),
  (@product_id, 'https://cellphones.com.vn/media/catalog/product/i/p/ip15pm-titan-black-3.jpg', 0, 2);

-- Insert specifications
INSERT IGNORE INTO product_specifications (product_id, spec_key, spec_value) VALUES
  (@product_id, 'screen_size',        '6.7 inch Super Retina XDR OLED'),
  (@product_id, 'refresh_rate',       '120Hz ProMotion'),
  (@product_id, 'cpu',                'Apple A17 Pro (3nm)'),
  (@product_id, 'gpu',                'Apple GPU 6-core'),
  (@product_id, 'ram',                '8 GB'),
  (@product_id, 'storage',            '256GB / 512GB / 1TB'),
  (@product_id, 'rear_camera',        '48MP (chính) + 12MP (telephoto) + 12MP (siêu rộng)'),
  (@product_id, 'front_camera',       '12MP TrueDepth'),
  (@product_id, 'battery',            '4422 mAh'),
  (@product_id, 'fast_charging',      '27W có dây, 15W MagSafe'),
  (@product_id, 'operating_system',   'iOS 17'),
  (@product_id, 'resolution',         '2796 x 1290 pixels'),
  (@product_id, 'dimensions',         '159.9 x 76.7 x 8.25 mm'),
  (@product_id, 'weight',             '221g'),
  (@product_id, 'sim',                'Nano SIM + eSIM'),
  (@product_id, 'connectivity',       '5G, WiFi 6E, Bluetooth 5.3, NFC, USB-C'),
  (@product_id, 'charging_port',      'USB-C (USB 3)');

-- =============================================
-- USEFUL QUERIES
-- =============================================

-- Xem tất cả sản phẩm với brand và price range
SELECT 
  p.id, p.name, b.name as brand,
  MIN(v.price) as min_price,
  MAX(v.price) as max_price,
  COUNT(DISTINCT v.id) as variant_count,
  COUNT(DISTINCT i.id) as image_count
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN product_variants v ON p.id = v.product_id
LEFT JOIN product_images i ON p.id = i.id
GROUP BY p.id, p.name, b.name
ORDER BY p.created_at DESC;

-- Xem specifications của 1 sản phẩm
SELECT spec_key, spec_value 
FROM product_specifications 
WHERE product_id = 1
ORDER BY spec_key;

-- Xem variants của 1 sản phẩm
SELECT sku, color, ram_gb, storage_gb, 
       FORMAT(price, 0) as price_vnd,
       FORMAT(compare_at_price, 0) as compare_price_vnd
FROM product_variants
WHERE product_id = 1;
