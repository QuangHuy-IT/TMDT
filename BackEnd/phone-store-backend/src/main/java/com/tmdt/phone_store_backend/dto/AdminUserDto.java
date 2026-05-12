package com.tmdt.phone_store_backend.dto;

import com.tmdt.phone_store_backend.domain.enums.UserRole;
import com.tmdt.phone_store_backend.domain.enums.UserStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUserDto {
    private Long id;
    private String email;
    private String fullName;
    private Integer yearOfBirth;
    private String phone;
    private UserRole role;
    private UserStatus status;
    private String avatarUrl;
    private String createdAt;
    private String lastLoginAt;
    private Integer orderCount;
    private Long totalSpent;
}
