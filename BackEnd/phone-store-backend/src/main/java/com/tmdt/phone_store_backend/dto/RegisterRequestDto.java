package com.tmdt.phone_store_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
    @Email(message = "Email không hợp lệ", regexp = "^[a-zA-Z0-9._%+-]+@gmail\\.com$")
    private String email;

    @NotBlank(message = "Tên đầy đủ không được để trống")
    @Pattern(message = "Tên chỉ được chứa chữ cái (có dấu cách)", regexp = "^[\\p{L} ]+$")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(message = "Số điện thoại chỉ gồm 10 chữ số", regexp = "^\\d{10}$")
    private String phone;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, max = 255, message = "Mật khẩu phải từ 8 ký tự trở lên")
    @Pattern(
        message = "Mật khẩu phải chứa ít nhất: 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt",
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,}$"
    )
    private String password;

    @NotBlank(message = "Xác nhận mật khẩu không được để trống")
    private String confirmPassword;
}
