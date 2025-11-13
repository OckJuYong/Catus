# Railway 배포 가이드

## 1. Railway 프로젝트 생성

```bash
cd Catus_Backend
railway login
railway init
```

## 2. Redis 서비스 추가

Railway 웹 콘솔에서:
1. 프로젝트 대시보드 → "New" → "Database" → "Add Redis"
2. Redis 생성 후 자동으로 환경 변수가 설정됩니다

## 3. 환경 변수 설정

Railway 웹 콘솔에서 Variables 탭으로 이동하여 아래 변수들을 설정:

### 필수 환경 변수

#### Supabase PostgreSQL
```
SPRING_DATASOURCE_URL=jdbc:postgresql://[SUPABASE_HOST]:5432/[DATABASE_NAME]
SPRING_DATASOURCE_USERNAME=[SUPABASE_USERNAME]
SPRING_DATASOURCE_PASSWORD=[SUPABASE_PASSWORD]
```

#### JWT Secret (랜덤 256비트 문자열 생성)
```bash
# 로컬에서 생성
openssl rand -base64 32
```
```
JWT_SECRET=[생성된_시크릿_키]
```

#### Gemini API
```
GEMINI_API_KEY=AIzaSyDC8vugMhMphLPCwwHdCz3ufS8otWeAFeg
```

#### Spring Profile
```
SPRING_PROFILES_ACTIVE=prod
```

#### Redis (Railway Redis 추가 후 자동 설정됨)
```
SPRING_REDIS_HOST=${{Redis.REDIS_HOST}}
SPRING_REDIS_PORT=${{Redis.REDIS_PORT}}
SPRING_REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
```

## 4. 배포 실행

```bash
railway up
```

또는 GitHub 연동 배포:
1. Railway 웹 콘솔 → Settings → Connect Repo
2. GitHub 저장소 선택
3. 자동 배포 활성화

## 5. 배포 확인

```bash
# 배포 로그 확인
railway logs

# 서비스 URL 확인
railway open
```

## 6. 도메인 설정

Railway 웹 콘솔에서:
1. Settings → Networking
2. Generate Domain 클릭
3. 생성된 URL 복사 (예: `catus-backend.railway.app`)

## 7. Health Check 확인

배포 완료 후:
```
https://[YOUR_RAILWAY_DOMAIN]/actuator/health
```

## 주의사항

1. **무료 티어 제한**: 월 $5 크레딧 (약 500시간 실행)
2. **환경 변수 보안**: 절대 코드에 하드코딩하지 마세요
3. **Redis 필수**: 세션 관리를 위해 Redis 서비스 추가 필요
4. **포트 설정**: Railway는 자동으로 PORT 환경 변수 제공 (railway.toml에서 사용)
