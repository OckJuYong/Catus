/**
 * API 호출 유틸리티
 * axios 대신 fetch를 사용하여 의존성 최소화
 */

import { getToken, setToken, removeToken } from './storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

/**
 * API 에러 클래스
 */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * API 요청 헬퍼
 */
const request = async (endpoint, options = {}) => {
  const token = getToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // 토큰 갱신이 필요한 경우 (401 Unauthorized)
    if (response.status === 401) {
      // TODO: Refresh token 로직 구현
      removeToken();
      window.location.href = '/';
      throw new ApiError('인증이 만료되었습니다.', 401);
    }

    // 응답이 성공적이지 않은 경우
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || '요청 처리 중 오류가 발생했습니다.',
        response.status,
        errorData
      );
    }

    // 204 No Content의 경우
    if (response.status === 204) {
      return null;
    }

    // JSON 응답 파싱
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // 네트워크 에러 등
    throw new ApiError(
      error.message || '네트워크 오류가 발생했습니다.',
      0,
      error
    );
  }
};

/**
 * GET 요청
 */
export const get = (endpoint, options = {}) => {
  return request(endpoint, {
    ...options,
    method: 'GET',
  });
};

/**
 * POST 요청
 */
export const post = (endpoint, data, options = {}) => {
  return request(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * PUT 요청
 */
export const put = (endpoint, data, options = {}) => {
  return request(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * PATCH 요청
 */
export const patch = (endpoint, data, options = {}) => {
  return request(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * DELETE 요청
 */
export const del = (endpoint, options = {}) => {
  return request(endpoint, {
    ...options,
    method: 'DELETE',
  });
};

/**
 * 인증 API
 */
export const authApi = {
  // 카카오 로그인
  kakaoLogin: (code) => post('/auth/kakao', { code }),

  // 토큰 갱신
  refreshToken: (refreshToken) => post('/auth/refresh', { refreshToken }),

  // 로그아웃
  logout: () => post('/auth/logout'),

  // 현재 사용자 정보
  me: () => get('/auth/me'),
};

/**
 * 사용자 API
 */
export const userApi = {
  // 프로필 조회
  getProfile: (userId) => get(`/users/${userId}`),

  // 프로필 수정
  updateProfile: (userId, data) => put(`/users/${userId}`, data),

  // 온보딩 정보 저장
  saveOnboarding: (data) => post('/users/onboarding', data),
};

/**
 * 채팅 API
 */
export const chatApi = {
  // 메시지 전송
  sendMessage: (content) => post('/chat/send', { content }),

  // 채팅 기록 조회
  getHistory: (diaryId) => get(`/chat/history/${diaryId}`),

  // 대화 종료 (감정 분석)
  endConversation: (messages) => post('/chat/end', { messages }),
};

/**
 * 일기 API
 */
export const diaryApi = {
  // 일기 목록 조회 (월별)
  getList: (year, month) => get(`/diaries?year=${year}&month=${month}`),

  // 특정 날짜 일기 조회
  getByDate: (date) => get(`/diaries/${date}`),

  // 일기 생성
  create: (data) => post('/diaries', data),

  // 일기 수정
  update: (date, data) => put(`/diaries/${date}`, data),

  // 일기 삭제
  delete: (date) => del(`/diaries/${date}`),
};

/**
 * 익명 응원 API
 */
export const supportApi = {
  // 받은 메시지 조회
  getReceived: () => get('/support/received'),

  // 보낸 메시지 조회
  getSent: () => get('/support/sent'),

  // 메시지 전송
  send: (data) => post('/support/send', data),

  // 메시지 읽음 처리
  markAsRead: (messageId) => put(`/support/${messageId}/read`),
};

/**
 * 통계 API
 */
export const statsApi = {
  // 감정 통계
  getEmotions: (year, month) => get(`/stats/emotions?year=${year}&month=${month}`),

  // 월별 통계
  getMonthly: (year, month) => get(`/stats/monthly?year=${year}&month=${month}`),
};

/**
 * API 클라이언트 객체
 */
const api = {
  auth: authApi,
  user: userApi,
  chat: chatApi,
  diary: diaryApi,
  support: supportApi,
  stats: statsApi,
};

export default api;
