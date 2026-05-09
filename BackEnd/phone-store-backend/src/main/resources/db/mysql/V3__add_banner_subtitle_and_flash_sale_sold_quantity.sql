-- Add subtitle and button_text to banners table
ALTER TABLE banners
ADD COLUMN IF NOT EXISTS `subtitle` VARCHAR(200) NULL COMMENT 'Phụ đề của banner' AFTER `title`,
ADD COLUMN IF NOT EXISTS `button_text` VARCHAR(60) NULL COMMENT 'Text cho nút bấm trên banner' AFTER `link_url`;

-- Add sold_quantity column to flash_sale_items table
ALTER TABLE flash_sale_items
ADD COLUMN IF NOT EXISTS `sold_quantity` INT NOT NULL DEFAULT 0 COMMENT 'Số lượng đã bán trong flash sale';
