package com.tmdt.phone_store_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO cho response sau khi đăng nhập/đăng ký thành công
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponseDto {
    
    private String token;
    
    private String refreshToken;
    
    private String type = "Bearer";
    
    private UserResponseDto user;
    
    public AuthResponseDto(String token, String refreshToken, UserResponseDto user) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.user = user;
    }
}
