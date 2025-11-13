package com.catus.backend.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * WebClient configuration for external API calls (Gemini, OpenAI, etc.)
 * Configures connection pooling, timeouts, and retry logic.
 */
@Configuration
public class WebClientConfig {

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.timeout:10000}")
    private int geminiTimeout;

    @Value("${openai.api.url}")
    private String openaiApiUrl;

    @Value("${openai.api.key}")
    private String openaiApiKey;

    @Value("${openai.api.timeout:60000}")
    private int openaiTimeout;

    /**
     * WebClient bean for Google Gemini API calls
     */
    @Bean(name = "geminiWebClient")
    public WebClient geminiWebClient() {
        HttpClient httpClient = HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, geminiTimeout)
            .responseTimeout(Duration.ofMillis(geminiTimeout))
            .doOnConnected(conn ->
                conn.addHandlerLast(new ReadTimeoutHandler(geminiTimeout, TimeUnit.MILLISECONDS))
                    .addHandlerLast(new WriteTimeoutHandler(geminiTimeout, TimeUnit.MILLISECONDS))
            );

        return WebClient.builder()
            .baseUrl(geminiApiUrl)
            .defaultHeader("Content-Type", "application/json")
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();
    }

    /**
     * WebClient bean for OpenAI DALL-E API calls
     */
    @Bean(name = "openaiWebClient")
    public WebClient openaiWebClient() {
        HttpClient httpClient = HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, openaiTimeout)
            .responseTimeout(Duration.ofMillis(openaiTimeout))
            .doOnConnected(conn ->
                conn.addHandlerLast(new ReadTimeoutHandler(openaiTimeout, TimeUnit.MILLISECONDS))
                    .addHandlerLast(new WriteTimeoutHandler(openaiTimeout, TimeUnit.MILLISECONDS))
            );

        return WebClient.builder()
            .baseUrl(openaiApiUrl)
            .defaultHeader("Content-Type", "application/json")
            .defaultHeader("Authorization", "Bearer " + openaiApiKey)
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();
    }

    /**
     * Generic WebClient for other external API calls
     */
    @Bean(name = "genericWebClient")
    public WebClient genericWebClient() {
        HttpClient httpClient = HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000)
            .responseTimeout(Duration.ofMillis(5000))
            .doOnConnected(conn ->
                conn.addHandlerLast(new ReadTimeoutHandler(5000, TimeUnit.MILLISECONDS))
                    .addHandlerLast(new WriteTimeoutHandler(5000, TimeUnit.MILLISECONDS))
            );

        return WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();
    }

    /**
     * Get Gemini API key (used by GeminiService)
     */
    public String getGeminiApiKey() {
        return geminiApiKey;
    }
}
