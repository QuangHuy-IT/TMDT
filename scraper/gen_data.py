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

DEFAULT_PASSWORD_HASH = (
    "$2a$10$R7MbyUloUHTWfK4r6qlyGOxYofG7G/L8N/2AWDm26y6v1RlhF1Yp2"
)

# =====================================================================
# KHO NỘI DUNG ĐA DẠNG (REVIEWS & QUESTIONS)
# =====================================================================
review_templates = [
    # --- 5 SAO: KHEN TOÀN DIỆN & REVIEW SÂU ---
    {
        "rating": 5,
        "title": "Cực kỳ hài lòng",
        "content": "Máy dùng siêu mượt, đóng gói cẩn thận 2 lớp chống sốc. Giao hàng từ HN vào HCM chỉ mất 2 ngày. Rất đáng tiền!",
    },
    {
        "rating": 5,
        "title": "Tuyệt vời, chính hãng xịn",
        "content": "Đã check serial trên trang chủ chuẩn Apple. Camera chụp đêm xuất sắc, pin trâu hơn hẳn dòng cũ. Sẽ ủng hộ shop tiếp.",
    },
    {
        "rating": 5,
        "title": "Sản phẩm tốt trong tầm giá",
        "content": "Mua tặng bố mẹ, máy màn hình to rõ, loa ngoài lớn, pin dùng 2 ngày mới phải sạc. Nhân viên tư vấn rất nhiệt tình.",
    },
    {
        "rating": 5,
        "title": "Đỉnh cao phân khúc!",
        "content": "Màn hình 120Hz mượt mà dã man, vuốt chạm không có độ trễ. Chip mạnh cân tốt mọi game hiện tại. Máy cầm đầm tay, sang trọng.",
    },
    {
        "rating": 5,
        "title": "Review sau 1 tuần sử dụng",
        "content": "Sạc nhanh siêu tốc, tầm hơn 30 phút là đầy pin. Hệ điều hành sạch, không bị cài app rác. Trải nghiệm xem phim âm thanh vòm rất đã.",
    },
    # --- 4 SAO: TỐT NHƯNG CÓ ĐIỂM TRỪ NHỎ (HẬU CẦN, VẬN CHUYỂN, PHỤ KIỆN) ---
    {
        "rating": 4,
        "title": "Máy ngon nhưng giao hàng hơi chậm",
        "content": "Sản phẩm không có điểm gì chê, dùng mượt mà chiến game tốt. Trừ 1 sao vì bên vận chuyển giao chậm mất 1 ngày.",
    },
    {
        "rating": 4,
        "title": "Đáng mua, cấu hình mạnh",
        "content": "Hiệu năng phân khúc này quá ổn. Tuy nhiên máy chạy tác vụ nặng hơi ấm một chút, chấp nhận được. Tặng kèm đầy đủ phụ kiện.",
    },
    {
        "rating": 4,
        "title": "Chất lượng máy OK",
        "content": "Thiết kế đẹp, mỏng nhẹ. Mỗi tội shop quên không gửi kèm hóa đơn giấy, phải nhắn tin xin file hóa đơn điện tử.",
    },
    {
        "rating": 4,
        "title": "Mọi thứ ổn trừ quà tặng kèm",
        "content": "Điện thoại dùng tốt, mượt. Nhưng ốp lưng tặng kèm hơi lỏng lẻo, mình phải tự mua ốp ngoài để dùng cho an tâm.",
    },
    # --- 3 SAO: KHÁCH HÀNG TRUNG LẬP / ĐÁNH GIÁ THỰC TẾ TRẢI NGHIỆM ---
    {
        "rating": 3,
        "title": "Bình thường, tạm ổn",
        "content": "Máy dùng lướt web xem phim thì ok, chứ chụp ảnh hơi bệt màu. Pin tụt hơi nhanh khi bật 4G liên tục.",
    },
    {
        "rating": 3,
        "title": "Đóng gói hơi sơ sài",
        "content": "Hộp sản phẩm bị móp nhẹ một góc do vận chuyển, may mà máy bên trong không sao. Shop nên bọc thêm nhiều lớp bóng khí hơn.",
    },
    {
        "rating": 3,
        "title": "Nhu cầu cơ bản thì được",
        "content": "RAM quảng cáo lớn nhưng quản lý đa nhiệm chưa tốt lắm, thỉnh thoảng vẫn bị load lại app. Vỏ nhựa bám vân tay khá nhiều.",
    },
    {
        "rating": 3,
        "title": "Tạm chấp nhận, loa hơi rè",
        "content": "Bật max volume nghe nhạc hơi có hiện tượng bị xé tiếng và rè nhẹ. Các tính năng khác hoạt động bình thường.",
    },
    # --- 1 & 2 SAO: CHÊ BÀI, GẶP LỖI PHẦN CỨNG HOẶC KHÔNG HÀI LÒNG DỊCH VỤ ---
    {
        "rating": 2,
        "title": "Thất vọng về thời lượng pin",
        "content": "Máy tụt pin như tụt quần, để qua đêm không bật mạng cũng mất 10%. Chơi game được 2 tiếng đã báo pin yếu. Đề nghị shop kiểm tra đổi trả.",
    },
    {
        "rating": 2,
        "title": "Sản phẩm không như kỳ vọng",
        "content": "Camera quảng cáo chống rung các kiểu mà quay video rung lắc dữ dội, bắt nét rất chậm. Không đáng số tiền bỏ ra.",
    },
    {
        "rating": 1,
        "title": "Máy bị lỗi sọc màn hình!",
        "content": "Mới mua về dùng được đúng 3 ngày thì màn hình hiện một đường sọc xanh từ trên xuống dưới. Đang làm thủ tục bảo hành mà shop xử lý chậm chạp quá.",
    },
    {
        "rating": 1,
        "title": "Giao sai màu máy, thái độ chán",
        "content": "Đặt bản màu Đen Titan mà lại giao màu Trắng. Liên hệ tổng đài hỗ trợ đổi trả thì đùn đẩy trách nhiệm, bắt chờ đợi mệt mỏi.",
    },
    {
        "rating": 1,
        "title": "Nghi ngờ hàng kích hoạt rồi",
        "content": "Mở hộp ra thấy seal ni-lông có dấu hiệu bị bóc lại. Check thời hạn bảo hành trên hệ thống bị trôi mất 2 tháng. Yêu cầu shop giải thích rõ ràng!",
    },
]

