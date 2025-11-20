# CATUS 서비스 개발 기획서 (PRD)

> **프론트엔드 코드 역분석 기반**
> **작성일**: 2024-11-20
> **버전**: 1.0.0

---

## 📋 1. 서비스 개요

### 1.1 서비스 컨셉
**CATUS**는 AI 고양이 "달이"와 대화하며 감정을 기록하는 웹 기반 감정 일기 서비스입니다.

### 1.2 핵심 가치 제안
- 🐱 **AI 고양이와의 대화**: 심리적 안정감을 주는 캐릭터와 자연스러운 대화
- 📔 **자동 일기 생성**: 대화 내용을 분석하여 그림일기 자동 생성
- 🎨 **AI 그림일기**: 감정을 시각화한 맞춤형 일러스트 제공
- 💌 **익명 응원 시스템**: 사용자 간 따뜻한 응원 메시지 전달

### 1.3 타겟 사용자
- **주 타겟**: 20-30대 감정 정리가 필요한 사용자
- **부 타겟**: 일기 작성 습관을 들이고 싶은 사용자
- **페르소나**: 직장/학교 스트레스로 감정 표현이 어려운 MZ세대

### 1.4 기술 스택
```
Frontend:  React 19 + Vite + TailwindCSS + Framer Motion
State:     React Context API + React Query + IndexedDB
Auth:      Kakao OAuth 2.0 + JWT
Backend:   Spring Boot 3.2+ (권장)
Database:  PostgreSQL
AI:        Google Gemini (채팅) + DALL-E/Stable Diffusion (이미지)
Storage:   AWS S3 / Cloudinary
```

---

## 📱 2. 화면 구조 및 사용자 여정

### 2.1 화면 맵 (14개 페이지)

```
[로그인] → [카카오 콜백] → [온보딩 시작] → [온보딩 플로우]
                                              ↓
                                          [홈 화면] ← 메인 허브
                                              ↓
              ┌──────────────┬──────────────┼──────────────┬───────────┐
              ↓              ↓              ↓              ↓           ↓
          [채팅]        [캘린더]       [익명응원]     [받은편지]   [설정]
              ↓              ↓
      [일기 공개]      [일기 상세]
      [일기 상세2]
```

### 2.2 핵심 사용자 플로우

#### Flow 1: 신규 사용자 온보딩 (최초 1회)
```
1. 로그인 페이지 진입
2. "카카오 로그인" 버튼 클릭
3. 카카오 인증 완료 → 콜백 처리
4. 온보딩 시작 화면 (서비스 소개)
5. 온보딩 플로우 (4단계)
   - Step 1: 닉네임 입력
   - Step 2: 관심사 선택 (최대 5개)
   - Step 3: 목표 설정 ("감정 정리", "일기 습관" 등)
   - Step 4: 알림 권한 요청
6. 완료 → 홈 화면 이동
```

#### Flow 2: 일상 대화 → 일기 생성 (핵심 기능)
```
1. 홈 화면에서 고양이 "달이" 클릭
2. 채팅 페이지 진입
3. 사용자와 AI 간 자유 대화 (IndexedDB 저장)
4. 대화 종료 버튼 클릭
5. "일기 생성 중..." 로딩 화면
6. 백엔드 AI 분석 (감정, 키워드, 요약, 그림일기)
7. 일기 공개 페이지 (애니메이션)
   - 그림일기 공개 효과
   - 감정 분석 결과
   - AI 조언
8. 일기 상세 페이지로 이동 가능
```

#### Flow 3: 일기 조회 및 감정 통계
```
1. 홈 화면 → "일기장" 아이콘 클릭
2. 캘린더 페이지 (월별 뷰)
   - 일기 작성일은 감정 아이콘 표시
   - 작성하지 않은 날은 빈 날짜
3. 특정 날짜 클릭 → 일기 상세 페이지
   - 그림일기 표시
   - 대화 내용 확인 가능
   - 감정 및 키워드 표시
4. 설정 → 통계 탭
   - 월별 감정 분포 차트
   - 연속 작성일 배지
```

#### Flow 4: 익명 응원 메시지
```
[보내기]
1. 홈 화면 → 우편함 깜빡이면 신규 메시지
2. "익명 응원" 버튼 클릭
3. 응원 페이지
4. "응원 보내기" 버튼
5. 메시지 작성 (10-100자)
6. 감정 선택 (응원, 격려, 위로, 축하)
7. "랜덤 전송" 클릭 → 익명으로 랜덤 사용자에게 전송

[받기]
1. 홈 화면에서 우편함 애니메이션 (신규 메시지 알림)
2. 우편함 클릭 → 받은편지 페이지
3. 받은 메시지 목록
4. 메시지 클릭 → 읽음 처리
5. 따뜻한 감정 표현
```

