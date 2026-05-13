package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.domain.enums.UserStatus;
import com.tmdt.phone_store_backend.dto.AuthResponseDto;
import com.tmdt.phone_store_backend.dto.CompleteGoogleRegisterRequestDto;
import com.tmdt.phone_store_backend.dto.GoogleAuthRequestDto;
import com.tmdt.phone_store_backend.dto.GoogleAuthResponseDto;
import com.tmdt.phone_store_backend.dto.LoginRequestDto;
import com.tmdt.phone_store_backend.dto.OtpRequestDto;
import com.tmdt.phone_store_backend.dto.OtpVerifyDto;
import com.tmdt.phone_store_backend.dto.RegisterRequestDto;
import com.tmdt.phone_store_backend.dto.UserResponseDto;
import com.tmdt.phone_store_backend.repository.UserRepository;
import com.tmdt.phone_store_backend.security.JwtTokenProvider;
import com.tmdt.phone_store_backend.service.EmailService;
import com.tmdt.phone_store_backend.service.GoogleAuthService;
import com.tmdt.phone_store_backend.service.OtpService;
import com.tmdt.phone_store_backend.service.UserService;
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
@RequestMapping("/api/auth")
@AllArgsConstructor
public class AuthController {

    private final UserService userService;
    private final GoogleAuthService googleAuthService;
    private final OtpService otpService;
    private final EmailService emailService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequestDto requestDto) {
        log.info("Register request for email: {}", requestDto.getEmail());

        try {
            UserResponseDto userDto = userService.register(requestDto);

            User savedUser = userService.getUserByEmail(userDto.getEmail());

            // Gửi OTP xác thực email
            String otp = otpService.generateOtp(savedUser.getEmail());
            emailService.sendOtpEmail(savedUser.getEmail(), otp);

            // Trả về response để frontend chuyển hướng đến trang xác thực OTP
            GoogleAuthResponseDto response = new GoogleAuthResponseDto();
            response.setStage("verify_otp");
            response.setMessage("Mã xác thực đã được gửi đến email của bạn. Vui lòng nhập mã để kích hoạt tài khoản.");
            response.setEmail(savedUser.getEmail());
            response.setFullName(savedUser.getFullName());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Registration failed: {}", e.getMessage());
            throw e;
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDto requestDto) {
        log.info("Login request for email: {}", requestDto.getEmail());

        try {
            User user = userService.login(requestDto);
            UserResponseDto userDto = userService.convertToDto(user);

            String token = jwtTokenProvider.generateToken(user.getEmail());
            String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

            AuthResponseDto response = new AuthResponseDto(token, refreshToken, userDto);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Login failed: {}", e.getMessage());
            throw e;
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleAuth(@RequestBody GoogleAuthRequestDto request) {
        log.info("Google auth request for email: {}", request.getEmail());

        GoogleAuthResponseDto response = googleAuthService.handleGoogleAuth(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google/complete-profile")
    public ResponseEntity<?> completeGoogleProfile(
            @Valid @RequestBody CompleteGoogleRegisterRequestDto request) {
        log.info("Complete Google profile for email: {}", request.getEmail());

        GoogleAuthResponseDto response = googleAuthService.completeGoogleProfile(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/otp/send")
    public ResponseEntity<?> sendOtp(@Valid @RequestBody OtpRequestDto request) {
        log.info("Send OTP request for email: {}", request.getEmail());
        String email = request.getEmail().toLowerCase();

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Email không tồn tại");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        String otp = otpService.generateOtp(email);
        emailService.sendOtpEmail(email, otp);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Mã xác thực đã được gửi đến email của bạn");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody OtpVerifyDto request) {
        log.info("Verify OTP request for email: {}", request.getEmail());
        String email = request.getEmail().toLowerCase();

        boolean valid = otpService.verifyOtp(email, request.getOtpCode());
        if (!valid) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Mã xác thực không hợp lệ hoặc đã hết hạn");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        user.setStatus(UserStatus.ACTIVE);
        user.setEnabled(true);
        user.setUpdatedAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());
        UserResponseDto userDto = userService.convertToDto(user);

        AuthResponseDto response = new AuthResponseDto(token, refreshToken, userDto);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = authentication.getName();
        log.info("Get current user info for email: {}", email);

        try {
            User user = userService.getUserByEmail(email);
            UserResponseDto response = userService.convertToDto(user);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get current user: {}", e.getMessage());
            throw e;
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");

        log.info("Refresh token request");

        try {
            String newAccessToken = userService.refreshAccessToken(refreshToken);

            Map<String, String> response = new HashMap<>();
            response.put("token", newAccessToken);
            response.put("type", "Bearer");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Token refresh failed: {}", e.getMessage());
            throw e;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        log.info("Logout request");
        SecurityContextHolder.clearContext();
        Map<String, String> response = new HashMap<>();
        response.put("message", "Đăng xuất thành công");
        return ResponseEntity.ok(response);
    }
}
