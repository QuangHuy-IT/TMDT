# TMDT - Phone Store E-Commerce Platform

## 1. Project Overview

Dự án thương mại điện tử bán điện thoại di động với:
- **BackEnd**: Spring Boot (Java 17+) với MySQL
- **FrontEnd**: React + Vite + Tailwind CSS
- **Authentication**: JWT + Google OAuth2
- **Payment**: PayOS gateway
- **Storage**: Cloudinary (images)

---

## 2. Technology Stack

### BackEnd
| Category | Technology |
|----------|------------|
| Framework | Spring Boot 3.x |
| Language | Java 17+ |
| Database | MySQL |
| ORM | Spring Data JPA / Hibernate |
| Security | Spring Security + JWT (HS512) |
| Email | Gmail SMTP |
| Payment | PayOS SDK |
| Image Storage | Cloudinary |
| Build | Maven |

### FrontEnd
| Category | Technology |
|----------|------------|
| Framework | React 18+ |
| Build Tool | Vite |
| Routing | React Router v6 |
| State (Server) | TanStack Query v5 |
| State (Client) | React Context API |
| Styling | Tailwind CSS 3 + Custom CSS |
| HTTP Client | Axios |
| UI Components | Custom + Bootstrap 5 |
| Carousel | Swiper.js |
| Rich Text Editor | Tiptap v3 (with lucide-react icons) |

### Tiptap Editor Packages
| Package | Purpose |
|---------|---------|
| @tiptap/react | React integration |
| @tiptap/starter-kit | Basic functionality (bold, italic, lists, headings) |
| @tiptap/extension-image | Image support |
| @tiptap/extension-link | Link support |
| @tiptap/extension-text-align | Text alignment |
| @tiptap/extension-text-style | Text style |
| @tiptap/extension-color | Text color |

---

## 3. Project Structure

### BackEnd Structure
```
BackEnd/phone-store-backend/
├── src/main/java/com/tmdt/phone_store_backend/
│   ├── PhoneStoreApplication.java          # Main class (@EnableAsync)
│   ├── config/                              # Configuration classes
│   ├── controller/                          # REST Controllers
│   ├── domain/
│   │   ├── entity/                          # JPA Entities
│   │   └── enums/                           # Enum types
│   ├── dto/                                 # Data Transfer Objects
│   ├── exception/                           # Exception handling
│   ├── repository/                          # JPA Repositories
│   ├── security/                            # JWT & Security
│   └── service/                             # Business logic
│       └── impl/                            # Service implementations
├── src/main/resources/
│   ├── application.properties               # Database, JWT, Email config
│   └── application-dev.properties          # Dev overrides
└── pom.xml
```

### FrontEnd Structure
```
FrontEnd/
├── src/
│   ├── main.jsx                             # Entry point (QueryClient, Providers)
│   ├── App.jsx                              # Router configuration
│   ├── api/
│   │   └── axiosInstance.js                 # Axios with JWT interceptor
│   ├── components/
│   │   ├── layout/                          # Navbar, Footer, ProtectedRoute
│   │   ├── ui/                              # Reusable UI components
│   │   │   └── RichTextEditor.jsx           # Tiptap rich text editor
│   │   ├── home/                            # Home page sections
│   │   ├── flash-sale/                     # Flash sale components
│   │   └── review/                          # Review components
│   ├── context/
│   │   ├── ShopContext.jsx                 # Cart, Auth state
│   │   └── ThemeContext.jsx                # Light/Dark mode
│   ├── hooks/                              # Custom hooks
│   ├── pages/
│   │   ├── auth/                           # Login, Register, OTP
│   │   ├── admin/                          # Admin pages
│   │   ├── Cart/                           # Cart page
│   │   └── *.jsx                           # Public pages
│   ├── services/                           # API services
│   ├── utils/                             # Utilities
│   └── data/                              # Static mock data
└── index.html
```

---

## 4. Database Entities

### Core Entities
| Entity | Description | Key Fields |
|--------|-------------|------------|
| **User** | Người dùng | email, phone, password, role (USER/ADMIN), status, authSource |
| **Product** | Sản phẩm | name, slug, brand, category, price, descriptions, warranty, featured |
| **ProductVariant** | Biến thể (màu, dung lượng) | color, storage, price, stock |
| **ProductImage** | Hình ảnh sản phẩm | url, publicId |
| **ProductSpecification** | Thông số kỹ thuật | key, value |
| **Category** | Danh mục | name, slug, description, image |
| **Brand** | Thương hiệu | name, slug, logo, country |
| **Order** | Đơn hàng | user, totalAmount, status, paymentMethod, shippingAddress |
| **OrderItem** | Chi tiết đơn hàng | product, variant, quantity, price |
| **OrderStatusHistory** | Lịch sử trạng thái | status, note, timestamp |
| **PendingOrder** | Đơn tạm (trước thanh toán) | orderData, paymentData |

