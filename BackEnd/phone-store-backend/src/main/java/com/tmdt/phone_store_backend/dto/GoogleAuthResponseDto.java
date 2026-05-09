package com.tmdt.phone_store_backend.dto;

import com.tmdt.phone_store_backend.domain.enums.UserRole;
import com.tmdt.phone_store_backend.domain.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GoogleAuthResponseDto {

    private String stage;       // "login" | "complete_profile" | "verify_otp"
    private String message;
    private String token;       // chỉ có khi stage = "login"
    private String refreshToken;
    private UserResponseDto user;
    private String email;       // email để hiển thị ở complete_profile
    private String fullName;
    private String avatarUrl;
}
