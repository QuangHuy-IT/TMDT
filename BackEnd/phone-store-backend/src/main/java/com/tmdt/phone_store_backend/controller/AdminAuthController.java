package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.AuthResponseDto;
import com.tmdt.phone_store_backend.dto.LoginRequestDto;
import com.tmdt.phone_store_backend.dto.UserResponseDto;
import com.tmdt.phone_store_backend.service.AdminAuthService;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/admin/auth")
@AllArgsConstructor
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    @PostMapping("/login")
    public ResponseEntity<?> adminLogin(@Valid @RequestBody LoginRequestDto requestDto) {
        log.info("Admin login request for email: {}", requestDto.getEmail());

        try {
            AuthResponseDto response = adminAuthService.adminLogin(requestDto);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Admin login failed: {}", e.getMessage());
            throw e;
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getName();
        log.info("Get current admin info for email: {}", email);

        try {
            UserResponseDto response = adminAuthService.getAdminByEmail(email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get current admin: {}", e.getMessage());
            throw e;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> adminLogout() {
        log.info("Admin logout request");
        SecurityContextHolder.clearContext();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Đăng xuất thành công");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        log.info("Admin refresh token request");

        try {
            String newToken = adminAuthService.refreshAccessToken(refreshToken);

            Map<String, String> response = new HashMap<>();
            response.put("token", newToken);
            response.put("type", "Bearer");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Admin token refresh failed: {}", e.getMessage());
            throw e;
        }
    }
}
