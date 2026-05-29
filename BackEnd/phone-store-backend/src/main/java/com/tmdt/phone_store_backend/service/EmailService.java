package com.tmdt.phone_store_backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@hhshop.com}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Async
    public void sendOtpEmail(String toEmail, String otpCode) {
        log.info("Sending OTP email to: {}", toEmail);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Mã xác thực HHShop - " + otpCode);
            message.setText(buildOtpEmailBody(otpCode));
            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        log.info("Sending password reset email to: {}", toEmail);
        try {
            String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Đặt lại mật khẩu HHShop");
            message.setText(buildPasswordResetEmailBody(resetLink));
            mailSender.send(message);
            log.info("Password reset email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildOtpEmailBody(String otpCode) {
        return """
                Xin chào quý khách,

                Mã xác thực của bạn là: %s

                Mã này có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.

                Nếu bạn không yêu cầu mã xác thực này, vui lòng bỏ qua email.

                Trân trọng,
                HHShop
                """.formatted(otpCode);
    }

    private String buildPasswordResetEmailBody(String resetLink) {
        return """
                Xin chào quý khách,

                Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.

                Vui lòng nhấn vào liên kết bên dưới để tạo mật khẩu mới:
                %s

                Liên kết này sẽ hết hạn sau 15 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

                Trân trọng,
                HHShop
                """.formatted(resetLink);
    }
}
