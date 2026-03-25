package com.tmdt.phone_store_backend.dto;

import com.tmdt.phone_store_backend.domain.enums.UserRole;
import com.tmdt.phone_store_backend.domain.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO cho response thông tin người dùng
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDto {
    
    private Long id;
    
    private String email;
    
    private String fullName;
    
    private String phone;
    
    private UserRole role;
    
    private UserStatus status;
    
    private String avatarUrl;
}
