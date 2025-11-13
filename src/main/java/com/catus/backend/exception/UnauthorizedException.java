package com.catus.backend.exception;

/**
 * Exception thrown when authentication fails or token is invalid
 */
public class UnauthorizedException extends CatusException {

    public UnauthorizedException() {
        super(ErrorCode.UNAUTHORIZED);
    }

    public UnauthorizedException(String details) {
        super(ErrorCode.UNAUTHORIZED, details);
    }

    public UnauthorizedException(ErrorCode errorCode) {
        super(errorCode);
    }

    public UnauthorizedException(ErrorCode errorCode, String details) {
        super(errorCode, details);
    }
}
