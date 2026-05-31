#!/usr/bin/env python3
"""
Script để import dữ liệu từ products_data_final.json vào database.
Xử lý:
- price = compare_at_price (giá gốc)
- cost_price = price / 2
- Không insert compare_at_price vào database
"""

import json
import mysql.connector
from mysql.connector import Error
import re
import html
from datetime import datetime

# Cấu hình database
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '123456',
    'database': 'phone_store',
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}

JSON_PATH = 'scraper/scrap_py/products_data_final.json'
BRANDS_PATH = 'scraper/scrap_py/brands.json'

def slugify(text):
    """Tạo slug từ text tiếng Việt"""
    if not text:
        return ''
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text

def clean_text(value):
    """Chuẩn hóa text để đưa vào database."""
    if value is None:
        return ''
    return re.sub(r'\s+', ' ', str(value)).strip()

def strip_html(value):
    """Chuyển HTML mô tả sang plain text ngắn gọn."""
    text = html.unescape(clean_text(value))
    text = re.sub(r'<[^>]+>', ' ', text)
    return clean_text(text)

def unique_values(values):
    """Giữ thứ tự và bỏ trùng các giá trị text."""
    result = []
    seen = set()
    for value in values:
        text = clean_text(value)
        key = text.lower()
        if text and key not in seen and key != 'đang cập nhật':
            seen.add(key)
            result.append(text)
    return result

def get_spec_value(specifications, spec_keys, categories=None):
    """Lấy giá trị thông số đầu tiên khớp key/category."""
    normalized_keys = {key.lower() for key in spec_keys}
    normalized_categories = {category.lower() for category in categories} if categories else None

    for spec in specifications or []:
        spec_key = clean_text(spec.get('spec_key') or spec.get('key')).lower()
        spec_category = clean_text(spec.get('spec_category') or spec.get('category')).lower()
        if spec_key not in normalized_keys:
            continue
        if normalized_categories and spec_category not in normalized_categories:
            continue
        value = clean_text(spec.get('spec_value') or spec.get('value'))
        if value and value.lower() != 'đang cập nhật':
            return value
    return ''

def get_spec_values(specifications, spec_keys, categories=None, limit=3):
    """Lấy nhiều giá trị thông số, ví dụ các độ phân giải camera."""
    normalized_keys = {key.lower() for key in spec_keys}
    normalized_categories = {category.lower() for category in categories} if categories else None
    values = []

    for spec in specifications or []:
        spec_key = clean_text(spec.get('spec_key') or spec.get('key')).lower()
        spec_category = clean_text(spec.get('spec_category') or spec.get('category')).lower()
        if spec_key not in normalized_keys:
            continue
        if normalized_categories and spec_category not in normalized_categories:
            continue
        values.append(spec.get('spec_value') or spec.get('value'))

    return unique_values(values)[:limit]

def format_price(value):
    """Định dạng giá VND ngắn gọn."""
    if value is None:
        return ''
    try:
        return f"{int(float(value)):,}".replace(',', '.') + 'đ'
    except (TypeError, ValueError):
        return ''

def parse_sort_order(value, fallback):
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback

