# CATUS 백엔드 API 문서

> **프론트엔드 분석 기반 자동 생성**
> **React 코드**: `/src/utils/api.js`
> **생성일**: 2024-11-20

---

## 📚 문서 목록

### 필수 문서
1. **[API_SPECIFICATION.md](./API_SPECIFICATION.md)** - 전체 API 명세서 (프레임워크 무관)
2. **[API_SPECIFICATION_SPRINGBOOT.md](./API_SPECIFICATION_SPRINGBOOT.md)** - Spring Boot 구현 가이드
3. **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - 데이터베이스 스키마 및 JPA 매핑
4. **[AUTHENTICATION.md](./AUTHENTICATION.md)** - JWT 인증 구현 가이드
5. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - 배포 가이드

---

## 🎯 프로젝트 개요

### 서비스 설명
**CATUS**는 AI 고양이 "달이"와 대화하며 감정 일기를 작성하는 웹 서비스입니다.

### 기술 스택 (권장)
- **프레임워크**: Spring Boot 3.2+
- **언어**: Java 17+
- **데이터베이스**: PostgreSQL
- **인증**: JWT (Spring Security)
- **AI**: Google Gemini API
- **이미지 생성**: DALL-E / Stable Diffusion
- **저장소**: AWS S3 / Cloudinary

---

## 🔑 핵심 아키텍처

### 채팅 메시지 저장 정책 ⚠️

**프론트엔드 (React)**:
- 채팅 메시지를 **IndexedDB**에 저장
- 실시간 채팅은 클라이언트에서만 관리

**백엔드 (Spring Boot)**:
- 채팅 메시지를 **저장하지 않음**
- 대화 종료 시 전체 대화를 받아 **분석만 수행**
- 분석 결과(요약, 감정, 그림일기)만 DB에 저장

```
[데이터 흐름]
사용자 입력 → IndexedDB 저장 → POST /chat/send → AI 응답
    ↓
대화 종료 → IndexedDB 조회 → POST /chat/end (전체 대화 전송)
    ↓
백엔드 분석 → 일기 생성 → DB 저장 (메시지는 저장 안함)
```

---

## 📊 프론트엔드 API 호출 분석

### 추출된 API 엔드포인트 (총 23개)

#### 인증 (Authentication) - 4개
```javascript
authApi.kakaoLogin(code)           // POST /auth/kakao
authApi.refreshToken(refreshToken) // POST /auth/refresh
authApi.logout()                   // POST /auth/logout
authApi.me()                       // GET /auth/me
```

#### 사용자 (User) - 3개
```javascript
userApi.getProfile(userId)         // GET /users/{userId}
userApi.updateProfile(userId, data) // PUT /users/{userId}
userApi.saveOnboarding(data)       // POST /users/onboarding
```

#### 채팅 (Chat) - 3개
```javascript
chatApi.sendMessage(content)       // POST /chat/send
chatApi.getHistory(diaryId)        // GET /chat/history/{diaryId}
chatApi.endConversation(messages)  // POST /chat/end
```

#### 일기 (Diary) - 5개
```javascript
diaryApi.getList(year, month)      // GET /diaries?year={year}&month={month}
diaryApi.getByDate(date)           // GET /diaries/{date}
diaryApi.create(data)              // POST /diaries
diaryApi.update(date, data)        // PUT /diaries/{date}
diaryApi.delete(date)              // DELETE /diaries/{date}
```

#### 익명 응원 (Support) - 4개
```javascript
supportApi.getReceived()           // GET /support/received
supportApi.getSent()               // GET /support/sent
supportApi.send(data)              // POST /support/send
supportApi.markAsRead(messageId)   // PUT /support/{messageId}/read
```

#### 통계 (Statistics) - 2개
```javascript
statsApi.getEmotions(year, month)  // GET /stats/emotions?year={year}&month={month}
statsApi.getMonthly(year, month)   // GET /stats/monthly?year={year}&month={month}
```

---

## 🚀 빠른 시작

### 1단계: 프로젝트 설정
```bash
# Spring Boot 프로젝트 생성
https://start.spring.io
- Spring Boot 3.2.0
- Java 17
- Dependencies: Web, JPA, Security, PostgreSQL, Lombok
```

### 2단계: application.yml 설정
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/catus
    username: catus_user
    password: your_password

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true

server:
  port: 8080
  servlet:
    context-path: /api/v1

jwt:
  secret: your-secret-key
  expiration: 3600000

kakao:
  rest-api-key: ${KAKAO_REST_API_KEY}
