제공해주신 서비스 플로우와 알고리즘 개발 내용을 바탕으로 도메인별 기능명세서와 API 명세서를 작성해드리겠습니다.

# 📋 그림일기 챗봇 서비스 기능명세서

## 1. 도메인별 기능 명세

### 👤 회원 도메인 (User Domain)

#### 회원가입 및 인증
- **카카오 소셜 로그인**
  - [x] 카카오 OAuth 2.0 인증 처리
  - [x] 최초 로그인 시 추가 정보 입력 화면으로 이동
  - [x] 재로그인 시 홈 화면으로 바로 이동
  - [x] JWT 토큰 발급 및 관리

- **회원 정보 관리**
  - [x] 닉네임 설정 및 수정
  - [x] 비밀번호 설정 및 변경 (선택사항)
  - [x] 프로필 정보 저장
  - [x] 회원 탈퇴 기능

### 💬 채팅 도메인 (Chat Domain)

- **대화 관리**
  - [x] 사용자-AI 채팅 인터페이스
  - [x] Gemini API 기반 응답 생성
  - [x] 실시간 대화 내용 비동기 DB 저장
  - [x] 대화 컨텍스트 유지
  - [x] 신조어 인식 및 정규화 처리

- **대화 분석**
  - [x] 형태소 분석 및 토큰화
  - [x] Big5 키워드 매핑
  - [x] 감정 점수 실시간 계산
  - [x] 대화 이력 관리

### 📔 일기 도메인 (Diary Domain)

- **일기 생성**
  - [x] 설정된 시간에 자동 일기 생성
  - [x] 당일 대화 내용 기반 일기 작성
  - [x] Gemini를 통한 그림 생성
  - [x] 5가지 감정 중 1개 자동 선정 (행복, 슬픔, 화남, 보통, 불안)
  - [x] 일기 내용 DB 저장

- **일기 관리**
  - [x] 일기 조회 (캘린더 뷰)
  - [x] 일기 상세 보기 (그림, 감정, 내용, 익명 메시지)
  - [x] 일기 수정 (감정, 내용)
  - [x] 일기 삭제

### 💌 메시지 도메인 (Message Domain)

- **익명 메시지 시스템**
  - [x] 생성된 일기를 무작위 사용자에게 전송
  - [x] 익명 응원 메시지 작성
  - [x] 메시지 수신 알림
  - [x] 메시지 조회 (답장 불가)
  - [x] 알림 설정 관리

### 🧠 성격 분석 도메인 (Personality Domain)

- **Big5 성격 분석**
  - [x] 초기 10개 질문 기반 성격 테스트
  - [x] Big5 점수 계산 및 저장
  - [x] 주간 EMA 기반 점수 업데이트 (0.15 이상 변경 제한)
  - [x] 성격 분석 결과 시각화
  - [x] 성격 변화 추이 관리

- **신조어 학습 시스템**
  - [x] 미인식 신조어 수집
  - [x] 주간 배치 AI 학습
  - [x] 신조어 사전 자동 업데이트
  - [x] Big5 연관성 분석

### ⚙️ 설정 도메인 (Settings Domain)

- **사용자 설정**
  - [x] 일기 생성 시간 설정
  - [x] 알림 설정 (익명 메시지)
  - [x] 다크모드 설정
  - [x] 언어 설정 (추후 확장)

---

## 2. API 명세서

### 🔐 인증 API

| Method | URI | Description | Request Body | Response | Auth |
|--------|-----|-------------|--------------|----------|------|
| POST | `/api/auth/kakao` | 카카오 로그인 | `{ code: string }` | `{ accessToken, refreshToken, isNewUser }` | No |
| POST | `/api/auth/signup` | 추가 정보 입력 | `{ nickname, password?, diaryTime }` | `{ userId, message }` | Yes |
| POST | `/api/auth/refresh` | 토큰 갱신 | `{ refreshToken }` | `{ accessToken, refreshToken }` | No |
| POST | `/api/auth/logout` | 로그아웃 | - | `{ message }` | Yes |
| DELETE | `/api/auth/withdraw` | 회원 탈퇴 | `{ password? }` | `{ message }` | Yes |

### 💬 채팅 API

| Method | URI | Description | Request Body | Response | Auth |
|--------|-----|-------------|--------------|----------|------|
| POST | `/api/chat/message` | 메시지 전송 | `{ message, timestamp }` | `{ aiResponse, messageId }` | Yes |
| GET | `/api/chat/history` | 대화 이력 조회 | - | `{ messages[], pagination }` | Yes |
| GET | `/api/chat/context/{date}` | 특정 날짜 대화 조회 | - | `{ messages[], totalCount }` | Yes |
| POST | `/api/chat/analyze` | 대화 분석 요청 | `{ messages[] }` | `{ emotionScore, keywords[] }` | Yes |

### 📔 일기 API

| Method | URI | Description | Request Body | Response | Auth |
|--------|-----|-------------|--------------|----------|------|
| POST | `/api/diary/generate` | 일기 자동 생성 | `{ date, chatLogs[] }` | `{ diaryId, content, image, emotion }` | System |
| GET | `/api/diary/list` | 일기 목록 조회 | `?year&month` | `{ diaries[], totalCount }` | Yes |
| GET | `/api/diary/{id}` | 일기 상세 조회 | - | `{ diary, anonymousMessages[] }` | Yes |
| PUT | `/api/diary/{id}` | 일기 수정 | `{ content?, emotion? }` | `{ diary }` | Yes |
| DELETE | `/api/diary/{id}` | 일기 삭제 | - | `{ message }` | Yes |
| GET | `/api/diary/random` | 랜덤 일기 조회 | - | `{ diary }` | Yes |