### E-Commerce Entities
| Entity | Description | Key Fields |
|--------|-------------|------------|
| **Cart** | Giỏ hàng | user, items |
| **CartItem** | Item trong giỏ | product, variant, quantity |
| **Wishlist** | Danh sách yêu thích | user, items |
| **WishlistItem** | Item wishlist | product |
| **Review** | Đánh giá sản phẩm | user, product, rating, content |
| **ReviewOrder** | Link review -> order | review, order |
| **Voucher** | Mã giảm giá | code, discountType, discountValue, minOrderValue |
| **VoucherUsage** | Lượt sử dụng voucher | voucher, user, order |

### Marketing Entities
| Entity | Description | Key Fields |
|--------|-------------|------------|
| **Banner** | Banner quảng cáo | title, image, link, position, type, active |
| **FlashSaleCampaign** | Chiến dịch flash sale | name, startDate, endDate, status |
| **FlashSaleSession** | Phiên flash sale | startTime, endTime, status |
| **FlashSaleProduct** | Sản phẩm flash sale | product, session, originalPrice, salePrice, quantity |

### Support Entities
| Entity | Description | Key Fields |
|--------|-------------|------------|
| **UserAddress** | Địa chỉ giao hàng | user, province, district, ward, address, isDefault |
| **Inventory** | Tồn kho | variant, quantity, reserved |
| **InventoryMovement** | Lịch sử kho | type, quantity, reference, note |
| **News** | Tin tức | title, slug, content, thumbnail, category |

---

## 5. API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Đăng ký tài khoản |
| POST | `/login` | Đăng nhập |
| POST | `/google` | Đăng nhập Google OAuth |
| POST | `/verify-otp` | Xác thực OTP |
| POST | `/resend-otp` | Gửi lại OTP |
| POST | `/refresh-token` | Làm mới JWT |
| POST | `/logout` | Đăng xuất |
| POST | `/forgot-password` | Quên mật khẩu |
| POST | `/reset-password` | Đặt lại mật khẩu |

### User (`/api/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Lấy thông tin profile |
| PUT | `/profile` | Cập nhật profile |
| PUT | `/avatar` | Cập nhật avatar |
| PUT | `/change-password` | Đổi mật khẩu |
| GET | `/addresses` | Danh sách địa chỉ |
| POST | `/addresses` | Thêm địa chỉ |
| PUT | `/addresses/:id` | Cập nhật địa chỉ |
| DELETE | `/addresses/:id` | Xóa địa chỉ |
| GET | `/reviews` | Danh sách đánh giá của user |

### Products (`/api/products`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Danh sách sản phẩm (public) |
| GET | `/:slug` | Chi tiết sản phẩm |
| GET | `/featured` | Sản phẩm nổi bật |
| GET | `/flash-sale` | Sản phẩm flash sale |

### Admin Products (`/api/admin/products`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Danh sách (phân trang, filter) |
| GET | `/:id` | Chi tiết |
| POST | `/` | Tạo sản phẩm |
| PUT | `/:id` | Cập nhật |
| DELETE | `/:id` | Xóa |
| POST | `/:id/images` | Upload hình ảnh |
| POST | `/:id/variants` | Thêm biến thể |
| PUT | `/:id/variants/:variantId` | Cập nhật biến thể |
| DELETE | `/:id/variants/:variantId` | Xóa biến thể |

### Orders (`/api/orders`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Danh sách đơn hàng của user |
| GET | `/:id` | Chi tiết đơn hàng |
| POST | `/` | Tạo đơn hàng |
| PUT | `/:id/cancel` | Hủy đơn hàng |
| PUT | `/:id/return` | Yêu cầu hoàn trả |

### Admin Orders (`/api/admin/orders`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Danh sách (phân trang, filter) |
| GET | `/:id` | Chi tiết |
| PUT | `/:id/status` | Cập nhật trạng thái |
| PUT | `/:id/confirm` | Xác nhận đơn hàng |
| PUT | `/:id/ship` | Giao hàng |
| PUT | `/:id/deliver` | Giao thành công |

