import json
import random
from datetime import datetime, timedelta
import mysql.connector
import requests

# =====================================================================
# CẤU HÌNH DATABASE
# =====================================================================
db_config = {
    "host": "localhost",
    "port": 3306,
    "database": "phone_store",
    "user": "root",
    "password": "123456",
    "charset": "utf8mb4",
}

# Chuỗi BCrypt của mật khẩu mặc định "Abc@123456"
DEFAULT_PASSWORD_HASH = (
    "$2a$10$R7MbyUloUHTWfK4r6qlyGOxYofG7G/L8N/2AWDm26y6v1RlhF1Yp2"
)


# =====================================================================
# HÀM SINH NGÀY THÁNG NGẪU NHIÊN (Từ 01/01/2026 đến Hiện tại)
# =====================================================================
def generate_random_datetime(start_year=2026, start_month=1, start_day=1):
    start_date = datetime(start_year, start_month, start_day)
    end_date = datetime.now()

    # Tính tổng số giây chênh lệch giữa 2 mốc thời gian
    time_between = end_date - start_date
    seconds_between = int(time_between.total_seconds())

    # Lấy ngẫu nhiên một số giây trong khoảng đó và cộng vào start_date
    random_seconds = random.randint(0, seconds_between)
    random_date = start_date + timedelta(seconds=random_seconds)

    # Trả về đối tượng datetime để tái sử dụng logic tính updated_at
    return random_date


# =====================================================================
# HÀM BỔ TRỢ ĐỊA CHÍNH VÀ SỐ ĐIỆN THOẠI
# =====================================================================
def fetch_vietnam_locations():
    print("-> Đang tải danh sách Tỉnh/Thành, Quận/Huyện từ Open API...")
    try:
        response = requests.get(
            "https://provinces.open-api.vn/api/?depth=2", timeout=15
        )
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Không thể kết nối API Địa chính ({e}). Sử dụng dữ liệu mẫu.")

    return [
        {
            "name": "Thành phố Hà Nội",
            "districts": [{"name": "Quận Cầu Giấy"}, {"name": "Quận Đống Đa"}],
        },
        {
            "name": "Thành phố Hồ Chí Minh",
            "districts": [{"name": "Quận 1"}, {"name": "Quận Bình Thạnh"}],
        },
    ]


def generate_vn_phone():
    prefixes = ["090", "091", "098", "096", "097", "032", "035", "070", "077"]
    return random.choice(prefixes) + "".join(
        str(random.randint(0, 9)) for _ in range(7)
    )


