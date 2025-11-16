# CloudType 배포 가이드

## 1. GitHub에 프로젝트 푸시

```bash
cd catus

# .gitignore 확인 (.env 파일이 포함되어 있는지 확인)
cat .gitignore

# Git 초기화 (아직 안 했다면)
git init
git add .
git commit -m "Initial commit: Catus frontend"

# GitHub 저장소 연결 (본인 저장소 URL로 변경)
git remote add origin https://github.com/YOUR_USERNAME/catus-frontend.git
git branch -M main
git push -u origin main
```

## 2. CloudType 프로젝트 생성

1. CloudType 로그인: https://cloudtype.io/
2. **새 프로젝트** 클릭
3. **GitHub 저장소 연결**
4. `catus-frontend` 저장소 선택

## 3. 빌드 설정

### 기본 설정
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 고급 설정 (필요시)
- **Node Version**: 18 이상
- **Port**: 자동 설정됨

## 4. 환경 변수 설정

CloudType 대시보드 → 환경 변수 탭:

```
VITE_API_BASE_URL=https://your-backend-url.railway.app/api/v1
VITE_ENABLE_DEBUG=false
```

⚠️ **중요**:
- 백엔드 Railway 배포 완료 후 실제 URL로 업데이트 필요
- 임시로 `https://temp-backend.railway.app/api/v1` 같은 더미 URL 설정 가능

## 5. 배포 실행

1. **배포** 버튼 클릭
2. 빌드 로그 확인
3. 배포 완료 후 URL 확인

## 6. 백엔드 연동 (나중에)

Railway 백엔드 배포 후:
1. CloudType → 환경 변수로 이동
2. `VITE_API_BASE_URL` 값을 실제 Railway URL로 변경
3. **재배포** 클릭

---

## Vercel 배포 (대안)

CloudType 대신 Vercel 사용 시:

### 1. Vercel CLI 설치
```bash
npm i -g vercel
```

### 2. 배포
```bash
cd catus
vercel

# 프로덕션 배포
vercel --prod
```

### 3. 환경 변수 설정
```bash
vercel env add VITE_API_BASE_URL production
# 입력: https://your-backend-url.railway.app/api/v1

vercel env add VITE_ENABLE_DEBUG production
# 입력: false
```

또는 Vercel 대시보드에서 수동 설정 가능.

---

## 주의사항

1. **환경 변수 노출 방지**: `.env` 파일을 Git에 커밋하지 마세요
2. **VITE_ 접두사 필수**: Vite는 `VITE_`로 시작하는 환경 변수만 클라이언트에 노출
3. **재배포 필요**: 환경 변수 변경 시 항상 재배포 필요
4. **CORS 설정**: 백엔드에서 프론트엔드 도메인 허용 설정 필요
