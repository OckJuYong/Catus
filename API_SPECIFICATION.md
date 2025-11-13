# Catus Backend API Specification

**Base URL**: `http://localhost:8080/api/v1`
**Version**: 1.0
**Last Updated**: 2024-11-11

**Authentication**: Most endpoints require JWT Bearer token in `Authorization` header.

---

## Table of Contents

1. [Authentication APIs](#1-authentication-apis)
2. [User Profile APIs](#2-user-profile-apis)
3. [Chat APIs](#3-chat-apis)
4. [Health Check](#4-health-check)

---

## 1. Authentication APIs

### 1.1 Login with Kakao OAuth

**Endpoint**: `POST /auth/login`

**Description**: Exchange Kakao OAuth authorization code for JWT tokens.

**Authentication**: None (Public)

**Request Body**:
```json
{
  "code": "string (required)",        // Kakao OAuth authorization code
  "redirectUri": "string (required)"   // OAuth redirect URI
}
```

**Success Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400000,  // 24 hours in milliseconds
  "isNewUser": false,
  "user": {
    "userId": 123,
    "email": "user@example.com",
    "nickname": "홍길동",
    "profileImageUrl": "https://..."
  }
}
```

**Error Responses**:
- `401 Unauthorized` - Invalid Kakao authorization code
- `503 Service Unavailable` - Kakao API error

**Example**:
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "code": "abc123xyz",
    "redirectUri": "http://localhost:3000/callback"
  }'
```

---

### 1.2 Refresh Access Token

**Endpoint**: `POST /auth/refresh`

**Description**: Get new access token using refresh token.

**Authentication**: Refresh token in Authorization header

**Request Headers**:
```
Authorization: Bearer <refresh_token>
```

**Success Response** (200 OK):
```json
{
  "accessToken": "eyJhbGc...",     // New access token
  "refreshToken": "eyJhbGc...",    // Same refresh token
  "tokenType": "Bearer",
  "expiresIn": 86400000,
  "user": {
    "userId": 123,
    "email": "user@example.com",
    "nickname": "홍길동",
    "profileImageUrl": "https://..."
  }
}
```

**Error Responses**:
- `401 Unauthorized` - Invalid or expired refresh token

**Example**:
```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN"
```

---

### 1.3 Logout

**Endpoint**: `POST /auth/logout`

**Description**: Invalidate refresh token and logout user.

**Authentication**: Required (JWT access token)

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Success Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses**:
- `401 Unauthorized` - Invalid or missing token

**Example**:
```bash
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 2. User Profile APIs

### 2.1 Get Current User Profile

**Endpoint**: `GET /users/profile`

**Description**: Get authenticated user's profile information.

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Success Response** (200 OK):
```json
{
  "userId": 123,
  "email": "user@example.com",
  "nickname": "홍길동",
  "profileImageUrl": "https://s3.../profile-123.jpg",
  "bio": "안녕하세요! 반갑습니다.",
  "gender": "FEMALE",
  "ageGroup": "20대",
  "occupation": "대학생",
  "servicePurpose": "감정 일기 기록",
  "createdAt": "2024-11-01T10:00:00",
  "updatedAt": "2024-11-10T15:30:00"
}
```

**Error Responses**:
- `401 Unauthorized` - Invalid or missing token
- `404 Not Found` - User not found

**Example**:
```bash
curl -X GET http://localhost:8080/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 2.2 Update User Profile

**Endpoint**: `PUT /users/profile`

**Description**: Update user profile information.

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "nickname": "string (2-20 chars)",     // Optional
  "bio": "string (max 500 chars)",       // Optional
  "gender": "MALE | FEMALE | OTHER",     // Optional
  "ageGroup": "string",                  // Optional (e.g., "20대")
  "occupation": "string",                // Optional
  "servicePurpose": "string"             // Optional
}
```

**Success Response** (200 OK):
```json
{
  "userId": 123,
  "email": "user@example.com",
  "nickname": "새로운닉네임",
  "profileImageUrl": "https://...",
  "bio": "업데이트된 소개",
  "gender": "FEMALE",
  "ageGroup": "20대",
  "occupation": "직장인",
  "servicePurpose": "일상 기록",
  "createdAt": "2024-11-01T10:00:00",
  "updatedAt": "2024-11-11T15:00:00"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid input (e.g., nickname too long)
- `401 Unauthorized` - Invalid or missing token

**Example**:
```bash
curl -X PUT http://localhost:8080/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "새로운닉네임",
    "bio": "안녕하세요! 잘 부탁드립니다."
  }'
```

---

### 2.3 Upload Profile Image

**Endpoint**: `POST /users/profile/image`

**Description**: Upload or update user profile image.

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body** (multipart/form-data):
```
file: <image file> (max 10MB)
```

**Accepted file types**: JPG, JPEG, PNG, GIF

**Success Response** (200 OK):
```json
{
  "userId": 123,
  "email": "user@example.com",
  "nickname": "홍길동",
  "profileImageUrl": "https://s3.amazonaws.com/.../new-profile-123.jpg",
  "bio": "...",
  "createdAt": "2024-11-01T10:00:00",
  "updatedAt": "2024-11-11T15:30:00"
}
```

**Error Responses**:
- `400 Bad Request` - Invalid file type or file too large
- `401 Unauthorized` - Invalid or missing token
- `500 Internal Server Error` - S3 upload failed

**Example**:
```bash
curl -X POST http://localhost:8080/api/v1/users/profile/image \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/profile.jpg"
```

---

## 3. Chat APIs

### 3.1 Send Message to AI

**Endpoint**: `POST /chat/messages`

**Description**: Send a message to AI companion (Dali) and receive response.

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "message": "string (1-500 chars, required)"
}
```

**Success Response** (200 OK):
```json
{
  "id": 456,
  "userMessage": "오늘 기분이 좋지 않아...",
  "aiResponse": "그랬구나, 무슨 일이 있었어? 달리가 옆에 있을게 🐱",
  "detectedEmotion": "SAD",
  "timestamp": "2024-11-11T14:30:00"
}
```

**Detected Emotions**:
- `HAPPY` - 기쁨, 행복
- `SAD` - 슬픔, 우울
- `ANGRY` - 화남, 짜증
- `ANXIOUS` - 불안, 걱정
- `NORMAL` - 중립

**Error Responses**:
- `400 Bad Request` - Message empty or too long
- `401 Unauthorized` - Invalid or missing token
- `503 Service Unavailable` - Gemini API error

**Example**:
```bash
curl -X POST http://localhost:8080/api/v1/chat/messages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "오늘 하루 어땠어?"
  }'
```

**Notes**:
- AI uses conversation context (last 10 messages)
- Response time: typically 1-3 seconds
- Emotion detection is keyword-based

---

### 3.2 Get Conversation History

**Endpoint**: `GET /chat/messages`

**Description**: Retrieve conversation history with optional date filtering and pagination.

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `date` (optional): Filter by date in format `yyyy-MM-dd` (e.g., `2024-11-10`)
- `page` (optional): Page number, 0-indexed (default: `0`)
- `size` (optional): Page size, max 100 (default: `20`)

**Success Response** (200 OK):
```json
{
  "content": [
    {
      "id": 456,
      "userMessage": "오늘 기분이 좋지 않아...",
      "aiResponse": "그랬구나, 무슨 일이 있었어? 달리가 옆에 있을게 🐱",
      "detectedEmotion": "SAD",
      "timestamp": "2024-11-11T14:30:00"
    },
    {
      "id": 455,
      "userMessage": "달리야 안녕!",
      "aiResponse": "안녕! 오늘 하루 어땠어? 😊",
      "detectedEmotion": "NORMAL",
      "timestamp": "2024-11-11T14:25:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": {
      "sorted": false,
      "unsorted": true
    },
    "offset": 0,
    "paged": true,
    "unpaged": false
  },
  "totalElements": 50,
  "totalPages": 3,
  "last": false,
  "first": true,
  "size": 20,
  "number": 0,
  "numberOfElements": 20
}
```

**Error Responses**:
- `401 Unauthorized` - Invalid or missing token

**Examples**:

Get all messages (first page):
```bash
curl -X GET "http://localhost:8080/api/v1/chat/messages?page=0&size=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Filter by specific date:
```bash
curl -X GET "http://localhost:8080/api/v1/chat/messages?date=2024-11-10&page=0&size=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 3.3 Get Recent Messages

**Endpoint**: `GET /chat/messages/recent`

**Description**: Get the most recent N messages (for quick context display).

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `limit` (optional): Number of recent messages (default: `10`, max: `50`)

**Success Response** (200 OK):
```json
[
  {
    "id": 456,
    "userMessage": "오늘 기분이 좋지 않아...",
    "aiResponse": "그랬구나, 무슨 일이 있었어? 달리가 옆에 있을게 🐱",
    "detectedEmotion": "SAD",
    "timestamp": "2024-11-11T14:30:00"
  },
  {
    "id": 455,
    "userMessage": "달리야 안녕!",
    "aiResponse": "안녕! 오늘 하루 어땠어? 😊",
    "detectedEmotion": "NORMAL",
    "timestamp": "2024-11-11T14:25:00"
  }
]
```

**Error Responses**:
- `401 Unauthorized` - Invalid or missing token

**Example**:
```bash
curl -X GET "http://localhost:8080/api/v1/chat/messages/recent?limit=5" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 3.4 Get Message Count

**Endpoint**: `GET /chat/messages/count`

**Description**: Get total number of chat messages for the authenticated user.

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Success Response** (200 OK):
```json
{
  "count": 245
}
```

**Error Responses**:
- `401 Unauthorized` - Invalid or missing token

**Example**:
```bash
curl -X GET http://localhost:8080/api/v1/chat/messages/count \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 4. Health Check

### 4.1 Health Check

**Endpoint**: `GET /actuator/health`

**Description**: Check if the service is running.

**Authentication**: None (Public)

**Success Response** (200 OK):
```json
{
  "status": "UP"
}
```

**Example**:
```bash
curl -X GET http://localhost:8080/actuator/health
```

---

## Error Response Format

All error responses follow this structure:

```json
{
  "status": 400,
  "code": "VAL001",
  "message": "Invalid input parameters",
  "details": "Detailed error description",
  "timestamp": "2024-11-11T15:30:00",
  "path": "/api/v1/users/profile",
  "fieldErrors": [  // Optional, for validation errors
    {
      "field": "nickname",
      "rejectedValue": "a",
      "message": "Nickname must be between 2 and 20 characters"
    }
  ]
}
```

### Common Error Codes

**Authentication (AUTH)**:
- `AUTH001` - Invalid or expired token
- `AUTH002` - Authentication token is missing
- `AUTH003` - Token has expired
- `AUTH004` - Unauthorized access
- `AUTH006` - Invalid Kakao authorization code
- `AUTH007` - Kakao API communication error

**User (USER)**:
- `USER001` - User not found
- `USER002` - User already exists
- `USER003` - User profile not found
- `USER004` - User account is inactive

**Validation (VAL)**:
- `VAL001` - Invalid input parameters
- `VAL002` - Invalid file type
- `VAL003` - File size exceeds maximum limit
- `VAL005` - Invalid message content or format

**Chat (CHAT)**:
- `CHAT001` - Chat message not found
- `CHAT002` - Gemini API communication error
- `CHAT003` - Message exceeds maximum length

**System (SYS)**:
- `SYS001` - Internal server error
- `SYS002` - Database operation failed
- `SYS003` - External API communication error
- `SYS004` - Failed to upload file to S3
- `SYS005` - Redis operation failed

---

## Authentication Flow

### 1. Kakao OAuth Login Flow

```
1. Frontend: Redirect user to Kakao OAuth
   https://kauth.kakao.com/oauth/authorize
     ?client_id={KAKAO_CLIENT_ID}
     &redirect_uri={REDIRECT_URI}
     &response_type=code

2. Kakao: User authorizes, redirects back with code
   {REDIRECT_URI}?code=abc123xyz

3. Frontend: Send code to backend
   POST /api/v1/auth/login
   { "code": "abc123xyz", "redirectUri": "..." }

4. Backend: Exchange code for tokens
   - Calls Kakao API
   - Creates or finds user
   - Generates JWT tokens
   - Returns access + refresh tokens

5. Frontend: Store tokens
   - Access token: for API calls
   - Refresh token: for getting new access token
```

### 2. API Call with Authentication

```
Request:
GET /api/v1/users/profile
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Backend:
1. Extract token from Authorization header
2. Validate token signature
3. Check token expiration
4. Extract user ID from token
5. Process request
6. Return response
```

### 3. Token Refresh Flow

```
When access token expires (24 hours):

1. Frontend: Detect 401 error
2. Frontend: Call refresh endpoint
   POST /api/v1/auth/refresh
   Headers: Authorization: Bearer {refresh_token}

3. Backend: Validate refresh token
   - Check Redis for stored refresh token
   - Validate token signature
   - Generate new access token

4. Backend: Return new access token
   {
     "accessToken": "new_token...",
     "refreshToken": "same_token..."
   }

5. Frontend: Retry original request with new access token
```

---

## Rate Limits (To Be Implemented)

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| POST /auth/login | 10 requests | 1 minute |
| POST /chat/messages | 60 requests | 1 hour |
| All other endpoints | 1000 requests | 1 hour |

---

## Pagination

Paginated endpoints return this structure:

```json
{
  "content": [],           // Array of results
  "pageable": {
    "pageNumber": 0,       // Current page (0-indexed)
    "pageSize": 20,        // Page size
    "offset": 0,
    "paged": true
  },
  "totalElements": 100,    // Total number of items
  "totalPages": 5,         // Total number of pages
  "last": false,           // Is this the last page?
  "first": true,           // Is this the first page?
  "size": 20,              // Page size
  "number": 0,             // Current page number
  "numberOfElements": 20   // Number of items in current page
}
```

---

## Data Types

### EmotionType (Enum)
- `HAPPY` - 기쁨, 행복한 감정
- `SAD` - 슬픔, 우울한 감정
- `ANGRY` - 화남, 짜증난 감정
- `ANXIOUS` - 불안, 걱정하는 감정
- `NORMAL` - 중립적인 감정

### Gender (Enum)
- `MALE` - 남성
- `FEMALE` - 여성
- `OTHER` - 기타

### UserStatus (Enum)
- `ACTIVE` - 활성 계정
- `INACTIVE` - 비활성 계정
- `DELETED` - 삭제된 계정

---

## Swagger Documentation

Interactive API documentation is available at:

**URL**: http://localhost:8080/swagger-ui.html

Features:
- Try out APIs directly from browser
- View request/response schemas
- See all available endpoints
- Authentication support

---

## Environment Variables

Required environment variables for API keys and configuration:

```bash
# JWT
JWT_SECRET=your_256_bit_secret_key_here

# Kakao OAuth
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
KAKAO_REDIRECT_URI=http://localhost:8080/api/v1/auth/callback

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/catus_db
SPRING_DATASOURCE_USERNAME=catus_user
SPRING_DATASOURCE_PASSWORD=catus_pass

# Redis
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379

# AWS S3
AWS_S3_BUCKET=catus-diary-images
AWS_S3_REGION=ap-northeast-2
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_KEY=your_aws_secret_key
```

---

## Testing with Postman

### 1. Import Collection

Create a Postman collection with these endpoints or use Swagger's export feature.

### 2. Set Up Environment Variables

```
BASE_URL: http://localhost:8080/api/v1
ACCESS_TOKEN: <will be set after login>
REFRESH_TOKEN: <will be set after login>
```

### 3. Test Sequence

1. **Login** → Save tokens to environment variables
2. **Get Profile** → Verify authentication works
3. **Send Chat Message** → Test AI integration
4. **Get Chat History** → Verify message was saved
5. **Update Profile** → Test profile update
6. **Logout** → Verify token invalidation

---

## Support & Contact

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Health Check**: http://localhost:8080/actuator/health
- **Source Code**: C:\Users\hoonl\dev\Catus_Backend
- **Documentation**: See PHASE2_IMPLEMENTATION_SUMMARY.md and PHASE3_IMPLEMENTATION_SUMMARY.md

---

**Last Updated**: 2024-11-11
**API Version**: 1.0
**Implementation Status**: Phase 2 & 3 Complete ✅
