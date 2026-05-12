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
            message.setSubject("Ma xac thuc HHShop - " + otpCode);
            message.setText(buildOtpEmailBody(otpCode));
            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildOtpEmailBody(String otpCode) {
        return """
                Xin chao quy khach,

                Ma xac thuc cua ban la: %s

                Ma nay co hieu luc trong 5 phut. Vui long khong chia se ma nay voi bat ky ai.

                Neu ban khong yeu cau ma xac thuc nay, vui long bo qua email.

                Trân trọng,
                HHShop
                """.formatted(otpCode);
    }
}