### Flash Sale (`/api/flash-sales`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Danh sách chiến dịch |
| GET | `/current` | Chiến dịch đang hoạt động |
| GET | `/:id` | Chi tiết chiến dịch |
| GET | `/sessions/:id/products` | Sản phẩm theo phiên |

### Admin Flash Sale (`/api/admin/flash-sales`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/campaigns` | Danh sách chiến dịch |
| POST | `/campaigns` | Tạo chiến dịch |
| PUT | `/campaigns/:id` | Cập nhật chiến dịch |
| GET | `/campaigns/:id/sessions` | Phiên của chiến dịch |
| POST | `/sessions` | Tạo phiên |
| PUT | `/sessions/:id` | Cập nhật phiên |
| GET | `/sessions/:id/products` | Sản phẩm trong phiên |
| POST | `/products` | Thêm sản phẩm vào phiên |
| PUT | `/products/:id` | Cập nhật sản phẩm flash sale |
| DELETE | `/products/:id` | Xóa sản phẩm khỏi phiên |

### Other Endpoints
| Category | Endpoint | Description |
|----------|----------|-------------|
| Categories | `/api/categories` | Danh mục sản phẩm |
| Brands | `/api/brands`, `/api/admin/brands` | Thương hiệu |
| Reviews | `/api/reviews`, `/api/users/reviews` | Đánh giá sản phẩm |
| Banners | `/api/banners`, `/api/admin/banners` | Banner quảng cáo |
| Vouchers | `/api/vouchers/validate`, `/api/admin/vouchers` | Mã giảm giá |
| Payment | `/api/payment/create` | Tạo thanh toán PayOS |
| Upload | `/cloudinary/upload` | Upload hình ảnh |
| News | `/api/news`, `/api/admin/news` | Tin tức |
| Inventory | `/api/admin/inventory` | Quản lý tồn kho |

---

## 6. Enums Reference

```java
// User
enum UserRole { USER, ADMIN }
enum UserStatus { ACTIVE, INACTIVE, SUSPENDED }
enum AuthSource { LOCAL, GOOGLE }

// Product
enum ProductStatus { DRAFT, PUBLISHED, ARCHIVED }

// Order
enum OrderStatus { PENDING, CONFIRMED, SHIPPING, SHIPPED, DELIVERED, CANCELLED, RETURNED }
enum PaymentMethod { COD, PAYOS, BANK_TRANSFER }
enum PaymentStatus { UNPAID, PAID, REFUNDED }

// Voucher
enum VoucherDiscountType { PERCENTAGE, FIXED_AMOUNT }

// Inventory
enum StockStatus { IN_STOCK, LOW_STOCK, OUT_OF_STOCK }
enum InventoryMovementType { IMPORT, EXPORT, ADJUSTMENT }
enum InventoryReferenceType { ORDER, RETURN, MANUAL }
```

---

## 7. Security

### JWT Configuration
- **Algorithm**: HS512
- **Expiration**: 24 hours (access token)
- **Refresh**: 7 days (refresh token)
- **Secret**: Configured in `application.properties`

### Role-Based Access
| Role | Access |
|------|--------|
| **USER** | Public endpoints, own profile, own orders |
| **ADMIN** | All user access + `/api/admin/**` |

### Protected Routes (Frontend)
- `/cart`, `/checkout`, `/orders`, `/order/:id`, `/profile`
- All `/admin/*` routes

---

## 8. FrontEnd State Management

### ShopContext (Cart + Auth)
```javascript
// Actions
ADD_TO_CART, UPDATE_CART_QUANTITY, REMOVE_FROM_CART, CLEAR_CART
LOGIN_SUCCESS, LOGOUT, PLACE_ORDER, REFRESH_TOKEN_SUCCESS

// State
{ isAuthenticated, user, token, refreshToken, cart }
```

### ThemeContext
- Light/Dark mode toggle
- Persisted to localStorage

### React Query Keys
```
['heroBanners'], ['sidebarBanners']
['flashSaleData'], ['flashSaleCampaigns']
['allProducts'], ['product', slug], ['featuredProducts']
['allBrands'], ['brand', slug]
['categories'], ['category', slug]
['productReviews', productId]
['userOrders'], ['order', id]
['adminProducts'], ['adminProduct', id]
['adminOrders'], ['adminOrder', id]
['adminUsers']
['adminBanners'], ['adminVouchers']
['news'], ['newsDetail', slug]
```

---

## 9. API Request/Response Patterns

### Axios Configuration
```javascript
// Base URL from env: VITE_API_BASE_URL (default: http://localhost:8080/api)
// Auto-inject Authorization header
// Auto-refresh token on 401
```