# =====================================================================
# TIẾN HÀNH SINH DỮ LIỆU
# =====================================================================
try:
    geo_data = fetch_vietnam_locations()

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    print("-> Kết nối MySQL thành công. Bắt đầu sinh dữ liệu...")

    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    tables_to_clean = [
        "users",
        "user_addresses",
        "inventory_movements",
        "inventory_logs",
        "inventory_log_items",
        "wishlists",
        "wishlist_items",
        "vouchers",
        "orders",
        "pending_orders",
        "order_items",
        "order_status_histories",
        "voucher_usages",
        "reviews",
        "questions",
        "answers",
        "faqs",
        "flash_sale_campaigns",
        "flash_sale_sessions",
        "flash_sale_products",
    ]
    for table in tables_to_clean:
        cursor.execute(f"TRUNCATE TABLE {table};")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
    print("-> Đã dọn sạch dữ liệu cũ của các bảng liên quan.")

    cursor.execute("SELECT id FROM product_variants;")
    variant_ids = [int(row[0]) for row in cursor.fetchall()]

    cursor.execute("SELECT id FROM products;")
    product_ids = [int(row[0]) for row in cursor.fetchall()]

    if not variant_ids or not product_ids:
        print(
            "[CẢNH BÁO] Bảng `products` hoặc `product_variants` trống! Sử dụng ID giả lập."
        )
        variant_ids = list(range(1, 21))
        product_ids = list(range(1, 11))

    # -----------------------------------------------------------------
    # BẢNG: users (15 - 20 bản ghi)
    # -----------------------------------------------------------------
    num_users = random.randint(15, 20)
    user_ids = []
    first_names = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Phan", "Vũ", "Đặng"]
    middle_names = ["Văn", "Thị", "Minh", "Đức", "Anh", "Hồng", "Tuấn"]
    last_names = [
        "Hùng",
        "Dũng",
        "Hoa",
        "Lan",
        "Tuấn",
        "Linh",
        "Long",
        "Phượng",
        "Hải",
    ]

    for i in range(num_users):
        full_name = f"{random.choice(first_names)} {random.choice(middle_names)} {random.choice(last_names)}"
        email = f"user{i+1}_{random.randint(100,999)}@gmail.com"
        phone = generate_vn_phone()
        year_of_birth = random.randint(1985, 2005)
        role = "ADMIN" if i == 0 else "USER"

        prov_obj = random.choice(geo_data)
        province_name = prov_obj["name"]
        ward_name = (
            random.choice(prov_obj["districts"])["name"]
            if prov_obj["districts"]
            else "Phường Trung Tâm"
        )

        # RANDOM THỜI GIAN
        c_at = generate_random_datetime()
        u_at = c_at + timedelta(
            hours=random.randint(1, 48)
        )  # update sau 1-48 tiếng

        query = """
            INSERT INTO users (email, phone, year_of_birth, password_hash, full_name, role, status, province, district, ward, detail_address, enabled, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NULL, %s, %s, %s, %s, %s)
        """
        values = (
            email,
            phone,
            year_of_birth,
            DEFAULT_PASSWORD_HASH,
            full_name,
            role,
            "ACTIVE",
            province_name,
            ward_name,
            f"Số {random.randint(1, 150)} Đường Ngẫu Nhiên",
            True,
            c_at.strftime("%Y-%m-%d %H:%M:%S"),
            u_at.strftime("%Y-%m-%d %H:%M:%S"),
        )
        cursor.execute(query, values)
        user_ids.append(int(cursor.lastrowid))

    print(f"   + Đã sinh {len(user_ids)} người dùng với mốc thời gian ngẫu nhiên.")

    # -----------------------------------------------------------------
    # BẢNG: user_addresses
    # -----------------------------------------------------------------
    for u_id in user_ids:
        for j in range(random.randint(1, 2)):
            prov_obj = random.choice(geo_data)
            p_name = prov_obj["name"]
            dist_obj = (
                random.choice(prov_obj["districts"])
                if prov_obj["districts"]
                else {"name": "Quận Trung Tâm"}
            )
            d_name = dist_obj["name"]
            w_name = f"Phường của {d_name}"

            c_at = generate_random_datetime()
            u_at = c_at + timedelta(minutes=random.randint(5, 120))

            query = """
                INSERT INTO user_addresses (user_id, receiver_name, receiver_phone, province, district, ward, detail_address, is_default, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                u_id,
                f"Người nhận của User {u_id}",
                generate_vn_phone(),
                p_name,
                d_name,
                w_name,
                f"Ngõ {random.randint(10, 99)}, Nhà số {random.randint(1, 50)}",
                True if j == 0 else False,
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
                u_at.strftime("%Y-%m-%d %H:%M:%S"),
            )
            cursor.execute(query, values)

    # -----------------------------------------------------------------
    # BẢNG: inventory_movements (30 - 50)
    # -----------------------------------------------------------------
    num_movements = random.randint(30, 50)
    for _ in range(num_movements):
        c_at = generate_random_datetime()
        query = """
            INSERT INTO inventory_movements (variant_id, movement_type, quantity, reference_type, reference_id, note, created_by, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            random.choice(variant_ids),
            random.choice(["IMPORT", "EXPORT", "RESERVE", "RELEASE", "ADJUST"]),
            random.randint(1, 50),
            random.choice(["ORDER", "MANUAL", "IMPORT_NOTE"]),
            f"REF{random.randint(10000, 99999)}",
            "Mô tả biến động kho tự động",
            random.choice(user_ids),
            c_at.strftime("%Y-%m-%d %H:%M:%S"),
        )
        cursor.execute(query, values)

    # -----------------------------------------------------------------
    # BẢNG: inventory_logs & inventory_log_items (30 - 50)
    # -----------------------------------------------------------------
    num_logs = random.randint(30, 50)
    for k in range(num_logs):
        c_at = generate_random_datetime()
        query_log = """
            INSERT INTO inventory_logs (log_code, total_adjustments, total_products, note, created_by_name, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        log_code = f"LOG-2026-{k+1:03d}"
        cursor.execute(
            query_log,
            (
                log_code,
                random.randint(10, 100),
                2,
                "Phiên kiểm kho định kỳ",
                "Quản trị viên hệ thống",
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )
        log_id = int(cursor.lastrowid)

        for _ in range(2):
            query_item = """
                INSERT INTO inventory_log_items (inventory_log_id, product_id, product_name, variant_id, variant_name, sku, before_stock, after_stock, delta)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            v_id = random.choice(variant_ids)
            before = random.randint(20, 50)
            delta = random.randint(-5, 10)
            cursor.execute(
                query_item,
                (
                    log_id,
                    random.choice(product_ids),
                    "Điện thoại thông minh mẫu",
                    v_id,
                    "Màu Sắc / Dung Lượng Ngẫu Nhiên",
                    f"SKU-{v_id}-TEST",
                    before,
                    before + delta,
                    delta,
                ),
            )

    # -----------------------------------------------------------------
    # BẢNG: wishlists & wishlist_items (30 - 50)
    # -----------------------------------------------------------------
    wishlist_ids = []
    for u_id in user_ids:
        c_at = generate_random_datetime()
        u_at = c_at + timedelta(days=random.randint(1, 5))
        query = "INSERT INTO wishlists (user_id, created_at, updated_at) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE id=id;"
        cursor.execute(
            query,
            (
                u_id,
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
                u_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )
        cursor.execute("SELECT id FROM wishlists WHERE user_id = %s;", (u_id,))
        wishlist_ids.append(int(cursor.fetchone()[0]))

    num_wishlist_items = random.randint(30, 50)
    inserted_wish_items = 0
    while inserted_wish_items < num_wishlist_items:
        c_at = generate_random_datetime()
        query = "INSERT IGNORE INTO wishlist_items (wishlist_id, variant_id, created_at) VALUES (%s, %s, %s);"
        cursor.execute(
            query,
            (
                random.choice(wishlist_ids),
                random.choice(variant_ids),
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )
        if cursor.rowcount > 0:
            inserted_wish_items += 1

    # -----------------------------------------------------------------
    # BẢNG: vouchers (30 - 50)
    # -----------------------------------------------------------------
    num_vouchers = random.randint(30, 50)
    voucher_ids = []
    for m in range(num_vouchers):
        c_at = generate_random_datetime()
        u_at = c_at + timedelta(hours=random.randint(1, 24))

        query = """
            INSERT INTO vouchers (code, discount_type, discount_value, max_discount_amount, min_order_amount, start_at, end_at, usage_limit, used_count, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        v_code = f"SALE{random.randint(10,99)}{m:02d}"
        dtype = random.choice(["PERCENT", "FIXED"])
        dval = (
            random.randint(5, 15)
            if dtype == "PERCENT"
            else random.randint(50000, 200000)
        )

        cursor.execute(
            query,
            (
                v_code,
                dtype,
                dval,
                500000,
                200000,
                c_at,  # voucher bắt đầu có hiệu lực cùng lúc tạo
                c_at + timedelta(days=30),  # Hạn 30 ngày
                100,
                random.randint(0, 10),
                True,
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
                u_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )
        voucher_ids.append(int(cursor.lastrowid))

    # -----------------------------------------------------------------
    # BẢNG: orders, pending_orders, order_items & histories (30 - 50)
    # -----------------------------------------------------------------
    num_orders = random.randint(30, 50)
    order_ids = []
    for n in range(num_orders):
        c_at = generate_random_datetime()
        u_at = c_at + timedelta(days=random.randint(1, 3))

        order_code = f"ORD-2026-{random.randint(100000,999999)}"
        subtotal = random.randint(5000000, 30000000)
        discount = random.choice([0, 50000, 100000])
        shipping = 30000
        total = subtotal - discount + shipping

        query_order = """
            INSERT INTO orders (order_code, user_id, voucher_id, receiver_name, receiver_phone, shipping_address_text, subtotal_amount, discount_amount, shipping_fee, total_amount, payment_method, payment_status, order_status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            query_order,
            (
                order_code,
                random.choice(user_ids),
                random.choice(voucher_ids + [None]),
                f"Khách hàng {n+1}",
                generate_vn_phone(),
                "Địa chỉ chi tiết nhận hàng mẫu",
                subtotal,
                discount,
                shipping,
                total,
                random.choice(["COD", "VNPAY", "MOMO"]),
                random.choice(["UNPAID", "PAID"]),
                random.choice(["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED"]),
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
                u_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )
        o_id = int(cursor.lastrowid)
        order_ids.append(o_id)

        query_item = """
            INSERT INTO order_items (order_id, variant_id, product_name_snapshot, sku_snapshot, color_snapshot, ram_snapshot, storage_snapshot, unit_price, quantity, line_total, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        v_id = random.choice(variant_ids)
        cursor.execute(
            query_item,
            (
                o_id,
                v_id,
                "Điện thoại mẫu mua hàng",
                f"SKU-{v_id}",
                "Đen Space",
                "8GB",
                "256GB",
                subtotal,
                1,
                subtotal,
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )

        query_history = """
            INSERT INTO order_status_histories (order_id, old_status, new_status, note, changed_at)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(
            query_history,
            (
                o_id,
                "PENDING",
                "CONFIRMED",
                "Hệ thống tự động phê duyệt mẫu",
                (c_at + timedelta(minutes=30)).strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )

        if n < 35:
            query_pending = """
                INSERT INTO pending_orders (payos_order_code, user_id, receiver_name, receiver_phone, shipping_address_text, subtotal_amount, discount_amount, shipping_fee, total_amount, payment_method, items_json, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(
                query_pending,
                (
                    f"PAYOS-{order_code}",
                    random.choice(user_ids),
                    "Người nhận chờ xử lý",
                    generate_vn_phone(),
                    "Địa chỉ chờ thanh toán cổng PayOS",
                    subtotal,
                    discount,
                    shipping,
                    total,
                    "PAYOS_GATEWAY",
                    json.dumps([{"variant_id": v_id, "quantity": 1}]),
                    c_at.strftime("%Y-%m-%d %H:%M:%S"),
                ),
            )

    # -----------------------------------------------------------------
    # BẢNG: voucher_usages (30 - 50)
    # -----------------------------------------------------------------
    num_usages = min(random.randint(30, 50), len(order_ids))
    sampled_orders = random.sample(order_ids, num_usages)
    for o_id in sampled_orders:
        c_at = generate_random_datetime()
        query = "INSERT INTO voucher_usages (voucher_id, user_id, order_id, used_at) VALUES (%s, %s, %s, %s);"
        cursor.execute(
            query,
            (
                random.choice(voucher_ids),
                random.choice(user_ids),
                o_id,
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )

    # -----------------------------------------------------------------
    # BẢNG: reviews (30 - 50)
    # -----------------------------------------------------------------
    num_reviews = random.randint(30, 50)
    inserted_reviews = 0
    while inserted_reviews < num_reviews:
        c_at = generate_random_datetime()
        u_at = c_at + timedelta(hours=random.randint(1, 5))
        query = """
            INSERT IGNORE INTO reviews (product_id, user_id, rating, title, content, is_approved, helpful_count, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            query,
            (
                random.choice(product_ids),
                random.choice(user_ids),
                random.choice([4, 5, 5, 3]),
                "Sản phẩm rất tốt",
                "Máy dùng mượt, pin trâu, giao hàng siêu nhanh, đóng gói cẩn thận!",
                True,
                random.randint(0, 20),
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
                u_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )
        if cursor.rowcount > 0:
            inserted_reviews += 1

    # -----------------------------------------------------------------
    # BẢNG: questions & answers (30 - 50)
    # -----------------------------------------------------------------
    num_questions = random.randint(30, 50)
    for _ in range(num_questions):
        c_at = generate_random_datetime()
        u_at = c_at + timedelta(minutes=random.randint(10, 60))

        query_q = """
            INSERT INTO questions (product_id, user_id, content, is_answered, is_visible, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            query_q,
            (
                random.choice(product_ids),
                random.choice(user_ids),
                "Sản phẩm này có được tặng kèm củ sạc không shop?",
                True,
                True,
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
                u_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )
        q_id = int(cursor.lastrowid)

        query_a = """
            INSERT INTO answers (question_id, user_id, content, is_admin_answer, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            query_a,
            (
                q_id,
                user_ids[0],
                "Chào bạn, sản phẩm đã bao gồm đầy đủ củ sạc nhanh và cáp sạc trong hộp nhé!",
                True,
                u_at.strftime("%Y-%m-%d %H:%M:%S"),
                u_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )

    # -----------------------------------------------------------------
    # BẢNG: faqs (30 - 50)
    # -----------------------------------------------------------------
    num_faqs = random.randint(30, 50)
    faq_categories = ["CHUNG", "THANH_TOAN", "VAN_CHUYEN", "BAO_HANH"]
    for p in range(num_faqs):
        c_at = generate_random_datetime()
        u_at = c_at + timedelta(days=random.randint(1, 10))
        query = """
            INSERT INTO faqs (question, answer, category, keywords, is_active, sort_order, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            query,
            (
                f"Câu hỏi thường gặp số {p+1}?",
                "Đây là câu trả lời mẫu chuẩn từ bộ phận CSKH của hệ thống cửa hàng điện thoại.",
                random.choice(faq_categories),
                "điện thoại, hỗ trợ, mua hàng",
                True,
                p + 1,
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
                u_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )

    # -----------------------------------------------------------------
    # BẢNG: flash_sale_campaigns, sessions & products (30 - 50)
    # -----------------------------------------------------------------
    num_campaigns = random.randint(30, 50)
    for q in range(num_campaigns):
        c_at = generate_random_datetime()

        query_cam = "INSERT INTO flash_sale_campaigns (title, is_active, start_at, end_at, created_at) VALUES (%s, %s, %s, %s, %s)"
        cursor.execute(
            query_cam,
            (
                f"Chiến dịch Sale Khủng Tháng {random.randint(1,12)}",
                True,
                c_at + timedelta(days=1),
                c_at + timedelta(days=5),
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )
        cam_id = int(cursor.lastrowid)

        query_sess = "INSERT INTO flash_sale_sessions (campaign_id, start_at, end_at, status, created_at) VALUES (%s, %s, %s, %s, %s)"
        cursor.execute(
            query_sess,
            (
                cam_id,
                c_at + timedelta(days=1),
                c_at + timedelta(days=1, hours=3),
                "ENDED",
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )
        sess_id = int(cursor.lastrowid)

        query_fsp = """
            INSERT IGNORE INTO flash_sale_products (session_id, variant_id, flash_price, quantity, sold_quantity, limit_per_user, status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            query_fsp,
            (
                sess_id,
                random.choice(variant_ids),
                random.randint(3000000, 15000000),
                50,
                random.randint(0, 15),
                1,
                "ACTIVE",
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )

    # Lưu lại toàn bộ dữ liệu vào MySQL
    conn.commit()
    print("\n=======================================================")
    print(
        "-> THÀNH CÔNG: Dữ liệu thời gian đã được rải đều ngẫu nhiên từ 01/2026 đến nay!"
    )
    print("-> Bảng `inventories` được giữ trống đúng theo yêu cầu.")
    print("=======================================================")

except Exception as e:
    print(f"\n[LỖI]: {e}")
    if "conn" in locals() and conn.is_connected():
        conn.rollback()
        print("-> Hệ thống đã hủy các lệnh thực thi (Rollback) do lỗi.")
finally:
    if "cursor" in locals() and cursor:
        cursor.close()
    if "conn" in locals() and conn.is_connected():
        conn.close()
        print("-> Đã ngắt kết nối an toàn.")