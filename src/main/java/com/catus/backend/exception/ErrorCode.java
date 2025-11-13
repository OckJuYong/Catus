package com.catus.backend.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * Enumeration of all application error codes with corresponding HTTP status and message
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Authentication & Authorization (401, 403)
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH001", "Invalid or expired token"),
    MISSING_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH002", "Authentication token is missing"),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH003", "Token has expired"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "AUTH004", "Unauthorized access"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "AUTH005", "Access forbidden"),
    INVALID_KAKAO_CODE(HttpStatus.UNAUTHORIZED, "AUTH006", "Invalid Kakao authorization code"),
    KAKAO_API_ERROR(HttpStatus.SERVICE_UNAVAILABLE, "AUTH007", "Kakao API communication error"),

    // User Related (404, 409)
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER001", "User not found"),
    USER_ALREADY_EXISTS(HttpStatus.CONFLICT, "USER002", "User already exists"),
    PROFILE_NOT_FOUND(HttpStatus.NOT_FOUND, "USER003", "User profile not found"),
    INACTIVE_USER(HttpStatus.FORBIDDEN, "USER004", "User account is inactive"),

    // Validation (400)
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "VAL001", "Invalid input parameters"),
    INVALID_FILE_TYPE(HttpStatus.BAD_REQUEST, "VAL002", "Invalid file type"),
    FILE_TOO_LARGE(HttpStatus.BAD_REQUEST, "VAL003", "File size exceeds maximum limit"),
    INVALID_IMAGE_FORMAT(HttpStatus.BAD_REQUEST, "VAL004", "Invalid image format"),
    INVALID_MESSAGE(HttpStatus.BAD_REQUEST, "VAL005", "Invalid message content or format"),

    // Chat Related (404, 500)
    CHAT_MESSAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "CHAT001", "Chat message not found"),
    GEMINI_API_ERROR(HttpStatus.SERVICE_UNAVAILABLE, "CHAT002", "Gemini API communication error"),
    MESSAGE_TOO_LONG(HttpStatus.BAD_REQUEST, "CHAT003", "Message exceeds maximum length"),

    // Diary Related (404, 409, 500)
    DIARY_NOT_FOUND(HttpStatus.NOT_FOUND, "DIARY001", "Diary not found"),
    DIARY_ALREADY_EXISTS(HttpStatus.CONFLICT, "DIARY002", "Diary already exists for this date"),
    NO_CHAT_MESSAGES_FOR_DIARY(HttpStatus.BAD_REQUEST, "DIARY003", "No chat messages available for diary generation"),
    DALLE_API_ERROR(HttpStatus.SERVICE_UNAVAILABLE, "DIARY004", "DALL-E API communication error"),
    DIARY_GENERATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "DIARY005", "Failed to generate diary"),
    DIARY_UNAUTHORIZED(HttpStatus.FORBIDDEN, "DIARY006", "Not authorized to access this diary"),
    DIARY_NOT_PUBLIC(HttpStatus.FORBIDDEN, "DIARY007", "공개된 일기에만 응원 메시지를 보낼 수 있습니다"),

    // Support Message Related (400, 403, 429)
    SUPPORT_MESSAGE_LIMIT_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS, "SUPPORT001", "하루 최대 3개의 응원 메시지만 보낼 수 있습니다"),
    INAPPROPRIATE_CONTENT(HttpStatus.BAD_REQUEST, "SUPPORT002", "부적절한 내용이 포함되어 있습니다"),
    CANNOT_SUPPORT_OWN_DIARY(HttpStatus.BAD_REQUEST, "SUPPORT003", "자신의 일기에는 응원 메시지를 보낼 수 없습니다"),
    INVALID_CONTENT_LENGTH(HttpStatus.BAD_REQUEST, "SUPPORT004", "메시지는 1-500자 사이여야 합니다"),
    SUPPORT_MESSAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "SUPPORT005", "Support message not found"),

    // Notification Related (400, 404, 500)
    FCM_TOKEN_INVALID(HttpStatus.BAD_REQUEST, "NOTIF001", "유효하지 않은 FCM 토큰입니다"),
    FCM_SEND_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "NOTIF002", "푸시 알림 전송에 실패했습니다"),
    NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "NOTIF003", "알림을 찾을 수 없습니다"),

    // Server Errors (500)
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "SYS001", "Internal server error"),
    DATABASE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "SYS002", "Database operation failed"),
    EXTERNAL_API_ERROR(HttpStatus.SERVICE_UNAVAILABLE, "SYS003", "External API communication error"),
    S3_UPLOAD_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "SYS004", "Failed to upload file to S3"),
    REDIS_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "SYS005", "Redis operation failed"),

    // Resource Not Found (404)
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "RES001", "Requested resource not found");

    private final HttpStatus status;
    private final String code;
    private final String message;

    /**
     * Get HTTP status code as integer
     */
    public int getStatusCode() {
        return status.value();
    }
}
