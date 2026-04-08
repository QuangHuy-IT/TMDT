---
name: exception
description: "Skill for the Exception area of TMDT. 10 symbols across 3 files."
---

# Exception

10 symbols | 3 files | Cohesion: 94%

## When to Use

- Working with code in `BackEnd/`
- Understanding how ErrorResponse, getDescription, resourceNotFound work
- Modifying exception-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/exception/GlobalExceptionHandler.java` | resourceNotFound, resourceAlreadyExists, invalidCredentials, unauthorized, methodArgumentNotValid (+3) |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java` | getDescription |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/exception/ErrorResponse.java` | ErrorResponse |

## Entry Points

Start here when exploring this area:

- **`ErrorResponse`** (Class) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/exception/ErrorResponse.java:10`
- **`getDescription`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java:275`
- **`resourceNotFound`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/exception/GlobalExceptionHandler.java:18`
- **`resourceAlreadyExists`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/exception/GlobalExceptionHandler.java:34`
- **`invalidCredentials`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/exception/GlobalExceptionHandler.java:50`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ErrorResponse` | Class | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/exception/ErrorResponse.java` | 10 |
| `getDescription` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java` | 275 |
| `resourceNotFound` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/exception/GlobalExceptionHandler.java` | 18 |
| `resourceAlreadyExists` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/exception/GlobalExceptionHandler.java` | 34 |
| `invalidCredentials` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/exception/GlobalExceptionHandler.java` | 50 |
| `unauthorized` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/exception/GlobalExceptionHandler.java` | 66 |
| `methodArgumentNotValid` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/exception/GlobalExceptionHandler.java` | 82 |
| `noHandlerFound` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/exception/GlobalExceptionHandler.java` | 104 |
| `httpMethodNotSupported` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/exception/GlobalExceptionHandler.java` | 120 |
| `globalException` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/exception/GlobalExceptionHandler.java` | 136 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `UpdateProduct → GetDescription` | cross_community | 3 |

## How to Explore

1. `gitnexus_context({name: "ErrorResponse"})` — see callers and callees
2. `gitnexus_query({query: "exception"})` — find related execution flows
3. Read key files listed above for implementation details
