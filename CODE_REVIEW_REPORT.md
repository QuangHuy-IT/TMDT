# CODE REVIEW REPORT - TMDT E-Commerce Project

**Project:** TMDT Phone Store  
**Review Date:** May 29, 2026  
**Reviewer:** Senior Software Engineer  
**Scope:** Backend (Spring Boot) + Frontend (React)

---

## Executive Summary

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Architecture** | ⭐⭐⭐⭐ | Good layered architecture with clear separation |
| **Backend Code Quality** | ⭐⭐⭐ | Solid foundation, some security and logic issues |
| **Frontend Code Quality** | ⭐⭐⭐ | Well-structured components, needs optimization |
| **Security** | ⭐⭐ | Multiple critical security issues found |
| **Database Design** | ⭐⭐⭐⭐ | Well-normalized with proper indexes |
| **Testing Coverage** | ⭐ | No unit/integration tests found |

**Overall Production Readiness:** 55% ⚠️  
**Recommendation:** Needs critical fixes before production deployment.

---

## 1. ARCHITECTURE & STRUCTURE

### 1.1 Project Structure

```
BackEnd/phone-store-backend/
├── config/           # Configuration classes
├── controller/       # REST controllers (32 files)
├── domain/
│   ├── entity/       # JPA entities (35 files)
│   └── enums/        # Enum types
├── dto/              # Data Transfer Objects
├── exception/       # Exception handling
├── repository/      # JPA repositories (28 files)
├── security/        # JWT, filters
└── service/         # Business logic (28 files)

FrontEnd/src/
├── api/             # Axios configuration
├── components/      # Reusable UI components
├── context/         # React contexts
├── hooks/          # Custom hooks
├── pages/          # Page components
│   ├── admin/       # Admin dashboard pages
│   ├── auth/        # Authentication pages
│   └── Cart/        # Cart related pages
└── services/       # API service modules
```

### 1.2 Strengths

✅ Clear layered architecture (Controller → Service → Repository)  
✅ Consistent naming conventions  
✅ Proper use of DTOs for API communication  
✅ Separation of public and admin APIs  

### 1.3 Issues

⚠️ **Code Duplication:** Multiple services have similar DTO mapping logic repeated  
⚠️ **Service Naming:** `ProductAdminService` serves both public and admin APIs, violating Single Responsibility

---

## 2. BACKEND REVIEW

### 2.1 API Design

#### RESTful Convention Violations

| Issue | Severity | Description |
|-------|----------|-------------|
| Admin Auth | 🔴 CRITICAL | `/api/admin/auth/**` is `permitAll()` but requires ADMIN role |
| Order Access | 🔴 CRITICAL | `/api/orders/**` is fully public without ownership validation |
| User Orders | 🟠 HIGH | `GET /api/orders/user/{userId}` exposes all orders of any user |

**Files:** `SecurityConfig.java` lines 99, 121

```java
// CRITICAL: Orders are public - anyone can access any order!
.requestMatchers("/api/orders/**").permitAll()

// PROBLEM: Admin auth is also public!
.requestMatchers("/api/admin/auth/**").permitAll()
```

#### API Design Issues

| Endpoint | Issue | Severity |
|----------|-------|----------|
| `POST /api/orders/place` | Accepts `userId` from client body | 🔴 CRITICAL |
| `PATCH /api/orders/{code}/cancel` | Takes `userId` as query param | 🔴 CRITICAL |
| `DELETE /api/orders/{code}` | Takes `userId` as query param | 🔴 CRITICAL |
| `GET /api/orders/user/{userId}` | No authorization check | 🔴 CRITICAL |

**File:** `OrderController.java`

```java
// INSECURE: userId comes from URL, not from authenticated user
@GetMapping("/user/{userId}")
public ResponseEntity<List<OrderDto>> getOrdersByUser(@PathVariable Long userId) {
    return ResponseEntity.ok(orderService.getOrdersByUserId(userId));
}

// INSECURE: userId in query param can be spoofed
@PatchMapping("/{orderCode}/cancel")
public ResponseEntity<OrderDto> cancelOrder(
        @PathVariable String orderCode,
        @RequestParam Long userId) {  // ← Should come from JWT token
    return ResponseEntity.ok(orderService.cancelOrder(orderCode, userId));
}
```

### 2.2 Security Issues

#### 🔴 CRITICAL: IDOR (Insecure Direct Object Reference)

