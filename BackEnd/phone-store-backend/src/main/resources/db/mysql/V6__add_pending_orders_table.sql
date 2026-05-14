CREATE TABLE pending_orders (
    payos_order_code VARCHAR(50) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    receiver_name VARCHAR(150) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    shipping_address_text VARCHAR(500) NOT NULL,
    note VARCHAR(500),
    subtotal_amount DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) NOT NULL,
    shipping_fee DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    items_json TEXT NOT NULL,
    voucher_id BIGINT,
    created_at DATETIME NOT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
