package com.catus.backend.service;

import com.catus.backend.exception.BusinessException;
import com.catus.backend.exception.ErrorCode;
import com.catus.backend.model.ChatMessage;
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
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for interacting with Google Gemini AI API.
 * Handles AI response generation and emotion detection.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiService {

    @Qualifier("geminiWebClient")
    private final WebClient geminiWebClient;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.max-retries:3}")
    private int maxRetries;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Dali's character persona for consistent AI responses
    private static final String DALI_PERSONA = """
        당신은 '달리(Dali)'라는 이름의 따뜻하고 공감 능력이 뛰어난 고양이 동반자입니다.
        사용자의 감정을 세심하게 읽고, 위로와 격려를 제공합니다.
        항상 친근하고 다정한 톤으로 대화하며, 적절한 이모지를 사용합니다.
        사용자가 힘들어할 때는 공감하고, 기쁠 때는 함께 기뻐하며, 불안할 때는 안정감을 줍니다.
        답변은 2-3문장으로 간결하게 하되, 진심이 담긴 따뜻한 메시지를 전달합니다.
        """;

    // Keywords for emotion detection
    private static final Map<EmotionType, Set<String>> EMOTION_KEYWORDS = Map.of(
        EmotionType.HAPPY, Set.of("기쁘", "행복", "좋아", "신나", "즐거", "웃", "사랑", "감사", "최고", "완벽"),
        EmotionType.SAD, Set.of("슬프", "우울", "힘들", "외로", "속상", "눈물", "그립", "허전", "아프", "괴로"),
        EmotionType.ANGRY, Set.of("화나", "짜증", "분노", "열받", "빡치", "싫어", "미워", "억울", "답답"),
        EmotionType.ANXIOUS, Set.of("불안", "걱정", "두려", "무서", "긴장", "조마조마", "떨리", "망설", "고민", "스트레스")
    );

    /**
     * Generate AI response using Gemini API with conversation context.
     *
     * @param userMessage     the user's message
     * @param recentMessages  list of recent messages for context (up to 10)
     * @return AI-generated response text
     * @throws BusinessException if API call fails
     */
    public String generateResponse(String userMessage, List<ChatMessage> recentMessages) {
        try {
            log.debug("Generating AI response for message: {}", userMessage);

            // Build conversation context
            String conversationContext = buildConversationContext(recentMessages);

            // Build the full prompt
            String fullPrompt = buildPrompt(conversationContext, userMessage);

            // Create request body
            Map<String, Object> requestBody = createRequestBody(fullPrompt);

            // Call Gemini API with retry logic
            String response = geminiWebClient.post()
                .uri(uriBuilder -> uriBuilder
                    .queryParam("key", apiKey)
                    .build())
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .retryWhen(Retry.backoff(maxRetries, Duration.ofSeconds(1))
                    .filter(throwable -> throwable instanceof WebClientResponseException.TooManyRequests))
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Gemini API error: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.error(new BusinessException(ErrorCode.GEMINI_API_ERROR));
                })
                .block();

            // Parse and extract AI response
            return extractAiResponse(response);

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error while generating AI response", e);
            return getFallbackResponse();
        }
    }

    /**
     * Detect emotion from user message using keyword matching.
     *
     * @param userMessage the user's message
     * @return detected emotion type
     */
    public EmotionType detectEmotion(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return EmotionType.NORMAL;
        }

        String message = userMessage.toLowerCase();
        Map<EmotionType, Integer> emotionScores = new HashMap<>();

        // Calculate scores for each emotion
        for (Map.Entry<EmotionType, Set<String>> entry : EMOTION_KEYWORDS.entrySet()) {
            int score = 0;
            for (String keyword : entry.getValue()) {
                if (message.contains(keyword)) {
                    score++;
                }
            }
            if (score > 0) {
                emotionScores.put(entry.getKey(), score);
            }
        }

        // Return emotion with highest score, or NORMAL if no match
        return emotionScores.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(EmotionType.NORMAL);
    }

    /**
     * Build conversation context from recent messages
     */
    private String buildConversationContext(List<ChatMessage> recentMessages) {
        if (recentMessages == null || recentMessages.isEmpty()) {
            return "";
        }

        // Reverse to chronological order and format
        return recentMessages.stream()
            .sorted(Comparator.comparing(ChatMessage::getCreatedAt))
            .map(msg -> String.format("사용자: %s\n달리: %s", msg.getUserMessage(), msg.getAiResponse()))
            .collect(Collectors.joining("\n\n"));
    }

    /**
     * Build the complete prompt for Gemini API
     */
    private String buildPrompt(String conversationContext, String userMessage) {
        StringBuilder prompt = new StringBuilder();
        prompt.append(DALI_PERSONA).append("\n\n");

        if (!conversationContext.isEmpty()) {
            prompt.append("최근 대화 내용:\n").append(conversationContext).append("\n\n");
        }

        prompt.append("사용자: ").append(userMessage).append("\n");
        prompt.append("달리:");

        return prompt.toString();
    }

    /**
     * Create request body for Gemini API
     */
    private Map<String, Object> createRequestBody(String prompt) {
        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> generationConfig = Map.of(
            "temperature", 0.7,
            "maxOutputTokens", 500,
            "topP", 0.9,
            "topK", 40
        );

        return Map.of(
            "contents", List.of(content),
            "generationConfig", generationConfig
        );
    }

    /**
     * Extract AI response text from Gemini API response
     */
    private String extractAiResponse(String jsonResponse) {
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode candidates = root.path("candidates");

            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode firstCandidate = candidates.get(0);
                JsonNode content = firstCandidate.path("content");
                JsonNode parts = content.path("parts");

                if (parts.isArray() && parts.size() > 0) {
                    String text = parts.get(0).path("text").asText();
                    return text.trim();
                }
            }

            log.warn("Could not extract AI response from JSON, using fallback");
            return getFallbackResponse();

        } catch (Exception e) {
            log.error("Error parsing Gemini API response", e);
            return getFallbackResponse();
        }
    }

    /**
     * Generate diary summary from chat messages.
     * Summarizes a day's conversation into 2-3 sentences.
     *
     * @param chatMessages list of chat messages for the day
     * @return AI-generated summary text
     * @throws BusinessException if API call fails or no messages provided
     */
    public String generateDiarySummary(List<ChatMessage> chatMessages) {
        if (chatMessages == null || chatMessages.isEmpty()) {
            throw new BusinessException(ErrorCode.NO_CHAT_MESSAGES_FOR_DIARY,
                "No chat messages available to generate diary summary");
        }

        try {
            log.info("Generating diary summary from {} chat messages", chatMessages.size());

            // Build conversation text
            String conversationText = chatMessages.stream()
                .sorted(Comparator.comparing(ChatMessage::getCreatedAt))
                .map(msg -> String.format("사용자: %s\n달리: %s", msg.getUserMessage(), msg.getAiResponse()))
                .collect(Collectors.joining("\n\n"));

            // Build summary prompt
            String prompt = buildDiarySummaryPrompt(conversationText);

            // Create request body
            Map<String, Object> requestBody = createRequestBody(prompt);

            // Call Gemini API
            String response = geminiWebClient.post()
                .uri(uriBuilder -> uriBuilder
                    .queryParam("key", apiKey)
                    .build())
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .retryWhen(Retry.backoff(maxRetries, Duration.ofSeconds(1))
                    .filter(throwable -> throwable instanceof WebClientResponseException.TooManyRequests))
                .onErrorResume(WebClientResponseException.class, ex -> {
                    log.error("Gemini API error: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
                    return Mono.error(new BusinessException(ErrorCode.GEMINI_API_ERROR));
                })
                .block();

            // Extract summary
            String summary = extractAiResponse(response);
            log.info("Successfully generated diary summary: {}", summary);

            return summary;

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error while generating diary summary", e);
            throw new BusinessException(ErrorCode.DIARY_GENERATION_FAILED,
                "Failed to generate diary summary: " + e.getMessage());
        }
    }

    /**
     * Build prompt for diary summary generation
     */
    private String buildDiarySummaryPrompt(String conversationText) {
        return """
            다음은 사용자가 고양이 동반자 '달리'와 나눈 오늘 하루의 대화입니다.
            이 대화를 바탕으로 오늘 하루를 2-3문장으로 요약해주세요.
            사용자의 감정과 주요 사건, 생각을 포함하되, 따뜻하고 공감적인 톤으로 작성해주세요.

            대화 내용:
            """ + conversationText + "\n\n요약:";
    }

    /**
     * Get fallback response when API fails
     */
    private String getFallbackResponse() {
        return "미안해, 지금은 대답하기 어려워. 잠시 후에 다시 말해줄래? 🐱";
    }
}
