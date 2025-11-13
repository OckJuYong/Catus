package com.catus.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI 3.0 (Swagger) 설정
 * API 문서 자동 생성 및 한글화
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI catusOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("🐱 Catus Backend API")
                        .description("감정 일기 AI 챗봇 Catus 백엔드 API 문서")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Catus Team")
                                .email("support@catus.app"))
                        .license(new License()
                                .name("Private")
                                .url("https://catus.app")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("로컬 개발 서버"),
                        new Server()
                                .url("https://api.catus.app")
                                .description("운영 서버")))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("JWT 인증 토큰을 입력하세요")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }
}
