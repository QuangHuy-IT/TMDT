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
            // Case A: Email da ton tai va co mat khau -> Dang nhap ngay
            if (user.getPasswordHash() != null && !user.getPasswordHash().isBlank()) {
                if (user.getStatus() == UserStatus.BLOCKED) {
                    throw new InvalidCredentialsException("Tai khoan da bi khoa");
                }
                user.setLastLoginAt(LocalDateTime.now());
                user.setAvatarUrl(request.getAvatarUrl());
                userRepository.save(user);

                String token = jwtTokenProvider.generateToken(user.getEmail());
                String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

                GoogleAuthResponseDto response = new GoogleAuthResponseDto();
                response.setStage("login");
                response.setMessage("Dang nhap thanh cong bang Google");
                response.setToken(token);
                response.setRefreshToken(refreshToken);
                response.setUser(convertToDto(user));
                return response;
            }

            // Case B: Email da ton tai nhung chua co mat khau -> Chuyen den trang complete profile
            GoogleAuthResponseDto response = new GoogleAuthResponseDto();
            response.setStage("complete_profile");
            response.setMessage("Vui long hoan thien thong tin tai khoan");
            response.setEmail(user.getEmail());
            response.setFullName(user.getFullName());
            response.setAvatarUrl(user.getAvatarUrl());
            return response;
        }

        // Case C: Email chua ton tai -> Tao user PENDING, chuyen den trang complete profile de nhap them thong tin
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
        response.setMessage("Vui long hoan thien thong tin tai khoan");
        response.setEmail(email);
        response.setFullName(request.getFullName());
        response.setAvatarUrl(request.getAvatarUrl());
        return response;
    }

    @Transactional
    public GoogleAuthResponseDto completeGoogleProfile(CompleteGoogleRegisterRequestDto request) {
        String email = request.getEmail().toLowerCase();
        log.info("Completing Google profile for email: {}", email);

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new InvalidCredentialsException("Mat khau xac nhan khong khop");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceAlreadyExistsException("Khong tim thay nguoi dung: " + email));

        if (user.getPasswordHash() != null && !user.getPasswordHash().isBlank()) {
            throw new InvalidCredentialsException("Tai khoan nay da co mat khau, vui long dang nhap binh thuong");
        }

        if (userRepository.existsByPhone(request.getPhone())) {
            throw new ResourceAlreadyExistsException("So dien thoai da duoc su dung: " + request.getPhone());
        }

        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus(UserStatus.PENDING);
        user.setEnabled(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        String otp = otpService.generateOtp(email);
        emailService.sendOtpEmail(email, otp);

        GoogleAuthResponseDto response = new GoogleAuthResponseDto();
        response.setStage("verify_otp");
        response.setMessage("Ma xac thuc da duoc gui den email cua ban");
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
