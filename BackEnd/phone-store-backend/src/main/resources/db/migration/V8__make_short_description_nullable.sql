-- Migration: TMDT Phone Store - Make short_description column nullable
ALTER TABLE products MODIFY COLUMN short_description MEDIUMTEXT NULL;
