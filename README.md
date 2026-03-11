#Cấu trúc thư mục BackEnd
---
```
backend/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/example/phonecommerce/
│       │       ├── PhoneCommerceApplication.java
│       │       │
│       │       ├── config/
│       │       │   ├── SecurityConfig.java
│       │       │   ├── JwtAuthenticationFilter.java
│       │       │   └── JwtUtil.java
│       │       │
│       │       ├── controller/
│       │       │   ├── AuthController.java
│       │       │   ├── UserController.java
│       │       │   ├── ProductController.java
│       │       │   ├── CartController.java
│       │       │   ├── OrderController.java
│       │       │   └── AdminController.java
│       │       │
│       │       ├── service/
│       │       │   ├── AuthService.java
│       │       │   ├── UserService.java
│       │       │   ├── ProductService.java
│       │       │   ├── CartService.java
│       │       │   └── OrderService.java
│       │       │
│       │       ├── repository/
│       │       │   ├── UserRepository.java
│       │       │   ├── ProductRepository.java
│       │       │   ├── CartRepository.java
│       │       │   └── OrderRepository.java
│       │       │
│       │       ├── entity/
│       │       │   ├── User.java
│       │       │   ├── Product.java
│       │       │   ├── Category.java
│       │       │   ├── Cart.java
│       │       │   └── Order.java
│       │       │
│       │       ├── dto/
│       │       │   ├── LoginRequest.java
│       │       │   ├── RegisterRequest.java
│       │       │   ├── ProductResponse.java
│       │       │   └── OrderResponse.java
│       │       │
│       │       └── exception/
│       │           ├── GlobalExceptionHandler.java
│       │           └── ResourceNotFoundException.java
│       │
│       └── resources/
│           ├── application.yml
│           └── data.sql
│
├── pom.xml
└── README.md
```
