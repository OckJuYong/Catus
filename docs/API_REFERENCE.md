# Catus API Reference

> AI 분석용 API 명세서 - Frontend API Integration Guide

## Base Configuration

```javascript
BASE_URL: /api/v1
Content-Type: application/json
Authorization: Bearer {access_token}
```

## Authentication Flow

### Token Structure
```javascript
{
  access_token: "JWT string",
  refresh_token: "JWT string",
  expires_in: 3600  // seconds
}
```

### Storage Keys
- `catus_access_token`: Access token
- `catus_refresh_token`: Refresh token
- `catus_user`: User profile JSON string

---

## API Endpoints

### 1. Authentication APIs

#### 1.1 Kakao Login
```http
POST /api/v1/auth/kakao
Content-Type: application/json

Request Body:
{
  "code": "kakao_auth_code"
}

Response: 200 OK
{
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "nickname": "사용자닉네임",
    "profileImage": "https://image.url",
    "createdAt": "2024-11-20T00:00:00Z"
  }
}

Error: 401 Unauthorized
{
  "message": "Invalid authorization code",
  "code": "INVALID_AUTH_CODE"
}
```

#### 1.2 Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

Request Body:
{
  "refreshToken": "current_refresh_token"
}

Response: 200 OK
{
  "accessToken": "new_jwt_access_token",
  "user": { /* user object */ }
}

Error: 401 Unauthorized
{
  "message": "Invalid or expired refresh token",
  "code": "INVALID_REFRESH_TOKEN"
}
```

#### 1.3 Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer {access_token}

Response: 204 No Content

Error: 401 Unauthorized
{
  "message": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

#### 1.4 Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer {access_token}

Response: 200 OK
{
  "id": 123,
  "email": "user@example.com",
  "nickname": "사용자닉네임",
  "profileImage": "https://image.url",
  "onboardingCompleted": true,
  "createdAt": "2024-11-20T00:00:00Z"
}

Error: 401 Unauthorized
```

---

### 2. User APIs

#### 2.1 Get User Profile
```http
GET /api/v1/users/{userId}
Authorization: Bearer {access_token}

Response: 200 OK
{
  "id": 123,
  "email": "user@example.com",
  "nickname": "사용자닉네임",
  "profileImage": "https://image.url",
  "bio": "자기소개",
  "settings": {
    "darkMode": true,
    "notifications": true
  }
}

Error: 404 Not Found
{
  "message": "User not found",
  "code": "USER_NOT_FOUND"
}
```

#### 2.2 Update User Profile
```http
PUT /api/v1/users/{userId}
Authorization: Bearer {access_token}
Content-Type: application/json

Request Body:
{
  "nickname": "새닉네임",
  "bio": "새로운 자기소개",
  "profileImage": "https://new-image.url"
}

Response: 200 OK
{
  "id": 123,
  "nickname": "새닉네임",
  "bio": "새로운 자기소개",
  "profileImage": "https://new-image.url",
  "updatedAt": "2024-11-20T00:00:00Z"
}

Error: 400 Bad Request
{
  "message": "Invalid nickname format",
  "code": "INVALID_NICKNAME"
}
```

#### 2.3 Save Onboarding Data
```http
POST /api/v1/users/onboarding
Authorization: Bearer {access_token}
Content-Type: application/json

Request Body:
{
  "nickname": "사용자닉네임",
  "goals": ["감정 기록", "습관 형성"],
  "preferences": {
    "darkMode": true,
    "notifications": true
  }
}

Response: 200 OK
{
  "message": "Onboarding completed",
  "user": { /* updated user object */ }
}

Error: 400 Bad Request
```

---

### 3. Chat APIs

#### 3.1 Send Message
```http
POST /api/v1/chat/send
Authorization: Bearer {access_token}
Content-Type: application/json

Request Body:
{
  "content": "오늘 친구들과 카페에 다녀왔어"
}

Response: 200 OK
{
  "message": "재밌었겠다! 어떤 이야기를 나눴어?",
  "messageId": 456,
  "timestamp": "2024-11-20T12:00:00Z"
}

Error: 400 Bad Request
{
  "message": "Message content is required",
  "code": "EMPTY_MESSAGE"
}
```

#### 3.2 Get Chat History
```http
GET /api/v1/chat/history/{diaryId}
Authorization: Bearer {access_token}

Response: 200 OK
[
  {
    "id": 1,
    "type": "ai",
    "text": "안녕! 오늘 하루는 어땠어?",
    "timestamp": "2024-11-20T10:00:00Z"
  },
  {
    "id": 2,
    "type": "user",
    "text": "친구들과 카페에 갔어",
    "timestamp": "2024-11-20T10:05:00Z"
  }
]

Error: 404 Not Found
{
  "message": "Diary not found",
  "code": "DIARY_NOT_FOUND"
}
```

