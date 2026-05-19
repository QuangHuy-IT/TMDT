package com.tmdt.phone_store_backend.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO cho compare.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompareRequest {
    private List<String> productNames;
    private List<Long> productIds;
}
