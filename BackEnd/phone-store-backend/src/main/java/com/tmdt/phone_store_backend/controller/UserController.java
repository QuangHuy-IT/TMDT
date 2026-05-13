package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.dto.ChangePasswordRequestDto;
import com.tmdt.phone_store_backend.dto.UserResponseDto;
import com.tmdt.phone_store_backend.service.EmailService;
import com.tmdt.phone_store_backend.service.OtpService;
import com.tmdt.phone_store_backend.service.UserService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * UserController - xử lý các request liên quan đến user profile
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@AllArgsConstructor
public class UserController {

    private final UserService userService;
    private final OtpService otpService;
    private final EmailService emailService;

    /**
     * GET /api/users/profile - Lấy thông tin profile của user hiện tại
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        log.info("Get profile for user: {}", email);

        try {
            User user = userService.getUserByEmail(email);
            UserResponseDto response = userService.convertToDto(user);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get profile: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * PUT /api/users/profile - Cập nhật thông tin profile
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody UserResponseDto updateDto) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        log.info("Update profile for user: {}", email);

        try {
            User user = userService.getUserByEmail(email);
            UserResponseDto response = userService.updateUser(user.getId(), updateDto);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to update profile: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * POST /api/users/password/send-otp - Gửi OTP để đổi mật khẩu
     */
    @PostMapping("/password/send-otp")
    public ResponseEntity<?> sendOtpForPasswordChange() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        log.info("Send OTP for password change for user: {}", email);

        User user = userService.getUserByEmail(email);
        String otp = otpService.generateOtp(email);
        emailService.sendOtpEmail(email, otp);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Mã xác thực đã được gửi đến email của bạn");
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/users/password/change - Đổi mật khẩu sau khi xác thực OTP
     */
    @PostMapping("/password/change")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequestDto request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        log.info("Password change request for user: {}", email);

        if (!otpService.verifyOtp(email, request.getOtpCode())) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Mã xác thực không hợp lệ hoặc đã hết hạn");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        userService.changePasswordWithOtp(email, request.getOtpCode(), request.getNewPassword(), request.getConfirmPassword());
        otpService.clearOtp(email);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Mật khẩu đã được thay đổi thành công");
        return ResponseEntity.ok(response);
    }
}
