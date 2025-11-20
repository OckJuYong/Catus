# CATUS 백엔드 API 명세서

> **Version**: 1.0.0
> **최종 수정**: 2024-11-20
> **Target**: Backend Developers

---

## 📋 목차

1. [개요](#1-개요)
2. [인증 체계](#2-인증-체계)
3. [API 엔드포인트](#3-api-엔드포인트)
   - [3.1 인증 (Authentication)](#31-인증-authentication)
   - [3.2 사용자 (User)](#32-사용자-user)
   - [3.3 채팅 (Chat)](#33-채팅-chat)
   - [3.4 일기 (Diary)](#34-일기-diary)
   - [3.5 익명 응원 메시지 (Support)](#35-익명-응원-메시지-support)
   - [3.6 통계 (Statistics)](#36-통계-statistics)
4. [데이터 모델](#4-데이터-모델)
5. [에러 처리](#5-에러-처리)
6. [보안 요구사항](#6-보안-요구사항)
7. [성능 요구사항](#7-성능-요구사항)
8. [배포 환경](#8-배포-환경)

---

## 1. 개요

### 1.1 서비스 설명

**CATUS**는 AI 고양이 "달이"와 대화하며 감정 일기를 작성하는 웹 서비스입니다.

**핵심 기능**:
- 카카오 OAuth 2.0 로그인
- AI 채팅 (Gemini API 활용)
- 대화 기반 감정 분석 및 일기 자동 생성
- AI 그림일기 생성 (DALL-E/Stable Diffusion)
- 캘린더 기반 일기 관리
- 익명 응원 메시지 랜덤 교환
- 월별 감정 통계

---

### 1.2 기술 스택 요구사항

**필수**:
- RESTful API
- JWT 인증
- 카카오 OAuth 2.0
- Gemini API (AI 대화)
- 이미지 생성 API (DALL-E/Stable Diffusion/기타)

**권장**:
- Node.js (Express/NestJS) 또는 Python (FastAPI/Django)
- PostgreSQL/MySQL (관계형 DB)
- Redis (세션/캐시 관리)
- AWS S3/Cloudinary (이미지 저장)

---

### 1.3 중요 아키텍처 특징

#### 🚨 채팅 메시지 저장 정책

**프론트엔드**:
- 채팅 메시지를 **IndexedDB(웹) 또는 AsyncStorage(모바일)에 저장**
- 실시간 채팅 내역은 클라이언트에서만 관리

**백엔드**:
- 채팅 메시지를 **저장하지 않음** (개인정보 보호)
- 대화 종료 시 프론트에서 전체 대화 내용을 받아 **분석만 수행**
- 분석 결과(요약, 감정, 그림일기)만 DB에 저장

**데이터 흐름**:
```
사용자 메시지 → 프론트 IndexedDB 저장
    ↓
POST /chat/stream → AI 응답 생성 (메시지 저장 안함)
    ↓
AI 응답 → 프론트 IndexedDB 저장
    ↓
대화 종료 시
    ↓
프론트에서 전체 대화 조회 → POST /chat/analyze
    ↓
백엔드: 분석(요약, 감정, 그림일기) → 일기만 저장
```

---

### 1.4 Base URL 및 버전 관리

```
Base URL: https://api.catus.com/api/v1
API Version: v1
```

**환경별 URL**:
| 환경 | URL |
|-----|-----|
| Production | `https://api.catus.com/api/v1` |
| Staging | `https://staging-api.catus.com/api/v1` |
| Development | `http://localhost:3000/api/v1` |

---

### 1.5 공통 헤더

**모든 요청**:
```http
Content-Type: application/json
Accept: application/json
```

**인증 필요 요청**:
```http
Authorization: Bearer {JWT_ACCESS_TOKEN}
```

---

## 2. 인증 체계

### 2.1 JWT 토큰 구조

**Access Token**:
```json
{
  "sub": "user_id",
  "iat": 1700000000,
  "exp": 1700003600,
  "type": "access"
}
```

**토큰 유효기간**:
| 토큰 타입 | 유효기간 | 저장 위치 |
|---------|---------|---------|
| Access Token | 1시간 | localStorage |
| Refresh Token | 14일 | localStorage |

---

### 2.2 카카오 OAuth 2.0 플로우

```
1. 프론트엔드: 카카오 로그인 버튼 클릭
   ↓
2. 카카오 인증 페이지 리다이렉트
   ↓
3. 사용자 인증 후 code 발급
   ↓
4. 프론트 → 백엔드: POST /auth/kakao (code 전송)
   ↓
5. 백엔드: code → 카카오 토큰 교환
   ↓
6. 백엔드: 카카오 유저 정보 조회
   ↓
7. 백엔드: DB에 사용자 저장/조회
   ↓
8. 백엔드: JWT 생성 및 반환
```

**환경변수 필요**:
```env
KAKAO_REST_API_KEY=your_kakao_rest_api_key
KAKAO_REDIRECT_URI=https://catus.com/auth/kakao/callback
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=14d
```

---

### 2.3 토큰 갱신 정책

- Access Token 만료 시 (401 에러)
- Refresh Token으로 자동 갱신
- Refresh Token도 만료 시 재로그인 필요

---

## 3. API 엔드포인트

### 3.1 인증 (Authentication)

#### 3.1.1 카카오 로그인

**개요**: 카카오 OAuth code를 받아 JWT 토큰 발급

```http
POST /auth/kakao
```

**Request Body**:
```json
{
  "code": "kakao_authorization_code"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | string | ✅ | 카카오 OAuth 인증 코드 |

**Response (200 OK)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "nickname": "사용자123",
    "profileImage": "https://k.kakaocdn.net/...",
    "onboardingCompleted": false
  }
}
```

**에러 응답**:
| Code | Message | 설명 |
|------|---------|------|
| 400 | Invalid authorization code | 잘못된 인증 코드 |
| 500 | Kakao API error | 카카오 서버 오류 |

**백엔드 처리 로직**:
1. `code`로 카카오 토큰 요청:
   ```
   POST https://kauth.kakao.com/oauth/token
   grant_type=authorization_code
   client_id={KAKAO_REST_API_KEY}
   redirect_uri={KAKAO_REDIRECT_URI}
   code={code}
   ```

2. 카카오 토큰으로 사용자 정보 조회:
   ```
   GET https://kapi.kakao.com/v2/user/me
   Authorization: Bearer {kakao_access_token}
   ```

3. DB 사용자 조회/생성:
   - `kakao_id`로 기존 사용자 검색
   - 없으면 신규 생성 (`onboardingCompleted: false`)

4. JWT Access/Refresh Token 생성 및 반환

---

#### 3.1.2 토큰 갱신

```http
POST /auth/refresh
```

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK)**:
```json
{
  "accessToken": "new_access_token"
}
```

**에러 응답**:
| Code | Message |
|------|---------|
| 401 | Invalid or expired refresh token |

---

#### 3.1.3 로그아웃

```http
POST /auth/logout
```

**Headers**:
```http
Authorization: Bearer {access_token}
```

**Response (200 OK)**:
```json
{
  "message": "로그아웃 성공"
}
```

**백엔드 처리**:
- Refresh Token 무효화 (Redis 블랙리스트 추가 권장)
- 세션 삭제

---

#### 3.1.4 현재 사용자 정보 조회

```http
GET /auth/me
```

**Headers**:
```http
Authorization: Bearer {access_token}
```

**Response (200 OK)**:
```json
{
  "id": "user_123",
  "nickname": "사용자123",
  "profileImage": "https://k.kakaocdn.net/...",
  "gender": "여자",
  "ageGroup": "20대",
  "occupation": "학생",
  "purpose": "감정 기록",
  "onboardingCompleted": true,
  "createdAt": "2024-11-01T10:00:00Z"
}
```

---

### 3.2 사용자 (User)

#### 3.2.1 온보딩 정보 저장

**개요**: 사용자 초기 설정 정보 저장

```http
POST /users/onboarding
```

**Headers**:
```http
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "gender": "여자",
  "ageGroup": "20대",
  "occupation": "학생",
  "purpose": "감정 기록과 관리를 위해 사용합니다"
}
```

| Field | Type | Required | Options | Validation |
|-------|------|----------|---------|------------|
| gender | string | ✅ | "여자", "남자", "선택 안함" | enum |
| ageGroup | string | ✅ | "10대", "20대", "30대", "40대 이상" | enum |
| occupation | string | ✅ | "학생", "직장인", "기타" | enum |
| purpose | string | ✅ | 자유 텍스트 | max 500자 |

**Response (200 OK)**:
```json
{
  "message": "온보딩 정보가 저장되었습니다",
  "user": {
    "id": "user_123",
    "onboardingCompleted": true
  }
}
```

**백엔드 처리**:
- 사용자 레코드 업데이트: `onboardingCompleted = true`
- 온보딩 정보 저장 (gender, ageGroup, occupation, purpose)

---

#### 3.2.2 프로필 조회

```http
GET /users/{userId}
```

**Headers**:
```http
Authorization: Bearer {access_token}
```

**Response (200 OK)**:
```json
{
  "id": "user_123",
  "nickname": "사용자123",
  "profileImage": "https://k.kakaocdn.net/...",
  "gender": "여자",
  "ageGroup": "20대",
  "occupation": "학생",
  "purpose": "감정 기록과 관리"
}
```

**권한 검증**:
- 본인 프로필만 조회 가능
- `userId`와 JWT의 `sub` 일치 확인

---

#### 3.2.3 프로필 수정

```http
PUT /users/{userId}
```

**Headers**:
```http
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "nickname": "새로운닉네임",
  "profileImage": "https://new-image-url.com/profile.jpg"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| nickname | string | ❌ | max 20자, 특수문자 제한 |
| profileImage | string | ❌ | URL 형식 |

**Response (200 OK)**:
```json
{
  "message": "프로필이 수정되었습니다",
  "user": {
    "id": "user_123",
    "nickname": "새로운닉네임",
    "profileImage": "https://new-image-url.com/profile.jpg"
  }
}
```

---

### 3.3 채팅 (Chat)

#### 🚨 중요: 채팅 메시지 저장 정책

- **백엔드는 채팅 메시지를 저장하지 않습니다**
- 프론트엔드가 IndexedDB에 메시지 저장
- 백엔드는 AI 응답 생성 및 분석만 담당

---

#### 3.3.1 AI 채팅 응답 (스트리밍)

**개요**: 사용자 메시지에 대한 AI 응답 생성 (Server-Sent Events 스트리밍)

```http
POST /chat/stream
```

**Headers**:
```http
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: text/event-stream
```

**Request Body**:
```json
{
  "message": "오늘 정말 힘든 일이 있었어",
  "context": [
    {
      "role": "user",
      "content": "안녕",
      "timestamp": "2024-11-20T12:00:00Z"
    },
    {
      "role": "assistant",
      "content": "안녕! 오늘 하루는 어땠어?",
      "timestamp": "2024-11-20T12:00:01Z"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | ✅ | 현재 사용자 메시지 |
| context | array | ❌ | 최근 5-10개 대화 내역 (컨텍스트 유지용) |

**Response (200 OK - SSE Stream)**:
```
data: {"chunk": "무슨"}
data: {"chunk": " 일이"}
data: {"chunk": " 있었어"}
data: {"chunk": "?"}
data: [DONE]
```

**백엔드 처리**:
1. Gemini API 호출 (스트리밍 모드)
2. 사용자 정보 기반 페르소나 프롬프트:
   ```
   당신은 친근한 고양이 "달이"입니다.
   사용자: {gender}, {ageGroup}, {occupation}
   대화 스타일: 따뜻하고 공감적이며, 감정 표현을 유도
   ```
3. 스트리밍 응답 전송
4. **메시지 저장 안함**

**에러 응답**:
| Code | Message |
|------|---------|
| 400 | Message is required |
| 500 | AI service error |

---

#### 3.3.2 대화 종료 및 분석

**개요**: 전체 대화 내용 분석 후 일기 생성

```http
POST /chat/analyze
```

**Headers**:
```http
Authorization: Bearer {access_token}
```

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
      "content": "무슨 일이 있었어? 자세히 말해줄래?",
      "timestamp": "2024-11-20T12:34:57Z"
    },
    {
      "role": "user",
      "content": "친구와 다퉜어. 그런데 내 잘못인 것 같아서 미안해",
      "timestamp": "2024-11-20T12:35:30Z"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| date | string | ✅ | YYYY-MM-DD 형식 |
| messages | array | ✅ | 전체 대화 내용 |
| messages[].role | string | ✅ | "user" or "assistant" |
| messages[].content | string | ✅ | 메시지 내용 |
| messages[].timestamp | string | ✅ | ISO 8601 형식 |

**Response (200 OK)**:
```json
{
  "diaryId": "diary_456",
  "emotion": "슬픔",
  "summary": "친구와의 다툼으로 힘든 하루. 자신의 잘못을 인정하며 미안함을 느끼고 있음",
  "pictureUrl": "https://s3.amazonaws.com/catus/diaries/diary_456.png"
}
```

| Field | Type | Description |
|-------|------|-------------|
| diaryId | string | 생성된 일기 ID |
| emotion | string | "행복", "슬픔", "보통", "화남", "불안" 중 하나 |
| summary | string | 대화 요약 (2-3줄) |
| pictureUrl | string | 생성된 그림일기 이미지 URL |

**백엔드 처리 로직**:

1. **감정 분석** (Gemini API):
   ```
   프롬프트: "다음 대화에서 사용자의 주요 감정을 하나만 선택하세요:
   행복, 슬픔, 보통, 화남, 불안

   대화 내용: {messages}

   결과는 단어 하나만 반환하세요."
   ```

2. **요약 생성** (Gemini API):
   ```
   프롬프트: "다음 대화를 2-3줄로 요약하세요.
   사용자의 하루와 감정 상태가 드러나도록 작성하세요.

   대화 내용: {messages}"
   ```

3. **그림일기 프롬프트 생성** (Gemini API):
   ```
   프롬프트: "다음 대화 내용을 바탕으로 그림일기 이미지를 생성하기 위한
   영문 프롬프트를 작성하세요. 따뜻하고 감성적인 일러스트 스타일로.

   대화 요약: {summary}
   감정: {emotion}"
   ```

4. **이미지 생성** (DALL-E/Stable Diffusion API):
   - 생성된 프롬프트로 이미지 생성
   - 이미지를 S3/Cloudinary에 업로드
   - URL 획득

5. **일기 저장** (DB):
   ```sql
   INSERT INTO diaries (user_id, date, emotion, summary, picture_url)
   VALUES ({user_id}, {date}, {emotion}, {summary}, {picture_url})
   ```

6. 응답 반환

**에러 응답**:
| Code | Message | 설명 |
|------|---------|------|
| 400 | Invalid date format | 날짜 형식 오류 |
| 400 | Messages array is required | 메시지 배열 누락 |
| 409 | Diary already exists for this date | 해당 날짜 일기 존재 |
| 500 | AI analysis failed | AI 분석 실패 |

**중복 일기 방지**:
- `user_id + date`를 UNIQUE 제약 조건으로 설정
- 이미 존재하면 409 에러 반환

---

### 3.4 일기 (Diary)

#### 3.4.1 일기 목록 조회 (월별)

```http
GET /diaries?year={year}&month={month}
```

**Headers**:
```http
Authorization: Bearer {access_token}
```

**Query Parameters**:
| Field | Type | Required | Example | Validation |
|-------|------|----------|---------|------------|
| year | int | ✅ | 2024 | 1900-2100 |
| month | int | ✅ | 11 | 1-12 |

**Response (200 OK)**:
```json
[
  {
    "id": "diary_123",
    "date": "2024-11-20",
    "emotion": "슬픔",
    "summary": "친구와의 다툼으로 힘든 하루...",
    "pictureUrl": "https://s3.amazonaws.com/catus/diaries/diary_123.png",
    "createdAt": "2024-11-20T13:00:00Z"
  },
  {
    "id": "diary_124",
    "date": "2024-11-19",
    "emotion": "행복",
    "summary": "즐거운 저녁 모임...",
    "pictureUrl": "https://s3.amazonaws.com/catus/diaries/diary_124.png",
    "createdAt": "2024-11-19T20:30:00Z"
  }
]
```

**백엔드 쿼리**:
```sql
SELECT * FROM diaries
WHERE user_id = {user_id}
  AND YEAR(date) = {year}
  AND MONTH(date) = {month}
ORDER BY date DESC
```

---

#### 3.4.2 특정 날짜 일기 조회

```http
GET /diaries/{date}
```

**Headers**:
```http
Authorization: Bearer {access_token}
```

**Path Parameters**:
| Field | Type | Format | Example |
|-------|------|--------|---------|
| date | string | YYYY-MM-DD | 2024-11-20 |

**Response (200 OK)**:
```json
{
  "id": "diary_123",
  "date": "2024-11-20",
  "emotion": "슬픔",
  "summary": "친구와의 다툼으로 힘든 하루. 자신의 잘못을 인정하며 미안함을 느끼고 있음",
  "pictureUrl": "https://s3.amazonaws.com/catus/diaries/diary_123.png",
  "createdAt": "2024-11-20T13:00:00Z"
}
```

**에러 응답**:
| Code | Message |
|------|---------|
| 404 | Diary not found |

**참고**:
- 채팅 메시지는 프론트 IndexedDB에서 조회
- 백엔드는 일기 메타데이터만 반환

---

#### 3.4.3 일기 수정

```http
PUT /diaries/{date}
```

**Headers**:
```http
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "emotion": "보통",
  "summary": "수정된 요약 내용"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| emotion | string | ❌ | "행복", "슬픔", "보통", "화남", "불안" |
| summary | string | ❌ | max 500자 |

**Response (200 OK)**:
```json
{
  "id": "diary_123",
  "date": "2024-11-20",
  "emotion": "보통",
  "summary": "수정된 요약 내용",
  "updatedAt": "2024-11-21T10:00:00Z"
}
```

**백엔드 처리**:
- `updatedAt` 필드 자동 업데이트
- 그림일기는 수정 불가 (재생성 기능은 별도 고려)

---

#### 3.4.4 일기 삭제

```http
DELETE /diaries/{date}
```

**Headers**:
```http
Authorization: Bearer {access_token}
```

**Response (200 OK)**:
```json
{
  "message": "일기가 삭제되었습니다"
}
```

**백엔드 처리**:
1. 일기 레코드 삭제
2. S3/Cloudinary 이미지 삭제 (선택)
3. ⚠️ 프론트엔드도 IndexedDB의 해당 날짜 채팅 기록 삭제 필요

---

### 3.5 익명 응원 메시지 (Support)

#### 3.5.1 받은 메시지 조회

```http
GET /support/received
```

**Headers**:
```http
Authorization: Bearer {access_token}
```

**Response (200 OK)**:
```json
[
  {
    "id": "msg_789",
    "text": "오늘도 힘내세요! 당신은 소중한 사람입니다.",
    "isRead": false,
    "createdAt": "2024-11-20T14:00:00Z"
  },
  {
    "id": "msg_790",
    "text": "힘든 일이 있어도 곧 좋은 날이 올 거예요.",
    "isRead": true,
    "createdAt": "2024-11-19T09:30:00Z"
  }
]
```

**정렬**: `createdAt DESC` (최신순)

---

#### 3.5.2 보낸 메시지 조회

```http
GET /support/sent
```

**Headers**:
```http
Authorization: Bearer {access_token}
```

**Response (200 OK)**:
```json
[
  {
    "id": "msg_800",
    "text": "당신은 충분히 잘하고 있어요!",
    "createdAt": "2024-11-20T15:00:00Z"
  }
]
```

---

#### 3.5.3 메시지 전송

**개요**: 랜덤 사용자에게 익명 응원 메시지 전송

```http
POST /support/send
```

**Headers**:
```http
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "text": "오늘도 힘내세요! 당신은 소중한 사람입니다."
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| text | string | ✅ | max 100자 |

**Response (200 OK)**:
```json
{
  "id": "msg_801",
  "text": "오늘도 힘내세요! 당신은 소중한 사람입니다.",
  "createdAt": "2024-11-20T16:00:00Z"
}
```

**백엔드 처리**:
1. 메시지 저장 (`sender_id` = 현재 사용자)
2. 랜덤 수신자 선택:
   ```sql
   SELECT id FROM users
   WHERE id != {sender_id}
   ORDER BY RANDOM()
   LIMIT 1
   ```
3. 메시지에 `receiver_id` 할당
4. (선택) 푸시 알림 전송

**에러 응답**:
| Code | Message |
|------|---------|
| 400 | Text exceeds 100 characters |
| 404 | No available recipient |

---

#### 3.5.4 메시지 읽음 처리

```http
PUT /support/{messageId}/read
```

**Headers**:
```http
Authorization: Bearer {access_token}
```

**Response (200 OK)**:
```json
{
  "id": "msg_789",
  "isRead": true
}
```

**백엔드 처리**:
```sql
UPDATE support_messages
SET is_read = true, read_at = NOW()
WHERE id = {messageId} AND receiver_id = {user_id}
```

---

### 3.6 통계 (Statistics)

#### 3.6.1 감정 통계 조회

```http
GET /stats/emotions?year={year}&month={month}
```

**Headers**:
```http
Authorization: Bearer {access_token}
```

**Query Parameters**:
| Field | Type | Required |
|-------|------|----------|
| year | int | ✅ |
| month | int | ✅ |

**Response (200 OK)**:
```json
{
  "emotions": [
    {
      "date": "2024-11-01",
      "emotion": "행복"
    },
    {
      "date": "2024-11-02",
      "emotion": "슬픔"
    },
    {
      "date": "2024-11-03",
      "emotion": "보통"
    }
  ]
}
```

**백엔드 쿼리**:
```sql
SELECT date, emotion FROM diaries
WHERE user_id = {user_id}
  AND YEAR(date) = {year}
  AND MONTH(date) = {month}
ORDER BY date ASC
```

---

#### 3.6.2 월별 통계 조회

```http
GET /stats/monthly?year={year}&month={month}
```

**Headers**:
```http
Authorization: Bearer {access_token}
```

**Response (200 OK)**:
```json
{
  "totalDiaries": 20,
  "mostFrequentEmotion": "행복",
  "averageMessagesPerDay": 15.3
}
```

| Field | Type | Description |
|-------|------|-------------|
| totalDiaries | int | 해당 월 일기 개수 |
| mostFrequentEmotion | string | 가장 많은 감정 |
| averageMessagesPerDay | float | 일평균 메시지 수 (프론트 제공 필요) |

**백엔드 쿼리**:
```sql
-- 일기 개수
SELECT COUNT(*) as total_diaries FROM diaries
WHERE user_id = {user_id} AND YEAR(date) = {year} AND MONTH(date) = {month}

-- 가장 많은 감정
SELECT emotion, COUNT(*) as cnt FROM diaries
WHERE user_id = {user_id} AND YEAR(date) = {year} AND MONTH(date) = {month}
GROUP BY emotion
ORDER BY cnt DESC
LIMIT 1
```

---

## 4. 데이터 모델

### 4.1 Users 테이블

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  kakao_id BIGINT UNIQUE NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  profile_image VARCHAR(500),
  gender VARCHAR(20),
  age_group VARCHAR(20),
  occupation VARCHAR(50),
  purpose TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_kakao_id (kakao_id)
);
```

**필드 설명**:
| 필드 | 타입 | 설명 |
|-----|------|------|
| id | VARCHAR(36) | UUID |
| kakao_id | BIGINT | 카카오 고유 ID |
| gender | VARCHAR(20) | "여자", "남자", "선택 안함" |
| age_group | VARCHAR(20) | "10대", "20대", "30대", "40대 이상" |
| occupation | VARCHAR(50) | "학생", "직장인", "기타" |

---

### 4.2 Diaries 테이블

```sql
CREATE TABLE diaries (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  emotion VARCHAR(20) NOT NULL,
  summary TEXT NOT NULL,
  picture_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_date (user_id, date),
  INDEX idx_user_date (user_id, date)
);
```

**필드 설명**:
| 필드 | 타입 | 설명 |
|-----|------|------|
| emotion | VARCHAR(20) | "행복", "슬픔", "보통", "화남", "불안" |
| summary | TEXT | 대화 요약 (max 500자) |
| picture_url | VARCHAR(500) | 그림일기 이미지 URL |

**중요 제약 조건**:
- `UNIQUE (user_id, date)`: 한 사용자당 하루 한 개 일기

---

### 4.3 Support Messages 테이블

```sql
CREATE TABLE support_messages (
  id VARCHAR(36) PRIMARY KEY,
  sender_id VARCHAR(36) NOT NULL,
  receiver_id VARCHAR(36) NOT NULL,
  text VARCHAR(100) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_receiver (receiver_id, is_read),
  INDEX idx_sender (sender_id)
);
```

---

### 4.4 Refresh Tokens 테이블 (선택)

```sql
CREATE TABLE refresh_tokens (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_expires (user_id, expires_at)
);
```

---

## 5. 에러 처리

### 5.1 공통 에러 응답 형식

```json
{
  "message": "에러 메시지 (사용자용)",
  "error": "ERROR_CODE",
  "statusCode": 400,
  "details": {
    "field": "추가 정보"
  }
}
```

---

### 5.2 HTTP 상태 코드

| Code | 설명 | 프론트 처리 방법 |
|------|------|-----------------|
| 200 | 성공 | 정상 처리 |
| 201 | 생성 성공 | 정상 처리 |
| 400 | 잘못된 요청 | 에러 메시지 표시 |
| 401 | 인증 실패 | 토큰 삭제 → 로그인 페이지 |
| 403 | 권한 없음 | 권한 에러 표시 |
| 404 | 리소스 없음 | "일기가 없습니다" 등 표시 |
| 409 | 충돌 (중복) | "이미 일기가 존재합니다" 표시 |
| 500 | 서버 에러 | "일시적 오류, 재시도" 안내 |

---

### 5.3 에러 코드 정의

| Error Code | 설명 | HTTP Code |
|-----------|------|-----------|
| INVALID_TOKEN | 유효하지 않은 토큰 | 401 |
| EXPIRED_TOKEN | 만료된 토큰 | 401 |
| INVALID_CREDENTIALS | 잘못된 인증 정보 | 401 |
| UNAUTHORIZED | 권한 없음 | 403 |
| DIARY_NOT_FOUND | 일기를 찾을 수 없음 | 404 |
| DIARY_ALREADY_EXISTS | 해당 날짜 일기 존재 | 409 |
| VALIDATION_ERROR | 입력값 검증 실패 | 400 |
| AI_SERVICE_ERROR | AI 서비스 오류 | 500 |
| IMAGE_GENERATION_ERROR | 이미지 생성 실패 | 500 |

---

## 6. 보안 요구사항

### 6.1 인증 및 권한

- **JWT 검증**: 모든 보호된 엔드포인트에서 토큰 검증
- **소유권 검증**: 사용자는 본인 리소스만 접근 가능
- **Rate Limiting**:
  - 로그인: 5회/분
  - 채팅: 30회/분
  - 일기 생성: 10회/시간

---

### 6.2 데이터 보호

- **HTTPS 필수**: 모든 통신 암호화
- **JWT Secret**: 강력한 시크릿 키 사용 (최소 256bit)
- **민감 정보**: 카카오 토큰은 저장하지 않음 (필요 시 암호화)
- **SQL Injection 방지**: Prepared Statement 사용

---

### 6.3 개인정보 보호

- **채팅 메시지 미저장**: 프론트엔드 로컬에만 저장
- **일기 삭제 권한**: 사용자 본인만 가능
- **계정 탈퇴**: 모든 관련 데이터 삭제 (CASCADE)

---

## 7. 성능 요구사항

### 7.1 응답 시간

| API | 목표 시간 |
|-----|----------|
| 일반 CRUD | < 200ms |
| AI 채팅 스트리밍 | < 2초 (첫 청크) |
| 일기 분석 | < 10초 (전체 프로세스) |
| 이미지 생성 | < 15초 |

---

### 7.2 동시 접속

- **목표**: 1000 CCU (Concurrent Users)
- **Scale-out**: 수평 확장 가능한 구조

---

### 7.3 캐싱 전략

**Redis 캐싱 권장**:
| 데이터 | TTL |
|-------|-----|
| 사용자 정보 | 1시간 |
| 월별 일기 목록 | 10분 |
| 감정 통계 | 1시간 |

---

### 7.4 데이터베이스 최적화

- **인덱스**: `user_id`, `date`, `kakao_id` 등
- **파티셔닝**: diaries 테이블 (년도별 권장)
- **연결 풀링**: 최소 10, 최대 50

---

## 8. 배포 환경

### 8.1 환경변수

```env
# Server
PORT=3000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=catus
DB_USER=catus_user
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your_256bit_secret_key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=14d

# Kakao OAuth
KAKAO_REST_API_KEY=your_kakao_rest_api_key
KAKAO_REDIRECT_URI=https://catus.com/auth/kakao/callback

# AI Services
GEMINI_API_KEY=your_gemini_api_key
DALLE_API_KEY=your_dalle_api_key  # or STABILITY_API_KEY

# Cloud Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=catus-diaries
AWS_REGION=ap-northeast-2

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# CORS
ALLOWED_ORIGINS=https://catus.com,https://www.catus.com
```

---

### 8.2 배포 체크리스트

- [ ] 환경변수 설정 완료
- [ ] DB 마이그레이션 실행
- [ ] HTTPS 인증서 설정
- [ ] CORS 설정 (프론트 도메인 허용)
- [ ] Rate Limiting 활성화
- [ ] 로그 모니터링 설정
- [ ] 백업 정책 수립
- [ ] Health Check 엔드포인트 구현

---

### 8.3 Health Check

```http
GET /health
```

**Response (200 OK)**:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-20T10:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "gemini": "available",
    "dalle": "available"
  }
}
```

---

## 9. 개발 참고사항

### 9.1 테스트 데이터

**테스트 사용자**:
```json
{
  "id": "test_user_001",
  "nickname": "테스트유저",
  "kakao_id": 123456789,
  "onboarding_completed": true
}
```

**샘플 감정**: "행복", "슬픔", "보통", "화남", "불안"

---

### 9.2 API 테스트 도구

**Postman Collection** (별도 제공):
- 인증 플로우
- CRUD 작업
- 에러 시나리오

**cURL 예시**:
```bash
# 로그인
curl -X POST https://api.catus.com/api/v1/auth/kakao \
  -H "Content-Type: application/json" \
  -d '{"code": "kakao_auth_code"}'

# 일기 조회
curl -X GET "https://api.catus.com/api/v1/diaries?year=2024&month=11" \
  -H "Authorization: Bearer {access_token}"
```

---

### 9.3 개발 우선순위

**Phase 1 (MVP)**:
1. 인증 (카카오 로그인, JWT)
2. 사용자 관리 (온보딩)
3. AI 채팅 (스트리밍)
4. 대화 분석 및 일기 생성
5. 일기 CRUD

**Phase 2**:
6. 익명 응원 메시지
7. 통계 API
8. 이미지 최적화

**Phase 3**:
9. 푸시 알림
10. 고급 통계
11. 성능 최적화

---

## 10. 문의 및 지원

**기술 문의**: backend-team@catus.com
**API 문서 업데이트**: 2024-11-20
**버전**: v1.0.0

---

## 부록: API 엔드포인트 요약

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | /auth/kakao | 카카오 로그인 | ❌ |
| POST | /auth/refresh | 토큰 갱신 | ❌ |
| POST | /auth/logout | 로그아웃 | ✅ |
| GET | /auth/me | 현재 사용자 정보 | ✅ |
| POST | /users/onboarding | 온보딩 정보 저장 | ✅ |
| GET | /users/{userId} | 프로필 조회 | ✅ |
| PUT | /users/{userId} | 프로필 수정 | ✅ |
| POST | /chat/stream | AI 채팅 응답 (SSE) | ✅ |
| POST | /chat/analyze | 대화 분석 및 일기 생성 | ✅ |
| GET | /diaries | 월별 일기 목록 | ✅ |
| GET | /diaries/{date} | 특정 날짜 일기 조회 | ✅ |
| PUT | /diaries/{date} | 일기 수정 | ✅ |
| DELETE | /diaries/{date} | 일기 삭제 | ✅ |
| GET | /support/received | 받은 메시지 조회 | ✅ |
| GET | /support/sent | 보낸 메시지 조회 | ✅ |
| POST | /support/send | 메시지 전송 | ✅ |
| PUT | /support/{messageId}/read | 메시지 읽음 처리 | ✅ |
| GET | /stats/emotions | 감정 통계 | ✅ |
| GET | /stats/monthly | 월별 통계 | ✅ |
| GET | /health | 헬스 체크 | ❌ |

---

**End of Document**
