package com.tmdt.phone_store_backend.ai.faq;

import com.tmdt.phone_store_backend.domain.entity.FAQ;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho kết quả FAQ search.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FAQSearchResult {
    private Long faqId;
    private String question;
    private String answer;
    private String category;
    private double similarity;
}
