package com.tmdt.phone_store_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

/**
 * DTO chuyển đổi thông tin sản phẩm thành text để đưa vào Gemini prompt.
 * Chỉ chứa các trường cần thiết cho AI tư vấn — không expose toàn bộ entity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductInfoDto {

    private Long id;
    private String name;
    private String brandName;
    private String categoryName;
    private String slug;
    private String shortDescription;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Integer salePercent;
    private Integer warrantyMonths;
    private Boolean isFeatured;

    /**
     * Chuyển thành text format cho prompt.
     * Ví dụ:
     *   - POCO X6 Pro (Xiaomi), 5,490,000đ (giảm 15%), Bảo hành 18 tháng
     */
    public String toPromptLine() {
        StringBuilder sb = new StringBuilder();
        sb.append("- ").append(name);
        sb.append(" (").append(brandName).append(")");

        if (minPrice != null && maxPrice != null) {
            if (minPrice.compareTo(maxPrice) == 0) {
                sb.append(", ").append(formatPrice(minPrice)).append("đ");
            } else {
                sb.append(", ").append(formatPrice(minPrice))
                        .append(" - ")
                        .append(formatPrice(maxPrice))
                        .append("đ");
            }
        }

        if (salePercent != null && salePercent > 0) {
            sb.append(" (giảm ").append(salePercent).append("%)");
        }

        if (warrantyMonths != null) {
            sb.append(", Bảo hành ").append(warrantyMonths).append(" tháng");
        }

        if (shortDescription != null && !shortDescription.isBlank()) {
            sb.append(" | ").append(shortDescription);
        }

        sb.append(" | Xem: /product/").append(slug);

        return sb.toString();
    }

    private String formatPrice(BigDecimal price) {
        return String.format("%,.0f", price);
    }
}