**Issue:** Order endpoints accept `userId` from request, allowing attackers to access/cancel any user's orders.

**Attack Scenario:**
```bash
# Attacker can cancel any order
curl -X PATCH "http://localhost:8080/api/orders/ORD123/cancel?userId=456"
```

**Fix Required:** Extract userId from JWT token in controller:

```java
@GetMapping("/user/{userId}")
public ResponseEntity<List<OrderDto>> getOrdersByUser() {
    // Get userId from SecurityContext instead of URL
    String email = SecurityContextHolder.getContext().getAuthentication().getName();
    User user = userService.getUserByEmail(email);
    return ResponseEntity.ok(orderService.getOrdersByUserId(user.getId()));
}
```

#### 🔴 CRITICAL: Voucher Usage Not Tracked

**Issue:** Voucher `usedCount` is never incremented when orders are placed.

**File:** `OrderPlacementServiceImpl.java` lines 56-58

```java
Voucher voucher = null;
if (request.getVoucherId() != null) {
    voucher = voucherRepository.findById(request.getVoucherId()).orElse(null);
}
// voucher is found but NEVER updated!
```

**Impact:** Vouchers can be used unlimited times despite `usageLimit` setting.

**Fix Required:**
```java
// After order is saved successfully
if (voucher != null) {
    voucher.setUsedCount(voucher.getUsedCount() + 1);
    voucherRepository.save(voucher);
}
```

#### 🔴 CRITICAL: Total Amount Not Validated

**Issue:** `totalAmount` is accepted from frontend without server-side validation.

**File:** `OrderPlacementServiceImpl.java` line 70

```java
order.setTotalAmount(request.getTotalAmount()); // ← Trusting client!
```

**Fix Required:** Calculate totalAmount server-side:
```java
BigDecimal calculatedTotal = subtotal
    .subtract(discountAmount)
    .add(shippingFee);
// Validate: Math.abs(calculatedTotal.subtract(request.getTotalAmount())) < 0.01
```

#### 🟠 HIGH: CORS Configuration Too Permissive

**File:** `SecurityConfig.java` lines 135-151

```java
configuration.setAllowedOrigins(
    Arrays.asList("http://localhost:3000", "http://localhost:5173",
            "http://localhost:5174")); // ← Only dev environments
```

**Issue:** Production URLs are not configured; CORS headers hardcoded.

**Fix Required:** Use environment variables for allowed origins.

#### 🟠 HIGH: Missing Rate Limiting

**Issue:** No rate limiting on authentication endpoints.

**Risk:** Brute force attacks on `/api/auth/login`, `/api/auth/otp/*`

#### 🟡 MEDIUM: JWT Secret Validation Only at Startup

**File:** `JwtTokenProvider.java` lines 152-159

```java
private SecretKey getSigningKey() {
    byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
    return Keys.hmacShaKeyFor(keyBytes);
}
```

**Issue:** Only validates on first use. If secret is misconfigured, error appears late.

### 2.3 Exception Handling

#### ✅ GlobalExceptionHandler Coverage

Good coverage with typed exceptions:
- `ResourceNotFoundException`
- `BadRequestException`
- `ResourceAlreadyExistsException`
- `InvalidCredentialsException`
- `UnauthorizedException`

**File:** `GlobalExceptionHandler.java`

#### ⚠️ Missing Exception Types

| Exception | Severity | Description |
|----------|----------|-------------|
| `AccessDeniedException` | 🟠 HIGH | Not handled (Spring throws this) |
| `HttpMediaTypeNotSupportedException` | 🟡 MEDIUM | Missing content-type handling |
| `ConstraintViolationException` | 🟡 MEDIUM | For @Valid on query params |

### 2.4 Validation

#### ✅ Good Practices

- Using Jakarta Validation annotations (`@Valid`)
- Custom exception messages in Vietnamese
- Input sanitization in services

#### ⚠️ Missing Validations

| Field | Location | Missing |
|--------|----------|---------|
| `email` | RegisterRequestDto | Format regex |
| `phone` | RegisterRequestDto | Format regex (Vietnamese: 0-9, 10 digits) |
| `orderCode` | CreateOrderRequestDto | Pattern validation |
| `price` | AdminProductVariantRequestDto | Min/max range |

### 2.5 Transaction Handling

#### ✅ Good: @Transactional Annotations

Services properly use `@Transactional` for:
- Order creation
- Product updates
- Voucher operations

