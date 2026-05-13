# Module Flash Sale — TMDT Phone Store

## Tổng quan

Module Flash Sale được xây dựng lại hoàn toàn theo mô hình 3 bảng: `flash_sale_campaigns` → `flash_sale_sessions` → `flash_sale_products`, phù hợp cho website bán điện thoại/ecommerce chuyên nghiệp, thiết kế giao diện giống CellphoneS.

---

## Database Schema

### 3 bảng chính

```sql
flash_sale_campaigns
  ├── id (PK, BIGINT UNSIGNED AUTO_INCREMENT)
  ├── title (VARCHAR 255, NOT NULL)         -- VD: "FLASH SALE", "DEAL HÈ MÁT LẠNH"
  ├── is_active (BOOLEAN, DEFAULT TRUE)
  ├── start_at (DATETIME, NOT NULL)
  ├── end_at (DATETIME, NOT NULL)
  ├── created_at (DATETIME)
  └── KEY idx_flash_sale_campaigns_active (is_active, start_at, end_at)

flash_sale_sessions
  ├── id (PK, BIGINT UNSIGNED AUTO_INCREMENT)
  ├── campaign_id (FK → flash_sale_campaigns.id, ON DELETE CASCADE)
  ├── start_at (DATETIME, NOT NULL)
  ├── end_at (DATETIME, NOT NULL)
  ├── status (ENUM: 'UPCOMING', 'RUNNING', 'ENDED', DEFAULT 'UPCOMING')
  ├── created_at (DATETIME)
  ├── KEY idx_flash_sale_sessions_campaign
  ├── KEY idx_flash_sale_sessions_time
  └── CONSTRAINT fk_flash_sale_sessions_campaign

flash_sale_products
  ├── id (PK, BIGINT UNSIGNED AUTO_INCREMENT)
  ├── session_id (FK → flash_sale_sessions.id, ON DELETE CASCADE)
  ├── variant_id (FK → product_variants.id, ON DELETE CASCADE)
  ├── flash_price (DECIMAL 15,2, NOT NULL)
  ├── quantity (INT UNSIGNED, NOT NULL)
  ├── sold_quantity (INT UNSIGNED, DEFAULT 0)
  ├── limit_per_user (INT UNSIGNED, DEFAULT 1)
  ├── status (ENUM: 'ACTIVE', 'SOLD_OUT', 'HIDDEN', DEFAULT 'ACTIVE')
  ├── sort_order (INT UNSIGNED, DEFAULT 0)
  ├── created_at, updated_at
  ├── UNIQUE KEY uk_flash_sale_session_variant (session_id, variant_id)
  └── CONSTRAINT fk_flash_sale_products_variant
```

---

## Backend — Java Spring Boot

### Cấu trúc thư mục

```
com.tmdt.phone_store_backend/
├── domain/entity/
│   ├── FlashSaleCampaign.java       ← Entity chiến dịch
│   ├── FlashSaleSession.java        ← Entity phiên (UPCOMING/RUNNING/ENDED)
│   └── FlashSaleProduct.java        ← Entity sản phẩm flash sale
├── dto/
│   ├── FlashSaleCampaignDto.java          ← Response DTO campaign
│   ├── FlashSaleSessionDto.java            ← Response DTO session
│   ├── FlashSaleProductDto.java            ← Response DTO product
│   ├── FlashSaleResponseDto.java           ← Wrapper response public API
│   ├── CreateCampaignRequestDto.java       ← Tạo campaign
│   ├── UpdateCampaignRequestDto.java       ← Cập nhật campaign
│   ├── CreateSessionRequestDto.java        ← Tạo session
│   ├── UpdateSessionRequestDto.java       ← Cập nhật session
│   ├── AddFlashSaleProductRequestDto.java  ← Thêm sản phẩm vào session
│   └── UpdateFlashSaleProductRequestDto.java ← Cập nhật sản phẩm
├── repository/
│   ├── FlashSaleCampaignRepository.java   ← Query campaigns + thời gian active
│   ├── FlashSaleSessionRepository.java    ← Update trạng thái tự động, query theo status
│   └── FlashSaleProductRepository.java     ← JOIN FETCH variant + product + images
├── service/
│   ├── FlashSaleService.java              ← Interface (18 methods)
│   └── impl/FlashSaleServiceImpl.java     ← Full implementation
└── controller/
    ├── FlashSaleController.java           ← Public API
    └── FlashSaleAdminController.java      ← Admin CRUD
```

