package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.domain.entity.Brand;
import com.tmdt.phone_store_backend.domain.entity.Product;
import com.tmdt.phone_store_backend.domain.entity.ProductVariant;
import com.tmdt.phone_store_backend.domain.enums.ProductStatus;
import com.tmdt.phone_store_backend.dto.ProductInfoDto;
import com.tmdt.phone_store_backend.repository.ProductRepository;
import com.tmdt.phone_store_backend.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service truy vấn database sản phẩm để đưa vào Gemini prompt.
 *
 * Phân tích từ khóa người dùng → query sản phẩm phù hợp từ MySQL.
 *
 * Mở rộng sau này:
 * - Semantic Search (Elasticsearch / pgvector)
 * - RAG pipeline
 * - Recommendation Engine (collaborative filtering)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ProductRecommendationService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;

    private static final Pattern PRICE_PATTERN =
            Pattern.compile("(\\d+)\\s*(triệu|jt?|k|nghìn)", Pattern.CASE_INSENSITIVE);

    /**
     * Tìm sản phẩm phù hợp với query người dùng.
     *
     * @param userMessage Tin nhắn người dùng
     * @return Danh sách ProductInfoDto (tối đa 8 sản phẩm)
     */
    public List<ProductInfoDto> findProductsForPrompt(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return List.of();
        }

        String lower = userMessage.toLowerCase().trim();

        // Trích xuất budget từ message (VD: "dưới 10 triệu", "trên 5 triệu")
        BigDecimal maxBudget = extractBudget(lower);
        BigDecimal minBudget = extractMinBudget(lower);

        // Xác định loại điện thoại
        List<String> categories = detectCategories(lower);
        String brand = detectBrand(lower);

        // Query sản phẩm từ database
        List<Product> products = queryProducts(categories, brand, maxBudget, minBudget);

        if (products.isEmpty()) {
            log.info("No products matched for query: {}", userMessage);
            return List.of();
        }

        // Convert sang DTO với thông tin giá
        List<ProductInfoDto> result = new ArrayList<>();
        for (Product product : products) {
            ProductInfoDto dto = mapToDto(product);
            if (dto != null) {
                result.add(dto);
            }
        }

        log.info("Found {} products for query: {}", result.size(), userMessage);
        return result;
    }

    /**
     * Lấy tất cả sản phẩm active (dùng cho fallback khi không match query).
     */
    public List<ProductInfoDto> getAllActiveProducts() {
        List<Product> products = productRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();
        List<ProductInfoDto> result = new ArrayList<>();
        for (Product product : products) {
            if (product.getStatus() == ProductStatus.ACTIVE) {
                ProductInfoDto dto = mapToDto(product);
                if (dto != null) {
                    result.add(dto);
                }
            }
        }
        return result;
    }

    // ---- Private methods ----

    private List<Product> queryProducts(
            List<String> categories,
            String brand,
            BigDecimal maxBudget,
            BigDecimal minBudget) {

        List<Product> products = productRepository
                .findByDeletedAtIsNullOrderByCreatedAtDesc();

        return products.stream()
                .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
                .filter(p -> brand == null
                        || (p.getBrand() != null
                            && p.getBrand().getName().toLowerCase().contains(brand.toLowerCase())))
                .filter(p -> categories == null || categories.isEmpty()
                        || matchesAnyCategory(p, categories))
                .filter(p -> maxBudget == null || hasPriceInRange(p, null, maxBudget))
                .filter(p -> minBudget == null || hasPriceInRange(p, minBudget, null))
                .limit(8)
                .toList();
    }

    private boolean matchesAnyCategory(Product p, List<String> categories) {
        String text = (p.getName() + " " + p.getShortDescription()).toLowerCase();
        return categories.stream().anyMatch(text::contains);
    }

    private boolean hasPriceInRange(Product p, BigDecimal min, BigDecimal max) {
        List<ProductVariant> variants = variantRepository
                .findByProductIdAndDeletedAtIsNullOrderByPriceAsc(p.getId());

        if (variants.isEmpty()) {
            return true; // Không có variant → không lọc theo giá
        }

        BigDecimal minPrice = variants.stream()
                .map(ProductVariant::getPrice)
                .min(Comparator.naturalOrder())
                .orElse(null);

        if (minPrice == null) return true;

        if (max != null) {
            BigDecimal maxBudget = max.multiply(BigDecimal.valueOf(1_000_000));
            if (minPrice.compareTo(maxBudget) > 0) return false;
        }

        if (min != null) {
            BigDecimal minBudget = min.multiply(BigDecimal.valueOf(1_000_000));
            if (minPrice.compareTo(minBudget) < 0) return false;
        }

        return true;
    }

    private BigDecimal extractBudget(String text) {
        Matcher m = Pattern.compile("(?:dưới|ít hơn|nhỏ hơn|max|tối đa)\\s*(\\d+)\\s*(?:triệu|jt?)?")
                .matcher(text);
        if (m.find()) {
            return new BigDecimal(m.group(1));
        }
        return null;
    }

    private BigDecimal extractMinBudget(String text) {
        Matcher m = Pattern.compile("(?:trên|ít nhất|từ|trên|trên)\\s*(\\d+)\\s*(?:triệu|jt?)?")
                .matcher(text);
        if (m.find()) {
            return new BigDecimal(m.group(1));
        }
        return null;
    }

    private List<String> detectCategories(String text) {
        List<String> cats = new ArrayList<>();

        if (containsAny(text, "gaming", "chơi game", "game", "hiệu năng cao", "chip mạnh")) {
            cats.add("gaming");
        }
        if (containsAny(text, "pin trâu", "pin khủng", "dung lượng pin", "pin lớn", "pin trâu", "thời lượng pin")) {
            cats.add("pin");
        }
        if (containsAny(text, "camera", "chụp ảnh", "chụp hình", "ảnh đẹp", "selfie", "quay video")) {
            cats.add("camera");
        }
        if (containsAny(text, "mỏng", "nhẹ", "thời trang", "mẫu mã", "đẹp")) {
            cats.add("design");
        }
        if (containsAny(text, "5g", "mạng nhanh")) {
            cats.add("5g");
        }
        if (containsAny(text, "giá rẻ", "bình dân", "phổ thông", "tầm trung", "trung cấp")) {
            cats.add("budget");
        }
        if (containsAny(text, "cao cấp", "flagship", "sang trọng", "đắt tiền")) {
            cats.add("flagship");
        }

        return cats;
    }

    private String detectBrand(String text) {
        if (containsAny(text, "iphone", "apple")) return "iphone";
        if (containsAny(text, "samsung", "galaxy")) return "samsung";
        if (containsAny(text, "xiaomi", "redmi", "poco")) return "xiaomi";
        if (containsAny(text, "oppo")) return "oppo";
        if (containsAny(text, "vivo")) return "vivo";
        if (containsAny(text, "realme")) return "realme";
        if (containsAny(text, "nokia")) return "nokia";
        return null;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String k : keywords) {
            if (text.contains(k)) return true;
        }
        return false;
    }

    private ProductInfoDto mapToDto(Product product) {
        List<ProductVariant> variants = variantRepository
                .findByProductIdAndDeletedAtIsNullOrderByPriceAsc(product.getId());

        if (variants.isEmpty()) {
            return null;
        }

        BigDecimal minPrice = variants.stream()
                .map(ProductVariant::getPrice)
                .min(Comparator.naturalOrder())
                .orElse(null);

        BigDecimal maxPrice = variants.stream()
                .map(ProductVariant::getPrice)
                .max(Comparator.naturalOrder())
                .orElse(null);

        String brandName = product.getBrand() != null ? product.getBrand().getName() : "Khác";
        String categoryName = product.getCategory() != null ? product.getCategory().getName() : "Điện thoại";

        return ProductInfoDto.builder()
                .id(product.getId())
                .name(product.getName())
                .brandName(brandName)
                .categoryName(categoryName)
                .slug(product.getSlug())
                .shortDescription(product.getShortDescription())
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .salePercent(product.getSale())
                .warrantyMonths(product.getWarrantyMonths())
                .isFeatured(product.getIsFeatured())
                .build();
    }
}
