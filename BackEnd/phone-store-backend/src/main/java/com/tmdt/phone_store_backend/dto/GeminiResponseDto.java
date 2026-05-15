package com.tmdt.phone_store_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeminiResponseDto {

    @JsonProperty("choices")
    private List<Choice> choices;

    public String extractText() {
        if (choices == null || choices.isEmpty()) {
            return "Không có phản hồi từ AI.";
        }
        Choice first = choices.get(0);
        if (first.getMessage() == null || first.getMessage().getContent() == null) {
            return "Phản hồi bị trống.";
        }
        return first.getMessage().getContent();
    }

    public boolean isBlocked() {
        return false; // Groq không có safety filter như Gemini
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Choice {
        private Message message;
        private int index;
        private String finish_reason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Message {
        private String role;
        private String content;
    }
}