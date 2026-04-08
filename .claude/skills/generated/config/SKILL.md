---
name: config
description: "Skill for the Config area of TMDT. 5 symbols across 1 files."
---

# Config

5 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `BackEnd/`
- Understanding how passwordEncoder, authenticationProvider, jwtAuthenticationFilter work
- Modifying config-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/config/SecurityConfig.java` | passwordEncoder, authenticationProvider, jwtAuthenticationFilter, filterChain, corsConfigurationSource |

## Entry Points

Start here when exploring this area:

- **`passwordEncoder`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/config/SecurityConfig.java:38`
- **`authenticationProvider`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/config/SecurityConfig.java:43`
- **`jwtAuthenticationFilter`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/config/SecurityConfig.java:57`
- **`filterChain`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/config/SecurityConfig.java:62`
- **`corsConfigurationSource`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/config/SecurityConfig.java:97`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `passwordEncoder` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/config/SecurityConfig.java` | 38 |
| `authenticationProvider` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/config/SecurityConfig.java` | 43 |
| `jwtAuthenticationFilter` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/config/SecurityConfig.java` | 57 |
| `filterChain` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/config/SecurityConfig.java` | 62 |
| `corsConfigurationSource` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/config/SecurityConfig.java` | 97 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `FilterChain → PasswordEncoder` | intra_community | 3 |
| `FilterChain → JwtAuthenticationFilter` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "passwordEncoder"})` — see callers and callees
2. `gitnexus_query({query: "config"})` — find related execution flows
3. Read key files listed above for implementation details
