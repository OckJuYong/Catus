package com.catus.backend.exception;

/**
 * Exception thrown when file validation fails
 */
public class InvalidFileException extends CatusException {

    public InvalidFileException(ErrorCode errorCode) {
        super(errorCode);
    }

    public InvalidFileException(ErrorCode errorCode, String details) {
        super(errorCode, details);
    }

    public static InvalidFileException invalidType(String fileName) {
        return new InvalidFileException(ErrorCode.INVALID_FILE_TYPE,
            "File type not allowed: " + fileName);
    }

    public static InvalidFileException tooLarge(long size, long maxSize) {
        return new InvalidFileException(ErrorCode.FILE_TOO_LARGE,
            String.format("File size %d bytes exceeds maximum %d bytes", size, maxSize));
    }

    public static InvalidFileException invalidFormat(String details) {
        return new InvalidFileException(ErrorCode.INVALID_IMAGE_FORMAT, details);
    }
}
