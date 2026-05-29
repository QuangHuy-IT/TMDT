package com.tmdt.phone_store_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import javax.crypto.SecretKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Component để tạo và validate JWT Token
 */
@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    /**
     * Tạo JWT Token từ email người dùng
     */
    public String generateToken(String email) {
        return createToken(email, jwtExpirationMs);
    }

    /**
     * Tạo token cho luồng đặt lại mật khẩu.
     * Token này có claim riêng để không dùng lẫn với access token.
     */
    public String generatePasswordResetToken(String email) {
        long resetTokenExpirationMs = 15 * 60 * 1000L;
        return createToken(email, resetTokenExpirationMs, "RESET_PASSWORD");
    }

    /**
     * Tạo Refresh Token (có thời hạn lâu hơn)
     */
    public String generateRefreshToken(String email) {
        // Refresh token có thời hạn 7 ngày
        long refreshTokenExpiration = jwtExpirationMs * 7; // 7 days
        return createToken(email, refreshTokenExpiration);
    }

    /**
     * Tạo token từ email
     */
    private String createToken(String email, long expirationMs) {
        return createToken(email, expirationMs, null);
    }

    private String createToken(String email, long expirationMs, String tokenType) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        SecretKey key = getSigningKey();

        var builder = Jwts.builder()
                .setSubject(email)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(key, SignatureAlgorithm.HS512);

        if (tokenType != null) {
            builder.claim("tokenType", tokenType);
        }

        return builder.compact();
    }

    /**
     * Lấy email từ JWT Token
     */
    public String getEmailFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);
        return claims.getSubject();
    }

    /**
     * Kiểm tra token có hợp lệ không
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (SecurityException ex) {
            log.error("Invalid JWT signature: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            log.error("Expired JWT token: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty: {}", ex.getMessage());
        }
        return false;
    }

    /**
     * Kiểm tra token reset mật khẩu có hợp lệ không.
     */
    public boolean validatePasswordResetToken(String token) {
        try {
            Claims claims = getAllClaimsFromToken(token);
            return "RESET_PASSWORD".equals(claims.get("tokenType", String.class));
        } catch (Exception ex) {
            log.error("Invalid password reset token: {}", ex.getMessage());
            return false;
        }
    }

    /**
     * Kiểm tra token có hết hạn không
     */
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = getAllClaimsFromToken(token);
            return claims.getExpiration().before(new Date());
        } catch (ExpiredJwtException ex) {
            return true;
        }
    }

    /**
     * Lấy tất cả claims từ token
     */
    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Lấy signing key từ JWT secret
     */
    private SecretKey getSigningKey() {
        try {
            byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException(
                    "Invalid JWT secret: expected Base64-encoded key with minimum 64 bytes for HS512.", ex);
        }
    }
}
