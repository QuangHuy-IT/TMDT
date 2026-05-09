-- Cleanup script: xoa user bi corrupt UTF-8
-- Chay: mysql -u root -p123456 phone_store < cleanup_utf8.sql

DELETE FROM users WHERE full_name LIKE '%Ã%' OR full_name LIKE '%Â%' OR full_name LIKE '%á%';

-- Kiem tra lai
SELECT id, email, full_name, status FROM users;
