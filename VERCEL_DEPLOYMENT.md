# Vercel 배포 가이드

## 🚀 방법 1: Vercel 웹 대시보드 (추천)

### 1. GitHub에 프로젝트 푸시

```bash
cd catus

# Git 초기화 (아직 안 했다면)
git init
git add .
git commit -m "Initial commit: Catus frontend"

# GitHub 저장소 연결 (본인 저장소 URL로 변경)
git remote add origin https://github.com/YOUR_USERNAME/catus-frontend.git
git branch -M main
git push -u origin main
```

### 2. Vercel에서 Import

1. **Vercel 로그인**: https://vercel.com/
2. **New Project** 클릭
3. **Import Git Repository** → GitHub 연동
4. `catus-frontend` 저장소 선택

### 3. 빌드 설정 (자동 감지됨)

Vercel이 자동으로 감지하지만 확인:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. 환경 변수 설정

**Environment Variables** 섹션에서 추가:

```
Name: VITE_API_BASE_URL
Value: https://temp-backend.railway.app/api/v1
Environment: Production, Preview, Development
```

```
Name: VITE_ENABLE_DEBUG
Value: false
Environment: Production
```

⚠️ **중요**:
- Railway 백엔드 배포 후 실제 URL로 업데이트 필요
- 임시로 더미 URL 사용 가능

### 5. 배포

1. **Deploy** 버튼 클릭
2. 빌드 진행 상황 확인
3. 배포 완료! URL 받기 (예: `catus-frontend.vercel.app`)

---

## 💻 방법 2: Vercel CLI

### 1. Vercel CLI 설치

```bash
npm i -g vercel
```

### 2. 로그인

```bash
vercel login
```

### 3. 프로젝트 배포

```bash
cd catus

# 첫 배포 (설정 질문에 답변)
vercel

# 프로덕션 배포
vercel --prod
```

### 4. 환경 변수 설정

```bash
# 백엔드 API URL 설정
vercel env add VITE_API_BASE_URL production
# 입력 프롬프트: https://temp-backend.railway.app/api/v1

vercel env add VITE_API_BASE_URL preview
# 입력 프롬프트: https://temp-backend.railway.app/api/v1

vercel env add VITE_ENABLE_DEBUG production
# 입력 프롬프트: false
```

### 5. 재배포 (환경 변수 적용)

```bash
vercel --prod
```

---

## 🔄 백엔드 연동 (나중에)

Railway 백엔드 배포 완료 후:

### 웹 대시보드 방법:
1. Vercel 프로젝트 → **Settings** → **Environment Variables**
2. `VITE_API_BASE_URL` 편집
3. 실제 Railway URL로 변경 (예: `https://catus-backend-production.up.railway.app/api/v1`)
4. **Redeploy** 클릭

### CLI 방법:
```bash
# 환경 변수 업데이트
vercel env rm VITE_API_BASE_URL production
vercel env add VITE_API_BASE_URL production
# 입력: https://catus-backend-production.up.railway.app/api/v1

# 재배포
vercel --prod
```

---

## 📋 배포 확인 체크리스트

- [ ] GitHub에 코드 푸시 완료
- [ ] Vercel 프로젝트 생성 및 저장소 연동
- [ ] 환경 변수 설정 (`VITE_API_BASE_URL`, `VITE_ENABLE_DEBUG`)
- [ ] 첫 배포 성공
- [ ] 배포된 URL 확인 및 접속 테스트
- [ ] (나중에) Railway 백엔드 URL로 업데이트 후 재배포

---

## ⚙️ 추가 설정 (선택사항)

### 커스텀 도메인 설정
1. Vercel 프로젝트 → **Settings** → **Domains**
2. 원하는 도메인 추가

### 자동 배포 설정
- GitHub에 푸시하면 자동으로 Vercel이 배포함 (기본 활성화)
- `main` 브랜치: 프로덕션 배포
- 다른 브랜치: Preview 배포

---

## 🚨 주의사항

1. **환경 변수 노출 방지**: `.env` 파일을 Git에 커밋하지 마세요 (.gitignore에 이미 추가됨)
2. **VITE_ 접두사 필수**: Vite는 `VITE_`로 시작하는 환경 변수만 클라이언트에 노출
3. **재배포 필요**: 환경 변수 변경 시 항상 재배포 필요
4. **CORS 설정**: 백엔드에서 Vercel 도메인 허용 설정 필요

---

## 🆘 문제 해결

### 빌드 실패 시
- `package.json` 스크립트 확인
- Node.js 버전 확인 (18 이상 권장)
- 빌드 로그 확인

### 배포 후 API 연결 안 될 때
- 환경 변수 설정 확인
- 백엔드 CORS 설정 확인
- 브라우저 콘솔에서 네트워크 에러 확인
