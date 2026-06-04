import json
import mysql.connector
from datetime import datetime, timedelta
import sys
import io

# Đảm bảo in được ký tự tiếng Việt ra console trên Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
db_config = {
    "host": "localhost",
    "port": 3306,
    "database": "phone_store",
    "user": "root",
    "password": "123456",
    "charset": "utf8mb4",  # Đảm bảo lưu đúng font tiếng Việt UTF-8
}
import os

try:
    # Lấy đường dẫn tuyệt đối đến file JSON nằm cùng thư mục với script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "banner_updated.json")

    # Đọc file JSON đã cập nhật link từ Cloudinary
    with open(json_path, "r", encoding="utf-8") as file:
        json_data = json.load(file)

    # CHỈNH SỬA TẠI ĐÂY: Kiểm tra cấu trúc JSON chuẩn xác
    # Nếu json_data là một Dictionary (chỉ có 1 banner), ta bọc nó vào trong 1 List []
    if isinstance(json_data, dict):
        banners_list = [json_data]
    else:
        # Nếu json_data đã là một List sẵn rồi (nhiều banner) thì giữ nguyên
        banners_list = json_data

    print(f"Tổng số banner thực tế cần import: {len(banners_list)}")

    # Kết nối MySQL
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    # Xóa dữ liệu cũ và reset AUTO_INCREMENT
    print("Đang làm sạch dữ liệu cũ trong bảng `banners`...")
    cursor.execute("TRUNCATE TABLE banners;")

    # Câu lệnh Insert SQL
    insert_query = """
    INSERT INTO banners (title, subtitle, image_url, link_url, button_text, position, start_at, end_at, is_active, sort_order)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    inserted_count = 0
    # Vòng lặp lấy chỉ mục `i` chạy từ 0
    for i, item in enumerate(banners_list):

        # 1. Logic tính ngày tháng
        now = datetime.now()
        start_date = now.strftime("%Y-%m-%d %H:%M:%S")
        end_date = (now + timedelta(days=100)).strftime("%Y-%m-%d %H:%M:%S")

        # 2. Logic tăng dần số thứ tự (1, 2, 3,...)
        auto_sort_order = i + 1

        val = (
            item.get("title"),
            item.get("subtitle", None),
            item.get("image_url"),
            item.get("link_url", None),
            item.get("button_text", None),
            item.get("position"),
            start_date,
            end_date,
            item.get("is_active", True),
            auto_sort_order,
        )

        cursor.execute(insert_query, val)
        inserted_count += 1
        print(
            f"Đang import: {item.get('title')} | Thứ tự hiển thị: {auto_sort_order}"
        )

    conn.commit()
    print(
        f"\n-> THÀNH CÔNG: Đã import mới hoàn toàn {inserted_count} bản ghi vào bảng banners!"
    )

except Exception as e:
    print(f"Đã xảy ra lỗi hệ thống: {e}")
    if "conn" in locals() and conn.is_connected():
        conn.rollback()
finally:
    if "cursor" in locals() and cursor:
        cursor.close()
    if "conn" in locals() and conn.is_connected():
        conn.close()
        print("Đã đóng kết nối Database an toàn.")