def normalize_specifications(specifications):
    """Normalize crawler spec shapes into rows matching product_specifications."""
    rows = []
    seen = set()

    def add_row(key, value, category='', sort_order=None):
        key_text = clean_text(key)[:120]
        value_text = clean_text(value)[:500]
        category_text = clean_text(category)[:60]
        if not key_text or not value_text:
            return

        dedupe_key = (category_text.lower(), key_text.lower())
        if dedupe_key in seen:
            return
        seen.add(dedupe_key)

        rows.append({
            'spec_key': key_text,
            'spec_value': value_text,
            'spec_category': category_text or None,
            'sort_order': parse_sort_order(sort_order, len(rows)),
        })

    def has_spec_fields(item):
        return any(field in item for field in ('spec_key', 'key', 'name', 'label', 'spec_value', 'value'))

    def consume(item, fallback_order=None, inherited_category=''):
        if isinstance(item, dict):
            category = clean_text(item.get('spec_category') or item.get('category') or inherited_category)
            nested_specs = item.get('specifications') or item.get('specs')

            if isinstance(nested_specs, dict):
                for sub_key, sub_value in nested_specs.items():
                    add_row(sub_key, sub_value, category, len(rows))
                return

            if isinstance(nested_specs, list):
                for nested_item in nested_specs:
                    consume(nested_item, len(rows), category)
                return

            key = item.get('spec_key') or item.get('key') or item.get('name') or item.get('label')
            value = item.get('spec_value') if 'spec_value' in item else item.get('value')
            add_row(key, value, category, item.get('sort_order', fallback_order))
            return

        if isinstance(item, (list, tuple)) and len(item) >= 2:
            add_row(item[0], item[1], inherited_category, fallback_order)

    if isinstance(specifications, dict):
        if has_spec_fields(specifications):
            consume(specifications, 0)
        else:
            for key, value in specifications.items():
                if isinstance(value, dict) and not has_spec_fields(value):
                    for sub_key, sub_value in value.items():
                        add_row(sub_key, sub_value, key, len(rows))
                elif isinstance(value, list):
                    for item in value:
                        consume(item, len(rows), key)
                else:
                    add_row(key, value, '', len(rows))
    elif isinstance(specifications, list):
        for index, spec in enumerate(specifications):
            consume(spec, index)

    rows.sort(key=lambda row: row['sort_order'])
    return rows

def get_variant_summary(variants):
    """Lấy RAM, bộ nhớ, màu sắc và giá thấp nhất từ variants."""
    ram_values = []
    storage_values = []
    color_values = []
    prices = []

    for variant in variants or []:
        ram_gb = variant.get('ram_gb')
        if ram_gb:
            ram_values.append(f"{ram_gb} GB")

        storage_label = clean_text(variant.get('storage_label'))
        storage_gb = variant.get('storage_gb')
        if storage_label:
            storage_values.append(storage_label)
        elif storage_gb:
            storage_values.append(f"{storage_gb} GB")

        color_values.append(variant.get('color'))

        price = variant.get('price')
        if price is not None:
            try:
                prices.append(float(price))
            except (TypeError, ValueError):
                pass

    return {
        'ram': unique_values(ram_values),
        'storage': unique_values(storage_values),
        'colors': unique_values(color_values),
        'min_price': min(prices) if prices else None,
    }

