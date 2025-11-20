# 📋 그림일기 챗봇 서비스 기능명세서 (v2.0)

## 업데이트 내역
- v2.0: AI 선제 대화 시작 기능 추가 (푸시 알림 기반)

---

## 1. 도메인별 기능 명세

### 👤 회원 도메인 (User Domain)

#### 회원가입 및 인증
- [x] 카카오 OAuth 2.0 인증 처리
- [x] 최초 로그인 시 추가 정보 입력 화면으로 이동
- [x] 재로그인 시 홈 화면으로 바로 이동
- [x] JWT 토큰 발급 및 관리
- [x] **[NEW]** FCM 디바이스 토큰 등록 및 관리

#### 회원 정보 관리
- [x] 닉네임 설정 및 수정
- [x] 비밀번호 설정 및 변경 (선택사항)
- [x] 프로필 정보 저장
- [x] **[NEW]** 푸시 알림 수신 동의 관리
- [x] 회원 탈퇴 기능

### 💬 채팅 도메인 (Chat Domain)

#### 대화 관리
- [x] 사용자-AI 채팅 인터페이스
- [x] Gemini API 기반 응답 생성
- [x] 실시간 대화 내용 비동기 DB 저장
- [x] 대화 컨텍스트 유지
- [x] 신조어 인식 및 정규화 처리
- [x] **[NEW]** AI 선제 대화 시작 (푸시 알림 통해)
- [x] **[NEW]** 대화 세션 자동 생성 (푸시 응답 시)

#### 대화 분석
- [x] 형태소 분석 및 토큰화
- [x] Big5 키워드 매핑
- [x] 감정 점수 실시간 계산
- [x] 대화 이력 관리
- [x] **[NEW]** 대화 패턴 분석 (선제 대화 트리거용)

### 🔔 알림 도메인 (Notification Domain) **[NEW]**

#### AI 선제 대화 알림
- [x] **시간 기반 알림**
  - 아침 인사 (오전 8시)
  - 점심 체크인 (오후 12시 30분)
  - 저녁 일기 리마인더 (오후 9시)
  - 주말 특별 메시지 (주말 오전 10시)
  - 사용자 커스텀 시간 설정

- [x] **이벤트 기반 알림**
  - 3일 이상 미접속 시 안부 메시지
  - 연속 3일 이상 부정적 감정 감지 시 위로 메시지
  - 7일 연속 일기 작성 달성 시 축하 메시지
  - 날씨 연동 메시지 (비오는 날 위로 등)
  - 특별한 날 메시지 (생일, 기념일)

- [x] **패턴 기반 알림**
  - 스트레스 지수 상승 감지 (Big5 기반)
  - 행복도 저하 감지
  - 일상 루틴 변화 감지
  - 수면 패턴 이상 감지 (대화 시간 분석)

#### 푸시 알림 관리
- [x] FCM/APNs 통합 관리
- [x] 디바이스 토큰 관리
- [x] 알림 히스토리 저장
- [x] 알림 클릭률 추적
- [x] 알림 카테고리별 on/off 설정

### 📔 일기 도메인 (Diary Domain)

#### 일기 생성
- [x] 설정된 시간에 자동 일기 생성
- [x] 당일 대화 내용 기반 일기 작성
- [x] Gemini를 통한 그림 생성
- [x] 5가지 감정 중 1개 자동 선정
- [x] **[NEW]** 푸시 알림 통한 일기 작성 유도
- [x] 일기 내용 DB 저장

#### 일기 관리
- [x] 일기 조회 (캘린더 뷰)
- [x] 일기 상세 보기
- [x] 일기 수정 (감정, 내용)
- [x] 일기 삭제

### 💌 메시지 도메인 (Message Domain)

#### 익명 메시지 시스템
- [x] 생성된 일기를 무작위 사용자에게 전송
- [x] 익명 응원 메시지 작성
- [x] 메시지 수신 알림
- [x] **[NEW]** 응원 메시지 받았을 때 감사 푸시 알림
- [x] 메시지 조회 (답장 불가)
- [x] 알림 설정 관리

### 🧠 성격 분석 도메인 (Personality Domain)

