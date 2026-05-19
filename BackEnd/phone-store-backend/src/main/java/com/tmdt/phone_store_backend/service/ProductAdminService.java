package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.domain.entity.Brand;
import com.tmdt.phone_store_backend.domain.entity.Banner;
import com.tmdt.phone_store_backend.domain.entity.Category;
import com.tmdt.phone_store_backend.domain.entity.Inventory;
import com.tmdt.phone_store_backend.domain.entity.Product;
import com.tmdt.phone_store_backend.domain.entity.ProductImage;
import com.tmdt.phone_store_backend.domain.entity.FlashSaleCampaign;
import com.tmdt.phone_store_backend.domain.entity.FlashSaleProduct;
import com.tmdt.phone_store_backend.domain.entity.ProductDiscount;
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
import com.tmdt.phone_store_backend.repository.ProductDiscountRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
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
    private final ProductDiscountRepository discountRepository;

    // ══════════════════════════════════════════════════════════════
    //  READ
    // ══════════════════════════════════════════════════════════════

    public List<AdminProductDto> getAllProducts() {
        // Admin listing: one row per product (not expanded)
        return productRepository.findByDeletedAtIsNullOrderByCreatedAtDesc().stream()
                .map(this::toSingleDto)
                .toList();
    }

    public List<AdminProductDto> getPublicProducts(String brandSlug, String price,
            String storage, String sort, Integer limit, String seriesSlug) {
        List<Product> products = productRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();

        if (seriesSlug != null && !seriesSlug.isBlank()) {
            products = products.stream()
                    .filter(p -> p.getSeries() != null && seriesSlug.equalsIgnoreCase(p.getSeries().getSlug()))
                    .toList();
        }

        return products.stream()
                .filter(product -> matchesBrand(product, brandSlug))
                .flatMap(p -> toListDto(p).stream())
                .filter(dto -> matchesPrice(dto, price))
                .filter(dto -> matchesStorage(dto, storage))
                .sorted(resolveComparator(sort))
                .limit(limit != null && limit > 0 ? limit : Long.MAX_VALUE)
                .toList();
    }

    public List<AdminProductDto> getFeaturedProducts() {
        // Featured section: one row per product (not expanded)
        return productRepository.findByDeletedAtIsNullOrderByCreatedAtDesc().stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsFeatured()))
                .map(this::toSingleDto)
                .toList();
    }

    public List<AdminProductDto> getLatestProducts(Integer limit) {
        return getPublicProducts(null, null, null, "release-desc", limit, null);
    }

    public List<AdminProductDto> getRelatedProducts(String baseName) {
        if (baseName == null || baseName.isBlank()) {
            return List.of();
        }
        // Related = other products with same name (in old model) or same name (new model)
        return productRepository.findByNameIgnoreCaseAndDeletedAtIsNull(baseName).stream()
                .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
                .flatMap(p -> toListDto(p).stream())
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

    /**
     * Product detail by variant slug.
     * Flow: find variant by slug → get product → get all variants of that product
     */
    public AdminProductDto getPublicProductDetail(String variantSlug) {
        ProductVariant variant = productVariantRepository.findBySlug(variantSlug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên bản: " + variantSlug));

        Product product = variant.getProduct();
        if (product == null || product.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Không tìm thấy sản phẩm cho phiên bản: " + variantSlug);
        }

        AdminProductDto dto = toDetailDto(product, variant);

        // Check flash sale
        BigDecimal minFlashPrice = null;
        Long flashSaleSessionId = null;
        List<ProductVariant> allVariants = productVariantRepository.findByProductIdAndDeletedAtIsNull(product.getId());

        // Load active product discounts for all variants
        List<ProductDiscount> activeDiscounts = discountRepository.findAllActiveNow(LocalDateTime.now());

        for (ProductVariant v : allVariants) {
            // Apply product discount first
            ProductDiscount discount = getActiveDiscount(v.getId(), activeDiscounts);
            BigDecimal basePrice = v.getPrice();
            BigDecimal discountedPrice = applyDiscount(basePrice, discount);
            BigDecimal saleAmount = getDiscountSavedAmount(basePrice, discount);

            // Update variant DTO price
            if (dto.getVariants() != null) {
                for (AdminProductVariantDto vdto : dto.getVariants()) {
                    if (vdto.getId().equals(v.getId())) {
                        vdto.setPrice(discountedPrice);
                        vdto.setSaleAmount(saleAmount);
                        break;
                    }
                }
            }
            // Update selected variant if it matches
            if (dto.getSelectedVariant() != null && dto.getSelectedVariant().getId().equals(v.getId())) {
                dto.getSelectedVariant().setPrice(discountedPrice);
                dto.getSelectedVariant().setSaleAmount(saleAmount);
            }

            // Then check flash sale (flash sale overrides product discount)
            List<FlashSaleProduct> activeFlashSales = flashSaleProductRepository.findActiveByVariantId(v.getId());
            if (activeFlashSales != null && !activeFlashSales.isEmpty()) {
                FlashSaleProduct fp = activeFlashSales.get(0);
                BigDecimal flashPrice = fp.getFlashPrice();
                if (minFlashPrice == null || flashPrice.compareTo(minFlashPrice) < 0) {
                    minFlashPrice = flashPrice;
                    flashSaleSessionId = fp.getSession().getId();
                }
                // Update variant price in-place
                if (dto.getVariants() != null) {
                    for (AdminProductVariantDto vdto : dto.getVariants()) {
                        if (vdto.getId().equals(v.getId())) {
                            vdto.setPrice(flashPrice);
                            break;
                        }
                    }
                }
                // Update selected variant if it matches
                if (dto.getSelectedVariant() != null && dto.getSelectedVariant().getId().equals(v.getId())) {
                    dto.getSelectedVariant().setPrice(flashPrice);
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

    public List<HomeBrandSectionDto> getHomeBrandSections(List<String> brandSlugs, Integer limitPerBrand) {
        List<String> normalizedSlugs = (brandSlugs == null || brandSlugs.isEmpty())
                ? List.of("apple", "samsung", "xiaomi")
                : brandSlugs.stream().filter(Objects::nonNull).map(String::trim)
                        .filter(value -> !value.isBlank()).toList();

        int size = limitPerBrand != null && limitPerBrand > 0 ? limitPerBrand : 8;

        return normalizedSlugs.stream()
                .map(slug -> buildHomeBrandSection(slug, size))
                .filter(Objects::nonNull)
                .toList();
    }

    // ══════════════════════════════════════════════════════════════
    //  CREATE
    // ══════════════════════════════════════════════════════════════

    /**
     * Creates ONE product with N variants.
     * Each variant gets its own slug (e.g., "iphone-17-pro-max-8gb-256gb-black").
     */
    public AdminProductDto createProduct(AdminProductRequestDto requestDto) {
        Brand brand = getOrCreateBrand(requestDto.getBrand());
        Category category = getOrCreateDefaultCategory();

        LocalDateTime now = LocalDateTime.now();

        ProductSeries series = null;
        if (requestDto.getSeriesId() != null) {
            series = productSeriesRepository.findById(requestDto.getSeriesId()).orElse(null);
        }

        // Normalize variants
        List<AdminProductVariantRequestDto> normalizedVariants = normalizeVariants(requestDto);
        if (normalizedVariants.isEmpty()) {
            throw new IllegalArgumentException("Phải có ít nhất 1 phiên bản.");
        }

        validateDuplicateVariants(normalizedVariants);

        // Create product (shared data for all variants)
        Product product = new Product();
        product.setName(requestDto.getName().trim());
        product.setBaseName(requestDto.getName().trim());
        product.setSlug(generateProductSlug(requestDto.getName().trim()));
        product.setBrand(brand);
        product.setCategory(category);
        product.setSeries(series);
        product.setShortDescription(getDescription(requestDto));
        product.setDetailDescription(getDescription(requestDto));
        product.setStatus(ProductStatus.ACTIVE);
        product.setSale(requestDto.getSale() != null ? requestDto.getSale() : 0);
        product.setIsFeatured(Boolean.FALSE);
        product.setWarrantyMonths(12);
        product.setCreatedAt(now);
        product.setUpdatedAt(now);
        product.setThumbnailUrl(requestDto.getThumbnailUrl());
        Product savedProduct = productRepository.save(product);

        // Save images and specs ONCE (shared)
        saveImages(savedProduct, requestDto.getImages(), now);
        saveSpecifications(savedProduct, requestDto.getSpecifications(), now);

        // Create variants
        List<ProductVariant> savedVariants = new ArrayList<>();
        for (int i = 0; i < normalizedVariants.size(); i++) {
            AdminProductVariantRequestDto variantReq = normalizedVariants.get(i);
            ProductVariant variant = createVariant(savedProduct, variantReq, now, i + 1);
            savedVariants.add(productVariantRepository.save(variant));
        }

        return toDetailDto(savedProduct, savedVariants.get(0));
    }

    // ══════════════════════════════════════════════════════════════
    //  UPDATE
    // ══════════════════════════════════════════════════════════════

    /**
     * Updates the product + all its variants.
     * - Updates existing variants
     * - Adds new variants
     * - Removes variants that are no longer in the request
     */
    public AdminProductDto updateProduct(Long productId, AdminProductRequestDto requestDto) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm: " + productId));

        LocalDateTime now = LocalDateTime.now();

        Brand brand = getOrCreateBrand(requestDto.getBrand());
        product.setName(requestDto.getName().trim());
        product.setBaseName(requestDto.getName().trim());
        product.setBrand(brand);

        if (requestDto.getSeriesId() != null) {
            product.setSeries(productSeriesRepository.findById(requestDto.getSeriesId()).orElse(null));
        } else {
            product.setSeries(null);
        }

        product.setShortDescription(getDescription(requestDto));
        product.setDetailDescription(getDescription(requestDto));
        product.setSale(requestDto.getSale() != null ? requestDto.getSale() : 0);
        product.setThumbnailUrl(requestDto.getThumbnailUrl());
        product.setUpdatedAt(now);
        productRepository.save(product);

        // Normalize request variants
        List<AdminProductVariantRequestDto> normalizedVariants = normalizeVariants(requestDto);
        validateDuplicateVariants(normalizedVariants);

        // Get existing variants
        List<ProductVariant> existingVariants = productVariantRepository.findByProductIdAndDeletedAtIsNull(productId);
        Map<Long, ProductVariant> existingById = existingVariants.stream()
                .collect(Collectors.toMap(ProductVariant::getId, v -> v));

        // Track which existing variants to keep
        Set<Long> idsToKeep = existingVariants.stream()
                .filter(v -> v.getId() != null)
                .map(ProductVariant::getId)
                .collect(Collectors.toSet());

        List<ProductVariant> savedVariants = new ArrayList<>();

        for (int i = 0; i < normalizedVariants.size(); i++) {
            AdminProductVariantRequestDto variantReq = normalizedVariants.get(i);

            if (variantReq.getId() != null && existingById.containsKey(variantReq.getId())) {
                // Update existing variant
                ProductVariant existing = existingById.get(variantReq.getId());
                idsToKeep.remove(variantReq.getId());
                updateVariant(existing, variantReq, product, now);
                savedVariants.add(productVariantRepository.save(existing));
            } else {
                // Create new variant
                ProductVariant newVariant = createVariant(product, variantReq, now, i + 1);
                savedVariants.add(productVariantRepository.save(newVariant));
            }
        }

        // Delete removed variants (soft delete via deletedAt)
        for (Long removedId : idsToKeep) {
            ProductVariant toDelete = existingById.get(removedId);
            if (toDelete != null) {
                toDelete.setDeletedAt(now);
                inventoryRepository.findByVariantId(removedId).ifPresent(inv -> {
                    inv.setDeletedAt(now);
                    inventoryRepository.save(inv);
                });
                productVariantRepository.save(toDelete);
            }
        }

        // Update images and specs
        productImageRepository.deleteByProductId(productId);
        saveImages(product, requestDto.getImages(), now);

        productSpecificationRepository.deleteByProductId(productId);
        saveSpecifications(product, requestDto.getSpecifications(), now);

        ProductVariant selectedVariant = savedVariants.isEmpty() ? null : savedVariants.get(0);
        return toDetailDto(product, selectedVariant);
    }

    // ══════════════════════════════════════════════════════════════
    //  DELETE
    // ══════════════════════════════════════════════════════════════

    public void deleteProduct(Long productId) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm: " + productId));

        LocalDateTime now = LocalDateTime.now();

        // Soft delete all variants
        List<ProductVariant> variants = productVariantRepository.findByProductIdAndDeletedAtIsNull(productId);
        for (ProductVariant variant : variants) {
            variant.setDeletedAt(now);
            inventoryRepository.findByVariantId(variant.getId()).ifPresent(inv -> {
                inv.setDeletedAt(now);
                inventoryRepository.save(inv);
            });
            productVariantRepository.save(variant);
        }

        // Soft delete product
        product.setDeletedAt(now);
        productRepository.save(product);
    }

    // ══════════════════════════════════════════════════════════════
    //  DTO BUILDERS
    // ══════════════════════════════════════════════════════════════

    /**
     * DTO for admin product listing (one row per product, not expanded).
     */
    private AdminProductDto toSingleDto(Product product) {
        List<ProductVariant> variants = productVariantRepository.findByProductIdAndDeletedAtIsNull(product.getId());

        int totalStock = 0;
        BigDecimal minPrice = BigDecimal.ZERO;
        List<AdminProductVariantDto> variantItemDtos = new ArrayList<>();
        for (ProductVariant variant : variants) {
            int variantStock = inventoryRepository.findByVariantId(variant.getId())
                    .map(Inventory::getQuantityOnHand).orElse(0);
            totalStock += variantStock;
            variantItemDtos.add(toVariantDto(variant));
            BigDecimal vp = variant.getPrice() != null ? variant.getPrice() : BigDecimal.ZERO;
            if (minPrice.compareTo(BigDecimal.ZERO) == 0 || vp.compareTo(minPrice) < 0) {
                minPrice = vp;
            }
        }

        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAscIdAsc(product.getId());

        AdminProductDto dto = new AdminProductDto();
        dto.setId(product.getId());
        dto.setVariantId(!variants.isEmpty() ? variants.get(0).getId() : null);
        dto.setSlug(!variants.isEmpty() && variants.get(0).getSlug() != null ? variants.get(0).getSlug() : product.getName());
        dto.setName(product.getName());
        dto.setVariantName(!variants.isEmpty() ? buildVariantDisplayName(variants.get(0)) : null);
        dto.setBrand(product.getBrand() != null ? product.getBrand().getName() : "");
        dto.setBrandSlug(product.getBrand() != null ? product.getBrand().getSlug() : "");
        if (product.getSeries() != null) {
            dto.setSeriesId(product.getSeries().getId());
            dto.setSeriesName(product.getSeries().getName());
            dto.setSeriesSlug(product.getSeries().getSlug());
        }
        dto.setPrice(minPrice);
        dto.setStock(totalStock);
        dto.setSale(0);
        dto.setThumbnailUrl(product.getThumbnailUrl());
        dto.setImages(images.stream().map(ProductImage::getImageUrl).toList());
        dto.setIsFeatured(product.getIsFeatured());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setReleaseDate(product.getCreatedAt());
        dto.setSelectedVariant(!variants.isEmpty() ? toVariantDto(variants.get(0)) : null);
        dto.setVariantItems(variantItemDtos);
        return dto;
    }

    /**
     * DTO for product listing pages (home, search, brand page).
     * Expands each product into N cards — one per variant — so each storage/RAM/color
     * option appears as a separate listing card.
     */
    private List<AdminProductDto> toListDto(Product product) {
        List<ProductVariant> variants = productVariantRepository.findByProductIdAndDeletedAtIsNull(product.getId());
        if (variants.isEmpty()) {
            return List.of();
        }

        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAscIdAsc(product.getId());
        String productName = product.getName();
        String brandName = product.getBrand() != null ? product.getBrand().getName() : "";
        String brandSlug = product.getBrand() != null ? product.getBrand().getSlug() : "";
        Long seriesId = product.getSeries() != null ? product.getSeries().getId() : null;
        String seriesName = product.getSeries() != null ? product.getSeries().getName() : null;
        String seriesSlug = product.getSeries() != null ? product.getSeries().getSlug() : null;
        Boolean isFeatured = product.getIsFeatured();
        LocalDateTime createdAt = product.getCreatedAt();
        List<String> imageUrls = images.stream().map(ProductImage::getImageUrl).toList();
        String thumbnailUrl = product.getThumbnailUrl();

        // Load active product discounts
        List<ProductDiscount> activeDiscounts = discountRepository.findAllActiveNow(LocalDateTime.now());

        return variants.stream().map(variant -> {
            AdminProductDto dto = new AdminProductDto();
            dto.setId(product.getId());
            dto.setVariantId(variant.getId());
            dto.setSlug(variant.getSlug() != null ? variant.getSlug() : productName);
            dto.setName(productName);
            dto.setVariantName(buildVariantDisplayName(variant));
            dto.setBrand(brandName);
            dto.setBrandSlug(brandSlug);
            dto.setSeriesId(seriesId);
            dto.setSeriesName(seriesName);
            dto.setSeriesSlug(seriesSlug);

            int variantStock = inventoryRepository.findByVariantId(variant.getId())
                    .map(Inventory::getQuantityOnHand).orElse(0);
            dto.setStock(variantStock);

            BigDecimal basePrice = variant.getPrice() != null ? variant.getPrice() : BigDecimal.ZERO;
            ProductDiscount discount = getActiveDiscount(variant.getId(), activeDiscounts);
            BigDecimal displayPrice = applyDiscount(basePrice, discount);
            dto.setPrice(displayPrice);
            dto.setOriginalPrice(basePrice);
            dto.setSale(getDiscountPercent(discount));

            dto.setThumbnailUrl(thumbnailUrl);
            dto.setImages(imageUrls);
            dto.setIsFeatured(isFeatured);
            dto.setCreatedAt(createdAt);
            dto.setReleaseDate(createdAt);
            dto.setSelectedVariant(toVariantDto(variant));
            return dto;
        }).toList();
    }

    /**
     * DTO for product detail page.
     * Returns: product (shared data) + selectedVariant + allVariants[]
     */
    private AdminProductDto toDetailDto(Product product, ProductVariant selectedVariant) {
        List<ProductVariant> allVariants = productVariantRepository.findByProductIdAndDeletedAtIsNull(product.getId());

        int totalStock = 0;
        BigDecimal minPrice = BigDecimal.ZERO;
        Map<String, BigDecimal> storagePrices = new LinkedHashMap<>();
        Map<String, ProductVariantColorDto> colorMap = new LinkedHashMap<>();
        List<AdminProductVariantDto> variantDtos = new ArrayList<>();

        // Load active product discounts
        List<ProductDiscount> activeDiscounts = discountRepository.findAllActiveNow(LocalDateTime.now());

        for (ProductVariant variant : allVariants) {
            int variantStock = inventoryRepository.findByVariantId(variant.getId())
                    .map(Inventory::getQuantityOnHand).orElse(0);
            totalStock += variantStock;
            BigDecimal vp = variant.getPrice() != null ? variant.getPrice() : BigDecimal.ZERO;
            BigDecimal discountedVp = applyDiscount(vp, getActiveDiscount(variant.getId(), activeDiscounts));
            if (minPrice.compareTo(BigDecimal.ZERO) == 0 || discountedVp.compareTo(minPrice) < 0) {
                minPrice = discountedVp;
            }

            String storageLabel = getStorageLabel(variant);
            if (!storageLabel.isBlank() && !storagePrices.containsKey(storageLabel)) {
                storagePrices.put(storageLabel, discountedVp);
            }

            String color = normalizeColor(variant.getColor());
            if (!color.isBlank()) {
                // Use the first variant with this color that has a colorImageUrl
                if (!colorMap.containsKey(color)) {
                    colorMap.put(color, new ProductVariantColorDto(color, mapColorHex(color), variant.getColorImageUrl()));
                } else {
                    // If current color already exists but without image, try to fill it in
                    ProductVariantColorDto existing = colorMap.get(color);
                    if ((existing.getImageUrl() == null || existing.getImageUrl().isBlank())
                            && variant.getColorImageUrl() != null && !variant.getColorImageUrl().isBlank()) {
                        colorMap.put(color, new ProductVariantColorDto(color, mapColorHex(color), variant.getColorImageUrl()));
                    }
                }
            }

            variantDtos.add(toVariantDto(variant));
            // Set saleAmount for this variant
            AdminProductVariantDto vdto = variantDtos.get(variantDtos.size() - 1);
            ProductDiscount vd = getActiveDiscount(variant.getId(), activeDiscounts);
            vdto.setSaleAmount(getDiscountSavedAmount(vp, vd));
        }

        // Sort storages numerically
        List<String> sortedStorages = storagePrices.entrySet().stream()
                .sorted(Comparator.comparingInt(e -> parseStorageNumeric(e.getKey())))
                .map(Map.Entry::getKey)
                .toList();

        ProductVariantOptionDto variantOptions = new ProductVariantOptionDto();
        variantOptions.setStorages(sortedStorages);
        variantOptions.setColors(new ArrayList<>(colorMap.values()));
        variantOptions.setBasePrices(storagePrices);

        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAscIdAsc(product.getId());
        Map<String, String> specs = new HashMap<>();
        for (ProductSpecification specification : productSpecificationRepository
                .findByProductIdOrderBySortOrderAscIdAsc(product.getId())) {
            specs.put(specification.getSpecKey(), specification.getSpecValue());
        }

        AdminProductVariantDto selectedDto = selectedVariant != null
                ? toVariantDto(selectedVariant)
                : (variantDtos.isEmpty() ? null : variantDtos.get(0));

        // Override selectedDto price with discounted price if applicable
        if (selectedDto != null && selectedVariant != null) {
            ProductDiscount selectedDiscount = getActiveDiscount(selectedVariant.getId(), activeDiscounts);
            BigDecimal discountedPrice = applyDiscount(selectedVariant.getPrice(), selectedDiscount);
            selectedDto.setPrice(discountedPrice);
            selectedDto.setCompareAtPrice(selectedVariant.getPrice());
            selectedDto.setSaleAmount(getDiscountSavedAmount(selectedVariant.getPrice(), selectedDiscount));
        }

        AdminProductDto dto = new AdminProductDto();
        dto.setId(product.getId());
        dto.setVariantId(selectedVariant != null ? selectedVariant.getId() : null);
        dto.setName(product.getName());
        dto.setVariantName(selectedVariant != null ? buildVariantDisplayName(selectedVariant) : null);
        dto.setBrand(product.getBrand().getName());
        dto.setBrandSlug(product.getBrand().getSlug());
        if (product.getSeries() != null) {
            dto.setSeriesId(product.getSeries().getId());
            dto.setSeriesName(product.getSeries().getName());
            dto.setSeriesSlug(product.getSeries().getSlug());
        }
        dto.setPrice(minPrice);
        dto.setOriginalPrice(selectedVariant != null ? selectedVariant.getPrice() : null);
        dto.setStock(totalStock);
        dto.setSale(product.getSale() != null ? product.getSale() : 0);
        dto.setDescription(product.getDetailDescription());
        dto.setThumbnailUrl(product.getThumbnailUrl());
        dto.setImages(images.stream().map(ProductImage::getImageUrl).toList());
        dto.setSpecifications(specs);
        dto.setVariantOptions(variantOptions);
        dto.setVariants(variantDtos);
        dto.setSelectedVariant(selectedDto);
        dto.setIsFeatured(product.getIsFeatured());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setReleaseDate(product.getCreatedAt());
        return dto;
    }

    private AdminProductVariantDto toVariantDto(ProductVariant variant) {
        int stock = inventoryRepository.findByVariantId(variant.getId())
                .map(Inventory::getQuantityOnHand).orElse(0);
        AdminProductVariantDto dto = new AdminProductVariantDto();
        dto.setId(variant.getId());
        dto.setSku(variant.getSku());
        dto.setSlug(variant.getSlug());
        dto.setColor(variant.getColor());
        dto.setStorageLabel(getStorageLabel(variant));
        dto.setRamGb(variant.getRamGb());
        dto.setStorageGb(variant.getStorageGb());
        dto.setPrice(variant.getPrice());
        dto.setStock(stock);
        dto.setColorImageUrl(variant.getColorImageUrl());
        return dto;
    }

    private AdminProductDto toDtoFromFlashSaleProduct(FlashSaleProduct fp) {
        Product product = fp.getVariant().getProduct();
        ProductVariant variant = fp.getVariant();

        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAscIdAsc(product.getId());

        AdminProductDto dto = new AdminProductDto();
        dto.setId(product.getId());
        dto.setVariantId(variant.getId());
        dto.setSlug(variant.getSlug() != null ? variant.getSlug() : product.getName());
        dto.setName(product.getName());
        dto.setVariantName(buildVariantDisplayName(variant));
        dto.setBrand(product.getBrand() != null ? product.getBrand().getName() : "");
        dto.setBrandSlug(product.getBrand() != null ? product.getBrand().getSlug() : "");
        if (product.getSeries() != null) {
            dto.setSeriesId(product.getSeries().getId());
            dto.setSeriesName(product.getSeries().getName());
            dto.setSeriesSlug(product.getSeries().getSlug());
        }

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
        dto.setStock(fp.getQuantity() != null ? fp.getQuantity() : 0);
        dto.setThumbnailUrl(product.getThumbnailUrl());
        dto.setImages(images.stream().map(ProductImage::getImageUrl).toList());
        dto.setIsFeatured(product.getIsFeatured());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setReleaseDate(product.getCreatedAt());
        dto.setSelectedVariant(toVariantDto(variant));
        dto.setIsFlashSale(true);
        dto.setFlashSalePrice(flashPrice);
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
                .stream().findFirst().orElse(null);

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

    // ══════════════════════════════════════════════════════════════
    //  VARIANT HELPERS
    // ══════════════════════════════════════════════════════════════

    private ProductVariant createVariant(Product product, AdminProductVariantRequestDto variantReq,
            LocalDateTime now, int index) {
        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setSku(generateVariantSku(product.getId(), variantReq, index));
        variant.setSlug(generateVariantSlug(product, variantReq));
        variant.setColor(normalizeColor(variantReq.getColor()));
        variant.setRamGb(variantReq.getRamGb());
        variant.setStorageGb(variantReq.getStorageGb());
        variant.setStorageLabel(normalizeStorageLabel(variantReq));
        variant.setPrice(resolveVariantPrice(variantReq, null));
        variant.setIsActive(Boolean.TRUE);
        variant.setCreatedAt(now);
        variant.setUpdatedAt(now);
        variant.setColorImageUrl(variantReq.getColorImageUrl());
        ProductVariant savedVariant = productVariantRepository.save(variant);

        // Create inventory
        Inventory inventory = new Inventory();
        inventory.setVariant(savedVariant);
        inventory.setQuantityOnHand(Math.max(0, resolveVariantStock(variantReq, 0)));
        inventory.setQuantityReserved(0);
        inventory.setReorderLevel(5);
        inventory.setStockStatus(resolveStockStatus(resolveVariantStock(variantReq, 0)));
        inventory.setUpdatedAt(now);
        inventoryRepository.save(inventory);

        return savedVariant;
    }

    private void updateVariant(ProductVariant variant, AdminProductVariantRequestDto variantReq,
            Product product, LocalDateTime now) {
        variant.setSku(generateVariantSku(product.getId(), variantReq, variant.getId().intValue()));
        variant.setSlug(generateVariantSlug(product, variantReq));
        variant.setColor(normalizeColor(variantReq.getColor()));
        variant.setRamGb(variantReq.getRamGb());
        variant.setStorageGb(variantReq.getStorageGb());
        variant.setStorageLabel(normalizeStorageLabel(variantReq));
        variant.setPrice(resolveVariantPrice(variantReq, null));
        variant.setUpdatedAt(now);
        variant.setColorImageUrl(variantReq.getColorImageUrl());

        // Update inventory stock
        int quantityOnHand = Math.max(0, resolveVariantStock(variantReq, 0));
        Inventory inventory = inventoryRepository.findByVariantId(variant.getId()).orElse(null);
        if (inventory == null) {
            inventory = new Inventory();
            inventory.setVariant(variant);
            inventory.setQuantityReserved(0);
            inventory.setReorderLevel(5);
        }
        inventory.setQuantityOnHand(quantityOnHand);
        inventory.setStockStatus(resolveStockStatus(quantityOnHand));
        inventory.setUpdatedAt(now);
        inventoryRepository.save(inventory);
    }

    private String generateVariantSlug(Product product, AdminProductVariantRequestDto variantReq) {
        StringBuilder sb = new StringBuilder(product.getSlug());

        if (variantReq.getRamGb() != null && variantReq.getRamGb() > 0) {
            sb.append("-").append(variantReq.getRamGb()).append("gb");
        }
        if (variantReq.getStorageGb() != null && variantReq.getStorageGb() > 0) {
            sb.append("-").append(formatStorageGb(variantReq.getStorageGb()).toLowerCase());
        }
        if (variantReq.getColor() != null && !variantReq.getColor().isBlank()) {
            sb.append("-").append(normalizeColorForSlug(variantReq.getColor()));
        }

        String baseSlug = sb.toString();
        // Ensure uniqueness
        String finalSlug = baseSlug;
        int counter = 1;
        while (productVariantRepository.findBySlug(finalSlug).isPresent()) {
            finalSlug = baseSlug + "-" + counter;
            counter++;
        }
        return finalSlug;
    }

    private String generateVariantSku(Long productId, AdminProductVariantRequestDto variantReq, int index) {
        String colorPart = normalizeColor(variantReq.getColor())
                .replaceAll("[^a-zA-Z0-9]", "").toUpperCase(Locale.ROOT);
        if (colorPart.isBlank()) colorPart = "DEFAULT";

        String ramPart = variantReq.getRamGb() != null ? variantReq.getRamGb() + "GB" : "RAM";
        String storagePart = variantReq.getStorageGb() != null
                ? formatStorageGb(variantReq.getStorageGb()) : "STD";

        String sku = "SKU-" + productId + "-" + index + "-" + colorPart + "-" + ramPart + "-" + storagePart;
        return sku.length() > 120 ? sku.substring(0, 120) : sku;
    }

    // ══════════════════════════════════════════════════════════════
    //  VALIDATION
    // ══════════════════════════════════════════════════════════════

    private List<AdminProductVariantRequestDto> normalizeVariants(AdminProductRequestDto requestDto) {
        List<AdminProductVariantRequestDto> provided = requestDto.getVariants();
        if (provided == null || provided.isEmpty()) {
            AdminProductVariantRequestDto fallback = new AdminProductVariantRequestDto();
            fallback.setColor("Default");
            fallback.setPrice(BigDecimal.ZERO);
            fallback.setStock(0);
            return List.of(fallback);
        }

        List<AdminProductVariantRequestDto> normalized = new ArrayList<>();
        for (AdminProductVariantRequestDto variant : provided) {
            if (variant == null) continue;
            boolean hasValue = (variant.getColor() != null && !variant.getColor().isBlank())
                    || variant.getStorageGb() != null
                    || variant.getRamGb() != null
                    || variant.getPrice() != null
                    || variant.getStock() != null;
            if (hasValue) {
                normalized.add(variant);
            }
        }
        return normalized;
    }

    private void validateDuplicateVariants(List<AdminProductVariantRequestDto> variants) {
        for (int i = 0; i < variants.size(); i++) {
            AdminProductVariantRequestDto variant = variants.get(i);
            // Storage is required for every variant
            if (variant.getStorageGb() == null || variant.getStorageGb() <= 0) {
                throw new IllegalArgumentException(
                        "Phiên bản #" + (i + 1) + " thiếu Dung lượng (storage). Vui lòng chọn Dung lượng cho tất cả các phiên bản.");
            }
            String colorKey = normalizeColor(variant.getColor()).toLowerCase(Locale.ROOT);
            String ramKey = Objects.toString(variant.getRamGb(), "default").toLowerCase(Locale.ROOT);
            String storageKey = formatStorageGb(variant.getStorageGb()).toLowerCase(Locale.ROOT);
            String compound = colorKey + "|" + ramKey + "|" + storageKey;
            if (i > 0) {
                // Check duplicates only against previous variants
                Set<String> keys = new java.util.HashSet<>();
                for (int j = 0; j < i; j++) {
                    AdminProductVariantRequestDto prev = variants.get(j);
                    String prevColor = normalizeColor(prev.getColor()).toLowerCase(Locale.ROOT);
                    String prevRam = Objects.toString(prev.getRamGb(), "default").toLowerCase(Locale.ROOT);
                    String prevStorage = formatStorageGb(prev.getStorageGb()).toLowerCase(Locale.ROOT);
                    keys.add(prevColor + "|" + prevRam + "|" + prevStorage);
                }
                if (keys.contains(compound)) {
                    throw new ResourceAlreadyExistsException(
                            "Biến thể trùng màu, RAM và dung lượng: "
                                    + normalizeColor(variant.getColor()) + " - " + ramKey + " - " + storageKey);
                }
            }
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  HELPERS
    // ══════════════════════════════════════════════════════════════

    private boolean matchesBrand(Product product, String brandSlug) {
        if (brandSlug == null || brandSlug.isBlank()) return true;
        return product.getBrand() != null
                && product.getBrand().getSlug() != null
                && product.getBrand().getSlug().toLowerCase(Locale.ROOT)
                        .equals(brandSlug.trim().toLowerCase(Locale.ROOT));
    }

    private boolean matchesPrice(AdminProductDto dto, String priceKey) {
        if (priceKey == null || priceKey.isBlank()) return true;
        BigDecimal price = dto.getPrice() == null ? BigDecimal.ZERO : dto.getPrice();
        return switch (priceKey.trim().toLowerCase(Locale.ROOT)) {
            case "under-5m" -> price.compareTo(BigDecimal.valueOf(5_000_000)) < 0;
            case "5-10m" -> price.compareTo(BigDecimal.valueOf(5_000_000)) >= 0
                    && price.compareTo(BigDecimal.valueOf(10_000_000)) <= 0;
            case "10-20m" -> price.compareTo(BigDecimal.valueOf(10_000_000)) >= 0
                    && price.compareTo(BigDecimal.valueOf(20_000_000)) <= 0;
            case "above-20m" -> price.compareTo(BigDecimal.valueOf(20_000_000)) > 0;
            default -> true;
        };
    }

    private boolean matchesStorage(AdminProductDto dto, String storage) {
        if (storage == null || storage.isBlank()) return true;
        if (dto.getVariants() == null || dto.getVariants().isEmpty()) return false;
        String normalized = storage.trim().toUpperCase(Locale.ROOT);
        return dto.getVariants().stream()
                .anyMatch(v -> {
                    String label = v.getStorageLabel();
                    return label != null && label.trim().toUpperCase(Locale.ROOT).equals(normalized);
                });
    }

    private Comparator<AdminProductDto> resolveComparator(String sort) {
        String normalized = sort == null ? "" : sort.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "price-asc" -> Comparator.comparing(
                    dto -> Objects.requireNonNullElse(dto.getPrice(), BigDecimal.ZERO));
            case "price-desc" -> Comparator.comparing(
                    (AdminProductDto dto) -> Objects.requireNonNullElse(dto.getPrice(), BigDecimal.ZERO)).reversed();
            case "release-desc", "newest", "featured" -> Comparator.comparing(
                    (AdminProductDto dto) -> Objects.requireNonNullElse(dto.getReleaseDate(), LocalDateTime.MIN)).reversed();
            default -> Comparator.comparing(
                    (AdminProductDto dto) -> Objects.requireNonNullElse(dto.getCreatedAt(), LocalDateTime.MIN)).reversed();
        };
    }

    private String generateProductSlug(String value) {
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
        if (baseSlug.isBlank()) baseSlug = "san-pham";

        // For product slug, we use the product name as identifier
        // URL: /products/{variantSlug} where variantSlug contains product slug as prefix
        return baseSlug;
    }

    private String getStorageLabel(ProductVariant variant) {
        if (variant.getStorageLabel() != null && !variant.getStorageLabel().isBlank()) {
            return variant.getStorageLabel();
        }
        if (variant.getStorageGb() != null && variant.getStorageGb() > 0) {
            return formatStorageGb(variant.getStorageGb());
        }
        return "";
    }

    private String formatStorageGb(Integer storageGb) {
        if (storageGb == null || storageGb <= 0) return "";
        if (storageGb % 1024 == 0) return (storageGb / 1024) + "TB";
        return storageGb + "GB";
    }

    private String normalizeStorageLabel(AdminProductVariantRequestDto variant) {
        if (variant.getStorageLabel() != null && !variant.getStorageLabel().isBlank()) {
            return variant.getStorageLabel().trim();
        }
        return formatStorageGb(variant.getStorageGb());
    }

    private String normalizeColor(String color) {
        if (color == null || color.isBlank()) return "Default";
        return color.trim();
    }

    private String normalizeColorForSlug(String color) {
        if (color == null || color.isBlank()) return "";
        return color.trim().toLowerCase(Locale.ROOT)
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("đ", "d")
                .replaceAll("[^a-z0-9]", "")
                .replaceAll("\\s+", "");
    }

    private BigDecimal resolveVariantPrice(AdminProductVariantRequestDto variant, BigDecimal defaultPrice) {
        if (variant.getPrice() != null) return variant.getPrice();
        return defaultPrice != null ? defaultPrice : BigDecimal.ZERO;
    }

    private int resolveVariantStock(AdminProductVariantRequestDto variant, int defaultStock) {
        if (variant.getStock() != null) return variant.getStock();
        return defaultStock;
    }

    private String mapColorHex(String colorName) {
        String normalized = colorName == null ? "" : colorName.toLowerCase(Locale.ROOT);
        if (normalized.contains("black") || normalized.contains("đen")) return "#1f2937";
        if (normalized.contains("white") || normalized.contains("trắng")) return "#f3f4f6";
        if (normalized.contains("blue") || normalized.contains("xanh")) return "#2563eb";
        if (normalized.contains("green") || normalized.contains("lục")) return "#16a34a";
        if (normalized.contains("red") || normalized.contains("đỏ")) return "#dc2626";
        if (normalized.contains("gold") || normalized.contains("vàng")) return "#ca8a04";
        return "#6b7280";
    }

    private String getStatus(ProductDiscount discount) {
        LocalDateTime now = LocalDateTime.now();
        if (discount.getEndAt().isBefore(now)) return "ENDED";
        if (discount.getStartAt().isAfter(now)) return "UPCOMING";
        return "ACTIVE";
    }

    private BigDecimal applyDiscount(BigDecimal originalPrice, ProductDiscount discount) {
        if (discount == null) return originalPrice;
        LocalDateTime now = LocalDateTime.now();
        if (!Boolean.TRUE.equals(discount.getIsActive())
                || discount.getEndAt().isBefore(now)
                || discount.getStartAt().isAfter(now)) {
            return originalPrice;
        }
        // discountAmount = SỐ TIỀN GIẢM TRỰC TIẾP (admin nhập bao nhiêu thì giảm bấy nhiêu)
        if (discount.getDiscountAmount() != null && discount.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal saved = discount.getDiscountAmount().min(originalPrice);
            BigDecimal result = originalPrice.subtract(saved);
            return result.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : result;
        }
        if (discount.getDiscountPercent() != null && discount.getDiscountPercent() > 0) {
            BigDecimal saved = originalPrice.multiply(
                    BigDecimal.valueOf(discount.getDiscountPercent())
            ).divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN);
            BigDecimal result = originalPrice.subtract(saved);
            return result.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : result;
        }
        return originalPrice;
    }

    private int getDiscountPercent(ProductDiscount discount) {
        if (discount == null) return 0;
        LocalDateTime now = LocalDateTime.now();
        if (!Boolean.TRUE.equals(discount.getIsActive())
                || discount.getEndAt().isBefore(now)
                || discount.getStartAt().isAfter(now)) {
            return 0;
        }
        return discount.getDiscountPercent() != null ? discount.getDiscountPercent() : 0;
    }

    private BigDecimal getDiscountSavedAmount(BigDecimal originalPrice, ProductDiscount discount) {
        if (discount == null || originalPrice == null) return null;
        LocalDateTime now = LocalDateTime.now();
        if (!Boolean.TRUE.equals(discount.getIsActive())
                || discount.getEndAt().isBefore(now)
                || discount.getStartAt().isAfter(now)) {
            return null;
        }
        if (discount.getDiscountAmount() != null && discount.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            return discount.getDiscountAmount().min(originalPrice);
        }
        if (discount.getDiscountPercent() != null && discount.getDiscountPercent() > 0) {
            return originalPrice.multiply(BigDecimal.valueOf(discount.getDiscountPercent()))
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN);
        }
        return null;
    }

    private ProductDiscount getActiveDiscount(Long variantId, LocalDateTime now, List<ProductDiscount> activeDiscounts) {
        return activeDiscounts.stream()
                .filter(d -> d.getVariant().getId().equals(variantId))
                .findFirst()
                .orElse(null);
    }

    private ProductDiscount getActiveDiscount(Long variantId, List<ProductDiscount> activeDiscounts) {
        return getActiveDiscount(variantId, LocalDateTime.now(), activeDiscounts);
    }

    private int parseStorageNumeric(String label) {
        if (label == null) return 0;
        String digits = label.replaceAll("[^0-9]", "");
        try { return Integer.parseInt(digits); } catch (NumberFormatException e) { return 0; }
    }

    private StockStatus resolveStockStatus(Integer stock) {
        int qty = stock == null ? 0 : stock;
        if (qty <= 0) return StockStatus.OUT_OF_STOCK;
        if (qty <= 5) return StockStatus.LOW_STOCK;
        return StockStatus.IN_STOCK;
    }
    private String buildVariantDisplayName(ProductVariant variant) {
        if (variant == null) return "";
        StringBuilder sb = new StringBuilder();
        // RAM: e.g. "8" (no "GB" suffix for brevity)
        if (variant.getRamGb() != null && variant.getRamGb() > 0) {
            sb.append(variant.getRamGb());
        }
        // Storage: e.g. "128GB" or "1TB"
        if (variant.getStorageGb() != null && variant.getStorageGb() > 0) {
            String storage = formatStorageGb(variant.getStorageGb());
            if (sb.length() > 0) sb.append("/");
            sb.append(storage);
        }
        return sb.toString();
    }

    private void saveImages(Product product, List<String> imageUrls, LocalDateTime now) {
        if (imageUrls == null || imageUrls.isEmpty()) return;
        List<ProductImage> images = new ArrayList<>();
        for (int i = 0; i < imageUrls.size(); i++) {
            String url = imageUrls.get(i);
            if (url == null || url.isBlank()) continue;
            ProductImage image = new ProductImage();
            image.setProduct(product);
            image.setImageUrl(url.trim());
            image.setSortOrder(i);
            image.setIsPrimary(i == 0);
            image.setCreatedAt(now);
            images.add(image);
        }
        if (!images.isEmpty()) productImageRepository.saveAll(images);
    }

    private void saveSpecifications(Product product, Map<String, String> specs, LocalDateTime now) {
        if (specs == null || specs.isEmpty()) return;
        List<ProductSpecification> specifications = new ArrayList<>();
        int i = 0;
        for (Map.Entry<String, String> entry : specs.entrySet()) {
            if (entry.getValue() == null || entry.getValue().isBlank()) continue;
            ProductSpecification spec = new ProductSpecification();
            spec.setProduct(product);
            spec.setSpecKey(entry.getKey());
            spec.setSpecValue(entry.getValue().trim());
            spec.setSortOrder(i++);
            spec.setCreatedAt(now);
            spec.setUpdatedAt(now);
            specifications.add(spec);
        }
        if (!specifications.isEmpty()) productSpecificationRepository.saveAll(specifications);
    }

    private Brand getOrCreateBrand(String brandName) {
        String normalized = brandName == null ? "Unknown" : brandName.trim();
        return brandRepository.findByNameIgnoreCase(normalized)
                .orElseGet(() -> {
                    LocalDateTime now = LocalDateTime.now();
                    Brand brand = new Brand();
                    brand.setName(normalized);
                    brand.setSlug(generateProductSlug(normalized));
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
}
