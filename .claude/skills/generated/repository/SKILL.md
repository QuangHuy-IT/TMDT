---
name: repository
description: "Skill for the Repository area of TMDT. 11 symbols across 7 files."
---

# Repository

11 symbols | 7 files | Cohesion: 69%

## When to Use

- Working with code in `BackEnd/`
- Understanding how AdminProductDto, deleteProduct, findByProductId work
- Modifying repository-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java` | deleteProduct, toDto |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/ProductVariantRepository.java` | findByProductId, findFirstByProductIdOrderByIdAsc |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/ProductSpecificationRepository.java` | deleteByProductId, findByProductIdOrderBySortOrderAscIdAsc |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/ProductImageRepository.java` | deleteByProductId, findByProductIdOrderBySortOrderAscIdAsc |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/InventoryRepository.java` | findByVariantId |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/controller/AdminProductController.java` | deleteProduct |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/dto/AdminProductDto.java` | AdminProductDto |

## Entry Points

Start here when exploring this area:

- **`AdminProductDto`** (Class) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/dto/AdminProductDto.java:9`
- **`deleteProduct`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java:147`
- **`findByProductId`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/ProductVariantRepository.java:11`
- **`deleteByProductId`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/ProductSpecificationRepository.java:11`
- **`deleteByProductId`** (Method) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/ProductImageRepository.java:10`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `AdminProductDto` | Class | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/dto/AdminProductDto.java` | 9 |
| `deleteProduct` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java` | 147 |
| `findByProductId` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/ProductVariantRepository.java` | 11 |
| `deleteByProductId` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/ProductSpecificationRepository.java` | 11 |
| `deleteByProductId` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/ProductImageRepository.java` | 10 |
| `findByVariantId` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/InventoryRepository.java` | 8 |
| `deleteProduct` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/controller/AdminProductController.java` | 51 |
| `toDto` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java` | 163 |
| `findFirstByProductIdOrderByIdAsc` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/ProductVariantRepository.java` | 9 |
| `findByProductIdOrderBySortOrderAscIdAsc` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/ProductSpecificationRepository.java` | 9 |
| `findByProductIdOrderBySortOrderAscIdAsc` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/ProductImageRepository.java` | 8 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `DeleteProduct → ResourceNotFoundException` | intra_community | 3 |
| `DeleteProduct → DeleteByProductId` | intra_community | 3 |
| `DeleteProduct → DeleteByProductId` | intra_community | 3 |
| `DeleteProduct → FindByProductId` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "AdminProductDto"})` — see callers and callees
2. `gitnexus_query({query: "repository"})` — find related execution flows
3. Read key files listed above for implementation details