---

## ⚙️ 3. 기능 명세

### 3.1 인증 및 사용자 관리

#### 3.1.1 카카오 소셜 로그인
- **방식**: OAuth 2.0
- **플로우**: Authorization Code Grant
- **저장**: JWT Access Token (1h) + Refresh Token (14d)
- **저장소**: localStorage (auth_token, refresh_token)

#### 3.1.2 온보딩 시스템
- **4단계 플로우**: 닉네임 → 관심사 → 목표 → 알림
- **검증**: 닉네임 2-10자, 관심사 1-5개 필수
- **완료 플래그**: onboarding_completed = true

#### 3.1.3 사용자 프로필
- 닉네임 수정 가능 (2-10자)
- 프로필 이미지 업로드 (선택)
- 알림 설정 ON/OFF

### 3.2 AI 채팅 및 일기 생성

#### 3.2.1 실시간 채팅 (IndexedDB)
**저장소: IndexedDB (chat_messages)**
```json
{
  "date": "2024-11-20",
  "messages": [
    { "role": "user", "content": "...", "timestamp": "..." },
    { "role": "assistant", "content": "...", "timestamp": "..." }
  ]
}
```

- **AI 응답**: Google Gemini API (SSE 스트리밍)
- **컨텍스트**: 이전 5개 메시지 포함
- **저장**: 프론트엔드 IndexedDB만 저장 (백엔드 저장 안 함)

#### 3.2.2 대화 종료 및 분석
**POST /chat/end - 전체 대화 전송**
```json
{
  "date": "2024-11-20",
  "messages": [ /* 전체 대화 내역 */ ]
}
```

**Response - 분석 결과**
```json
{
  "diaryId": "diary_456",
  "emotion": "슬픔",
  "summary": "...",
  "keywords": ["친구", "갈등"],
  "advice": "...",
  "pictureUrl": "..."
}
```

#### 3.2.3 감정 분류 시스템
- **5가지 감정**: 기쁨, 슬픔, 화남, 불안, 평온
- **분류 로직**: AI가 대화 내용 분석
- **시각화**: 감정별 색상 + 아이콘

#### 3.2.4 그림일기 생성
- **AI 서비스**: DALL-E 또는 Stable Diffusion
- **프롬프트**: "감정 + 키워드 + 고양이 테마"
- **예시**: "친구와 다투는 슬픈 고양이, 파스텔톤, 따뜻한 분위기"
- **저장**: S3 업로드 후 URL 반환

### 3.3 일기 관리

#### 3.3.1 캘린더 뷰
- **월별 조회**: 현재 월 기준 일기 존재 여부
- **일기 표시**: 감정 아이콘으로 날짜 마킹
- **빈 날짜**: 회색 처리
- **오늘**: 테두리 강조

#### 3.3.2 일기 상세 페이지
- **그림일기**: 상단 큰 이미지
- **감정 배지**: 감정 + 색상
- **키워드**: 태그 형태
- **요약**: 본문 텍스트
- **조언**: 달이의 조언 말풍선
- **대화 기록**: 토글로 펼쳐보기

#### 3.3.3 일기 CRUD
- **생성**: 채팅 종료 시 자동 생성
- **조회**: 날짜별 조회
- **수정**: 요약문 수정 가능
- **삭제**: 삭제 확인 후 제거 (복구 불가 경고)

### 3.4 익명 응원 시스템

#### 3.4.1 응원 메시지 전송
- **랜덤 매칭**: 본인 제외 무작위 사용자 선택
- **완전 익명**: 발신자 정보 미노출
- **글자 수**: 10-100자
- **감정 선택**: 응원, 격려, 위로, 축하
- **제한**: 하루 최대 5개

#### 3.4.2 응원 메시지 수신
- **알림**: 홈 화면 우편함 애니메이션
- **localStorage**: received_messages 배열
- **읽음 처리**: 클릭 시 isRead: true
- **카운트**: 읽지 않은 메시지 개수 배지

### 3.5 통계 및 인사이트

#### 3.5.1 감정 통계
- **월별 분포**: 5가지 감정 비율 (파이 차트)
- **감정 트렌드**: "상승", "하락", "유지"
- **가장 많은 감정**: 이모지 + 텍스트

#### 3.5.2 작성 통계
- **총 일기 수**: 누적 작성 일수
- **연속 작성일**: 배지 형태
- **월별 작성률**: 퍼센트 표시

#### 3.5.3 응원 메시지 통계
- **받은 응원**: 총 개수
- **보낸 응원**: 총 개수
- **이번 달**: 이번 달 받은/보낸 개수

### 3.6 설정 및 부가 기능