### Standard Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Success"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": { "field": "error message" }
}
```

---

## 10. Environment Variables

### Backend (`application.properties`)
```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/phone_store
spring.datasource.username=root
spring.datasource.password=123456

# JWT
jwt.secret=<secret-key>
jwt.expiration=86400000

# Email
spring.mail.username=<gmail>
spring.mail.password=<app-password>

# Cloudinary
cloudinary.cloud-name=<name>
cloudinary.api-key=<key>
cloudinary.api-secret=<secret>

# PayOS
payos.client-id=<id>
payos.api-key=<key>
payos.checksum-key=<key>
```

### FrontEnd (`.env`)
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

---

## 11. Database Schema (MySQL)

```sql
-- Key tables
users, products, categories, brands
product_variants, product_images, product_specifications
orders, order_items, order_status_histories
carts, cart_items, wishlists, wishlist_items
reviews, vouchers, voucher_usages
banners, flash_sale_campaigns, flash_sale_sessions, flash_sale_products
inventories, inventory_movements
user_addresses, news
```

---

## 12. Existing Features

| Feature | Status |
|---------|--------|
| User Registration/Login | ✅ Done |
| Google OAuth | ✅ Done |
| JWT Authentication | ✅ Done |
| OTP Verification | ✅ Done |
| Product Management | ✅ Done |
| Category/Brand Management | ✅ Done |
| Shopping Cart | ✅ Done |
| Order Processing | ✅ Done |
| PayOS Payment | ✅ Done |
| Flash Sales | ✅ Done |
| Vouchers | ✅ Done |
| Product Reviews | ✅ Done |
| Banners | ✅ Done |
| Inventory Management | ✅ Done |
| **News/Blog** | ✅ Done (Tiptap Editor) |
| Image Upload (Cloudinary) | ✅ Done |
| Email Notifications | ✅ Done |
| Dark Mode | ✅ Done |

---

## 13. Coding Conventions

### Backend (Java)
- **Package**: `com.tmdt.phone_store_backend`
- **Entity**: JPA annotations, Builder pattern (Lombok)
- **Service**: Interface + Implementation pattern
- **DTO**: Separate request/response DTOs
- **Naming**: camelCase for fields, PascalCase for classes

### FrontEnd (React)
- **Components**: PascalCase filename and component name
- **Hooks**: use prefix, camelCase
- **Services**: camelCase, async/await
- **Styling**: Tailwind classes + custom CSS variables

---

## 14. How to Build New Features

### Checklist for New Feature

1. **BackEnd**
   - [ ] Create Entity if needed
   - [ ] Create DTOs (Request/Response)
   - [ ] Create Repository
   - [ ] Create Service (Interface + Implementation)
   - [ ] Create Controller
   - [ ] Add security config if needed

2. **FrontEnd**
   - [ ] Create Service (API calls)
   - [ ] Create Page Component
   - [ ] Create UI Components if needed
   - [ ] Add Routes in App.jsx
   - [ ] Add React Query hooks if needed
   - [ ] Add Admin menu item if admin feature

3. **Documentation**
   - Update this file with new endpoints
   - Update entity table
   - Update feature list

---

## 15. Quick Reference

### Common Ports
| Service | Port |
|---------|------|
| MySQL | 3306 |
| Backend (Spring Boot) | 8080 |
| Frontend (Vite) | 5173 / 5174 |

### Key URLs
| URL | Description |
|-----|-------------|
| http://localhost:5173 | Frontend Dev |
| http://localhost:8080/api | Backend API |
| http://localhost:8080/swagger-ui.html | API Documentation |

### Default Admin Account
- Email: admin@tmdt.com
- Password: admin123

---

*Document generated: 2026-05-16*
*Last updated: 2026-05-16*
*Project: TMDT Phone Store E-Commerce*

---

## 16. Recent Changes (2026-05-16)

### Bug Fixes
| Issue | Fix |
|-------|-----|
| React-quill-new removed | Replaced with Tiptap v3 |
| react-icons packages conflict | Removed unused icon packages |
| Default exports error in Tiptap | Changed to named exports (`{ Image }` instead of `Image`) |
| Component import mismatch | Unified RichTextEditor as TiptapEditor |

### Files Modified
- `FrontEnd/src/components/ui/RichTextEditor.jsx` - Rewrote with Tiptap v3 named exports
- `FrontEnd/src/pages/admin/AdminProducts.jsx` - Updated import to use TiptapEditor
- `FrontEnd/src/pages/admin/AdminNews.jsx` - Updated import to use TiptapEditor
