package com.catus.backend.service;

import com.catus.backend.exception.ErrorCode;
import com.catus.backend.exception.UnauthorizedException;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/**
 * Service for Kakao OAuth 2.0 integration.
 * Handles token exchange and user info retrieval from Kakao API.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KakaoOAuthService {

    private final WebClient webClient = WebClient.builder().build();

    @Value("${kakao.oauth.client-id}")
    private String clientId;

    @Value("${kakao.oauth.client-secret}")
    private String clientSecret;

    @Value("${kakao.oauth.token-url}")
    private String tokenUrl;

    @Value("${kakao.oauth.user-info-url}")
    private String userInfoUrl;

    /**
     * Exchange authorization code for Kakao access token
     * @param code Authorization code from Kakao
     * @param redirectUri Redirect URI used in OAuth flow
     * @return Kakao access token
     */
    public String getAccessToken(String code, String redirectUri) {
        log.info("Exchanging Kakao authorization code for access token");

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("grant_type", "authorization_code");
        formData.add("client_id", clientId);
        formData.add("client_secret", clientSecret);
        formData.add("code", code);
        formData.add("redirect_uri", redirectUri);

        try {
            JsonNode response = webClient.post()
                    .uri(tokenUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(BodyInserters.fromFormData(formData))
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, clientResponse -> {
                        log.error("Kakao token exchange failed with status: {}", clientResponse.statusCode());
                        return clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    log.error("Kakao API error response: {}", errorBody);
                                    return Mono.error(new UnauthorizedException(
                                            ErrorCode.INVALID_KAKAO_CODE,
                                            "Failed to exchange Kakao authorization code"
                                    ));
                                });
                    })
                    .bodyToMono(JsonNode.class)
                    .block();

            if (response == null || !response.has("access_token")) {
                throw new UnauthorizedException(ErrorCode.KAKAO_API_ERROR, "Access token not found in response");
            }

            String accessToken = response.get("access_token").asText();
            log.info("Successfully obtained Kakao access token");
            return accessToken;

        } catch (UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during Kakao token exchange: {}", e.getMessage(), e);
            throw new UnauthorizedException(ErrorCode.KAKAO_API_ERROR, "Failed to communicate with Kakao API");
        }
    }

    /**
     * Fetch user information from Kakao API
     * @param accessToken Kakao access token
     * @return KakaoUserInfo containing user details
     */
    public KakaoUserInfo getUserInfo(String accessToken) {
        log.info("Fetching user info from Kakao API");

        try {
            JsonNode response = webClient.get()
                    .uri(userInfoUrl)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, clientResponse -> {
                        log.error("Kakao user info request failed with status: {}", clientResponse.statusCode());
                        return clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    log.error("Kakao API error response: {}", errorBody);
                                    return Mono.error(new UnauthorizedException(
                                            ErrorCode.KAKAO_API_ERROR,
                                            "Failed to fetch user info from Kakao"
                                    ));
                                });
                    })
                    .bodyToMono(JsonNode.class)
                    .block();

            if (response == null) {
                throw new UnauthorizedException(ErrorCode.KAKAO_API_ERROR, "Empty response from Kakao API");
            }

            return parseKakaoUserInfo(response);

        } catch (UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error fetching Kakao user info: {}", e.getMessage(), e);
            throw new UnauthorizedException(ErrorCode.KAKAO_API_ERROR, "Failed to communicate with Kakao API");
        }
    }

    /**
     * Parse Kakao API response into KakaoUserInfo object
     */
    private KakaoUserInfo parseKakaoUserInfo(JsonNode response) {
        String kakaoId = response.get("id").asText();
        JsonNode kakaoAccount = response.get("kakao_account");

        String email = kakaoAccount != null && kakaoAccount.has("email")
                ? kakaoAccount.get("email").asText()
                : null;

        String nickname = null;
        String profileImageUrl = null;

        if (kakaoAccount != null && kakaoAccount.has("profile")) {
            JsonNode profile = kakaoAccount.get("profile");
            nickname = profile.has("nickname") ? profile.get("nickname").asText() : null;
            profileImageUrl = profile.has("profile_image_url")
                    ? profile.get("profile_image_url").asText()
                    : null;
        }

        log.info("Parsed Kakao user info - ID: {}, Email: {}, Nickname: {}", kakaoId, email, nickname);

        return KakaoUserInfo.builder()
                .kakaoId(kakaoId)
                .email(email)
                .nickname(nickname)
                .profileImageUrl(profileImageUrl)
                .build();
    }

    /**
     * DTO for Kakao user information
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class KakaoUserInfo {
        private String kakaoId;
        private String email;
        private String nickname;
        private String profileImageUrl;
    }
}
