package com.tmdt.phone_store_backend.dto;

import com.tmdt.phone_store_backend.domain.enums.UserRole;
import com.tmdt.phone_store_backend.domain.enums.UserStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUserUpdateDto {
    private UserRole role;
    private UserStatus status;
}
