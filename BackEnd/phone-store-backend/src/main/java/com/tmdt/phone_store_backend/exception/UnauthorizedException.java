package com.tmdt.phone_store_backend.exception;

/**
 * Exception cho lỗi xác thực (authentication)
 */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
    
    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
