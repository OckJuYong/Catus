# 프론트엔드 API 명세서

## 기본 정보
- **Base URL**: `${VITE_API_BASE_URL}/api/v1`
- **인증 방식**: Bearer Token (JWT)
- **Content-Type**: `application/json`

---

## 1. 인증 (Authentication)

### 1.1 카카오 로그인
```
POST /auth/kakao
```

**Request**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | string | ✅ | 카카오 OAuth 인증 코드 |

**Response**
| Field | Type | Description |
|-------|------|-------------|
| accessToken | string | JWT 액세스 토큰 |
| refreshToken | string | JWT 리프레시 토큰 |
| user.id | string | 사용자 ID |
| user.nickname | string | 닉네임 |
| user.profileImage | string | 프로필 이미지 URL |

---

### 1.2 토큰 갱신
```
POST /auth/refresh
```

**Request**
| Field | Type | Required |
|-------|------|----------|
| refreshToken | string | ✅ |

**Response**
| Field | Type |
|-------|------|
| accessToken | string |

---

### 1.3 로그아웃
```
POST /auth/logout
```

**Headers**: `Authorization: Bearer {token}`

**Response**
| Field | Type |
|-------|------|
| message | string |

---

### 1.4 현재 사용자 정보 조회
```
GET /auth/me
```

**Headers**: `Authorization: Bearer {token}`

**Response**
| Field | Type |
|-------|------|
| id | string |
| nickname | string |
| profileImage | string |
| createdAt | string (ISO 8601) |

---

## 2. 사용자 (User)

### 2.1 온보딩 정보 저장
```
POST /users/onboarding
```

**Headers**: `Authorization: Bearer {token}`

**Request**
| Field | Type | Required | Options |
|-------|------|----------|---------|
| gender | string | ✅ | "여자", "남자", "선택 안함" |
| ageGroup | string | ✅ | "10대", "20대", "30대", "40대 이상" |
| occupation | string | ✅ | "학생", "직장인", "기타" |
| purpose | string | ✅ | 자유 텍스트 |

**Response**
| Field | Type |
|-------|------|
| message | string |
| user.id | string |
| user.onboardingCompleted | boolean |

---

### 2.2 프로필 조회
```
GET /users/{userId}
```

**Headers**: `Authorization: Bearer {token}`

**Response**
| Field | Type |
|-------|------|
| id | string |
| nickname | string |
| profileImage | string |
| gender | string |
| ageGroup | string |
| occupation | string |
| purpose | string |

---

### 2.3 프로필 수정
```
PUT /users/{userId}
```

**Headers**: `Authorization: Bearer {token}`

**Request**
| Field | Type | Required |
|-------|------|----------|
| nickname | string | ❌ |
| profileImage | string | ❌ |

**Response**
| Field | Type |
|-------|------|
| message | string |
| user.id | string |
| user.nickname | string |
| user.profileImage | string |

---

## 3. 채팅 (Chat)

> **📌 중요**: 채팅 메시지는 **프론트엔드 비동기 DB(IndexedDB 등)에 저장**됩니다.
> 백엔드는 채팅 메시지를 저장하지 않고, **대화 종료 시 분석(요약, 그림일기, 감정)만 수행**합니다.

### 3.1 대화 종료 및 분석
```
POST /chat/analyze
```

**Headers**: `Authorization: Bearer {token}`

**Request**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| date | string (YYYY-MM-DD) | ✅ | 일기 날짜 |
| messages | array | ✅ | 전체 대화 내용 |
| messages[].role | string | ✅ | "user" \| "assistant" |
| messages[].content | string | ✅ | 메시지 내용 |
| messages[].timestamp | string (ISO 8601) | ✅ | 메시지 시간 |

**Response**
| Field | Type | Description |
|-------|------|-------------|
| diaryId | string | 생성된 일기 ID |
| emotion | string | 분석된 감정 ("행복", "슬픔", "보통", "화남", "불안") |
| summary | string | 대화 요약 (2-3줄) |
| pictureUrl | string | 생성된 그림일기 이미지 URL |

**설명**
- 프론트에서 비동기 DB에 저장된 전체 대화 내용을 전송
- 백엔드는 대화 분석 후 일기 생성 (요약, 감정, 그림일기)
- 채팅 메시지 자체는 백엔드에 저장하지 않음

---

## 4. 일기 (Diary)

### 4.1 일기 목록 조회 (월별)
```
GET /diaries?year={year}&month={month}
```

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| year | int | ✅ | 연도 (예: 2024) |
| month | int | ✅ | 월 (1~12) |

**Response**
| Field | Type |
|-------|------|
| [].id | string |
| [].date | string (YYYY-MM-DD) |
| [].emotion | string |
| [].summary | string |
| [].pictureUrl | string |
| [].createdAt | string (ISO 8601) |

---

### 4.2 특정 날짜 일기 조회
```
GET /diaries/{date}
```

**Headers**: `Authorization: Bearer {token}`

**Path Parameters**
| Field | Type | Format |
|-------|------|--------|
| date | string | YYYY-MM-DD |

**Response**
| Field | Type | Description |
|-------|------|-------------|
| id | string | 일기 ID |
| date | string (YYYY-MM-DD) | 일기 날짜 |
| emotion | string | 감정 |
| summary | string | 대화 요약 |
| pictureUrl | string | 그림일기 URL |
| createdAt | string (ISO 8601) | 생성 시간 |

**설명**
- 일기 상세 정보만 반환 (채팅 메시지는 프론트 비동기 DB에서 조회)

---