### Quan hệ Entity

```
FlashSaleCampaign
  └── OneToMany → FlashSaleSession
        └── OneToMany → FlashSaleProduct
              └── ManyToOne → ProductVariant → Product
```

### Entity details

**FlashSaleCampaign.java**
- Quan hệ: `@OneToMany` → sessions (cascade ALL, orphanRemoval)
- Computed: isRunning, isEnded, isUpcoming, remainingSeconds

**FlashSaleSession.java**
- Quan hệ: `@ManyToOne` → campaign, `@OneToMany` → products
- Enum status: `UPCOMING`, `RUNNING`, `ENDED`
- Methods: `updateStatus()`, `isCurrentlyRunning()`, `isEnded()`, `isUpcoming()`

**FlashSaleProduct.java**
- Quan hệ: `@ManyToOne` → session, `@ManyToOne` → variant
- Enum status: `ACTIVE`, `SOLD_OUT`, `HIDDEN`
- Computed: discountPercent, progressPercent, remainingQuantity

### Business Logic

1. **Session Status tự động:** `updateSessionStatuses()` cập nhật RUNNING/ENDED theo thời gian hiện tại
2. **Sold Out:** Khi `sold_quantity >= quantity` → `status = SOLD_OUT`
3. **Date validation:** Session phải nằm trong khoảng campaign
4. **Flash price:** Phải nhỏ hơn giá gốc của variant
5. **No duplicate:** Mỗi variant chỉ thuộc 1 sản phẩm trong 1 session

### Public API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/flash-sales` | Lấy toàn bộ data: campaigns, sessions, products, featuredSession |
| GET | `/api/flash-sales/campaigns` | Danh sách campaigns đang active |
| GET | `/api/flash-sales/sessions/{id}` | Chi tiết 1 session + products |

### Admin API Endpoints

**Campaigns:**
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/admin/flash-sales/campaigns` | Danh sách tất cả campaigns |
| POST | `/api/admin/flash-sales/campaigns` | Tạo campaign mới |
| PUT | `/api/admin/flash-sales/campaigns/{id}` | Cập nhật campaign |
| DELETE | `/api/admin/flash-sales/campaigns/{id}` | Xóa campaign |
| PATCH | `/api/admin/flash-sales/campaigns/{id}/activate` | Kích hoạt |
| PATCH | `/api/admin/flash-sales/campaigns/{id}/deactivate` | Vô hiệu hóa |

**Sessions:**
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/admin/flash-sales/sessions/campaign/{campaignId}` | Sessions theo campaign |
| POST | `/api/admin/flash-sales/sessions` | Tạo session mới |
| PUT | `/api/admin/flash-sales/sessions/{id}` | Cập nhật session |
| DELETE | `/api/admin/flash-sales/sessions/{id}` | Xóa session |
| POST | `/api/admin/flash-sales/sessions/update-statuses` | Cập nhật trạng thái tất cả sessions |

