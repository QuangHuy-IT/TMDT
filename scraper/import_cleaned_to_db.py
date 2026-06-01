import json
import mysql.connector
from mysql.connector import Error
import re
from datetime import datetime

# Database Configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '123456',
    'database': 'phone_store',
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}

JSON_PATH = 'scraper/scrap_py/products_data_final_cleaned.json'

def slugify(text):
    """Generate slug from Vietnamese text"""
    if not text:
        return ''
    text = text.lower().strip()
    # Basic Vietnamese character replacement
    replacements = {
        'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a', 'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a', 'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e', 'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o', 'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o', 'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u', 'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
        'đ': 'd'
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

def clean_text(value):
    if value is None:
        return ''
    return str(value).strip()

def clear_database(conn):
    """Clear existing data from specified tables"""
    print("[INFO] Clearing existing data...")
    cursor = conn.cursor()
    
    # Disable foreign key checks to allow truncation
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    
    tables_to_clear = [
        'product_specifications',
        'product_images',
        'product_variants',
        'product_discounts',
        'inventories',
        'products',
        'product_series',
        'categories',
        'brands'
    ]
    
    for table in tables_to_clear:
        try:
            print(f"  - Truncating table: {table}")
            cursor.execute(f"TRUNCATE TABLE {table}")
        except Error as e:
            print(f"  [WARNING] Could not truncate {table}: {e}")
            
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    conn.commit()
    cursor.close()
    print("[OK] Database cleared.")

def get_or_create_brand(conn, brand_name):
    cursor = conn.cursor()
    slug = slugify(brand_name)
    cursor.execute("SELECT id FROM brands WHERE name = %s", (brand_name,))
    result = cursor.fetchone()
    if result:
        cursor.close()
        return result[0]
    
    now = datetime.now()
    cursor.execute("INSERT INTO brands (name, slug, is_active, sort_order, created_at, updated_at) VALUES (%s, %s, TRUE, 0, %s, %s)", (brand_name, slug, now, now))
    conn.commit()
    brand_id = cursor.lastrowid
    cursor.close()
    return brand_id

def get_or_create_series(conn, series_name, brand_id):
    if not series_name:
        return None
    cursor = conn.cursor()
    slug = slugify(series_name)
    cursor.execute("SELECT id FROM product_series WHERE name = %s AND brand_id = %s", (series_name, brand_id))
    result = cursor.fetchone()
    if result:
        cursor.close()
        return result[0]
    
    now = datetime.now()
    cursor.execute("INSERT INTO product_series (name, slug, brand_id, is_active, sort_order, created_at, updated_at) VALUES (%s, %s, %s, TRUE, 0, %s, %s)", (series_name, slug, brand_id, now, now))
    conn.commit()
    series_id = cursor.lastrowid
    cursor.close()
    return series_id

def get_or_create_category(conn, category_name):
    cursor = conn.cursor()
    slug = slugify(category_name)
    cursor.execute("SELECT id FROM categories WHERE name = %s", (category_name,))
    result = cursor.fetchone()
    if result:
        cursor.close()
        return result[0]
    
    now = datetime.now()
    cursor.execute("INSERT INTO categories (name, slug, is_active, created_at, updated_at) VALUES (%s, %s, TRUE, %s, %s)", (category_name, slug, now, now))
    conn.commit()
    category_id = cursor.lastrowid
    cursor.close()
    return category_id

def insert_product(conn, product_data, brand_id, series_id, category_id):
    cursor = conn.cursor()
    info = product_data.get('product_info', {})
    name = info.get('name')
    base_name = info.get('base_name', name)
    slug = info.get('slug') or slugify(name)
    
    # Check if slug already exists
    cursor.execute("SELECT id FROM products WHERE slug = %s", (slug,))
    if cursor.fetchone():
        cursor.close()
        # print(f"  [WARNING] Product slug {slug} already exists. Skipping product.")
        return None

    created_at = info.get('created_at')
    if created_at:
        try:
            created_at = datetime.strptime(created_at, '%Y-%m-%d %H:%M:%S')
        except:
            created_at = datetime.now()
    else:
        created_at = datetime.now()
    
    now = datetime.now()
    
    cursor.execute("""
        INSERT INTO products (
            brand_id, series_id, category_id, name, base_name, slug,
            short_description, detail_description, thumbnail_url,
            sale, warranty_months, status, is_featured, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        brand_id, series_id, category_id, name, base_name, slug,
        info.get('short_description', ''), info.get('detail_description', ''),
        info.get('thumbnail_url'), info.get('sale', 0),
        info.get('warranty_months', 12), info.get('status', 'ACTIVE'),
        info.get('is_featured', False), created_at, now
    ))
    conn.commit()
    product_id = cursor.lastrowid
    cursor.close()
    return product_id

def insert_variant(conn, product_id, variant_data):
    cursor = conn.cursor()
    sku = variant_data.get('sku')
    
    # Check if SKU already exists
    cursor.execute("SELECT id FROM product_variants WHERE sku = %s", (sku,))
    if cursor.fetchone():
        cursor.close()
        # print(f"  [WARNING] SKU {sku} already exists. Skipping variant.")
        return None

    now = datetime.now()
    
    cursor.execute("""
        INSERT INTO product_variants (
            product_id, sku, color, ram_gb, storage_label, storage_gb,
            price, cost_price, weight_gram, barcode, color_image_url,
            slug, is_active, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE, %s, %s)
    """, (
        product_id, sku, variant_data.get('color'),
        variant_data.get('ram_gb'), variant_data.get('storage_label'),
        variant_data.get('storage_gb'), variant_data.get('price'),
        variant_data.get('cost_price'), variant_data.get('weight_gram'),
        variant_data.get('barcode'), variant_data.get('color_image_url'),
        variant_data.get('slug'), now, now
    ))
    conn.commit()
    variant_id = cursor.lastrowid
    
    # Insert images for this variant
    for img in variant_data.get('images', []):
        cursor.execute("""
            INSERT INTO product_images (product_id, variant_id, image_url, is_primary, sort_order, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            product_id, variant_id, img.get('image_url'),
            img.get('is_primary', False), img.get('sort_order', 0), now
        ))
    
    # Insert inventory record
    cursor.execute("""
        INSERT INTO inventories (variant_id, quantity_on_hand, stock_status, updated_at)
        VALUES (%s, 100, 'IN_STOCK', %s)
    """, (variant_id, now))
    
    # Insert product discount if exists
    discount = variant_data.get('discount')
    if discount and discount.get('discount_percent'):
        cursor.execute("""
            INSERT INTO product_discounts (
                variant_id, discount_percent, discount_amount, discount_type,
                start_at, end_at, is_active, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, TRUE, %s, %s)
        """, (
            variant_id, discount.get('discount_percent'),
            discount.get('discount_amount'), discount.get('discount_type'),
            datetime.now(), datetime(2030, 12, 31), now, now
        ))
    
    conn.commit()
    cursor.close()
    return variant_id

def insert_specifications(conn, product_id, specifications):
    if not specifications:
        return
    cursor = conn.cursor()
    now = datetime.now()
    for spec in specifications:
        cursor.execute("""
            INSERT INTO product_specifications (product_id, spec_key, spec_value, spec_category, sort_order, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            product_id, spec.get('spec_key'), spec.get('spec_value'),
            spec.get('spec_category'), spec.get('sort_order', 0), now, now
        ))
    conn.commit()
    cursor.close()

def main():
    print("[INFO] Starting import process...")
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        if not conn.is_connected():
            print("[ERROR] Could not connect to database.")
            return

        # Step 1: Clear database
        clear_database(conn)

        # Step 2: Load JSON data
        print(f"[INFO] Loading data from {JSON_PATH}...")
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            products_data = json.load(f)
        
        print(f"[INFO] Loaded {len(products_data)} products.")

        # Step 3: Import data
        for idx, item in enumerate(products_data):
            brand_name = item.get('brand_name')
            series_name = item.get('series_name')
            category_name = item.get('category_name')
            
            brand_id = get_or_create_brand(conn, brand_name)
            series_id = get_or_create_series(conn, series_name, brand_id)
            category_id = get_or_create_category(conn, category_name)
            
            product_id = insert_product(conn, item, brand_id, series_id, category_id)
            
            if product_id:
                # Import variants
                for variant in item.get('variants', []):
                    insert_variant(conn, product_id, variant)
                    
                # Import specifications
                insert_specifications(conn, product_id, item.get('specifications', []))
            
            if (idx + 1) % 10 == 0:
                print(f"  - Processed {idx + 1}/{len(products_data)} products...")

        print("[SUCCESS] Data import completed successfully.")

    except Error as e:
        print(f"[ERROR] Database error: {e}")
    except FileNotFoundError:
        print(f"[ERROR] File not found: {JSON_PATH}")
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

if __name__ == '__main__':
    main()
