# Frontend API Specification

## Overview

This document provides comprehensive API specifications for the Catus application frontend.

**Base URL**: `http://localhost:8080/api/v1` (configurable via `VITE_API_BASE_URL`)

**Tech Stack**:
- React 19.1.1
- Vite (Build tool)
- TanStack React Query (Data fetching)
- Fetch API (HTTP client)

**Authentication**: Bearer Token (JWT)

---

## Table of Contents

1. [Authentication API](#authentication-api)
2. [User API](#user-api)
3. [Chat API](#chat-api)
4. [Diary API](#diary-api)
5. [Support API](#support-api)
6. [Statistics API](#statistics-api)
7. [Error Handling](#error-handling)

---

## Authentication API

### Kakao Login

**Endpoint**: `POST /auth/kakao`

**Description**: Authenticate user with Kakao OAuth authorization code

**Request Body**:
```json
{
  "code": "string"
}
```

**Response**:
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "user": {
    "id": "string",
    "email": "string",
    "nickname": "string"
  }
}
```

**Example Usage**:
```javascript
import { authApi } from '@/utils/api';

const handleKakaoLogin = async (code) => {
  try {
    const response = await authApi.kakaoLogin(code);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

---

### Refresh Token

**Endpoint**: `POST /auth/refresh`

**Description**: Refresh expired access token using refresh token

**Request Body**:
```json
{
  "refreshToken": "string"
}
```

**Response**:
```json
{
  "accessToken": "string",
  "refreshToken": "string"
}
```

**Example Usage**:
```javascript
import { authApi } from '@/utils/api';

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  const response = await authApi.refreshToken(refreshToken);
  localStorage.setItem('accessToken', response.accessToken);
};
```

---

### Logout

**Endpoint**: `POST /auth/logout`

**Description**: Logout current user and invalidate tokens

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response**:
```json
{
  "message": "Logout successful"
}
```

**Example Usage**:
```javascript
import { authApi } from '@/utils/api';

const handleLogout = async () => {
  await authApi.logout();
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};
```

---

### Get Current User

**Endpoint**: `GET /auth/me`

**Description**: Get current authenticated user information

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response**:
```json
{
  "id": "string",
  "email": "string",
  "nickname": "string",
  "profileImage": "string",
  "createdAt": "ISO8601 datetime"
}
```

**Example Usage**:
```javascript
import { authApi } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';

const useCurrentUser = () => {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
  });
};
```

---

## User API

### Get User Profile

**Endpoint**: `GET /users/:userId`

**Description**: Get user profile by user ID

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Path Parameters**:
- `userId` (string, required): User ID

**Response**:
```json
{
  "id": "string",
  "email": "string",
  "nickname": "string",
  "profileImage": "string",
  "bio": "string",
  "createdAt": "ISO8601 datetime",
  "updatedAt": "ISO8601 datetime"
}
```

**Example Usage**:
```javascript
import { userApi } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';

const useUserProfile = (userId) => {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => userApi.getProfile(userId),
    enabled: !!userId,
  });
};
```

---

### Update User Profile

**Endpoint**: `PUT /users/:userId`

**Description**: Update user profile information

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Path Parameters**:
- `userId` (string, required): User ID

**Request Body**:
```json
{
  "nickname": "string",
  "bio": "string",
  "profileImage": "string"
}
```

**Response**:
```json
{
  "id": "string",
  "email": "string",
  "nickname": "string",
  "profileImage": "string",
  "bio": "string",
  "updatedAt": "ISO8601 datetime"
}
```

**Example Usage**:
```javascript
import { userApi } from '@/utils/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useUpdateProfile = (userId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => userApi.updateProfile(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', userId] });
    },
  });
};
```

---

### Save Onboarding Data

**Endpoint**: `POST /users/onboarding`

**Description**: Save user onboarding information

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "nickname": "string",
  "interests": ["string"],
  "goals": ["string"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Onboarding data saved successfully"
}
```

**Example Usage**:
```javascript
import { userApi } from '@/utils/api';

const saveOnboardingData = async (data) => {
  await userApi.saveOnboarding(data);
  // Redirect to main app
};
```

---

## Chat API

### Send Message

**Endpoint**: `POST /chat/send`

**Description**: Send a message to the AI chatbot

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "content": "string"
}
```

**Response**:
```json
{
  "id": "string",
  "role": "assistant",
  "content": "string",
  "timestamp": "ISO8601 datetime"
}
```

**Example Usage**:
```javascript
import { chatApi } from '@/utils/api';
import { useMutation } from '@tanstack/react-query';

const useSendMessage = () => {
  return useMutation({
    mutationFn: (content) => chatApi.sendMessage(content),
  });
};
```

---

### Get Chat History

**Endpoint**: `GET /chat/history/:diaryId`

**Description**: Get chat history for a specific diary entry

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Path Parameters**:
- `diaryId` (string, required): Diary ID

**Response**:
```json
{
  "messages": [
    {
      "id": "string",
      "role": "user" | "assistant",
      "content": "string",
      "timestamp": "ISO8601 datetime"
    }
  ]
}
```

**Example Usage**:
```javascript
import { chatApi } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';

const useChatHistory = (diaryId) => {
  return useQuery({
    queryKey: ['chat', 'history', diaryId],
    queryFn: () => chatApi.getHistory(diaryId),
    enabled: !!diaryId,
  });
};
```

---

### End Conversation

**Endpoint**: `POST /chat/end`

**Description**: End chat conversation and generate diary entry

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "messages": [
    {
      "role": "user" | "assistant",
      "content": "string",
      "timestamp": "ISO8601 datetime"
    }
  ]
}
```

**Response**:
```json
{
  "diaryId": "string",
  "summary": "string",
  "emotion": "string",
  "createdAt": "ISO8601 datetime"
}
```

**Example Usage**:
```javascript
import { chatApi } from '@/utils/api';
import { useMutation } from '@tanstack/react-query';

const useEndConversation = () => {
  return useMutation({
    mutationFn: (messages) => chatApi.endConversation(messages),
    onSuccess: (data) => {
      // Navigate to diary entry
      console.log('Diary created:', data.diaryId);
    },
  });
};
```

---

## Diary API

### Get Diary List

**Endpoint**: `GET /diaries?year={year}&month={month}`

**Description**: Get list of diary entries for a specific month

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Query Parameters**:
- `year` (number, required): Year (e.g., 2025)
- `month` (number, required): Month (1-12)

**Response**:
```json
{
  "diaries": [
    {
      "id": "string",
      "date": "YYYY-MM-DD",
      "emotion": "string",
      "summary": "string",
      "createdAt": "ISO8601 datetime"
    }
  ]
}
```

**Example Usage**:
```javascript
import { diaryApi } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';

const useDiaryList = (year, month) => {
  return useQuery({
    queryKey: ['diaries', year, month],
    queryFn: () => diaryApi.getList(year, month),
  });
};
```

---

### Get Diary by Date

**Endpoint**: `GET /diaries/:date`

**Description**: Get diary entry for a specific date

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Path Parameters**:
- `date` (string, required): Date in YYYY-MM-DD format

**Response**:
```json
{
  "id": "string",
  "date": "YYYY-MM-DD",
  "emotion": "string",
  "content": "string",
  "summary": "string",
  "chatHistory": [
    {
      "role": "user" | "assistant",
      "content": "string",
      "timestamp": "ISO8601 datetime"
    }
  ],
  "createdAt": "ISO8601 datetime",
  "updatedAt": "ISO8601 datetime"
}
```

**Example Usage**:
```javascript
import { diaryApi } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';

const useDiary = (date) => {
  return useQuery({
    queryKey: ['diaries', date],
    queryFn: () => diaryApi.getByDate(date),
    enabled: !!date,
  });
};
```

---

### Create Diary

**Endpoint**: `POST /diaries`

**Description**: Create a new diary entry

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "date": "YYYY-MM-DD",
  "emotion": "string",
  "content": "string",
  "summary": "string"
}
```

**Response**:
```json
{
  "id": "string",
  "date": "YYYY-MM-DD",
  "emotion": "string",
  "content": "string",
  "summary": "string",
  "createdAt": "ISO8601 datetime"
}
```

**Example Usage**:
```javascript
import { diaryApi } from '@/utils/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useCreateDiary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => diaryApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['diaries'] });
    },
  });
};
```

---

### Update Diary

**Endpoint**: `PUT /diaries/:date`

**Description**: Update existing diary entry

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Path Parameters**:
- `date` (string, required): Date in YYYY-MM-DD format

**Request Body**:
```json
{
  "emotion": "string",
  "content": "string",
  "summary": "string"
}
```

**Response**:
```json
{
  "id": "string",
  "date": "YYYY-MM-DD",
  "emotion": "string",
  "content": "string",
  "summary": "string",
  "updatedAt": "ISO8601 datetime"
}
```

**Example Usage**:
```javascript
import { diaryApi } from '@/utils/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useUpdateDiary = (date) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => diaryApi.update(date, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaries', date] });
    },
  });
};
```

---

### Delete Diary

**Endpoint**: `DELETE /diaries/:date`

**Description**: Delete diary entry for a specific date

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Path Parameters**:
- `date` (string, required): Date in YYYY-MM-DD format

**Response**:
```json
{
  "success": true,
  "message": "Diary deleted successfully"
}
```

**Example Usage**:
```javascript
import { diaryApi } from '@/utils/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useDeleteDiary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date) => diaryApi.delete(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaries'] });
    },
  });
};
```

---

## Support API

### Get Received Support Messages

**Endpoint**: `GET /support/received`

**Description**: Get list of received support messages

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response**:
```json
{
  "messages": [
    {
      "id": "string",
      "senderId": "string",
      "senderNickname": "string",
      "content": "string",
      "isRead": boolean,
      "createdAt": "ISO8601 datetime"
    }
  ]
}
```

**Example Usage**:
```javascript
import { supportApi } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';

const useReceivedMessages = () => {
  return useQuery({
    queryKey: ['support', 'received'],
    queryFn: supportApi.getReceived,
  });
};
```

---

### Get Sent Support Messages

**Endpoint**: `GET /support/sent`

**Description**: Get list of sent support messages

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response**:
```json
{
  "messages": [
    {
      "id": "string",
      "recipientId": "string",
      "recipientNickname": "string",
      "content": "string",
      "createdAt": "ISO8601 datetime"
    }
  ]
}
```

**Example Usage**:
```javascript
import { supportApi } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';

const useSentMessages = () => {
  return useQuery({
    queryKey: ['support', 'sent'],
    queryFn: supportApi.getSent,
  });
};
```

---

### Send Support Message

**Endpoint**: `POST /support/send`

**Description**: Send support message to another user

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "recipientId": "string",
  "content": "string"
}
```

**Response**:
```json
{
  "id": "string",
  "recipientId": "string",
  "content": "string",
  "createdAt": "ISO8601 datetime"
}
```

**Example Usage**:
```javascript
import { supportApi } from '@/utils/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useSendSupport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => supportApi.send(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'sent'] });
    },
  });
};
```

---

### Mark Message as Read

**Endpoint**: `PUT /support/:messageId/read`

**Description**: Mark support message as read

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Path Parameters**:
- `messageId` (string, required): Message ID

**Response**:
```json
{
  "success": true,
  "message": "Message marked as read"
}
```

**Example Usage**:
```javascript
import { supportApi } from '@/utils/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId) => supportApi.markAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'received'] });
    },
  });
};
```

---

## Statistics API

### Get Emotion Statistics

**Endpoint**: `GET /stats/emotions?year={year}&month={month}`

**Description**: Get emotion statistics for a specific month

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Query Parameters**:
- `year` (number, required): Year (e.g., 2025)
- `month` (number, required): Month (1-12)

**Response**:
```json
{
  "emotions": [
    {
      "emotion": "string",
      "count": number,
      "percentage": number
    }
  ],
  "totalEntries": number
}
```

**Example Usage**:
```javascript
import { statsApi } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';

