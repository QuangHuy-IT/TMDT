CREATE DATABASE IF NOT EXISTS phone_store
	CHARACTER SET utf8mb4
	COLLATE utf8mb4_unicode_ci;

USE phone_store;

CREATE TABLE IF NOT EXISTS users (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	email VARCHAR(255) NOT NULL,
	phone VARCHAR(20) NULL,
	password_hash VARCHAR(255) NOT NULL,
	full_name VARCHAR(150) NOT NULL,
	role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
	status ENUM('ACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
	avatar_url VARCHAR(500) NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	last_login_at DATETIME NULL,
	deleted_at DATETIME NULL,
	PRIMARY KEY (id),
	UNIQUE KEY uk_users_email (email),
	UNIQUE KEY uk_users_phone (phone),
	KEY idx_users_role (role),
	KEY idx_users_status (status)
);

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

CREATE TABLE IF NOT EXISTS brands (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	name VARCHAR(120) NOT NULL,
	slug VARCHAR(160) NOT NULL,
	logo_url VARCHAR(500) NULL,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	UNIQUE KEY uk_brands_name (name),
	UNIQUE KEY uk_brands_slug (slug),
	KEY idx_brands_active (is_active)
);

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

CREATE TABLE IF NOT EXISTS products (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	brand_id BIGINT UNSIGNED NOT NULL,
	category_id BIGINT UNSIGNED NOT NULL,
	created_by BIGINT UNSIGNED NULL,
	name VARCHAR(255) NOT NULL,
	slug VARCHAR(300) NOT NULL,
	short_description VARCHAR(500) NOT NULL,
	detail_description TEXT NOT NULL,
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
	KEY idx_products_category (category_id),
	KEY idx_products_status (status),
	KEY idx_products_featured (is_featured),
	KEY idx_products_name (name),
	CONSTRAINT fk_products_brand
		FOREIGN KEY (brand_id) REFERENCES brands(id)
		ON DELETE RESTRICT ON UPDATE CASCADE,
	CONSTRAINT fk_products_category
		FOREIGN KEY (category_id) REFERENCES categories(id)
		ON DELETE RESTRICT ON UPDATE CASCADE,
	CONSTRAINT fk_products_created_by
		FOREIGN KEY (created_by) REFERENCES users(id)
		ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS product_variants (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	product_id BIGINT UNSIGNED NOT NULL,
	sku VARCHAR(120) NOT NULL,
	color VARCHAR(80) NOT NULL,
	ram_gb INT UNSIGNED NULL,
	storage_gb INT UNSIGNED NULL,
	price DECIMAL(15,2) NOT NULL,
	compare_at_price DECIMAL(15,2) NULL,
	cost_price DECIMAL(15,2) NULL,
	weight_gram INT UNSIGNED NULL,
	barcode VARCHAR(120) NULL,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	deleted_at DATETIME NULL,
	PRIMARY KEY (id),
	UNIQUE KEY uk_product_variants_sku (sku),
	KEY idx_product_variants_product (product_id),
	KEY idx_product_variants_price (price),
	KEY idx_product_variants_active (is_active),
	CONSTRAINT fk_product_variants_product
		FOREIGN KEY (product_id) REFERENCES products(id)
		ON DELETE CASCADE ON UPDATE CASCADE
);

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

CREATE TABLE IF NOT EXISTS product_specifications (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	product_id BIGINT UNSIGNED NOT NULL,
	spec_key VARCHAR(120) NOT NULL,
	spec_value VARCHAR(500) NOT NULL,
	sort_order INT UNSIGNED NOT NULL DEFAULT 0,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	KEY idx_product_specs_product (product_id),
	KEY idx_product_specs_sort (sort_order),
	CONSTRAINT fk_product_specs_product
		FOREIGN KEY (product_id) REFERENCES products(id)
		ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS inventories (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	variant_id BIGINT UNSIGNED NOT NULL,
	quantity_on_hand INT NOT NULL DEFAULT 0,
	quantity_reserved INT NOT NULL DEFAULT 0,
	reorder_level INT NOT NULL DEFAULT 5,
	stock_status ENUM('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK') NOT NULL DEFAULT 'IN_STOCK',
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	UNIQUE KEY uk_inventories_variant (variant_id),
	KEY idx_inventories_stock_status (stock_status),
	CONSTRAINT fk_inventories_variant
		FOREIGN KEY (variant_id) REFERENCES product_variants(id)
		ON DELETE CASCADE ON UPDATE CASCADE
);

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

CREATE TABLE IF NOT EXISTS orders (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	order_code VARCHAR(40) NOT NULL,
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
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	KEY idx_order_items_order (order_id),
	KEY idx_order_items_variant (variant_id),
	CONSTRAINT fk_order_items_order
		FOREIGN KEY (order_id) REFERENCES orders(id)
		ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT fk_order_items_variant
		FOREIGN KEY (variant_id) REFERENCES product_variants(id)
		ON DELETE SET NULL ON UPDATE CASCADE
);

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

CREATE TABLE IF NOT EXISTS reviews (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	product_id BIGINT UNSIGNED NOT NULL,
	user_id BIGINT UNSIGNED NOT NULL,
	rating INT UNSIGNED NOT NULL,
	title VARCHAR(200) NULL,
	content TEXT NULL,
	is_approved BOOLEAN NOT NULL DEFAULT FALSE,
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

CREATE TABLE IF NOT EXISTS banners (
	id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
	title VARCHAR(200) NOT NULL,
	image_url VARCHAR(500) NOT NULL,
	link_url VARCHAR(500) NULL,
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


CREATE TABLE flash_sale_campaigns (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    title VARCHAR(255) NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),

    KEY idx_flash_sale_campaigns_active (
        is_active,
        start_at,
        end_at
    )
);


CREATE TABLE flash_sale_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    campaign_id BIGINT UNSIGNED NOT NULL,

    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,

    status ENUM(
        'UPCOMING',
        'RUNNING',
        'ENDED'
    ) NOT NULL DEFAULT 'UPCOMING',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_flash_sale_sessions_campaign (
        campaign_id
    ),

    KEY idx_flash_sale_sessions_time (
        start_at,
        end_at
    ),

    CONSTRAINT fk_flash_sale_sessions_campaign
        FOREIGN KEY (campaign_id)
        REFERENCES flash_sale_campaigns(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE   (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    session_id BIGINT UNSIGNED NOT NULL,

    variant_id BIGINT UNSIGNED NOT NULL,

    flash_price DECIMAL(15,2) NOT NULL,

    quantity INT UNSIGNED NOT NULL,

    sold_quantity INT UNSIGNED NOT NULL DEFAULT 0,

    limit_per_user INT UNSIGNED NOT NULL DEFAULT 1,

    status ENUM(
        'ACTIVE',
        'SOLD_OUT',
        'HIDDEN'
    ) NOT NULL DEFAULT 'ACTIVE',

    sort_order INT UNSIGNED NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_flash_sale_session_variant (
        session_id,
        variant_id
    ),

    KEY idx_flash_sale_products_session (
        session_id
    ),

    KEY idx_flash_sale_products_variant (
        variant_id
    ),

    CONSTRAINT fk_flash_sale_products_session
        FOREIGN KEY (session_id)
        REFERENCES flash_sale_sessions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_flash_sale_products_variant
        FOREIGN KEY (variant_id)
        REFERENCES product_variants(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

ALTER TABLE order_items
ADD COLUMN flash_sale_product_id BIGINT UNSIGNED NULL,
ADD CONSTRAINT fk_order_items_flash_sale_product
    FOREIGN KEY (flash_sale_product_id)
    REFERENCES flash_sale_products(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

CREATE TABLE chat_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(255) UNIQUE,
    user_id BIGINT NULL,
    is_guest BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(255),
    sender ENUM('USER','BOT'),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_discounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    variant_id BIGINT NOT NULL,
    discount_percent INT,
    discount_amount DECIMAL(18, 0),
    discount_type ENUM('PERCENT', 'FIXED'),
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT fk_product_discounts_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);
CREATE INDEX idx_product_discounts_variant ON product_discounts(variant_id);
CREATE INDEX idx_product_discounts_active ON product_discounts(is_active);
CREATE INDEX idx_product_discounts_period ON product_discounts(start_at, end_at);

-- CREATE TABLE IF NOT EXISTS flash_sales (
--     id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
--     title VARCHAR(255),
--     start_at DATETIME,
--     end_at DATETIME,
--     is_active BOOLEAN,
--     PRIMARY KEY (id)
-- );
-- CREATE TABLE IF NOT EXISTS flash_sale_items (
--     id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    
--     flash_sale_id BIGINT UNSIGNED NOT NULL,
--     product_id BIGINT UNSIGNED NOT NULL,
    
--     promotion DECIMAL(10,2) NOT NULL DEFAULT 0,
--     quantity INT NOT NULL DEFAULT 0,

--     created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
--         ON UPDATE CURRENT_TIMESTAMP,

--     PRIMARY KEY (id),

--     UNIQUE KEY uk_flash_sale_product (
--         flash_sale_id,
--         product_id
--     ),

--     CONSTRAINT fk_flash_sale_items_flash_sale
--         FOREIGN KEY (flash_sale_id)
--         REFERENCES flash_sales(id)
--         ON DELETE CASCADE
--         ON UPDATE CASCADE,

--     CONSTRAINT fk_flash_sale_items_product
--         FOREIGN KEY (product_id)
--         REFERENCES products(id)
--         ON DELETE CASCADE
--         ON UPDATE CASCADE
-- );

-- Optional bootstrap admin account (change password hash before use in production).
-- Password example should be generated by BCryptPasswordEncoder.
INSERT INTO users (email, phone, password_hash, full_name, role, status)
SELECT 'admin@phonestore.local', '0900000000', '$2a$10$wH9E8sXeN8R6m2U8gQ2P2e9C6jKfWifSoeaM0xYPz8E8S2gLwFvH2', 'System Admin', 'ADMIN', 'ACTIVE'
WHERE NOT EXISTS (
	SELECT 1 FROM users WHERE email = 'admin@phonestore.local'
);

-- Add year_of_birth column to users table
ALTER TABLE users ADD COLUMN `year_of_birth` INT NULL COMMENT 'Năm sinh của người dùng';

-- Add index for faster queries
CREATE INDEX idx_users_year_of_birth ON users(year_of_birth);
