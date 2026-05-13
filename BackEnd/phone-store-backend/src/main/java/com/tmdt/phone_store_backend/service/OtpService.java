package com.tmdt.phone_store_backend.service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class OtpService {

    private static final int OTP_LENGTH = 6;
    private static final long OTP_VALIDITY_MS = 5 * 60 * 1000; // 5 phut

    private final SecureRandom random = new SecureRandom();
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    public String generateOtp(String email) {
        String otp = String.format("%0" + OTP_LENGTH + "d", random.nextInt((int) Math.pow(10, OTP_LENGTH)));
        long expiresAt = System.currentTimeMillis() + OTP_VALIDITY_MS;
        otpStore.put(email.toLowerCase(), new OtpEntry(otp, expiresAt));
        log.info("Generated OTP for email: {} (expires in {} ms)", email, OTP_VALIDITY_MS);
        return otp;
    }

    public boolean verifyOtp(String email, String otpCode) {
        String normalizedEmail = email.toLowerCase();
        OtpEntry entry = otpStore.get(normalizedEmail);

        if (entry == null) {
            log.warn("No OTP found for email: {}", email);
            return false;
        }

        if (System.currentTimeMillis() > entry.expiresAt) {
            log.warn("OTP expired for email: {}", email);
            otpStore.remove(normalizedEmail);
            return false;
        }

        boolean valid = entry.otp.equals(otpCode);
        if (valid) {
            otpStore.remove(normalizedEmail);
            log.info("OTP verified successfully for email: {}", email);
        } else {
            log.warn("Invalid OTP for email: {}", email);
        }
        return valid;
    }

    public void clearOtp(String email) {
        otpStore.remove(email.toLowerCase());
    }

    private record OtpEntry(String otp, long expiresAt) {}
}
