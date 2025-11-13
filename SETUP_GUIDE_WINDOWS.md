# Catus Backend - Windows 로컬 설정 가이드

## ✅ 현재 설치 상태

- ✅ **Java 17.0.11** - 설치 완료
- ✅ **Gradle 8.5** - 설치 완료 (Gradle Wrapper)
- ❌ **Docker Desktop** - 미설치

---

## 🚀 Option 1: Docker 사용 (권장)

### Docker Desktop 설치

1. **Docker Desktop for Windows 다운로드**
   - https://www.docker.com/products/docker-desktop/
   - "Download for Windows" 클릭

2. **설치 실행**
   ```
   - Docker Desktop Installer.exe 실행
   - "Use WSL 2 instead of Hyper-V" 체크
   - 설치 완료 후 재시작
   ```

3. **Docker 실행 확인**
   ```bash
   docker --version
   docker-compose --version
   ```

4. **PostgreSQL + Redis 시작**
   ```bash
   cd C:\Users\acer\Desktop\React-Native\Catus_Backend
   docker-compose up -d
   ```

---

## 🔧 Option 2: Docker 없이 실행 (H2 인메모리 DB)

Docker 설치가 어려운 경우, 테스트용으로 H2 DB를 사용할 수 있습니다.

### application-h2.yml 생성

`src/main/resources/application-h2.yml` 파일 생성:
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:catusdb
    driver-class-name: org.h2.Driver
    username: sa
    password:

  h2:
    console:
      enabled: true
      path: /h2-console

  jpa:
    hibernate:
      ddl-auto: create
    show-sql: true

  flyway:
    enabled: false  # H2에서는 Flyway 비활성화

  data:
    redis:
      # Redis 없이 실행 (리프레시 토큰 기능 제한됨)
      host: localhost
      port: 6379
```

### 실행 방법
```bash
cd C:\Users\acer\Desktop\React-Native\Catus_Backend

# H2 프로필로 실행
./gradlew bootRun --args='--spring.profiles.active=h2'
```

**주의사항:**
- H2는 인메모리 DB이므로 재시작 시 데이터 삭제됨
- Redis 없이는 리프레시 토큰 기능이 작동하지 않음
- 프로덕션 환경에는 사용 불가

---

## 📝 환경 변수 설정

### 1. `.env` 파일 생성

```bash
cd C:\Users\acer\Desktop\React-Native\Catus_Backend
cp .env.example .env
```

### 2. `.env` 파일 편집

최소 필수 항목:
```bash
# JWT Secret (32자 이상)
JWT_SECRET=my_super_secret_jwt_key_12345678901234567890

# Kakao OAuth
KAKAO_CLIENT_ID=(발급 필요)
KAKAO_CLIENT_SECRET=(발급 필요)

# Gemini API
GEMINI_API_KEY=(발급 필요)

# OpenAI DALL-E
OPENAI_API_KEY=(발급 필요)

# AWS S3
AWS_S3_BUCKET=catus-diary-images
AWS_ACCESS_KEY=(발급 필요)
AWS_SECRET_KEY=(발급 필요)
```

### 3. Windows 환경 변수 설정 (PowerShell)

```powershell
# PowerShell에서 실행
$env:JWT_SECRET="my_super_secret_jwt_key_12345678901234567890"
$env:KAKAO_CLIENT_ID="your_kakao_client_id"
# ... 나머지 환경 변수들
```

또는 Git Bash에서:
```bash
export JWT_SECRET="my_super_secret_jwt_key_12345678901234567890"
export KAKAO_CLIENT_ID="your_kakao_client_id"
# ... 나머지 환경 변수들
```

---

## 🔨 빌드 및 실행

### 1. 테스트 없이 빌드

```bash
cd C:\Users\acer\Desktop\React-Native\Catus_Backend
./gradlew clean build -x test
```

### 2. Spring Boot 실행

**Option A: Gradle로 실행**
```bash
./gradlew bootRun
```

**Option B: JAR 파일로 실행**
```bash
java -jar build/libs/catus-backend-0.0.1-SNAPSHOT.jar
```

### 3. 실행 확인

```bash
# Health Check
curl http://localhost:8080/actuator/health

# Swagger UI
# 브라우저에서: http://localhost:8080/swagger-ui.html
```

---

## 🐛 문제 해결

### 문제 1: "Could not connect to database"

**원인:** PostgreSQL이 실행되지 않음

**해결:**
- Docker 사용: `docker-compose up -d`
- H2 사용: `--spring.profiles.active=h2` 옵션 추가

### 문제 2: "JWT secret too short"

**원인:** JWT_SECRET이 32자 미만

**해결:**
```bash
export JWT_SECRET="my_super_secret_jwt_key_at_least_32_characters_long_12345"
```

### 문제 3: "Redis connection failed"

**원인:** Redis가 실행되지 않음

**해결:**
- Docker 사용: `docker-compose up -d`
- H2 모드: 리프레시 토큰 기능이 제한됨 (로그인은 작동)

### 문제 4: Gradle 빌드 실패

**원인:** 인터넷 연결 또는 권한 문제

**해결:**
```bash
# Gradle wrapper 실행 권한 부여 (Git Bash)
chmod +x gradlew

# 또는 Windows에서
./gradlew.bat clean build -x test
```

---

## 📊 현재 작동 가능한 기능

### Docker 사용 시 (100% 기능)
- ✅ 카카오 로그인
- ✅ AI 챗봇
- ✅ 자동 그림일기 생성
- ✅ 캘린더 관리
- ✅ 익명 응원 메시지
- ✅ 리프레시 토큰

### H2 사용 시 (90% 기능)
- ✅ 카카오 로그인
- ✅ AI 챗봇
- ✅ 자동 그림일기 생성
- ✅ 캘린더 관리
- ✅ 익명 응원 메시지
- ⚠️ 리프레시 토큰 (제한적)

---

## 🎯 빠른 시작 (Quick Start)

### Docker 있는 경우:
```bash
cd C:\Users\acer\Desktop\React-Native\Catus_Backend

# 1. 환경 변수 설정
cp .env.example .env
# .env 파일 편집 (API 키 입력)

# 2. Docker 시작
docker-compose up -d

# 3. 빌드 및 실행
./gradlew bootRun
```

### Docker 없는 경우:
```bash
cd C:\Users\acer\Desktop\React-Native\Catus_Backend

# 1. 환경 변수 설정
export JWT_SECRET="my_super_secret_jwt_key_at_least_32_characters_long_12345"

# 2. H2로 실행
./gradlew bootRun --args='--spring.profiles.active=h2'

# 3. 브라우저에서 확인
# http://localhost:8080/swagger-ui.html
```

---

## 📚 다음 단계

1. **API 키 발급**
   - Kakao: https://developers.kakao.com/
   - Gemini: https://ai.google.dev/
   - OpenAI: https://platform.openai.com/
   - AWS S3: https://aws.amazon.com/

2. **프론트엔드 연동**
   - `catus/.env` 파일 생성
   - `VITE_API_BASE_URL=http://localhost:8080/api/v1` 설정

3. **테스트**
   - Swagger UI에서 API 테스트
   - 프론트엔드와 연동 테스트

---

**작성일:** 2025-11-11
**작성자:** Claude Code Assistant
