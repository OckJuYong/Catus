# CATUS 백엔드 API 명세서 (Spring Boot)

> **Version**: 1.0.0
> **Framework**: Spring Boot 3.2+
> **Java Version**: 17+
> **최종 수정**: 2024-11-20
> **Target**: Spring Boot Backend Developers

---

## 📋 목차

1. [개요](#1-개요)
2. [기술 스택](#2-기술-스택)
3. [프로젝트 구조](#3-프로젝트-구조)
4. [Spring Boot 설정](#4-spring-boot-설정)
5. [도메인 모델](#5-도메인-모델)
6. [API 엔드포인트](#6-api-엔드포인트)
7. [보안 설정 (Spring Security)](#7-보안-설정-spring-security)
8. [에러 처리](#8-에러-처리)
9. [테스트](#9-테스트)
10. [배포](#10-배포)

---

## 1. 개요

### 1.1 서비스 설명

**CATUS**는 AI 고양이 "달이"와 대화하며 감정 일기를 작성하는 웹 서비스입니다.

**핵심 기능**:
- 카카오 OAuth 2.0 로그인 (Spring Security)
- AI 채팅 (Google Gemini API)
- 대화 기반 감정 분석 및 일기 자동 생성
- AI 그림일기 생성 (DALL-E/Stable Diffusion)
- 캘린더 기반 일기 관리 (Spring Data JPA)
- 익명 응원 메시지 랜덤 교환
- 월별 감정 통계

---

### 1.2 중요 아키텍처 특징

#### 🚨 채팅 메시지 저장 정책

**프론트엔드**:
- 채팅 메시지를 **IndexedDB(웹) 또는 AsyncStorage(모바일)에 저장**
- 실시간 채팅 내역은 클라이언트에서만 관리

**백엔드 (Spring Boot)**:
- 채팅 메시지를 **저장하지 않음** (개인정보 보호)
- 대화 종료 시 프론트에서 전체 대화 내용을 받아 **분석만 수행**
- 분석 결과(요약, 감정, 그림일기)만 JPA Entity로 저장

---

## 2. 기술 스택

### 2.1 필수 의존성

```xml
<!-- pom.xml -->
<properties>
    <java.version>17</java.version>
    <spring-boot.version>3.2.0</spring-boot.version>
</properties>

<dependencies>
    <!-- Spring Boot Starters -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>

    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId> <!-- For SSE -->
    </dependency>

    <!-- Database -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.3</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>

    <!-- Redis (Optional for caching) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>

    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>

    <!-- AWS S3 (for image storage) -->
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>s3</artifactId>
        <version>2.20.26</version>
    </dependency>

    <!-- Google Gemini API Client -->
    <dependency>
        <groupId>com.google.cloud</groupId>
        <artifactId>google-cloud-aiplatform</artifactId>
        <version>3.30.0</version>
    </dependency>

    <!-- OpenAPI/Swagger (Optional) -->
    <dependency>
        <groupId>org.springdoc</groupId>
        <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
        <version>2.2.0</version>
    </dependency>

    <!-- Test -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.security</groupId>
        <artifactId>spring-security-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

### 2.2 Gradle 설정 (Alternative)

```gradle
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.0'
    id 'io.spring.dependency-management' version '1.1.4'
}

group = 'com.catus'
version = '1.0.0'
sourceCompatibility = '17'

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-webflux'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'

    runtimeOnly 'org.postgresql:postgresql'

    implementation 'io.jsonwebtoken:jjwt-api:0.12.3'
    runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.3'
    runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.3'

    implementation 'software.amazon.awssdk:s3:2.20.26'
    implementation 'com.google.cloud:google-cloud-aiplatform:3.30.0'
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.2.0'

    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'

    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

---

## 3. 프로젝트 구조

```
src/main/java/com/catus/
├── CatusApplication.java
├── config/
│   ├── SecurityConfig.java
│   ├── JwtConfig.java
│   ├── RedisConfig.java
│   ├── S3Config.java
│   └── WebConfig.java
├── domain/
│   ├── user/
│   │   ├── entity/
│   │   │   └── User.java
│   │   ├── repository/
│   │   │   └── UserRepository.java
│   │   ├── service/
│   │   │   └── UserService.java
│   │   ├── controller/
│   │   │   └── UserController.java
│   │   └── dto/
│   │       ├── OnboardingRequest.java
│   │       ├── UserResponse.java
│   │       └── UpdateProfileRequest.java
│   ├── auth/
│   │   ├── service/
│   │   │   ├── AuthService.java
│   │   │   └── KakaoOAuthService.java
│   │   ├── controller/
│   │   │   └── AuthController.java
│   │   ├── dto/
│   │   │   ├── KakaoLoginRequest.java
│   │   │   ├── LoginResponse.java
│   │   │   └── RefreshTokenRequest.java
│   │   └── filter/
│   │       └── JwtAuthenticationFilter.java
│   ├── diary/
│   │   ├── entity/
│   │   │   └── Diary.java
│   │   ├── repository/
│   │   │   └── DiaryRepository.java
│   │   ├── service/
│   │   │   └── DiaryService.java
│   │   ├── controller/
│   │   │   └── DiaryController.java
│   │   └── dto/
│   │       ├── DiaryResponse.java
│   │       └── UpdateDiaryRequest.java
│   ├── chat/
│   │   ├── service/
│   │   │   ├── ChatService.java
│   │   │   ├── GeminiService.java
│   │   │   └── ImageGenerationService.java
│   │   ├── controller/
│   │   │   └── ChatController.java
│   │   └── dto/
│   │       ├── ChatRequest.java
│   │       ├── AnalyzeRequest.java
│   │       ├── AnalyzeResponse.java
│   │       └── ChatMessage.java
│   ├── support/
│   │   ├── entity/
│   │   │   └── SupportMessage.java
│   │   ├── repository/
│   │   │   └── SupportMessageRepository.java
│   │   ├── service/
│   │   │   └── SupportMessageService.java
│   │   ├── controller/
│   │   │   └── SupportMessageController.java
│   │   └── dto/
│   │       ├── SendMessageRequest.java
│   │       └── SupportMessageResponse.java
│   └── statistics/
│       ├── service/
│       │   └── StatisticsService.java
│       ├── controller/
│       │   └── StatisticsController.java
│       └── dto/
│           ├── EmotionStatsResponse.java
│           └── MonthlyStatsResponse.java
├── common/
│   ├── exception/
│   │   ├── GlobalExceptionHandler.java
│   │   ├── BusinessException.java
│   │   └── ErrorCode.java
│   ├── response/
│   │   ├── ApiResponse.java
│   │   └── ErrorResponse.java
│   └── util/
│       ├── JwtUtil.java
│       └── DateUtil.java
└── security/
    ├── JwtTokenProvider.java
    ├── CustomUserDetails.java
    └── CustomUserDetailsService.java

src/main/resources/
├── application.yml
├── application-dev.yml
├── application-prod.yml
└── db/migration/
    └── V1__init.sql
```

---

## 4. Spring Boot 설정

### 4.1 application.yml

```yaml
spring:
  application:
    name: catus-api

  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}

  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:catus}
    username: ${DB_USER:catus_user}
    password: ${DB_PASSWORD:password}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
        default_batch_fetch_size: 100
    open-in-view: false

  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}

  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB

server:
  port: ${PORT:8080}
  servlet:
    context-path: /api/v1
  error:
    include-message: always
    include-stacktrace: never

# JWT 설정
jwt:
  secret: ${JWT_SECRET:your-256-bit-secret-key-change-in-production}
  access-token-expiration: 3600000  # 1 hour
  refresh-token-expiration: 1209600000  # 14 days

# Kakao OAuth
kakao:
  rest-api-key: ${KAKAO_REST_API_KEY}
  redirect-uri: ${KAKAO_REDIRECT_URI}
  token-uri: https://kauth.kakao.com/oauth/token
  user-info-uri: https://kapi.kakao.com/v2/user/me

# Google Gemini
gemini:
  api-key: ${GEMINI_API_KEY}
  model: gemini-pro
  project-id: ${GCP_PROJECT_ID}
  location: us-central1

# DALL-E / Stability AI
image-generation:
  provider: ${IMAGE_PROVIDER:dalle}  # dalle or stability
  dalle:
    api-key: ${DALLE_API_KEY}
    model: dall-e-3
  stability:
    api-key: ${STABILITY_API_KEY}

# AWS S3
aws:
  access-key: ${AWS_ACCESS_KEY_ID}
  secret-key: ${AWS_SECRET_ACCESS_KEY}
  region: ${AWS_REGION:ap-northeast-2}
  s3:
    bucket: ${AWS_S3_BUCKET:catus-diaries}

# CORS
cors:
  allowed-origins: ${ALLOWED_ORIGINS:http://localhost:3000,http://localhost:5173}
  allowed-methods: GET,POST,PUT,DELETE,OPTIONS
  allowed-headers: "*"
  allow-credentials: true

# Logging
logging:
  level:
    com.catus: INFO
    org.springframework.web: INFO
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"

# Actuator
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always

# Swagger/OpenAPI
springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html
    operations-sorter: method
```

---

### 4.2 application-dev.yml

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true

logging:
  level:
    com.catus: DEBUG
```

---

### 4.3 application-prod.yml

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false

logging:
  level:
    com.catus: INFO
    org.springframework.web: WARN
```

---

## 5. 도메인 모델

### 5.1 User Entity

```java
package com.catus.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_kakao_id", columnList = "kakao_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "kakao_id", nullable = false, unique = true)
    private Long kakaoId;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(name = "profile_image", length = 500)
    private String profileImage;

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Column(name = "age_group", length = 20)
    @Enumerated(EnumType.STRING)
    private AgeGroup ageGroup;

    @Column(length = 50)
    @Enumerated(EnumType.STRING)
    private Occupation occupation;

    @Column(columnDefinition = "TEXT")
    private String purpose;

    @Column(name = "onboarding_completed", nullable = false)
    private Boolean onboardingCompleted = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Gender {
        FEMALE("여자"),
        MALE("남자"),
        NONE("선택 안함");

        private final String description;

        Gender(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    public enum AgeGroup {
        TEENS("10대"),
        TWENTIES("20대"),
        THIRTIES("30대"),
        FORTIES_PLUS("40대 이상");

        private final String description;

        AgeGroup(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    public enum Occupation {
        STUDENT("학생"),
        WORKER("직장인"),
        OTHER("기타");

        private final String description;

        Occupation(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
```

---

### 5.2 Diary Entity

```java
package com.catus.domain.diary.entity;

import com.catus.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "diaries",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_date", columnNames = {"user_id", "date"})
    },
    indexes = {
        @Index(name = "idx_user_date", columnList = "user_id, date")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Diary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private Emotion emotion;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(name = "picture_url", nullable = false, length = 500)
    private String pictureUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Emotion {
        HAPPY("행복"),
        SAD("슬픔"),
        NORMAL("보통"),
        ANGRY("화남"),
        ANXIOUS("불안");

        private final String description;

        Emotion(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
```

---

### 5.3 SupportMessage Entity

```java
package com.catus.domain.support.entity;

import com.catus.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "support_messages",
    indexes = {
        @Index(name = "idx_receiver_read", columnList = "receiver_id, is_read"),
        @Index(name = "idx_sender", columnList = "sender_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Column(nullable = false, length = 100)
    private String text;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

---

## 6. API 엔드포인트

### 6.1 인증 컨트롤러

```java
package com.catus.domain.auth.controller;

import com.catus.domain.auth.dto.*;
import com.catus.domain.auth.service.AuthService;
import com.catus.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Authentication", description = "인증 API")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "카카오 로그인", description = "카카오 OAuth 코드로 로그인")
    @PostMapping("/kakao")
    public ResponseEntity<ApiResponse<LoginResponse>> kakaoLogin(
            @Valid @RequestBody KakaoLoginRequest request) {
        LoginResponse response = authService.kakaoLogin(request.getCode());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "토큰 갱신", description = "Refresh Token으로 Access Token 갱신")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<RefreshTokenResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        RefreshTokenResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "로그아웃")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal String userId) {
        authService.logout(userId);
        return ResponseEntity.ok(ApiResponse.success(null, "로그아웃 성공"));
    }

    @Operation(summary = "현재 사용자 정보 조회")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal String userId) {
        UserResponse response = authService.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
```

---

### 6.2 사용자 컨트롤러

```java
package com.catus.domain.user.controller;

import com.catus.domain.user.dto.*;
import com.catus.domain.user.service.UserService;
import com.catus.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "User", description = "사용자 API")
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "온보딩 정보 저장")
    @PostMapping("/onboarding")
    public ResponseEntity<ApiResponse<OnboardingResponse>> saveOnboarding(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody OnboardingRequest request) {
        OnboardingResponse response = userService.saveOnboarding(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "온보딩 정보가 저장되었습니다"));
    }

    @Operation(summary = "프로필 조회")
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(
            @AuthenticationPrincipal String currentUserId,
            @PathVariable String userId) {
        UserResponse response = userService.getUser(currentUserId, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "프로필 수정")
    @PutMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal String currentUserId,
            @PathVariable String userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse response = userService.updateProfile(currentUserId, userId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "프로필이 수정되었습니다"));
    }
}
```

---

### 6.3 채팅 컨트롤러

```java
package com.catus.domain.chat.controller;

import com.catus.domain.chat.dto.*;
import com.catus.domain.chat.service.ChatService;
import com.catus.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@Tag(name = "Chat", description = "채팅 API")
@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @Operation(summary = "AI 채팅 응답 (스트리밍)",
               description = "Server-Sent Events로 AI 응답 스트리밍")
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> streamChat(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody ChatRequest request) {
        return chatService.streamChat(userId, request);
    }

    @Operation(summary = "대화 분석 및 일기 생성",
               description = "전체 대화 내용을 분석하여 일기 생성")
    @PostMapping("/analyze")
    public ResponseEntity<ApiResponse<AnalyzeResponse>> analyzeConversation(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody AnalyzeRequest request) {
        AnalyzeResponse response = chatService.analyzeConversation(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
```

---

### 6.4 일기 컨트롤러

```java
package com.catus.domain.diary.controller;

import com.catus.domain.diary.dto.*;
import com.catus.domain.diary.service.DiaryService;
import com.catus.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Tag(name = "Diary", description = "일기 API")
@RestController
@RequestMapping("/diaries")
@RequiredArgsConstructor
public class DiaryController {

    private final DiaryService diaryService;

    @Operation(summary = "월별 일기 목록 조회")
    @GetMapping
    public ResponseEntity<ApiResponse<List<DiaryResponse>>> getDiaries(
            @AuthenticationPrincipal String userId,
            @RequestParam int year,
            @RequestParam int month) {
        List<DiaryResponse> response = diaryService.getDiaries(userId, year, month);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "특정 날짜 일기 조회")
    @GetMapping("/{date}")
    public ResponseEntity<ApiResponse<DiaryResponse>> getDiary(
            @AuthenticationPrincipal String userId,
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date) {
        DiaryResponse response = diaryService.getDiary(userId, date);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "일기 수정")
    @PutMapping("/{date}")
    public ResponseEntity<ApiResponse<DiaryResponse>> updateDiary(
            @AuthenticationPrincipal String userId,
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date,
            @Valid @RequestBody UpdateDiaryRequest request) {
        DiaryResponse response = diaryService.updateDiary(userId, date, request);
        return ResponseEntity.ok(ApiResponse.success(response, "일기가 수정되었습니다"));
    }

    @Operation(summary = "일기 삭제")
    @DeleteMapping("/{date}")
    public ResponseEntity<ApiResponse<Void>> deleteDiary(
            @AuthenticationPrincipal String userId,
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate date) {
        diaryService.deleteDiary(userId, date);
        return ResponseEntity.ok(ApiResponse.success(null, "일기가 삭제되었습니다"));
    }
}
```

---

### 6.5 익명 응원 메시지 컨트롤러

```java
package com.catus.domain.support.controller;

import com.catus.domain.support.dto.*;
import com.catus.domain.support.service.SupportMessageService;
import com.catus.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Support", description = "익명 응원 메시지 API")
@RestController
@RequestMapping("/support")
@RequiredArgsConstructor
public class SupportMessageController {

    private final SupportMessageService supportMessageService;

    @Operation(summary = "받은 메시지 조회")
    @GetMapping("/received")
    public ResponseEntity<ApiResponse<List<SupportMessageResponse>>> getReceivedMessages(
            @AuthenticationPrincipal String userId) {
        List<SupportMessageResponse> response = supportMessageService.getReceivedMessages(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "보낸 메시지 조회")
    @GetMapping("/sent")
    public ResponseEntity<ApiResponse<List<SupportMessageResponse>>> getSentMessages(
            @AuthenticationPrincipal String userId) {
        List<SupportMessageResponse> response = supportMessageService.getSentMessages(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "메시지 전송")
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<SupportMessageResponse>> sendMessage(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody SendMessageRequest request) {
        SupportMessageResponse response = supportMessageService.sendMessage(userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "메시지 읽음 처리")
    @PutMapping("/{messageId}/read")
    public ResponseEntity<ApiResponse<SupportMessageResponse>> markAsRead(
            @AuthenticationPrincipal String userId,
            @PathVariable String messageId) {
        SupportMessageResponse response = supportMessageService.markAsRead(userId, messageId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
```

---

### 6.6 통계 컨트롤러

```java
package com.catus.domain.statistics.controller;

import com.catus.domain.statistics.dto.*;
import com.catus.domain.statistics.service.StatisticsService;
import com.catus.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Statistics", description = "통계 API")
@RestController
@RequestMapping("/stats")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @Operation(summary = "감정 통계 조회")
    @GetMapping("/emotions")
    public ResponseEntity<ApiResponse<EmotionStatsResponse>> getEmotionStats(
            @AuthenticationPrincipal String userId,
            @RequestParam int year,
            @RequestParam int month) {
        EmotionStatsResponse response = statisticsService.getEmotionStats(userId, year, month);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "월별 통계 조회")
    @GetMapping("/monthly")
    public ResponseEntity<ApiResponse<MonthlyStatsResponse>> getMonthlyStats(
            @AuthenticationPrincipal String userId,
            @RequestParam int year,
            @RequestParam int month) {
        MonthlyStatsResponse response = statisticsService.getMonthlyStats(userId, year, month);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
```

---

## 7. 보안 설정 (Spring Security)

### 7.1 SecurityConfig

```java
package com.catus.config;

import com.catus.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/auth/kakao",
                    "/auth/refresh",
                    "/health",
                    "/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "http://localhost:5173",
            "https://catus.com"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

---

### 7.2 JwtTokenProvider

```java
package com.catus.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration}") long accessTokenExpiration,
            @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    public String generateAccessToken(String userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpiration);

        return Jwts.builder()
                .subject(userId)
                .issuedAt(now)
                .expiration(expiryDate)
                .claim("type", "access")
                .signWith(secretKey)
                .compact();
    }

    public String generateRefreshToken(String userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshTokenExpiration);

        return Jwts.builder()
                .subject(userId)
                .issuedAt(now)
                .expiration(expiryDate)
                .claim("type", "refresh")
                .signWith(secretKey)
                .compact();
    }

    public String getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (SecurityException | MalformedJwtException e) {
            log.error("Invalid JWT signature", e);
        } catch (ExpiredJwtException e) {
            log.error("Expired JWT token", e);
        } catch (UnsupportedJwtException e) {
            log.error("Unsupported JWT token", e);
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty", e);
        }
        return false;
    }
}
```

---

### 7.3 JwtAuthenticationFilter

```java
package com.catus.domain.auth.filter;

import com.catus.security.JwtTokenProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && jwtTokenProvider.validateToken(jwt)) {
                String userId = jwtTokenProvider.getUserIdFromToken(jwt);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

---

## 8. 에러 처리

### 8.1 GlobalExceptionHandler

```java
package com.catus.common.exception;

import com.catus.common.response.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException e) {
        log.error("BusinessException: {}", e.getMessage());
        ErrorResponse errorResponse = ErrorResponse.of(e.getErrorCode());
        return ResponseEntity.status(e.getErrorCode().getStatus()).body(errorResponse);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException e) {
        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ErrorResponse errorResponse = ErrorResponse.builder()
                .message("입력값 검증 실패")
                .error("VALIDATION_ERROR")
                .statusCode(HttpStatus.BAD_REQUEST.value())
                .details(errors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        log.error("Unexpected error", e);
        ErrorResponse errorResponse = ErrorResponse.builder()
                .message("일시적인 오류가 발생했습니다")
                .error("INTERNAL_SERVER_ERROR")
                .statusCode(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}
```

---

### 8.2 ErrorCode Enum

```java
package com.catus.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // Auth
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다"),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "만료된 토큰입니다"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "잘못된 인증 정보입니다"),
    UNAUTHORIZED(HttpStatus.FORBIDDEN, "권한이 없습니다"),

    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"),

    // Diary
    DIARY_NOT_FOUND(HttpStatus.NOT_FOUND, "일기를 찾을 수 없습니다"),
    DIARY_ALREADY_EXISTS(HttpStatus.CONFLICT, "해당 날짜에 이미 일기가 존재합니다"),

    // Support
    MESSAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "메시지를 찾을 수 없습니다"),
    NO_AVAILABLE_RECIPIENT(HttpStatus.NOT_FOUND, "메시지를 받을 사용자가 없습니다"),

    // AI
    AI_SERVICE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "AI 서비스 오류가 발생했습니다"),
    IMAGE_GENERATION_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "이미지 생성에 실패했습니다"),

    // Validation
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "입력값 검증에 실패했습니다");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
```

---

### 8.3 BusinessException

```java
package com.catus.common.exception;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
```

---

## 9. 테스트

### 9.1 Controller 테스트 예시

```java
package com.catus.domain.auth.controller;

import com.catus.domain.auth.dto.KakaoLoginRequest;
import com.catus.domain.auth.dto.LoginResponse;
import com.catus.domain.auth.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @Test
    @WithMockUser
    void kakaoLogin_Success() throws Exception {
        // Given
        KakaoLoginRequest request = new KakaoLoginRequest("test_code");
        LoginResponse response = LoginResponse.builder()
                .accessToken("access_token")
                .refreshToken("refresh_token")
                .build();

        when(authService.kakaoLogin(anyString())).thenReturn(response);

        // When & Then
        mockMvc.perform(post("/auth/kakao")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("access_token"))
                .andExpect(jsonPath("$.data.refreshToken").value("refresh_token"));
    }
}
```

---

### 9.2 Service 테스트 예시

```java
package com.catus.domain.diary.service;

import com.catus.common.exception.BusinessException;
import com.catus.domain.diary.entity.Diary;
import com.catus.domain.diary.repository.DiaryRepository;
import com.catus.domain.user.entity.User;
import com.catus.domain.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiaryServiceTest {

    @Mock
    private DiaryRepository diaryRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DiaryService diaryService;

    @Test
    void getDiary_Success() {
        // Given
        String userId = "user123";
        LocalDate date = LocalDate.of(2024, 11, 20);

        User user = User.builder().id(userId).build();
        Diary diary = Diary.builder()
                .id("diary123")
                .user(user)
                .date(date)
                .emotion(Diary.Emotion.HAPPY)
                .summary("Test summary")
                .pictureUrl("http://example.com/image.png")
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(diaryRepository.findByUserAndDate(user, date)).thenReturn(Optional.of(diary));

        // When
        var response = diaryService.getDiary(userId, date);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo("diary123");
        assertThat(response.getEmotion()).isEqualTo("행복");
    }

    @Test
    void getDiary_NotFound_ThrowsException() {
        // Given
        String userId = "user123";
        LocalDate date = LocalDate.of(2024, 11, 20);
        User user = User.builder().id(userId).build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(diaryRepository.findByUserAndDate(user, date)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> diaryService.getDiary(userId, date))
                .isInstanceOf(BusinessException.class);
    }
}
```

---

## 10. 배포

### 10.1 Docker 설정

**Dockerfile**:
```dockerfile
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY src src
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: catus
      DB_USER: catus_user
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      KAKAO_REST_API_KEY: ${KAKAO_REST_API_KEY}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
    depends_on:
      - postgres
      - redis
    networks:
      - catus-network

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: catus
      POSTGRES_USER: catus_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - catus-network

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    networks:
      - catus-network

volumes:
  postgres-data:

networks:
  catus-network:
    driver: bridge
```

---

### 10.2 배포 체크리스트

- [ ] application-prod.yml 환경변수 설정 완료
- [ ] PostgreSQL 데이터베이스 마이그레이션 실행
- [ ] Redis 설정 및 연결 확인
- [ ] AWS S3 버킷 생성 및 권한 설정
- [ ] Kakao OAuth 앱 설정 및 Redirect URI 등록
- [ ] Google Gemini API 키 발급
- [ ] DALL-E/Stability AI 키 발급
- [ ] HTTPS 인증서 설정 (Let's Encrypt 권장)
- [ ] CORS 설정 확인 (프론트엔드 도메인)
- [ ] Rate Limiting 설정 (선택)
- [ ] 로그 모니터링 설정 (ELK, CloudWatch 등)
- [ ] Health Check 엔드포인트 확인
- [ ] 백업 정책 수립

---

## 부록: 주요 DTO 클래스

### A.1 Common Response

```java
package com.catus.common.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String message;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .message(message)
                .build();
    }
}
```

### A.2 AnalyzeRequest

```java
package com.catus.domain.chat.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AnalyzeRequest {

    @NotNull(message = "날짜는 필수입니다")
    private LocalDate date;

    @NotEmpty(message = "메시지는 최소 1개 이상이어야 합니다")
    @Valid
    private List<ChatMessage> messages;
}
```

### A.3 ChatMessage

```java
package com.catus.domain.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    @NotBlank(message = "role은 필수입니다")
    private String role;  // "user" or "assistant"

    @NotBlank(message = "content는 필수입니다")
    private String content;

    @NotNull(message = "timestamp는 필수입니다")
    private LocalDateTime timestamp;
}
```

---

**End of Document**