const useEmotionStats = (year, month) => {
  return useQuery({
    queryKey: ['stats', 'emotions', year, month],
    queryFn: () => statsApi.getEmotions(year, month),
  });
};
```

---

### Get Monthly Statistics

**Endpoint**: `GET /stats/monthly?year={year}&month={month}`

**Description**: Get overall monthly statistics

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Query Parameters**:
- `year` (number, required): Year (e.g., 2025)
- `month` (number, required): Month (1-12)

**Response**:
```json
{
  "totalDiaries": number,
  "totalConversations": number,
  "averageConversationLength": number,
  "mostFrequentEmotion": "string",
  "diaryStreak": number
}
```

**Example Usage**:
```javascript
import { statsApi } from '@/utils/api';
import { useQuery } from '@tanstack/react-query';

const useMonthlyStats = (year, month) => {
  return useQuery({
    queryKey: ['stats', 'monthly', year, month],
    queryFn: () => statsApi.getMonthly(year, month),
  });
};
```

---

## Error Handling

### ApiError Class

The API utility provides a custom `ApiError` class for structured error handling:

```javascript
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}
```

### Error Properties

- `message` (string): Error message
- `status` (number): HTTP status code
- `data` (any): Additional error data from server

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid request parameters",
  "details": {}
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Access denied"
}
```

#### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

### Error Handling Example

```javascript
import { authApi, ApiError } from '@/utils/api';

const handleLogin = async (code) => {
  try {
    const response = await authApi.kakaoLogin(code);
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      switch (error.status) {
        case 400:
          console.error('Invalid login code');
          break;
        case 401:
          console.error('Authentication failed');
          break;
        case 500:
          console.error('Server error, please try again later');
          break;
        default:
          console.error('Unexpected error:', error.message);
      }
    } else {
      console.error('Network error:', error);
    }
  }
};
```

### TanStack Query Error Handling

```javascript
import { useQuery } from '@tanstack/react-query';
import { userApi, ApiError } from '@/utils/api';

const useUserProfile = (userId) => {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => userApi.getProfile(userId),
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        // Handle specific error cases
        console.error(`API Error ${error.status}:`, error.message);
      }
    },
  });
};
```

---

## Best Practices

### 1. Token Management

Store tokens securely and refresh them automatically:

```javascript
// Token refresh interceptor
const getAccessToken = async () => {
  const token = localStorage.getItem('accessToken');
  const expiresAt = localStorage.getItem('tokenExpiresAt');

  if (Date.now() > expiresAt) {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await authApi.refreshToken(refreshToken);
    localStorage.setItem('accessToken', response.accessToken);
    return response.accessToken;
  }

  return token;
};
```

