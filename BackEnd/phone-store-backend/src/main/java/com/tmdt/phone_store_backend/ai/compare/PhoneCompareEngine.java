package com.tmdt.phone_store_backend.ai.compare;

import com.tmdt.phone_store_backend.domain.entity.Product;
import com.tmdt.phone_store_backend.domain.entity.ProductVariant;
import com.tmdt.phone_store_backend.domain.enums.ProductStatus;
import com.tmdt.phone_store_backend.repository.ProductRepository;
import com.tmdt.phone_store_backend.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Engine so sánh điện thoại.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PhoneCompareEngine {

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;

    /**
     * So sánh các sản phẩm theo tên.
     */
    public CompareResult compare(List<String> productNames) {
        List<Product> products = new ArrayList<>();
        
        for (String name : productNames) {
            Product product = findProductByName(name);
            if (product != null) {
                products.add(product);
            }
        }
        
        if (products.size() < 2) {
            return CompareResult.builder()
                .success(false)
                .errorMessage("Cần ít nhất 2 sản phẩm để so sánh. Vui lòng kiểm tra lại tên sản phẩm.")
                .build();
        }
        
        return buildComparisonResult(products);
    }

    /**
     * So sánh các sản phẩm theo IDs.
     */
    public CompareResult compareByIds(List<Long> productIds) {
        if (productIds == null || productIds.size() < 2) {
            return CompareResult.builder()
                .success(false)
                .errorMessage("Cần ít nhất 2 sản phẩm để so sánh")
                .build();
        }
        
        List<Product> products = productRepository.findAllById(productIds).stream()
            .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
            .collect(Collectors.toList());
        
        if (products.size() < 2) {
            return CompareResult.builder()
                .success(false)
                .errorMessage("Không tìm thấy đủ sản phẩm để so sánh")
                .build();
        }
        
        return buildComparisonResult(products);
    }

    /**
     * Tìm sản phẩm theo tên.
     */
    private Product findProductByName(String name) {
        String normalized = name.toLowerCase().trim();
        List<Product> allProducts = productRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();
        
        for (Product product : allProducts) {
            if (product.getStatus() != ProductStatus.ACTIVE) continue;
            
            String productNameLower = product.getName().toLowerCase();
            
            // Exact or contains match
            if (productNameLower.contains(normalized) || 
                normalized.contains(productNameLower)) {
                return product;
            }
            
            // Slug match
            if (product.getSlug() != null && 
                product.getSlug().toLowerCase().contains(normalized.replace(" ", "-"))) {
                return product;
            }
            
            // Partial match
            if (matchesPartial(productNameLower, normalized)) {
                return product;
            }
        }
        
        return null;
    }

    /**
     * Kiểm tra partial match.
     */
    private boolean matchesPartial(String productName, String searchTerm) {
        String[] searchTerms = searchTerm.split("\\s+");
        int matchCount = 0;
        for (String term : searchTerms) {
            if (term.length() > 2 && productName.contains(term)) {
                matchCount++;
            }
        }
        return matchCount >= Math.min(2, searchTerms.length);
    }

    /**
     * Xây dựng kết quả so sánh.
     */
    private CompareResult buildComparisonResult(List<Product> products) {
        List<CompareResult.ProductComparison> comparisons = new ArrayList<>();
        
        for (Product product : products) {
            CompareResult.ProductComparison comparison = buildProductComparison(product);
            comparisons.add(comparison);
        }
        
        // Build spec comparison table
        Map<String, List<String>> specTable = buildSpecTable(products);
        
        // Generate summary
        String summary = generateSummary(comparisons);
        
        return CompareResult.builder()
            .success(true)
            .products(comparisons)
            .specTable(specTable)
            .summary(summary)
            .build();
    }

    /**
     * Xây dựng comparison cho một sản phẩm.
     */
    private CompareResult.ProductComparison buildProductComparison(Product product) {
        ProductVariant primaryVariant = null;
        List<ProductVariant> variants = variantRepository
            .findByProductIdAndDeletedAtIsNullOrderByPriceAsc(product.getId());
        
        if (!variants.isEmpty()) {
            primaryVariant = variants.get(0);
        }
        
        // Build specs map
        Map<String, String> specs = new LinkedHashMap<>();
        
        // Add variant info as specs
        if (primaryVariant != null) {
            if (primaryVariant.getRamGb() != null) {
                specs.put("RAM", primaryVariant.getRamGb() + " GB");
            }
            if (primaryVariant.getStorageGb() != null) {
                specs.put("Storage", primaryVariant.getStorageGb() + " GB");
            }
        }
        
        return CompareResult.ProductComparison.builder()
            .productId(product.getId())
            .productName(product.getName())
            .brand(product.getBrand() != null ? product.getBrand().getName() : "")
            .thumbnail(product.getThumbnailUrl())
            .price(primaryVariant != null ? primaryVariant.getPrice() : null)
            .variantCount(variants.size())
            .specifications(specs)
            .build();
    }

    /**
     * Xây dựng bảng so sánh thông số.
     */
    private Map<String, List<String>> buildSpecTable(List<Product> products) {
        Map<String, List<String>> table = new LinkedHashMap<>();
        
        // Common spec keys to compare
        String[] commonSpecs = {"RAM", "Storage", "Display", "Camera", "Battery", 
                               "Chipset", "OS", "Screen Size", "Resolution"};
        
        for (String specKey : commonSpecs) {
            List<String> values = new ArrayList<>();
            boolean hasValue = false;
            
            for (Product product : products) {
                String value = getSpecValue(product, specKey);
                if (value != null && !value.isEmpty()) {
                    values.add(value);
                    hasValue = true;
                } else {
                    values.add("-");
                }
            }
            
            if (hasValue) {
                table.put(specKey, values);
            }
        }
        
        return table;
    }

    /**
     * Lấy giá trị spec từ product.
     */
    private String getSpecValue(Product product, String specKey) {
        // Check variant-based specs
        List<ProductVariant> variants = variantRepository
            .findByProductIdAndDeletedAtIsNullOrderByPriceAsc(product.getId());
        
        if (!variants.isEmpty()) {
            ProductVariant variant = variants.get(0);
            return switch (specKey) {
                case "RAM" -> variant.getRamGb() != null ? variant.getRamGb() + " GB" : null;
                case "Storage" -> variant.getStorageGb() != null ? variant.getStorageGb() + " GB" : null;
                default -> null;
            };
        }
        
        return null;
    }

    /**
     * Tạo tóm tắt so sánh.
     */
    private String generateSummary(List<CompareResult.ProductComparison> comparisons) {
        StringBuilder summary = new StringBuilder();
        summary.append("📋 SO SÁNH CHI TIẾT:\n\n");
        
        for (CompareResult.ProductComparison comp : comparisons) {
            summary.append("📱 ").append(comp.getProductName()).append("\n");
            
            Map<String, String> specs = comp.getSpecifications();
            if (specs != null) {
                if (specs.containsKey("Camera")) {
                    summary.append("   📷 Camera: ").append(specs.get("Camera")).append("\n");
                }
                if (specs.containsKey("Battery")) {
                    summary.append("   🔋 Pin: ").append(specs.get("Battery")).append("\n");
                }
                if (specs.containsKey("RAM")) {
                    summary.append("   💾 RAM: ").append(specs.get("RAM")).append("\n");
                }
                if (specs.containsKey("Display")) {
                    summary.append("   🖥️ Màn hình: ").append(specs.get("Display")).append("\n");
                }
            }
            summary.append("\n");
        }
        
        summary.append("💡 Dựa trên so sánh, sản phẩm phù hợp nhất tùy thuộc vào nhu cầu sử dụng của bạn.");
        
        return summary.toString();
    }

    /**
     * Kết quả so sánh.
     */
    @lombok.Data
    @lombok.Builder
    public static class CompareResult {
        private boolean success;
        private String errorMessage;
        private List<ProductComparison> products;
        private Map<String, List<String>> specTable;
        private String summary;
        
        @lombok.Data
        @lombok.Builder
        public static class ProductComparison {
            private Long productId;
            private String productName;
            private String brand;
            private String thumbnail;
            private java.math.BigDecimal price;
            private int variantCount;
            private Map<String, String> specifications;
        }
    }
}
