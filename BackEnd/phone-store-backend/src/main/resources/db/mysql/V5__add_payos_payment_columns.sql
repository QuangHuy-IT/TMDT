-- V5__add_payos_payment_columns.sql
-- Add payment_link_id and paid_at columns for PayOS payment integration

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_link_id VARCHAR(100) AFTER order_code;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS paid_at DATETIME AFTER placed_at;
