# Phone Store Database Design (MySQL)

File schema chinh:
- `src/main/resources/db/mysql/V1__phone_store_schema.sql`

## Nhom bang chinh

### 1) Tai khoan va phan quyen
- `users`: tai khoan, role USER/ADMIN, trang thai hoat dong
- `user_addresses`: dia chi giao hang cua user

### 2) Danh muc va san pham
- `brands`
- `categories` (co `parent_id` de ho tro danh muc cha/con)
- `products` (mo ta ngan, mo ta chi tiet, bao hanh, trang thai)
- `product_variants` (SKU, mau, RAM, bo nho, gia)
- `product_images` (nhieu hinh cho trang chi tiet)
- `product_specifications` (thong so ky thuat)

### 3) Kho va ton
- `inventories` (ton hien tai, ton giu cho don hang, low stock)
- `inventory_movements` (lich su nhap/xuat/dieu chinh)

### 4) Gio hang va don hang
- `carts`, `cart_items`
- `orders`, `order_items`
- `order_status_histories`

### 5) Mo rong cho website hoan chinh
- `vouchers`, `voucher_usages`
- `reviews`
- `wishlists`, `wishlist_items`
- `banners`

## Trang thai quan trong
- User role: `USER`, `ADMIN`
- Product status: `DRAFT`, `ACTIVE`, `INACTIVE`, `DISCONTINUED`
- Stock status: `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`
- Order status: `PENDING`, `CONFIRMED`, `PACKING`, `SHIPPING`, `DELIVERED`, `CANCELED`, `RETURNED`
- Payment status: `UNPAID`, `PAID`, `FAILED`, `REFUNDED`

## Cach su dung nhanh

1. Tao DB va bang:
```sql
SOURCE src/main/resources/db/mysql/V1__phone_store_schema.sql;
```

2. Hoac copy toan bo noi dung SQL va chay trong MySQL Workbench.

3. Hien tai backend dang de:
- `spring.jpa.hibernate.ddl-auto=update`

Khuyen nghi khi da co schema on dinh:
- doi sang `spring.jpa.hibernate.ddl-auto=validate`

## Luu y
- Ban ghi admin bootstrap trong file SQL chi de khoi tao nhanh.
- Can thay `password_hash` bang hash BCrypt thuc te truoc khi deploy.
- Nen dung migration tool (Flyway/Liquibase) khi du an lon dan.
