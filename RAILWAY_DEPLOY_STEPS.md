# Railway 배포 단계별 가이드

## 1단계: Railway 로그인

터미널에서 실행:
```bash
cd C:\Users\acer\Desktop\React-Native\Catus_Backend
railway login
```
- 브라우저가 열리면 GitHub 계정으로 인증
- 인증 완료 후 터미널로 돌아오기

## 2단계: 프로젝트 초기화

```bash
railway init
```
- 프로젝트 이름: `catus-backend` (또는 원하는 이름)
- 환경: Production 선택

## 3단계: Redis 서비스 추가 (선택사항)

Railway 웹 대시보드에서:
1. 프로젝트 클릭
2. **New** → **Database** → **Redis**
3. Redis 생성 후 환경 변수 자동 설정됨

## 4단계: 환경 변수 설정

### CLI로 설정하기:

```bash
# Supabase PostgreSQL
railway variables set SPRING_DATASOURCE_URL="jdbc:postgresql://db.vplhnjknctzpbhikyttr.supabase.co:5432/postgres"
railway variables set SPRING_DATASOURCE_USERNAME="postgres"
railway variables set SPRING_DATASOURCE_PASSWORD="20010815"

# JWT Secret
railway variables set JWT_SECRET="s7b0/5w9UiEj5PhHeBuq0HYSOKp/ZmAqSJPFiFtq4xU="

# Gemini API
railway variables set GEMINI_API_KEY="AIzaSyDC8vugMhMphLPCwwHdCz3ufS8otWeAFeg"

# Spring Profile
railway variables set SPRING_PROFILES_ACTIVE="prod"
```

### 또는 웹 대시보드에서:
1. https://railway.app/dashboard
2. 프로젝트 클릭 → **Variables** 탭
3. 위 환경 변수들을 수동으로 추가

**비밀번호가 20010815로 안 되면:**
```bash
# 두 번째 시도
railway variables set SPRING_DATASOURCE_PASSWORD="1ekdldjxm!"

# 세 번째 시도
railway variables set SPRING_DATASOURCE_PASSWORD="123ekdldjxm!"
```

## 5단계: 배포 실행

```bash
railway up
```

또는 GitHub 연동 배포:
```bash
railway link
railway up --detach
```

## 6단계: 배포 확인

```bash
# 로그 확인
railway logs

# 서비스 URL 확인
railway open
```

## 7단계: 도메인 확인

Railway 대시보드에서:
- **Settings** → **Networking**
- 생성된 URL 복사 (예: `catus-backend.up.railway.app`)

## 8단계: Vercel 환경 변수 업데이트

배포 완료 후:
```bash
cd ../catus
vercel env rm VITE_API_BASE_URL production
vercel env add VITE_API_BASE_URL production
# 입력: https://[RAILWAY_URL]/api/v1

vercel --prod
```

---

## 문제 해결

### 빌드 실패 시
```bash
# 로컬에서 빌드 테스트
./gradlew clean build -x test

# Railway에서 재배포
railway up --detach
```

### 데이터베이스 연결 실패 시
비밀번호 변경:
```bash
railway variables set SPRING_DATASOURCE_PASSWORD="[다른_비밀번호]"
railway restart
```

### 로그 확인
```bash
railway logs --follow
```

---

## 예상 배포 시간
- 빌드: 2-3분
- 배포: 1-2분
- 총 시간: 약 5분

## 성공 확인
```
https://[RAILWAY_URL]/actuator/health
```
응답:
```json
{"status":"UP"}
```