#### Big5 성격 분석
- [x] 초기 10개 질문 기반 성격 테스트
- [x] Big5 점수 계산 및 저장
- [x] 주간 EMA 기반 점수 업데이트
- [x] 성격 분석 결과 시각화
- [x] 성격 변화 추이 관리
- [x] **[NEW]** 성격 기반 맞춤형 푸시 메시지 생성

#### 신조어 학습 시스템
- [x] 미인식 신조어 수집
- [x] 주간 배치 AI 학습
- [x] 신조어 사전 자동 업데이트
- [x] Big5 연관성 분석

### ⚙️ 설정 도메인 (Settings Domain)

#### 사용자 설정
- [x] 일기 생성 시간 설정
- [x] 알림 설정 (익명 메시지)
- [x] **[NEW]** AI 선제 대화 알림 설정
  - 알림 받을 시간대 설정
  - 알림 빈도 설정 (하루 1~3회)
  - 알림 유형별 on/off
  - 방해 금지 시간 설정
- [x] 다크모드 설정
- [x] 언어 설정

---

## 2. API 명세서 (추가분)

### 🔔 푸시 알림 API (Push Notification) **[NEW]**

| Method | URI | Description | Request Body | Response | Auth |
|--------|-----|-------------|--------------|----------|------|
| POST | `/api/push/register` | FCM 토큰 등록 | `{ deviceToken, deviceType, deviceInfo }` | `{ deviceId, message }` | Yes |
| PUT | `/api/push/update` | FCM 토큰 갱신 | `{ deviceToken }` | `{ message }` | Yes |
| DELETE | `/api/push/unregister` | 디바이스 등록 해제 | - | `{ message }` | Yes |
| GET | `/api/push/history` | 푸시 알림 히스토리 | `?page&size` | `{ notifications[], pagination }` | Yes |
| POST | `/api/push/test` | 테스트 푸시 발송 | `{ message }` | `{ success }` | Yes |

### 🤖 AI 선제 대화 API (Proactive Chat) **[NEW]**

| Method | URI | Description | Request Body | Response | Auth |
|--------|-----|-------------|--------------|----------|------|
| POST | `/api/chat/proactive/trigger` | 선제 대화 트리거 | `{ triggerType, userId }` | `{ messageId, content }` | System |
| GET | `/api/chat/proactive/schedule` | 예약된 대화 조회 | - | `{ schedules[] }` | Yes |
| POST | `/api/chat/proactive/respond` | 푸시 응답 처리 | `{ notificationId, response }` | `{ sessionId, aiResponse }` | Yes |
| PUT | `/api/chat/proactive/settings` | 선제 대화 설정 | `{ triggers[], preferences }` | `{ settings }` | Yes |

### 📊 대화 패턴 분석 API (Pattern Analysis) **[NEW]**

| Method | URI | Description | Request Body | Response | Auth |
|--------|-----|-------------|--------------|----------|------|
| GET | `/api/analysis/patterns` | 대화 패턴 조회 | `?period` | `{ patterns[], insights }` | Yes |
| POST | `/api/analysis/trigger/evaluate` | 트리거 조건 평가 | `{ userId, triggerType }` | `{ shouldTrigger, reason }` | System |
| GET | `/api/analysis/activity` | 활동 패턴 분석 | - | `{ activityData, recommendations }` | Yes |

### ⚙️ 알림 설정 API (Notification Settings) **[NEW]**

| Method | URI | Description | Request Body | Response | Auth |
|--------|-----|-------------|--------------|----------|------|
| GET | `/api/settings/notifications/all` | 전체 알림 설정 조회 | - | `{ categories[], settings }` | Yes |
| PUT | `/api/settings/notifications/proactive` | AI 대화 알림 설정 | `{ enabled, schedule, types[] }` | `{ settings }` | Yes |
| PUT | `/api/settings/notifications/dnd` | 방해금지 설정 | `{ startTime, endTime, days[] }` | `{ settings }` | Yes |
| POST | `/api/settings/notifications/custom-trigger` | 커스텀 트리거 생성 | `{ name, condition, message }` | `{ triggerId }` | Yes |

### 🔄 배치 작업 API 추가 (Batch Jobs) **[UPDATED]**

