package com.catus.backend.util;

import com.catus.backend.exception.ErrorCode;
import com.catus.backend.exception.UnauthorizedException;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT Token Provider utility class for generating and validating JWT tokens.
 * Handles both access tokens and refresh tokens with different expiration times.
 */
@Component
@Slf4j
public class JwtTokenProvider {

    private SecretKey secretKey;
    private final String secret;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration}") long accessTokenExpiration,
            @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration) {
        this.secret = secret;
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    @PostConstruct
    public void init() {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                "JWT secret must be at least 256 bits (32 bytes). Current: " +
                (secret != null ? secret.getBytes(StandardCharsets.UTF_8).length : 0) + " bytes"
            );
        }
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        log.info("JWT TokenProvider initialized with secret length: {} bytes, access token expiration: {}ms, refresh token expiration: {}ms",
            secret.getBytes(StandardCharsets.UTF_8).length, accessTokenExpiration, refreshTokenExpiration);
    }

    /**
     * Generate JWT access token
     * @param userId User ID
     * @param email User email
     * @param kakaoId Kakao OAuth ID
     * @return JWT access token
     */
    public String generateAccessToken(Long userId, String email, String kakaoId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpiration);

        Map<String, Object> claims = new HashMap<>();
        claims.put("email", email);
        claims.put("kakaoId", kakaoId);

        return Jwts.builder()
                .subject(userId.toString())
                .claims(claims)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Generate JWT refresh token
     * @param userId User ID
     * @return JWT refresh token
     */
    public String generateRefreshToken(Long userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshTokenExpiration);

        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Extract user ID from JWT token
     * @param token JWT token
     * @return User ID
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = parseClaims(token);
        return Long.parseLong(claims.getSubject());
    }

    /**
     * Extract email from JWT token
     * @param token JWT token
     * @return User email
     */
    public String getEmailFromToken(String token) {
        Claims claims = parseClaims(token);
        return claims.get("email", String.class);
    }

    /**
     * Extract Kakao ID from JWT token
     * @param token JWT token
     * @return Kakao OAuth ID
     */
    public String getKakaoIdFromToken(String token) {
        Claims claims = parseClaims(token);
        return claims.get("kakaoId", String.class);
    }

    /**
     * Validate JWT token
     * @param token JWT token
     * @return true if token is valid
     */
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (SignatureException e) {
            log.error("Invalid JWT signature: {}", e.getMessage());
            throw new UnauthorizedException(ErrorCode.INVALID_TOKEN, "Invalid token signature");
        } catch (MalformedJwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
            throw new UnauthorizedException(ErrorCode.INVALID_TOKEN, "Malformed token");
        } catch (ExpiredJwtException e) {
            log.error("Expired JWT token: {}", e.getMessage());
            throw new UnauthorizedException(ErrorCode.EXPIRED_TOKEN, "Token has expired");
        } catch (UnsupportedJwtException e) {
            log.error("Unsupported JWT token: {}", e.getMessage());
            throw new UnauthorizedException(ErrorCode.INVALID_TOKEN, "Unsupported token");
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
            throw new UnauthorizedException(ErrorCode.INVALID_TOKEN, "Token claims are empty");
        }
    }

    /**
     * Parse JWT token and extract claims
     * @param token JWT token
     * @return Claims
     */
    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Get access token expiration time in milliseconds
     * @return Expiration time
     */
    public long getAccessTokenExpiration() {
        return accessTokenExpiration;
    }

    /**
     * Get refresh token expiration time in milliseconds
     * @return Expiration time
     */
    public long getRefreshTokenExpiration() {
        return refreshTokenExpiration;
    }
}