#### 3.6.1 다크모드
- **토글**: 설정 페이지
- **저장**: localStorage (dark_mode)
- **자동 적용**: 페이지 로드 시

#### 3.6.2 튜토리얼
- **최초 1회**: 홈 화면 진입 시
- **5단계**: 채팅, 일기장, 응원, 통계, 설정 순서
- **건너뛰기**: 가능
- **재시청**: 설정에서 가능

#### 3.6.3 알림 설정
- **브라우저 알림**: 권한 요청
- **응원 메시지**: 신규 도착 알림
- **일기 작성**: 매일 오후 9시 리마인더

#### 3.6.4 계정 관리
- **로그아웃**: 토큰 삭제 후 로그인 페이지
- **회원 탈퇴**: 확인 모달 후 계정 삭제

---

## 🗄️ 4. 데이터 아키텍처

### 4.1 프론트엔드 저장소 (IndexedDB)

#### Database: catus_db

**Store 1: chat_messages**
```json
{
  "id": "2024-11-20",
  "date": "2024-11-20",
  "messages": [
    {
      "role": "user | assistant",
      "content": "메시지 내용",
      "timestamp": "ISO 8601"
    }
  ],
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

**Store 2: diaries (캐시용)**
```json
{
  "id": "diary_456",
  "date": "2024-11-20",
  "emotion": "슬픔",
  "summary": "...",
  "pictureUrl": "...",
  "keywords": ["친구", "갈등"],
  "advice": "...",
  "messages": [],
  "createdAt": "ISO 8601"
}
```

### 4.2 localStorage 사용

| Key | Type | Description |
|-----|------|-------------|
| auth_token | string | JWT Access Token |
| refresh_token | string | JWT Refresh Token |
| user_info | object | 사용자 기본 정보 |
| onboarding_completed | boolean | 온보딩 완료 여부 |
| dark_mode | boolean | 다크모드 설정 |
| tutorial_completed | boolean | 튜토리얼 완료 여부 |
| received_messages | array | 받은 응원 메시지 |
| last_checked_received_count | number | 마지막 확인 메시지 수 |
| support_tutorial_shown | boolean | 응원 튜토리얼 표시 여부 |

### 4.3 백엔드 데이터베이스 (PostgreSQL)

**주요 테이블**:
- `users`: 사용자 정보
- `diaries`: 일기 (분석 결과만 저장, 대화 내역 포함)
- `support_messages`: 익명 응원 메시지
- `emotions_stats`: 감정 통계 (집계 테이블)

**⚠️ 중요**: 채팅 메시지는 백엔드에 저장하지 않음 (프론트 IndexedDB만)

---

## 🎨 5. UI/UX 디자인 원칙

### 5.1 디자인 시스템

#### 색상 팔레트
**Light Mode**
- Primary: #FF9E9E (메인 핑크)
- Secondary: #FFD6A5 (서브 오렌지)
- Background: #FFF9F0 (베이지 배경)
- Text Primary: #2D2D2D (메인 텍스트)

**Dark Mode**
- Primary Dark: #FF7E7E
- Background Dark: #1A1A1A
- Text Dark: #E5E5E5

**감정 색상**
- 기쁨 (Joy): #FFD93D (노란색)
- 슬픔 (Sad): #6C9BCF (파란색)
- 화남 (Angry): #FF6B6B (빨간색)
- 불안 (Anxious): #B088F9 (보라색)
- 평온 (Calm): #7FD1AE (초록색)

#### 타이포그래피
- **헤더**: Pretendard Bold, 24-32px
- **본문**: Pretendard Regular, 14-16px
- **캡션**: Pretendard Light, 12px

### 5.2 애니메이션

#### Framer Motion 사용
- **페이지 전환**: Fade + Slide (300ms)
- **고양이 클릭**: Scale bounce (200ms)
- **일기 공개**: Reveal 애니메이션 (1000ms)
- **응원 메시지**: Float up (500ms)

#### 인터랙션
- **버튼 호버**: Scale 1.05 + 그림자
- **카드 호버**: Lift (translateY -4px)
- **로딩**: 고양이 점프 애니메이션

### 5.3 반응형 디자인
- **모바일 퍼스트**: 360px 기준
- **브레이크포인트**:
  - Mobile: 360-767px
  - Tablet: 768-1023px
  - Desktop: 1024px+

---

## 🔧 6. 기술 구현 세부사항

### 6.1 상태 관리

#### Context API 구조
**AuthContext: 인증 상태**
```javascript
{
  user: { id, nickname, profileImage, onboardingCompleted },
  isAuthenticated: boolean,
  login: (token) => void,
  logout: () => void
}
```

**DarkModeContext: 테마 상태**
```javascript
{
  isDarkMode: boolean,
  toggleDarkMode: () => void
}
```

**TutorialContext: 튜토리얼 상태**
```javascript
{
  isTutorialCompleted: boolean,
  currentStep: number,
  startTutorial: () => void,
  completeTutorial: () => void
}
```

### 6.2 Custom Hooks

```javascript
// useChat: 채팅 관리
const { messages, sendMessage, endConversation, isLoading } = useChat();

