package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.domain.enums.AuthSource;
import com.tmdt.phone_store_backend.domain.enums.UserRole;
import com.tmdt.phone_store_backend.domain.enums.UserStatus;
import com.tmdt.phone_store_backend.dto.CompleteGoogleRegisterRequestDto;
import com.tmdt.phone_store_backend.dto.GoogleAuthRequestDto;
import com.tmdt.phone_store_backend.dto.GoogleAuthResponseDto;
import com.tmdt.phone_store_backend.dto.UserResponseDto;
import com.tmdt.phone_store_backend.exception.InvalidCredentialsException;
import com.tmdt.phone_store_backend.exception.ResourceAlreadyExistsException;
import com.tmdt.phone_store_backend.repository.UserRepository;
import com.tmdt.phone_store_backend.security.JwtTokenProvider;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final OtpService otpService;
    private final EmailService emailService;

    @Transactional
    public GoogleAuthResponseDto handleGoogleAuth(GoogleAuthRequestDto request) {
        String email = request.getEmail().toLowerCase();
        log.info("Processing Google auth for email: {}", email);

        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null) {
            // Case A: Email đã tồn tại và có mật khẩu -> Đăng nhập ngay
            if (user.getPasswordHash() != null && !user.getPasswordHash().isBlank()) {
                if (user.getStatus() == UserStatus.BLOCKED) {
                    throw new InvalidCredentialsException("Tài khoản đã bị khóa");
                }
                user.setLastLoginAt(LocalDateTime.now());
                if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
                    user.setAvatarUrl(request.getAvatarUrl());
                }
                if (request.getGoogleId() != null && !request.getGoogleId().isBlank()) {
                    user.setGoogleId(request.getGoogleId());
                }
                userRepository.save(user);

                String token = jwtTokenProvider.generateToken(user.getEmail());
                String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

                GoogleAuthResponseDto response = new GoogleAuthResponseDto();
                response.setStage("login");
                response.setMessage("Đăng nhập thành công bằng Google");
                response.setToken(token);
                response.setRefreshToken(refreshToken);
                response.setUser(convertToDto(user));
                return response;
            }

            // Case B: Email đã tồn tại nhưng chưa có mật khẩu -> Chuyển đến trang complete profile
            if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()
                    && (user.getAvatarUrl() == null || user.getAvatarUrl().isBlank())) {
                user.setAvatarUrl(request.getAvatarUrl());
            }
            if (request.getGoogleId() != null && !request.getGoogleId().isBlank()
                    && (user.getGoogleId() == null || user.getGoogleId().isBlank())) {
                user.setGoogleId(request.getGoogleId());
            }
            userRepository.save(user);

            GoogleAuthResponseDto response = new GoogleAuthResponseDto();
            response.setStage("complete_profile");
            response.setMessage("Vui lòng hoàn thiện thông tin tài khoản");
            response.setEmail(user.getEmail());
            response.setFullName(user.getFullName());
            response.setAvatarUrl(user.getAvatarUrl() != null ? user.getAvatarUrl() : request.getAvatarUrl());
            return response;
        }

        // Case C: Email chưa tồn tại -> Tạo user PENDING, chuyển đến trang complete profile để nhập thêm thông tin
        User newUser = new User();
        newUser.setEmail(email);
        newUser.setFullName(request.getFullName());
        newUser.setAvatarUrl(request.getAvatarUrl());
        newUser.setGoogleId(request.getGoogleId());
        newUser.setAuthSource(AuthSource.GOOGLE);
        newUser.setRole(UserRole.USER);
        newUser.setStatus(UserStatus.PENDING);
        newUser.setEnabled(false);
        newUser.setPasswordHash("");
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setUpdatedAt(LocalDateTime.now());

        userRepository.save(newUser);

        GoogleAuthResponseDto response = new GoogleAuthResponseDto();
        response.setStage("complete_profile");
        response.setMessage("Vui lòng hoàn thiện thông tin tài khoản");
        response.setEmail(email);
        response.setFullName(request.getFullName());
        response.setAvatarUrl(newUser.getAvatarUrl());
        return response;
    }

    @Transactional
    public GoogleAuthResponseDto completeGoogleProfile(CompleteGoogleRegisterRequestDto request) {
        String email = request.getEmail().toLowerCase();
        log.info("Completing Google profile for email: {}", email);

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new InvalidCredentialsException("Mật khẩu xác nhận không khớp");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceAlreadyExistsException("Không tìm thấy người dùng: " + email));

        if (user.getPasswordHash() != null && !user.getPasswordHash().isBlank()) {
            throw new InvalidCredentialsException("Tài khoản này đã có mật khẩu, vui lòng đăng nhập bình thường");
        }

        if (userRepository.existsByPhone(request.getPhone())) {
            throw new ResourceAlreadyExistsException("Số điện thoại đã được sử dụng: " + request.getPhone());
        }

        user.setPhone(request.getPhone());
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getGoogleId() != null && !request.getGoogleId().isBlank()) {
            user.setGoogleId(request.getGoogleId());
        }
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus(UserStatus.PENDING);
        user.setEnabled(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        String otp = otpService.generateOtp(email);
        emailService.sendOtpEmail(email, otp);

        GoogleAuthResponseDto response = new GoogleAuthResponseDto();
        response.setStage("verify_otp");
        response.setMessage("Mã xác thực đã được gửi đến email của bạn");
        response.setEmail(email);
        response.setFullName(user.getFullName());
        response.setAvatarUrl(user.getAvatarUrl());
        return response;
    }

    private UserResponseDto convertToDto(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .avatarUrl(user.getAvatarUrl())
                .province(user.getProvince())
                .district(user.getDistrict())
                .ward(user.getWard())
                .detailAddress(user.getDetailAddress())
                .enabled(user.isEnabled())
                .authSource(AuthSource.GOOGLE.name())
                .build();
    }
}
