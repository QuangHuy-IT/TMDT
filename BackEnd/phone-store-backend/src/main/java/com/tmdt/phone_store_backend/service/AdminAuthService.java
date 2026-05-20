package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.domain.enums.UserRole;
import com.tmdt.phone_store_backend.domain.enums.UserStatus;
import com.tmdt.phone_store_backend.dto.AuthResponseDto;
import com.tmdt.phone_store_backend.dto.LoginRequestDto;
import com.tmdt.phone_store_backend.dto.UserResponseDto;
import com.tmdt.phone_store_backend.exception.InvalidCredentialsException;
import com.tmdt.phone_store_backend.repository.UserRepository;
import com.tmdt.phone_store_backend.security.JwtTokenProvider;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@AllArgsConstructor
@Transactional
public class AdminAuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthResponseDto adminLogin(LoginRequestDto requestDto) {
        log.info("Admin login attempt for email: {}", requestDto.getEmail());

        User user = userRepository.findByEmail(requestDto.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException(
                        "Email hoặc mật khẩu không đúng"));

        if (!passwordEncoder.matches(requestDto.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Email hoặc mật khẩu không đúng");
        }

        if (user.getRole() != UserRole.ADMIN) {
            throw new InvalidCredentialsException(
                    "Bạn không có quyền truy cập trang quản trị");
        }

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new InvalidCredentialsException("Tài khoản của bạn đã bị khóa");
        }

        if (!user.isEnabled()) {
            throw new InvalidCredentialsException(
                    "Tài khoản chưa được xác thực. Vui lòng liên hệ quản trị viên.");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Admin logged in successfully: {}", user.getEmail());

        String token = jwtTokenProvider.generateToken(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());
        UserResponseDto userDto = convertToDto(user);

        return new AuthResponseDto(token, refreshToken, userDto);
    }

    public UserResponseDto getAdminByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException(
                        "Không tìm thấy người dùng"));

        if (user.getRole() != UserRole.ADMIN) {
            throw new InvalidCredentialsException(
                    "Bạn không có quyền truy cập trang quản trị");
        }

        return convertToDto(user);
    }

    private UserResponseDto convertToDto(User user) {
        UserResponseDto dto = new UserResponseDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setEnabled(user.isEnabled());
        return dto;
    }

    public String refreshAccessToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new InvalidCredentialsException("Refresh token không hợp lệ");
        }

        String email = jwtTokenProvider.getEmailFromToken(refreshToken);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException(
                        "Không tìm thấy người dùng"));

        if (user.getRole() != UserRole.ADMIN) {
            throw new InvalidCredentialsException(
                    "Bạn không có quyền truy cập trang quản trị");
        }

        return jwtTokenProvider.generateToken(email);
    }
}
