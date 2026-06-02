# Hướng dẫn Đổ Dữ liệu vào Database (Database Seed & Import Guide)

Tài liệu này hướng dẫn chi tiết thứ tự chạy các script Python và Jupyter Notebook trong thư mục `scraper` để làm sạch và nạp đầy đủ dữ liệu (sản phẩm, thương hiệu, banner, tài khoản người dùng, đơn hàng, đánh giá, hỏi đáp...) vào database MySQL `phone_store`.

---

## 📌 Chuẩn Bị Trước Khi Chạy

1. **MySQL Server**: Đảm bảo MySQL đang chạy local trên cổng `3306`.
2. **Khởi tạo cấu trúc bảng**: Chạy ứng dụng Spring Boot Backend lần đầu tiên để Hibernate/Flyway tự động tạo toàn bộ cấu trúc bảng cần thiết trong database `phone_store`.
3. **Cài đặt thư viện Python**:
   Chạy lệnh cài đặt các thư viện cần thiết tại máy của bạn:
   ```bash
   pip install mysql-connector-python requests cloudinary
   ```

---

## 🚀 Thứ Tự Chạy Các Script Nạp Dữ Liệu

Để dữ liệu không bị lỗi khóa ngoại (Foreign Key) và đảm bảo các đường dẫn ảnh CDN hoạt động chính xác, bạn **phải** tuân thủ tuyệt đối thứ tự chạy dưới đây:

### Bước 1: Nhập dữ liệu sản phẩm, thương hiệu, danh mục gốc
* **Tệp thực thi**: `scraper/import_cleaned_to_db.py`
* **Lệnh chạy**:
  ```bash
  python scraper/import_cleaned_to_db.py
  ```
* **Mô tả**: 
  * Xóa sạch dữ liệu cũ trong các bảng sản phẩm chính.
  * Đọc file dữ liệu thô đã làm sạch `scraper/scrap_py/products_data_final_cleaned.json`.
  * Nhập mới dữ liệu vào các bảng: `brands` (tên, slug), `categories`, `product_series`, `products`, `product_variants` (SKU, giá bán, giá vốn), `product_images`, `inventories` (số lượng mặc định 100), `product_discounts` và `product_specifications`.

### Bước 2: Đẩy Logo Thương hiệu lên Cloudinary & Đồng bộ Database
* **Tệp thực thi**: `scraper/scrap_py/brands/import_db.ipynb` (Chạy bằng Jupyter Notebook hoặc VS Code Jupyter Extension)
* **Mô tả**:
  * Đọc file thông tin hãng `scraper/scrap_py/brands/brands.json`.
  * Thực hiện đẩy (upload) ảnh logo gốc của các hãng lên tài khoản Cloudinary cấu hình sẵn để lấy link ảnh CDN dạng HTTPS bảo mật.
  * Chạy câu lệnh SQL `UPDATE` cập nhật các trường `logo_url` và `sort_order` tương ứng cho các thương hiệu có sẵn trong bảng `brands` thông qua `slug`.

### Bước 3: Đẩy ảnh Banner lên Cloudinary & Nhập mới dữ liệu Banner
* **Tệp thực thi**: `scraper/scrap_py/banner/import_db.ipynb` (Chạy bằng Jupyter Notebook hoặc VS Code Jupyter Extension)
* **Mô tả**:
  * Đọc dữ liệu banner gốc tại `scraper/scrap_py/banner/banner.json`.
  * Upload toàn bộ ảnh banner lên Cloudinary và ghi nhận danh sách ảnh CDN mới ra tệp tạm `banner_updated.json`.
  * Xóa sạch bảng banner cũ (`TRUNCATE TABLE banners`) và thực hiện chèn mới (Insert) 9 banner quảng cáo chuẩn chỉnh kèm link CDN vào bảng `banners` trong database.

### Bước 4: Tạo dữ liệu ảo người dùng, giao dịch và tương tác (Mock Data)
* **Tệp thực thi**: `scraper/gen_data.py`
* **Lệnh chạy**:
  ```bash
  python scraper/gen_data.py
  ```
* **Mô tả**:
  * Nạp dữ liệu mô phỏng tương tác người dùng vào database để hệ thống sinh động hơn.
  * Xóa sạch dữ liệu giao dịch cũ để tránh xung đột khóa ngoại.
  * Sinh ngẫu nhiên **45 - 55 người dùng** (`users`) và địa chỉ nhận hàng tương ứng (`user_addresses`).
  * Sinh dữ liệu lịch sử xuất/nhập/kiểm kho (`inventory_movements`, `inventory_logs`).
  * Sinh **chính xác 400 sản phẩm yêu thích** (`wishlist_items`) phân bổ cho các tài khoản.
  * Tạo các mã giảm giá (`vouchers`) và lịch sử sử dụng voucher (`voucher_usages`).
  * Sinh **150 - 200 đơn hàng** (`orders`, `order_items`, `order_status_histories`) với nhiều trạng thái và phương thức thanh toán khác nhau.
  * Sinh **200 - 300 đánh giá sản phẩm** (`reviews`) từ 1 đến 5 sao đi kèm nội dung đánh giá thực tế.
  * Sinh **150 - 200 câu hỏi và câu trả lời tương ứng** (`questions`, `answers`) cùng danh mục câu hỏi thường gặp (`faqs`).
  * Sinh chiến dịch Flash Sale ảo (`flash_sale_campaigns`, `flash_sale_sessions`, `flash_sale_products`).

---

## 📊 Kiểm Tra Sau Khi Nạp Dữ Liệu

Bạn có thể mở MySQL Workbench hoặc CLI và chạy các truy vấn sau để xác minh dữ liệu đã nạp thành công:

```sql
USE phone_store;

-- Kiểm tra số lượng sản phẩm và biến thể
SELECT COUNT(*) AS total_products FROM products;
SELECT COUNT(*) AS total_variants FROM product_variants;

-- Kiểm tra số lượng banner quảng cáo
SELECT COUNT(*) AS total_banners FROM banners;

-- Kiểm tra số lượng đánh giá và hỏi đáp
SELECT COUNT(*) AS total_reviews FROM reviews;
SELECT COUNT(*) AS total_questions FROM questions;
SELECT COUNT(*) AS total_answers FROM answers;

-- Kiểm tra dữ liệu yêu thích (Wishlist)
SELECT COUNT(*) AS total_wishlist_items FROM wishlist_items;
```
