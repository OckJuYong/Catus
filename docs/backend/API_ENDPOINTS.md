# CATUS 백엔드 API 엔드포인트 명세서

> **프론트엔드 코드 분석 기반 자동 생성**
> **생성일**: 2024-11-20
> **분석 소스**: `src/utils/api.js` + 프론트엔드 문서 (01, 02, 03)

---

## 📚 목차

1. [개요](#개요)
2. [인증 (Authentication)](#1-인증-authentication)
3. [사용자 (User)](#2-사용자-user)
4. [채팅 (Chat)](#3-채팅-chat)
5. [일기 (Diary)](#4-일기-diary)
6. [익명 응원 (Support)](#5-익명-응원-support)
7. [통계 (Statistics)](#6-통계-statistics)
8. [불일치 사항 및 주의사항](#불일치-사항-및-주의사항)

---

## 개요

### 기본 정보
- **Base URL**: `http://localhost:8080/api/v1`
- **인증 방식**: JWT Bearer Token
- **Content-Type**: `application/json`
- **총 엔드포인트 수**: 21개

### 인증 헤더 형식
```http
Authorization: Bearer {access_token}
```

### 공통 에러 응답
```json
{
  "error": "ERROR_CODE",
  "message": "에러 메시지",
  "timestamp": "2024-11-20T12:34:56Z"
}
```

### HTTP 상태 코드
- `200` OK - 요청 성공
- `201` Created - 생성 성공
- `400` Bad Request - 잘못된 요청
- `401` Unauthorized - 인증 실패
- `403` Forbidden - 권한 없음
- `404` Not Found - 리소스 없음
- `500` Internal Server Error - 서버 오류

---

## 1. 인증 (Authentication)

### 1.1 카카오 로그인

```http
POST /auth/kakao
```

**설명**: 카카오 OAuth 인증 코드로 로그인 처리

**인증 필요**: ❌

**Request Body**:
```json
{
  "code": "kakao_oauth_code_here"
}
```

**Response (200 OK)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "kakaoId": 123456789,
    "nickname": "달이친구",
    "profileImage": "https://example.com/profile.jpg",
    "onboardingCompleted": false
  }
}
```

**Error Responses**:
- `400` - 잘못된 인증 코드
- `500` - 카카오 API 통신 실패


---

### 1.2 토큰 갱신

```http
POST /auth/refresh
```

**설명**: Refresh Token으로 새로운 Access Token 발급

**인증 필요**: ❌ (Refresh Token 필요)

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- `401` - 유효하지 않은 Refresh Token
- `403` - 만료된 Refresh Token

---

### 1.3 로그아웃

```http
POST /auth/logout
```

**설명**: 현재 사용자 로그아웃 (토큰 무효화)

**인증 필요**: ✅

**Request Body**: 없음

**Response (200 OK)**:
```json
{
  "message": "로그아웃 성공"
}
```

---

### 1.4 현재 사용자 정보 조회

```http
GET /auth/me
```

**설명**: 현재 로그인한 사용자 정보 조회

**인증 필요**: ✅

**Response (200 OK)**:
```json
{
  "id": "user_123",
  "kakaoId": 123456789,
  "nickname": "달이친구",
  "profileImage": "https://example.com/profile.jpg",
  "onboardingCompleted": true,
  "createdAt": "2024-11-20T12:34:56Z"
}
```

---

## 2. 사용자 (User)

### 2.1 사용자 프로필 조회

```http
GET /users/{userId}
```

**설명**: 특정 사용자의 프로필 조회

**인증 필요**: ✅

**Path Parameters**:
- `userId` (string, required) - 사용자 ID

**Response (200 OK)**:
```json
{
  "id": "user_123",
  "nickname": "달이친구",
  "profileImage": "https://example.com/profile.jpg",
  "onboardingCompleted": true
}
```

**Error Responses**:
- `404` - 사용자를 찾을 수 없음

---

### 2.2 사용자 프로필 수정

```http
PUT /users/{userId}
```

**설명**: 사용자 프로필 정보 수정

**인증 필요**: ✅

**Path Parameters**:
- `userId` (string, required) - 사용자 ID

**Request Body**:
```json
{
  "nickname": "새로운닉네임",
  "profileImage": "https://example.com/new-profile.jpg"
}
```

**Response (200 OK)**:
```json
{
  "id": "user_123",
  "nickname": "새로운닉네임",
  "profileImage": "https://example.com/new-profile.jpg",
  "updatedAt": "2024-11-20T12:34:56Z"
}
```

**Error Responses**:
- `400` - 유효하지 않은 데이터
- `403` - 권한 없음 (본인만 수정 가능)

---

### 2.3 온보딩 정보 저장

```http
POST /users/onboarding
```

**설명**: 4단계 온보딩 완료 후 정보 저장

**인증 필요**: ✅

**Request Body**:
```json
{
  "nickname": "달이친구",
  "interests": ["일상", "감정", "친구"],
  "goal": "감정 정리",
  "notificationEnabled": true
}
```

**Response (200 OK)**:
```json
{
  "user": {
    "id": "user_123",
    "nickname": "달이친구",
    "onboardingCompleted": true
  },
  "message": "온보딩 완료"
}
```

**Validation Rules**:
- `nickname`: 2-10자, 한글/영문/숫자
- `interests`: 1-5개 선택
- `goal`: 필수 입력

---

## 3. 채팅 (Chat)

### ⚠️ 중요: 채팅 메시지 저장 정책

**프론트엔드**:
- 채팅 메시지를 **IndexedDB**에 저장
- 실시간 채팅은 클라이언트에서만 관리

**백엔드**:
- 채팅 메시지를 **저장하지 않음**
- 대화 종료 시 전체 대화를 받아 **분석만 수행**
- 분석 결과(요약, 감정, 그림일기)만 DB에 저장

---

### 3.1 메시지 전송 (AI 응답)

```http
POST /chat/send
```

**설명**: 사용자 메시지를 전송하고 AI 응답 받기

**인증 필요**: ✅

**Request Body**:
```json
{
  "content": "오늘 힘든 일이 있었어",
  "context": {
    "previousMessages": 5,
    "emotion": "슬픔"
  }
}
```

**Response (200 OK)**:
```json
{
  "role": "assistant",
  "content": "힘든 일이 있었구나. 무슨 일이 있었는지 얘기해줄래?",
  "timestamp": "2024-11-20T12:34:56Z"
}
```

**AI 통합**:
- Google Gemini API 사용
- SSE (Server-Sent Events) 스트리밍 지원

---

### 3.2 대화 기록 조회

```http
GET /chat/history/{diaryId}
```

**설명**: 특정 일기의 대화 기록 조회

**인증 필요**: ✅

**Path Parameters**:
- `diaryId` (string, required) - 일기 ID

**Response (200 OK)**:
```json
{
  "diaryId": "diary_456",
  "date": "2024-11-20",
  "messages": [
    {
      "role": "user",
      "content": "오늘 힘든 일이 있었어",
      "timestamp": "2024-11-20T12:34:56Z"
    },
    {
      "role": "assistant",
      "content": "무슨 일이 있었는지 얘기해줄래?",
      "timestamp": "2024-11-20T12:35:10Z"
    }
  ]
}
```

**주의**: 이 데이터는 일기 생성 시점의 스냅샷입니다. 실시간 대화는 프론트엔드 IndexedDB에만 존재합니다.

---

### 3.3 대화 종료 및 분석

```http
POST /chat/end
```

**설명**: 전체 대화 내용을 분석하여 일기 생성

**인증 필요**: ✅

**Request Body**:
```json
{
  "date": "2024-11-20",
  "messages": [
    {
      "role": "user",
      "content": "오늘 힘든 일이 있었어",
      "timestamp": "2024-11-20T12:34:56Z"
    },
    {
      "role": "assistant",
      "content": "무슨 일이 있었는지 얘기해줄래?",
      "timestamp": "2024-11-20T12:35:10Z"
    },
    {
      "role": "user",
      "content": "친구와 싸웠어",
      "timestamp": "2024-11-20T12:36:20Z"
    }
  ]
}
```

**Response (200 OK)**:
```json
{
  "diaryId": "diary_456",
  "emotion": "슬픔",
  "summary": "친구와의 다툼으로 힘든 하루를 보냈습니다. 서로의 입장 차이로 인해 갈등이 생겼지만, 시간을 두고 대화하면 해결될 것 같습니다.",
  "pictureUrl": "https://s3.amazonaws.com/catus/diaries/diary_456.png",
  "keywords": ["친구", "갈등", "대화"],
  "advice": "친구와의 관계는 시간이 필요해. 서로의 마음을 이해하려 노력하면 좋아질 거야."
}
```

**분석 프로세스**:
1. AI가 전체 대화 분석 (Gemini API)
2. 감정 분류 및 키워드 추출
3. 요약문 생성
4. 그림일기 생성 (DALL-E/Stable Diffusion)
5. 조언 생성


---

## 4. 일기 (Diary)

### 4.1 월별 일기 목록 조회

```http
GET /diaries?year={year}&month={month}
```

**설명**: 특정 월의 일기 목록 조회

**인증 필요**: ✅

**Query Parameters**:
- `year` (integer, required) - 연도 (예: 2024)
- `month` (integer, required) - 월 (1-12)

**Response (200 OK)**:
```json
{
  "year": 2024,
  "month": 11,
  "diaries": [
    {
      "id": "diary_456",
      "date": "2024-11-20",
      "emotion": "슬픔",
      "summary": "친구와의 다툼으로 힘든 하루...",
      "pictureUrl": "https://s3.amazonaws.com/catus/diaries/diary_456.png",
      "createdAt": "2024-11-20T12:40:00Z"
    },
    {
      "id": "diary_457",
      "date": "2024-11-19",
      "emotion": "기쁨",
      "summary": "좋은 소식을 들어서 기분 좋은 하루...",
      "pictureUrl": "https://s3.amazonaws.com/catus/diaries/diary_457.png",
      "createdAt": "2024-11-19T14:30:00Z"
    }
  ],
  "totalCount": 2
}
```

---

### 4.2 특정 날짜 일기 조회

```http
GET /diaries/{date}
```

**설명**: 특정 날짜의 일기 상세 조회

**인증 필요**: ✅

**Path Parameters**:
- `date` (string, required) - 날짜 (YYYY-MM-DD)

**Response (200 OK)**:
```json
{
  "id": "diary_456",
  "userId": "user_123",
  "date": "2024-11-20",
  "emotion": "슬픔",
  "summary": "친구와의 다툼으로 힘든 하루를 보냈습니다...",
  "pictureUrl": "https://s3.amazonaws.com/catus/diaries/diary_456.png",
  "keywords": ["친구", "갈등", "대화"],
  "advice": "친구와의 관계는 시간이 필요해...",
  "messages": [
    {
      "role": "user",
      "content": "오늘 힘든 일이 있었어",
      "timestamp": "2024-11-20T12:34:56Z"
    }
  ],
  "createdAt": "2024-11-20T12:40:00Z",
  "updatedAt": "2024-11-20T12:40:00Z"
}
```

**Error Responses**:
- `404` - 해당 날짜에 일기가 없음

---

### 4.3 일기 생성

```http
POST /diaries
```

**설명**: 새로운 일기 생성 (수동 작성)

**인증 필요**: ✅

**Request Body**:
```json
{
  "date": "2024-11-20",
  "emotion": "기쁨",
  "summary": "오늘은 좋은 일이 있었다.",
  "pictureUrl": "https://s3.amazonaws.com/catus/diaries/custom.png"
}
```

**Response (201 Created)**:
```json
{
  "id": "diary_458",
  "date": "2024-11-20",
  "emotion": "기쁨",
  "summary": "오늘은 좋은 일이 있었다.",
  "pictureUrl": "https://s3.amazonaws.com/catus/diaries/custom.png",
  "createdAt": "2024-11-20T14:00:00Z"
}
```

**Validation Rules**:
- `date`: YYYY-MM-DD 형식, 과거/현재 날짜만 가능
- `emotion`: "기쁨", "슬픔", "화남", "불안", "평온" 중 하나
- `summary`: 1-500자

**Error Responses**:
- `400` - 해당 날짜에 이미 일기 존재
- `400` - 유효하지 않은 데이터

---

### 4.4 일기 수정

```http
PUT /diaries/{date}
```

**설명**: 기존 일기 수정

**인증 필요**: ✅

**Path Parameters**:
- `date` (string, required) - 날짜 (YYYY-MM-DD)

**Request Body**:
```json
{
  "summary": "수정된 요약 내용",
  "pictureUrl": "https://s3.amazonaws.com/catus/diaries/updated.png"
}
```

**Response (200 OK)**:
```json
{
  "id": "diary_456",
  "date": "2024-11-20",
  "emotion": "슬픔",
  "summary": "수정된 요약 내용",
  "pictureUrl": "https://s3.amazonaws.com/catus/diaries/updated.png",
  "updatedAt": "2024-11-20T15:00:00Z"
}
```

**Error Responses**:
- `404` - 일기를 찾을 수 없음
- `403` - 권한 없음 (본인 일기만 수정 가능)

---

### 4.5 일기 삭제

```http
DELETE /diaries/{date}
```

**설명**: 일기 삭제

**인증 필요**: ✅

**Path Parameters**:
- `date` (string, required) - 날짜 (YYYY-MM-DD)

**Response (200 OK)**:
```json
{
  "message": "일기가 삭제되었습니다",
  "deletedDate": "2024-11-20"
}
```

**Error Responses**:
- `404` - 일기를 찾을 수 없음
- `403` - 권한 없음 (본인 일기만 삭제 가능)

---

## 5. 익명 응원 (Support)

### 5.1 받은 응원 메시지 조회

```http
GET /support/received
```

**설명**: 내가 받은 익명 응원 메시지 목록

**인증 필요**: ✅

**Response (200 OK)**:
```json
{
  "messages": [
    {
      "id": "support_789",
      "content": "힘내! 넌 잘하고 있어!",
      "emotion": "응원",
      "receivedAt": "2024-11-20T10:00:00Z",
      "isRead": false
    },
    {
      "id": "support_790",
      "content": "오늘도 좋은 하루 보내!",
      "emotion": "격려",
      "receivedAt": "2024-11-19T09:00:00Z",
      "isRead": true
    }
  ],
  "totalCount": 2,
  "unreadCount": 1
}
```

---

### 5.2 보낸 응원 메시지 조회

```http
GET /support/sent
```

**설명**: 내가 보낸 익명 응원 메시지 목록

**인증 필요**: ✅

**Response (200 OK)**:
```json
{
  "messages": [
    {
      "id": "support_791",
      "content": "잘될 거야, 힘내!",
      "emotion": "응원",
      "sentAt": "2024-11-20T11:00:00Z",
      "isDelivered": true
    }
  ],
  "totalCount": 1
}
```

---

### 5.3 익명 응원 메시지 전송

```http
POST /support/send
```

**설명**: 랜덤 사용자에게 익명 응원 메시지 전송

**인증 필요**: ✅

**Request Body**:
```json
{
  "content": "오늘도 힘내세요! 당신은 소중해요.",
  "emotion": "응원"
}
```

**Response (200 OK)**:
```json
{
  "id": "support_792",
  "message": "응원 메시지가 전송되었습니다",
  "sentAt": "2024-11-20T12:00:00Z"
}
```

**Validation Rules**:
- `content`: 10-100자
- `emotion`: "응원", "격려", "위로", "축하" 중 하나

**비즈니스 로직**:
- 랜덤 사용자 선택 (본인 제외)
- 완전 익명 (발신자 정보 저장 안 함)
- 하루 최대 5개 전송 제한

---

### 5.4 응원 메시지 읽음 처리

```http
PUT /support/{messageId}/read
```

**설명**: 받은 응원 메시지를 읽음으로 표시

**인증 필요**: ✅

**Path Parameters**:
- `messageId` (string, required) - 메시지 ID

**Response (200 OK)**:
```json
{
  "id": "support_789",
  "isRead": true,
  "readAt": "2024-11-20T13:00:00Z"
}
```

---

## 6. 통계 (Statistics)

### 6.1 월별 감정 통계

```http
GET /stats/emotions?year={year}&month={month}
```

**설명**: 특정 월의 감정 분포 통계

**인증 필요**: ✅

**Query Parameters**:
- `year` (integer, required) - 연도
- `month` (integer, required) - 월 (1-12)

**Response (200 OK)**:
```json
{
  "year": 2024,
  "month": 11,
  "emotionDistribution": {
    "기쁨": 10,
    "슬픔": 5,
    "화남": 2,
    "불안": 3,
    "평온": 8
  },
  "totalDiaries": 28,
  "mostFrequentEmotion": "기쁨",
  "emotionTrend": "상승"
}
```

---

### 6.2 월별 종합 통계

```http
GET /stats/monthly?year={year}&month={month}
```

**설명**: 특정 월의 종합 통계 (일기, 대화, 응원)

**인증 필요**: ✅

**Query Parameters**:
- `year` (integer, required) - 연도
- `month` (integer, required) - 월 (1-12)

**Response (200 OK)**:
```json
{
  "year": 2024,
  "month": 11,
  "diaryStats": {
    "totalDiaries": 28,
    "consecutiveDays": 7,
    "averageSummaryLength": 150
  },
  "chatStats": {
    "totalConversations": 28,
    "averageMessagesPerConversation": 12,
    "totalMessages": 336
  },
  "supportStats": {
    "receivedCount": 15,
    "sentCount": 10
  },
  "emotionInsights": {
    "positiveRatio": 0.65,
    "negativeRatio": 0.35,
    "improvement": "+5%"
  }
}
```


---

## 불일치 사항 및 주의사항

### 📌 문서 vs 코드 불일치

#### 1. 채팅 엔드포인트 이름

**문서 (01_프론트API_명세서.md, 03_전체_플로우.md)**:
- `POST /chat/message` - AI 응답
- `POST /chat/analyze` - 대화 분석

**실제 코드 (src/utils/api.js)**:
```javascript
sendMessage: (content) => post('/chat/send', { content }),
endConversation: (messages) => post('/chat/end', { messages }),
```

**✅ 권장사항**: **코드를 기준으로 구현**하세요.
- `POST /chat/send` 사용
- `POST /chat/end` 사용

**이유**: 프론트엔드가 이미 이 엔드포인트를 사용하고 있습니다.

---

### ⚠️ 중요한 아키텍처 결정

#### 1. 채팅 메시지 저장 위치
- **프론트엔드**: IndexedDB에 저장 (실시간 대화)
- **백엔드**: 저장하지 않음 (분석 결과만 저장)

#### 2. 대화 종료 시 처리
1. 프론트엔드가 전체 대화를 `POST /chat/end`로 전송
2. 백엔드가 AI 분석 수행
3. 분석 결과만 DB에 저장 (일기 형태)

#### 3. 일기 조회 시 대화 기록
- `GET /diaries/{date}` 응답에 `messages` 필드 포함
- 이는 일기 생성 시점의 스냅샷 (읽기 전용)

---

### 🔐 보안 고려사항

#### JWT 토큰 관리
- **Access Token**: 1시간 (3600000ms)
- **Refresh Token**: 14일 (1209600000ms)
- Secret Key: 최소 256비트 사용

#### 익명 응원 메시지
- 발신자 정보 완전 익명화
- IP 추적 금지
- 수신자는 랜덤 선택

---

### 📊 Rate Limiting 권장

| 엔드포인트 | 제한 | 설명 |
|----------|-----|-----|
| `POST /auth/kakao` | 5회/분 | 로그인 시도 제한 |
| `POST /chat/send` | 30회/분 | AI 요청 제한 |
| `POST /support/send` | 5회/일 | 응원 메시지 제한 |
| 기타 GET | 100회/분 | 일반 조회 제한 |
| 기타 POST/PUT/DELETE | 30회/분 | 수정 작업 제한 |

---

### 🎨 그림일기 생성

#### 사용 가능한 AI 서비스
1. **DALL-E** (OpenAI)
   - 고품질 이미지
   - 비용: $0.02/이미지

2. **Stable Diffusion** (Stability AI)
   - 오픈소스 대안
   - 비용: 낮음

#### 생성 프로세스
1. AI가 대화에서 키워드 추출
2. 프롬프트 생성 (예: "친구와 다투는 슬픈 고양이")
3. 이미지 생성 API 호출
4. S3/Cloudinary에 업로드
5. URL을 일기에 저장

---

### 📝 추가 구현 권장사항

#### Phase 1 (MVP) - 필수
- ✅ 카카오 로그인
- ✅ JWT 인증
- ✅ 채팅 API (Gemini)
- ✅ 대화 분석 및 일기 생성
- ✅ 일기 CRUD

#### Phase 2 - 핵심 기능
- ✅ 익명 응원 메시지
- ✅ 월별 일기 조회
- ✅ 감정 통계
- ⏳ 그림일기 생성 (DALL-E)

#### Phase 3 - 고급 기능
- ⏳ 푸시 알림
- ⏳ 고급 통계 (트렌드 분석)
- ⏳ 성능 최적화 (캐싱)

---

## 📞 기술 지원

- **문서 버전**: 1.0.0
- **최종 업데이트**: 2024-11-20
- **생성 방식**: React Native 프론트엔드 자동 분석
- **분석 도구**: backend-api-docs-agent

---

**참고 문서**:
- [QUICK_START.md](./QUICK_START.md) - 빠른 시작 가이드
- [API_SPECIFICATION_SPRINGBOOT.md](./API_SPECIFICATION_SPRINGBOOT.md) - Spring Boot 구현 예시
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - 데이터베이스 스키마
- [AUTHENTICATION.md](./AUTHENTICATION.md) - JWT 인증 가이드