**Flash Sale Products:**
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/admin/flash-sales/products/session/{sessionId}` | Products trong session |
| POST | `/api/admin/flash-sales/products` | Thêm sản phẩm vào session |
| PUT | `/api/admin/flash-sales/products/{id}` | Cập nhật sản phẩm |
| DELETE | `/api/admin/flash-sales/products/{id}` | Xóa sản phẩm khỏi session |
| PATCH | `/api/admin/flash-sales/products/{id}/quantity` | Cập nhật số lượng |
| PATCH | `/api/admin/flash-sales/products/{id}/sold-quantity` | Tăng số lượng đã bán |
| PATCH | `/api/admin/flash-sales/products/{id}/hide` | Ẩn sản phẩm |
| PATCH | `/api/admin/flash-sales/products/{id}/show` | Hiện sản phẩm |

---

## Frontend — React + Tailwind + Swiper

### Cấu trúc thư mục

```
src/components/flash-sale/
├── FlashSaleSection.jsx       ← Component chính (header gradient đỏ, tabs, countdown, slider)
├── FlashSaleTabs.jsx          ← Tabs chọn chiến dịch
├── FlashSaleDateSelector.jsx  ← Chọn ngày/giờ session
├── FlashSaleTimeSelector.jsx  ← Chọn khung giờ nhanh
├── CountdownTimer.jsx         ← Flip-clock countdown realtime
├── FlashSaleProductCard.jsx   ← Card sản phẩm flash sale
├── ProductSlider.jsx          ← Swiper slider ngang responsive
└── ProgressBar.jsx            ← Thanh tiến trình với icon Zap

src/services/
└── flashSaleService.js        ← Updated: GET /flash-sales

src/pages/
└── Home.jsx                   ← Updated: sử dụng getFlashSaleData()

src/components/home/
└── FlashSaleSection.jsx       ← Wrapper redirect sang component mới
```

### Giao diện — Thiết kế CellphoneS

**Header:**
- Background: `bg-gradient-to-r from-red-500 via-red-600 to-red-700`
- Icon lightning màu vàng
- Tiêu đề "FLASH SALE" + tên chiến dịch
- Countdown flip-clock realtime (ngày:giờ:phút:giây)
- SVG wave separator trắng

**Campaign Tabs:**
- Mỗi tab là 1 chiến dịch (FLASH SALE / DEAL HÈ MÁT LẠNH / HOT SALE CUỐI TUẦN...)
- Active tab: nền trắng, chữ đỏ, shadow
- Inactive: nền trắng 20%, chữ trắng

**Session Selector:**
- Hiển thị ngày, giờ bắt đầu
- Badge trạng thái: XANH (RUNNING), VÀNG (UPCOMING), XÁM (ENDED)
- Dot xanh nhấp nháy khi đang chạy

**Product Card:**
- Discount badge góc trên trái
- Hình ảnh với hover zoom
- Flash price đỏ to, giá gốc gạch ngang
- Progress bar với icon Zap + % đã bán
- Nút "Mua ngay"

**Slider:**
- Responsive: 2→5 sản phẩm/hàng theo breakpoint
- Swiper Navigation arrows
- Autoplay (tùy chỉnh được)

**Color palette:**
```
Primary Red:    from-red-500 → via-red-600 → to-red-700
Dark Red:       from-red-600 → via-red-700 → to-red-900
Accent Yellow:  bg-yellow-400 / text-yellow-300
Progress Bar:   from-orange-500 → to-red-600
```

### Response DTO mapping

```javascript
// Backend → Frontend
FlashSaleProductDto:
  productId         → product.productId
  productName       → product.productName
  productSlug       → product.productSlug
  thumbnail         → product.thumbnail
  flashPrice        → product.flashPrice
  originalPrice     → product.originalPrice
  discountPercent   → product.discountPercent
  quantity          → product.quantity
  soldQuantity      → product.soldQuantity
  progressPercent   → computed: soldQuantity/quantity*100
