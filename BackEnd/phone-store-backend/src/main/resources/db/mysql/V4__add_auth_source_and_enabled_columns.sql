-- Add auth_source, enabled, google_id columns to users table for Hybrid Authentication
ALTER TABLE users
ADD COLUMN IF NOT EXISTS `auth_source` VARCHAR(20) NOT NULL DEFAULT 'LOCAL' COMMENT 'Nguồn xác thực: LOCAL hoặc GOOGLE' AFTER `deleted_at`,
ADD COLUMN IF NOT EXISTS `enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Tài khoản đã được kích hoạt hay chưa' AFTER `auth_source`,
ADD COLUMN IF NOT EXISTS `google_id` VARCHAR(255) NULL COMMENT 'Google OAuth2 subject ID' AFTER `enabled`;
