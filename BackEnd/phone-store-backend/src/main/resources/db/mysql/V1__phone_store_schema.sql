-- =====================================================
-- V1__phone_store_schema.sql
-- Database Schema cho Phone Store Backend
-- =====================================================

CREATE DATABASE IF NOT EXISTS phone_store
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE phone_store;

-- =====================================================
-- Bảng users - Người dùng
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    year_of_birth INT NULL COMMENT 'Năm sinh của người dùng',
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    status ENUM('ACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
    avatar_url VARCHAR(500) NULL,
    province VARCHAR(120) NULL,
    district VARCHAR(120) NULL,
    ward VARCHAR(120) NULL,
    detail_address VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at DATETIME NULL,
    deleted_at DATETIME NULL,
    auth_source ENUM('LOCAL', 'GOOGLE', 'FACEBOOK') NOT NULL DEFAULT 'LOCAL',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    google_id VARCHAR(255) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_phone (phone),
    KEY idx_users_role (role),
    KEY idx_users_status (status),
    KEY idx_users_year_of_birth (year_of_birth)
);

-- =====================================================
-- Bảng user_addresses - Địa chỉ người dùng
-- =====================================================
CREATE TABLE IF NOT EXISTS user_addresses (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    receiver_name VARCHAR(150) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    province VARCHAR(120) NOT NULL,
    district VARCHAR(120) NOT NULL,
    ward VARCHAR(120) NOT NULL,
    detail_address VARCHAR(255) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_addresses_user (user_id),
    KEY idx_user_addresses_default (is_default),
    CONSTRAINT fk_user_addresses_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- Bảng brands - Thương hiệu
-- =====================================================
CREATE TABLE IF NOT EXISTS brands (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(160) NOT NULL,
    logo_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_brands_name (name),
    UNIQUE KEY uk_brands_slug (slug),
    KEY idx_brands_active (is_active),
    KEY idx_brands_sort_order (sort_order)
);

-- =====================================================
-- Bảng product_series - Dòng sản phẩm
-- =====================================================
CREATE TABLE IF NOT EXISTS product_series (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description VARCHAR(500) NULL,
    brand_id BIGINT UNSIGNED NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_product_series_name_brand (name, brand_id),
    UNIQUE KEY uk_product_series_slug (slug),
    CONSTRAINT fk_product_series_brand
        FOREIGN KEY (brand_id) REFERENCES brands(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- Bảng categories - Danh mục
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    parent_id BIGINT UNSIGNED NULL,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(160) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_categories_slug (slug),
    KEY idx_categories_parent (parent_id),
    KEY idx_categories_active (is_active),
    CONSTRAINT fk_categories_parent
        FOREIGN KEY (parent_id) REFERENCES categories(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- =====================================================
-- Bảng products - Sản phẩm
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    brand_id BIGINT UNSIGNED NOT NULL,
    series_id BIGINT UNSIGNED NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    created_by BIGINT UNSIGNED NULL,
    name VARCHAR(255) NOT NULL,
    base_name VARCHAR(255) NOT NULL,
    slug VARCHAR(300) NOT NULL,
    short_description MEDIUMTEXT NOT NULL,
    detail_description MEDIUMTEXT NOT NULL,
    thumbnail_url VARCHAR(500) NULL,
    sale INT NOT NULL DEFAULT 0,
    warranty_months INT UNSIGNED NOT NULL DEFAULT 12,
    status ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'DISCONTINUED') NOT NULL DEFAULT 'DRAFT',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_products_slug (slug),
    KEY idx_products_brand (brand_id),
    KEY idx_products_series (series_id),
    KEY idx_products_category (category_id),
    KEY idx_products_status (status),
    KEY idx_products_featured (is_featured),
    KEY idx_products_name (name),
    KEY idx_products_base_name (base_name),
    CONSTRAINT fk_products_brand
        FOREIGN KEY (brand_id) REFERENCES brands(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_products_series
        FOREIGN KEY (series_id) REFERENCES product_series(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_products_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- =====================================================
-- Bảng product_variants - Biến thể sản phẩm
-- =====================================================
CREATE TABLE IF NOT EXISTS product_variants (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id BIGINT UNSIGNED NOT NULL,
    sku VARCHAR(120) NOT NULL,
    color VARCHAR(80) NOT NULL,
    ram_gb INT UNSIGNED NULL,
    storage_label VARCHAR(40) NULL,
    storage_gb INT UNSIGNED NULL,
    price DECIMAL(15,2) NOT NULL,
    compare_at_price DECIMAL(15,2) NULL,
    cost_price DECIMAL(15,2) NULL,
    weight_gram INT UNSIGNED NULL,
    barcode VARCHAR(120) NULL,
    color_image_url VARCHAR(500) NULL,
    slug VARCHAR(300) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_product_variants_sku (sku),
    KEY idx_product_variants_product (product_id),
    KEY idx_product_variants_price (price),
    KEY idx_product_variants_active (is_active),
    KEY idx_product_variants_slug (slug),
    CONSTRAINT fk_product_variants_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- Bảng product_images - Hình ảnh sản phẩm
-- =====================================================
CREATE TABLE IF NOT EXISTS product_images (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_product_images_product (product_id),
    KEY idx_product_images_variant (variant_id),
    KEY idx_product_images_primary (is_primary),
    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_product_images_variant
        FOREIGN KEY (variant_id) REFERENCES product_variants(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- =====================================================
-- Bảng product_specifications - Thông số kỹ thuật
-- =====================================================
CREATE TABLE IF NOT EXISTS product_specifications (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id BIGINT UNSIGNED NOT NULL,
    spec_key VARCHAR(120) NOT NULL,
    spec_value VARCHAR(500) NOT NULL,
    spec_category VARCHAR(60) NULL COMMENT 'Nhóm thông số: Màn hình, Camera, CPU...',
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_product_specs_product (product_id),
    KEY idx_product_specs_sort (sort_order),
    KEY idx_product_specs_category (spec_category),
    CONSTRAINT fk_product_specs_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- Bảng inventories - Tồn kho
-- =====================================================
CREATE TABLE IF NOT EXISTS inventories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    variant_id BIGINT UNSIGNED NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    quantity_reserved INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 5,
    stock_status ENUM('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK') NOT NULL DEFAULT 'IN_STOCK',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_inventories_variant (variant_id),
    KEY idx_inventories_stock_status (stock_status),
    CONSTRAINT fk_inventories_variant
        FOREIGN KEY (variant_id) REFERENCES product_variants(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- Bảng inventory_movements - Lịch sử di chuyển kho
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_movements (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    variant_id BIGINT UNSIGNED NOT NULL,
    movement_type ENUM('IMPORT', 'EXPORT', 'RESERVE', 'RELEASE', 'ADJUST') NOT NULL,
    quantity INT NOT NULL,
    reference_type ENUM('ORDER', 'MANUAL', 'IMPORT_NOTE') NOT NULL DEFAULT 'MANUAL',
    reference_id VARCHAR(120) NULL,
    note VARCHAR(500) NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_inventory_movements_variant (variant_id),
    KEY idx_inventory_movements_type (movement_type),
    KEY idx_inventory_movements_created_at (created_at),
    CONSTRAINT fk_inventory_movements_variant
        FOREIGN KEY (variant_id) REFERENCES product_variants(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_inventory_movements_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- =====================================================
-- Bảng inventory_logs - Nhật ký điều chỉnh kho
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    log_code VARCHAR(50) NULL,
    total_adjustments INT NULL,
    total_products INT NULL,
    note VARCHAR(500) NULL,
    created_by_name VARCHAR(100) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_inventory_logs_code (log_code)
);

-- =====================================================
-- Bảng inventory_log_items - Chi tiết nhật ký kho
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_log_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    inventory_log_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NULL,
    variant_id BIGINT NOT NULL,
    variant_name VARCHAR(255) NULL,
    sku VARCHAR(50) NULL,
    before_stock INT NOT NULL,
    after_stock INT NOT NULL,
    delta INT NOT NULL,
    PRIMARY KEY (id),
    KEY idx_inventory_log_items_log (inventory_log_id),
    CONSTRAINT fk_inventory_log_items_log
        FOREIGN KEY (inventory_log_id) REFERENCES inventory_logs(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- Bảng carts - Giỏ hàng
-- =====================================================
CREATE TABLE IF NOT EXISTS carts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NULL,
    session_id VARCHAR(120) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_carts_user (user_id),
    KEY idx_carts_session (session_id),
    CONSTRAINT fk_carts_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- Bảng cart_items - Chi tiết giỏ hàng
-- =====================================================
CREATE TABLE IF NOT EXISTS cart_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cart_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    unit_price_snapshot DECIMAL(15,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_cart_items_cart_variant (cart_id, variant_id),
    KEY idx_cart_items_variant (variant_id),
    CONSTRAINT fk_cart_items_cart
        FOREIGN KEY (cart_id) REFERENCES carts(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cart_items_variant
        FOREIGN KEY (variant_id) REFERENCES product_variants(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- =====================================================
-- Bảng wishlists - Danh sách yêu thích
-- =====================================================
CREATE TABLE IF NOT EXISTS wishlists (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_wishlists_user (user_id),
    CONSTRAINT fk_wishlists_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- Bảng wishlist_items - Chi tiết wishlist
-- =====================================================
CREATE TABLE IF NOT EXISTS wishlist_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    wishlist_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_wishlist_items_wishlist_variant (wishlist_id, variant_id),
    KEY idx_wishlist_items_variant (variant_id),
    CONSTRAINT fk_wishlist_items_wishlist
        FOREIGN KEY (wishlist_id) REFERENCES wishlists(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_wishlist_items_variant
        FOREIGN KEY (variant_id) REFERENCES product_variants(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- Bảng vouchers - Mã giảm giá
-- =====================================================
CREATE TABLE IF NOT EXISTS vouchers (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code VARCHAR(60) NOT NULL,
    discount_type ENUM('PERCENT', 'FIXED') NOT NULL,
    discount_value DECIMAL(15,2) NOT NULL,
    max_discount_amount DECIMAL(15,2) NULL,
    min_order_amount DECIMAL(15,2) NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    usage_limit INT UNSIGNED NULL,
    used_count INT UNSIGNED NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_vouchers_code (code),
    KEY idx_vouchers_active_window (is_active, start_at, end_at)
);

-- =====================================================
-- Bảng orders - Đơn hàng
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_code VARCHAR(40) NOT NULL,
    payment_link_id VARCHAR(100) NULL COMMENT 'Link thanh toán VNPay/PayOS',
    user_id BIGINT UNSIGNED NULL,
    voucher_id BIGINT UNSIGNED NULL,
    receiver_name VARCHAR(150) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    shipping_address_text VARCHAR(500) NOT NULL,
    note VARCHAR(500) NULL,
    subtotal_amount DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    shipping_fee DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL,
    payment_method ENUM('COD', 'VNPAY', 'MOMO', 'CARD', 'BANK_TRANSFER') NOT NULL DEFAULT 'COD',
    payment_status ENUM('UNPAID', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
    order_status ENUM('PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELED', 'RETURNED') NOT NULL DEFAULT 'PENDING',
    placed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME NULL COMMENT 'Thời điểm thanh toán thành công',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_orders_order_code (order_code),
    KEY idx_orders_user (user_id),
    KEY idx_orders_status (order_status),
    KEY idx_orders_payment_status (payment_status),
    KEY idx_orders_created_at (created_at),
    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_orders_voucher
        FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- =====================================================
-- Bảng pending_orders - Đơn hàng chờ thanh toán
-- =====================================================
CREATE TABLE IF NOT EXISTS pending_orders (
    payos_order_code VARCHAR(100) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    receiver_name VARCHAR(150) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    shipping_address_text VARCHAR(500) NOT NULL,
    note VARCHAR(500) NULL,
    subtotal_amount DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    shipping_fee DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    items_json TEXT NOT NULL COMMENT 'JSON chứa thông tin items',
    voucher_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pending_orders_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pending_orders_voucher
        FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- =====================================================
-- Bảng order_items - Chi tiết đơn hàng
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NULL,
    product_name_snapshot VARCHAR(255) NOT NULL,
    sku_snapshot VARCHAR(120) NOT NULL,
    color_snapshot VARCHAR(80) NULL,
    ram_snapshot VARCHAR(40) NULL,
    storage_snapshot VARCHAR(40) NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    line_total DECIMAL(15,2) NOT NULL,
    flash_sale_product_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_order_items_order (order_id),
    KEY idx_order_items_variant (variant_id),
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_order_items_variant
        FOREIGN KEY (variant_id) REFERENCES product_variants(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_order_items_flash_sale_product
        FOREIGN KEY (flash_sale_product_id)
        REFERENCES flash_sale_products(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- =====================================================
-- Bảng order_status_histories - Lịch sử trạng thái đơn hàng
-- =====================================================
CREATE TABLE IF NOT EXISTS order_status_histories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    old_status ENUM('PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELED', 'RETURNED') NULL,
    new_status ENUM('PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELED', 'RETURNED') NOT NULL,
    changed_by BIGINT UNSIGNED NULL,
    note VARCHAR(500) NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_order_status_histories_order (order_id),
    KEY idx_order_status_histories_changed_at (changed_at),
    CONSTRAINT fk_order_status_histories_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_order_status_histories_changed_by
        FOREIGN KEY (changed_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- =====================================================
-- Bảng voucher_usages - Lịch sử sử dụng voucher
-- =====================================================
CREATE TABLE IF NOT EXISTS voucher_usages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    voucher_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    order_id BIGINT UNSIGNED NOT NULL,
    used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_voucher_usages_order (order_id),
    KEY idx_voucher_usages_voucher_user (voucher_id, user_id),
    CONSTRAINT fk_voucher_usages_voucher
        FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_voucher_usages_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_voucher_usages_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- Bảng reviews - Đánh giá sản phẩm
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    rating INT UNSIGNED NOT NULL,
    title VARCHAR(200) NULL,
    content TEXT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    helpful_count INT NOT NULL DEFAULT 0 COMMENT 'Số lượt đánh giá hữu ích',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_reviews_product_user (product_id, user_id),
    KEY idx_reviews_rating (rating),
    KEY idx_reviews_approved (is_approved),
    CONSTRAINT fk_reviews_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reviews_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- Bảng questions - Câu hỏi về sản phẩm
-- =====================================================
CREATE TABLE IF NOT EXISTS questions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    is_answered BOOLEAN NOT NULL DEFAULT FALSE,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_questions_product (product_id),
    KEY idx_questions_user (user_id),
    KEY idx_questions_visible (is_visible),
    CONSTRAINT fk_questions_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_questions_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- Bảng answers - Câu trả lời
-- =====================================================
CREATE TABLE IF NOT EXISTS answers (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    question_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    is_admin_answer BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_answers_question (question_id),
    CONSTRAINT fk_answers_question
        FOREIGN KEY (question_id) REFERENCES questions(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_answers_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- Bảng banners - Banner quảng cáo
-- =====================================================
CREATE TABLE IF NOT EXISTS banners (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(200) NULL,
    image_url VARCHAR(500) NOT NULL,
    link_url VARCHAR(500) NULL,
    button_text VARCHAR(60) NULL,
    position VARCHAR(80) NOT NULL,
    start_at DATETIME NULL,
    end_at DATETIME NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_banners_active_window (is_active, start_at, end_at),
    KEY idx_banners_position_sort (position, sort_order)
);

-- =====================================================
-- Bảng news - Tin tức/Bài viết
-- =====================================================
CREATE TABLE IF NOT EXISTS news (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NULL,
    excerpt TEXT NULL,
    content LONGTEXT NULL,
    image_url VARCHAR(500) NULL,
    category ENUM('CONG_NGHE', 'KHUYEN_MAI', 'DANH_GIA', 'HUONG_DAN', 'SU_KIEN', 'TIN_KHAC') NULL,
    badge VARCHAR(30) NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    view_count INT DEFAULT 0,
    author_name VARCHAR(100) NULL,
    published_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_news_slug (slug),
    KEY idx_news_category (category),
    KEY idx_news_published (is_published)
);

-- =====================================================
-- Bảng faqs - Câu hỏi thường gặp
-- =====================================================
CREATE TABLE IF NOT EXISTS faqs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'CHUNG',
    keywords VARCHAR(1000) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY idx_faqs_category (category),
    KEY idx_faqs_active (is_active)
);

-- =====================================================
-- Bảng chat_sessions - Phiên chat
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id VARCHAR(36) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_at DATETIME NULL,
    message_count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_chat_sessions_session_id (session_id),
    KEY idx_chat_sessions_created_at (created_at)
);

-- =====================================================
-- Bảng chat_messages - Tin nhắn chat
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id VARCHAR(36) NOT NULL,
    sender_type ENUM('USER', 'BOT') NOT NULL DEFAULT 'USER',
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_messages_session_id (session_id),
    INDEX idx_messages_created_at (created_at)
);

-- =====================================================
-- Bảng flash_sale_campaigns - Chiến dịch flash sale
-- =====================================================
CREATE TABLE IF NOT EXISTS flash_sale_campaigns (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_flash_sale_campaigns_active (active, start_at, end_at)
);

-- =====================================================
-- Bảng flash_sale_sessions - Phiên flash sale
-- =====================================================
CREATE TABLE IF NOT EXISTS flash_sale_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    campaign_id BIGINT UNSIGNED NOT NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    status ENUM('UPCOMING', 'RUNNING', 'ENDED') NOT NULL DEFAULT 'UPCOMING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_flash_sale_sessions_campaign (campaign_id),
    KEY idx_flash_sale_sessions_time (start_at, end_at),
    CONSTRAINT fk_flash_sale_sessions_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES flash_sale_campaigns(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- Bảng flash_sale_products - Sản phẩm flash sale
-- =====================================================
CREATE TABLE IF NOT EXISTS flash_sale_products (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id BIGINT UNSIGNED NOT NULL,
    variant_id BIGINT UNSIGNED NOT NULL,
    flash_price DECIMAL(15,2) NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    sold_quantity INT UNSIGNED NOT NULL DEFAULT 0,
    limit_per_user INT UNSIGNED NOT NULL DEFAULT 1,
    status ENUM('ACTIVE', 'SOLD_OUT', 'HIDDEN') NOT NULL DEFAULT 'ACTIVE',
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_flash_sale_session_variant (session_id, variant_id),
    KEY idx_flash_sale_products_session (session_id),
    KEY idx_flash_sale_products_variant (variant_id),
    CONSTRAINT fk_flash_sale_products_session
        FOREIGN KEY (session_id)
        REFERENCES flash_sale_sessions(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_flash_sale_products_variant
        FOREIGN KEY (variant_id)
        REFERENCES product_variants(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- Bảng product_discounts - Giảm giá sản phẩm
-- =====================================================
CREATE TABLE IF NOT EXISTS product_discounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    variant_id BIGINT NOT NULL,
    discount_percent INT NULL,
    discount_amount DECIMAL(18, 0) NULL,
    discount_type ENUM('PERCENT', 'FIXED') NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT fk_product_discounts_variant
        FOREIGN KEY (variant_id) REFERENCES product_variants(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX idx_product_discounts_variant ON product_discounts(variant_id);
CREATE INDEX idx_product_discounts_active ON product_discounts(is_active);
CREATE INDEX idx_product_discounts_period ON product_discounts(start_at, end_at);

-- =====================================================
-- Bootstrap: Tài khoản admin mặc định
-- =====================================================
INSERT INTO users (email, phone, password_hash, full_name, role, status)
SELECT 'admin@phonestore.local', '0900000000', '$2a$10$wH9E8sXeN8R6m2U8gQ2P2e9C6jKfWifSoeaM0xYPz8E8S2gLwFvH2', 'System Admin', 'ADMIN', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@phonestore.local'
);