```

---

## Files đã tạo mới

### Backend (17 files)

| File | Mô tả |
|------|--------|
| `domain/entity/FlashSaleCampaign.java` | Entity chiến dịch |
| `domain/entity/FlashSaleSession.java` | Entity phiên |
| `domain/entity/FlashSaleProduct.java` | Entity sản phẩm |
| `dto/FlashSaleCampaignDto.java` | DTO response campaign |
| `dto/FlashSaleSessionDto.java` | DTO response session |
| `dto/FlashSaleProductDto.java` | DTO response product |
| `dto/FlashSaleResponseDto.java` | DTO wrapper public API |
| `dto/CreateCampaignRequestDto.java` | Tạo campaign |
| `dto/UpdateCampaignRequestDto.java` | Cập nhật campaign |
| `dto/CreateSessionRequestDto.java` | Tạo session |
| `dto/UpdateSessionRequestDto.java` | Cập nhật session |
| `dto/AddFlashSaleProductRequestDto.java` | Thêm sản phẩm |
| `dto/UpdateFlashSaleProductRequestDto.java` | Cập nhật sản phẩm |
| `repository/FlashSaleCampaignRepository.java` | Repository campaign |
| `repository/FlashSaleSessionRepository.java` | Repository session |
| `repository/FlashSaleProductRepository.java` | Repository product |
| `service/FlashSaleService.java` | Interface service |
| `service/impl/FlashSaleServiceImpl.java` | Implementation service |
| `controller/FlashSaleController.java` | Public controller |
| `controller/FlashSaleAdminController.java` | Admin controller |

### Frontend (8 files)

| File | Mô tả |
|------|--------|
| `components/flash-sale/FlashSaleSection.jsx` | Component chính |
| `components/flash-sale/FlashSaleTabs.jsx` | Tabs chiến dịch |
| `components/flash-sale/FlashSaleDateSelector.jsx` | Chọn ngày/giờ |
| `components/flash-sale/FlashSaleTimeSelector.jsx` | Chọn khung giờ |
| `components/flash-sale/CountdownTimer.jsx` | Countdown flip-clock |
| `components/flash-sale/FlashSaleProductCard.jsx` | Card sản phẩm |
| `components/flash-sale/ProductSlider.jsx` | Swiper slider |
| `components/flash-sale/ProgressBar.jsx` | Thanh tiến trình |

### Files đã sửa

| File | Thay đổi |
|------|-----------|
| `services/flashSaleService.js` | Đổi endpoint từ `/flash-sales/all-active` → `/flash-sales` |
| `pages/Home.jsx` | Dùng `getFlashSaleData()` thay vì `getAllActiveFlashSales()` |
| `components/home/FlashSaleSection.jsx` | Wrapper chuyển hướng sang component mới |

---

## Cách sử dụng

### 1. Chạy backend
```bash
cd BackEnd/phone-store-backend
mvn spring-boot:run
```

### 2. Test API
```bash
# Public - Lấy toàn bộ data
curl http://localhost:8080/api/flash-sales

# Admin - Tạo campaign
curl -X POST http://localhost:8080/api/admin/flash-sales/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "title": "FLASH SALE HÈ 2026",
    "startAt": "2026-05-10T00:00:00",
    "endAt": "2026-05-17T23:59:59"
  }'
```

### 3. Seed sample data (SQL)
```sql
-- Tạo campaign
INSERT INTO flash_sale_campaigns (title, is_active, start_at, end_at)
VALUES ('FLASH SALE HÈ 2026', TRUE, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY));

-- Tạo session trong campaign
INSERT INTO flash_sale_sessions (campaign_id, start_at, end_at, status)
VALUES (1, NOW(), DATE_ADD(NOW(), INTERVAL 4 HOUR), 'RUNNING');

-- Thêm sản phẩm vào session
INSERT INTO flash_sale_products (session_id, variant_id, flash_price, quantity, sold_quantity, limit_per_user, status, sort_order)
VALUES (1, 1, 9990000.00, 100, 0, 2, 'ACTIVE', 0);
```

---

## Tính năng mở rộng (chưa implement)

- [ ] Admin Dashboard cho Flash Sale
- [ ] API mua hàng trong flash sale với kiểm tra limit_per_user
- [ ] Socket/WebSocket cho countdown realtime đa người dùng
- [ ] Thống kê flash sale (lượt xem, tỷ lệ chuyển đổi)
- [ ] Notification khi flash sale sắp bắt đầu
- [ ] Email/SMS reminder cho user đã thêm vào wishlist