#### ⚠️ Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| No rollback specifications | 🟡 MEDIUM | Default rollback on any RuntimeException |
| Missing transaction boundaries | 🟡 MEDIUM | Some multi-step operations should be atomic |

**File:** `OrderPlacementServiceImpl.java` lines 46-47

```java
@Override
@Transactional  // Good, but should specify rollbackFor
public OrderDto createOrder(CreateOrderRequestDto request) {
```

### 2.6 Database Query Optimization

#### 🔴 CRITICAL: N+1 Query Problem

**File:** `ProductAdminService.java` lines 119-127

```java
return productRepository.findByDeletedAtIsNullOrderByCreatedAtDesc().stream()
    .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
    .map(this::toSingleDto)  // ← N calls inside
    .filter(dto -> dto.getReviewCount() != null && dto.getReviewCount() > 0)
```

**Inside `toSingleDto` → `applyReviewStats`:**
```java
Double averageRating = reviewRepository.getAverageRatingByProductId(productId);
Long reviewCount = reviewRepository.countApprovedByProductId(productId);
```

**Impact:** For 100 products = 201 database queries!

**Fix Required:** Use JOIN FETCH or batch query:
```java
@Query("SELECT DISTINCT p FROM Product p " +
       "LEFT JOIN FETCH p.reviews r " +
       "WHERE p.deletedAt IS NULL")
List<Product> findAllWithReviews();
```

### 2.7 Logging

#### ✅ Good Practices

- SLF4J with `@Slf4j` annotation
- Request/response logging
- Error logging with stack traces

#### ⚠️ Missing

| Missing | Severity | Description |
|---------|----------|-------------|
| Audit logging | 🟠 HIGH | Who changed what, when |
| Performance logging | 🟡 MEDIUM | Slow query detection |
| Structured logging | 🟡 MEDIUM | JSON format for ELK stack |

---

## 3. FRONTEND REVIEW

### 3.1 Component Structure

#### ✅ Good Practices

- Functional components with hooks
- Separation of presentational and container components
- Good folder organization
- Reusable UI components (`Button`, `Badge`, `Modal`)

#### ⚠️ Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| Missing loading states | 🟡 MEDIUM | Some components lack skeleton loaders |
| Inconsistent error UI | 🟡 MEDIUM | Error handling varies across pages |

### 3.2 State Management

#### 🟡 MEDIUM: Multiple Context Providers

**File:** `App.jsx` lines 132-226

```jsx
<ThemeProvider>
  <ShopProvider>
    <AdminAuthProvider>
      {/* Routes */}
    </AdminAuthProvider>
  </ShopProvider>
</ThemeProvider>
```

**Issue:** `AdminAuthProvider` inside `ShopProvider` - admin auth should be separate.

#### 🔴 CRITICAL: displayName ReferenceError

**File:** `ProductDetail.jsx` lines 334-364

```jsx
const addToCart = () => {
    // ...
    dispatch({
        type: 'ADD_TO_CART',
        payload: {
            name: displayName,  // ← ReferenceError! displayName not defined yet
            // ...
        }
    });
}

const displayName = formatVariantName(product.name, selectedVariant);  // ← Defined HERE
```

**Fix Required:** Move `displayName` declaration before `addToCart` function.

### 3.3 API Calling Logic

#### ✅ Good Practices

- Centralized Axios instance with interceptors
- JWT token handling in request interceptor
- Token refresh logic in response interceptor

**File:** `axiosInstance.js` lines 16-88

