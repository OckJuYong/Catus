# Catus 프로젝트 인수인계 요약서

**프로젝트명**: Catus (AI 친구 일기 서비스)
**작성일**: 2025-01-17
**작성자**: 개발팀
**인수자**: [인수자명]

---

## 1. 프로젝트 개요

### 서비스 소개
**Catus**는 AI 친구 "달이"와 대화하며 하루를 기록하고, 감정을 분석하는 일기 서비스입니다.

### 핵심 가치
- 💬 **자연스러운 대화**: Gemini AI 기반 친구 같은 대화
- 🎨 **자동 일기 생성**: 대화 기반 그림일기 자동 생성
- 📊 **감정 분석**: 주간/월간 감정 패턴 리포트
- 🔒 **프라이버시 우선**: 사용자 데이터 보호

### 기술 스택

**프론트엔드**:
- React 19.1.1 + Vite 7.1.7 (빠른 빌드, HMR)
- TailwindCSS 4.1.16 (유틸리티 스타일링)
- Framer Motion 12.23 (부드러운 애니메이션)
- React Query 5.90.7 (서버 상태 관리)
- PWA 지원 (오프라인, 앱 설치)

**백엔드**:
- Node.js + Express 5.1.0 (REST API)
- Supabase 2.81.1 (PostgreSQL 데이터베이스)
- JWT 9.0.2 (토큰 기반 인증)
- Gemini Flash API (AI 대화)
- node-cron 4.2.1 (스케줄링 작업)

---

## 2. 시스템 아키텍처

### 전체 구조

```
┌──────────────────┐
│  프론트엔드       │  React PWA (모바일 최적화)
│  (Vite + React)  │  - 채팅, 일기, 감정 리포트
└────────┬─────────┘
         │ REST API (JWT 인증)
         ▼
┌──────────────────┐      ┌──────────────┐
│  백엔드          │──────▶│  Gemini API  │
│  (Node.js)       │      │  (AI 대화)   │
└────────┬─────────┘      └──────────────┘
         │
         ▼
┌──────────────────┐
│  데이터베이스     │  Supabase (PostgreSQL)
│  (Supabase)      │  - 사용자, 메시지, 일기, 감정
└──────────────────┘
```

### 주요 데이터 흐름

**채팅 → 일기 생성**:
1. 사용자가 "달이"와 대화 (ChatPage)
2. 메시지가 Supabase `messages` 테이블에 저장
3. Gemini API가 대화 맥락 기반 응답 생성
4. 자정에 스케줄러가 대화 내역 → 일기 자동 생성
5. 일기가 `diaries` 테이블에 저장
6. 캘린더/홈에서 일기 조회 가능

**감정 분석**:
1. 대화 중 또는 종료 시 사용자 감정 선택
2. `emotions` 테이블에 저장 (날짜별 1개)
3. 감정 리포트 페이지에서 주간/월간 집계
4. 차트로 시각화 + 공유 기능

---

## 3. 핵심 기능

### 3.1 인증 (Authentication)
- 이메일/비밀번호 로그인 + 카카오 OAuth
- JWT Access Token (1시간) + Refresh Token (7일)
- 자동 토큰 갱신

### 3.2 채팅 (Chat)
- AI "달이"와 실시간 대화
- Gemini Flash API 연동 (응답 시간 2-5초)
- 로컬 스토리지에 오프라인 캐싱
- 대화 종료 시 감정 선택

### 3.3 일기 (Diary)
- 대화 기반 자동 생성 (스케줄러)
- 캘린더 뷰로 월별 조회
- 감정별 색상 코드 (행복: 초록, 슬픔: 파랑 등)
- 공유 기능 (이미지 변환)

### 3.4 감정 리포트 (Emotion Report)
- 주간/월간 감정 분석
- 가장 많이 느낀 감정, 평균 강도
- 막대 그래프 + 캘린더 뷰
- 리포트 공유 (Web Share API)

### 3.5 설정 (Settings)
- 일기 생성 시간 설정
- 알림 ON/OFF (Web Push)
- AI 대화 스타일 (반말/존댓말)
- 다크모드

### 3.6 프리미엄 (Premium)
- 무료: 하루 10회 대화 제한
- 프리미엄: 무제한 대화 + 고급 리포트

---

## 4. 데이터베이스 스키마 (Supabase)

### 주요 테이블

**users** (사용자):
- `user_id` (UUID, PK)
- `email`, `password_hash`, `nickname`
- `is_premium`, `premium_until`

**messages** (대화):
- `message_id` (UUID, PK)
- `user_id` (FK)
- `sender` ('user' | 'ai')
- `content`, `date`, `created_at`

**diaries** (일기):
- `diary_id` (UUID, PK)
- `user_id` (FK)
- `date`, `emotion`, `content`, `image_url`

**emotions** (감정 기록):
- `emotion_id` (UUID, PK)
- `user_id` (FK)
- `date`, `emotion`, `intensity`
- UNIQUE(user_id, date) → 하루 1개만

**user_settings** (설정):
- `user_id` (FK)
- `alarm_time`, `notification_enabled`
- `ai_style`, `dark_mode`

**daily_usage** (사용량):
- `user_id`, `date`, `message_count`
- 무료 사용자 제한 체크용

---

## 5. API 엔드포인트 (주요)

### 인증
```
POST /auth/login          # 로그인
POST /auth/register       # 회원가입
POST /auth/refresh        # 토큰 갱신
```