// useDiary: 일기 관리
const { diaries, getDiary, createDiary, updateDiary, deleteDiary } = useDiary();

// useSupport: 응원 메시지 관리
const { received, sent, sendMessage, markAsRead } = useSupport();

// useLocalStorage: localStorage 래퍼
const [value, setValue] = useLocalStorage(key, initialValue);
```

### 6.3 API 통신

#### Axios 인스턴스
```javascript
// utils/api.js
const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor: JWT 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: 토큰 만료 시 갱신
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token 로직
    }
    return Promise.reject(error);
  }
);
```

### 6.4 성능 최적화

#### React Query 사용
```javascript
// 캘린더 데이터 캐싱
const { data: diaries } = useQuery({
  queryKey: ['diaries', year, month],
  queryFn: () => diaryApi.getList(year, month),
  staleTime: 5 * 60 * 1000,  // 5분
  cacheTime: 10 * 60 * 1000  // 10분
});
```

#### 이미지 최적화
- **Lazy Loading**: loading="lazy" 속성
- **WebP 포맷**: 그림일기 이미지
- **리사이징**: S3 업로드 시 자동 리사이징

---

## 📊 7. 성공 지표 (KPI)

### 7.1 핵심 지표
- **DAU (Daily Active Users)**: 일일 활성 사용자 수
- **일기 작성률**: 가입자 대비 일기 작성 비율
- **연속 작성일**: 7일 이상 연속 작성 비율
- **응원 메시지**: 일 평균 전송/수신 건수
- **채팅 세션**: 평균 대화 턴 수 (10턴 이상 목표)

### 7.2 사용자 행동 지표
- **온보딩 완료율**: 95% 이상
- **첫 일기 생성**: 가입 후 24시간 이내 80%
- **재방문율**: 7일 이내 재방문 60%
- **평균 체류 시간**: 10분 이상

### 7.3 비즈니스 지표
- **회원 가입 수**: 월 성장률 20%
- **이탈률**: 월 이탈률 30% 이하
- **NPS (Net Promoter Score)**: 40 이상

---

## 🚀 8. 개발 로드맵

### Phase 1: MVP (4주)
- ✅ 카카오 로그인
- ✅ 온보딩 플로우
- ✅ AI 채팅 (Gemini)
- ✅ 일기 자동 생성
- ✅ 캘린더 뷰

### Phase 2: 핵심 기능 (3주)
- ✅ 익명 응원 시스템
- ✅ 그림일기 생성 (DALL-E)
- ✅ 감정 통계
- ⏳ 튜토리얼 시스템

### Phase 3: 고도화 (4주)
- ⏳ 푸시 알림
- ⏳ 고급 통계 (트렌드 분석)
- ⏳ 테마 커스터마이징
- ⏳ 소셜 공유 기능

### Phase 4: 성능 최적화 (2주)
- ⏳ 이미지 최적화
- ⏳ 번들 크기 최적화
- ⏳ SEO 최적화
- ⏳ PWA 지원

---

## 📝 부록

### A. 비즈니스 로직 예외사항

1. **일기 중복 생성 방지**: 같은 날짜에 2개 이상 생성 불가
2. **응원 메시지 제한**: 하루 5개, 본인에게 전송 불가
3. **채팅 메시지**: IndexedDB 저장 → 30일 후 자동 삭제
4. **그림일기 생성 실패**: 기본 이미지로 대체
5. **AI 응답 지연**: 30초 타임아웃 후 재시도 유도

### B. 보안 요구사항

1. **JWT 토큰**: HttpOnly 쿠키 사용 권장 (XSS 방지)
2. **HTTPS**: 프로덕션 필수
3. **Rate Limiting**: API 요청 제한 (30/분)
4. **CORS**: 화이트리스트 기반
5. **민감 정보**: 환경 변수로 관리

### C. 참고 문서

- [API_ENDPOINTS.md](./backend/API_ENDPOINTS.md) - API 명세서
- [DATABASE_SCHEMA.md](./backend/DATABASE_SCHEMA.md) - 데이터베이스 스키마
- [AUTHENTICATION.md](./backend/AUTHENTICATION.md) - 인증 가이드
- [프론트엔드 문서 01](./01_프론트API_명세서.md)
- [프론트엔드 문서 03](./03_전체_플로우.md)

---

**작성자**: CATUS 개발팀
**문서 버전**: 1.0.0
**최종 업데이트**: 2024-11-20