```

### 3단계: 도메인 모델 작성
```
src/main/java/com/catus/
├── domain/
│   ├── user/
│   │   ├── entity/User.java
│   │   ├── repository/UserRepository.java
│   │   └── service/UserService.java
│   ├── diary/
│   ├── chat/
│   └── support/
```

### 4단계: API 구현
각 도메인별로 Controller → Service → Repository 구현

---

## 📖 문서 사용 가이드

### API 명세서 보는 법
1. **[API_SPECIFICATION.md](./API_SPECIFICATION.md)** 먼저 읽기
   - 모든 엔드포인트 전체 구조 파악
   - Request/Response 형식 이해

2. **[API_SPECIFICATION_SPRINGBOOT.md](./API_SPECIFICATION_SPRINGBOOT.md)** 구현
   - 실제 Java 코드 작성
   - Controller, Service, DTO 구현

3. **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** DB 설정
   - 테이블 생성 SQL 실행
   - JPA Entity 작성

4. **[AUTHENTICATION.md](./AUTHENTICATION.md)** 인증 구현
   - Spring Security 설정
   - JWT 필터 구현

5. **[DEPLOYMENT.md](./DEPLOYMENT.md)** 배포
   - Docker 컨테이너화
   - 환경변수 설정

---

## ⚙️ 개발 우선순위

### Phase 1: MVP (필수 기능)
- [ ] 카카오 OAuth 로그인
- [ ] JWT 인증 구현
- [ ] 사용자 온보딩 API
- [ ] AI 채팅 API (Gemini 연동)
- [ ] 대화 분석 및 일기 생성
- [ ] 일기 CRUD

### Phase 2: 핵심 기능
- [ ] 익명 응원 메시지
- [ ] 월별 일기 조회
- [ ] 감정 통계
- [ ] 그림일기 생성 (DALL-E)

### Phase 3: 고급 기능
- [ ] 푸시 알림
- [ ] 고급 통계
- [ ] 성능 최적화 (캐싱)
- [ ] 모니터링 및 로깅

---

## 🔧 개발 환경 설정

### 필수 도구
- **JDK 17+**: [다운로드](https://adoptium.net/)
- **PostgreSQL 15+**: [다운로드](https://www.postgresql.org/download/)
- **IntelliJ IDEA / Eclipse**: IDE
- **Postman / Insomnia**: API 테스트

### 환경변수
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=catus
DB_USER=catus_user
DB_PASSWORD=your_password

JWT_SECRET=your-256-bit-secret-key
JWT_EXPIRES_IN=3600000

KAKAO_REST_API_KEY=your_kakao_key
KAKAO_REDIRECT_URI=http://localhost:3000/auth/callback

GEMINI_API_KEY=your_gemini_api_key
DALLE_API_KEY=your_dalle_api_key

AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
AWS_S3_BUCKET=catus-diaries
```

---

## 📦 의존성 (pom.xml)

```xml
<dependencies>
    <!-- Spring Boot -->
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

    <!-- Database -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
    </dependency>

    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.3</version>
    </dependency>

    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>

    <!-- AWS S3 -->
    <dependency>
        <groupId>software.amazon.awssdk</groupId>
        <artifactId>s3</artifactId>
        <version>2.20.26</version>
    </dependency>

    <!-- Google Gemini -->
    <dependency>
        <groupId>com.google.cloud</groupId>
        <artifactId>google-cloud-aiplatform</artifactId>
        <version>3.30.0</version>
    </dependency>
</dependencies>
```

---

## 🧪 테스트

### 단위 테스트
```java
@SpringBootTest
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Test
    void saveOnboarding_Success() {
        // Given
        OnboardingRequest request = new OnboardingRequest(...);

        // When
        OnboardingResponse response = userService.saveOnboarding("user123", request);

        // Then
        assertThat(response.getUser().isOnboardingCompleted()).isTrue();
    }
}
```

### API 테스트 (Postman)
1. Collection 임포트: `/docs/backend/postman_collection.json`
2. Environment 설정: `BASE_URL`, `ACCESS_TOKEN`
3. 순서대로 테스트 실행

---

## 🐛 문제 해결

### 자주 발생하는 이슈

#### 1. 카카오 로그인 401 에러
```
원인: 잘못된 REST API KEY 또는 Redirect URI
해결: application.yml의 KAKAO_REST_API_KEY 확인
```

#### 2. JWT 토큰 검증 실패
```
원인: JWT_SECRET 불일치
해결: 프론트엔드와 백엔드의 SECRET 동일한지 확인
```

#### 3. CORS 에러
```
원인: Spring Security CORS 설정 누락
해결: SecurityConfig에서 CORS 허용 설정
```

---

## 📞 지원

- **기술 문의**: backend-team@catus.com
- **버그 리포트**: GitHub Issues
- **문서 개선**: Pull Request 환영

---

**버전**: 1.0.0
**최종 업데이트**: 2024-11-20
**생성 방식**: React 프론트엔드 자동 분석