### 4.3 일기 수정
```
PUT /diaries/{date}
```

**Headers**: `Authorization: Bearer {token}`

**Request**
| Field | Type | Required |
|-------|------|----------|
| emotion | string | ❌ |
| summary | string | ❌ |

**Response**
| Field | Type |
|-------|------|
| id | string |
| date | string (YYYY-MM-DD) |
| emotion | string |
| summary | string |
| updatedAt | string (ISO 8601) |

---

### 4.4 일기 삭제
```
DELETE /diaries/{date}
```

**Headers**: `Authorization: Bearer {token}`

**Response**
| Field | Type |
|-------|------|
| message | string |

**설명**
- 일기 삭제 시 프론트에서도 비동기 DB의 해당 날짜 채팅 기록 삭제 필요

---

## 5. 익명 응원 메시지 (Support)

### 5.1 받은 메시지 조회
```
GET /support/received
```

**Headers**: `Authorization: Bearer {token}`

**Response**
| Field | Type |
|-------|------|
| [].id | string |
| [].text | string |
| [].isRead | boolean |
| [].createdAt | string (ISO 8601) |

---

### 5.2 보낸 메시지 조회
```
GET /support/sent
```

**Headers**: `Authorization: Bearer {token}`

**Response**
| Field | Type |
|-------|------|
| [].id | string |
| [].text | string |
| [].createdAt | string (ISO 8601) |

---

### 5.3 메시지 전송
```
POST /support/send
```

**Headers**: `Authorization: Bearer {token}`

**Request**
| Field | Type | Required | Max Length |
|-------|------|----------|------------|
| text | string | ✅ | 100자 |

**Response**
| Field | Type |
|-------|------|
| id | string |
| text | string |
| createdAt | string (ISO 8601) |

---

### 5.4 메시지 읽음 처리
```
PUT /support/{messageId}/read
```

**Headers**: `Authorization: Bearer {token}`

**Response**
| Field | Type |
|-------|------|
| id | string |
| isRead | boolean |

---

## 6. 통계 (Statistics)

### 6.1 감정 통계 조회
```
GET /stats/emotions?year={year}&month={month}
```

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**
| Field | Type | Required |
|-------|------|----------|
| year | int | ✅ |
| month | int | ✅ |

**Response**
| Field | Type | Description |
|-------|------|-------------|
| emotions | array | 해당 월의 모든 감정 기록 |
| emotions[].date | string (YYYY-MM-DD) | 일기 날짜 |
| emotions[].emotion | string | 감정 ("행복", "슬픔", "보통", "화남", "불안") |

---

### 6.2 월별 통계 조회
```
GET /stats/monthly?year={year}&month={month}
```

**Headers**: `Authorization: Bearer {token}`

**Response**
| Field | Type |
|-------|------|
| totalDiaries | int |
| mostFrequentEmotion | string |
| averageMessagesPerDay | float |

---

## 7. 에러 응답

**공통 에러 형식**
| Field | Type |
|-------|------|
| message | string |
| error | string (ERROR_CODE) |
| statusCode | int |

**주요 상태 코드**
| Code | 설명 | 프론트 처리 |
|------|------|------------|
| 401 | 인증 실패 | 토큰 삭제 → 로그인 페이지 |
| 403 | 권한 없음 | 에러 메시지 표시 |
| 404 | 리소스 없음 | 안내 메시지 표시 |
| 500 | 서버 에러 | "일시적 오류" 표시 |

---

## 8. 참고사항

### 8.1 환경변수
```env
VITE_API_BASE_URL=https://your-backend.com
VITE_KAKAO_REST_API_KEY=your_kakao_key
VITE_KAKAO_REDIRECT_URI=https://your-frontend.com/auth/kakao/callback
```

### 8.2 프론트엔드 저장소 구조

**localStorage**
| Key | Type | Description |
|-----|------|-------------|
| catus_access_token | string | JWT 토큰 |
| catus_onboarding_completed | boolean | 온보딩 완료 여부 |
| received_messages | array | 받은 응원 메시지 |
| last_checked_received_count | int | 마지막 확인 메시지 개수 |
| support_tutorial_shown | boolean | 튜토리얼 표시 여부 |

**비동기 DB (IndexedDB/AsyncStorage)**
| Store | Key | Value | Description |
|-------|-----|-------|-------------|
| chat_messages | date (YYYY-MM-DD) | array | 날짜별 채팅 메시지 |
| chat_messages[].role | - | "user" \| "assistant" | 메시지 발신자 |
| chat_messages[].content | - | string | 메시지 내용 |
| chat_messages[].timestamp | - | string (ISO 8601) | 메시지 시간 |

### 8.3 감정 타입
```javascript
type Emotion = "행복" | "슬픔" | "보통" | "화남" | "불안";
```

### 8.4 날짜 형식
- **날짜**: `YYYY-MM-DD` (예: `2024-11-20`)
- **타임스탬프**: ISO 8601 (예: `2024-11-20T12:34:56Z`)

### 8.5 채팅 데이터 흐름
```
[메시지 전송]
사용자 입력 → 프론트 비동기 DB 저장 (role: "user")
  ↓
POST /chat/stream → AI 응답
  ↓
프론트 비동기 DB 저장 (role: "assistant")

[대화 종료]
비동기 DB에서 전체 메시지 조회
  ↓
POST /chat/analyze (전체 대화 전송)
  ↓
백엔드 분석 → 일기 생성 (요약, 감정, 그림일기)
  ↓
일기만 백엔드에 저장 (채팅 메시지는 저장 안함)
```