### 2. Query Key Management

Use consistent query key patterns:

```javascript
// Good: Structured query keys
const queryKeys = {
  auth: {
    me: () => ['auth', 'me'],
  },
  users: {
    all: () => ['users'],
    detail: (id) => ['users', id],
  },
  diaries: {
    all: () => ['diaries'],
    list: (year, month) => ['diaries', year, month],
    detail: (date) => ['diaries', date],
  },
};
```

### 3. Optimistic Updates

Implement optimistic updates for better UX:

```javascript
const useUpdateProfile = (userId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => userApi.updateProfile(userId, data),
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users', userId] });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData(['users', userId]);

      // Optimistically update
      queryClient.setQueryData(['users', userId], (old) => ({
        ...old,
        ...newData,
      }));

      return { previousUser };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      queryClient.setQueryData(['users', userId], context.previousUser);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['users', userId] });
    },
  });
};
```

### 4. Request Cancellation

Cancel unnecessary requests:

```javascript
import { useQuery } from '@tanstack/react-query';

const useSearch = (query) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: ({ signal }) => {
      // Pass AbortSignal to fetch
      return fetch(`/api/search?q=${query}`, { signal }).then(res => res.json());
    },
    enabled: query.length > 0,
  });
};
```

---

## Version History

- **v1.0.0** (2025-01-21): Initial API specification document
  - Complete endpoint documentation for all 6 API modules
  - Error handling guidelines
  - TanStack Query integration examples
  - Best practices and usage patterns

---

**Document Author**: Documentation Agent v2.0.0
**Last Updated**: 2025-01-21
**Project**: Catus (React 19.1.1 + Vite)