def generate_short_description(product_data):
    """Sinh short_description khi dữ liệu crawl chưa có."""
    info = product_data.get('product_info') or {}
    existing_short_desc = clean_text(info.get('short_description'))
    if existing_short_desc:
        return existing_short_desc

    name = clean_text(info.get('name') or info.get('base_name'))
    category_name = clean_text(product_data.get('category_name')).lower()
    specifications = product_data.get('specifications') or []
    variant_summary = get_variant_summary(product_data.get('variants') or [])

    ram = get_spec_value(specifications, ['RAM']) or ', '.join(variant_summary['ram'][:2])
    storage = get_spec_value(specifications, ['Dung lượng (ROM)', 'ROM']) or ', '.join(variant_summary['storage'][:3])
    screen_size = get_spec_value(specifications, ['Kích thước màn hình'], ['Màn hình'])
    screen_tech = get_spec_value(specifications, ['Công nghệ màn hình', 'Chuẩn màn hình'], ['Màn hình'])
    refresh_rate = get_spec_value(specifications, ['Tần số quét'], ['Màn hình'])
    chip = get_spec_value(specifications, ['Phiên bản CPU', 'CPU', 'Chipset'], ['Bộ xử lý'])
    battery = get_spec_value(specifications, ['Dung lượng pin'], ['Thông tin pin & sạc'])
    rear_cameras = get_spec_values(specifications, ['Resolution', 'Độ phân giải'], ['Camera sau'], limit=3)
    selfie_camera = get_spec_value(specifications, ['Resolution camera 1', 'Độ phân giải'], ['Camera Selfie'])
    network = get_spec_value(specifications, ['Hỗ trợ mạng'], ['Giao tiếp và kết nối'])
    water_resistance = get_spec_value(specifications, ['Chuẩn kháng nước / Bụi bẩn'], ['Thiết kế & Trọng lượng'])
    warranty = info.get('warranty_months') or get_spec_value(specifications, ['Thời gian bảo hành'])
    min_price = format_price(variant_summary['min_price'])

    highlights = []
    if screen_size or screen_tech or refresh_rate:
        screen_parts = [screen_size, screen_tech, refresh_rate]
        highlights.append('màn hình ' + ', '.join(unique_values(screen_parts)))
    if chip:
        highlights.append(f"chip {chip}")
    if ram:
        highlights.append(f"RAM {ram}")
    if storage:
        highlights.append(f"bộ nhớ {storage}")
    if rear_cameras:
        highlights.append(f"camera sau {' + '.join(rear_cameras)}")
    if selfie_camera:
        highlights.append(f"camera selfie {selfie_camera}")
    if battery:
        highlights.append(f"pin {battery}")
    if water_resistance:
        highlights.append(f"kháng nước/bụi {water_resistance}")
    if network:
        highlights.append(f"hỗ trợ {network}")

    product_label = 'Điện thoại' if 'điện thoại' in category_name or not category_name else product_data.get('category_name')
    intro = f"{product_label} {name}".strip() if name else clean_text(product_label)

    if highlights:
        description = f"{intro} nổi bật với " + ', '.join(highlights[:7]) + '.'
    else:
        detail_text = strip_html(info.get('detail_description'))
        if detail_text:
            return detail_text[:350].rstrip()
        description = f"Thông tin sản phẩm {name} đang được cập nhật." if name else "Thông tin sản phẩm đang được cập nhật."

    colors = ', '.join(variant_summary['colors'][:4])
    extra_parts = []
    if colors:
        extra_parts.append(f"có các màu {colors}")
    if min_price:
        extra_parts.append(f"giá từ {min_price}")
    if warranty:
        warranty_text = f"{warranty} tháng" if isinstance(warranty, int) else clean_text(warranty)
        extra_parts.append(f"bảo hành {warranty_text}")

    if extra_parts:
        description += ' Sản phẩm ' + ', '.join(extra_parts) + '.'

    return description

