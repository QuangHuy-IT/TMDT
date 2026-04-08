---
name: security
description: "Skill for the Security area of TMDT. 18 symbols across 6 files."
---

# Security

18 symbols | 6 files | Cohesion: 82%

## When to Use

- Working with code in `BackEnd/`
- Understanding how generateToken, generateRefreshToken, createToken work
- Modifying security-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/JwtTokenProvider.java` | generateToken, generateRefreshToken, createToken, getEmailFromToken, validateToken (+3) |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/controller/AuthController.java` | register, login, refreshToken |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/CustomUserDetailsService.java` | loadUserByUsername, getAuthorities |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/UserService.java` | login, refreshAccessToken |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/JwtAuthenticationFilter.java` | doFilterInternal, getJwtFromRequest |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/UserRepository.java` | findByEmail |

## Entry Points

Start here when exploring this area:

- **`generateToken`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/JwtTokenProvider.java:32`
- **`generateRefreshToken`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/JwtTokenProvider.java:39`
- **`createToken`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/JwtTokenProvider.java:48`
- **`loadUserByUsername`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/CustomUserDetailsService.java:24`
- **`getAuthorities`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/CustomUserDetailsService.java:50`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `generateToken` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/JwtTokenProvider.java` | 32 |
| `generateRefreshToken` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/JwtTokenProvider.java` | 39 |
| `createToken` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/JwtTokenProvider.java` | 48 |
| `loadUserByUsername` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/CustomUserDetailsService.java` | 24 |
| `getAuthorities` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/CustomUserDetailsService.java` | 50 |
| `login` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/UserService.java` | 77 |
| `findByEmail` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/UserRepository.java` | 17 |
| `register` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/controller/AuthController.java` | 38 |
| `login` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/controller/AuthController.java` | 61 |
| `getEmailFromToken` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/JwtTokenProvider.java` | 65 |
| `validateToken` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/JwtTokenProvider.java` | 73 |
| `isTokenExpired` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/JwtTokenProvider.java` | 97 |
| `getAllClaimsFromToken` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/JwtTokenProvider.java` | 109 |
| `getSigningKey` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/JwtTokenProvider.java` | 120 |
| `doFilterInternal` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/JwtAuthenticationFilter.java` | 32 |
| `getJwtFromRequest` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/security/JwtAuthenticationFilter.java` | 64 |
| `refreshAccessToken` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/UserService.java` | 172 |
| `refreshToken` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/controller/AuthController.java` | 108 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `RefreshToken → GetSigningKey` | intra_community | 5 |
| `Login → GetSigningKey` | cross_community | 4 |
| `Register → GetSigningKey` | cross_community | 4 |
| `DoFilterInternal → GetSigningKey` | intra_community | 4 |
| `Login → FindByEmail` | intra_community | 3 |
| `Login → InvalidCredentialsException` | intra_community | 3 |
| `Login → UserResponseDto` | cross_community | 3 |
| `Register → FindByEmail` | cross_community | 3 |
| `Register → ResourceNotFoundException` | cross_community | 3 |
| `UpdateProfile → FindByEmail` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Service | 2 calls |

## How to Explore

1. `gitnexus_context({name: "generateToken"})` — see callers and callees
2. `gitnexus_query({query: "security"})` — find related execution flows
3. Read key files listed above for implementation details