#### 3.3 End Conversation (Emotion Analysis)
```http
POST /api/v1/chat/end
Authorization: Bearer {access_token}
Content-Type: application/json

Request Body:
{
  "messages": [
    {
      "type": "user",
      "text": "오늘 친구들과 카페에 다녀왔어"
    },
    {
      "type": "ai",
      "text": "재밌었겠다! 어떤 이야기를 나눴어?"
    }
  ]
}

Response: 200 OK
{
  "emotion": "행복",
  "emotionScore": 0.85,
  "summary": "오늘은 친구들과 카페에서 즐거운 시간을 보냈다. 오랜만에 만나 수다를 떨며 행복한 하루였다.",
  "diaryId": 789,
  "createdAt": "2024-11-20T12:00:00Z"
}

Error: 400 Bad Request
{
  "message": "Insufficient conversation data",
  "code": "INSUFFICIENT_DATA"
}
```

---

### 4. Diary APIs

#### 4.1 Get Diary List (Monthly)
```http
GET /api/v1/diaries?year={year}&month={month}
Authorization: Bearer {access_token}

Example: GET /api/v1/diaries?year=2024&month=11

Response: 200 OK
[
  {
    "date": "2024-11-01",
    "emotion": "행복",
    "summary": "오늘은 좋은 날이었다...",
    "hasEntry": true
  },
  {
    "date": "2024-11-02",
    "emotion": "슬픔",
    "summary": "힘든 하루였다...",
    "hasEntry": true
  }
]

Error: 400 Bad Request
{
  "message": "Invalid year or month",
  "code": "INVALID_DATE_PARAMS"
}
```

#### 4.2 Get Diary by Date
```http
GET /api/v1/diaries/{date}
Authorization: Bearer {access_token}

Example: GET /api/v1/diaries/2024-11-20

Response: 200 OK
{
  "date": "2024-11-20",
  "emotion": "행복",
  "emotionScore": 0.85,
  "summary": "오늘은 친구들과 즐거운 시간을 보냈다...",
  "content": "친구들과 카페에서 오랜만에 만나 이야기를 나눴다...",
  "messages": [
    {
      "type": "user",
      "text": "오늘 친구들과 카페에 다녀왔어",
      "timestamp": "2024-11-20T10:00:00Z"
    }
  ],
  "createdAt": "2024-11-20T12:00:00Z",
  "updatedAt": "2024-11-20T12:00:00Z"
}

Error: 404 Not Found
{
  "message": "No diary entry for this date",
  "code": "DIARY_NOT_FOUND"
}
```

#### 4.3 Create Diary
```http
POST /api/v1/diaries
Authorization: Bearer {access_token}
Content-Type: application/json

Request Body:
{
  "date": "2024-11-20",
  "emotion": "행복",
  "emotionScore": 0.85,
  "summary": "오늘은 친구들과 즐거운 시간을 보냈다",
  "content": "친구들과 카페에서...",
  "messages": [ /* chat history */ ]
}

Response: 201 Created
{
  "id": 789,
  "date": "2024-11-20",
  "emotion": "행복",
  "summary": "오늘은 친구들과 즐거운 시간을 보냈다",
  "createdAt": "2024-11-20T12:00:00Z"
}

Error: 400 Bad Request
{
  "message": "Diary already exists for this date",
  "code": "DIARY_ALREADY_EXISTS"
}
```

#### 4.4 Update Diary
```http
PUT /api/v1/diaries/{date}
Authorization: Bearer {access_token}
Content-Type: application/json

Request Body:
{
  "emotion": "보통",
  "summary": "수정된 요약",
  "content": "수정된 내용..."
}

Response: 200 OK
{
  "date": "2024-11-20",
  "emotion": "보통",
  "summary": "수정된 요약",
  "updatedAt": "2024-11-20T15:00:00Z"
}

Error: 404 Not Found
```

#### 4.5 Delete Diary
```http
DELETE /api/v1/diaries/{date}
Authorization: Bearer {access_token}

Response: 204 No Content

Error: 404 Not Found
{
  "message": "Diary not found",
  "code": "DIARY_NOT_FOUND"
}
```

---

### 5. Support (Anonymous Messages) APIs

#### 5.1 Get Received Messages
```http
GET /api/v1/support/received
Authorization: Bearer {access_token}

Response: 200 OK
[
  {
    "id": 101,
    "message": "오늘도 수고했어요!",
    "receivedAt": "2024-11-20T10:00:00Z",
    "isRead": false
  },
  {
    "id": 102,
    "message": "힘내세요!",
    "receivedAt": "2024-11-19T15:00:00Z",
    "isRead": true
  }
]

Error: 401 Unauthorized
```

