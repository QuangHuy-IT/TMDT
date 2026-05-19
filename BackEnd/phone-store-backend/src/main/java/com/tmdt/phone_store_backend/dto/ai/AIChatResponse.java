package com.tmdt.phone_store_backend.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO cho AI chat.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIChatResponse {
    private boolean success;
    private String response;
    private String intent;
    private double confidence;
    private String sessionId;
    private long processingTimeMs;
    private String errorMessage;

    /**
     * Danh sách sản phẩm đi kèm (nếu intent liên quan đến sản phẩm).
     * Frontend dùng để hiển thị product cards có hình ảnh và link đến trang chi tiết.
     */
    private List<ChatProductDto> products;
}
