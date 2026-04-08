---
name: controller
description: "Skill for the Controller area of TMDT. 4 symbols across 4 files."
---

# Controller

4 symbols | 4 files | Cohesion: 100%

## When to Use

- Working with code in `BackEnd/`
- Understanding how getAllProducts, findByDeletedAtIsNullOrderByCreatedAtDesc, getPublicProducts work
- Modifying controller-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java` | getAllProducts |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/ProductRepository.java` | findByDeletedAtIsNullOrderByCreatedAtDesc |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/controller/ProductController.java` | getPublicProducts |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/controller/AdminProductController.java` | getProducts |

## Entry Points

Start here when exploring this area:

- **`getAllProducts`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java:46`
- **`findByDeletedAtIsNullOrderByCreatedAtDesc`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/ProductRepository.java:8`
- **`getPublicProducts`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/controller/ProductController.java:18`
- **`getProducts`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/controller/AdminProductController.java:32`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getAllProducts` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java` | 46 |
| `findByDeletedAtIsNullOrderByCreatedAtDesc` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/ProductRepository.java` | 8 |
| `getPublicProducts` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/controller/ProductController.java` | 18 |
| `getProducts` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/controller/AdminProductController.java` | 32 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `GetPublicProducts → FindByDeletedAtIsNullOrderByCreatedAtDesc` | intra_community | 3 |
| `GetProducts → FindByDeletedAtIsNullOrderByCreatedAtDesc` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "getAllProducts"})` — see callers and callees
2. `gitnexus_query({query: "controller"})` — find related execution flows
3. Read key files listed above for implementation details
