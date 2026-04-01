# 📋 HỆ THỐNG AUTHENTICATION HOÀN CHỈNH - PHONE STORE

## 📚 MỤC LỤC
1. [Kiến Trúc MVC](#kiến-trúc-mvc)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [API Endpoints](#api-endpoints)
5. [Hướng Dẫn Sử Dụng](#hướng-dẫn-sử-dụng)
6. [Cách Hoạt Động Chi Tiết](#cách-hoạt-động-chi-tiết)

---

## 🏗 KIẾN TRÚC MVC

Hệ thống authentication tuân theo mô hình **Model-View-Controller (MVC)**:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│          (React Components - Login, Register)                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                             │
│     (AuthService - gọi API, quản lý state)                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                 COMMUNICATION LAYER                          │
│  (Axios + Interceptors - JWT handling, token refresh)       │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    ━━━━━ HTTP ━━━━━
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND - REST API                        │
│                    (Spring Boot)                             │
├─────────────────────────────────────────────────────────────┤
│ CONTROLLER LAYER                                            │
│ ├─ AuthController (/api/auth/*)                            │
│ └─ UserController (/api/users/*)                           │
├─────────────────────────────────────────────────────────────┤
│ SERVICE LAYER                                               │
│ └─ UserService (Business Logic)                            │
├─────────────────────────────────────────────────────────────┤
│ REPOSITORY LAYER                                            │
│ └─ UserRepository (Database Access)                        │
├─────────────────────────────────────────────────────────────┤
│ SECURITY LAYER                                              │
│ ├─ JwtTokenProvider (Token generation/validation)          │
│ ├─ JwtAuthenticationFilter (Request authentication)        │
│ ├─ CustomUserDetailsService (Load user from DB)           │
│ └─ SecurityConfig (Spring Security configuration)          │
├─────────────────────────────────────────────────────────────┤
│ DOMAIN LAYER                                                │
│ ├─ User (Entity)                                           │
│ └─ Enums (UserRole, UserStatus)                            │
├─────────────────────────────────────────────────────────────┤
│ DATA LAYER                                                  │
│ └─ MySQL Database                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 BACKEND IMPLEMENTATION

### 📁 Cấu Trúc Thư Mục Backend

```
src/main/java/com/tmdt/phone_store_backend/
├── config/
│   └── SecurityConfig.java          # Spring Security & JWT Configuration
├── controller/
│   ├── AuthController.java          # Authentication API Endpoints
│   └── UserController.java          # User Profile API Endpoints
├── domain/
│   ├── entity/
│   │   └── User.java                # User Entity
│   └── enums/
│       ├── UserRole.java            # USER, ADMIN
│       └── UserStatus.java          # ACTIVE, BLOCKED
├── dto/
│   ├── LoginRequestDto.java         # Login Request DTO
│   ├── RegisterRequestDto.java      # Register Request DTO
│   ├── AuthResponseDto.java         # Auth Response DTO
│   └── UserResponseDto.java         # User Response DTO
├── exception/
│   ├── GlobalExceptionHandler.java  # Global Exception Handler
│   ├── ResourceNotFoundException.java
│   ├── ResourceAlreadyExistsException.java
│   ├── InvalidCredentialsException.java
│   ├── UnauthorizedException.java
│   └── ErrorResponse.java           # Error Response Model
├── repository/
│   └── UserRepository.java          # JPA Repository
├── security/
│   ├── JwtTokenProvider.java        # JWT Token Provider
│   ├── JwtAuthenticationFilter.java # JWT Request Filter
│   └── CustomUserDetailsService.java# UserDetailsService Implementation
└── service/
    └── UserService.java            # Business Logic Services
```

### 1️⃣ **Entity Layer - User.java**

User entity đã có trong project, với các trường:
- `id`: Long (Primary Key)
- `email`: String (UNIQUE)
- `phone`: String (UNIQUE)
- `passwordHash`: String (BCrypt encoded)
- `fullName`: String
- `role`: UserRole (USER/ADMIN)
- `status`: UserStatus (ACTIVE/BLOCKED)
- `avatarUrl`: String
- `createdAt`, `updatedAt`, `lastLoginAt`, `deletedAt`: LocalDateTime

### 2️⃣ **DTO Layer - Data Transfer Objects**

**LoginRequestDto:**
```java
@Getter @Setter
public class LoginRequestDto {
    @Email
    private String email;
    
    @NotBlank
    private String password;
}
```

**RegisterRequestDto:**
```java
@Getter @Setter
public class RegisterRequestDto {
    @Email
    private String email;
    
    @NotBlank
    private String fullName;
    
    @NotBlank
    private String phone;
    
    @NotBlank
    @Size(min = 6)
    private String password;
    
    @NotBlank
    private String confirmPassword;
}
```

**AuthResponseDto:**
```java
@Getter @Setter
public class AuthResponseDto {
    private String token;           // Access Token (JWT)
    private String refreshToken;    // Refresh Token (JWT)
    private String type = "Bearer"; // Token Type
    private UserResponseDto user;   // User Info
}
```

### 3️⃣ **Repository Layer**

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
}
```

Cung cấp các method để truy vấn database:
- `findByEmail()` - Tìm user theo email
- `existsByEmail()` - Kiểm tra email tồn tại
- `existsByPhone()` - Kiểm tra số điện thoại tồn tại

### 4️⃣ **Security Layer**

#### **JwtTokenProvider.java**
Chịu trách nhiệm tạo và xác thực JWT token:

```java
// Tạo Access Token (24 giờ)
public String generateToken(String email) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + jwtExpirationMs);
    
    return Jwts.builder()
        .setSubject(email)
        .setIssuedAt(now)
        .setExpiration(expiryDate)
        .signWith(key, SignatureAlgorithm.HS512)
        .compact();
}

// Tạo Refresh Token (7 ngày)
public String generateRefreshToken(String email) {
    long refreshTokenExpiration = jwtExpirationMs * 7;
    return createToken(email, refreshTokenExpiration);
}

// Xác thực Token
public boolean validateToken(String token) {
    try {
        Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
        return true;
    } catch (JwtException e) {
        return false;
    }
}

// Lấy email từ Token
public String getEmailFromToken(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token)
        .getBody()
        .getSubject();
}
```

**Thuật toán mã hóa:** HMAC-SHA512
**Secret Key:** Base64 encoded string từ application.properties

#### **JwtAuthenticationFilter.java**
Filter xử lý JWT authentication trên mỗi request:

```java
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) {
        try {
            String token = getJwtFromRequest(request); // Lấy từ "Authorization" header
            
            if (token != null && jwtTokenProvider.validateToken(token)) {
                String email = jwtTokenProvider.getEmailFromToken(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                
                // Tạo Authentication object
                UsernamePasswordAuthenticationToken auth = 
                    new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication", e);
        }
        
        filterChain.doFilter(request, response);
    }
}
```

#### **SecurityConfig.java**
Cấu hình Spring Security:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        http
            .cors(...) // Enable CORS
            .csrf().disable() // Disable CSRF (API không cần)
            .sessionManagement().sessionCreationPolicy(STATELESS) // Stateless
            .authorizeHttpRequests()
                .requestMatchers("/api/auth/login").permitAll()
                .requestMatchers("/api/auth/register").permitAll()
                .requestMatchers("/api/auth/me").authenticated()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            .and()
            .addFilterBefore(jwtAuthenticationFilter(), 
                           UsernamePasswordAuthenticationFilter.class);
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // Password hashing
    }
}
```

**CORS Configuration:**
- Allowed Origins: `http://localhost:3000`, `http://localhost:5173`, `http://localhost:5174`
- Allowed Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Exposed Headers: Authorization, Content-Disposition

### 5️⃣ **Service Layer - UserService.java**

Business logic cho authentication:

```java
@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    
    // Đăng ký người dùng mới
    public UserResponseDto register(RegisterRequestDto requestDto) {
        // 1. Kiểm tra password confirm
        if (!password.equals(confirmPassword)) {
            throw new InvalidCredentialsException("Password mismatch");
        }
        
        // 2. Kiểm tra email/phone tồn tại
        if (userRepository.existsByEmail(requestDto.getEmail())) {
            throw new ResourceAlreadyExistsException("Email already exists");
        }
        
        // 3. Tạo User mới
        User user = new User();
        user.setEmail(requestDto.getEmail());
        user.setPasswordHash(passwordEncoder.encode(requestDto.getPassword()));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        
        // 4. Lưu vào DB
        return convertToDto(userRepository.save(user));
    }
    
    // Đăng nhập
    public User login(LoginRequestDto requestDto) {
        // 1. Tìm user theo email
        User user = userRepository.findByEmail(requestDto.getEmail())
            .orElseThrow(() -> new InvalidCredentialsException("Invalid credentials"));
        
        // 2. Verify password
        if (!passwordEncoder.matches(requestDto.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid credentials");
        }
        
        // 3. Kiểm tra user bị khóa không
        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new InvalidCredentialsException("Account is blocked");
        }
        
        // 4. Cập nhật lastLoginAt
        user.setLastLoginAt(LocalDateTime.now());
        return userRepository.save(user);
    }
    
    // Refresh access token
    public String refreshAccessToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new InvalidCredentialsException("Invalid refresh token");
        }
        
        String email = jwtTokenProvider.getEmailFromToken(refreshToken);
        return jwtTokenProvider.generateToken(email);
    }
}
```

**Password Security:**
- Mật khẩu được hash bằng **BCryptPasswordEncoder**
- Khi login, mình compare plaintext password với hash bằng `passwordEncoder.matches()`
- Mật khẩu không bao giờ stored ở dạng plaintext

### 6️⃣ **Controller Layer**

#### **AuthController.java** - Authentication Endpoints

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    // POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequestDto dto) {
        UserResponseDto userDto = userService.register(dto);
        String token = jwtTokenProvider.generateToken(userDto.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDto.getEmail());
        
        return ResponseEntity.status(CREATED)
            .body(new AuthResponseDto(token, refreshToken, userDto));
    }
    
    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDto dto) {
        User user = userService.login(dto);
        UserResponseDto userDto = userService.convertToDto(user);
        String token = jwtTokenProvider.generateToken(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());
        
        return ResponseEntity.ok(new AuthResponseDto(token, refreshToken, userDto));
    }
    
    // GET /api/auth/me - Lấy thông tin user hiện tại
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        String email = SecurityContextHolder.getContext()
            .getAuthentication().getName();
        User user = userService.getUserByEmail(email);
        return ResponseEntity.ok(userService.convertToDto(user));
    }
    
    // POST /api/auth/refresh-token
    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        String newAccessToken = userService.refreshAccessToken(refreshToken);
        
        return ResponseEntity.ok(Map.of(
            "token", newAccessToken,
            "type", "Bearer"
        ));
    }
    
    // POST /api/auth/logout
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
```

#### **UserController.java** - User Profile Endpoints

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    // GET /api/users/profile
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        String email = SecurityContextHolder.getContext()
            .getAuthentication().getName();
        User user = userService.getUserByEmail(email);
        return ResponseEntity.ok(userService.convertToDto(user));
    }
    
    // PUT /api/users/profile
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UserResponseDto updateDto) {
        String email = SecurityContextHolder.getContext()
            .getAuthentication().getName();
        User user = userService.getUserByEmail(email);
        UserResponseDto response = userService.updateUser(user.getId(), updateDto);
        return ResponseEntity.ok(response);
    }
}
```

### 7️⃣ **Exception Handling**

**GlobalExceptionHandler.java** - Xử lý exceptions toàn cục:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleNotFound(ResourceNotFoundException ex, WebRequest req) {
        return ResponseEntity.status(NOT_FOUND)
            .body(new ErrorResponse(
                LocalDateTime.now(),
                404,
                "Not Found",
                ex.getMessage(),
                req.getDescription(false)
            ));
    }
    
    @ExceptionHandler(ResourceAlreadyExistsException.class)
    public ResponseEntity<?> handleConflict(ResourceAlreadyExistsException ex, WebRequest req) {
        return ResponseEntity.status(CONFLICT)
            .body(new ErrorResponse(...));
    }
    
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<?> handleInvalidCredentials(InvalidCredentialsException ex, WebRequest req) {
        return ResponseEntity.status(UNAUTHORIZED)
            .body(new ErrorResponse(...));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex, WebRequest req) {
        String errors = ex.getBindingResult().getFieldErrors()
            .stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(joining("; "));
        
        return ResponseEntity.status(BAD_REQUEST)
            .body(new ErrorResponse(..., errors, ...));
    }
}
```

---

## 🎨 Frontend Implementation

### 📁 Cấu Trúc Thư Mục Frontend

```
src/
├── api/
│   └── axiosInstance.js         # Axios với JWT interceptors
├── services/
│   └── authService.js           # API calls logic
├── context/
│   └── ShopContext.jsx          # Updated - JWT token handling
├── pages/
│   ├── Login.jsx                # Updated - Backend integration
│   └── Register.jsx             # Updated - Backend integration
└── components/
    └── layout/
        ├── ProtectedRoute.jsx   # Route protection
        ├── Navbar.jsx           # Display user info
        └── Footer.jsx
```

### 1️⃣ **API Client - axiosInstance.js**

```javascript
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: { 'Content-Type': 'application/json' }
});

// Request Interceptor - Thêm JWT token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor - Xử lý token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Nếu 401 và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const response = await axios.post(
                    'http://localhost:8080/api/auth/refresh-token',
                    { refreshToken }
                );
                
                const newToken = response.data.token;
                localStorage.setItem('token', newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                
                return api(originalRequest);
            } catch (error) {
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(error);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
```

**Request Interceptor:**
- Tự động thêm JWT token vào Authorization header của mỗi request
- Format: `Authorization: Bearer <token>`

**Response Interceptor:**
- Nếu server trả về 401 (token hết hạn):
  - Tự động gọi `/api/auth/refresh-token` với refresh token
  - Lưu access token mới
  - Retry request ban đầu với token mới
- Nếu refresh token cũng invalid:
  - Xóa toàn bộ local storage
  - Redirect về page login

### 2️⃣ **Service Layer - authService.js**

```javascript
import api from './axiosInstance';

const AuthService = {
    register: (userData) => api.post('/auth/register', userData),
    login: (email, password) => api.post('/auth/login', { email, password }),
    getCurrentUser: () => api.get('/auth/me'),
    refreshToken: (refreshToken) => 
        api.post('/auth/refresh-token', { refreshToken }),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/users/profile'),
    updateProfile: (profileData) => 
        api.put('/users/profile', profileData)
};
```

### 3️⃣ **State Management - ShopContext.jsx**

Updated with JWT token handling:

```javascript
const initialState = {
    // ... existing state
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    loading: false,
    error: null
};

const shopReducer = (state, action) => {
    // ... existing reducers
    
    case 'LOGIN_SUCCESS':
        const { token, refreshToken, user } = action.payload;
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        return {
            ...state,
            isAuthenticated: true,
            user, token, refreshToken,
            error: null
        };
    
    case 'REGISTER_SUCCESS':
        // Same as LOGIN_SUCCESS
        return { ... };
    
    case 'LOGOUT':
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        return { 
            ...state, 
            isAuthenticated: false, 
            user: null, 
            token: null, 
            refreshToken: null 
        };
    
    case 'REFRESH_TOKEN_SUCCESS':
        localStorage.setItem('token', action.payload.token);
        return { ...state, token: action.payload.token };
};
```

**State Properties:**
- `token`: Access Token (JWT)
- `refreshToken`: Refresh Token (JWT)
- `user`: User object từ response
- `isAuthenticated`: Boolean flag
- `loading`: Loading state
- `error`: Error message

### 4️⃣ **Login Component - Login.jsx**

```javascript
const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
        const response = await AuthService.login(email, password);
        
        dispatch({
            type: 'LOGIN_SUCCESS',
            payload: response.data // { token, refreshToken, user }
        });
        
        navigate(from); // Redirect to protected page
    } catch (err) {
        setError(err.response?.data?.message || 'Login failed');
    } finally {
        setLoading(false);
    }
};
```

### 5️⃣ **Register Component - Register.jsx**

```javascript
const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
    }
    
    setLoading(true);
    
    try {
        const response = await AuthService.register({
            fullName,
            email,
            phone,
            password,
            confirmPassword
        });
        
        dispatch({
            type: 'REGISTER_SUCCESS',
            payload: response.data
        });
        
        navigate('/');
    } catch (err) {
        setError(err.response?.data?.message || 'Registration failed');
    } finally {
        setLoading(false);
    }
};
```

---

## 📡 API ENDPOINTS

### 🔐 Authentication Endpoints (Public)

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | `/api/auth/register` | Register new user | RegisterRequestDto | AuthResponseDto |
| POST | `/api/auth/login` | Login user | LoginRequestDto | AuthResponseDto |
| POST | `/api/auth/refresh-token` | Refresh access token | `{refreshToken}` | `{token}` |

### 👤 User Endpoints (Authenticated)

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/api/auth/me` | Get current user info | UserResponseDto |
| GET | `/api/users/profile` | Get user profile | UserResponseDto |
| PUT | `/api/users/profile` | Update user profile | UserResponseDto |
| POST | `/api/auth/logout` | Logout user | `{message}` |

### 📊 Response Examples

**Login Success (200):**
```json
{
    "token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
    "type": "Bearer",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "fullName": "Nguyễn Văn A",
        "phone": "0901234567",
        "role": "USER",
        "status": "ACTIVE",
        "avatarUrl": null
    }
}
```

**Login Error (401):**
```json
{
    "timestamp": "2026-03-25T10:30:00",
    "status": 401,
    "error": "Unauthorized",
    "message": "Email hoặc mật khẩu không đúng",
    "path": "/api/auth/login"
}
```

**Register Error - Email Exists (409):**
```json
{
    "timestamp": "2026-03-25T10:30:00",
    "status": 409,
    "error": "Conflict",
    "message": "Email đã được sử dụng: user@example.com",
    "path": "/api/auth/register"
}
```

---

## 🚀 HƯỚNG DẪN SỬ DỤNG

### ⚙️ Setup Backend

1. **Kiểm tra MySQL đang chạy:**
   ```bash
   mysql -u root -p123456
   SELECT 1; -- Test connection
   ```

2. **Xây dựng project:**
   ```bash
   cd BackEnd/phone-store-backend
   mvn clean package
   ```

3. **Chạy backend:**
   ```bash
   mvn spring-boot:run
   ```
   Backend sẽ chạy tại: `http://localhost:8080`

4. **Kiểm tra database:**
   ```sql
   USE phone_store;
   DESC users;
   SELECT * FROM users;
   ```

### ⚙️ Setup Frontend

1. **Cài dependencies:**
   ```bash
   cd FrontEnd
   npm install axios
   npm install
   ```

2. **Chạy frontend:**
   ```bash
   npm run dev
   ```
   Frontend sẽ chạy tại: `http://localhost:5173`

### 🧪 Test Authentication Flow

**1. Test Register:**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nguyễn Văn A",
    "email": "user1@example.com",
    "phone": "0901234567",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

**2. Test Login:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user1@example.com",
    "password": "password123"
  }'
```

**3. Test Protected Endpoint (Get Current User):**
```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

**4. Test Refresh Token:**
```bash
curl -X POST http://localhost:8080/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<REFRESH_TOKEN>"}'
```

### 🌐 Test UI

1. **Register:** http://localhost:5173/signup
   - Nhập fullName, email, phone, password
   - Click "TẠO TÀI KHOẢN NGAY"
   - Sẽ tự động login và redirect tới home

2. **Login:** http://localhost:5173/login
   - Nhập email và password
   - Click "ĐĂNG NHẬP"
   - Sẽ redirect tới protected page

---

## 🔄 CÁC HỌ HOẠT ĐỘNG CHI TIẾT

### 📝 Quy Trình Đăng Ký (Register)

```
USER                      FRONTEND                  BACKEND
  │                           │                         │
  ├─ Nhập form ────────────>  │                         │
  │                           ├─ POST /auth/register --> │
  │                           │   (fullName, email, phone, pwd)
  │                           │                    ┌────┴────────┐
  │                           │                    └─> Validate   │
  │                           │                       Hash pwd    │
  │                           │                       Save to DB  │
  │                           │<─ 201 + Token + User ──│
  │                           │   {token, refreshToken, user}
  │                           ├─ Store token in localStorage
  │                           ├─ Store user in localStorage
  │                           ├─ Update Redux state
  │<─ Redirect to home ────── │
  │
```

**Chi tiết:**
1. User nhập form và click "Đăng ký"
2. Frontend gọi `AuthService.register(data)`
3. axiosInstance gửi POST request đến `/api/auth/register`
4. Backend receives request:
   - Validate form fields
   - Hash password với BCrypt
   - Kiểm tra email/phone đã tồn tại
   - Tạo User mới và save vào DB
   - Tạo JWT access token (24h)
   - Tạo JWT refresh token (7 ngày)
5. Backend trả về response với tokens và user info
6. Frontend stores tokens + user info vào localStorage
7. Frontend redirects tới home page

### 🔑 Quy Trình Đăng Nhập (Login)

```
USER                      FRONTEND                  BACKEND
  │                           │                         │
  ├─ Nhập email + pwd ─────> │                         │
  │                           ├─ POST /auth/login ───> │
  │                           │   {email, password}
  │                           │                    ┌────┴─────────┐
  │                           │                    └─> Find user  │
  │                           │                       Compare pwd │
  │                           │                       Update last_login
  │                           │                       Create tokens
  │                           │<─ 200 + Tokens + User ─│
  │                           │
  │                           ├─ localStorage.setItem("token", ...)
  │                           ├─ Update context state
  │<─ Redirect to URL ────── │
  │
```

**Chi tiết:**
1. User nhập email + password
2. Frontend gọi `AuthService.login(email, pwd)`
3. Backend validates credentials:
   - Find user by email
   - Compare password (bcrypt.matches)
   - Check user status (not blocked)
   - Update lastLoginAt
4. Create tokens + return response
5. Frontend stores tokens in localStorage
6. All future requests sẽ auto-include `Authorization: Bearer <token>`

### 🔄 Quy Trình Auto Login (Token Refresh)

```
USER              FRONTEND                    BACKEND
                     │                           │
                     ├─ GET /api/users/profile──>│
                     │ (Authorization: Bearer <old_token>)
                     │                      ┌────┴────────┐
                     │                      └─ Token hết hạn
                     │<─ 401 Unauthorized ──│
                     │
                     ├─ Interceptor catch 401
                     ├─ POST /auth/refresh-token
                     │ {refreshToken: <refresh_token>}
                     │                      ┌────┴────────┐
                     │                      └─ Validate refresh token
                     │                         Issue new access token
                     │<─ 200 + new token ──│
                     │
                     ├─ localStorage.setItem("token", new_token)
                     ├─ Retry original request with new token
                     │ GET /api/users/profile──>│
                     │ (Authorization: Bearer <new_token>)
                     │<─ 200 + user data ──│
                     │
```

**Chi tiết:**
1. Frontend gửi request với expired access token
2. Backend trả về 401
3. Response Interceptor catches 401:
   - Lấy refresh token từ localStorage
   - Gọi `/api/auth/refresh-token`
   - Backend validate refresh token và issue new access token
   - Store new token
   - Retry original request
4. User không nhận biết gì, request tiếp tục bình thường

### 🛡️ Request Authentication Flow

```
USER REQUEST
    │
    ├─ axiosInstance request interceptor
    │  ├─ Get token từ localStorage
    │  └─ Add header: Authorization: Bearer <token>
    │
    ├─ HTTP REQUEST
    │
    ├─ BACKEND - JwtAuthenticationFilter
    │  ├─ Extract token từ Authorization header
    │  ├─ Validate token
    │  │  ├─ Check signature
    │  │  ├─ Check expiration
    │  │  └─ Check format
    │  ├─ If valid:
    │  │  ├─ Extract email từ token
    │  │  ├─ Load UserDetails từ DB
    │  │  ├─ Create Authentication object
    │  │  └─ Set vào SecurityContext
    │  └─ If invalid: Continue without auth
    │
    ├─ SPRING SECURITY CHECK
    │  ├─ Check if endpoint requires authentication
    │  └─ Check if user has required role
    │
    ├─ CONTROLLER EXECUTION
    │  └─ Can access SecurityContextHolder.getContext().getAuthentication()
    │
    └─ RESPONSE
```

### 📊 Token Structure

**Access Token (JWT):**
```
Header:
{
    "alg": "HS512",
    "typ": "JWT"
}

Payload:
{
    "sub": "user@example.com",      // Subject (email)
    "iat": 1711353000,               // Issued at
    "exp": 1711439400                // Expiration (24 hours later)
}

Signature:
HMACSHA512(Base64(Header) + "." + Base64(Payload), Secret)
```

### 🔒 Password Security

```
REGISTER:
User Password: "myPassword123"
    ↓
BCryptPasswordEncoder.encode()
    ↓
Hashed: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/KFm"
    ↓
SAVE TO DB

LOGIN:
User Input: "myPassword123"
    ↓
retrieved_hash = userRepository.findByEmail(email).getPasswordHash()
    ↓
passwordEncoder.matches(input, retrieved_hash) → true/false
    ↓
GRANT/DENY ACCESS
```

---

## 🎯 KEY POINTS

1. **MVC Pattern:** Tách biệt Model (User entity), View (React components), Controller (REST endpoints)

2. **JWT Token:** Stateless authentication, không cần session

3. **Token Refresh:** Auto-refresh token khi hết hạn, user không bị disconnect

4. **Password Security:** Hash password with BCrypt, không bao giờ lưu plaintext

5. **CORS:** Frontend tại port khác backend vẫn có thể kết nối

6. **Error Handling:** Global exception handler, consistent error responses

7. **Security:** 
   - HTTPS in production
   - Secure cookies for sensitive data
   - Rate limiting
   - Input validation
   - CSRFÁ token (not needed for API)

---

## 📝 TESTINGING USERS (From Database)

Sau khi backend chạy, bạn có thể test với các users sau:

```sql
INSERT INTO users (email, phone, password_hash, full_name, role, status, created_at, updated_at)
VALUES (
    'test@example.com', 
    '0901234567', 
    '$2a$10$...' -- BCrypt hash of 'password123'
    'Test User', 
    'USER', 
    'ACTIVE', 
    NOW(), 
    NOW()
);
```

**Hoặc tạo user mới qua UI:**
- Vào http://localhost:5173/signup
- Fill form và submit
- Sẽ tự động thêm vào database

---

**Hệ thống authentication hoàn toàn sẵn sàng để sử dụng! 🚀**