question_pool = [
    # --- NHÓM CÂU HỎI VỀ PHỤ KIỆN & ƯU ĐÃI ---
    {
        "q": "Sản phẩm này có được tặng kèm củ sạc nhanh trong hộp không shop?",
        "a": "Dạ chào bạn, đối với dòng sản phẩm này nhà sản xuất đã cắt giảm củ sạc, trong hộp chỉ có cáp sạc. Tuy nhiên shop đang có chương trình tặng kèm củ sạc 20W khi mua trong tuần này nhé!",
    },
    {
        "q": "Mua máy có được tặng kèm tai nghe hay dán cường lực sẵn không ạ?",
        "a": "Dạ, máy chưa bao gồm tai nghe đi kèm ạ. Tuy nhiên, khi mua máy tại shop, bạn sẽ được hỗ trợ dán cường lực miễn phí trọn đời sản phẩm và được tặng kèm một ốp lưng silicon cao cấp nha.",
    },
    # --- NHÓM CÂU HỎI VỀ NGUỒN GỐC & BẢO HÀNH ---
    {
        "q": "Bản này là hàng chính hãng VNA hay bản nhập khẩu vậy ạ?",
        "a": "Dạ, toàn bộ máy bên shop phân phối đều là hàng chính hãng phân phối chính thức tại Việt Nam, mới 100% nguyên seal và được bảo hành 12 tháng tại các trung tâm ủy quyền toàn quốc ạ.",
    },
    {
        "q": "Nếu máy dùng bị lỗi sọc màn hình hoặc lỗi nguồn thì shop giải quyết thế nào?",
        "a": "Dạ trong vòng 30 ngày đầu tiên nếu máy phát sinh lỗi phần cứng từ nhà sản xuất (bao gồm cả lỗi sọc màn, mất nguồn, lỗi cảm ứng), shop sẽ áp dụng chính sách 1 đổi 1 máy mới ngay lập tức cho mình sau khi có biên bản kiểm tra từ hãng ạ.",
    },
    {
        "q": "Hàng này là máy mới hoàn toàn chưa kích hoạt (New Seal) hay là máy Active Online vậy shop?",
        "a": "Dạ shop cam kết máy bán ra là hàng New Seal 100%, chưa qua kích hoạt. Khi nhận hàng bạn tự tay bóc seal và tự kích hoạt bảo hành trên hệ thống của hãng nên có thể hoàn toàn yên tâm ạ.",
    },
    # --- NHÓM CÂU HỎI VỀ THANH TOÁN & TRẢ GÓP ---
    {
        "q": "Shop có hỗ trợ trả góp 0% qua thẻ tín dụng không, thủ tục thế nào?",
        "a": "Dạ có ạ, shop hỗ trợ trả góp 0% qua thẻ tín dụng của hơn 25 ngân hàng thông qua cổng Alepay, bạn có thể làm thủ tục online ngay khi đặt hàng trên website cực kỳ tiện lợi nhé.",
    },
    {
        "q": "Mình muốn trả góp qua căn cước công dân (CCCD) có được không và cần trả trước bao nhiêu?",
        "a": "Dạ được ạ, shop có liên kết với các công ty tài chính (Home Credit, FE Credit). Bạn chỉ cần mang CCCD gắn chip qua trực tiếp cửa hàng, duyệt hồ sơ trong 15 phút và có thể trả trước từ 10% giá trị máy là lấy được máy ạ.",
    },
    # --- NHÓM CÂU HỎI VỀ CẤU HÌNH & TÍNH NĂNG KỸ THUẬT ---
    {
        "q": "Máy này chơi mượt game nặng như Genshin Impact hay Liên Quân không?",
        "a": "Dạ với vi xử lý thế hệ mới kết hợp cấu hình RAM lớn, máy hoàn toàn chiến mượt Liên Quân ở cấu hình tối đa 60fps. Với game nặng như Genshin bạn nên để setting ở mức Trung bình để trải nghiệm ổn định nhất ạ.",
    },
    {
        "q": "Sản phẩm này dùng được mấy SIM vậy shop? Có tích hợp eSIM không?",
        "a": "Dạ phiên bản này hỗ trợ 2 SIM hoạt động song song bao gồm: 1 SIM vật lý (khay cắm thông thường) và 1 eSIM (SIM điện tử tích hợp). Bạn có thể add nhiều eSIM nhưng tại một thời điểm sẽ online được 1 eSIM ạ.",
    },
    {
        "q": "Máy có tính năng kháng nước kháng bụi chuẩn IP68 không shop ơi?",
        "a": "Dạ có ạ, sản phẩm đạt tiêu chuẩn kháng nước kháng bụi IP68, có khả năng chịu được độ sâu lên tới 1.5 mét dưới nước trong tối đa 30 phút. Tuy nhiên hãng khuyến cáo không nên cố tình ngâm nước thiết bị nhé ạ.",
    },
    # --- NHÓM CÂU HỎI VỀ VẬN CHUYỂN & GIAO NHẬN ---
    {
        "q": "Mình ở tỉnh lẻ thì đặt hàng bao lâu nhận được và có được kiểm tra hàng trước khi thanh toán không?",
        "a": "Dạ thời gian ship tỉnh dao động từ 2-4 ngày tùy khu vực. Khi nhận hàng, bạn hoàn toàn được quyền mở đồng kiểm ngoại quan hộp máy cùng shipper trước khi thanh toán tiền (COD) ạ.",
    },
    {
        "q": "Shop có dịch vụ giao hàng hỏa tốc trong ngày ở nội thành không?",
        "a": "Dạ có ạ, các đơn hàng ở khu vực nội thành Hà Nội và TP. Hồ Chí Minh sẽ được shop hỗ trợ ship hỏa tốc qua AhaMove/GrabExpress, nhận hàng ngay sau 1 đến 2 tiếng kể từ khi chốt đơn online ạ.",
    },
]


