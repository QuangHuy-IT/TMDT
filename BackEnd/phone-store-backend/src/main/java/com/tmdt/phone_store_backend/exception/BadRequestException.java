package com.tmdt.phone_store_backend.exception;

/**
 * Exception cho lỗi yêu cầu không hợp lệ (HTTP 400)
 */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }

    public BadRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}
