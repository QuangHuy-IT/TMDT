package com.tmdt.phone_store_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO gửi đến Gemini API.
 * API: POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeminiRequestDto {

    @JsonProperty("contents")
    private List<Content> contents;

    @JsonProperty("systemInstruction")
    private SystemInstruction systemInstruction;

    @JsonProperty("generationConfig")
    private GenerationConfig generationConfig;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Content {
        @JsonProperty("role")
        private String role;

        @JsonProperty("parts")
        private List<Part> parts;
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
    public static class SystemInstruction {
        @JsonProperty("parts")
        private List<Part> parts;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GenerationConfig {
        @JsonProperty("temperature")
        private Double temperature;

        @JsonProperty("maxOutputTokens")
        private Integer maxOutputTokens;

        @JsonProperty("topP")
        private Double topP;

        @JsonProperty("topK")
        private Integer topK;
    }
}
