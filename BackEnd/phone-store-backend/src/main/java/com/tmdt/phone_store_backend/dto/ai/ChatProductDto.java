package com.tmdt.phone_store_backend.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO chứa thông tin sản phẩm trả về trong chat response.
 * Dùng để frontend hiển thị product cards có hình ảnh và link đến trang chi tiết.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatProductDto {

    private Long productId;

    private String productName;

    private String brandName;

    private String thumbnail;

    private BigDecimal minPrice;

    private BigDecimal maxPrice;

    private Double salePercent;

    private String slug;
}
