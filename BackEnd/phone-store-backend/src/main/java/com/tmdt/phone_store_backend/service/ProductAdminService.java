package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.domain.entity.Brand;
import com.tmdt.phone_store_backend.domain.entity.Category;
import com.tmdt.phone_store_backend.domain.entity.Inventory;
import com.tmdt.phone_store_backend.domain.entity.Product;
import com.tmdt.phone_store_backend.domain.entity.ProductImage;
import com.tmdt.phone_store_backend.domain.entity.ProductSpecification;
import com.tmdt.phone_store_backend.domain.entity.ProductVariant;
import com.tmdt.phone_store_backend.domain.enums.ProductStatus;
import com.tmdt.phone_store_backend.domain.enums.StockStatus;
import com.tmdt.phone_store_backend.dto.AdminProductDto;
import com.tmdt.phone_store_backend.dto.AdminProductRequestDto;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.BrandRepository;
import com.tmdt.phone_store_backend.repository.CategoryRepository;
import com.tmdt.phone_store_backend.repository.InventoryRepository;
import com.tmdt.phone_store_backend.repository.ProductImageRepository;
import com.tmdt.phone_store_backend.repository.ProductRepository;
import com.tmdt.phone_store_backend.repository.ProductSpecificationRepository;
import com.tmdt.phone_store_backend.repository.ProductVariantRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
@Transactional
public class ProductAdminService {

    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductSpecificationRepository productSpecificationRepository;

    public List<AdminProductDto> getAllProducts() {
        return productRepository.findByDeletedAtIsNullOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .toList();
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
        product.setIsFeatured(Boolean.FALSE);
        product.setWarrantyMonths(12);
        product.setCreatedAt(now);
        product.setUpdatedAt(now);
        Product savedProduct = productRepository.save(product);

        ProductVariant variant = new ProductVariant();
        variant.setProduct(savedProduct);
        variant.setSku("SKU-" + savedProduct.getId() + "-DEFAULT");
        variant.setColor("Default");
        variant.setPrice(requestDto.getPrice());
        variant.setIsActive(Boolean.TRUE);
        variant.setCreatedAt(now);
        variant.setUpdatedAt(now);
        ProductVariant savedVariant = productVariantRepository.save(variant);

        Inventory inventory = new Inventory();
        inventory.setVariant(savedVariant);
        inventory.setQuantityOnHand(Math.max(0, requestDto.getStock()));
        inventory.setQuantityReserved(0);
        inventory.setReorderLevel(5);
        inventory.setStockStatus(resolveStockStatus(requestDto.getStock()));
        inventory.setUpdatedAt(now);
        inventoryRepository.save(inventory);

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
        product.setUpdatedAt(now);
        productRepository.save(product);

        ProductVariant variant = productVariantRepository.findFirstByProductIdOrderByIdAsc(id)
                .orElseGet(() -> {
                    ProductVariant newVariant = new ProductVariant();
                    newVariant.setProduct(product);
                    newVariant.setSku("SKU-" + product.getId() + "-DEFAULT");
                    newVariant.setColor("Default");
                    newVariant.setCreatedAt(now);
                    return newVariant;
                });
        variant.setPrice(requestDto.getPrice());
        variant.setIsActive(Boolean.TRUE);
        variant.setUpdatedAt(now);
        ProductVariant savedVariant = productVariantRepository.save(variant);

        Inventory inventory = inventoryRepository.findByVariantId(savedVariant.getId())
                .orElseGet(() -> {
                    Inventory inv = new Inventory();
                    inv.setVariant(savedVariant);
                    inv.setQuantityReserved(0);
                    inv.setReorderLevel(5);
                    return inv;
                });
        inventory.setQuantityOnHand(Math.max(0, requestDto.getStock()));
        inventory.setStockStatus(resolveStockStatus(requestDto.getStock()));
        inventory.setUpdatedAt(now);
        inventoryRepository.save(inventory);

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

        List<ProductVariant> variants = productVariantRepository.findByProductId(id);
        for (ProductVariant variant : variants) {
            inventoryRepository.findByVariantId(variant.getId())
                    .ifPresent(inventoryRepository::delete);
        }
        productVariantRepository.deleteAll(variants);
        productRepository.delete(product);
    }

    private AdminProductDto toDto(Product product) {
        Optional<ProductVariant> variantOpt = productVariantRepository.findFirstByProductIdOrderByIdAsc(
                product.getId());
        int stock = 0;
        BigDecimal price = BigDecimal.ZERO;

        if (variantOpt.isPresent()) {
            ProductVariant variant = variantOpt.get();
            price = variant.getPrice();
            stock = inventoryRepository.findByVariantId(variant.getId())
                    .map(Inventory::getQuantityOnHand)
                    .orElse(0);
        }

        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAscIdAsc(
                product.getId());
        Map<String, String> specs = new HashMap<>();
        for (ProductSpecification specification : productSpecificationRepository
                .findByProductIdOrderBySortOrderAscIdAsc(product.getId())) {
            specs.put(specification.getSpecKey(), specification.getSpecValue());
        }

        AdminProductDto dto = new AdminProductDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setBrand(product.getBrand().getName());
        dto.setPrice(price);
        dto.setStock(stock);
        dto.setDescription(product.getDetailDescription());
        dto.setImages(images.stream().map(ProductImage::getImageUrl).toList());
        dto.setSpecifications(specs);
        dto.setIsFeatured(product.getIsFeatured());
        dto.setCreatedAt(product.getCreatedAt());
        return dto;
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
        String slug = value == null ? "item" : value.toLowerCase(Locale.ROOT)
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
