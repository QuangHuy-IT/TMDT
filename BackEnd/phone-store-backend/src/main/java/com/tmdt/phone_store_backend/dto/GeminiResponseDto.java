package com.tmdt.phone_store_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO nhận từ Gemini API.
 * API: POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeminiResponseDto {

    @JsonProperty("candidates")
    private List<Candidate> candidates;

    @JsonProperty("promptFeedback")
    private PromptFeedback promptFeedback;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Candidate {
        @JsonProperty("content")
        private Content content;

        @JsonProperty("finishReason")
        private String finishReason;

        @JsonProperty("index")
        private Integer index;

        @JsonProperty("safetyRatings")
        private List<SafetyRating> safetyRatings;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Content {
        @JsonProperty("parts")
        private List<Part> parts;

        @JsonProperty("role")
        private String role;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Part {
        @JsonProperty("text")
        private String text;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SafetyRating {
        @JsonProperty("category")
        private String category;

        @JsonProperty("probability")
        private String probability;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PromptFeedback {
        @JsonProperty("safetyRatings")
        private List<SafetyRating> safetyRatings;

        @JsonProperty("blockReason")
        private String blockReason;
    }

    /**
     * Trích text từ response.
     * @return text thô hoặc "Không có phản hồi từ AI" nếu không có candidates.
     */
    public String extractText() {
        if (candidates == null || candidates.isEmpty()) {
            return "Không có phản hồi từ AI. Vui lòng thử lại sau.";
        }

        Candidate firstCandidate = candidates.get(0);
        if (firstCandidate.getContent() == null
                || firstCandidate.getContent().getParts() == null
                || firstCandidate.getContent().getParts().isEmpty()) {
            return "Phản hồi từ AI bị trống. Vui lòng thử lại.";
        }

        return firstCandidate.getContent().getParts().get(0).getText();
    }

    /**
     * Kiểm tra xem response có bị block bởi safety filter không.
     */
    public boolean isBlocked() {
        if (promptFeedback != null && promptFeedback.getBlockReason() != null) {
            return true;
        }
        if (candidates != null && !candidates.isEmpty()) {
            Candidate c = candidates.get(0);
            return c.getFinishReason() != null
                    && c.getFinishReason().equalsIgnoreCase("MAX_TOKENS");
        }
        return false;
    }
}
