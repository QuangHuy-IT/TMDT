import json
import mysql.connector
import cloudinary
import cloudinary.uploader
cloudinary.config(
    cloud_name="dozpywcus",
    api_key="345466748819321",  # Điền API Key của bạn vào đây
    api_secret="hX6w0WmgPjD1ffxaDXs69QUjiDQ",  # Điền API Secret của bạn vào đây
    secure=True,
)

db_config = {
    "host": "localhost",
    "port": 3306,
    "database": "phone_store",
    "user": "root",
    "password": "123456",
    "charset": "utf8mb4",  # Đảm bảo lưu đúng font tiếng Việt UTF-8
}

def upload_to_cloudinary(source_url, public_id=None):
    try:
        upload_result = cloudinary.uploader.upload(
            source_url, public_id=public_id
        )
        return upload_result.get("secure_url")
    except Exception as e:
        print(f"   [LỖI CLOUDINARY] Không thể upload {public_id}: {e}")
        return None


# =====================================================================
# 3. TIẾN HÀNH CẬP NHẬT (UPDATE) LINK CLOUDINARY
# =====================================================================
try:
    # Bước 3.1: Đọc file dữ liệu brands.json
    with open("brands.json", "r", encoding="utf-8") as file:
        brands_list = json.load(file)

    print(f"-> Đã đọc {len(brands_list)} thương hiệu từ file JSON.")

    # Bước 3.2: Kết nối Database (Không dùng TRUNCATE nữa)
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    # Câu lệnh SQL UPDATE: Tìm theo slug và cập nhật logo_url cùng sort_order
    update_query = """
    UPDATE brands 
    SET logo_url = %s, sort_order = %s 
    WHERE slug = %s
    """

    updated_count = 0

    # Bước 3.3: Duyệt danh sách, upload ảnh và cập nhật vào Database
    for i, item in enumerate(brands_list):
        brand_name = item.get("brand_name")
        slug = item.get("slug")
        origin_logo_url = item.get("brand_logo_url")

        unique_public_id = f"brand_{slug}"
        auto_sort_order = i + 1

        print(f"\n[{i+1}/{len(brands_list)}] Đang xử lý: {brand_name}")

        if origin_logo_url:
            print(f"   Đang đẩy logo lên Cloudinary...")
            cloudinary_url = upload_to_cloudinary(
                origin_logo_url, unique_public_id
            )

            if cloudinary_url:
                # Chuẩn bị dữ liệu cho câu lệnh UPDATE (logo_url, sort_order, slug)
                val = (cloudinary_url, auto_sort_order, slug)

                # Thực thi câu lệnh UPDATE
                cursor.execute(update_query, val)

                # Kiểm tra xem có bản ghi nào trong DB khớp với slug này để update không
                if cursor.rowcount > 0:
                    print(
                        f"   -> Cập nhật DB thành công cho {brand_name}! (sort_order = {auto_sort_order})"
                    )
                    updated_count += 1
                else:
                    print(
                        f"   [CẢNH BÁO] Không tìm thấy thương hiệu có slug '{slug}' trong DB để cập nhật."
                    )
            else:
                print(f"   -> Bỏ qua DB do lỗi upload Cloudinary.")
        else:
            print(f"   -> Bỏ qua do không có link logo gốc.")

    # Bước 3.4: Hoàn tất phiên làm việc (Commit)
    conn.commit()
    print(
        f"\n========================================================="
        f"\n-> HOÀN THÀNH: Đã cập nhật thành công link Cloudinary cho {updated_count} thương hiệu hiện có!"
    )

except Exception as e:
    print(f"\n[LỖI HỆ THỐNG]: {e}")
    if "conn" in locals() and conn.is_connected():
        conn.rollback()
        print("-> Đã rollback các thay đổi lỗi.")

finally:
    if "cursor" in locals() and cursor:
        cursor.close()
    if "conn" in locals() and conn.is_connected():
        conn.close()
        print("-> Kết nối Database đã đóng an toàn.")