# Catus 프로젝트 기술 명세서 (Technical Specification)

## 프로젝트 개요

**프로젝트명**: Catus
**타입**: AI 기반 감정 일기 웹 애플리케이션
**프론트엔드 기술 스택**: React 19.1.1 + Vite 7.1.7 + TailwindCSS 4.1.16
**주요 라이브러리**: React Router DOM, Framer Motion, TanStack React Query, Axios

## 아키텍처 개요

### 기술 스택
- **빌드 도구**: Vite 7.1.7
- **UI 프레임워크**: React 19.1.1
- **스타일링**: TailwindCSS 4.1.16, PostCSS
- **라우팅**: React Router DOM 7.9.5
- **애니메이션**: Framer Motion 12.23.24
- **데이터 페칭**: TanStack React Query 5.90.7, Axios 1.13.2
- **PWA**: vite-plugin-pwa 1.1.0

### 프로젝트 구조
```
catus/
├── public/                    # 정적 자원
├── src/
│   ├── assets/               # 이미지, 아이콘 등
│   │   └── images/          # 앱에서 사용하는 이미지 파일들
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── common/         # 공통 컴포넌트 (Button, LoadingSpinner)
│   │   ├── ErrorBoundary.jsx
│   │   └── NotificationPermission.jsx
│   ├── constants/          # 상수 정의
│   │   ├── emotionColors.js
│   │   ├── onboardingQuestions.js
│   │   ├── routes.js
│   │   └── tutorialSteps.js
│   ├── contexts/           # React Context API
│   │   ├── AuthContext.jsx
│   │   ├── DarkModeContext.jsx
│   │   ├── TutorialContext.jsx
│   │   └── UserContext.jsx
│   ├── hooks/              # 커스텀 훅
│   │   ├── useApi.js
│   │   ├── useChat.js
│   │   ├── useDebounce.js
│   │   ├── useDiary.js
│   │   ├── useIntersectionObserver.js
│   │   ├── useLocalStorage.js
│   │   └── useSupport.js
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── CalendarPage.jsx
│   │   ├── ChatPage.jsx
│   │   ├── DiaryDetailPage.jsx
│   │   ├── DiaryDetailPage2.jsx
│   │   ├── DiaryRevealPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── KakaoCallbackPage.jsx
│   │   ├── LetterPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── Onboarding.jsx
│   │   ├── OnboardingPage.jsx
│   │   ├── PrivacyPolicyPage.jsx
│   │   ├── SettingsPage.jsx
│   │   ├── SupportPage.jsx
│   │   └── Tutorial.jsx
│   ├── utils/              # 유틸리티 함수
│   │   ├── api.js          # API 호출 함수
│   │   ├── dateFormat.js
│   │   ├── errorHandler.js
│   │   ├── firebase.js
│   │   ├── storage.js
│   │   └── validation.js
│   ├── App.jsx             # 루트 컴포넌트
│   └── main.jsx            # 엔트리 포인트
├── docs/                   # 문서
├── .env                    # 환경 변수
└── package.json
```

## 핵심 기능 모듈

### 1. 인증 시스템 (Authentication)

**파일**: `src/contexts/AuthContext.jsx`, `src/utils/api.js`

**주요 기능**:
- 카카오 소셜 로그인
- JWT 토큰 기반 인증 (Access Token + Refresh Token)
- 자동 로그인 (토큰 복원)
- 토큰 자동 갱신
- 로그아웃

**API 엔드포인트**:
```javascript
POST /api/v1/auth/kakao        // 카카오 로그인
POST /api/v1/auth/refresh      // 토큰 갱신
POST /api/v1/auth/logout       // 로그아웃
GET  /api/v1/auth/me           // 현재 사용자 정보
```

**토큰 저장 방식**:
- `localStorage.catus_access_token`: 액세스 토큰
- `localStorage.catus_refresh_token`: 리프레시 토큰
- `localStorage.catus_user`: 사용자 정보 JSON

### 2. AI 채팅 시스템 (Chat)

**파일**: `src/hooks/useChat.js`, `src/pages/ChatPage.jsx`

**주요 기능**:
- 실시간 대화형 일기 작성
- AI 응답 생성 (타이핑 인디케이터 포함)
- 대화 기록 저장 및 불러오기
- 대화 종료 시 감정 분석

**API 엔드포인트**:
```javascript
POST /api/v1/chat/send          // 메시지 전송
GET  /api/v1/chat/history/:id   // 채팅 기록 조회
POST /api/v1/chat/end           // 대화 종료 (감정 분석)
```

**메시지 구조**:
```typescript
{
  id: number,
  type: 'user' | 'ai',
  text: string,
  timestamp: Date
}
```

### 3. 일기 관리 시스템 (Diary)

**파일**: `src/hooks/useDiary.js`, `src/utils/api.js`

**주요 기능**:
- 일기 생성, 조회, 수정, 삭제 (CRUD)
- 월별 일기 목록 조회
- 특정 날짜 일기 조회
- 감정 기반 색상 표시

