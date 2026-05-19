package com.tmdt.phone_store_backend.ai.intent;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Kết quả từ Intent Detection, bao gồm intent đã detect và confidence score.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntentResult {
    private IntentType intent;
    private double confidence;
    private String detectionMethod;

    public boolean isConfident() {
        return confidence >= 0.6;
    }

    public boolean isFAQ() {
        return intent != null && intent.isFAQ();
    }

    public boolean isProductRelated() {
        return intent != null && intent.isProductRelated();
    }
}
