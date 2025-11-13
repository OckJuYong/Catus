package com.catus.backend.service;

import com.catus.backend.exception.BusinessException;
import com.catus.backend.exception.ErrorCode;
import com.catus.backend.model.EmotionType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.Map;

/**
 * Service for interacting with OpenAI DALL-E 3 API.
 * Generates diary images based on emotion and summary.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DalleService {

    @Qualifier("openaiWebClient")
    private final WebClient openaiWebClient;

    @Value("${openai.api.max-retries:3}")
    private int maxRetries;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Base prompt style for all images
    private static final String BASE_STYLE =
        "A cute, artistic illustration featuring a small adorable cat character in a warm, cozy atmosphere. " +
        "Soft pastel colors, hand-drawn style, gentle lighting, minimalist background. " +
        "The image should evoke feelings of comfort and emotional connection.";

    // Emotion-specific prompt additions
    private static final Map<EmotionType, String> EMOTION_PROMPTS = Map.of(
        EmotionType.HAPPY, "The cat is joyful and playful, with bright cheerful surroundings, " +
                           "sunlight streaming through windows, flowers blooming, vibrant warm colors.",
        EmotionType.SAD, "The cat looks melancholic and gentle, sitting quietly by a rainy window, " +
                         "soft blue and gray tones, a contemplative and soothing mood.",
        EmotionType.ANGRY, "The cat appears intense and bold, with dramatic lighting, " +
                           "strong poses, fiery warm colors like red and orange accents.",
        EmotionType.ANXIOUS, "The cat is seeking comfort, wrapped in a soft blanket or in a safe cozy corner, " +
                             "calming colors like lavender and mint green, peaceful atmosphere.",
        EmotionType.NORMAL, "The cat is content and relaxed, in a comfortable everyday setting, " +
                            "neutral warm tones, balanced peaceful composition."
    );

    /**
     * Generate diary image using DALL-E 3 based on emotion and summary.
     *
     * @param emotion the detected emotion
     * @param summary the diary summary text
     * @return URL of the generated image
     * @throws BusinessException if API call fails
     */
    public String generateDiaryImage(EmotionType emotion, String summary) {
        try {
            log.info("Generating diary image for emotion: {}", emotion);

            // Build the complete prompt
            String prompt = buildImagePrompt(emotion, summary);
            log.debug("DALL-E prompt: {}", prompt);

            // Create request body
            Map<String, Object> requestBody = createDalleRequestBody(prompt);

            // Call DALL-E API with retry logic
            String response = openaiWebClient.post()
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .retryWhen(Retry.backoff(maxRetries, Duration.ofSeconds(2))
                    .filter(throwable -> throwable instanceof WebClientResponseException.TooManyRequests))
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("DALL-E API error: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.error(new BusinessException(ErrorCode.DALLE_API_ERROR,
                        "DALL-E API call failed: " + ex.getMessage()));
                })
                .block();

            // Extract image URL from response
            String imageUrl = extractImageUrl(response);
            log.info("Successfully generated diary image: {}", imageUrl);

            return imageUrl;

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error while generating diary image", e);
            throw new BusinessException(ErrorCode.DALLE_API_ERROR,
                "Failed to generate diary image: " + e.getMessage());
        }
    }

    /**
     * Build the complete image generation prompt.
     */
    private String buildImagePrompt(EmotionType emotion, String summary) {
        String emotionPrompt = EMOTION_PROMPTS.getOrDefault(emotion, EMOTION_PROMPTS.get(EmotionType.NORMAL));

        // Combine base style, emotion-specific details, and summary context
        StringBuilder prompt = new StringBuilder();
        prompt.append(BASE_STYLE).append(" ");
        prompt.append(emotionPrompt).append(" ");

        // Add context from summary (truncated to avoid token limits)
        if (summary != null && !summary.isBlank()) {
            String contextHint = summary.length() > 100 ? summary.substring(0, 100) : summary;
            prompt.append("The scene reflects: ").append(contextHint);
        }

        return prompt.toString();
    }

    /**
     * Create request body for DALL-E 3 API.
     */
    private Map<String, Object> createDalleRequestBody(String prompt) {
        return Map.of(
            "model", "dall-e-3",
            "prompt", prompt,
            "n", 1,
            "size", "1024x1024",
            "quality", "standard",
            "style", "vivid"
        );
    }

    /**
     * Extract image URL from DALL-E API response.
     */
    private String extractImageUrl(String jsonResponse) {
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode data = root.path("data");

            if (data.isArray() && data.size() > 0) {
                JsonNode firstImage = data.get(0);
                String url = firstImage.path("url").asText();

                if (url != null && !url.isBlank()) {
                    return url;
                }
            }

            log.error("Could not extract image URL from DALL-E response: {}", jsonResponse);
            throw new BusinessException(ErrorCode.DALLE_API_ERROR,
                "Invalid response format from DALL-E API");

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error parsing DALL-E API response", e);
            throw new BusinessException(ErrorCode.DALLE_API_ERROR,
                "Failed to parse DALL-E response: " + e.getMessage());
        }
    }
}
