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
import com.tmdt.phone_store_backend.dto.ProductSpecificationDto;
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
import com.tmdt.phone_store_backend.repository.ReviewRepository;
import com.tmdt.phone_store_backend.repository.FlashSaleCampaignRepository;
import com.tmdt.phone_store_backend.repository.FlashSaleProductRepository;
import com.tmdt.phone_store_backend.repository.ProductDiscountRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
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

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private LocalDateTime now() {
        return LocalDateTime.now(VIETNAM_ZONE);
    }

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
    private final ReviewRepository reviewRepository;

    // ══════════════════════════════════════════════════════════════
    //  READ
    // ══════════════════════════════════════════════════════════════

    public List<AdminProductDto> getAllProducts() {
        List<Product> products = productRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();
        ProductListContext context = buildProductListContext(products);
        return products.stream()
                .map(product -> toSingleDto(product, context))
                .toList();
    }

    public List<AdminProductDto> getPublicAllProducts() {
        return getPublicProducts(null, null, null, null, null, null);
    }

    public AdminProductDto getProductById(Long id) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm: " + id));
        // Get first active variant as selected
        List<ProductVariant> variants = productVariantRepository.findByProductIdAndDeletedAtIsNull(id);
        ProductVariant selectedVariant = !variants.isEmpty() ? variants.get(0) : null;
        return toDetailDto(product, selectedVariant);
    }

    public List<AdminProductDto> getPublicProducts(String brandSlug, String price,
            String storage, String sort, Integer limit, String seriesSlug) {
        List<Product> products = productRepository.findPublicProducts(normalizeOptionalParam(brandSlug), normalizeOptionalParam(seriesSlug));
        ProductListContext context = buildProductListContext(products);

        return products.stream()
                .flatMap(p -> toListDto(p, context).stream())
                .filter(dto -> matchesPrice(dto, price))
                .filter(dto -> matchesStorage(dto, storage))
                .sorted(resolveComparator(sort))
                .limit(limit != null && limit > 0 ? limit : Long.MAX_VALUE)
                .toList();
    }

        public List<AdminProductDto> getFeaturedProducts(Integer limit) {
        int maxItems = limit != null && limit > 0 ? limit : 8;

        List<Product> products = productRepository.findPublicProducts(null, null);
        ProductListContext context = buildProductListContext(products);

        return products.stream()
            .map(product -> toSinglePublicDto(product, context))
            .filter(dto -> dto.getReviewCount() != null && dto.getReviewCount() > 0)
            .sorted(Comparator.comparing(AdminProductDto::getAverageRating, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(AdminProductDto::getReviewCount, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(AdminProductDto::getReleaseDate, Comparator.nullsLast(Comparator.reverseOrder())))
            .limit(maxItems)
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
        List<Product> products = productRepository.findByNameIgnoreCaseAndDeletedAtIsNull(baseName).stream()
                .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
                .toList();
        ProductListContext context = buildProductListContext(products);
        return products.stream()
                .flatMap(p -> toListDto(p, context).stream())
                .toList();
    }

    public List<AdminProductDto> getFlashSaleProducts(Integer limit) {
        LocalDateTime now = now();
        List<FlashSaleCampaign> activeCampaigns = flashSaleCampaignRepository.findAllActiveCampaigns(now);
        if (activeCampaigns.isEmpty()) return List.of();

        FlashSaleCampaign campaign = activeCampaigns.get(0);
        List<FlashSaleProduct> flashSaleProducts = flashSaleProductRepository
                .findRunningActiveByCampaignIdWithProductDetails(campaign.getId(), now);
        if (flashSaleProducts.isEmpty()) return List.of();

        List<Product> products = flashSaleProducts.stream()
                .map(fp -> fp.getVariant() != null ? fp.getVariant().getProduct() : null)
                .filter(Objects::nonNull)
                .filter(product -> product.getDeletedAt() == null)
                .filter(product -> product.getStatus() == ProductStatus.ACTIVE)
                .collect(Collectors.collectingAndThen(
                        Collectors.toMap(Product::getId, product -> product, (left, right) -> left, LinkedHashMap::new),
                        map -> new ArrayList<>(map.values())
                ));
        ProductListContext context = buildProductListContext(products);

        return flashSaleProducts.stream()
                .filter(fp -> fp.getVariant() != null && fp.getVariant().getProduct() != null)
                .filter(fp -> fp.getVariant().getProduct().getDeletedAt() == null)
                .filter(fp -> fp.getVariant().getProduct().getStatus() == ProductStatus.ACTIVE)
                .filter(fp -> fp.getQuantity() == null || fp.getQuantity() > 0)
                .map(fp -> toDtoFromFlashSaleProduct(fp, context))
                .limit(limit != null && limit > 0 ? limit : 12L)
                .toList();
    }

    /**
     * Product detail by variant slug.
     * Flow: find variant by slug → get product → get all variants of that product
     */
    public AdminProductDto getPublicProductDetail(String variantSlug) {
        ProductVariant variant = productVariantRepository.findBySlug(variantSlug).orElse(null);
        if (variant == null) {
            repairInvalidVariantSlugs();
            String normalizedSlug = sanitizeSlug(variantSlug);
            if (!normalizedSlug.equals(variantSlug)) {
                variant = productVariantRepository.findBySlug(normalizedSlug).orElse(null);
            }
        } else if (!isValidSlug(variant.getSlug())) {
            repairInvalidVariantSlugs(List.of(variant));
        }

        Product productFromSlug = null;
        List<ProductVariant> productSlugVariants = null;
        if (variant == null) {
            String productSlug = isValidSlug(variantSlug) ? variantSlug : sanitizeSlug(variantSlug);
            productFromSlug = productRepository.findBySlugAndDeletedAtIsNull(productSlug).orElse(null);
            if (productFromSlug != null) {
                productSlugVariants = productVariantRepository.findByProductIdAndDeletedAtIsNull(productFromSlug.getId());
                repairInvalidVariantSlugs(productSlugVariants);
                variant = productSlugVariants.stream().findFirst().orElse(null);
            }
        }

        if (variant == null) {
            throw new ResourceNotFoundException("Không tìm thấy phiên bản: " + variantSlug);
        }

        Product product = productFromSlug != null ? productFromSlug : variant.getProduct();
        if (product == null || product.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Không tìm thấy sản phẩm cho phiên bản: " + variantSlug);
        }

        List<ProductVariant> allVariants = productSlugVariants != null
                ? productSlugVariants
                : productVariantRepository.findByProductIdAndDeletedAtIsNull(product.getId());
        repairInvalidVariantSlugs(allVariants);
        ProductVariant selectedVariant = variant;
        Long selectedVariantId = variant.getId();
        if (selectedVariantId != null) {
            selectedVariant = allVariants.stream()
                    .filter(v -> selectedVariantId.equals(v.getId()))
                    .findFirst()
                    .orElse(variant);
        }
        List<ProductDiscount> activeDiscounts = discountRepository.findAllActiveNow(LocalDateTime.now());
        List<FlashSaleProduct> activeFlashSales = getActiveFlashSales(allVariants);
        AdminProductDto dto = toDetailDto(product, selectedVariant, allVariants, activeDiscounts, true);

        // Check flash sale
        BigDecimal minFlashPrice = null;
        Long flashSaleSessionId = null;
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
            FlashSaleProduct fp = getActiveFlashSale(v.getId(), activeFlashSales);
            if (fp != null) {
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

        // Product-level image is thumbnail only; gallery images belong to variants.
        saveSpecifications(savedProduct, requestDto.getSpecifications(), now);

        // Create variants
        List<ProductVariant> savedVariants = new ArrayList<>();
        for (int i = 0; i < normalizedVariants.size(); i++) {
            AdminProductVariantRequestDto variantReq = normalizedVariants.get(i);
            ProductVariant variant = createVariant(savedProduct, variantReq, now, i + 1);
            ProductVariant savedVariant = productVariantRepository.save(variant);
            saveVariantImages(savedProduct, savedVariant, variantReq.getImages(), now);
            savedVariants.add(savedVariant);
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
                ProductVariant savedVariant = productVariantRepository.save(existing);
                savedVariants.add(savedVariant);
            } else {
                // Create new variant
                ProductVariant newVariant = createVariant(product, variantReq, now, i + 1);
                ProductVariant savedVariant = productVariantRepository.save(newVariant);
                savedVariants.add(savedVariant);
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
        for (int i = 0; i < normalizedVariants.size() && i < savedVariants.size(); i++) {
            saveVariantImages(product, savedVariants.get(i), normalizedVariants.get(i).getImages(), now);
        }

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
        return toSingleDto(product, buildProductListContext(List.of(product)));
    }

    private AdminProductDto toSingleDto(Product product, ProductListContext context) {
        List<ProductVariant> variants = context.variantsByProductId().getOrDefault(product.getId(), List.of());

        int totalStock = 0;
        BigDecimal minPrice = BigDecimal.ZERO;
        List<AdminProductVariantDto> variantItemDtos = new ArrayList<>();
        for (ProductVariant variant : variants) {
            int variantStock = context.stockByVariantId().getOrDefault(variant.getId(), 0);
            totalStock += variantStock;
            variantItemDtos.add(toVariantDto(variant, variantStock));
            BigDecimal vp = variant.getPrice() != null ? variant.getPrice() : BigDecimal.ZERO;
            if (minPrice.compareTo(BigDecimal.ZERO) == 0 || vp.compareTo(minPrice) < 0) {
                minPrice = vp;
            }
        }

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
        applyReviewStats(dto, context.reviewStatsByProductId().getOrDefault(product.getId(), ReviewStats.empty()));
        dto.setThumbnailUrl(product.getThumbnailUrl());
        dto.setImages(context.imageUrlsByProductId().getOrDefault(product.getId(), List.of()));
        dto.setIsFeatured(product.getIsFeatured());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setReleaseDate(product.getCreatedAt());
        dto.setSpecifications(context.specsByProductId().getOrDefault(product.getId(), Map.of()));
        dto.setSelectedVariant(!variants.isEmpty()
                ? toVariantDto(variants.get(0), context.stockByVariantId().getOrDefault(variants.get(0).getId(), 0))
                : null);
        dto.setVariants(variantItemDtos);
        dto.setVariantItems(variantItemDtos);
        return dto;
    }

    private List<AdminProductDto> toListDto(Product product, ProductListContext context) {
        List<ProductVariant> variants = context.variantsByProductId().getOrDefault(product.getId(), List.of());
        if (variants.isEmpty()) {
            return List.of();
        }

        List<String> imageUrls = context.imageUrlsByProductId().getOrDefault(product.getId(), List.of());
        String productName = product.getName();
        String brandName = product.getBrand() != null ? product.getBrand().getName() : "";
        String brandSlug = product.getBrand() != null ? product.getBrand().getSlug() : "";
        Long seriesId = product.getSeries() != null ? product.getSeries().getId() : null;
        String seriesName = product.getSeries() != null ? product.getSeries().getName() : null;
        String seriesSlug = product.getSeries() != null ? product.getSeries().getSlug() : null;
        Boolean isFeatured = product.getIsFeatured();
        LocalDateTime createdAt = product.getCreatedAt();
        String thumbnailUrl = product.getThumbnailUrl();
        ReviewStats reviewStats = context.reviewStatsByProductId().getOrDefault(product.getId(), ReviewStats.empty());

        Map<String, List<ProductVariant>> groupedVariants = new LinkedHashMap<>();
        for (ProductVariant variant : variants) {
            groupedVariants.computeIfAbsent(buildListingVariantGroupKey(variant), k -> new ArrayList<>())
                    .add(variant);
        }

        return groupedVariants.values().stream().map(group -> {
            ProductVariant variant = group.getFirst();
            int groupStock = group.stream()
                    .mapToInt(v -> context.stockByVariantId().getOrDefault(v.getId(), 0))
                    .sum();
            BigDecimal basePrice = variant.getPrice() != null ? variant.getPrice() : BigDecimal.ZERO;
            ProductDiscount discount = getActiveDiscount(variant.getId(), context.activeDiscounts());
            BigDecimal displayPrice = applyDiscount(basePrice, discount);
            List<AdminProductVariantDto> groupVariantDtos = group.stream()
                    .map(v -> toVariantDto(v, context.stockByVariantId().getOrDefault(v.getId(), 0)))
                    .toList();

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
            dto.setStock(groupStock);
            dto.setPrice(displayPrice);
            dto.setOriginalPrice(basePrice);
            dto.setSale(getDiscountPercent(basePrice, discount));
            dto.setAverageRating(reviewStats.averageRating());
            dto.setReviewCount(reviewStats.reviewCount());
            dto.setThumbnailUrl(thumbnailUrl);
            dto.setImages(imageUrls);
            dto.setIsFeatured(isFeatured);
            dto.setCreatedAt(createdAt);
            dto.setReleaseDate(createdAt);
            dto.setSelectedVariant(toVariantDto(variant, context.stockByVariantId().getOrDefault(variant.getId(), 0)));
            dto.setVariants(groupVariantDtos);
            dto.setVariantItems(groupVariantDtos);
            return dto;
        }).toList();
    }

    private AdminProductDto toSinglePublicDto(Product product, ProductListContext context) {
        return toListDto(product, context).stream().findFirst().orElseGet(() -> {
            AdminProductDto dto = new AdminProductDto();
            dto.setId(product.getId());
            dto.setName(product.getName());
            dto.setBrand(product.getBrand() != null ? product.getBrand().getName() : "");
            dto.setBrandSlug(product.getBrand() != null ? product.getBrand().getSlug() : "");
            dto.setThumbnailUrl(product.getThumbnailUrl());
            dto.setImages(context.imageUrlsByProductId().getOrDefault(product.getId(), List.of()));
            dto.setIsFeatured(product.getIsFeatured());
            dto.setCreatedAt(product.getCreatedAt());
            dto.setReleaseDate(product.getCreatedAt());
            ReviewStats reviewStats = context.reviewStatsByProductId().getOrDefault(product.getId(), ReviewStats.empty());
            dto.setAverageRating(reviewStats.averageRating());
            dto.setReviewCount(reviewStats.reviewCount());
            return dto;
        });
    }

    /**
     * DTO for product detail page.
     * Returns: product (shared data) + selectedVariant + allVariants[]
     */
    private AdminProductDto toDetailDto(Product product, ProductVariant selectedVariant) {
        return toDetailDto(product, selectedVariant,
                productVariantRepository.findByProductIdAndDeletedAtIsNull(product.getId()),
                discountRepository.findAllActiveNow(LocalDateTime.now()),
                false);
    }

    private AdminProductDto toDetailDto(Product product, ProductVariant selectedVariant,
            List<ProductVariant> allVariants, List<ProductDiscount> activeDiscounts,
            boolean selectedVariantImagesOnly) {
        int totalStock = 0;
        BigDecimal minPrice = BigDecimal.ZERO;
        Map<String, BigDecimal> storagePrices = new LinkedHashMap<>();
        Map<String, ProductVariantColorDto> colorMap = new LinkedHashMap<>();
        List<AdminProductVariantDto> variantDtos = new ArrayList<>();
        Map<Long, Integer> stockByVariantId = getStockByVariantId(allVariants);

        for (ProductVariant variant : allVariants) {
            int variantStock = stockByVariantId.getOrDefault(variant.getId(), 0);
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

            variantDtos.add(toVariantDto(variant, variantStock));
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
        variantOptions.setBasePrices(storagePrices);

        List<ProductImage> allImages = productImageRepository.findByProductIdOrderBySortOrderAscIdAsc(product.getId());
        Map<Long, List<String>> imagesByVariantId = allImages.stream()
                .filter(image -> image.getVariant() != null && image.getVariant().getId() != null)
                .collect(Collectors.groupingBy(
                        image -> image.getVariant().getId(),
                        LinkedHashMap::new,
                        Collectors.mapping(ProductImage::getImageUrl, Collectors.toList())
                ));
        for (AdminProductVariantDto variantDto : variantDtos) {
            variantDto.setImages(getVariantImages(variantDto.getId(), imagesByVariantId));
        }
        for (ProductVariant variant : allVariants) {
            String color = normalizeColor(variant.getColor());
            if (color.isBlank()) continue;

            ProductVariantColorDto existing = colorMap.get(color);
            if (existing != null && existing.getImageUrl() != null && !existing.getImageUrl().isBlank()) {
                continue;
            }

            String fallbackImage = getFirstVariantImage(variant.getId(), imagesByVariantId);
            if (fallbackImage != null && !fallbackImage.isBlank()) {
                colorMap.put(color, new ProductVariantColorDto(color, mapColorHex(color), fallbackImage));
            }
        }
        variantOptions.setColors(new ArrayList<>(colorMap.values()));

        List<ProductImage> images = selectedVariantImagesOnly && selectedVariant != null
                ? allImages.stream()
                        .filter(image -> image.getVariant() != null
                                && selectedVariant.getId().equals(image.getVariant().getId()))
                        .toList()
                : allImages;
        Map<String, String> specs = new HashMap<>();
        Map<String, Map<String, String>> groupedSpecs = new LinkedHashMap<>();
        List<ProductSpecificationDto> specificationRows = new ArrayList<>();
        for (ProductSpecification specification : productSpecificationRepository
                .findByProductIdOrderBySortOrderAscIdAsc(product.getId())) {
            String key = specification.getSpecKey();
            String value = specification.getSpecValue();
            if (key == null || key.isBlank() || value == null || value.isBlank()) {
                continue;
            }

            ProductSpecificationDto row = new ProductSpecificationDto();
            row.setId(specification.getId());
            row.setSpecCategory(specification.getSpecCategory());
            row.setSpecKey(key);
            row.setSpecValue(value);
            row.setSortOrder(specification.getSortOrder());
            specificationRows.add(row);

            specs.put(specification.getSpecKey(), specification.getSpecValue());

            String category = specification.getSpecCategory();
            if (category != null && !category.isBlank()) {
                groupedSpecs.computeIfAbsent(category, k -> new LinkedHashMap<>())
                        .put(specification.getSpecKey(), specification.getSpecValue());
            } else {
                groupedSpecs.computeIfAbsent("Khác", k -> new LinkedHashMap<>())
                        .put(specification.getSpecKey(), specification.getSpecValue());
            }
        }

        AdminProductVariantDto selectedDto = selectedVariant != null
                ? toVariantDto(selectedVariant, stockByVariantId.getOrDefault(selectedVariant.getId(), 0))
                : (variantDtos.isEmpty() ? null : variantDtos.get(0));

        // Override selectedDto price with discounted price if applicable
        if (selectedDto != null && selectedVariant != null) {
            ProductDiscount selectedDiscount = getActiveDiscount(selectedVariant.getId(), activeDiscounts);
            BigDecimal discountedPrice = applyDiscount(selectedVariant.getPrice(), selectedDiscount);
            selectedDto.setPrice(discountedPrice);
            selectedDto.setCompareAtPrice(selectedVariant.getPrice());
            selectedDto.setSaleAmount(getDiscountSavedAmount(selectedVariant.getPrice(), selectedDiscount));
            selectedDto.setImages(getVariantImages(selectedVariant.getId(), imagesByVariantId));
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
        // Dùng discount để lấy % (tính từ discountAmount nếu discountPercent null)
        ProductDiscount selectedDiscount = selectedVariant != null
                ? getActiveDiscount(selectedVariant.getId(), activeDiscounts) : null;
        dto.setSale(selectedDiscount != null && selectedVariant != null
                ? getDiscountPercent(selectedVariant.getPrice(), selectedDiscount) : 0);
        dto.setDescription(product.getDetailDescription());
        dto.setThumbnailUrl(product.getThumbnailUrl());
        dto.setImages(images.stream().map(ProductImage::getImageUrl).toList());
        applyReviewStats(dto, product.getId());
        dto.setSpecifications(specs);
        dto.setSpecificationRows(specificationRows);
        dto.setGroupedSpecifications(groupedSpecs);
        dto.setVariantOptions(variantOptions);
        dto.setVariants(variantDtos);
        dto.setSelectedVariant(selectedDto);
        dto.setIsFeatured(product.getIsFeatured());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setReleaseDate(product.getCreatedAt());
        return dto;
    }

    private AdminProductVariantDto toVariantDto(ProductVariant variant, int stock) {
        AdminProductVariantDto dto = new AdminProductVariantDto();
        dto.setId(variant.getId());
        dto.setSku(variant.getSku());
        dto.setSlug(variant.getSlug());
        dto.setColor(variant.getColor());
        dto.setStorageLabel(getStorageLabel(variant));
        dto.setRamGb(variant.getRamGb());
        dto.setStorageGb(variant.getStorageGb());
        dto.setPrice(variant.getPrice());
        dto.setCostPrice(variant.getCostPrice());
        dto.setStock(stock);
        dto.setColorImageUrl(variant.getColorImageUrl());
        return dto;
    }

    private List<String> getVariantImages(Long variantId, Map<Long, List<String>> imagesByVariantId) {
        if (variantId == null || imagesByVariantId == null || imagesByVariantId.isEmpty()) {
            return List.of();
        }
        return imagesByVariantId.getOrDefault(variantId, List.of()).stream()
                .filter(url -> url != null && !url.isBlank())
                .toList();
    }

    private String getFirstVariantImage(Long variantId, Map<Long, List<String>> imagesByVariantId) {
        return getVariantImages(variantId, imagesByVariantId).stream()
                .findFirst()
                .orElse(null);
    }

    private Map<Long, Integer> getStockByVariantId(List<ProductVariant> variants) {
        if (variants == null || variants.isEmpty()) return Map.of();
        List<Long> variantIds = variants.stream()
                .map(ProductVariant::getId)
                .filter(Objects::nonNull)
                .toList();
        if (variantIds.isEmpty()) return Map.of();

        return inventoryRepository.findByVariantIdIn(variantIds)
                .stream()
                .filter(inventory -> inventory.getVariant() != null && inventory.getVariant().getId() != null)
                .collect(Collectors.toMap(
                        inventory -> inventory.getVariant().getId(),
                        inventory -> inventory.getQuantityOnHand() == null ? 0 : inventory.getQuantityOnHand(),
                        (left, right) -> left
                ));
    }

    private ProductListContext buildProductListContext(List<Product> products) {
        if (products == null || products.isEmpty()) {
            return ProductListContext.empty();
        }

        List<Long> productIds = products.stream()
                .map(Product::getId)
                .filter(Objects::nonNull)
                .toList();
        if (productIds.isEmpty()) {
            return ProductListContext.empty();
        }

        List<ProductVariant> variants = productVariantRepository.findByProductIdInAndDeletedAtIsNull(productIds);
        repairInvalidVariantSlugs(variants);
        Map<Long, List<ProductVariant>> variantsByProductId = variants.stream()
                .filter(variant -> variant.getProduct() != null && variant.getProduct().getId() != null)
                .collect(Collectors.groupingBy(
                        variant -> variant.getProduct().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        Map<Long, Integer> stockByVariantId = getStockByVariantId(variants);
        Map<Long, List<String>> imageUrlsByProductId = getImageUrlsByProductId(productIds);
        Map<Long, Map<String, String>> specsByProductId = getSpecsByProductId(productIds);
        Map<Long, ReviewStats> reviewStatsByProductId = getReviewStatsByProductId(productIds);
        List<ProductDiscount> activeDiscounts = discountRepository.findAllActiveNow(LocalDateTime.now());

        return new ProductListContext(
                variantsByProductId,
                stockByVariantId,
                imageUrlsByProductId,
                specsByProductId,
                reviewStatsByProductId,
                activeDiscounts
        );
    }

    private Map<Long, List<String>> getImageUrlsByProductId(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) return Map.of();
        return productImageRepository.findByProductIdInOrderBySortOrderAscIdAsc(productIds)
                .stream()
                .filter(image -> image.getProduct() != null && image.getProduct().getId() != null)
                .filter(image -> image.getImageUrl() != null && !image.getImageUrl().isBlank())
                .collect(Collectors.groupingBy(
                        image -> image.getProduct().getId(),
                        LinkedHashMap::new,
                        Collectors.mapping(ProductImage::getImageUrl, Collectors.toList())
                ));
    }

    private Map<Long, ReviewStats> getReviewStatsByProductId(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) return Map.of();

        Map<Long, ReviewStats> stats = new HashMap<>();
        for (Object[] row : reviewRepository.getReviewStatsByProductIds(productIds)) {
            if (row == null || row.length < 3 || row[0] == null) continue;
            Long productId = ((Number) row[0]).longValue();
            double average = row[1] == null ? 0.0 : ((Number) row[1]).doubleValue();
            long count = row[2] == null ? 0L : ((Number) row[2]).longValue();
            stats.put(productId, new ReviewStats(Math.round(average * 10.0) / 10.0, count));
        }
        return stats;
    }

    private Map<Long, Map<String, String>> getSpecsByProductId(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) return Map.of();

        Map<Long, Map<String, String>> specsByProductId = new LinkedHashMap<>();
        for (ProductSpecification specification : productSpecificationRepository.findByProductIdInOrderBySortOrderAscIdAsc(productIds)) {
            if (specification.getProduct() == null || specification.getProduct().getId() == null) continue;
            specsByProductId
                    .computeIfAbsent(specification.getProduct().getId(), id -> new LinkedHashMap<>())
                    .put(specification.getSpecKey(), specification.getSpecValue());
        }
        return specsByProductId;
    }

    private String normalizeOptionalParam(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private List<FlashSaleProduct> getActiveFlashSales(List<ProductVariant> variants) {
        if (variants == null || variants.isEmpty()) return List.of();
        List<Long> variantIds = variants.stream()
                .map(ProductVariant::getId)
                .filter(Objects::nonNull)
                .toList();
        if (variantIds.isEmpty()) return List.of();
        return flashSaleProductRepository.findActiveByVariantIds(variantIds, now());
    }

    private FlashSaleProduct getActiveFlashSale(Long variantId, List<FlashSaleProduct> activeFlashSales) {
        if (variantId == null || activeFlashSales == null || activeFlashSales.isEmpty()) return null;
        return activeFlashSales.stream()
                .filter(fp -> fp.getVariant() != null && variantId.equals(fp.getVariant().getId()))
                .findFirst()
                .orElse(null);
    }

    private record ProductListContext(
            Map<Long, List<ProductVariant>> variantsByProductId,
            Map<Long, Integer> stockByVariantId,
            Map<Long, List<String>> imageUrlsByProductId,
            Map<Long, Map<String, String>> specsByProductId,
            Map<Long, ReviewStats> reviewStatsByProductId,
            List<ProductDiscount> activeDiscounts
    ) {
        static ProductListContext empty() {
            return new ProductListContext(Map.of(), Map.of(), Map.of(), Map.of(), Map.of(), List.of());
        }
    }

    private record ReviewStats(Double averageRating, Long reviewCount) {
        static ReviewStats empty() {
            return new ReviewStats(0.0, 0L);
        }
    }

    private AdminProductDto toDtoFromFlashSaleProduct(FlashSaleProduct fp) {
        Product product = fp.getVariant().getProduct();
        return toDtoFromFlashSaleProduct(fp, buildProductListContext(List.of(product)));
    }

    private AdminProductDto toDtoFromFlashSaleProduct(FlashSaleProduct fp, ProductListContext context) {
        Product product = fp.getVariant().getProduct();
        ProductVariant variant = fp.getVariant();
        int flashStock = fp.getQuantity() != null ? fp.getQuantity() : 0;

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
        dto.setStock(flashStock);
        applyReviewStats(dto, context.reviewStatsByProductId().getOrDefault(product.getId(), ReviewStats.empty()));
        dto.setThumbnailUrl(product.getThumbnailUrl());
        dto.setImages(context.imageUrlsByProductId().getOrDefault(product.getId(), List.of()));
        dto.setIsFeatured(product.getIsFeatured());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setReleaseDate(product.getCreatedAt());
        dto.setSelectedVariant(toVariantDto(variant, flashStock));
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

    private void applyReviewStats(AdminProductDto dto, Long productId) {
        if (dto == null || productId == null) {
            return;
        }

        Double averageRating = reviewRepository.getAverageRatingByProductId(productId);
        Long reviewCount = reviewRepository.countApprovedByProductId(productId);

        dto.setAverageRating(averageRating != null ? Math.round(averageRating * 10.0) / 10.0 : 0.0);
        dto.setReviewCount(reviewCount != null ? reviewCount : 0L);
    }

    private void applyReviewStats(AdminProductDto dto, ReviewStats reviewStats) {
        if (dto == null) return;
        ReviewStats stats = reviewStats != null ? reviewStats : ReviewStats.empty();
        dto.setAverageRating(stats.averageRating());
        dto.setReviewCount(stats.reviewCount());
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
        variant.setCostPrice(variantReq.getCostPrice());
        variant.setIsActive(Boolean.TRUE);
        variant.setCreatedAt(now);
        variant.setUpdatedAt(now);
        variant.setColorImageUrl(resolveColorImageUrl(variantReq));
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

    private void repairInvalidVariantSlugs() {
        repairInvalidVariantSlugs(productVariantRepository.findActiveWithProductForSlugRepair());
    }

    private void repairInvalidVariantSlugs(List<ProductVariant> variants) {
        if (variants == null || variants.isEmpty()) return;

        List<ProductVariant> changedVariants = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (ProductVariant variant : variants) {
            if (variant == null) continue;
            String currentSlug = variant.getSlug();
            if (isValidSlug(currentSlug)) continue;

            String nextSlug = generateVariantSlug(variant.getProduct(), variant, currentSlug);
            variant.setSlug(nextSlug);
            variant.setUpdatedAt(now);
            changedVariants.add(variant);
        }

        if (!changedVariants.isEmpty()) {
            productVariantRepository.saveAll(changedVariants);
        }
    }

    private void updateVariant(ProductVariant variant, AdminProductVariantRequestDto variantReq,
            Product product, LocalDateTime now) {
        variant.setSku(generateVariantSku(product.getId(), variantReq, variant.getId().intValue()));
        variant.setColor(normalizeColor(variantReq.getColor()));
        variant.setRamGb(variantReq.getRamGb());
        variant.setStorageGb(variantReq.getStorageGb());
        variant.setStorageLabel(normalizeStorageLabel(variantReq));
        variant.setPrice(resolveVariantPrice(variantReq, null));
        variant.setCostPrice(variantReq.getCostPrice());
        variant.setUpdatedAt(now);
        variant.setColorImageUrl(resolveColorImageUrl(variantReq));
        variant.setSlug(generateVariantSlug(product, variant, variant.getSlug()));

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
        StringBuilder sb = new StringBuilder(sanitizeSlug(product.getSlug()));

        if (variantReq.getRamGb() != null && variantReq.getRamGb() > 0) {
            sb.append("-").append(variantReq.getRamGb()).append("gb");
        }
        if (variantReq.getStorageGb() != null && variantReq.getStorageGb() > 0) {
            sb.append("-").append(formatStorageGb(variantReq.getStorageGb()).toLowerCase());
        }
        if (variantReq.getColor() != null && !variantReq.getColor().isBlank()) {
            sb.append("-").append(normalizeColorForSlug(variantReq.getColor()));
        }

        String baseSlug = sanitizeSlug(sb.toString());
        // Ensure uniqueness
        String finalSlug = baseSlug;
        int counter = 1;
        while (productVariantRepository.findBySlug(finalSlug).isPresent()) {
            finalSlug = baseSlug + "-" + counter;
            counter++;
        }
        return finalSlug;
    }

    private String generateVariantSlug(Product product, ProductVariant variant, String currentSlug) {
        StringBuilder sb = new StringBuilder();
        if (product != null && product.getSlug() != null && isValidSlug(product.getSlug())) {
            sb.append(product.getSlug());
        } else if (product != null && product.getName() != null && !product.getName().isBlank()) {
            sb.append(product.getName());
        } else if (currentSlug != null && !currentSlug.isBlank()) {
            sb.append(currentSlug);
        } else {
            sb.append("san-pham");
        }

        if (variant.getRamGb() != null && variant.getRamGb() > 0) {
            sb.append("-").append(variant.getRamGb()).append("gb");
        }
        if (variant.getStorageLabel() != null && !variant.getStorageLabel().isBlank()) {
            sb.append("-").append(variant.getStorageLabel());
        } else if (variant.getStorageGb() != null && variant.getStorageGb() > 0) {
            sb.append("-").append(formatStorageGb(variant.getStorageGb()));
        }
        if (variant.getColor() != null && !variant.getColor().isBlank()) {
            sb.append("-").append(variant.getColor());
        }

        String baseSlug = sanitizeSlug(sb.toString());
        if (baseSlug.isBlank()) baseSlug = "san-pham";

        String finalSlug = baseSlug;
        int counter = 1;
        while (productVariantRepository.findBySlugAndIdNot(finalSlug, variant.getId()).isPresent()) {
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
        String baseSlug = sanitizeSlug(value);
        if (baseSlug.isBlank()) baseSlug = "san-pham";

        // Ensure uniqueness — append timestamp suffix if slug already exists
        String finalSlug = baseSlug;
        int counter = 1;
        while (productRepository.findBySlugAndDeletedAtIsNull(finalSlug).isPresent()) {
            finalSlug = baseSlug + "-" + counter;
            counter++;
        }
        return finalSlug;
    }

    private boolean isValidSlug(String value) {
        return value != null && value.matches("^[a-z0-9]+(?:-[a-z0-9]+)*$");
    }

    private String sanitizeSlug(String value) {
        if (value == null) return "san-pham";
        String slug = value.toLowerCase(Locale.ROOT)
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
        return slug.isBlank() ? "san-pham" : slug;
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
        if (discount.getDiscountPercent() != null) return discount.getDiscountPercent();
        return 0; // discountPercent sẽ được tính từ discountAmount tại call site nếu cần
    }

    /** Tính % từ discountAmount khi discountPercent null */
    private int getDiscountPercent(BigDecimal originalPrice, ProductDiscount discount) {
        if (discount == null || originalPrice == null) return 0;
        LocalDateTime now = LocalDateTime.now();
        if (!Boolean.TRUE.equals(discount.getIsActive())
                || discount.getEndAt().isBefore(now)
                || discount.getStartAt().isAfter(now)) {
            return 0;
        }
        if (discount.getDiscountPercent() != null) return discount.getDiscountPercent();
        if (discount.getDiscountAmount() != null && discount.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            return discount.getDiscountAmount()
                    .multiply(BigDecimal.valueOf(100))
                    .divide(originalPrice, 0, RoundingMode.HALF_UP).intValue();
        }
        return 0;
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

    private String buildListingVariantGroupKey(ProductVariant variant) {
        if (variant == null) return "default|default";
        String ramKey = variant.getRamGb() != null ? String.valueOf(variant.getRamGb()) : "default";
        String storageKey = variant.getStorageLabel() != null && !variant.getStorageLabel().isBlank()
                ? variant.getStorageLabel().trim().toLowerCase(Locale.ROOT)
                : (variant.getStorageGb() != null && variant.getStorageGb() > 0
                ? formatStorageGb(variant.getStorageGb()).toLowerCase(Locale.ROOT)
                : "default");
        return ramKey + "|" + storageKey;
    }

    private String resolveColorImageUrl(AdminProductVariantRequestDto variantReq) {
        if (variantReq.getImages() != null) {
            for (String imageUrl : variantReq.getImages()) {
                if (imageUrl != null && !imageUrl.isBlank()) {
                    return imageUrl.trim();
                }
            }
        }
        return variantReq.getColorImageUrl();
    }

    private void saveVariantImages(Product product, ProductVariant variant, List<String> imageUrls, LocalDateTime now) {
        if (imageUrls == null || imageUrls.isEmpty()) return;
        List<ProductImage> images = new ArrayList<>();
        for (int i = 0; i < imageUrls.size(); i++) {
            String url = imageUrls.get(i);
            if (url == null || url.isBlank()) continue;
            ProductImage image = new ProductImage();
            image.setProduct(product);
            image.setVariant(variant);
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
            spec.setSpecCategory(categorizeSpecKey(entry.getKey()));
            spec.setSortOrder(i++);
            spec.setCreatedAt(now);
            spec.setUpdatedAt(now);
            specifications.add(spec);
        }
        if (!specifications.isEmpty()) productSpecificationRepository.saveAll(specifications);
    }

    /**
     * Auto-categorize specification key to a CellphoneS-style category.
     */
    private String categorizeSpecKey(String key) {
        if (key == null) return "Khác";
        String lower = key.toLowerCase();
        if (lower.matches(".*(m[àáạảãâầấậẩẫăằắặẳẵ]|screen|monitor|display|lcd|oled|amoled|尺寸|屏幕).*")) return "Màn hình";
        if (lower.matches(".*(camera|chup anh|quay video|mp|megapixel|ois|ois|zoom| telephoto|wide|ultra wide|góc).*")) return "Camera";
        if (lower.matches(".*(cpu|chip|processor|ram|bộ nhớ ram|gpu|vi xử lý|a\\d+|snapdragon|exynos|mediatek|tensor).*")) return "CPU & RAM";
        if (lower.matches(".*(pin|battery|sạc|charging| mah|wh|giờ|charger|magsafe|wireless).*")) return "Pin & Sạc";
        if (lower.matches(".*(wifi|wifi|bluetooth|nfc|usb|cổng|gps|jack|thunderbolt|usb-c|usb 3).*")) return "Kết nối";
        if (lower.matches(".*(5g|4g|lte|sim|esim|nano|băng tần|mạng|carrier).*")) return "Mạng & Di động";
        if (lower.matches(".*(ios|android|hệ điều hành|os|phone os|software).*")) return "Hệ điều hành";
        if (lower.matches(".*(thiết kế|design|kích thước|trọng lượng|weight|size|cao|rộng|dày|mm|gram|chất liệu|mặt kính|vỏ|khung|màu).*")) return "Thiết kế";
        if (lower.matches(".*(bảo mật|security|face id|touch id|vân tay|fingerprint|encrypted|mã hóa).*")) return "Bảo mật";
        return "Khác";
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
