# Huong dan do du lieu vao database

# Chạy file import_cleaned_to_db.py

File import chinh: `scraper/import_to_db.py`

Script nay doc du lieu da scrape tu JSON va do vao database MySQL `phone_store`.

## 1. Chuan bi

Chay lenh tu thu muc goc repo:

```bash
cd d:\WEB\TMDT\TMDT
```

Can co:

- MySQL dang chay local.
- Python 3.
- Thu vien MySQL connector cho Python.

```bash
pip install mysql-connector-python
```

Cau hinh database dang nam trong `scraper/import_to_db.py`:

```python
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '123456',
    'database': 'phone_store',
}
```

Neu MySQL local dung user/password khac, sua `DB_CONFIG` truoc khi chay import.

## 2. File du lieu dau vao

Script dang dung 2 file:

```text
scraper/scrap_py/products_data_final.json
scraper/scrap_py/brands.json
```

Trong do:

- `products_data_final.json`: san pham, bien the, anh, thong so ky thuat.
- `brands.json`: logo thuong hieu, field `brand_logo_url` se duoc do vao `brands.logo_url`.

## 3. Import day du du lieu

```bash
python scraper/import_to_db.py
```

Lenh nay se:

- Tao database `phone_store` neu chua co.
- Tao cac bang can thiet neu chua co: `brands`, `categories`, `products`, `product_variants`, `product_images`, `product_specifications`, `inventories`.
- Insert brand/category neu chua ton tai.
- Insert product theo `slug`.
- Insert variants theo `sku`.
- Insert images, specifications va inventory.
- Tu sinh `products.short_description` neu JSON dang null/rong.
- Lay `brand_logo_url` tu `brands.json` de cap nhat `brands.logo_url`.

Quy tac gia trong import:

- `product_variants.price` lay tu `compare_at_price` neu co, neu khong thi lay `price`.
- `product_variants.cost_price = price / 2`.
- Khong insert `compare_at_price` vao database.

## 4. Backfill rieng khi DB da co san du lieu

Neu da import san pham truoc do va chi muon cap nhat mo ta ngan:

```bash
python scraper/import_to_db.py --backfill-short-description
```

Mac dinh lenh nay chi cap nhat product co `short_description` dang null/rong. Neu muon ghi de tat ca:

```bash
python scraper/import_to_db.py --backfill-short-description --overwrite-short-description
```

Neu chi muon cap nhat logo brand tu `brands.json`:

```bash
python scraper/import_to_db.py --backfill-brand-logos
```

Mac dinh lenh nay chi cap nhat brand co `logo_url` dang null/rong. Neu muon ghi de tat ca:

```bash
python scraper/import_to_db.py --backfill-brand-logos --overwrite-brand-logo
```

Luu y: `brands.json` hien khong co logo cho `REDMAGIC`, nen brand nay se van thieu `logo_url` neu DB co brand `REDMAGIC`.

Neu trang chi tiet san pham chua co thong so ky thuat, backfill `product_specifications` tu `products_data_final.json`:

```bash
python scraper/import_to_db.py --backfill-specifications
```

Mac dinh lenh nay bo qua product da co thong so hop le va se sua cac product chi co dong thong so rong. Neu muon ghi de thong so hien tai theo JSON:

```bash
python scraper/import_to_db.py --backfill-specifications --overwrite-specifications
```

## 5. Kiem tra sau khi import

Mo MySQL va chay:

```sql
USE phone_store;

SELECT COUNT(*) AS total_products
FROM products;

SELECT COUNT(*) AS total_variants
FROM product_variants;

SELECT COUNT(*) AS total_images
FROM product_images;

SELECT COUNT(*) AS total_specs
FROM product_specifications;
```

Kiem tra product con thieu mo ta ngan:

```sql
SELECT id, name
FROM products
WHERE short_description IS NULL
   OR TRIM(short_description) = '';
```

Kiem tra brand con thieu logo:

```sql
SELECT id, name
FROM brands
WHERE logo_url IS NULL
   OR TRIM(logo_url) = '';
```

## 6. Loi thuong gap

Loi ket noi MySQL:

- Kiem tra MySQL da chay chua.
- Kiem tra `host`, `user`, `password` trong `DB_CONFIG`.
- Kiem tra user co quyen tao database/table hay khong.

Loi thieu thu vien `mysql.connector`:

```bash
pip install mysql-connector-python
```

Chay lai import nhieu lan:

- Product duoc check trung theo `slug`.
- Variant duoc check trung theo `sku`.
- Brand/category duoc tai su dung neu da ton tai.
- Neu chi can cap nhat `short_description` hoac `logo_url`, nen dung cac lenh backfill rieng o muc 4.
