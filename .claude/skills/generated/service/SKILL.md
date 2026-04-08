---
name: service
description: "Skill for the Service area of TMDT. 39 symbols across 19 files."
---

# Service

39 symbols | 19 files | Cohesion: 90%

## When to Use

- Working with code in `BackEnd/`
- Understanding how ProductVariant, ProductSpecification, ProductImage work
- Modifying service-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java` | createProduct, updateProduct, saveImages, saveSpecifications, getOrCreateBrand (+3) |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/CloudinaryService.java` | uploadImage, readBytes, validateCloudinaryConfig, resolveConfigFromCloudinaryUrl, isBlank (+1) |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/UserService.java` | register, getUserById, getUserByEmail, updateUser, convertToDto |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/controller/AdminProductController.java` | createProduct, updateProduct, uploadImage |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/UserRepository.java` | existsByEmail, existsByPhone |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/controller/UserController.java` | getProfile, updateProfile |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/CategoryRepository.java` | findByNameIgnoreCase |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/BrandRepository.java` | findByNameIgnoreCase |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/domain/entity/ProductVariant.java` | ProductVariant |
| `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/domain/entity/ProductSpecification.java` | ProductSpecification |

## Entry Points

Start here when exploring this area:

- **`ProductVariant`** (Class) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/domain/entity/ProductVariant.java:19`
- **`ProductSpecification`** (Class) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/domain/entity/ProductSpecification.java:17`
- **`ProductImage`** (Class) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/domain/entity/ProductImage.java:17`
- **`Product`** (Class) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/domain/entity/Product.java:21`
- **`Inventory`** (Class) — `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/domain/entity/Inventory.java:21`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ProductVariant` | Class | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/domain/entity/ProductVariant.java` | 19 |
| `ProductSpecification` | Class | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/domain/entity/ProductSpecification.java` | 17 |
| `ProductImage` | Class | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/domain/entity/ProductImage.java` | 17 |
| `Product` | Class | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/domain/entity/Product.java` | 21 |
| `Inventory` | Class | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/domain/entity/Inventory.java` | 21 |
| `Category` | Class | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/domain/entity/Category.java` | 18 |
| `Brand` | Class | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/domain/entity/Brand.java` | 15 |
| `UserResponseDto` | Class | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/dto/UserResponseDto.java` | 12 |
| `User` | Class | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/domain/entity/User.java` | 19 |
| `ImageUploadResponseDto` | Class | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/dto/ImageUploadResponseDto.java` | 6 |
| `createProduct` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java` | 52 |
| `updateProduct` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java` | 96 |
| `saveImages` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java` | 199 |
| `saveSpecifications` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java` | 222 |
| `getOrCreateBrand` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java` | 246 |
| `getOrCreateDefaultCategory` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java` | 261 |
| `generateSlug` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java` | 282 |
| `resolveStockStatus` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/service/ProductAdminService.java` | 294 |
| `findByNameIgnoreCase` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/CategoryRepository.java` | 8 |
| `findByNameIgnoreCase` | Method | `BackEnd/phone-store-backend/src/main/java/com/tmdt/phone_store_backend/repository/BrandRepository.java` | 8 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `UploadImage → IsBlank` | intra_community | 5 |
| `UpdateProfile → UserResponseDto` | intra_community | 4 |
| `CreateProduct → FindByNameIgnoreCase` | intra_community | 4 |
| `CreateProduct → Brand` | intra_community | 4 |
| `CreateProduct → GenerateSlug` | intra_community | 4 |
| `CreateProduct → FindByNameIgnoreCase` | intra_community | 4 |
| `CreateProduct → Category` | intra_community | 4 |
| `UploadImage → InvalidCredentialsException` | intra_community | 4 |
| `UpdateProduct → FindByNameIgnoreCase` | intra_community | 4 |
| `UpdateProduct → Brand` | intra_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Repository | 6 calls |
| Exception | 2 calls |
| Security | 1 calls |

## How to Explore

1. `gitnexus_context({name: "ProductVariant"})` — see callers and callees
2. `gitnexus_query({query: "service"})` — find related execution flows
3. Read key files listed above for implementation details
