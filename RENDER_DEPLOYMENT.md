# Render 배포 가이드

## 🚀 Render 배포 방법

### 방법 1: 웹 대시보드 (추천, 가장 간단!)

#### 1. Render 계정 생성/로그인
https://dashboard.render.com/

GitHub 계정으로 로그인

#### 2. 새 Web Service 생성

1. **Dashboard** → **New +** 버튼 → **Web Service** 클릭

2. **Connect a repository**:
   - GitHub 연동 (이미 로그인됨)
   - 저장소가 없다면: **"Configure account"** → 저장소 접근 권한 부여

3. **또는 Public Git Repository**:
   ```
   https://github.com/OckJuYong/catus-backend.git
   ```
   (저장소를 먼저 생성해야 함)

#### 3. 서비스 설정

**Basic 설정:**
- **Name**: `catus-backend`
- **Region**: `Singapore` 또는 `Frankfurt` (한국과 가까운 곳)
- **Branch**: `main` 또는 `master`
- **Runtime**: `Java`

**Build 설정:**
- **Build Command**:
  ```bash
  chmod +x gradlew && ./gradlew clean build -x test
  ```

- **Start Command**:
  ```bash
  java -Dserver.port=$PORT -jar build/libs/catus-backend-1.0.0.jar
  ```

**Instance Type:**
- **Free** 선택 (무료 티어)

#### 4. 환경 변수 설정

**Environment Variables** 섹션에서 추가:

```
SPRING_DATASOURCE_URL = jdbc:postgresql://db.vplhnjknctzpbhikyttr.supabase.co:5432/postgres

SPRING_DATASOURCE_USERNAME = postgres

SPRING_DATASOURCE_PASSWORD = 20010815

JWT_SECRET = s7b0/5w9UiEj5PhHeBuq0HYSOKp/ZmAqSJPFiFtq4xU=

GEMINI_API_KEY = AIzaSyDC8vugMhMphLPCwwHdCz3ufS8otWeAFeg

SPRING_PROFILES_ACTIVE = prod

JAVA_OPTS = -Xmx512m -Xms256m
```

⚠️ 비밀번호가 `20010815`로 안 되면:
- `1ekdldjxm!` 시도
- `123ekdldjxm!` 시도

#### 5. 배포 실행

**"Create Web Service"** 버튼 클릭!

배포 시작:
- 빌드: 3-5분
- 배포 완료 후 URL 제공 (예: `catus-backend.onrender.com`)

---

### 방법 2: GitHub 저장소 연동 (자동 배포)

#### 1. GitHub 저장소 생성
https://github.com/new

- **Repository name**: `catus-backend`
- **Public** 선택
- **Create repository**

#### 2. 코드 푸시
```bash
cd Catus_Backend
git remote remove origin  # 기존 remote 제거
git remote add origin https://github.com/YOUR_USERNAME/catus-backend.git
git branch -M main
git push -u origin main
```

#### 3. Render에서 연동
Dashboard → New Web Service → 저장소 선택 → 위 설정 적용

---

## ✅ 배포 확인

### Health Check
```
https://catus-backend.onrender.com/actuator/health
```

정상 응답:
```json
{"status":"UP"}
```

### 로그 확인
Render Dashboard → 서비스 클릭 → **Logs** 탭

---

## 🔧 문제 해결

### 빌드 실패 시
- **Logs** 탭에서 에러 확인
- Build Command에 `chmod +x gradlew` 포함 확인

### DB 연결 실패 시
- Environment Variables에서 비밀번호 변경
- Render Dashboard → **Manual Deploy** 클릭

### 메모리 부족 시
- `JAVA_OPTS`에 `-Xmx512m` 설정 확인
- Free 티어는 512MB RAM 제공

---

## ⚙️ Render 특징

**장점:**
- ✅ 완전 무료 티어
- ✅ Spring Boot 공식 지원
- ✅ 자동 SSL 인증서
- ✅ GitHub 자동 배포
- ✅ gradlew 권한 문제 없음

**단점:**
- ⏳ 15분 미사용 시 슬립 모드 (첫 요청 시 웨이크업 30초)
- 🌍 서버 위치: 싱가포르/프랑크푸르트 (한국보다 먼 편)

---

## 🔄 다음 단계

배포 완료 후:
1. Render 도메인 확인 (예: `catus-backend.onrender.com`)
2. Vercel 환경 변수 업데이트:
   ```bash
   cd ../catus
   vercel env rm VITE_API_BASE_URL production
   vercel env add VITE_API_BASE_URL production
   # 입력: https://catus-backend.onrender.com/api/v1
   vercel --prod
   ```

---

## 📊 무료 티어 제한

- **Instance Hours**: 750시간/월 (충분함)
- **Bandwidth**: 100GB/월
- **Build Minutes**: 500분/월
- **Sleep after inactivity**: 15분 (자동 웨이크업)

대부분의 개인 프로젝트에 충분합니다!
