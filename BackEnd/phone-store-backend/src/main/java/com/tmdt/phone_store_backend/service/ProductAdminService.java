    package com.tmdt.phone_store_backend.service;

    import com.tmdt.phone_store_backend.domain.entity.Brand;
    import com.tmdt.phone_store_backend.domain.entity.Banner;
    import com.tmdt.phone_store_backend.domain.entity.Category;
    import com.tmdt.phone_store_backend.domain.entity.Inventory;
    import com.tmdt.phone_store_backend.domain.entity.Product;
    import com.tmdt.phone_store_backend.domain.entity.ProductImage;
    import com.tmdt.phone_store_backend.domain.entity.FlashSaleCampaign;
    import com.tmdt.phone_store_backend.domain.entity.FlashSaleProduct;
    import com.tmdt.phone_store_backend.domain.entity.ProductSpecification;
    import com.tmdt.phone_store_backend.domain.entity.ProductVariant;
    import com.tmdt.phone_store_backend.domain.entity.ProductSeries;
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
    import com.tmdt.phone_store_backend.repository.ProductSeriesRepository;
    import com.tmdt.phone_store_backend.repository.ProductSpecificationRepository;
    import com.tmdt.phone_store_backend.repository.ProductVariantRepository;
    import com.tmdt.phone_store_backend.repository.FlashSaleCampaignRepository;
    import com.tmdt.phone_store_backend.repository.FlashSaleProductRepository;
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
    import java.util.Optional;
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
        private final ProductSeriesRepository productSeriesRepository;
        private final ProductVariantRepository productVariantRepository;
        private final InventoryRepository inventoryRepository;
        private final ProductImageRepository productImageRepository;
        private final ProductSpecificationRepository productSpecificationRepository;
        private final FlashSaleCampaignRepository flashSaleCampaignRepository;
        private final FlashSaleProductRepository flashSaleProductRepository;

        public List<AdminProductDto> getAllProducts() {
            return productRepository.findByDeletedAtIsNullOrderByCreatedAtDesc().stream()
                    .map(this::toDto)
                    .toList();
        }

        public List<AdminProductDto> getPublicProducts(String brandSlug,
                String price,
                String storage,
                String sort,
                Integer limit,
                String seriesSlug) {
            List<Product> products = productRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();

            // Filter by series slug first
            if (seriesSlug != null && !seriesSlug.isBlank()) {
                products = products.stream()
                        .filter(p -> p.getSeries() != null && seriesSlug.equalsIgnoreCase(p.getSeries().getSlug()))
                        .toList();
            }

            return products.stream()
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
            return getPublicProducts(null, null, null, "release-desc", limit, null);
        }

        public List<AdminProductDto> getRelatedProducts(String baseName) {
            if (baseName == null || baseName.isBlank()) {
                return List.of();
            }
            return productRepository.findByBaseNameIgnoreCaseAndDeletedAtIsNull(baseName).stream()
                    .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
                    .map(this::toDto)
                    .toList();
        }

        public List<AdminProductDto> getFlashSaleProducts(Integer limit) {
            LocalDateTime now = LocalDateTime.now();
            List<FlashSaleCampaign> activeCampaigns = flashSaleCampaignRepository.findAllActiveCampaigns(now);
            if (activeCampaigns.isEmpty()) {
                return List.of();
            }

            FlashSaleCampaign campaign = activeCampaigns.get(0);
            return campaign.getSessions().stream()
                    .filter(s -> "RUNNING".equals(s.getStatus().name()))
                    .flatMap(session -> flashSaleProductRepository.findBySessionIdOrderBySortOrderAsc(session.getId()).stream())
                    .filter(fp -> fp.getVariant() != null && fp.getVariant().getProduct() != null)
                    .filter(fp -> fp.getVariant().getProduct().getDeletedAt() == null)
                    .filter(fp -> fp.getVariant().getProduct().getStatus() == ProductStatus.ACTIVE)
                    .filter(fp -> fp.getQuantity() == null || fp.getQuantity() > 0)
                    .map(fp -> toDtoFromFlashSaleProduct(fp))
                    .limit(limit != null && limit > 0 ? limit : 12L)
                    .toList();
        }

        private AdminProductDto toDtoFromFlashSaleProduct(com.tmdt.phone_store_backend.domain.entity.FlashSaleProduct fp) {
            AdminProductDto dto = toDto(fp.getVariant().getProduct());
            ProductVariant variant = fp.getVariant();
            BigDecimal originalPrice = variant.getPrice() != null ? variant.getPrice() : BigDecimal.ZERO;
            BigDecimal flashPrice = fp.getFlashPrice() != null ? fp.getFlashPrice() : originalPrice;
            int salePercent = 0;
            if (originalPrice.compareTo(BigDecimal.ZERO) > 0) {
                salePercent = originalPrice.subtract(flashPrice)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(originalPrice, 0, RoundingMode.HALF_UP).intValue();
            }
            dto.setPrice(flashPrice);
            dto.setSale(salePercent);
            dto.setStock(fp.getQuantity() != null ? fp.getQuantity() : dto.getStock());
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
                // Try exact match first
                Optional<Product> exactMatch = productRepository.findBySlugAndDeletedAtIsNull(idOrSlug);
                if (exactMatch.isPresent()) {
                    product = exactMatch.get();
                } else {
                    // Fallback: try to find by prefix (handles old slugs with hash suffixes)
                    // Extract base slug (remove hash suffix like "-abc12345")
                    String baseSlug = idOrSlug;
                    if (idOrSlug.matches(".*-[a-z0-9]{6,}$")) {
                        baseSlug = idOrSlug.replaceAll("-[a-z0-9]{6,}$", "");
                    }
                    product = productRepository.findBySlugOrPrefix(idOrSlug, baseSlug + "-")
                            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm: " + idOrSlug));
                }
            }

            AdminProductDto dto = toDto(product);

            // Attach related products (same baseName, different storage variants) for the variant switcher
            List<AdminProductDto> relatedProducts = getRelatedProducts(product.getBaseName()).stream()
                    .filter(p -> !p.getId().equals(product.getId()))
                    .toList();
            dto.setVariantOptions(buildVariantOptionsFromRelated(dto, relatedProducts));
            dto.setRelatedProducts(relatedProducts);

            // Check for active flash sale on the variant
            List<ProductVariant> productVariants = productVariantRepository.findByProductId(product.getId());
            BigDecimal minFlashPrice = null;
            Long flashSaleSessionId = null;

            for (ProductVariant variant : productVariants) {
                List<FlashSaleProduct> activeFlashSales = flashSaleProductRepository.findActiveByVariantId(variant.getId());

                if (activeFlashSales != null && !activeFlashSales.isEmpty()) {
                    FlashSaleProduct fp = activeFlashSales.get(0);
                    BigDecimal flashPrice = fp.getFlashPrice();
                    if (minFlashPrice == null || flashPrice.compareTo(minFlashPrice) < 0) {
                        minFlashPrice = flashPrice;
                        flashSaleSessionId = fp.getSession().getId();
                    }
                    // Update variant price in-place
                    if (dto.getVariantItems() != null) {
                        for (AdminProductVariantDto vdto : dto.getVariantItems()) {
                            if (vdto.getId().equals(variant.getId())) {
                                vdto.setPrice(flashPrice);
                                break;
                            }
                        }
                    }
                }
            }

            if (minFlashPrice != null) {
                dto.setPrice(minFlashPrice);
                dto.setFlashSalePrice(minFlashPrice);
                dto.setFlashSaleId(flashSaleSessionId);
                dto.setIsFlashSale(true);
            }

            return dto;
        }

        private ProductVariantOptionDto buildVariantOptionsFromRelated(
                AdminProductDto currentDto, List<AdminProductDto> relatedProducts) {
            // Collect all storage labels and colors from current + all related products
            Map<String, BigDecimal> allStorages = new LinkedHashMap<>();
            Map<String, ProductVariantColorDto> allColors = new LinkedHashMap<>();

            // Add from current product
            if (currentDto.getVariantItems() != null) {
                for (AdminProductVariantDto v : currentDto.getVariantItems()) {
                    if (v.getStorageLabel() != null && !v.getStorageLabel().isBlank()) {
                        allStorages.putIfAbsent(v.getStorageLabel(),
                                v.getPrice() != null ? v.getPrice() : BigDecimal.ZERO);
                    }
                    if (v.getColor() != null && !v.getColor().isBlank()) {
                        allColors.putIfAbsent(v.getColor(),
                                new ProductVariantColorDto(v.getColor(), mapColorHex(v.getColor()), null));
                    }
                }
            }

            // Add from related products (different storage variants of same baseName)
            for (AdminProductDto related : relatedProducts) {
                if (related.getVariantItems() != null) {
                    for (AdminProductVariantDto v : related.getVariantItems()) {
                        if (v.getStorageLabel() != null && !v.getStorageLabel().isBlank()) {
                            allStorages.putIfAbsent(v.getStorageLabel(),
                                    v.getPrice() != null ? v.getPrice() : BigDecimal.ZERO);
                        }
                        if (v.getColor() != null && !v.getColor().isBlank()) {
                            allColors.putIfAbsent(v.getColor(),
                                    new ProductVariantColorDto(v.getColor(), mapColorHex(v.getColor()), null));
                        }
                    }
                }
            }

            // Sort storages: numeric ascending
            List<String> sortedStorages = allStorages.entrySet().stream()
                    .sorted(Comparator.comparingInt(e -> parseStorageNumeric(e.getKey())))
                    .map(Map.Entry::getKey)
                    .toList();

            ProductVariantOptionDto opts = new ProductVariantOptionDto();
            opts.setStorages(sortedStorages);
            opts.setColors(new ArrayList<>(allColors.values()));
            opts.setBasePrices(allStorages);
            return opts;
        }

        private int parseStorageNumeric(String label) {
            if (label == null) return 0;
            String digits = label.replaceAll("[^0-9]", "");
            try {
                return Integer.parseInt(digits);
            } catch (NumberFormatException e) {
                return 0;
            }
        }

        public AdminProductDto createProduct(AdminProductRequestDto requestDto) {
            Brand brand = getOrCreateBrand(requestDto.getBrand());
            Category category = getOrCreateDefaultCategory();

            LocalDateTime now = LocalDateTime.now();
            ProductSeries series = null;
            if (requestDto.getSeriesId() != null) {
                series = productSeriesRepository.findById(requestDto.getSeriesId()).orElse(null);
            }

            // baseName is the shared product line name (e.g., "iPhone 17 Pro Max")
            String baseName = requestDto.getBaseName() != null && !requestDto.getBaseName().isBlank()
                    ? requestDto.getBaseName().trim()
                    : requestDto.getName().trim();

            // description shared across all variants
            String shortDesc = getDescription(requestDto);
            String detailDesc = getDescription(requestDto);

            List<AdminProductVariantRequestDto> normalizedVariants = normalizeVariants(requestDto);
            if (normalizedVariants.isEmpty()) {
                throw new IllegalArgumentException("Phải có ít nhất 1 phiên bản.");
            }

            // Create one Product per Variant (CellphoneS model: each storage/RAM combo = separate product)
            AdminProductDto firstResult = null;
            for (int i = 0; i < normalizedVariants.size(); i++) {
                AdminProductVariantRequestDto variantReq = normalizedVariants.get(i);
                Product product = new Product();
                product.setName(buildVariantName(baseName, variantReq));
                product.setBaseName(baseName);
                product.setSlug(generateSlug(product.getName()));
                product.setBrand(brand);
                product.setCategory(category);
                product.setSeries(series);
                product.setShortDescription(shortDesc);
                product.setDetailDescription(detailDesc);
                product.setStatus(ProductStatus.ACTIVE);
                product.setSale(requestDto.getSale() != null ? requestDto.getSale() : 0);
                product.setIsFeatured(Boolean.FALSE);
                product.setWarrantyMonths(12);
                product.setCreatedAt(now);
                product.setUpdatedAt(now);
                product.setThumbnailUrl(requestDto.getThumbnailUrl());
                Product savedProduct = productRepository.save(product);

                // Save variant (each product has exactly 1 variant)
                ProductVariant variant = new ProductVariant();
                variant.setProduct(savedProduct);
                variant.setSku(generateSku(savedProduct.getId(), variantReq, 1));
                variant.setColor(normalizeColor(variantReq.getColor()));
                variant.setRamGb(variantReq.getRamGb());
                variant.setStorageGb(resolveStorageGb(variantReq));
                variant.setPrice(resolveVariantPrice(variantReq, requestDto.getPrice()));
                variant.setIsActive(Boolean.TRUE);
                variant.setCreatedAt(now);
                variant.setUpdatedAt(now);
                ProductVariant savedVariant = productVariantRepository.save(variant);

                // Save inventory
                int quantityOnHand = Math.max(0, resolveVariantStock(variantReq, requestDto.getStock()));
                Inventory inventory = new Inventory();
                inventory.setVariant(savedVariant);
                inventory.setQuantityOnHand(quantityOnHand);
                inventory.setQuantityReserved(0);
                inventory.setReorderLevel(5);
                inventory.setStockStatus(resolveStockStatus(quantityOnHand));
                inventory.setUpdatedAt(now);
                inventoryRepository.save(inventory);

                // Save images and specs (only on the first product to avoid duplication)
                if (i == 0) {
                    saveImages(savedProduct, requestDto.getImages(), now);
                    saveSpecifications(savedProduct, requestDto.getSpecifications(), now);
                }

                AdminProductDto dto = toDto(savedProduct);
                if (firstResult == null) {
                    firstResult = dto;
                }
            }

            return firstResult;
        }

        public AdminProductDto updateProduct(Long id, AdminProductRequestDto requestDto) {
            Product product = productRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm: " + id));

            Brand brand = getOrCreateBrand(requestDto.getBrand());
            LocalDateTime now = LocalDateTime.now();

            // baseName is the shared product line name
            String baseName = requestDto.getBaseName() != null && !requestDto.getBaseName().isBlank()
                    ? requestDto.getBaseName().trim()
                    : product.getBaseName();

            product.setBaseName(baseName);
            product.setName(requestDto.getName().trim());
            product.setSlug(generateSlug(requestDto.getName()));
            product.setBrand(brand);
            if (requestDto.getSeriesId() != null) {
                product.setSeries(getOrCreateSeries(requestDto.getSeriesId()));
            } else {
                product.setSeries(null);
            }
            product.setShortDescription(getDescription(requestDto));
            product.setDetailDescription(getDescription(requestDto));
            product.setSale(requestDto.getSale() != null ? requestDto.getSale() : 0);
            product.setThumbnailUrl(requestDto.getThumbnailUrl());
            product.setUpdatedAt(now);
            productRepository.save(product);

            // Update only this product's single variant
            updateProductVariant(product, requestDto, now);

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
                        new ProductVariantColorDto(color, mapColorHex(color), null));

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
            dto.setBaseName(product.getBaseName());
            dto.setBrand(product.getBrand().getName());
            dto.setBrandSlug(product.getBrand().getSlug());
            if (product.getSeries() != null) {
                dto.setSeriesId(product.getSeries().getId());
                dto.setSeriesName(product.getSeries().getName());
                dto.setSeriesSlug(product.getSeries().getSlug());
            }
            dto.setPrice(price);
            dto.setStock(stock);
            dto.setSale(product.getSale() != null ? product.getSale() : 0);
            dto.setDescription(product.getDetailDescription());
            dto.setThumbnailUrl(product.getThumbnailUrl());
            dto.setImages(images.stream().map(ProductImage::getImageUrl).toList());
            dto.setSpecifications(specs);
            dto.setVariantOptions(variantOptions);
            dto.setVariants(variantItems);
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

            List<AdminProductDto> products = getPublicProducts(brandSlug, null, null, "release-desc", limitPerBrand, null);
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
            // Each product now has exactly 1 variant stored in variantItems
            if (dto.getVariantItems() != null && !dto.getVariantItems().isEmpty()) {
                for (AdminProductVariantDto item : dto.getVariantItems()) {
                    String label = item.getStorageLabel();
                    if (label != null && label.trim().toUpperCase(Locale.ROOT).equals(normalized)) {
                        return true;
                    }
                }
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

        private void updateProductVariant(Product product, AdminProductRequestDto requestDto, LocalDateTime now) {
            List<AdminProductVariantRequestDto> variants = normalizeVariants(requestDto);
            AdminProductVariantRequestDto variantReq = variants.isEmpty() ? null : variants.get(0);

            // Delete existing variant and inventory
            deleteVariantsByProductId(product.getId());

            if (variantReq == null) {
                return;
            }

            ProductVariant variant = new ProductVariant();
            variant.setProduct(product);
            variant.setSku(generateSku(product.getId(), variantReq, 1));
            variant.setColor(normalizeColor(variantReq.getColor()));
            variant.setRamGb(variantReq.getRamGb());
            variant.setStorageGb(resolveStorageGb(variantReq));
            variant.setPrice(resolveVariantPrice(variantReq, requestDto.getPrice()));
            variant.setIsActive(Boolean.TRUE);
            variant.setCreatedAt(now);
            variant.setUpdatedAt(now);
            ProductVariant savedVariant = productVariantRepository.save(variant);

            int quantityOnHand = Math.max(0, resolveVariantStock(variantReq, requestDto.getStock()));
            Inventory inventory = new Inventory();
            inventory.setVariant(savedVariant);
            inventory.setQuantityOnHand(quantityOnHand);
            inventory.setQuantityReserved(0);
            inventory.setReorderLevel(5);
            inventory.setStockStatus(resolveStockStatus(quantityOnHand));
            inventory.setUpdatedAt(now);
            inventoryRepository.save(inventory);
        }

        private String buildVariantName(String baseName, AdminProductVariantRequestDto variant) {
            StringBuilder sb = new StringBuilder(baseName != null ? baseName.trim() : "");
            if (variant.getRamGb() != null && variant.getRamGb() > 0) {
                sb.append(" ").append(variant.getRamGb()).append("GB RAM");
            }
            if (variant.getStorageLabel() != null && !variant.getStorageLabel().isBlank()) {
                if (sb.length() > 0) sb.append(" - ");
                sb.append(variant.getStorageLabel());
            } else if (variant.getStorageGb() != null && variant.getStorageGb() > 0) {
                if (sb.length() > 0) sb.append(" - ");
                sb.append(formatStorageGb(variant.getStorageGb()));
            }
            return sb.toString();
        }

        private String formatStorageGb(Integer storageGb) {
            if (storageGb == null || storageGb <= 0) return "";
            if (storageGb % 1024 == 0) {
                return (storageGb / 1024) + "TB";
            }
            return storageGb + "GB";
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

        private ProductSeries getOrCreateSeries(Long seriesId) {
            return productSeriesRepository.findById(seriesId)
                    .orElse(null);
        }

        private String getDescription(AdminProductRequestDto requestDto) {
            if (requestDto.getDescription() == null || requestDto.getDescription().isBlank()) {
                return "Chưa có mô tả";
            }
            return requestDto.getDescription().trim();
        }

        private String generateSlug(String value) {
            String baseSlug = value == null ? "san-pham"
                    : value.toLowerCase(Locale.ROOT)
                            .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                            .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                            .replaceAll("[ìíịỉĩ]", "i")
                            .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                            .replaceAll("[ùúụủũưừứựửữ]", "u")
                            .replaceAll("[ỳýỵỷỹ]", "y")
                            .replaceAll("đ", "d")
                            .replaceAll("[^a-z0-9\\s-]", "")
                            .replaceAll("\\s+", "-")
                            .replaceAll("-+", "-")
                            .replaceAll("(^-|-$)", "");
            if (baseSlug.isBlank()) {
                baseSlug = "san-pham";
            }
            // Check uniqueness and append number if needed
            String finalSlug = baseSlug;
            int counter = 1;
            while (productRepository.findBySlugAndDeletedAtIsNull(finalSlug).isPresent()) {
                finalSlug = baseSlug + "-" + counter;
                counter++;
            }
            return finalSlug;
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