# =====================================================================
# HÀM SINH NGÀY THÁNG NGẪU NHIÊN (01/01/2026 - Nay)
# =====================================================================
def generate_random_datetime(start_year=2026, start_month=1, start_day=1):
    start_date = datetime(start_year, start_month, start_day)
    end_date = datetime.now()
    time_between = end_date - start_date
    seconds_between = int(time_between.total_seconds())
    random_seconds = random.randint(0, seconds_between)
    return start_date + timedelta(seconds=random_seconds)


def generate_vn_phone():
    prefixes = ["090", "091", "098", "096", "097", "032", "035", "070", "077"]
    return random.choice(prefixes) + "".join(
        str(random.randint(0, 9)) for _ in range(7)
    )


def fetch_vietnam_locations():
    print("-> Đang tải danh sách Tỉnh/Thành từ Open API...")
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
            "districts": [{"name": "Quận Cầu Giấy"}],
        },
        {
            "name": "Thành phố Hồ Chí Minh",
            "districts": [{"name": "Quận 1"}],
        },
    ]


# =====================================================================
# THỰC THI SEED DATA
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
    print("-> Đã dọn sạch dữ liệu cũ.")

    cursor.execute("SELECT id FROM product_variants;")
    variant_ids = [int(row[0]) for row in cursor.fetchall()]
    cursor.execute("SELECT id FROM products;")
    product_ids = [int(row[0]) for row in cursor.fetchall()]

    if not variant_ids or not product_ids:
        print("[CẢNH BÁO] Không có sản phẩm gốc! Sử dụng ID giả lập.")
        variant_ids = list(range(1, 30))
        product_ids = list(range(1, 15))

    current_time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 1. BẢNG: users -> NÂNG LÊN: 45 - 55 user để đảm bảo phân bổ 400 wishlist_items hợp lý
    num_users = random.randint(45, 55)
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
        prov_obj = random.choice(geo_data)
        province_name = prov_obj["name"]
        ward_name = (
            random.choice(prov_obj["districts"])["name"]
            if prov_obj["districts"]
            else "Phường Trung Tâm"
        )

        c_at = generate_random_datetime()
        u_at = c_at + timedelta(hours=random.randint(1, 12))

        query = """
            INSERT INTO users (email, phone, year_of_birth, password_hash, full_name, role, status, province, district, ward, detail_address, enabled, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NULL, %s, %s, %s, %s, %s)
        """
        values = (
            email,
            phone,
            random.randint(1990, 2004),
            DEFAULT_PASSWORD_HASH,
            full_name,
            "ADMIN" if i == 0 else "USER",
            "ACTIVE",
            province_name,
            ward_name,
            f"Số {random.randint(1, 150)} Đường Đời",
            True,
            c_at.strftime("%Y-%m-%d %H:%M:%S"),
            u_at.strftime("%Y-%m-%d %H:%M:%S"),
        )
        cursor.execute(query, values)
        user_ids.append(int(cursor.lastrowid))

    # 2. BẢNG: user_addresses
    for u_id in user_ids:
        for j in range(random.randint(1, 2)):
            prov_obj = random.choice(geo_data)
            p_name = prov_obj["name"]
            d_name = (
                random.choice(prov_obj["districts"])["name"]
                if prov_obj["districts"]
                else "Quận Trung Tâm"
            )
            w_name = f"Phường của {d_name}"

            c_at = generate_random_datetime()
            query = """
                INSERT INTO user_addresses (user_id, receiver_name, receiver_phone, province, district, ward, detail_address, is_default, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                u_id,
                f"Địa chỉ của u_id_{u_id}",
                generate_vn_phone(),
                p_name,
                d_name,
                w_name,
                f"Ngõ {random.randint(1, 99)} nhà số {random.randint(1, 50)}",
                True if j == 0 else False,
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
            )
            cursor.execute(query, values)

    # 3. BẢNG: inventory_movements (30 - 50)
    for _ in range(random.randint(30, 50)):
        c_at = generate_random_datetime()
        query = """
            INSERT INTO inventory_movements (variant_id, movement_type, quantity, reference_type, reference_id, note, created_by, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            query,
            (
                random.choice(variant_ids),
                random.choice(["IMPORT", "EXPORT", "RESERVE", "RELEASE"]),
                random.randint(5, 30),
                "MANUAL",
                f"REF-{random.randint(100,999)}",
                "Điều chỉnh kho mẫu",
                user_ids[0],
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )

    # 4. BẢNG: inventory_logs (30 - 50)
    for k in range(random.randint(30, 50)):
        c_at = generate_random_datetime()
        query_log = "INSERT INTO inventory_logs (log_code, total_adjustments, total_products, note, created_by_name, created_at) VALUES (%s, %s, %s, %s, %s, %s)"
        cursor.execute(
            query_log,
            (
                f"LOG-{k+1:03d}",
                random.randint(5, 50),
                1,
                "Kiểm kho hàng tuần",
                "Hệ thống tự động",
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )
        log_id = int(cursor.lastrowid)

        query_item = """
            INSERT INTO inventory_log_items (inventory_log_id, product_id, product_name, variant_id, variant_name, sku, before_stock, after_stock, delta)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        v_id = random.choice(variant_ids)
        cursor.execute(
            query_item,
            (
                log_id,
                random.choice(product_ids),
                "Smartphone",
                v_id,
                "Default",
                f"SKU-{v_id}",
                20,
                25,
                5,
            ),
        )

    # 5. BẢNG: ĐÃ ĐIỀU CHỈNH - wishlists & wishlist_items -> ĐÚNG CỐ ĐỊNH 400 BẢN GHI
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

    num_wishlist_items = 400  # Cố định đúng 400 bản ghi chi tiết yêu thích
    inserted_wish_items = 0
    print(f"   -> Đang sinh chính xác {num_wishlist_items} sản phẩm yêu thích...")

    while inserted_wish_items < num_wishlist_items:
        c_at = generate_random_datetime()
        # INSERT IGNORE để tránh trùng lặp bộ (wishlist_id, variant_id) do thuộc tính UNIQUE KEY
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

    # 6. BẢNG: vouchers (30 - 50)
    voucher_ids = []
    for m in range(random.randint(30, 50)):
        c_at = generate_random_datetime()
        query = """
            INSERT INTO vouchers (code, discount_type, discount_value, max_discount_amount, min_order_amount, start_at, end_at, usage_limit, used_count, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            query,
            (
                f"VOUCHER{m}",
                "FIXED",
                50000,
                50000,
                500000,
                c_at,
                c_at + timedelta(days=60),
                200,
                0,
                True,
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )
        voucher_ids.append(int(cursor.lastrowid))

    # 7. BẢNG: orders, pending_orders, order_items & histories (150 - 200)
    num_orders = random.randint(150, 200)
    order_ids = []
    for n in range(num_orders):
        c_at = generate_random_datetime()
        u_at = c_at + timedelta(days=random.randint(1, 3))

        order_code = f"ORD-2026-{n+1:05d}-{random.randint(10,99)}"
        subtotal = random.randint(4000000, 25000000)
        discount = random.choice([0, 50000])
        total = subtotal - discount + 30000

        query_order = """
            INSERT INTO orders (order_code, user_id, voucher_id, receiver_name, receiver_phone, shipping_address_text, subtotal_amount, discount_amount, shipping_fee, total_amount, payment_method, payment_status, order_status, placed_at, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            query_order,
            (
                order_code,
                random.choice(user_ids),
                random.choice(voucher_ids + [None]),
                f"Khách mua hàng {n+1}",
                generate_vn_phone(),
                "Địa chỉ nhận hàng ngẫu nhiên tại Việt Nam",
                subtotal,
                discount,
                30000,
                total,
                random.choice(["COD", "VNPAY", "MOMO"]),
                random.choice(["UNPAID", "PAID"]),
                random.choice(["PENDING", "DELIVERED", "CANCELED"]),
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
                u_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )
        o_id = int(cursor.lastrowid)
        order_ids.append(o_id)

        v_id = random.choice(variant_ids)
        query_item = """
            INSERT INTO order_items (order_id, variant_id, product_name_snapshot, sku_snapshot, color_snapshot, ram_snapshot, storage_snapshot, unit_price, quantity, line_total, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            query_item,
            (
                o_id,
                v_id,
                "Điện thoại chính hãng",
                f"SKU-{v_id}",
                "Titan Tự Nhiên",
                "8GB",
                "128GB",
                subtotal,
                1,
                subtotal,
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )

        if n < 45:
            query_pending = """
                INSERT INTO pending_orders (payos_order_code, user_id, receiver_name, receiver_phone, shipping_address_text, subtotal_amount, discount_amount, shipping_fee, total_amount, payment_method, items_json, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(
                query_pending,
                (
                    f"PAYOS-{order_code}",
                    random.choice(user_ids),
                    "Khách chờ duyệt",
                    generate_vn_phone(),
                    "Địa chỉ cổng thanh toán",
                    subtotal,
                    discount,
                    30000,
                    total,
                    "VNPAY",
                    json.dumps([{"variant_id": v_id, "quantity": 1}]),
                    c_at.strftime("%Y-%m-%d %H:%M:%S"),
                ),
            )

        query_hist = "INSERT INTO order_status_histories (order_id, old_status, new_status, note, changed_at) VALUES (%s, %s, %s, %s, %s)"
        cursor.execute(
            query_hist,
            (
                o_id,
                "PENDING",
                "DELIVERED",
                "Hoàn thành giao hàng tự động",
                u_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )

    # 8. BẢNG: voucher_usages (30 - 50)
    num_usages = min(random.randint(30, 50), len(order_ids))
    for o_id in random.sample(order_ids, num_usages):
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

    # 9. BẢNG: reviews (200 - 300)
    num_reviews = random.randint(200, 300)
    inserted_reviews = 0
    while inserted_reviews < num_reviews:
        c_at = generate_random_datetime()
        u_at = c_at + timedelta(hours=random.randint(2, 24))
        tpl = random.choice(review_templates)

        query = """
            INSERT IGNORE INTO reviews (product_id, user_id, rating, title, content, is_approved, helpful_count, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            query,
            (
                random.choice(product_ids),
                random.choice(user_ids),
                tpl["rating"],
                tpl["title"],
                tpl["content"],
                True,
                random.randint(0, 15),
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
                u_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )
        if cursor.rowcount > 0:
            inserted_reviews += 1

    # 10. BẢNG: questions & answers (150 - 200)
    num_questions = random.randint(150, 200)
    for _ in range(num_questions):
        c_at = generate_random_datetime()
        u_at = c_at + timedelta(minutes=random.randint(15, 180))
        qa = random.choice(question_pool)

        query_q = "INSERT INTO questions (product_id, user_id, content, is_answered, is_visible, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        cursor.execute(
            query_q,
            (
                random.choice(product_ids),
                random.choice(user_ids),
                qa["q"],
                True,
                True,
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
                u_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )
        q_id = int(cursor.lastrowid)

        query_a = "INSERT INTO answers (question_id, user_id, content, is_admin_answer, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s)"
        cursor.execute(
            query_a,
            (
                q_id,
                user_ids[0],
                qa["a"],
                True,
                u_at.strftime("%Y-%m-%d %H:%M:%S"),
                u_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )

    # 11. BẢNG: faqs (30 - 50)
    for p in range(random.randint(30, 50)):
        c_at = generate_random_datetime()
        query = "INSERT INTO faqs (question, answer, category, keywords, is_active, sort_order, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        cursor.execute(
            query,
            (
                f"Câu hỏi FAQ hệ thống {p+1}?",
                "Nội dung hướng dẫn xử lý nghiệp vụ CSKH từ tổng đài.",
                "CHUNG",
                "hướng dẫn, điện thoại",
                True,
                p + 1,
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )

    # 12. BẢNG: flash_sales (30 - 50)
    for q in range(random.randint(30, 50)):
        c_at = generate_random_datetime()
        query_cam = "INSERT INTO flash_sale_campaigns (title, is_active, start_at, end_at, created_at) VALUES (%s, %s, %s, %s, %s)"
        cursor.execute(
            query_cam,
            (
                f"Sự kiện Flash Sale Giờ Vàng {q+1}",
                True,
                c_at + timedelta(days=1),
                c_at + timedelta(days=2),
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
                c_at + timedelta(days=1, hours=2),
                "ENDED",
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )
        sess_id = int(cursor.lastrowid)

        query_fsp = "INSERT IGNORE INTO flash_sale_products (session_id, variant_id, flash_price, quantity, sold_quantity, limit_per_user, status, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"
        cursor.execute(
            query_fsp,
            (
                sess_id,
                random.choice(variant_ids),
                5000000,
                30,
                12,
                1,
                "ACTIVE",
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
                c_at.strftime("%Y-%m-%d %H:%M:%S"),
            ),
        )

    conn.commit()
    print("\n=======================================================")
    print("-> THÀNH CÔNG: Toàn bộ dữ liệu ngẫu nhiên đã được nạp hoàn tất!")
    print(f"   + Users: {len(user_ids)} tài khoản.")
    print(f"   + Wishlists (Mục yêu thích cha): {len(wishlist_ids)} bản ghi.")
    print(f"   + Wishlist Items (Sản phẩm chi tiết yêu thích): {inserted_wish_items} bản ghi (ĐÚNG 400).")
    print("=======================================================")

except Exception as e:
    print(f"\n[LỖI]: {e}")
    if "conn" in locals() and conn.is_connected():
        conn.rollback()
finally:
    if "cursor" in locals() and cursor:
        cursor.close()
    if "conn" in locals() and conn.is_connected():
        conn.close()
        print("-> Đã đóng kết nối an toàn.")