# Railway 환경 변수 설정 가이드

배포는 시작되었지만, **환경 변수를 설정해야 정상 작동**합니다!

## 🌐 웹 대시보드에서 설정 (가장 간단!)

1. **Railway 프로젝트 열기**:
   https://railway.com/project/02a6a212-70c1-4771-88cd-85b446c3e565

2. 서비스 클릭 (catus-backend)

3. **Variables** 탭 클릭

4. 아래 환경 변수들을 **하나씩** 추가:

### 필수 환경 변수:

```
이름: SPRING_DATASOURCE_URL
값: jdbc:postgresql://db.vplhnjknctzpbhikyttr.supabase.co:5432/postgres
```

```
이름: SPRING_DATASOURCE_USERNAME
값: postgres
```

```
이름: SPRING_DATASOURCE_PASSWORD
값: 20010815
```
⚠️ 만약 20010815로 DB 연결 실패하면:
- `1ekdldjxm!` 시도
- `123ekdldjxm!` 시도

```
이름: JWT_SECRET
값: s7b0/5w9UiEj5PhHeBuq0HYSOKp/ZmAqSJPFiFtq4xU=
```

```
이름: GEMINI_API_KEY
값: AIzaSyDC8vugMhMphLPCwwHdCz3ufS8otWeAFeg
```

```
이름: SPRING_PROFILES_ACTIVE
값: prod
```

5. **저장 후 자동 재배포됨**

---

## 🔍 배포 상태 확인

### 로그 확인:
```bash
cd Catus_Backend
railway logs
```

### 도메인 확인:
Railway 대시보드 → Settings → Networking → Generate Domain

### Health Check:
```
https://[YOUR-RAILWAY-DOMAIN]/actuator/health
```

정상 응답:
```json
{"status":"UP"}
```

---

## ⚠️ 문제 해결

### 빌드 실패 시:
1. Railway 대시보드 → Deployments → 로그 확인
2. 환경 변수 누락 확인

### DB 연결 실패 시:
Variables 탭에서 `SPRING_DATASOURCE_PASSWORD` 값 변경:
- `1ekdldjxm!`
- `123ekdldjxm!`

---

## ✅ 다음 단계

환경 변수 설정 후:
1. Railway에서 도메인 생성
2. Vercel 환경 변수 업데이트:
   ```bash
   cd ../catus
   vercel env rm VITE_API_BASE_URL production
   vercel env add VITE_API_BASE_URL production
   # 입력: https://[RAILWAY-DOMAIN]/api/v1
   vercel --prod
   ```
