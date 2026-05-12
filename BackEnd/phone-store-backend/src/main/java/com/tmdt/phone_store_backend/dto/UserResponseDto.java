package com.tmdt.phone_store_backend.dto;

import com.tmdt.phone_store_backend.domain.enums.UserRole;
import com.tmdt.phone_store_backend.domain.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO cho response thong tin nguoi dung
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponseDto {

    private Long id;

    private String email;

    private String fullName;

    private String phone;

    private UserRole role;

    private UserStatus status;

    private String avatarUrl;

    private String province;

    private String district;

    private String ward;

    private String detailAddress;

    private boolean enabled;

    private String authSource;
}
