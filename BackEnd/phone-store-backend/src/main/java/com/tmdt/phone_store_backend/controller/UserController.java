package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.dto.UserResponseDto;
import com.tmdt.phone_store_backend.service.UserService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * UserController - xử lý các request liên quan đến user profile
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@AllArgsConstructor
public class UserController {

    private final UserService userService;

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
}
