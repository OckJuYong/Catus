# 🔌 프론트엔드 API 연동 명세서

> Axios 1.7.9 + TanStack React Query v5

---

## 1. Axios 구성

```typescript
// src/utils/api.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터 - JWT 토큰 자동 추가
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('catus_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 응답 인터셉터 - 401 자동 로그아웃
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('catus_access_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);
```

---

## 2. API 명세

### 🔐 인증 API

| Method | URI | Request | Response |
|--------|-----|---------|----------|
| POST | `/api/auth/kakao` | `{ code }` | `{ accessToken, refreshToken, isNewUser }` |
| POST | `/api/auth/signup` | `{ nickname, password?, diaryTime }` | `{ userId, message }` |
| POST | `/api/auth/logout` | - | `{ message }` |
| DELETE | `/api/auth/withdraw` | `{ password? }` | `{ message }` |

### 💬 채팅 API

| Method | URI | Request | Response |
|--------|-----|---------|----------|
| POST | `/api/chat/message` | `{ message, timestamp }` | `{ aiResponse, messageId }` |
| GET | `/api/chat/history` | `?page&size` | `{ messages[], pagination }` |

### 📔 일기 API

| Method | URI | Request | Response |
|--------|-----|---------|----------|
| POST | `/api/diary/generate` | `{ date, chatLogs[] }` | `{ diary }` |
| GET | `/api/diary/list` | `?year&month` | `{ diaries[], totalCount }` |
| GET | `/api/diary/{id}` | - | `{ diary, anonymousMessages[] }` |
| PUT | `/api/diary/{id}` | `{ content?, emotion? }` | `{ diary }` |
| DELETE | `/api/diary/{id}` | - | `{ message }` |
| GET | `/api/diary/random` | - | `{ diary }` |

### 💌 메시지 API

| Method | URI | Request | Response |
|--------|-----|---------|----------|
| POST | `/api/message/send` | `{ diaryId, content }` | `{ messageId }` |
| GET | `/api/message/received` | `?page&size` | `{ messages[], pagination }` |
| GET | `/api/message/notifications` | - | `{ notifications[], unreadCount }` |

### 🧠 Big5 API

| Method | URI | Request | Response |
|--------|-----|---------|----------|
| POST | `/api/big5/initial` | `{ answers[] }` | `{ scores, analysis }` |
| GET | `/api/big5/current` | - | `{ scores, lastUpdated }` |
| GET | `/api/big5/history` | `?period` | `{ history[], chartData }` |

### ⚙️ 설정 API

| Method | URI | Request | Response |
|--------|-----|---------|----------|
| GET | `/api/settings` | - | `{ settings }` |
| PUT | `/api/settings/diary-time` | `{ time }` | `{ settings }` |
| PUT | `/api/settings/notifications` | `{ anonymous }` | `{ settings }` |
| PUT | `/api/settings/theme` | `{ darkMode }` | `{ settings }` |
| PUT | `/api/settings/profile` | `{ nickname?, password? }` | `{ profile }` |

---

## 3. React Query 통합

### Query Keys
```typescript
['diary', 'list', year, month]
['diary', 'detail', diaryId]
['big5', 'current']
['big5', 'history', period]
['settings']
['messages', 'received', page, size]
['random-diary']
```

### useQuery 예시
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['big5', 'current'],
  queryFn: () => big5Api.getCurrent(),
  retry: 1,
  staleTime: 5 * 60 * 1000,
});
```

### useMutation 예시
```typescript
const createDiaryMutation = useMutation({
  mutationFn: (data: DiaryCreateData) => diaryApi.create(data),
  onSuccess: (diary) => {
    queryClient.invalidateQueries(['diary', 'list']);
    navigate(`/diary/${diary.id}`);
  },
});

createDiaryMutation.mutate({ date, chatLogs });
```

---

## 4. 에러 처리

### 표준 에러 응답
```typescript
interface ApiErrorResponse {
  message: string;
  error: string;
  statusCode: number;
}
```

### 에러 코드별 처리

| Status | 처리 |
|--------|------|
| 400 | 입력 오류 메시지 표시 |
| 401 | 자동 로그아웃 및 로그인 페이지 이동 |
| 403 | 권한 부족 메시지 |
| 404 | 리소스 없음 메시지 |
| 500 | 서버 오류 메시지 |

---

## 5. IndexedDB 통합

### 채팅 메시지 저장
```typescript
// 저장
await saveChatMessage(todayKey, {
  role: 'user',
  content: message,
  timestamp: new Date().toISOString()
}, false);

// 조회
const messages = await getChatMessagesByDate(todayKey);

// 동기화 마킹
await markMessagesAsSynced(todayKey);
```

---

## 6. API 매칭률

| 도메인 | 매칭률 | 상태 |
|--------|--------|------|
| 인증 | 4/5 (80%) | ✅ refresh 미사용 |
| 채팅 | 2/4 (50%) | ✅ IndexedDB 사용 |
| 일기 | 6/6 (100%) | ✅ 완벽 |
| 메시지 | 3/4 (75%) | ✅ read 미사용 |
| Big5 | 3/5 (60%) | ✅ 시스템 API 제외 |
| 설정 | 5/5 (100%) | ✅ 완벽 |

**전체**: 20/24 (83.3%)

---

## 7. 주요 차이점

### IndexedDB 우선
- 백엔드: `/api/chat/context/{date}` 제공
- 프론트: IndexedDB 직접 조회
- 이유: 오프라인 지원, 속도 향상

### 토큰 갱신 미구현
- 백엔드: `/api/auth/refresh` 제공
- 프론트: 401 시 즉시 로그아웃
- 향후: 자동 갱신 구현 예정

### 메시지 읽음 처리
- 백엔드: `/api/message/read/{id}` 제공
- 프론트: LocalStorage로 추적
- 이유: 간단한 상태 관리

---

## 8. 환경 설정

```env
# 개발
VITE_API_BASE_URL=http://localhost:3000

# 프로덕션
VITE_API_BASE_URL=https://api.catus.example.com
```

---

**문서 버전**: 1.0
**최종 수정**: 2025-01-21