**API 엔드포인트**:
```javascript
GET    /api/v1/diaries?year={year}&month={month}  // 월별 일기 목록
GET    /api/v1/diaries/{date}                     // 특정 날짜 일기
POST   /api/v1/diaries                            // 일기 생성
PUT    /api/v1/diaries/{date}                     // 일기 수정
DELETE /api/v1/diaries/{date}                     // 일기 삭제
```

**일기 데이터 구조**:
```typescript
{
  date: string,        // YYYY-MM-DD
  content: string,
  emotion: '행복' | '슬픔' | '불안' | '화남' | '보통',
  summary: string,
  messages: Array<Message>
}
```

### 4. 감정 분석 및 색상 매핑

**파일**: `src/constants/emotionColors.js`

**감정 색상 시스템**:
```javascript
{
  행복: "#6BCB77",  // 녹색
  슬픔: "#4D96FF",  // 파란색
  불안: "#FFD93D",  // 노란색
  화남: "#FF6B6B",  // 빨간색
  보통: "#9E9E9E"   // 회색
}
```

**감정 이모지**:
```javascript
{
  행복: "😊",
  슬픔: "😢",
  불안: "😰",
  화남: "😠",
  보통: "😐"
}
```

### 5. 익명 응원 메시지 시스템

**파일**: `src/hooks/useSupport.js`, `src/pages/SupportPage.jsx`

**주요 기능**:
- 익명 응원 메시지 전송
- 받은 메시지 조회
- 보낸 메시지 조회
- 메시지 읽음 처리

**API 엔드포인트**:
```javascript
GET  /api/v1/support/received          // 받은 메시지
GET  /api/v1/support/sent              // 보낸 메시지
POST /api/v1/support/send              // 메시지 전송
PUT  /api/v1/support/{id}/read         // 읽음 처리
```

### 6. 캘린더 시스템

**파일**: `src/pages/CalendarPage.jsx`

**주요 기능**:
- 월별 캘린더 뷰
- 일기 작성 여부 표시
- 감정별 색상 표시
- 날짜 클릭 시 일기 상세 페이지 이동

### 7. 온보딩 시스템

**파일**: `src/pages/OnboardingPage.jsx`, `src/pages/Onboarding.jsx`

**주요 기능**:
- 초기 사용자 정보 수집
- 튜토리얼 제공
- 닉네임 설정
- 사용 목적 질문

**온보딩 질문** (`src/constants/onboardingQuestions.js`):
- 사용자 선호도 수집
- 일기 작성 목적 파악
- 개인화 설정

### 8. 다크 모드

**파일**: `src/contexts/DarkModeContext.jsx`

**주요 기능**:
- 라이트/다크 테마 전환
- 로컬 스토리지 기반 설정 저장
- 시스템 테마 연동 (선택적)

### 9. 튜토리얼 시스템

**파일**: `src/contexts/TutorialContext.jsx`, `src/constants/tutorialSteps.js`

**주요 기능**:
- 단계별 가이드 제공
- 진행 상태 추적
- 건너뛰기 기능

## 라우팅 구조

**파일**: `src/App.jsx`, `src/constants/routes.js`

```javascript
/                          → LoginPage (카카오 로그인)
/auth/kakao/callback       → KakaoCallbackPage
/onboarding                → OnboardingPage
/onboarding/flow           → Onboarding (플로우)
/home                      → HomePage (메인 대시보드)
/chat                      → ChatPage (AI 대화)
/calendar                  → CalendarPage (캘린더)
/diary-reveal/:date        → DiaryRevealPage (일기 공개)
/diary/:date               → DiaryDetailPage (일기 상세)
/diary2/:date              → DiaryDetailPage2 (대체 일기 상세)
/support                   → SupportPage (응원 메시지)
/letter                    → LetterPage (편지)
/settings                  → SettingsPage (설정)
/privacy-policy            → PrivacyPolicyPage
```

## Context API 구조

### 1. AuthContext
- **목적**: 전역 인증 상태 관리
- **제공 값**: `user`, `isLoading`, `isAuthenticated`, `login`, `logout`, `updateUser`, `getAccessToken`, `refreshAccessToken`

### 2. DarkModeContext
- **목적**: 다크 모드 상태 관리
- **제공 값**: `isDarkMode`, `toggleDarkMode`

### 3. TutorialContext
- **목적**: 튜토리얼 진행 상태 관리
- **제공 값**: `currentStep`, `isTutorialActive`, `nextStep`, `skipTutorial`

### 4. UserContext
- **목적**: 사용자 설정 및 데이터 관리
- **제공 값**: 사용자 프로필, 설정 등

## 커스텀 훅

### 1. useChat
**파일**: `src/hooks/useChat.js`
- 채팅 메시지 상태 관리
- 메시지 전송/수신
- AI 타이핑 인디케이터
- 대화 종료 및 감정 분석

### 2. useDiary
**파일**: `src/hooks/useDiary.js`
- `useDiaryList(year, month)`: 월별 일기 목록
- `useDiary(date)`: 특정 날짜 일기
- `useDiaryMutations()`: 일기 CRUD 작업

