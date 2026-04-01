package com.tmdt.phone_store_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO cho request đăng ký
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequestDto {
    
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;
    
    @NotBlank(message = "Tên đầy đủ không được để trống")
    @Size(min = 3, max = 150, message = "Tên phải từ 3 đến 150 ký tự")
    private String fullName;
    
    private Integer yearOfBirth;
    
    @NotBlank(message = "Số điện thoại không được để trống")
    @Size(min = 10, max = 20, message = "Số điện thoại không hợp lệ")
    private String phone;
    
    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, max = 255, message = "Mật khẩu phải từ 6 ký tự trở lên")
    private String password;
    
    @NotBlank(message = "Xác nhận mật khẩu không được để trống")
    private String confirmPassword;
}