def create_database_and_tables():
    """Tạo database và các bảng cần thiết"""
    conn = mysql.connector.connect(
        host=DB_CONFIG['host'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        charset='utf8mb4',
        collation='utf8mb4_unicode_ci'
    )
    cursor = conn.cursor()
    
    # Tạo database
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    cursor.execute(f"USE {DB_CONFIG['database']}")
    
    # Tạo bảng brands (nếu đã tồn tại thì ALTER để thêm default)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS brands (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            slug VARCHAR(160) NOT NULL,
            logo_url VARCHAR(500) NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            sort_order INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_brands_name (name),
            UNIQUE KEY uk_brands_slug (slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    # Sửa lỗi sort_order không có default value
    try:
        cursor.execute("ALTER TABLE brands MODIFY COLUMN sort_order INT NOT NULL DEFAULT 0")
    except:
        pass
    
    # Tạo bảng categories
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            parent_id BIGINT UNSIGNED NULL,
            name VARCHAR(120) NOT NULL,
            slug VARCHAR(160) NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_categories_slug (slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    # Thêm sort_order nếu chưa có
    try:
        cursor.execute("ALTER TABLE categories ADD COLUMN sort_order INT NOT NULL DEFAULT 0")
    except:
        pass
    
    # Tạo bảng products
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            brand_id BIGINT UNSIGNED NOT NULL,
            series_id BIGINT UNSIGNED NULL,
            category_id BIGINT UNSIGNED NOT NULL,
            created_by BIGINT UNSIGNED NULL,
            name VARCHAR(255) NOT NULL,
            base_name VARCHAR(255) NOT NULL,
            slug VARCHAR(300) NOT NULL,
            short_description MEDIUMTEXT NOT NULL,
            detail_description MEDIUMTEXT NOT NULL,
            thumbnail_url VARCHAR(500) NULL,
            sale INT NOT NULL DEFAULT 0,
            warranty_months INT UNSIGNED NOT NULL DEFAULT 12,
            status ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'DISCONTINUED') NOT NULL DEFAULT 'DRAFT',
            is_featured BOOLEAN NOT NULL DEFAULT FALSE,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at DATETIME NULL,
            UNIQUE KEY uk_products_slug (slug),
            FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    
    # Tạo bảng product_variants
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS product_variants (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            product_id BIGINT UNSIGNED NOT NULL,
            sku VARCHAR(120) NOT NULL,
            color VARCHAR(80) NOT NULL,
            ram_gb INT UNSIGNED NULL,
            storage_label VARCHAR(40) NULL,
            storage_gb INT UNSIGNED NULL,
            price DECIMAL(15,2) NOT NULL,
            compare_at_price DECIMAL(15,2) NULL,
            cost_price DECIMAL(15,2) NULL,
            weight_gram INT UNSIGNED NULL,
            barcode VARCHAR(120) NULL,
            color_image_url VARCHAR(500) NULL,
            slug VARCHAR(300) NULL,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at DATETIME NULL,
            UNIQUE KEY uk_product_variants_sku (sku),
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    
    # Tạo bảng product_images
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS product_images (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            product_id BIGINT UNSIGNED NOT NULL,
            variant_id BIGINT UNSIGNED NULL,
            image_url VARCHAR(500) NOT NULL,
            is_primary BOOLEAN NOT NULL DEFAULT FALSE,
            sort_order INT UNSIGNED NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    
    # Tạo bảng product_specifications
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS product_specifications (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            product_id BIGINT UNSIGNED NOT NULL,
            spec_key VARCHAR(120) NOT NULL,
            spec_value VARCHAR(500) NOT NULL,
            spec_category VARCHAR(60) NULL,
            sort_order INT UNSIGNED NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    
    # Tạo bảng inventories
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inventories (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            variant_id BIGINT UNSIGNED NOT NULL,
            quantity_on_hand INT NOT NULL DEFAULT 100,
            quantity_reserved INT NOT NULL DEFAULT 0,
            reorder_level INT NOT NULL DEFAULT 5,
            stock_status ENUM('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK') NOT NULL DEFAULT 'IN_STOCK',
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at DATETIME NULL,
            UNIQUE KEY uk_inventories_variant (variant_id),
            FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    
    conn.commit()
    cursor.close()
    conn.close()
    print("[OK] Database và tables đã được tạo/thiết lập")

def get_db_connection():
    """Kết nối đến database"""
    return mysql.connector.connect(**DB_CONFIG)

def insert_brand(conn, brand_name, logo_url=None):
    """Insert hoặc lấy brand ID"""
    cursor = conn.cursor()
    slug = slugify(brand_name)
    logo_url = clean_text(logo_url) or None
    
    # Kiểm tra brand đã tồn tại
    cursor.execute("SELECT id, logo_url FROM brands WHERE name = %s", (brand_name,))
    result = cursor.fetchone()
    if result:
        brand_id, existing_logo_url = result
        if logo_url and not clean_text(existing_logo_url):
            cursor.execute("""
                UPDATE brands
                SET logo_url = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (logo_url, brand_id))
            conn.commit()
        cursor.close()
        return brand_id
    
    # Insert brand mới
    cursor.execute(
        "INSERT INTO brands (name, slug, logo_url, is_active) VALUES (%s, %s, %s, TRUE)",
        (brand_name, slug, logo_url)
    )
    conn.commit()
    brand_id = cursor.lastrowid
    cursor.close()
    return brand_id

def insert_category(conn, category_name):
    """Insert hoặc lấy category ID"""
    cursor = conn.cursor()
    slug = slugify(category_name)
    
    # Kiểm tra category đã tồn tại
    cursor.execute("SELECT id FROM categories WHERE name = %s", (category_name,))
    result = cursor.fetchone()
    if result:
        cursor.close()
        return result[0]
    
    # Insert category mới
    cursor.execute(
        "INSERT INTO categories (name, slug, is_active) VALUES (%s, %s, TRUE)",
        (category_name, slug)
    )
    conn.commit()
    category_id = cursor.lastrowid
    cursor.close()
    return category_id

def insert_product(conn, product_data, brand_id, category_id):
    """Insert product và trả về product_id"""
    cursor = conn.cursor()
    
    info = product_data.get('product_info', {})
    name = info.get('name', '')
    base_name = info.get('base_name', name)
    slug = slugify(name)
    
    # Xử lý short_description và detail_description
    short_desc = generate_short_description(product_data)
    detail_desc = info.get('detail_description') or ''
    
    # Handle status - chuyển đổi từ JSON format sang DB format
    status = info.get('status', 'ACTIVE')
    if status == 'ACTIVE':
        db_status = 'ACTIVE'
    elif status == 'DRAFT':
        db_status = 'DRAFT'
    elif status == 'DISCONTINUED':
        db_status = 'DISCONTINUED'
    else:
        db_status = 'ACTIVE'
    
    # Kiểm tra product đã tồn tại (theo slug)
    cursor.execute("SELECT id, short_description FROM products WHERE slug = %s", (slug,))
    result = cursor.fetchone()
    if result:
        product_id, existing_short_desc = result
        if not clean_text(existing_short_desc) and short_desc:
            cursor.execute("""
                UPDATE products
                SET short_description = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (short_desc, product_id))
            conn.commit()
        cursor.close()
        return product_id
    
    # Insert product
    cursor.execute("""
        INSERT INTO products (
            brand_id, category_id, name, base_name, slug,
            short_description, detail_description, thumbnail_url,
            warranty_months, status, is_featured
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        brand_id, category_id, name, base_name, slug,
        short_desc, detail_desc, info.get('thumbnail_url'),
        info.get('warranty_months', 12), db_status, info.get('is_featured', False)
    ))
    conn.commit()
    product_id = cursor.lastrowid
    cursor.close()
    return product_id

def insert_variant(conn, product_id, variant_data):
    """Insert variant và trả về variant_id"""
    cursor = conn.cursor()
    
    # Tạo SKU tự động nếu null
    sku = variant_data.get('sku')
    if not sku:
        sku = f"SKU-{product_id}-{variant_data.get('color', '')}-{variant_data.get('storage_gb', '')}"
        sku = slugify(sku).replace('-', '').upper()
    
    # Kiểm tra variant đã tồn tại
    cursor.execute("SELECT id FROM product_variants WHERE sku = %s", (sku,))
    result = cursor.fetchone()
    if result:
        cursor.close()
        return result[0]
    
    # Tạo slug cho variant
    color = variant_data.get('color', '')
    storage = variant_data.get('storage_label', '')
    variant_slug = f"{product_id}-{slugify(color)}-{storage}".replace('-', '')
    
    # Xử lý giá: price = compare_at_price, cost_price = price / 2
    compare_at_price = variant_data.get('compare_at_price')
    original_price = variant_data.get('price')
    
    # Lấy giá: ưu tiên compare_at_price, nếu null thì lấy price, nếu null thì = 0
    if compare_at_price is not None:
        price = compare_at_price
    elif original_price is not None:
        price = original_price
    else:
        price = 0  # Giá mặc định nếu không có
    
    cost_price = round(price / 2, 2) if price else 0
    
    # Insert variant (KHÔNG insert compare_at_price)
    cursor.execute("""
        INSERT INTO product_variants (
            product_id, sku, color, ram_gb, storage_label, storage_gb,
            price, cost_price, weight_gram, barcode, color_image_url,
            slug, is_active
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
    """, (
        product_id, sku, color, variant_data.get('ram_gb'),
        variant_data.get('storage_label'), variant_data.get('storage_gb'),
        price, cost_price, variant_data.get('weight_gram'),
        variant_data.get('barcode'), variant_data.get('color_image_url'),
        variant_slug
    ))
    conn.commit()
    variant_id = cursor.lastrowid
    
    # Kiểm tra và insert images
    for img in variant_data.get('images', []):
        try:
            cursor.execute("""
                INSERT INTO product_images (product_id, variant_id, image_url, is_primary, sort_order)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                product_id, variant_id, img.get('image_url'),
                img.get('is_primary', False), img.get('sort_order', 0)
            ))
        except:
            pass  # Bỏ qua nếu image đã tồn tại
    conn.commit()
    
    # Kiểm tra và insert inventory
    try:
        cursor.execute("""
            INSERT INTO inventories (variant_id, quantity_on_hand, stock_status)
            VALUES (%s, 100, 'IN_STOCK')
        """, (variant_id,))
        conn.commit()
    except:
        pass  # Bỏ qua nếu inventory đã tồn tại
    
    cursor.close()
    return variant_id

def insert_specifications(conn, product_id, specifications):
    """Insert specifications cho product"""
    rows = normalize_specifications(specifications)
    if not rows:
        return
    
    cursor = conn.cursor()
    cursor.execute("DELETE FROM product_specifications WHERE product_id = %s", (product_id,))
    for i, spec in enumerate(rows):
        cursor.execute("""
            INSERT INTO product_specifications (product_id, spec_key, spec_value, spec_category, sort_order)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            product_id,
            spec['spec_key'],
            spec['spec_value'],
            spec.get('spec_category'),
            spec.get('sort_order', i)
        ))
    conn.commit()
    cursor.close()

def load_products_from_json(json_path=JSON_PATH):
    """Đọc danh sách sản phẩm từ file JSON crawl."""
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_brand_logo_map(json_path=BRANDS_PATH):
    """Đọc brands.json và trả về map slug -> logo_url."""
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            brands = json.load(f)
    except FileNotFoundError:
        return {}

    logo_map = {}
    for brand in brands:
        brand_name = clean_text(brand.get('brand_name') or brand.get('name'))
        brand_slug = clean_text(brand.get('slug')) or slugify(brand_name)
        logo_url = clean_text(brand.get('brand_logo_url') or brand.get('logo_url'))
        if not logo_url:
            continue

        if brand_slug:
            logo_map[brand_slug] = logo_url
        if brand_name:
            logo_map[slugify(brand_name)] = logo_url

    # Tên brand trong products_data_final.json khác tên hiển thị ở brands.json.
    aliases = {
        'iphone': 'apple',
        'honor': 'honor',
        'oppo': 'oppo',
        'nubia': 'nubia-zte',
    }
    for alias, target in aliases.items():
        if target in logo_map:
            logo_map[alias] = logo_map[target]

    return logo_map

def backfill_short_descriptions(overwrite=False):
    """Sinh và cập nhật short_description cho products đã có trong database."""
    print("[INFO] Bắt đầu backfill short_description...")

    conn = get_db_connection()
    cursor = conn.cursor()
    products = load_products_from_json()

    stats = {
        'updated': 0,
        'already_has_description': 0,
        'missing_product': 0,
        'skipped': 0,
    }

    for product in products:
        info = product.get('product_info') or {}
        name = clean_text(info.get('name'))
        slug = slugify(name)
        short_desc = generate_short_description(product)

        if not slug or not short_desc:
            stats['skipped'] += 1
            continue

        if overwrite:
            cursor.execute("""
                UPDATE products
                SET short_description = %s, updated_at = CURRENT_TIMESTAMP
                WHERE slug = %s
            """, (short_desc, slug))
        else:
            cursor.execute("""
                UPDATE products
                SET short_description = %s, updated_at = CURRENT_TIMESTAMP
                WHERE slug = %s
                  AND (short_description IS NULL OR TRIM(short_description) = '')
            """, (short_desc, slug))

        if cursor.rowcount:
            stats['updated'] += cursor.rowcount
            continue

        cursor.execute("SELECT short_description FROM products WHERE slug = %s", (slug,))
        result = cursor.fetchone()
        if result:
            stats['already_has_description'] += 1
        else:
            stats['missing_product'] += 1

    conn.commit()
    cursor.close()
    conn.close()

    print("\n" + "="*50)
    print("THỐNG KÊ BACKFILL SHORT_DESCRIPTION:")
    print(f"  - Products đã cập nhật: {stats['updated']}")
    print(f"  - Products đã có mô tả: {stats['already_has_description']}")
    print(f"  - Products không tìm thấy trong DB: {stats['missing_product']}")
    print(f"  - Products bị bỏ qua: {stats['skipped']}")
    print("="*50)
    print("[SUCCESS] Backfill short_description hoàn tất!")

def backfill_brand_logos(overwrite=False):
    """Cập nhật brands.logo_url từ scraper/scrap_py/brands.json."""
    print("[INFO] Bắt đầu backfill brand logo_url...")

    logo_map = load_brand_logo_map()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, slug, logo_url FROM brands")
    brands = cursor.fetchall()

    stats = {
        'updated': 0,
        'already_has_logo': 0,
        'missing_logo': 0,
    }
    missing_brands = []

    for brand_id, name, slug, existing_logo_url in brands:
        logo_url = logo_map.get(clean_text(slug)) or logo_map.get(slugify(name))
        if not logo_url:
            stats['missing_logo'] += 1
            missing_brands.append(name)
            continue

        if not overwrite and clean_text(existing_logo_url):
            stats['already_has_logo'] += 1
            continue

        cursor.execute("""
            UPDATE brands
            SET logo_url = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (logo_url, brand_id))
        stats['updated'] += cursor.rowcount

    conn.commit()
    cursor.close()
    conn.close()

    print("\n" + "="*50)
    print("THỐNG KÊ BACKFILL BRAND LOGO:")
    print(f"  - Brands đã cập nhật logo_url: {stats['updated']}")
    print(f"  - Brands đã có logo_url: {stats['already_has_logo']}")
    print(f"  - Brands không tìm thấy logo trong JSON: {stats['missing_logo']}")
    if missing_brands:
        print(f"  - Thiếu logo: {', '.join(missing_brands)}")
    print("="*50)
    print("[SUCCESS] Backfill brand logo_url hoàn tất!")

def backfill_specifications(overwrite=False):
    """Cap nhat product_specifications tu products_data_final.json cho products da co."""
    print("[INFO] Bat dau backfill product specifications...")

    conn = get_db_connection()
    cursor = conn.cursor()
    products = load_products_from_json()

    stats = {
        'products_updated': 0,
        'specs_inserted': 0,
        'already_has_specs': 0,
        'missing_product': 0,
        'skipped': 0,
    }

    for product in products:
        info = product.get('product_info') or {}
        name = clean_text(info.get('name'))
        slug = slugify(name)
        rows = normalize_specifications(product.get('specifications'))

        if not slug or not rows:
            stats['skipped'] += 1
            continue

        cursor.execute("SELECT id FROM products WHERE slug = %s", (slug,))
        result = cursor.fetchone()
        if not result:
            stats['missing_product'] += 1
            continue

        product_id = result[0]
        if not overwrite:
            cursor.execute("""
                SELECT COUNT(*)
                FROM product_specifications
                WHERE product_id = %s
                  AND TRIM(COALESCE(spec_key, '')) <> ''
                  AND TRIM(COALESCE(spec_value, '')) <> ''
            """, (product_id,))
            existing_count = cursor.fetchone()[0]
            if existing_count:
                stats['already_has_specs'] += 1
                continue

        cursor.execute("DELETE FROM product_specifications WHERE product_id = %s", (product_id,))
        for index, row in enumerate(rows):
            cursor.execute("""
                INSERT INTO product_specifications (product_id, spec_key, spec_value, spec_category, sort_order)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                product_id,
                row['spec_key'],
                row['spec_value'],
                row.get('spec_category'),
                row.get('sort_order', index),
            ))
        stats['products_updated'] += 1
        stats['specs_inserted'] += len(rows)

    conn.commit()
    cursor.close()
    conn.close()

    print("\n" + "="*50)
    print("THONG KE BACKFILL SPECIFICATIONS:")
    print(f"  - Products da cap nhat thong so: {stats['products_updated']}")
    print(f"  - Specifications da insert: {stats['specs_inserted']}")
    print(f"  - Products da co thong so: {stats['already_has_specs']}")
    print(f"  - Products khong tim thay trong DB: {stats['missing_product']}")
    print(f"  - Products bi bo qua: {stats['skipped']}")
    print("="*50)
    print("[SUCCESS] Backfill specifications hoan tat!")

def import_products():
    """Hàm chính để import dữ liệu"""
    print("[INFO] Bắt đầu import dữ liệu...")
    
    # Tạo database và tables
    create_database_and_tables()
    
    # Kết nối database
    conn = get_db_connection()
    
    # Đọc file JSON
    products = load_products_from_json()
    brand_logo_map = load_brand_logo_map()
    
    print(f"[INFO] Đọc được {len(products)} sản phẩm từ JSON")
    
    # Thống kê
    stats = {
        'brands': set(),
        'categories': set(),
        'products': 0,
        'variants': 0,
        'images': 0,
        'specs': 0
    }
    
    # Xử lý từng sản phẩm
    for idx, product in enumerate(products):
        try:
            # Insert/update brand
            brand_name = product.get('brand_name')
            if brand_name:
                brand_logo_url = brand_logo_map.get(slugify(brand_name))
                brand_id = insert_brand(conn, brand_name, brand_logo_url)
                stats['brands'].add(brand_name)
            else:
                continue
            
            # Insert/update category
            category_name = product.get('category_name')
            if category_name:
                category_id = insert_category(conn, category_name)
                stats['categories'].add(category_name)
            else:
                continue
            
            # Insert product
            product_id = insert_product(conn, product, brand_id, category_id)
            stats['products'] += 1
            
            # Insert variants
            for variant in product.get('variants', []):
                variant_id = insert_variant(conn, product_id, variant)
                stats['variants'] += 1
                stats['images'] += len(variant.get('images', []))
            
            # Insert specifications
            specs = normalize_specifications(product.get('specifications', []))
            if specs:
                insert_specifications(conn, product_id, specs)
                stats['specs'] += len(specs)
            
            # Log tiến trình
            if (idx + 1) % 10 == 0:
                print(f"[INFO] Đã xử lý {idx + 1}/{len(products)} sản phẩm...")
                
        except Error as e:
            print(f"[ERROR] Lỗi khi xử lý sản phẩm {idx}: {e}")
            continue
    
    # Đóng kết nối
    conn.close()
    
    # In thống kê
    print("\n" + "="*50)
    print("THỐNG KÊ IMPORT:")
    print(f"  - Brands mới: {len(stats['brands'])}")
    print(f"  - Categories mới: {len(stats['categories'])}")
    print(f"  - Products đã insert: {stats['products']}")
    print(f"  - Variants đã insert: {stats['variants']}")
    print(f"  - Images đã insert: {stats['images']}")
    print(f"  - Specifications đã insert: {stats['specs']}")
    print("="*50)
    print("[SUCCESS] Import hoàn tất!")

if __name__ == '__main__':
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    import json
    import mysql.connector
    from mysql.connector import Error
    
    import re
    from datetime import datetime
    
    if '--backfill-brand-logos' in sys.argv or '--backfill-brand-logo' in sys.argv:
        backfill_brand_logos(overwrite='--overwrite-brand-logo' in sys.argv)
    elif '--backfill-short-description' in sys.argv or '--backfill-short-descriptions' in sys.argv:
        backfill_short_descriptions(overwrite='--overwrite-short-description' in sys.argv)
    elif '--backfill-specifications' in sys.argv or '--backfill-specs' in sys.argv:
        backfill_specifications(overwrite='--overwrite-specifications' in sys.argv or '--overwrite-specs' in sys.argv)
    else:
        # Chạy import
        import_products()
