package com.catus.backend.exception;

/**
 * Business logic exception.
 * Extends CatusException to provide specific business rule violation handling.
 */
public class BusinessException extends CatusException {

    public BusinessException(ErrorCode errorCode) {
        super(errorCode);
    }

    public BusinessException(ErrorCode errorCode, String details) {
        super(errorCode, details);
    }

    public BusinessException(ErrorCode errorCode, String details, Throwable cause) {
        super(errorCode, details, cause);
    }
}
