package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.dto.ImageUploadResponseDto;
import com.tmdt.phone_store_backend.exception.InvalidCredentialsException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.net.URI;
import java.net.URLDecoder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
public class CloudinaryService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @Value("${CLOUDINARY_URL:}")
    private String cloudinaryUrl;

    public ImageUploadResponseDto uploadImage(MultipartFile file) {
        validateCloudinaryConfig();

        if (file == null || file.isEmpty()) {
            throw new InvalidCredentialsException("File ảnh không hợp lệ");
        }

        try {
            long timestamp = Instant.now().getEpochSecond();
            String signatureBase = "timestamp=" + timestamp + apiSecret;
            String signature = sha1(signatureBase);
            String dataUri = "data:" + file.getContentType() + ";base64,"
                    + Base64.getEncoder().encodeToString(readBytes(file));

            MultiValueMap<String, String> requestBody = new LinkedMultiValueMap<>();
            requestBody.add("file", dataUri);
            requestBody.add("api_key", apiKey);
            requestBody.add("timestamp", String.valueOf(timestamp));
            requestBody.add("signature", signature);

            ResponseEntity<CloudinaryUploadResult> response = restTemplate.postForEntity(
                    "https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload",
                    requestBody,
                    CloudinaryUploadResult.class);
            CloudinaryUploadResult result = response.getBody();

            if (result == null || result.secureUrl == null) {
                throw new InvalidCredentialsException("Upload ảnh thất bại");
            }

            return new ImageUploadResponseDto(result.secureUrl, result.publicId);
        } catch (IOException ex) {
            log.error("Cannot read image bytes", ex);
            throw new InvalidCredentialsException("Không thể đọc file ảnh");
        }
    }

    private byte[] readBytes(MultipartFile file) throws IOException {
        try (InputStream inputStream = file.getInputStream()) {
            return inputStream.readAllBytes();
        }
    }

    private void validateCloudinaryConfig() {
        resolveConfigFromCloudinaryUrl();

        if (cloudName == null || cloudName.isBlank()
                || apiKey == null || apiKey.isBlank()
                || apiSecret == null || apiSecret.isBlank()) {
            throw new InvalidCredentialsException(
                    "Thiếu cấu hình Cloudinary (cloud-name/api-key/api-secret hoặc CLOUDINARY_URL)");
        }
    }

    private void resolveConfigFromCloudinaryUrl() {
        if (!isBlank(cloudName) && !isBlank(apiKey) && !isBlank(apiSecret)) {
            return;
        }

        if (isBlank(cloudinaryUrl)) {
            return;
        }

        try {
            URI uri = URI.create(cloudinaryUrl.trim());
            if (!"cloudinary".equalsIgnoreCase(uri.getScheme())) {
                return;
            }

            String userInfo = uri.getUserInfo();
            String host = uri.getHost();
            if (isBlank(userInfo) || isBlank(host) || !userInfo.contains(":")) {
                return;
            }

            String[] credentials = userInfo.split(":", 2);
            String parsedApiKey = URLDecoder.decode(credentials[0], StandardCharsets.UTF_8);
            String parsedApiSecret = URLDecoder.decode(credentials[1], StandardCharsets.UTF_8);
            String parsedCloudName = URLDecoder.decode(host, StandardCharsets.UTF_8);

            if (isBlank(apiKey)) {
                apiKey = parsedApiKey;
            }
            if (isBlank(apiSecret)) {
                apiSecret = parsedApiSecret;
            }
            if (isBlank(cloudName)) {
                cloudName = parsedCloudName;
            }
        } catch (Exception ex) {
            log.warn("Cannot parse CLOUDINARY_URL", ex);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String sha1(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception ex) {
            throw new InvalidCredentialsException("Không thể tạo chữ ký Cloudinary");
        }
    }

    private static class CloudinaryUploadResult {

        public String secureUrl;
        public String publicId;

        @com.fasterxml.jackson.annotation.JsonProperty("secure_url")
        public void setSecureUrl(String secureUrl) {
            this.secureUrl = secureUrl;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("public_id")
        public void setPublicId(String publicId) {
            this.publicId = publicId;
        }
    }
}
