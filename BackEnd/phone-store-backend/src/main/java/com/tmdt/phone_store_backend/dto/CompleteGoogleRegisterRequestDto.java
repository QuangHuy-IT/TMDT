package com.tmdt.phone_store_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CompleteGoogleRegisterRequestDto {

    private String email;

    private String fullName;

    private String avatarUrl;

    private String googleId;

    @NotBlank(message = "So dien thoai khong duoc de trong")
    @Pattern(message = "So dien thoai chi gom 10 chu so", regexp = "^\\d{10}$")
    private String phone;

    @NotBlank(message = "Mat khau khong duoc de trong")
    @Size(min = 8, max = 255, message = "Mat khau phai tu 8 ky tu tro len")
    @Pattern(
        message = "Mat khau phai chua it nhat: 1 chu thuong, 1 chu hoa, 1 so va 1 ky tu dac biet",
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,}$"
    )
    private String password;

    @NotBlank(message = "Xac nhan mat khau khong duoc de trong")
    private String confirmPassword;
}
