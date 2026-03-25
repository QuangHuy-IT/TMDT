package com.tmdt.phone_store_backend.exception;

/**
 * Exception cho trường hợp email hoặc số điện thoại đã tồn tại
 */
public class ResourceAlreadyExistsException extends RuntimeException {
    public ResourceAlreadyExistsException(String message) {
        super(message);
    }
    
    public ResourceAlreadyExistsException(String message, Throwable cause) {
        super(message, cause);
    }
}
