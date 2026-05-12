    package com.tmdt.phone_store_backend.service;

    import com.tmdt.phone_store_backend.domain.entity.Brand;
    import com.tmdt.phone_store_backend.domain.entity.Banner;
    import com.tmdt.phone_store_backend.domain.entity.Category;
    import com.tmdt.phone_store_backend.domain.entity.Inventory;
    import com.tmdt.phone_store_backend.domain.entity.Product;
    import com.tmdt.phone_store_backend.domain.entity.ProductImage;
    import com.tmdt.phone_store_backend.domain.entity.FlashSale;
    import com.tmdt.phone_store_backend.domain.entity.FlashSaleItem;
    import com.tmdt.phone_store_backend.domain.entity.ProductSpecification;
    import com.tmdt.phone_store_backend.domain.entity.ProductVariant;
    import com.tmdt.phone_store_backend.domain.enums.ProductStatus;
    import com.tmdt.phone_store_backend.domain.enums.StockStatus;
    import com.tmdt.phone_store_backend.dto.AdminProductDto;
    import com.tmdt.phone_store_backend.dto.AdminProductRequestDto;
    import com.tmdt.phone_store_backend.dto.AdminProductVariantDto;
    import com.tmdt.phone_store_backend.dto.AdminProductVariantRequestDto;
    import com.tmdt.phone_store_backend.dto.BrandDto;
    import com.tmdt.phone_store_backend.dto.HomeBrandSectionDto;
    import com.tmdt.phone_store_backend.dto.ProductVariantColorDto;
    import com.tmdt.phone_store_backend.dto.ProductVariantOptionDto;
    import com.tmdt.phone_store_backend.exception.ResourceAlreadyExistsException;
    import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
    import com.tmdt.phone_store_backend.repository.BrandRepository;
    import com.tmdt.phone_store_backend.repository.BannerRepository;
    import com.tmdt.phone_store_backend.repository.CategoryRepository;
    import com.tmdt.phone_store_backend.repository.InventoryRepository;
    import com.tmdt.phone_store_backend.repository.ProductImageRepository;
    import com.tmdt.phone_store_backend.repository.ProductRepository;
    import com.tmdt.phone_store_backend.repository.ProductSpecificationRepository;
    import com.tmdt.phone_store_backend.repository.ProductVariantRepository;
    import com.tmdt.phone_store_backend.repository.FlashSaleItemRepository;
    import com.tmdt.phone_store_backend.repository.FlashSaleRepository;
    import java.math.BigDecimal;
    import java.math.RoundingMode;
    import java.time.LocalDateTime;
    import java.util.ArrayList;
    import java.util.Comparator;
    import java.util.HashMap;
    import java.util.LinkedHashMap;
    import java.util.List;
    import java.util.HashSet;
    import java.util.Locale;
    import java.util.Map;
    import java.util.Objects;
    import java.util.Set;
    import lombok.AllArgsConstructor;
    import org.springframework.stereotype.Service;
    import org.springframework.transaction.annotation.Transactional;

    @Service
    @AllArgsConstructor
    @Transactional
    public class ProductAdminService {

        private final ProductRepository productRepository;
        private final BrandRepository brandRepository;
        private final BannerRepository bannerRepository;
        private final CategoryRepository categoryRepository;
        private final ProductVariantRepository productVariantRepository;
        private final InventoryRepository inventoryRepository;
        private final ProductImageRepository productImageRepository;
        private final ProductSpecificationRepository productSpecificationRepository;
        private final FlashSaleRepository flashSaleRepository;
        private final FlashSaleItemRepository flashSaleItemRepository;

        public List<AdminProductDto> getAllProducts() {
            return productRepository.findByDeletedAtIsNullOrderByCreatedAtDesc().stream()
                    .map(this::toDto)
                    .toList();
        }

        public List<AdminProductDto> getPublicProducts(String brandSlug,
                String price,
                String storage,
                String sort,
                Integer limit) {
            return productRepository.findByDeletedAtIsNullOrderByCreatedAtDesc().stream()
                    .filter(product -> matchesBrand(product, brandSlug))
                    .map(this::toDto)
                    .filter(dto -> matchesPrice(dto, price))
                    .filter(dto -> matchesStorage(dto, storage))
                    .sorted(resolveComparator(sort))
                    .limit(limit != null && limit > 0 ? limit : Long.MAX_VALUE)
                    .toList();
        }

        public List<AdminProductDto> getFeaturedProducts() {
            return productRepository.findByDeletedAtIsNullOrderByCreatedAtDesc().stream()
                    .filter(p -> Boolean.TRUE.equals(p.getIsFeatured()))
                    .map(this::toDto)
                    .toList();
        }

        public List<AdminProductDto> getLatestProducts(Integer limit) {
            return getPublicProducts(null, null, null, "release-desc", limit);
        }

        public List<AdminProductDto> getFlashSaleProducts(Integer limit) {
            LocalDateTime now = LocalDateTime.now();
            List<FlashSale> activeSales = flashSaleRepository.findActiveFlashSales(now);
            if (activeSales.isEmpty()) {
                return List.of();
            }

            FlashSale flashSale = activeSales.get(0);
            return flashSaleItemRepository.findByFlashSaleOrderByPromotionDesc(flashSale).stream()
                    .filter(item -> item.getProduct() != null)
                    .filter(item -> item.getQuantity() == null || item.getQuantity() > 0)
                    .filter(item -> item.getProduct().getDeletedAt() == null)
                    .filter(item -> item.getProduct().getStatus() == ProductStatus.ACTIVE)
                    .map(this::toDto)
                    .limit(limit != null && limit > 0 ? limit : 12L)
                    .toList();
        }

        private AdminProductDto toDto(FlashSaleItem item) {
            AdminProductDto dto = toDto(item.getProduct());
            int salePercent = item.getPromotion() != null
                    ? item.getPromotion().setScale(0, RoundingMode.HALF_UP).intValue()
                    : 0;

            BigDecimal basePrice = dto.getPrice() == null ? BigDecimal.ZERO : dto.getPrice();
            if (salePercent > 0) {
                dto.setPrice(basePrice.multiply(BigDecimal.valueOf(100 - salePercent))
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
            }
            dto.setSale(salePercent);
            dto.setStock(item.getQuantity() != null ? item.getQuantity() : dto.getStock());
            return dto;
        }

        public List<HomeBrandSectionDto> getHomeBrandSections(List<String> brandSlugs, Integer limitPerBrand) {
            List<String> normalizedSlugs = (brandSlugs == null || brandSlugs.isEmpty())
                    ? List.of("apple", "samsung", "xiaomi")
                    : brandSlugs.stream()
                            .filter(Objects::nonNull)
                            .map(String::trim)
                            .filter(value -> !value.isBlank())
                            .toList();

            int size = limitPerBrand != null && limitPerBrand > 0 ? limitPerBrand : 8;

            return normalizedSlugs.stream()
                    .map(slug -> buildHomeBrandSection(slug, size))
                    .filter(Objects::nonNull)
                    .toList();
        }

        public AdminProductDto getPublicProductDetail(String idOrSlug) {
            Product product;
            if (idOrSlug != null && idOrSlug.matches("^[0-9]+$")) {
                product = productRepository.findByIdAndDeletedAtIsNull(Long.parseLong(idOrSlug))
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm: " + idOrSlug));
            } else {
                product = productRepository.findBySlugAndDeletedAtIsNull(idOrSlug)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm: " + idOrSlug));
            }
            return toDto(product);
        }

        public AdminProductDto createProduct(AdminProductRequestDto requestDto) {
            Brand brand = getOrCreateBrand(requestDto.getBrand());
            Category category = getOrCreateDefaultCategory();

            LocalDateTime now = LocalDateTime.now();
            Product product = new Product();
            product.setName(requestDto.getName().trim());
            product.setSlug(generateSlug(requestDto.getName()));
            product.setBrand(brand);
            product.setCategory(category);
            product.setShortDescription(getDescription(requestDto));
            product.setDetailDescription(getDescription(requestDto));
            product.setStatus(ProductStatus.ACTIVE);
            product.setSale(requestDto.getSale() != null ? requestDto.getSale() : 0);
            product.setIsFeatured(Boolean.FALSE);
            product.setWarrantyMonths(12);
            product.setCreatedAt(now);
            product.setUpdatedAt(now);
            Product savedProduct = productRepository.save(product);

            saveVariants(savedProduct, requestDto, now);

            saveImages(savedProduct, requestDto.getImages(), now);
            saveSpecifications(savedProduct, requestDto.getSpecifications(), now);

            return toDto(savedProduct);
        }

        public AdminProductDto updateProduct(Long id, AdminProductRequestDto requestDto) {
            Product product = productRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm: " + id));

            Brand brand = getOrCreateBrand(requestDto.getBrand());
            LocalDateTime now = LocalDateTime.now();

            product.setName(requestDto.getName().trim());
            product.setSlug(generateSlug(requestDto.getName()));
            product.setBrand(brand);
            product.setShortDescription(getDescription(requestDto));
            product.setDetailDescription(getDescription(requestDto));
            product.setSale(requestDto.getSale() != null ? requestDto.getSale() : 0);
            product.setUpdatedAt(now);
            productRepository.save(product);

            deleteVariantsByProductId(id);
            saveVariants(product, requestDto, now);

            productImageRepository.deleteByProductId(id);
            saveImages(product, requestDto.getImages(), now);

            productSpecificationRepository.deleteByProductId(id);
            saveSpecifications(product, requestDto.getSpecifications(), now);

            return toDto(product);
        }

        public void deleteProduct(Long id) {
            Product product = productRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm: " + id));

            productImageRepository.deleteByProductId(id);
            productSpecificationRepository.deleteByProductId(id);

            deleteVariantsByProductId(id);
            productRepository.delete(product);
        }

        private AdminProductDto toDto(Product product) {
            List<ProductVariant> variants = productVariantRepository.findByProductId(product.getId());
            int stock = 0;
            BigDecimal price = BigDecimal.ZERO;
            List<AdminProductVariantDto> variantItems = new ArrayList<>();
            Map<String, BigDecimal> basePrices = new LinkedHashMap<>();
            Map<String, ProductVariantColorDto> colorOptions = new LinkedHashMap<>();

            for (ProductVariant variant : variants) {
                int variantStock = inventoryRepository.findByVariantId(variant.getId())
                        .map(Inventory::getQuantityOnHand)
                        .orElse(0);
                BigDecimal variantPrice = variant.getPrice() == null ? BigDecimal.ZERO : variant.getPrice();

                stock += variantStock;
                if (price.compareTo(BigDecimal.ZERO) == 0 || variantPrice.compareTo(price) < 0) {
                    price = variantPrice;
                }

                String storageLabel = getStorageLabel(variant);
                String color = normalizeColor(variant.getColor());

                if (!storageLabel.isBlank() && !basePrices.containsKey(storageLabel)) {
                    basePrices.put(storageLabel, variantPrice);
                }
                colorOptions.putIfAbsent(
                        color,
                        new ProductVariantColorDto(color, mapColorHex(color)));

                AdminProductVariantDto variantDto = new AdminProductVariantDto();
                variantDto.setId(variant.getId());
                variantDto.setSku(variant.getSku());
                variantDto.setColor(color);
                variantDto.setStorageLabel(storageLabel);
                variantDto.setRamGb(variant.getRamGb());
                variantDto.setStorageGb(variant.getStorageGb());
                variantDto.setPrice(variantPrice);
                variantDto.setStock(variantStock);
                variantItems.add(variantDto);
            }

            ProductVariantOptionDto variantOptions = new ProductVariantOptionDto();
            variantOptions.setStorages(new ArrayList<>(basePrices.keySet()));
            variantOptions.setColors(new ArrayList<>(colorOptions.values()));
            variantOptions.setBasePrices(basePrices);

            List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAscIdAsc(
                    product.getId());
            Map<String, String> specs = new HashMap<>();
            for (ProductSpecification specification : productSpecificationRepository
                    .findByProductIdOrderBySortOrderAscIdAsc(product.getId())) {
                specs.put(specification.getSpecKey(), specification.getSpecValue());
            }

            AdminProductDto dto = new AdminProductDto();
            dto.setId(product.getId());
            dto.setSlug(product.getSlug());
            dto.setName(product.getName());
            dto.setBrand(product.getBrand().getName());
            dto.setBrandSlug(product.getBrand().getSlug());
            dto.setPrice(price);
            dto.setStock(stock);
            dto.setSale(product.getSale() != null ? product.getSale() : 0);
            dto.setDescription(product.getDetailDescription());
            dto.setImages(images.stream().map(ProductImage::getImageUrl).toList());
            dto.setSpecifications(specs);
            dto.setVariants(variantOptions);
            dto.setVariantItems(variantItems);
            dto.setIsFeatured(product.getIsFeatured());
            dto.setCreatedAt(product.getCreatedAt());
            dto.setReleaseDate(product.getCreatedAt());
            return dto;
        }

        private HomeBrandSectionDto buildHomeBrandSection(String brandSlug, int limitPerBrand) {
            Brand brand = brandRepository.findBySlugIgnoreCase(brandSlug).orElse(null);
            if (brand == null || !Boolean.TRUE.equals(brand.getIsActive())) {
                return null;
            }

            List<AdminProductDto> products = getPublicProducts(brandSlug, null, null, "release-desc", limitPerBrand);
            if (products.isEmpty()) {
                return null;
            }

            HomeBrandSectionDto dto = new HomeBrandSectionDto();
            dto.setBrand(toBrandDto(brand));

            Banner banner = bannerRepository.findActiveBannersByPosition("brand_section_" + brandSlug, LocalDateTime.now())
                    .stream()
                    .findFirst()
                    .orElse(null);

            dto.setBannerUrl(banner != null ? banner.getImageUrl()
                    : products.getFirst().getImages().stream().findFirst().orElse(null));
            dto.setBannerLinkUrl(banner != null ? banner.getLinkUrl() : "/brands/" + brand.getSlug());
            dto.setProducts(products);
            return dto;
        }

        private BrandDto toBrandDto(Brand brand) {
            BrandDto dto = new BrandDto();
            dto.setId(brand.getId());
            dto.setName(brand.getName());
            dto.setSlug(brand.getSlug());
            dto.setLogoUrl(brand.getLogoUrl());
            return dto;
        }

        private boolean matchesBrand(Product product, String brandSlug) {
            if (brandSlug == null || brandSlug.isBlank()) {
                return true;
            }

            String normalized = brandSlug.trim().toLowerCase(Locale.ROOT);
            return product.getBrand() != null
                    && product.getBrand().getSlug() != null
                    && product.getBrand().getSlug().toLowerCase(Locale.ROOT).equals(normalized);
        }

        private boolean matchesPrice(AdminProductDto dto, String priceKey) {
            if (priceKey == null || priceKey.isBlank()) {
                return true;
            }

            BigDecimal price = dto.getPrice() == null ? BigDecimal.ZERO : dto.getPrice();
            return switch (priceKey.trim().toLowerCase(Locale.ROOT)) {
                case "under-5m" -> price.compareTo(BigDecimal.valueOf(5_000_000L)) < 0;
                case "5-10m" -> price.compareTo(BigDecimal.valueOf(5_000_000L)) >= 0
                        && price.compareTo(BigDecimal.valueOf(10_000_000L)) <= 0;
                case "10-20m" -> price.compareTo(BigDecimal.valueOf(10_000_000L)) >= 0
                        && price.compareTo(BigDecimal.valueOf(20_000_000L)) <= 0;
                case "above-20m" -> price.compareTo(BigDecimal.valueOf(20_000_000L)) > 0;
                default -> true;
            };
        }

        private boolean matchesStorage(AdminProductDto dto, String storage) {
            if (storage == null || storage.isBlank()) {
                return true;
            }

            String normalized = storage.trim().toUpperCase(Locale.ROOT);
            if (dto.getVariants() != null && dto.getVariants().getStorages() != null) {
                return dto.getVariants().getStorages().stream()
                        .filter(Objects::nonNull)
                        .map(value -> value.trim().toUpperCase(Locale.ROOT))
                        .anyMatch(normalized::equals);
            }
            return false;
        }

        private Comparator<AdminProductDto> resolveComparator(String sort) {
            String normalized = sort == null ? "" : sort.trim().toLowerCase(Locale.ROOT);

            return switch (normalized) {
                case "price-asc" -> Comparator.comparing(
                        dto -> Objects.requireNonNullElse(dto.getPrice(), BigDecimal.ZERO));
                case "price-desc" -> Comparator.comparing(
                        (AdminProductDto dto) -> Objects.requireNonNullElse(dto.getPrice(), BigDecimal.ZERO)).reversed();
                case "release-asc" -> Comparator.comparing(
                        dto -> Objects.requireNonNullElse(dto.getReleaseDate(), LocalDateTime.MIN));
                case "release-desc", "newest", "featured" -> Comparator.comparing(
                        (AdminProductDto dto) -> Objects.requireNonNullElse(dto.getReleaseDate(), LocalDateTime.MIN))
                        .reversed();
                default -> Comparator.comparing(
                        (AdminProductDto dto) -> Objects.requireNonNullElse(dto.getCreatedAt(), LocalDateTime.MIN))
                        .reversed();
            };
        }

        private void deleteVariantsByProductId(Long productId) {
            List<ProductVariant> variants = productVariantRepository.findByProductId(productId);
            for (ProductVariant variant : variants) {
                inventoryRepository.findByVariantId(variant.getId())
                        .ifPresent(inventoryRepository::delete);
            }
            if (!variants.isEmpty()) {
                productVariantRepository.deleteAll(variants);
            }
            inventoryRepository.flush();
            productVariantRepository.flush();
        }

        private void saveVariants(Product product, AdminProductRequestDto requestDto, LocalDateTime now) {
            List<AdminProductVariantRequestDto> variants = normalizeVariants(requestDto);
            for (int index = 0; index < variants.size(); index++) {
                AdminProductVariantRequestDto variantRequest = variants.get(index);

                ProductVariant variant = new ProductVariant();
                variant.setProduct(product);
                variant.setSku(generateSku(product.getId(), variantRequest, index + 1));
                variant.setColor(normalizeColor(variantRequest.getColor()));
                variant.setRamGb(variantRequest.getRamGb());
                variant.setStorageGb(resolveStorageGb(variantRequest));
                variant.setPrice(resolveVariantPrice(variantRequest, requestDto.getPrice()));
                variant.setIsActive(Boolean.TRUE);
                variant.setCreatedAt(now);
                variant.setUpdatedAt(now);
                ProductVariant savedVariant = productVariantRepository.save(variant);

                int quantityOnHand = Math.max(0, resolveVariantStock(variantRequest, requestDto.getStock()));

                Inventory inventory = new Inventory();
                inventory.setVariant(savedVariant);
                inventory.setQuantityOnHand(quantityOnHand);
                inventory.setQuantityReserved(0);
                inventory.setReorderLevel(5);
                inventory.setStockStatus(resolveStockStatus(quantityOnHand));
                inventory.setUpdatedAt(now);
                inventoryRepository.save(inventory);
            }
        }

        private List<AdminProductVariantRequestDto> normalizeVariants(AdminProductRequestDto requestDto) {
            List<AdminProductVariantRequestDto> normalized = new ArrayList<>();
            if (requestDto.getVariants() != null) {
                for (AdminProductVariantRequestDto variant : requestDto.getVariants()) {
                    if (variant == null) {
                        continue;
                    }
                    boolean hasValue = (variant.getColor() != null && !variant.getColor().isBlank())
                            || (variant.getStorageLabel() != null && !variant.getStorageLabel().isBlank())
                            || variant.getStorageGb() != null
                            || variant.getRamGb() != null
                            || variant.getPrice() != null
                            || variant.getStock() != null;
                    if (!hasValue) {
                        continue;
                    }
                    normalized.add(variant);
                }
            }

            if (!normalized.isEmpty()) {
                validateDuplicateVariants(normalized);
                return normalized;
            }

            AdminProductVariantRequestDto fallback = new AdminProductVariantRequestDto();
            fallback.setColor("Default");
            fallback.setPrice(requestDto.getPrice());
            fallback.setStock(requestDto.getStock());
            normalized.add(fallback);
            return normalized;
        }

        private void validateDuplicateVariants(List<AdminProductVariantRequestDto> variants) {
            Set<String> keys = new HashSet<>();
            for (AdminProductVariantRequestDto variant : variants) {
                String colorKey = normalizeColor(variant.getColor()).toLowerCase(Locale.ROOT);
                String ramKey = Objects.toString(variant.getRamGb(), "default").toLowerCase(Locale.ROOT);
                String storageKey = ((variant.getStorageLabel() == null || variant.getStorageLabel().isBlank())
                        ? Objects.toString(variant.getStorageGb(), "default")
                        : variant.getStorageLabel().trim())
                        .toLowerCase(Locale.ROOT);
                String compound = colorKey + "|" + ramKey + "|" + storageKey;
                if (!keys.add(compound)) {
                    throw new ResourceAlreadyExistsException(
                            "Biến thể bị trùng màu, RAM và dung lượng: " + normalizeColor(variant.getColor())
                                    + " - " + ramKey.toUpperCase(Locale.ROOT) + " - "
                                    + storageKey.toUpperCase(Locale.ROOT));
                }
            }
        }

        private BigDecimal resolveVariantPrice(AdminProductVariantRequestDto variant, BigDecimal defaultPrice) {
            if (variant.getPrice() != null) {
                return variant.getPrice();
            }
            return Objects.requireNonNullElse(defaultPrice, BigDecimal.ZERO);
        }

        private int resolveVariantStock(AdminProductVariantRequestDto variant, Integer defaultStock) {
            if (variant.getStock() != null) {
                return variant.getStock();
            }
            return Objects.requireNonNullElse(defaultStock, 0);
        }

        private Integer resolveStorageGb(AdminProductVariantRequestDto variant) {
            if (variant.getStorageGb() != null) {
                return variant.getStorageGb();
            }
            String storageLabel = variant.getStorageLabel();
            if (storageLabel == null || storageLabel.isBlank()) {
                return null;
            }
            String digitsOnly = storageLabel.replaceAll("[^0-9]", "");
            if (digitsOnly.isBlank()) {
                return null;
            }
            int numericValue = Integer.parseInt(digitsOnly);
            if (storageLabel.trim().toUpperCase(Locale.ROOT).endsWith("TB")) {
                return numericValue * 1024;
            }
            return numericValue;
        }

        private String getStorageLabel(ProductVariant variant) {
            if (variant.getStorageGb() != null && variant.getStorageGb() > 0) {
                if (variant.getStorageGb() % 1024 == 0) {
                    return (variant.getStorageGb() / 1024) + "TB";
                }
                return variant.getStorageGb() + "GB";
            }
            return "Mặc định";
        }

        private String normalizeColor(String color) {
            if (color == null || color.isBlank()) {
                return "Default";
            }
            return color.trim();
        }

        private String generateSku(Long productId, AdminProductVariantRequestDto variant, int index) {
            String colorPart = normalizeColor(variant.getColor())
                    .replaceAll("[^a-zA-Z0-9]", "")
                    .toUpperCase(Locale.ROOT);
            if (colorPart.isBlank()) {
                colorPart = "DEFAULT";
            }

            String ramPart = variant.getRamGb() != null ? variant.getRamGb() + "GB" : "RAM";

            String storagePart = "STD";
            if (variant.getStorageLabel() != null && !variant.getStorageLabel().isBlank()) {
                storagePart = variant.getStorageLabel().replaceAll("[^a-zA-Z0-9]", "")
                        .toUpperCase(Locale.ROOT);
            } else if (variant.getStorageGb() != null) {
                storagePart = variant.getStorageGb() + "GB";
            }

            String sku = "SKU-" + productId + "-" + index + "-" + colorPart + "-" + ramPart + "-" + storagePart;
            if (sku.length() > 120) {
                return sku.substring(0, 120);
            }
            return sku;
        }

        private String mapColorHex(String colorName) {
            String normalized = colorName == null ? "" : colorName.toLowerCase(Locale.ROOT);
            if (normalized.contains("black") || normalized.contains("đen")) {
                return "#1f2937";
            }
            if (normalized.contains("white") || normalized.contains("trắng")) {
                return "#f3f4f6";
            }
            if (normalized.contains("blue") || normalized.contains("xanh")) {
                return "#2563eb";
            }
            if (normalized.contains("green") || normalized.contains("lục")) {
                return "#16a34a";
            }
            if (normalized.contains("red") || normalized.contains("đỏ")) {
                return "#dc2626";
            }
            if (normalized.contains("gold") || normalized.contains("vàng")) {
                return "#ca8a04";
            }
            return "#6b7280";
        }

        private void saveImages(Product product, List<String> imageUrls, LocalDateTime now) {
            if (imageUrls == null || imageUrls.isEmpty()) {
                return;
            }
            List<ProductImage> images = new ArrayList<>();
            for (int i = 0; i < imageUrls.size(); i++) {
                String imageUrl = imageUrls.get(i);
                if (imageUrl == null || imageUrl.isBlank()) {
                    continue;
                }
                ProductImage image = new ProductImage();
                image.setProduct(product);
                image.setImageUrl(imageUrl.trim());
                image.setSortOrder(i);
                image.setIsPrimary(i == 0);
                image.setCreatedAt(now);
                images.add(image);
            }
            if (!images.isEmpty()) {
                productImageRepository.saveAll(images);
            }
        }

        private void saveSpecifications(Product product, Map<String, String> specs, LocalDateTime now) {
            if (specs == null || specs.isEmpty()) {
                return;
            }
            List<ProductSpecification> specifications = new ArrayList<>();
            int i = 0;
            for (Map.Entry<String, String> entry : specs.entrySet()) {
                if (entry.getValue() == null || entry.getValue().isBlank()) {
                    continue;
                }
                ProductSpecification specification = new ProductSpecification();
                specification.setProduct(product);
                specification.setSpecKey(entry.getKey());
                specification.setSpecValue(entry.getValue().trim());
                specification.setSortOrder(i++);
                specification.setCreatedAt(now);
                specification.setUpdatedAt(now);
                specifications.add(specification);
            }
            if (!specifications.isEmpty()) {
                productSpecificationRepository.saveAll(specifications);
            }
        }

        private Brand getOrCreateBrand(String brandName) {
            String normalized = brandName == null ? "Unknown" : brandName.trim();
            return brandRepository.findByNameIgnoreCase(normalized)
                    .orElseGet(() -> {
                        LocalDateTime now = LocalDateTime.now();
                        Brand brand = new Brand();
                        brand.setName(normalized);
                        brand.setSlug(generateSlug(normalized));
                        brand.setIsActive(Boolean.TRUE);
                        brand.setCreatedAt(now);
                        brand.setUpdatedAt(now);
                        return brandRepository.save(brand);
                    });
        }

        private Category getOrCreateDefaultCategory() {
            return categoryRepository.findByNameIgnoreCase("Điện thoại")
                    .orElseGet(() -> {
                        LocalDateTime now = LocalDateTime.now();
                        Category category = new Category();
                        category.setName("Điện thoại");
                        category.setSlug("dien-thoai");
                        category.setIsActive(Boolean.TRUE);
                        category.setCreatedAt(now);
                        category.setUpdatedAt(now);
                        return categoryRepository.save(category);
                    });
        }

        private String getDescription(AdminProductRequestDto requestDto) {
            if (requestDto.getDescription() == null || requestDto.getDescription().isBlank()) {
                return "Chưa có mô tả";
            }
            return requestDto.getDescription().trim();
        }

        private String generateSlug(String value) {
            String slug = value == null ? "item"
                    : value.toLowerCase(Locale.ROOT)
                            .replaceAll("[^a-z0-9\\s-]", "")
                            .replaceAll("\\s+", "-")
                            .replaceAll("-+", "-")
                            .replaceAll("(^-|-$)", "");
            if (slug.isBlank()) {
                slug = "item";
            }
            return slug + "-" + System.currentTimeMillis();
        }

        private StockStatus resolveStockStatus(Integer stock) {
            int quantity = stock == null ? 0 : stock;
            if (quantity <= 0) {
                return StockStatus.OUT_OF_STOCK;
            }
            if (quantity <= 5) {
                return StockStatus.LOW_STOCK;
            }
            return StockStatus.IN_STOCK;
        }
    }