```javascript
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

#### 🟠 HIGH: Token Refresh Security Issue

**File:** `axiosInstance.js` lines 54-84

```javascript
// Refresh token call doesn't use the api instance (no auth header)
const response = await axios.post(
    `${API_BASE_URL}/auth/refresh-token`,
    { refreshToken }
);
```

**Issue:** This call bypasses the interceptor, which is actually correct but should be documented.

### 3.4 Re-render Optimization

#### 🟡 MEDIUM: Missing React.memo and useMemo

**File:** `Home.jsx` lines 13-157

```jsx
export const Home = () => {
    // All useQuery results cause re-renders
    const { data: heroBanners } = useQuery({...});
    const { data: flashSaleData } = useQuery({...});
    // ...
};
```

**Issue:** No memoization for child components. Consider wrapping components with `React.memo`.

#### 🟡 MEDIUM: useEffect Dependency Array

**File:** `ProductDetail.jsx` lines 146-180

```jsx
useEffect(() => {
    // ...
}, [slug, searchParams, productIdParam]);  // ← searchParams is object, recreates every render
```

**Fix Required:** Use `useSearchParams` hook properly or extract only needed params.

### 3.5 Error Handling

#### ✅ Good Practices

- Global error boundary in App.jsx
- Error states in components
- User-friendly error messages

#### ⚠️ Missing

| Missing | Severity | Description |
|---------|----------|-------------|
| Global error toast notifications | 🟡 MEDIUM | No toast library |
| Network error handling | 🟡 MEDIUM | Some API calls silently fail |
| Offline mode support | 🟡 MEDIUM | No service worker |

### 3.6 Form Validation

#### 🟡 MEDIUM: Inconsistent Validation

**File:** `Checkout.jsx` → `useCheckout.js` lines 132-158

```javascript
const validateShippingInfo = useCallback(() => {
    if (!shippingInfo.receiverName?.trim()) {
        setError('Vui lòng nhập họ tên người nhận.');
        return false;
    }
    if (!/^\d{9,11}$/.test(shippingInfo.receiverPhone.replace(/\s/g, ''))) {
        setError('Số điện thoại không hợp lệ (9–11 chữ số).');
        return false;
    }
    // ...
}, [shippingInfo]);
```

**Issue:** Regex allows 9-11 digits, but Vietnamese phone numbers are 10 digits starting with 0.

### 3.7 Responsive UI

#### ✅ Good Practices

- Tailwind CSS utility classes
- Mobile-first design approach
- Breakpoints: `sm`, `md`, `lg`, `xl`

#### ⚠️ Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| No touch-optimized buttons | 🟡 MEDIUM | Some buttons too small for mobile |
| Missing viewport meta in some pages | 🟡 MEDIUM | May cause zoom issues on iOS |

### 3.8 Security Issues (Frontend)

#### 🟠 HIGH: Sensitive Data in localStorage

**File:** `ShopContext.jsx` lines 13-27

```javascript
const initialState = {
    cart: (JSON.parse(localStorage.getItem('cart')) || []),
    isAuthenticated: localStorage.getItem('token') ? true : false,
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
```

**Issue:** Tokens stored in localStorage are vulnerable to XSS attacks.

**Recommendation:** Use httpOnly cookies for tokens (requires backend changes).

#### 🟡 MEDIUM: No input sanitization

**Issue:** `dangerouslySetInnerHTML` used in ProductDetail without sanitization.

**File:** `ProductDetail.jsx` line 467

```jsx
<div dangerouslySetInnerHTML={{ __html: product.description }} />
```

### 3.9 Accessibility (A11y)

#### 🟡 MEDIUM: Missing ARIA Labels

```jsx
<button className="...">−</button>  // Missing aria-label
<button className="...">×</button>  // Missing aria-label
```

#### 🟡 MEDIUM: Color Contrast

Some text colors may not meet WCAG 2.1 AA standards (4.5:1 ratio).

#### 🟡 MEDIUM: Keyboard Navigation

| Issue | Severity | Description |
|-------|----------|-------------|
| Modal focus trap missing | 🟡 MEDIUM | Focus can escape modal |
| Skip links missing | 🟡 MEDIUM | No "Skip to content" link |
| Tab order not tested | 🟡 MEDIUM | May be confusing |

### 3.10 Code Quality Issues

#### 🔴 CRITICAL: Dead Code in ShopContext

**File:** `ShopContext.jsx` lines 22-24

```javascript
orders: JSON.parse(localStorage.getItem('orders')) || [
    { id: 'HD9421', date: '12/03/2026', total: 25900000, status: 'Đang giao', items: 2 },
],  // ← Hardcoded mock data should be removed
```

#### 🟡 MEDIUM: Unused Code Detection

```javascript
// In useCheckout.js - variable declared but not used
const [selectedAddressId, setSelectedAddressId] = useState(null);
```

#### 🟡 MEDIUM: Magic Numbers

| Location | Issue | Value |
|----------|-------|-------|
| `useCheckout.js` line 79 | Shipping fee threshold | `500000` |
| `useCheckout.js` line 79 | Free shipping threshold | `30000` |

**Fix:** Extract to constants:
```javascript
const FREE_SHIPPING_THRESHOLD = 500000;
const SHIPPING_FEE = 30000;
```

---

## 4. CODE QUALITY

### 4.1 SOLID Principles Assessment

| Principle | Score | Notes |
|----------|-------|-------|
| **S**ingle Responsibility | ⭐⭐⭐ | Some classes have mixed concerns |
| **O**pen/Closed | ⭐⭐⭐ | Good use of interfaces |
| **L**iskov Substitution | ⭐⭐⭐⭐ | Proper inheritance |
| **I**nterface Segregation | ⭐⭐⭐⭐ | Good interface design |
| **D**ependency Inversion | ⭐⭐⭐ | Good DI via Spring |

### 4.2 Naming Conventions

#### ✅ Consistent Patterns
- Java: `camelCase` for variables, `PascalCase` for classes
- JavaScript: `camelCase` for functions, `PascalCase` for components
- Database: `snake_case` for columns/tables

#### ⚠️ Inconsistencies

| Issue | Location | Example |
|-------|----------|---------|
| Vietnamese vs English | Throughout | `ReceiverName` vs `receiverName` in DTOs |
| Abbreviations | `ProductAdminService` | Should be `AdminProductService` |
| Enum naming | `OrderStatus` | Values are ENUM format vs camelCase |

### 4.3 Dead Code & Unused Imports

```javascript
// FrontEnd/src/App.jsx
import { ScrollToTop } from './components/home/ScrollToTop';  // Used
import './App.css';  // May be unused (Tailwind handles styling)

// BackEnd - Multiple DTOs may not be used
```

---

## 5. TESTING

### 5.1 Current State

❌ **No unit tests found**  
❌ **No integration tests**  
❌ **No e2e tests**

### 5.2 Recommended Test Coverage

| Layer | Priority | Coverage Target |
|-------|----------|------------------|
| Service layer | 🔴 CRITICAL | 80% |
| Controller layer | 🟠 HIGH | 70% |
| Repository layer | 🟠 HIGH | 60% |
| Frontend components | 🟡 MEDIUM | 50% |

### 5.3 Missing Test Cases

#### Backend (Critical)

| Test Case | Priority |
|-----------|----------|
| Voucher usage limit validation | 🔴 CRITICAL |
| Order creation with stock check | 🔴 CRITICAL |
| JWT token expiration handling | 🔴 CRITICAL |
| Price manipulation prevention | 🔴 CRITICAL |
| User ownership validation | 🔴 CRITICAL |

#### Frontend (High Priority)

| Test Case | Priority |
|-----------|----------|
| Add to cart flow | 🟠 HIGH |
| Checkout form validation | 🟠 HIGH |
| Authentication flow | 🟠 HIGH |
| Order cancellation | 🟠 HIGH |

---

## 6. EDGE CASES NOT HANDLED

### 6.1 Backend Edge Cases

| Edge Case | Severity | Description |
|-----------|----------|-------------|
| Concurrent voucher redemption | 🔴 CRITICAL | Race condition on usedCount increment |
| Stock goes negative | 🔴 CRITICAL | No check during order placement |
| Price changes during checkout | 🔴 CRITICAL | No optimistic locking |
| Token refresh race | 🟠 HIGH | Multiple concurrent refresh calls |
| Admin bulk operations | 🟠 HIGH | Partial failure handling |

### 6.2 Frontend Edge Cases

| Edge Case | Severity | Description |
|-----------|----------|-------------|
| Offline add to cart | 🟠 HIGH | Data loss on refresh |
| Tab navigation | 🟠 HIGH | State not preserved |
| Multiple tabs | 🟠 HIGH | Cart sync issues |
| Session timeout mid-checkout | 🟡 MEDIUM | Lost form data |

---

## 7. CRITICAL ISSUES REQUIRING IMMEDIATE FIX

### Priority 1: Security (Fix Before Production)

| # | Issue | Impact | Fix Complexity |
|---|-------|--------|----------------|
| 1 | IDOR in order endpoints | Any user can access/cancel orders | Medium |
| 2 | Voucher unlimited usage | Revenue loss | Low |
| 3 | Total amount from client | Price manipulation | Medium |
| 4 | Tokens in localStorage | XSS token theft | High (requires httpOnly cookies) |

### Priority 2: Logic Bugs (Fix Before Production)

| # | Issue | File | Fix Complexity |
|---|-------|------|----------------|
| 1 | displayName ReferenceError | ProductDetail.jsx | Low |
| 2 | Reorder missing brand | OrderDetail.jsx | Low |
| 3 | Voucher minOrderAmount | VoucherServiceImpl.java | Low |

### Priority 3: Performance (Fix Before Launch)

| # | Issue | Impact | Fix Complexity |
|---|-------|--------|----------------|
| 1 | N+1 queries in products | Slow page load | Medium |
| 2 | No query result caching | High DB load | Low |
| 3 | Missing database indexes | Slow queries | Low |

---

## 8. RECOMMENDATIONS

### 8.1 Immediate Actions

1. **Fix Security Issues** (Week 1)
   - Implement server-side userId extraction from JWT
   - Add voucher usedCount increment
   - Validate totalAmount server-side
   - Move tokens to httpOnly cookies

2. **Fix Critical Bugs** (Week 1)
   - Fix displayName ReferenceError
   - Add missing brand field in reorder

3. **Add Basic Tests** (Week 2)
   - Voucher usage tests
   - Order creation tests
   - Authentication flow tests

### 8.2 Short-term Improvements (2-4 weeks)

1. **Performance Optimization**
   - Implement query result caching
   - Add database indexes for hot queries
   - Optimize N+1 queries

2. **Error Handling**
   - Add global error boundary
   - Implement error toast notifications
   - Add comprehensive logging

3. **Monitoring**
   - Add application metrics (Micrometer)
   - Set up health check endpoints
   - Configure alerting

### 8.3 Long-term Roadmap

1. **Microservices Architecture** (If scaling)
   - Split into: User Service, Product Service, Order Service
   - Implement API Gateway
   - Add message queue for async operations

2. **Advanced Features**
   - Real-time notifications (WebSocket)
   - Advanced analytics dashboard
   - A/B testing framework

3. **DevOps Improvements**
   - CI/CD pipeline
   - Container orchestration (K8s)
   - Database migration automation

---

## 9. POSITIVE HIGHLIGHTS

### 9.1 What Works Well

✅ **Clean Architecture:** Clear separation between layers  
✅ **DTO Pattern:** Good use of DTOs for API contracts  
✅ **Validation:** Comprehensive input validation using Jakarta Validation  
✅ **Error Handling:** Global exception handler with typed exceptions  
✅ **Modern Frontend:** Good use of React Query for data fetching  
✅ **Type Safety:** Using TypeScript-like patterns in Java with Lombok  
✅ **Database Design:** Well-normalized schema with proper indexes  
✅ **Soft Deletes:** Consistent use of `deletedAt` for data recovery  
✅ **Security Basics:** BCrypt password hashing, JWT authentication  
✅ **Responsive UI:** Mobile-first design with Tailwind CSS  

### 9.2 Best Practices Implemented

```java
// Good: Use of Builder pattern for DTOs
return OrderDto.builder()
    .id(order.getId())
    .orderCode(order.getOrderCode())
    // ...
    .build();

// Good: Proper use of Optional
User user = userRepository.findByEmail(email)
    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

// Good: Consistent error response format
public record ErrorResponse(
    LocalDateTime timestamp,
    int status,
    String error,
    String message,
    String path
) {}
```

---

## APPENDIX: FILE REFERENCE

### Critical Security Files

| File | Issues |
|------|--------|
| `SecurityConfig.java` | Public access to orders/admin |
| `OrderController.java` | IDOR vulnerability |
| `OrderPlacementServiceImpl.java` | Voucher not tracked, no price validation |
| `JwtTokenProvider.java` | Token validation only at runtime |

### Critical Frontend Files

| File | Issues |
|------|--------|
| `ProductDetail.jsx` | ReferenceError, useEffect dependencies |
| `useCheckout.js` | Total calculated on client |
| `ShopContext.jsx` | Tokens in localStorage, dead code |
| `axiosInstance.js` | No CSRF protection |

### Database Schema Quality

| Table | Issues |
|-------|--------|
| `orders` | Missing index on `order_code` lookup |
| `vouchers` | `used_count` not incremented by application |
| `users` | Missing `auth_source` in schema (only in entity) |

---

## CONCLUSION

The TMDT e-commerce project demonstrates solid foundational architecture with good separation of concerns and modern development practices. However, **several critical security vulnerabilities** must be addressed before production deployment, particularly around authorization, voucher management, and price validation.

The codebase would benefit significantly from:
1. Comprehensive test coverage
2. Enhanced error handling and monitoring
3. Performance optimization through caching and query improvements
4. Better accessibility practices

**Final Verdict:** With the identified critical issues resolved, the project is suitable for production deployment with moderate confidence. Continuous improvement in testing and monitoring is recommended.

---

*Report generated by Senior Software Engineer Review*  
*Next Review Recommended: After critical fixes are implemented*
