package com.tmdt.phone_store_backend.domain.dto;

public record AuthResponse(
        Long userId,
        String firstName,
        String lastName,
        String email,
        String token
) {
}
