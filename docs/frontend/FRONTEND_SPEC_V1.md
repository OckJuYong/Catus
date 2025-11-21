# 📋 Catus 프론트엔드 기능명세서

> React 19.1.1 + TypeScript + Vite 7.2.0

---

## 1. 도메인별 기능 명세

### 👤 인증 도메인 (Auth Domain)

- **카카오 소셜 로그인**
  - [x] 카카오 OAuth 2.0 연동
  - [x] JWT 토큰 localStorage 저장
  - [x] 신규/기존 유저 자동 구분
  - [x] 자동 로그인 처리

- **온보딩**
  - [x] 닉네임 설정
  - [x] 비밀번호 설정 (선택)
  - [x] 일기 생성 시간 설정
  - [x] 추가 정보 수집 (성별, 연령, 직업, 목적)

- **회원 관리**
  - [x] 프로필 수정 (닉네임, 비밀번호)
  - [x] 회원 탈퇴
  - [x] 로그아웃

### 💬 채팅 도메인 (Chat Domain)

- **대화 관리**
  - [x] 실시간 AI 채팅 인터페이스
  - [x] 메시지 IndexedDB 로컬 저장
  - [x] 날짜별 대화 내용 조회
  - [x] 페이지 새로고침 시 대화 복원

- **백엔드 동기화**
  - [x] 일기 생성 시 채팅 로그 전송
  - [x] 동기화 상태 추적 (synced flag)

### 📔 일기 도메인 (Diary Domain)

- **일기 생성**
  - [x] 설정 시간에 일기 생성 버튼 활성화
  - [x] IndexedDB 채팅 로그 수집 및 전송
  - [x] 일기 생성 애니메이션

- **일기 관리**
  - [x] 캘린더 뷰 (감정 이모지 표시)
  - [x] 일기 상세 보기
  - [x] 일기 수정 (감정, 내용)
  - [x] 일기 삭제

- **랜덤 일기**
  - [x] 타인의 익명 일기 조회
  - [x] 고양이 "달이" 클릭 시 접근

### 💌 메시지 도메인 (Message Domain)

- **익명 메시지**
  - [x] 랜덤 일기에 응원 메시지 전송 (최대 100자)
  - [x] 받은 메시지 조회
  - [x] 읽지 않은 메시지 배지 표시
  - [x] 종이비행기 애니메이션

- **알림 관리**
  - [x] LocalStorage로 읽음 상태 추적
  - [x] 첫 메시지 수신 시 튜토리얼 표시

### 🧠 성격 분석 도메인 (Personality Domain)

- **Big5 테스트**
  - [x] 초기 10개 질문 성격 검사
  - [x] 5점 척도 응답
  - [x] 진행률 바 표시

- **Big5 통계**
  - [x] 5가지 특성 시각화 (프로그레스 바)
  - [x] 특성별 점수 및 설명
  - [x] 주간 자동 업데이트 안내
  - [x] 마지막 업데이트 날짜 표시

### ⚙️ 설정 도메인 (Settings Domain)

- **사용자 설정**
  - [x] 일기 생성 시간 변경
  - [x] 알림 설정 (익명 메시지)
  - [x] 다크모드 토글
  - [x] 프로필 수정

### 🎓 튜토리얼 시스템

- **첫 방문 튜토리얼**
  - [x] 홈 화면 자동 시작
  - [x] UI 요소별 단계 안내
  - [x] 완료 상태 LocalStorage 저장

---

## 2. 페이지 라우팅 구조

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | LoginPage | 카카오 로그인 |
| `/auth/kakao/callback` | KakaoCallbackPage | 카카오 인증 처리 |
| `/onboarding` | OnboardingPage | 기본 정보 입력 |
| `/onboarding/flow` | Onboarding | 추가 정보 수집 |
| `/home` | HomePage | 메인 화면 |
| `/chat` | ChatPage | AI 채팅 |
| `/calendar` | CalendarPage | 일기 캘린더 |
| `/diary/:date` | DiaryDetailPage | 일기 상세 |
| `/diary-reveal/:date` | DiaryRevealPage | 일기 생성 |
| `/random-diary` | RandomDiaryPage | 랜덤 일기 조회 |
| `/big5/test` | Big5TestPage | BIG5 검사 |
| `/big5/stats` | Big5StatsPage | BIG5 통계 |
| `/letter` | LetterPage | 익명 메시지함 |
| `/settings` | SettingsPage | 설정 |
| `/support` | SupportPage | 지원 |
| `/privacy-policy` | PrivacyPolicyPage | 개인정보처리방침 |

---

## 3. 로컬 데이터 저장

### LocalStorage
| Key | Type | Description |
|-----|------|-------------|
| `catus_access_token` | string | JWT 토큰 |
| `catus_onboarding_completed` | boolean | 온보딩 완료 |
| `catus_dark_mode` | boolean | 다크모드 설정 |
| `catus_diary_time` | string | 일기 생성 시간 |
| `received_messages` | array | 받은 메시지 |
| `last_checked_received_count` | number | 마지막 확인 메시지 수 |
| `support_tutorial_shown` | boolean | 지원 튜토리얼 표시 |
| `tutorial_completed` | boolean | 첫 튜토리얼 완료 |

### IndexedDB (CatusDB)
**Store**: `chatMessages`

| Field | Type | Index |
|-------|------|-------|
| id | number | Primary Key (auto) |
| date | string | Yes (날짜별 조회) |
| role | string | - |
| content | string | - |
| timestamp | string | - |
| synced | boolean | Yes (동기화 필터) |
| createdAt | number | - |

---

## 4. 주요 Context

### AuthContext
- 로그인 상태 관리
- JWT 토큰 관리
- 자동 로그인 처리

### DarkModeContext
- 다크모드 상태
- 백엔드 동기화

### TutorialContext
- 튜토리얼 완료 상태
- LocalStorage 동기화

---

## 5. 외부 라이브러리

### 핵심
- `react`: 19.1.1
- `react-router-dom`: 7.1.3
- `@tanstack/react-query`: 5.66.2
- `axios`: 1.7.9

### UI/UX
- `framer-motion`: 11.18.0
- `react-calendar`: 5.2.0
- `lucide-react`: 0.468.0

### 유틸리티
- `date-fns`: 4.1.0

### 개발
- `vite`: 7.2.0
- `typescript`: 5.7.3
- `tailwindcss`: 3.4.17

---

## 6. 환경 변수

```env
VITE_KAKAO_CLIENT_ID=your_kakao_client_id
VITE_KAKAO_REDIRECT_URI=http://localhost:8101/auth/kakao/callback
VITE_API_BASE_URL=http://localhost:3000
```

---

## 7. 비기능 요구사항

### 성능
- React Query 캐싱 (5분 staleTime)
- IndexedDB 로컬 저장
- Vite HMR

### 보안
- JWT 토큰 인증
- HTTPS 통신 (프로덕션)
- XSS 방지 (React 자동)

### UX
- 반응형 디자인
- 다크모드 지원
- 애니메이션 (Framer Motion)

### 접근성
- 시맨틱 HTML
- aria-label 속성
- WCAG AA 준수

---

## 8. 빌드 및 배포

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 타입 체크
npm run type-check
```

---

## 9. 브라우저 지원

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**모바일**:
- iOS Safari 14+
- Chrome Android 90+

---

**문서 버전**: 1.0
**최종 수정**: 2025-01-21
