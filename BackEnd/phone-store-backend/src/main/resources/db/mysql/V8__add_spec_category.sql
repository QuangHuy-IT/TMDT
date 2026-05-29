-- Migration V8: Add spec_category column to product_specifications for grouped specifications (CellphoneS-style)

ALTER TABLE product_specifications
ADD COLUMN spec_category VARCHAR(60) DEFAULT NULL AFTER spec_value;

CREATE INDEX idx_product_spec_category ON product_specifications(product_id, spec_category);