| Method | URI | Description | Request Body | Response | Auth |
|--------|-----|-------------|--------------|----------|------|
| POST | `/api/batch/push/morning` | 아침 인사 일괄 발송 | `{ targetTime }` | `{ sentCount }` | System |
| POST | `/api/batch/push/check-inactive` | 미접속 사용자 체크 | `{ days }` | `{ inactiveUsers, notifiedCount }` | System |
| POST | `/api/batch/push/emotion-support` | 감정 지원 메시지 발송 | - | `{ targetedUsers, sentCount }` | System |
| POST | `/api/batch/analysis/patterns` | 패턴 분석 배치 | - | `{ analyzedUsers }` | System |

---

## 3. 데이터베이스 스키마 추가사항

### 새로운 테이블

#### push_devices (푸시 디바이스)
- device_id (PK)
- user_id (FK)
- device_token
- device_type (iOS/Android)
- device_info
- is_active
- created_at
- updated_at

#### push_notifications (푸시 알림)
- notification_id (PK)
- user_id (FK)
- trigger_type
- title
- body
- data (JSONB)
- is_sent
- sent_at
- is_read
- read_at
- clicked_at
- created_at

#### proactive_triggers (선제 대화 트리거)
- trigger_id (PK)
- user_id (FK)
- trigger_type (time/event/pattern)
- trigger_config (JSONB)
- is_active
- last_triggered_at
- trigger_count
- created_at
- updated_at

#### notification_settings (알림 설정)
- setting_id (PK)
- user_id (FK)
- category
- is_enabled
- time_preferences (JSONB)
- frequency_limit
- dnd_start
- dnd_end
- created_at
- updated_at

#### conversation_patterns (대화 패턴)
- pattern_id (PK)
- user_id (FK)
- pattern_type
- pattern_data (JSONB)
- confidence_score
- detected_at
- action_taken
- created_at

---

## 4. 주요 시나리오

### 시나리오 1: 아침 인사
```
1. 08:00 - 시스템이 아침 인사 배치 실행
2. 사용자별 시간대 확인 및 활성 사용자 필터링
3. AI가 사용자별 맞춤 아침 인사 생성
   예: "오늘의 무디: 안녕! 오늘은 어떤 감정이야?"
4. FCM/APNs 통해 푸시 발송
5. 사용자가 알림 클릭
6. 앱 열리며 채팅 세션 자동 시작
7. 대화 진행 및 감정 분석
```

### 시나리오 2: 스트레스 감지 및 위로
```
1. 실시간 Big5 분석에서 Neuroticism 7.0 이상 감지
2. 3일 연속 부정적 패턴 확인
3. AI가 위로 메시지 생성
   예: "오늘의 무디: 요즘 힘든 일이 있는 것 같아. 이야기 들어줄게."
4. 푸시 알림 발송
5. 사용자 응답 시 감정 지원 대화 시작
6. 필요시 전문 상담 리소스 안내
```

### 시나리오 3: 일기 작성 유도
```
1. 21:00 - 일기 작성 시간 도달
2. 당일 대화 내용 확인
3. 대화가 있었다면 일기 작성 유도 메시지
   예: "오늘의 무디: 오늘 하루도 수고했어! 일기로 정리해볼까?"
4. 대화가 없었다면 체크인 메시지
   예: "오늘의 무디: 오늘은 어떤 하루였어?"
5. 사용자 응답 기반 일기 생성 프로세스 시작
```

---

## 5. 성능 및 제약사항

### 푸시 알림 제한
- 사용자당 하루 최대 10개 알림
- 연속 무시 3회 시 자동 빈도 감소
- DND 시간 엄격 준수

### 응답률 추적
- 알림 타입별 클릭률 측정
- 낮은 응답률 카테고리 자동 비활성화
- A/B 테스트를 통한 메시지 최적화

### 개인정보 보호
- 푸시 메시지에 민감정보 미포함
- 알림 내용 암호화
- 디바이스 토큰 주기적 갱신

---

## 6. 향후 확장 계획

### Phase 1 (현재)
- 기본 시간/이벤트 기반 푸시 알림
- 단순 패턴 감지
- 텍스트 메시지만 지원

### Phase 2 (3개월 후)
- 위치 기반 알림
- 리치 푸시 (이미지, 버튼 포함)
- 그룹 알림 (친구끼리 응원)

### Phase 3 (6개월 후)
- AI 대화 음성 지원
- 웨어러블 디바이스 연동
- 예측 모델 기반 선제 개입
