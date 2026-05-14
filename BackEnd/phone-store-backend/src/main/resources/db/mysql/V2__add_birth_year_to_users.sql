-- Add year_of_birth column to users table
ALTER TABLE users ADD COLUMN `year_of_birth` INT NULL COMMENT 'Năm sinh của người dùng';

-- Add index for faster queries
CREATE INDEX idx_users_year_of_birth ON users(year_of_birth);

ALTER TABLE products ADD COLUMN thumbnail_url VARCHAR(500);
ALTER TABLE product_variants ADD COLUMN color_image_url VARCHAR(500);