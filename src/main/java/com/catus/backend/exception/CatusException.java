package com.catus.backend.exception;

import lombok.Getter;

/**
 * Base exception class for all application-specific exceptions
 */
@Getter
public class CatusException extends RuntimeException {

    private final ErrorCode errorCode;
    private final String details;

    public CatusException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.details = null;
    }

    public CatusException(ErrorCode errorCode, String details) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.details = details;
    }

    public CatusException(ErrorCode errorCode, String details, Throwable cause) {
        super(errorCode.getMessage(), cause);
        this.errorCode = errorCode;
        this.details = details;
    }
}
