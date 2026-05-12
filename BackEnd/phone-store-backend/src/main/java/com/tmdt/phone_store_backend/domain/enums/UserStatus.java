package com.tmdt.phone_store_backend.domain.enums;

public enum UserStatus {
    ACTIVE,
    BLOCKED,
    PENDING   // Chờ xác thực email (OTP) - dùng cho Google OAuth hybrid flow
}
