package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.domain.entity.User;
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
 * UserService - xử lý business logic liên quan đến User
 */
@Slf4j
@Service
@AllArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Đăng ký người dùng mới
     */
    public UserResponseDto register(RegisterRequestDto requestDto) {
        log.info("Registering new user with email: {}", requestDto.getEmail());

        // Kiểm tra mật khẩu xác nhận
        if (!requestDto.getPassword().equals(requestDto.getConfirmPassword())) {
            throw new InvalidCredentialsException("Mật khẩu xác nhận không khớp");
        }

        // Kiểm tra email đã tồn tại
        if (userRepository.existsByEmail(requestDto.getEmail())) {
            throw new ResourceAlreadyExistsException(
                    "Email đã được sử dụng: " + requestDto.getEmail());
        }

        // Kiểm tra số điện thoại đã tồn tại
        if (userRepository.existsByPhone(requestDto.getPhone())) {
            throw new ResourceAlreadyExistsException(
                    "Số điện thoại đã được sử dụng: " + requestDto.getPhone());
        }

        // Tạo user mới
        User user = new User();
        user.setEmail(requestDto.getEmail());
        user.setFullName(requestDto.getFullName());
        user.setPhone(requestDto.getPhone());
        user.setPasswordHash(passwordEncoder.encode(requestDto.getPassword()));
        user.setRole(UserRole.USER);
        user.setStatus(UserStatus.ACTIVE);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with email: {}", savedUser.getEmail());

        return convertToDto(savedUser);
    }

    /**
     * Đăng nhập người dùng
     */
    public User login(LoginRequestDto requestDto) {
        log.info("Login attempt for email: {}", requestDto.getEmail());

        User user = userRepository.findByEmail(requestDto.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException(
                        "Email hoặc mật khẩu không đúng"));

        // Kiểm tra password
        if (!passwordEncoder.matches(requestDto.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Email hoặc mật khẩu không đúng");
        }

        // Kiểm tra user có bị khóa không
        if (user.getStatus() == UserStatus.BLOCKED) {
            throw new InvalidCredentialsException("Tài khoản của bạn đã bị khóa");
        }

        // Cập nhật last login
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("User logged in successfully: {}", user.getEmail());
        return user;
    }

    /**
     * Lấy thông tin người dùng theo ID
     */
    public UserResponseDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy người dùng với ID: " + id));
        return convertToDto(user);
    }

    /**
     * Lấy thông tin người dùng theo email
     */
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy người dùng với email: " + email));
    }

    /**
     * Cập nhật thông tin người dùng
     */
    public UserResponseDto updateUser(Long id, UserResponseDto updateDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy người dùng với ID: " + id));

        if (updateDto.getFullName() != null) {
            user.setFullName(updateDto.getFullName());
        }
        if (updateDto.getPhone() != null && !updateDto.getPhone().equals(user.getPhone())) {
            if (userRepository.existsByPhone(updateDto.getPhone())) {
                throw new ResourceAlreadyExistsException(
                        "Số điện thoại đã được sử dụng");
            }
            user.setPhone(updateDto.getPhone());
        }
        if (updateDto.getAvatarUrl() != null) {
            user.setAvatarUrl(updateDto.getAvatarUrl());
        }

        user.setUpdatedAt(LocalDateTime.now());
        User updatedUser = userRepository.save(user);

        log.info("User updated successfully: {}", id);
        return convertToDto(updatedUser);
    }

    /**
     * Chuyển đổi User entity thành UserResponseDto
     */
    public UserResponseDto convertToDto(User user) {
        UserResponseDto dto = new UserResponseDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());
        dto.setAvatarUrl(user.getAvatarUrl());
        return dto;
    }

    /**
     * Refresh access token từ refresh token
     */
    public String refreshAccessToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new InvalidCredentialsException("Refresh token không hợp lệ");
        }

        String email = jwtTokenProvider.getEmailFromToken(refreshToken);
        return jwtTokenProvider.generateToken(email);
    }
}
