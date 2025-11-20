# CATUS 백엔드 빠른 시작 가이드

> **10분 안에 개발 환경 구축하기**

---

## 📋 사전 준비

### 필수 설치
- [ ] **JDK 17+**: [다운로드](https://adoptium.net/)
- [ ] **PostgreSQL 15+**: [다운로드](https://www.postgresql.org/download/)
- [ ] **Maven 3.9+** 또는 **Gradle 8+**
- [ ] **IntelliJ IDEA** (권장) 또는 Eclipse

### 확인
```bash
java -version   # 17 이상
psql --version  # 15 이상
mvn --version   # 3.9 이상
```

---

## 🚀 5분 설정

### 1단계: 데이터베이스 생성

```sql
-- PostgreSQL 접속
psql -U postgres

-- 데이터베이스 생성
CREATE DATABASE catus;
CREATE USER catus_user WITH PASSWORD 'catus1234';
GRANT ALL PRIVILEGES ON DATABASE catus TO catus_user;
```

### 2단계: Spring Boot 프로젝트 생성

#### 방법 A: Spring Initializr (웹)
1. https://start.spring.io 접속
2. 다음 설정:
   - **Project**: Maven
   - **Language**: Java
   - **Spring Boot**: 3.2.0
   - **Java**: 17
   - **Packaging**: Jar
   - **Group**: com.catus
   - **Artifact**: catus-api

3. Dependencies 추가:
   - Spring Web
   - Spring Data JPA
   - Spring Security
   - PostgreSQL Driver
   - Lombok
   - Validation

4. **GENERATE** 클릭 → 다운로드

#### 방법 B: CLI
```bash
curl https://start.spring.io/starter.zip \
  -d dependencies=web,data-jpa,security,postgresql,lombok,validation \
  -d baseDir=catus-api \
  -d bootVersion=3.2.0 \
  -d javaVersion=17 \
  -o catus-api.zip

unzip catus-api.zip
cd catus-api
```

### 3단계: application.yml 설정

**파일 위치**: `src/main/resources/application.yml`

```yaml
spring:
  application:
    name: catus-api

  datasource:
    url: jdbc:postgresql://localhost:5432/catus
    username: catus_user
    password: catus1234
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true

server:
  port: 8080
  servlet:
    context-path: /api/v1

jwt:
  secret: catus-secret-key-change-this-in-production-environment-min-256-bits
  access-token-expiration: 3600000  # 1 hour
  refresh-token-expiration: 1209600000  # 14 days

kakao:
  rest-api-key: ${KAKAO_REST_API_KEY:your-key-here}
  redirect-uri: http://localhost:3000/auth/kakao/callback

logging:
  level:
    com.catus: DEBUG
```

### 4단계: 패키지 구조 생성

```bash
mkdir -p src/main/java/com/catus/{config,domain,common,security}

# 도메인 구조
mkdir -p src/main/java/com/catus/domain/{auth,user,diary,chat,support,statistics}

# 각 도메인별 하위 구조
for domain in auth user diary chat support statistics; do
  mkdir -p src/main/java/com/catus/domain/$domain/{controller,service,repository,dto,entity}
done
```

### 5단계: 첫 번째 엔티티 생성

**파일**: `src/main/java/com/catus/domain/user/entity/User.java`

```java
package com.catus.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
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

    @Column(name = "onboarding_completed", nullable = false)
    private Boolean onboardingCompleted = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

---

## 🧪 테스트 실행

### 프로젝트 실행
```bash
# Maven
./mvnw spring-boot:run

# Gradle
./gradlew bootRun
```

### 확인
```bash
# Health Check
curl http://localhost:8080/api/v1/actuator/health

# 예상 결과
{"status":"UP"}
```

---

## 📦 추가 의존성 (pom.xml)

```xml
<dependencies>
    <!-- 기본 의존성은 Spring Initializr에서 자동 추가됨 -->

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

    <!-- AWS S3 (이미지 저장) -->
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>s3</artifactId>
        <version>2.20.26</version>
    </dependency>

    <!-- Google Gemini (AI) -->
    <dependency>
        <groupId>com.google.cloud</groupId>
        <artifactId>google-cloud-aiplatform</artifactId>
        <version>3.30.0</version>
    </dependency>

    <!-- Actuator (Health Check) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
</dependencies>
```

---

## 🎯 다음 단계

### Phase 1: 인증 구현 (1-2일)
1. **JWT 설정**
   - JwtTokenProvider 클래스 작성
   - JwtAuthenticationFilter 작성
   - SecurityConfig 설정

2. **카카오 OAuth**
   - KakaoOAuthService 작성
   - AuthController 작성
   - 로그인/로그아웃 API

**참고**: [AUTHENTICATION.md](./AUTHENTICATION.md)

### Phase 2: 사용자 관리 (1일)
1. User Repository, Service 작성
2. UserController 작성
3. 온보딩 API 구현

**참고**: [API_SPECIFICATION_SPRINGBOOT.md](./API_SPECIFICATION_SPRINGBOOT.md#32-사용자-user)

### Phase 3: AI 채팅 (2-3일)
1. Gemini API 연동
2. ChatService 작성
3. SSE 스트리밍 구현
4. 대화 분석 API

**참고**: [API_SPECIFICATION_SPRINGBOOT.md](./API_SPECIFICATION_SPRINGBOOT.md#33-채팅-chat)

### Phase 4: 일기 관리 (2일)
1. Diary Entity, Repository 작성
2. DiaryService, Controller 작성
3. 그림일기 생성 (DALL-E 연동)

**참고**: [API_SPECIFICATION_SPRINGBOOT.md](./API_SPECIFICATION_SPRINGBOOT.md#34-일기-diary)

---

## 🐛 문제 해결

### PostgreSQL 연결 실패
```
에러: Could not open JPA EntityManager for transaction

해결:
1. PostgreSQL 서비스 실행 확인
2. application.yml의 username/password 확인
3. 방화벽 5432 포트 확인
```

### Lombok 작동 안 함
```
에러: cannot find symbol: variable log

해결 (IntelliJ):
1. Settings → Plugins → "Lombok" 설치
2. Settings → Build → Annotation Processors → "Enable annotation processing" 체크
3. Rebuild Project
```

### 포트 충돌 (8080)
```
에러: Port 8080 is already in use

해결:
# application.yml에서 포트 변경
server:
  port: 8081
```

---

## 📚 참고 문서

1. **[API_SPECIFICATION.md](./API_SPECIFICATION.md)** - 전체 API 명세
2. **[API_SPECIFICATION_SPRINGBOOT.md](./API_SPECIFICATION_SPRINGBOOT.md)** - Spring Boot 구현
3. **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - DB 스키마
4. **[AUTHENTICATION.md](./AUTHENTICATION.md)** - 인증 가이드
5. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - 배포 가이드

---

## ✅ 체크리스트

- [ ] JDK 17+ 설치 완료
- [ ] PostgreSQL 설치 및 실행
- [ ] 데이터베이스 생성 (`catus`)
- [ ] Spring Boot 프로젝트 생성
- [ ] application.yml 설정
- [ ] User Entity 작성
- [ ] 프로젝트 실행 성공
- [ ] Health Check 확인

---

**다음**: [인증 구현 가이드 →](./AUTHENTICATION.md)
