package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.domain.enums.AuthSource;
import com.tmdt.phone_store_backend.domain.enums.UserRole;
import com.tmdt.phone_store_backend.domain.enums.UserStatus;
import com.tmdt.phone_store_backend.dto.LoginRequestDto;
import com.tmdt.phone_store_backend.dto.RegisterRequestDto;
import com.tmdt.phone_store_backend.dto.UserResponseDto;
import com.tmdt.phone_store_backend.exception.InvalidCredentialsException;
import com.tmdt.phone_store_backend.exception.ResourceAlreadyExistsException;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.UserRepository;
import com.tmdt.phone_store_backend.security.JwtTokenProvider;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * UserService - xu ly business logic lien quan den User
 */
@Slf4j
@Service
@AllArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public UserResponseDto register(RegisterRequestDto requestDto) {
        log.info("Registering new user with email: {}", requestDto.getEmail());

        if (!requestDto.getPassword().equals(requestDto.getConfirmPassword())) {
            throw new InvalidCredentialsException("Mat khau xac nhan khong khop");
        }

        if (userRepository.existsByEmail(requestDto.getEmail())) {
            throw new ResourceAlreadyExistsException(
                    "Email da duoc su dung: " + requestDto.getEmail());
        }

        if (userRepository.existsByPhone(requestDto.getPhone())) {
            throw new ResourceAlreadyExistsException(
                    "So dien thoai da duoc su dung: " + requestDto.getPhone());
        }

        LocalDateTime now = LocalDateTime.now();
        User user = new User();
        user.setEmail(requestDto.getEmail());
        user.setFullName(requestDto.getFullName());
        user.setPhone(requestDto.getPhone());
        user.setPasswordHash(passwordEncoder.encode(requestDto.getPassword()));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        user.setAuthSource(AuthSource.LOCAL);
        user.setEnabled(true);
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with email: {}", savedUser.getEmail());

        return convertToDto(savedUser);
    }

    public User login(LoginRequestDto requestDto) {
        log.info("Login attempt for email: {}", requestDto.getEmail());

        User user = userRepository.findByEmail(requestDto.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException(
                        "Email hoac mat khau khong dung"));

        if (!passwordEncoder.matches(requestDto.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Email hoac mat khau khong dung");
        }

        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new InvalidCredentialsException("Tai khoan cua ban da bi khoa");
        }

        if (!user.isEnabled()) {
            throw new InvalidCredentialsException("Tai khoan chua duoc xac thuc. Vui long kich hoat tai khoan qua email.");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("User logged in successfully: {}", user.getEmail());
        return user;
    }

    public UserResponseDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Khong tim thay nguoi dung voi ID: " + id));
        return convertToDto(user);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Khong tim thay nguoi dung voi email: " + email));
    }

    public UserResponseDto updateUser(Long id, UserResponseDto updateDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Khong tim thay nguoi dung voi ID: " + id));

        if (updateDto.getFullName() != null) {
            user.setFullName(updateDto.getFullName());
        }
        if (updateDto.getPhone() != null && !updateDto.getPhone().equals(user.getPhone())) {
            if (userRepository.existsByPhone(updateDto.getPhone())) {
                throw new ResourceAlreadyExistsException(
                        "So dien thoai da duoc su dung");
            }
            user.setPhone(updateDto.getPhone());
        }
        if (updateDto.getAvatarUrl() != null) {
            user.setAvatarUrl(updateDto.getAvatarUrl());
        }
        if (updateDto.getProvince() != null) {
            user.setProvince(updateDto.getProvince());
        }
        if (updateDto.getDistrict() != null) {
            user.setDistrict(updateDto.getDistrict());
        }
        if (updateDto.getWard() != null) {
            user.setWard(updateDto.getWard());
        }
        if (updateDto.getDetailAddress() != null) {
            user.setDetailAddress(updateDto.getDetailAddress());
        }

        user.setUpdatedAt(LocalDateTime.now());
        User updatedUser = userRepository.save(user);

        log.info("User updated successfully: {}", id);
        return convertToDto(updatedUser);
    }

    public UserResponseDto convertToDto(User user) {
        UserResponseDto dto = new UserResponseDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setProvince(user.getProvince());
        dto.setDistrict(user.getDistrict());
        dto.setWard(user.getWard());
        dto.setDetailAddress(user.getDetailAddress());
        dto.setEnabled(user.isEnabled());
        dto.setAuthSource(user.getAuthSource() != null ? user.getAuthSource().name() : AuthSource.LOCAL.name());
        return dto;
    }

    public UserResponseDto updateAvatar(Long userId, String avatarUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));
        user.setAvatarUrl(avatarUrl);
        user.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);
        log.info("Avatar updated for user: {}", userId);
        return convertToDto(saved);
    }

    public void changePasswordWithOtp(String email, String otpCode, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new InvalidCredentialsException("Mat khau xac nhan khong khop");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        log.info("Password changed successfully for user: {}", email);
    }

    public void changePassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        log.info("Password changed successfully for user: {}", email);
    }

    public String refreshAccessToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new InvalidCredentialsException("Refresh token khong hop le");
        }

        String email = jwtTokenProvider.getEmailFromToken(refreshToken);
        return jwtTokenProvider.generateToken(email);
    }
}
