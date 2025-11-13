package com.catus.backend.exception;

/**
 * Exception thrown when user is not found in the database
 */
public class UserNotFoundException extends CatusException {

    public UserNotFoundException() {
        super(ErrorCode.USER_NOT_FOUND);
    }

    public UserNotFoundException(String details) {
        super(ErrorCode.USER_NOT_FOUND, details);
    }

    public UserNotFoundException(Long userId) {
        super(ErrorCode.USER_NOT_FOUND, "User not found with ID: " + userId);
    }
}