### 3. useSupport
**파일**: `src/hooks/useSupport.js`
- 응원 메시지 전송/조회
- 메시지 읽음 처리

### 4. useApi
**파일**: `src/hooks/useApi.js`
- API 호출 추상화
- 에러 핸들링
- 로딩 상태 관리

### 5. useDebounce
**파일**: `src/hooks/useDebounce.js`
- 입력 값 디바운싱
- 검색 최적화

### 6. useLocalStorage
**파일**: `src/hooks/useLocalStorage.js`
- 로컬 스토리지 읽기/쓰기
- 상태 동기화

### 7. useIntersectionObserver
**파일**: `src/hooks/useIntersectionObserver.js`
- 무한 스크롤
- 지연 로딩

## API 통신

### Base URL
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
```

### 인증 헤더
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}
```

### 에러 처리
- **401 Unauthorized**: 토큰 갱신 시도 → 실패 시 로그인 페이지로 리다이렉트
- **4xx/5xx**: ApiError 클래스로 에러 래핑
- **Network Error**: 네트워크 오류 메시지 표시

### API 모듈 구조 (`src/utils/api.js`)
```javascript
api = {
  auth: {
    kakaoLogin, refreshToken, logout, me
  },
  user: {
    getProfile, updateProfile, saveOnboarding
  },
  chat: {
    sendMessage, getHistory, endConversation
  },
  diary: {
    getList, getByDate, create, update, delete
  },
  support: {
    getReceived, getSent, send, markAsRead
  },
  stats: {
    getEmotions, getMonthly
  }
}
```

## 환경 변수

**파일**: `.env`, `.env.production`

```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_KAKAO_REST_API_KEY=your_kakao_key
VITE_KAKAO_REDIRECT_URI=http://localhost:5173/auth/kakao/callback
VITE_ENABLE_DEBUG=true
```

## 상태 관리 전략

1. **전역 상태**: Context API
   - AuthContext: 인증
   - DarkModeContext: 테마
   - TutorialContext: 튜토리얼

2. **서버 상태**: TanStack React Query (선택적)
   - 캐싱
   - 자동 재요청
   - 낙관적 업데이트

3. **로컬 상태**: useState, useReducer
   - 폼 입력
   - UI 상태

4. **영속 상태**: localStorage
   - 토큰
   - 사용자 설정
   - 다크 모드

## 빌드 및 배포

### 개발 서버
```bash
npm run dev
```

### 프로덕션 빌드
```bash
npm run build
```

### 미리보기
```bash
npm run preview
```

### 배포 플랫폼
- Vercel (설정 파일: `vercel.json`)
- 기타 정적 호스팅 서비스

## 성능 최적화

1. **코드 스플리팅**: React.lazy() + Suspense
2. **이미지 최적화**: WebP 포맷, 지연 로딩
3. **번들 크기 최적화**: Tree-shaking
4. **캐싱 전략**: React Query, localStorage
5. **디바운싱**: 검색, 입력 필드

## 접근성 (Accessibility)

- 시맨틱 HTML
- ARIA 속성
- 키보드 내비게이션
- 색상 대비 (WCAG AA 준수)
- 다크 모드 지원

## 보안

1. **XSS 방어**: React의 자동 이스케이핑
2. **CSRF 방어**: JWT 토큰 사용
3. **토큰 보안**:
   - Access Token: 짧은 만료 시간
   - Refresh Token: HttpOnly 쿠키 (백엔드)
4. **환경 변수 보호**: `.env` 파일 gitignore
5. **API 에러 처리**: 민감 정보 노출 방지

## 브라우저 지원

- Chrome (최신 2버전)
- Firefox (최신 2버전)
- Safari (최신 2버전)
- Edge (최신 2버전)
- 모바일 브라우저 (iOS Safari, Chrome Android)

## 에러 처리 전략

1. **ErrorBoundary**: React 에러 경계로 앱 크래시 방지
2. **API 에러**: ApiError 클래스로 통일된 에러 처리
3. **로깅**: `errorHandler.js`로 에러 로깅
4. **사용자 피드백**: Toast 메시지, 에러 페이지

## 테스트 (미구현 - 향후 계획)

- Unit Tests: Vitest
- Integration Tests: React Testing Library
- E2E Tests: Playwright 또는 Cypress

## 버전 관리

- **버전**: 0.0.0 (초기 개발 단계)
- **Git**: 버전 관리 시스템 사용
- **커밋 컨벤션**: Conventional Commits 권장

## 주요 의존성

```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "react-router-dom": "^7.9.5",
  "framer-motion": "^12.23.24",
  "@tanstack/react-query": "^5.90.7",
  "axios": "^1.13.2",
  "tailwindcss": "^4.1.16",
  "vite": "^7.1.7"
}
```

## 향후 개선 사항

1. TypeScript 마이그레이션
2. 단위 테스트 커버리지
3. PWA 기능 확장
4. 오프라인 모드
5. 다국어 지원 (i18n)
6. 접근성 개선
7. 성능 모니터링 (Sentry, LogRocket)

---

**문서 버전**: 1.0.0
**최종 업데이트**: 2025-11-20
