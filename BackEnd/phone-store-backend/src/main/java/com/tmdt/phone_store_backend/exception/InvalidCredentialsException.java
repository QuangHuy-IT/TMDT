package com.tmdt.phone_store_backend.exception;

/**
 * Exception cho lỗi thông tin đăng nhập không đúng
 */
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String message) {
        super(message);
    }
    
    public InvalidCredentialsException(String message, Throwable cause) {
        super(message, cause);
    }
}
