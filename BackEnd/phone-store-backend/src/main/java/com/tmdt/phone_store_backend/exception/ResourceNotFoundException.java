package com.tmdt.phone_store_backend.exception;

/**
 * Exception cho trường hợp tài nguyên không tìm thấy
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
    
    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