### 채팅
```
POST /chat/messages       # 메시지 전송
GET  /chat/messages       # 대화 내역 조회
POST /chat/end            # 대화 종료
```

### 일기
```
GET  /diaries             # 일기 목록
GET  /diaries/:diaryId    # 일기 상세
PUT  /diaries/:diaryId    # 일기 수정
DELETE /diaries/:diaryId  # 일기 삭제
```

### 감정
```
POST /emotions            # 감정 기록
GET  /emotions/report     # 감정 리포트 (주간/월간)
```

### 설정
```
GET  /settings            # 설정 조회
PUT  /settings            # 설정 업데이트
```

### 사용량
```
GET  /usage/today         # 오늘의 사용량 (남은 횟수)
```

---

## 6. 개선 필요 사항 (우선순위)

### 🔴 우선순위 1 (2주 이내)
1. **공유 기능**: 일기/리포트 이미지 변환 후 공유
2. **알람 완전 구현**: Web Push Notification 발송 로직
3. **감정 선택 개선**: 대화 중간 자연스럽게 + 하루 1회 제한

### 🟡 우선순위 2 (4주 이내)
4. **Gemini 응답 속도 단축**: 스트리밍 응답 구현 (2-5초 → 즉시 타이핑)
5. **설정 로딩 개선**: 낙관적 업데이트 (React Query)
6. **감정 리포트 완성**: 차트 + 분석 + 공유

### 🟢 우선순위 3 (6주 이내)
7. **온보딩 개선**: 감정 테스트 단계 추가
8. **대화 횟수 제한**: 무료 10회/일, 프리미엄 무제한
9. **코드 정리**: `created_at` 유틸리티 함수화

---

## 7. 배포 환경

### 프론트엔드
- **개발**: `http://localhost:5173` (Vite dev server)
- **프로덕션**: Vercel 또는 Netlify 배포
- **환경 변수**:
  ```
  VITE_API_BASE_URL=http://localhost:8080/api/v1
  ```

### 백엔드
- **개발**: `http://localhost:8080`
- **프로덕션**: Vercel Serverless 또는 Railway
- **환경 변수**:
  ```
  GEMINI_API_KEY=your_key
  SUPABASE_URL=your_url
  SUPABASE_KEY=your_key
  JWT_SECRET=your_secret
  ```

### 데이터베이스
- Supabase 클라우드 (PostgreSQL)
- 백업: 매일 자동 (Supabase 기본)

---

## 8. 개발 시작 가이드

### 프론트엔드 실행

```bash
cd catus
npm install
npm run dev
# → http://localhost:5173
```

### 백엔드 실행

```bash
cd catus-backend-node
npm install
node index.js
# → http://localhost:8080
```

### 환경 변수 설정

1. `.env` 파일 생성 (백엔드)
2. Gemini API 키, Supabase 정보 입력
3. 프론트엔드 `.env` 생성 후 API URL 설정

---

## 9. 문제 발생 시 체크리스트

### 프론트엔드 빌드 실패
- [ ] `node_modules` 삭제 후 재설치
- [ ] `package-lock.json` 삭제 후 재설치
- [ ] Node.js 버전 확인 (v18 이상)

### 백엔드 API 오류
- [ ] 환경 변수 확인 (GEMINI_API_KEY 등)
- [ ] Supabase 연결 확인
- [ ] 로그 확인 (`console.log` 출력)

### Gemini API 느림
- [ ] 스트리밍 응답 구현 확인
- [ ] API 키 할당량 확인
- [ ] 네트워크 상태 확인

### 알람 발송 안 됨
- [ ] node-cron 스케줄러 실행 확인
- [ ] Web Push 구독 등록 확인
- [ ] VAPID 키 설정 확인

---

## 10. 연락처 및 리소스

### 문서
- **백엔드 API 명세서**: `CATUS_BACKEND_API_SPEC.md`
- **프론트엔드 기능 명세서**: `CATUS_FRONTEND_SPEC.md`
- **개선 계획 보고서**: `filling/sllm-hbu/docs/CATUS_IMPROVEMENT_PLAN_REPORT.md`

### 외부 서비스
- **Gemini API**: https://ai.google.dev/
- **Supabase**: https://supabase.com/
- **Vercel** (배포): https://vercel.com/

### GitHub Repository
- **프론트엔드**: `catus/` 폴더
- **백엔드**: `catus-backend-node/` 폴더

---

## 부록: 빠른 참조

### 감정 코드
```
행복: #6BCB77 😊
슬픔: #4D96FF 😢
보통: #9E9E9E 😐
화남: #FF6B6B 😠
불안: #FFD93D 😰
```

### 주요 상수
- 무료 사용자 대화 제한: **10회/일**
- Access Token 유효기간: **1시간**
- Refresh Token 유효기간: **7일**
- 일기 생성 시간: **매일 자정** (사용자 설정 시간)

---

**인수인계 완료 체크리스트**:
- [ ] 프론트엔드 로컬 실행 확인
- [ ] 백엔드 로컬 실행 확인
- [ ] 환경 변수 설정 완료
- [ ] API 연동 테스트 (로그인, 채팅)
- [ ] 데이터베이스 연결 확인
- [ ] 문서 숙지 (API 명세, 기능 명세)
- [ ] 개선 계획 확인
- [ ] 배포 환경 접근 권한 확인

**인수자 서명**: _________________
**인계자 서명**: _________________
**날짜**: 2025-01-17
