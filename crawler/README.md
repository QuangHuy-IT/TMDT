# CellphoneS Product Crawler

Web scraper cho [cellphones.com.vn](https://cellphones.com.vn/mobile.html) — crawl dữ liệu điện thoại và lưu vào MySQL.

## Tech Stack

- **Playwright** — headless browser, xử lý lazy loading & JS-rendered content
- **MySQL2** — lưu dữ liệu với connection pool và transactions
- **Cheerio** — parse HTML khi cần (optional)
- **dotenv** — quản lý environment variables

---

## Cấu trúc Project

```
crawler/
├── src/
│   ├── index.js          # Entry point — orchestrator chính
│   ├── crawl-list.js     # Crawl trang listing sản phẩm
│   ├── crawl-detail.js   # Crawl trang chi tiết từng sản phẩm
│   ├── save-product.js   # Lưu vào MySQL (transaction + upsert)
│   ├── db.js             # Database connection pool & helpers
│   └── utils.js          # Logger, slug, SKU, retry, delay...
├── schema.sql            # SQL schema + sample data
├── .env.example          # Template cấu hình
├── package.json
└── README.md
```

---

## Cài đặt & Chạy

### 1. Cài dependencies

```bash
cd crawler
npm install
npx playwright install chromium  # Tải Chromium browser
```

### 2. Tạo file .env

```bash
cp .env.example .env
```

Chỉnh sửa `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecommerce_phone

MAX_PRODUCTS=30     # Số sản phẩm tối đa (0 = không giới hạn)
MIN_DELAY=1500      # Delay tối thiểu giữa requests (ms)
MAX_DELAY=3500      # Delay tối đa giữa requests (ms)
MAX_RETRIES=3       # Số lần retry khi fail
HEADLESS=true       # false để xem browser
```

### 3. Tạo database

```bash
mysql -u root -p < schema.sql
```

Hoặc chạy thủ công trong MySQL client:

```sql
SOURCE /path/to/crawler/schema.sql;
```

### 4. Chạy crawler

```bash
npm run crawl
```

Debug mode (hiện thêm log):

```bash
npm run crawl:debug
```

---

## Output

Sau khi chạy xong:

- Dữ liệu được lưu vào MySQL
- File `output/products.json` được tạo
- Summary report in ra terminal

```
============================================================
  CRAWL COMPLETE - SUMMARY REPORT
============================================================
  Total products found : 30
  Newly inserted       : 28
  Updated              : 2
  Errors               : 0
  Duration             : 245.3s
  Output               : ./output/products.json
============================================================
```

---

## Database Schema

### `products`
| Column | Type | Mô tả |
|---|---|---|
| id | INT | Primary key |
| name | VARCHAR(500) | Tên sản phẩm |
| slug | VARCHAR(520) | URL-friendly slug (unique) |
| brand_id | INT | FK → brands |
| category_id | INT | FK → categories |
| short_description | TEXT | Mô tả ngắn |
| detail_description | LONGTEXT | Mô tả chi tiết (HTML) |
| sale | INT | % giảm giá |
| warranty_months | INT | Số tháng bảo hành |
| status | ENUM | ACTIVE / INACTIVE / OUT_OF_STOCK |
| is_featured | TINYINT | Sản phẩm nổi bật |

### `product_variants`
| Column | Type | Mô tả |
|---|---|---|
| sku | VARCHAR(100) | Format: BRAND-RAM-ROM-COLOR-RAND |
| color | VARCHAR(100) | Màu sắc |
| ram_gb | SMALLINT | RAM (GB) |
| storage_gb | SMALLINT | Bộ nhớ trong (GB) |
| price | BIGINT | Giá bán (VND) |
| compare_at_price | BIGINT | Giá gốc (VND) |

### `product_images`
| Column | Type | Mô tả |
|---|---|---|
| image_url | VARCHAR(1000) | URL ảnh |
| is_primary | TINYINT | Ảnh đại diện |
| sort_order | SMALLINT | Thứ tự hiển thị |

### `product_specifications`
| Column | Type | Mô tả |
|---|---|---|
| spec_key | VARCHAR(200) | Tên thông số (vd: `cpu`, `screen_size`) |
| spec_value | VARCHAR(1000) | Giá trị |

---

## Anti-Bot Features

| Feature | Mô tả |
|---|---|
| Random User-Agent | Rotate qua 5 UA khác nhau |
| Random Viewport | 4 kích thước màn hình khác nhau |
| Stealth Mode | Ẩn `navigator.webdriver` flag |
| Random Delay | 1.5s–3.5s giữa mỗi request |
| Locale & Timezone | vi-VN, Asia/Ho_Chi_Minh |
| HTTP Headers | Accept-Language, DNT, etc. |
| Block Trackers | Chặn analytics, Facebook pixel |

---

## Logic Xử Lý

### Brand Detection
Tự động detect brand từ tên sản phẩm:
```
iPhone 15 Pro Max  → Apple
Samsung Galaxy S24 → Samsung
Xiaomi 14          → Xiaomi
OPPO Reno 11       → OPPO
```

### Slug Generation
```
iPhone 15 Pro Max 256GB → iphone-15-pro-max-256gb
Samsung Galaxy S24+ 512GB → samsung-galaxy-s24-512gb
```

### SKU Generation
Format: `BRANDCODE-RAM-ROM-COLOR-RANDOM`
```
IP-8-256-BLACK-X92A
SS-12-256-SILV-B3F7
XI-8-128-BLUE-K1M4
```

### Duplicate Check
- Nếu slug đã tồn tại → **UPDATE** product + xóa/insert lại variants/images/specs
- Nếu slug chưa có → **INSERT** mới

### Transaction
```
BEGIN TRANSACTION
  → INSERT/UPDATE products
  → DELETE old variants/images/specs (nếu update)
  → INSERT product_variants
  → INSERT product_images
  → INSERT product_specifications
COMMIT  ← nếu thành công
ROLLBACK ← nếu có lỗi
```

---

## Troubleshooting

**Lỗi kết nối DB:**
```
Error: Access denied for user 'root'@'localhost'
```
→ Kiểm tra `DB_USER`, `DB_PASSWORD` trong `.env`

**Playwright không tìm thấy Chromium:**
```
Error: browserType.launch: Executable doesn't exist
```
→ Chạy: `npx playwright install chromium`

**Không crawl được sản phẩm (0 products found):**
→ CellphoneS có thể đã đổi HTML structure
→ Bật `HEADLESS=false` để quan sát browser
→ Bật `DEBUG=true` để xem thêm log
→ Kiểm tra selector trong `crawl-list.js`

**Bị block (403 / CAPTCHA):**
→ Tăng `MIN_DELAY` và `MAX_DELAY`
→ Giảm `MAX_PRODUCTS` xuống 10–15
→ Chạy lại sau vài phút

---

## Yêu cầu Hệ thống

- Node.js >= 18.0.0
- MySQL 5.7+ hoặc MariaDB 10.3+
- RAM: ít nhất 1GB (Chromium cần ~300MB)
- Kết nối internet ổn định