### 💌 메시지 API

| Method | URI | Description | Request Body | Response | Auth |
|--------|-----|-------------|--------------|----------|------|
| POST | `/api/message/send` | 익명 메시지 전송 | `{ diaryId, content }` | `{ messageId }` | Yes |
| GET | `/api/message/received` | 받은 메시지 조회 | `?page&size` | `{ messages[], pagination }` | Yes |
| GET | `/api/message/notifications` | 알림 조회 | - | `{ notifications[], unreadCount }` | Yes |
| PUT | `/api/message/read/{id}` | 메시지 읽음 처리 | - | `{ message }` | Yes |

### 🧠 Big5 성격 분석 API

| Method | URI | Description | Request Body | Response | Auth |
|--------|-----|-------------|--------------|----------|------|
| POST | `/api/big5/initial` | 초기 성격 테스트 | `{ answers[] }` | `{ scores, analysis }` | Yes |
| GET | `/api/big5/current` | 현재 성격 점수 조회 | - | `{ scores, lastUpdated }` | Yes |
| GET | `/api/big5/history` | 성격 변화 이력 | `?period` | `{ history[], chartData }` | Yes |
| POST | `/api/big5/analyze/sentence` | 문장 Big5 분석 | `{ sentence }` | `{ scores, keywords[] }` | System |
| POST | `/api/big5/update/ema` | EMA 업데이트 (배치) | - | `{ updatedScores }` | System |

### 🔧 신조어 학습 API

| Method | URI | Description | Request Body | Response | Auth |
|--------|-----|-------------|--------------|----------|------|
| POST | `/api/slang/unknown` | 미인식 단어 등록 | `{ term, context }` | `{ termId }` | System |
| GET | `/api/slang/dictionary` | 신조어 사전 조회 | `?page&size` | `{ terms[], pagination }` | Admin |
| POST | `/api/slang/learn` | 신조어 학습 (배치) | - | `{ learnedCount, newTerms[] }` | System |
| PUT | `/api/slang/{id}` | 신조어 매핑 수정 | `{ mapping, big5Score }` | `{ term }` | Admin |

### ⚙️ 설정 API

| Method | URI | Description | Request Body | Response | Auth |
|--------|-----|-------------|--------------|----------|------|
| GET | `/api/settings` | 설정 조회 | - | `{ settings }` | Yes |
| PUT | `/api/settings/diary-time` | 일기 생성 시간 변경 | `{ time }` | `{ settings }` | Yes |
| PUT | `/api/settings/notifications` | 알림 설정 변경 | `{ anonymous: boolean }` | `{ settings }` | Yes |
| PUT | `/api/settings/theme` | 테마 설정 변경 | `{ darkMode: boolean }` | `{ settings }` | Yes |
| PUT | `/api/settings/profile` | 프로필 수정 | `{ nickname, password? }` | `{ profile }` | Yes |

### 🤖 배치 작업 API (내부용)

| Method | URI | Description | Request Body | Response | Auth |
|--------|-----|-------------|--------------|----------|------|
| POST | `/api/batch/diary/generate` | 일기 일괄 생성 | `{ targetTime }` | `{ generatedCount }` | System |
| POST | `/api/batch/big5/weekly-update` | 주간 Big5 업데이트 | - | `{ updatedUsers }` | System |
| POST | `/api/batch/slang/learn` | 신조어 주간 학습 | - | `{ learnedTerms }` | System |
| POST | `/api/batch/diary/distribute` | 일기 무작위 배포 | `{ diaryIds[] }` | `{ distributedCount }` | System |

---

## 3. 데이터베이스 스키마 요구사항

### 핵심 테이블
- `users` - 사용자 정보
- `chat_logs` - 채팅 로그
- `diaries` - 일기 정보
- `anonymous_messages` - 익명 메시지
- `personality_state` - 현재 Big5 점수
- `analysis_history` - Big5 분석 이력
- `sentence_analysis` - 문장별 분석 결과
- `big5_dictionary` - Big5 키워드 사전
- `slang_dictionary` - 신조어 사전
- `unknown_terms` - 미인식 용어
- `system_config` - 시스템 설정값

---

## 4. 외부 연동 사양

### Gemini API
- 채팅 응답 생성
- 일기 내용 생성
- 그림 생성 (DALL-E 또는 Stable Diffusion 대체 가능)
- 신조어 Big5 연관성 분석

### Kakao OAuth
- 소셜 로그인 인증
- 사용자 기본 정보 획득

---

## 5. 비기능 요구사항

### 성능
- 채팅 응답 시간: 3초 이내
- 일기 생성: 10초 이내
- 동시 접속자: 1,000명 이상

### 보안
- JWT 기반 인증
- 익명 메시지 발신자 정보 암호화
- 개인정보 암호화 저장

### 확장성
- 마이크로서비스 아키텍처 고려
- 캐싱 전략 (Redis)
- 메시지 큐 (RabbitMQ/Kafka) 도입 검토

이 명세서를 기반으로 Spring Boot 백엔드 개발을 진행하시면 됩니다. 추가로 필요한 API나 기능이 있다면 말씀해 주세요!