#### 5.2 Get Sent Messages
```http
GET /api/v1/support/sent
Authorization: Bearer {access_token}

Response: 200 OK
[
  {
    "id": 201,
    "message": "응원합니다!",
    "sentAt": "2024-11-20T09:00:00Z"
  }
]

Error: 401 Unauthorized
```

#### 5.3 Send Anonymous Message
```http
POST /api/v1/support/send
Authorization: Bearer {access_token}
Content-Type: application/json

Request Body:
{
  "message": "오늘도 화이팅하세요!"
}

Response: 201 Created
{
  "id": 202,
  "message": "오늘도 화이팅하세요!",
  "sentAt": "2024-11-20T12:00:00Z"
}

Error: 400 Bad Request
{
  "message": "Message is required",
  "code": "EMPTY_MESSAGE"
}
```

#### 5.4 Mark Message as Read
```http
PUT /api/v1/support/{messageId}/read
Authorization: Bearer {access_token}

Response: 200 OK
{
  "id": 101,
  "isRead": true,
  "readAt": "2024-11-20T12:00:00Z"
}

Error: 404 Not Found
{
  "message": "Message not found",
  "code": "MESSAGE_NOT_FOUND"
}
```

---

### 6. Statistics APIs

#### 6.1 Get Emotion Statistics
```http
GET /api/v1/stats/emotions?year={year}&month={month}
Authorization: Bearer {access_token}

Example: GET /api/v1/stats/emotions?year=2024&month=11

Response: 200 OK
{
  "period": {
    "year": 2024,
    "month": 11
  },
  "emotions": {
    "행복": 12,
    "슬픔": 5,
    "불안": 3,
    "화남": 2,
    "보통": 8
  },
  "dominantEmotion": "행복",
  "totalEntries": 30
}

Error: 400 Bad Request
```

#### 6.2 Get Monthly Statistics
```http
GET /api/v1/stats/monthly?year={year}&month={month}
Authorization: Bearer {access_token}

Response: 200 OK
{
  "period": {
    "year": 2024,
    "month": 11
  },
  "totalEntries": 30,
  "longestStreak": 15,
  "currentStreak": 7,
  "emotionDistribution": {
    "행복": 40.0,
    "슬픔": 16.67,
    "불안": 10.0,
    "화남": 6.67,
    "보통": 26.67
  },
  "averageEmotionScore": 0.65
}

Error: 400 Bad Request
```

---

## Error Response Format

All API errors follow this structure:

```javascript
{
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    // Optional additional context
  },
  "timestamp": "2024-11-20T12:00:00Z"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or expired token |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `DUPLICATE_ENTRY` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Data Models

### User Model
```typescript
interface User {
  id: number;
  email: string;
  nickname: string;
  profileImage: string;
  bio?: string;
  onboardingCompleted: boolean;
  settings: {
    darkMode: boolean;
    notifications: boolean;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Diary Model
```typescript
interface Diary {
  id: number;
  date: string;          // YYYY-MM-DD
  emotion: '행복' | '슬픔' | '불안' | '화남' | '보통';
  emotionScore: number;  // 0.0 - 1.0
  summary: string;
  content: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}
```

### Message Model
```typescript
interface Message {
  id: number;
  type: 'user' | 'ai';
  text: string;
  timestamp: string;
}
```

### SupportMessage Model
```typescript
interface SupportMessage {
  id: number;
  message: string;
  isRead: boolean;
  receivedAt?: string;  // for received messages
  sentAt?: string;      // for sent messages
  readAt?: string;
}
```

---

## Rate Limiting

- **Authentication endpoints**: 10 requests per minute
- **Chat endpoints**: 60 requests per minute
- **Diary endpoints**: 100 requests per minute
- **Support endpoints**: 30 requests per minute
- **Stats endpoints**: 60 requests per minute

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000
```

---

## Pagination

For list endpoints that support pagination:

```http
GET /api/v1/diaries?page=1&limit=20

Response Headers:
X-Total-Count: 150
X-Total-Pages: 8
X-Current-Page: 1
Link: </api/v1/diaries?page=2&limit=20>; rel="next"
```

---

## WebSocket Events (Future)

Real-time chat updates via WebSocket:

```javascript
// Connection
ws://api.catus.app/ws?token={access_token}

// Events
{
  "event": "message.new",
  "data": {
    "messageId": 123,
    "text": "AI response...",
    "timestamp": "2024-11-20T12:00:00Z"
  }
}

{
  "event": "typing",
  "data": {
    "isTyping": true
  }
}
```

---

**API Version**: v1
**Last Updated**: 2025-11-20
**Base URL**: `https://api.catus.app/api/v1`
