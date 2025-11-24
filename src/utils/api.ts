/**
 * API 호출 유틸리티
 * axios 기반 HTTP 클라이언트
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { getToken, removeToken, isTokenExpiringSoon, getRefreshToken } from './storage';
import type {
  LoginResponse,
  SignupData,
  SignupResponse,
  RefreshTokenResponse,
  ChatMessage,
  ChatHistory,
  ChatAnalysisResponse,
  Diary,
  DiaryListResponse,
  DiaryDetailResponse,
  DiaryCreateData,
  DiaryUpdateData,
  AnonymousMessage,
  MessageResponse,
  NotificationsResponse,
  Big5Scores,
  Big5TestResponse,
  Big5CurrentResponse,
  Big5HistoryResponse,
  Settings,
  SettingsResponse,
  EmotionsResponse,
  MonthlyStats,
  OnboardingData,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/proxy';

/**
 * API 에러 클래스
 */
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Axios 인스턴스 생성
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Token refresh callback (AuthContext에서 설정)
 */
let tokenRefreshCallback: (() => Promise<string | null>) | null = null;

export const setTokenRefreshCallback = (callback: (() => Promise<string | null>) | null): void => {
  tokenRefreshCallback = callback;
};

/**
 * Network retry configuration
 */
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1초

/**
 * Exponential backoff delay 계산
 */
const getRetryDelay = (retryCount: number): number => {
  return RETRY_DELAY_BASE * Math.pow(2, retryCount); // 1s, 2s, 4s
};

/**
 * Retry 가능한 에러인지 확인
 */
const isRetryableError = (error: AxiosError): boolean => {
  // 네트워크 에러 (서버 응답 없음) - 재시도 가능
  if (!error.response) {
    return true;
  }

  // 5xx 서버 에러 - 재시도 가능
  if (error.response.status >= 500 && error.response.status < 600) {
    return true;
  }

  // 408 Request Timeout, 429 Too Many Requests - 재시도 가능
  if (error.response.status === 408 || error.response.status === 429) {
    return true;
  }

  // 4xx 클라이언트 에러 - 재시도 불가능 (잘못된 요청)
  return false;
};

/**
 * 요청 인터셉터 - 토큰 자동 추가 + 프로액티브 갱신
 */
axiosInstance.interceptors.request.use(
  async (config) => {
    let token = getToken();

    // 토큰이 곧 만료될 예정이면 프로액티브하게 갱신 (5분 전)
    if (token && isTokenExpiringSoon(token, 5) && tokenRefreshCallback) {
      console.log('🔄 Token expiring soon, refreshing proactively...');
      try {
        const newToken = await tokenRefreshCallback();
        if (newToken) {
          token = newToken;
          console.log('✅ Token refreshed successfully');
        }
      } catch (error) {
        console.error('❌ Proactive token refresh failed:', error);
        // 갱신 실패 시 기존 토큰으로 계속 진행 (만료되면 401로 처리됨)
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Retry 카운트 초기화 (첫 요청)
    if (!config.headers['X-Retry-Count']) {
      config.headers['X-Retry-Count'] = '0';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터 - 에러 핸들링 + Retry 로직
 */
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config;

    // 네트워크 에러 (서버 응답 없음) - 로그아웃하지 않음
    if (!error.response) {
      const message = error.message || '네트워크 연결을 확인해주세요.';
      return Promise.reject(new ApiError(message, 0));
    }

    // 401 Unauthorized - 토큰 갱신 시도 (리액티브 갱신)
    if (error.response.status === 401 && config) {
      // 무한 루프 방지: 이미 재시도한 요청인지 확인
      if (config.headers?.['X-Token-Refreshed']) {
        console.error('❌ Token refresh failed, logging out...');
        removeToken();
        localStorage.removeItem('catus_refresh_token');
        localStorage.removeItem('catus_user');

        // 공개 페이지가 아니면 로그인 페이지로 리다이렉트
        const publicPaths = ['/', '/auth/kakao/callback', '/privacy-policy'];
        const currentPath = window.location.pathname;
        if (!publicPaths.includes(currentPath)) {
          window.location.href = '/';
        }

        return Promise.reject(new ApiError('인증이 만료되었습니다. 다시 로그인해주세요.', 401));
      }

      // 리프레시 토큰으로 액세스 토큰 갱신 시도
      console.log('🔄 401 error detected, attempting token refresh...');

      if (tokenRefreshCallback) {
        try {
          const newToken = await tokenRefreshCallback();

          if (newToken) {
            console.log('✅ Token refreshed, retrying original request...');

            // 새 토큰으로 헤더 업데이트
            config.headers.Authorization = `Bearer ${newToken}`;

            // 재시도 플래그 설정 (무한 루프 방지)
            config.headers['X-Token-Refreshed'] = 'true';

            // 원래 요청 재시도
            return axiosInstance(config);
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
        }
      }

      // 토큰 갱신 실패 시 로그아웃
      console.error('❌ No token refresh callback or refresh failed, logging out...');
      removeToken();
      localStorage.removeItem('catus_refresh_token');
      localStorage.removeItem('catus_user');

      const publicPaths = ['/', '/auth/kakao/callback', '/privacy-policy'];
      const currentPath = window.location.pathname;
      if (!publicPaths.includes(currentPath)) {
        window.location.href = '/';
      }

      return Promise.reject(new ApiError('인증이 만료되었습니다. 다시 로그인해주세요.', 401));
    }

    // Retry 로직 실행 (5xx 에러, 타임아웃 등)
    if (config && isRetryableError(error)) {
      const retryCount = parseInt(config.headers?.['X-Retry-Count'] as string || '0', 10);

      if (retryCount < MAX_RETRIES) {
        const delay = getRetryDelay(retryCount);
        console.log(`🔄 Retry attempt ${retryCount + 1}/${MAX_RETRIES} after ${delay}ms...`);

        // 다음 재시도 카운트 설정
        config.headers['X-Retry-Count'] = String(retryCount + 1);

        // Exponential backoff delay
        await new Promise((resolve) => setTimeout(resolve, delay));

        // 요청 재시도
        return axiosInstance(config);
      } else {
        console.error(`❌ Max retries (${MAX_RETRIES}) reached. Giving up.`);
      }
    }

    // 기타 에러
    const message = (error.response.data as any)?.message || error.message || '요청 처리 중 오류가 발생했습니다.';
    const status = error.response.status || 0;
    const data = error.response.data;

    return Promise.reject(new ApiError(message, status, data));
  }
);

/**
 * GET 요청
 */
export const get = async <T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosInstance.get<T>(endpoint, config);
  return response.data;
};

/**
 * POST 요청
 */
export const post = async <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosInstance.post<T>(endpoint, data, config);
  return response.data;
};

/**
 * PUT 요청
 */
export const put = async <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosInstance.put<T>(endpoint, data, config);
  return response.data;
};

/**
 * PATCH 요청
 */
export const patch = async <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosInstance.patch<T>(endpoint, data, config);
  return response.data;
};

/**
 * DELETE 요청
 */
export const del = async <T = any>(endpoint: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosInstance.delete<T>(endpoint, config);
  return response.data;
};

/**
 * 🔐 인증 API
 */
export const authApi = {
  // 카카오 로그인
  kakaoLogin: (code: string): Promise<LoginResponse> =>
    post<LoginResponse>('/auth/kakao', { code }),

  // 추가 정보 입력 (회원가입)
  signup: (data: SignupData): Promise<SignupResponse> =>
    post<SignupResponse>('/auth/signup', data),

  // 토큰 갱신
  refreshToken: (refreshToken: string): Promise<RefreshTokenResponse> =>
    post<RefreshTokenResponse>('/auth/refresh', { refreshToken }),

  // 로그아웃
  logout: (): Promise<{ message: string }> =>
    post('/auth/logout'),

  // 인증 코드 생성 (회원 탈퇴용)
  generateVerificationCode: (): Promise<{ code: string; expiresInMinutes: number }> =>
    post('/auth/verification-code'),

  // 회원 탈퇴
  withdraw: (password: string, verificationCode: string): Promise<{ message: string }> =>
    del('/auth/withdraw', { data: { password, verificationCode } }),
};

/**
 * 💬 채팅 API
 */
export const chatApi = {
  // 메시지 전송 (백엔드: POST /api/chat/message)
  sendMessage: (content: string): Promise<{ messageId: number; userMessage: string; aiResponse: string; timestamp: string }> =>
    post('/chat/message', { message: content }),

  // 대화 기록 조회 (백엔드: GET /api/chat/history)
  getHistory: (page: number = 0, size: number = 20): Promise<ChatHistory> =>
    get<ChatHistory>(`/chat/history?page=${page}&size=${size}`),

  // 특정 날짜 채팅 조회 (백엔드: GET /api/chat/context/{date})
  getContextByDate: (date: string): Promise<{ date: string; messages: Array<{ id: number; userMessage: string; aiResponse: string; timestamp: string }> }> =>
    get(`/chat/context/${date}`),

  // 채팅 분석 (백엔드: POST /api/chat/analyze)
  analyzeChat: (startDate: string, endDate: string): Promise<ChatAnalysisResponse> =>
    post<ChatAnalysisResponse>('/chat/analyze', { startDate, endDate }),
};

/**
 * 📔 일기 API
 */
export const diaryApi = {
  // 일기 목록 조회 (백엔드: GET /api/diary/list)
  getList: (year: number, month: number): Promise<DiaryListResponse> =>
    get<DiaryListResponse>(`/diary/list?year=${year}&month=${month}`),

  // 일기 상세 조회 (백엔드: GET /api/diary/{id})
  getById: (id: number): Promise<DiaryDetailResponse> =>
    get<DiaryDetailResponse>(`/diary/${id}`),

  // 일기 수정 (백엔드: PUT /api/diary/{id})
  update: (id: number, data: DiaryUpdateData): Promise<{ id: number; updatedAt: string; message: string }> =>
    put(`/diary/${id}`, data),

  // 일기 삭제 (백엔드: DELETE /api/diary/{id})
  delete: (id: number): Promise<{ message: string }> =>
    del(`/diary/${id}`),

  // 랜덤 일기 조회 (백엔드: GET /api/diary/random)
  getRandom: (): Promise<{ diaryId: number; title: string; date: string; previewText: string; thumbnailUrl: string }> =>
    get('/diary/random'),
};

/**
 * 💌 익명 메시지 API
 */
export const messageApi = {
  // 받은 메시지 조회 (백엔드: GET /api/message/received)
  getReceived: (page: number = 0, size: number = 20): Promise<{ messages: Array<{ id: number; content: string; diaryId: number; receivedAt: string; isRead: boolean }>; totalPages: number; unreadCount: number }> =>
    get(`/message/received?page=${page}&size=${size}`),

  // 알림 조회 (백엔드: GET /api/message/notifications)
  getNotifications: (): Promise<{ unreadCount: number; notifications: Array<{ id: number; content: string; receivedAt: string }> }> =>
    get('/message/notifications'),

  // 메시지 전송 (백엔드: POST /api/message/send)
  send: (diaryId: number, content: string): Promise<{ messageId: number; sentAt: string }> =>
    post('/message/send', { diaryId, content }),

  // 메시지 읽음 처리 (백엔드: PUT /api/message/read/{id})
  markAsRead: (messageId: number): Promise<{ message: string }> =>
    put(`/message/read/${messageId}`),
};

// 하위 호환성을 위한 별칭
export const supportApi = messageApi;

/**
 * 🧠 Big5 성격 분석 API
 */
export const big5Api = {
  // 초기 성격 테스트 (백엔드: POST /api/big5/initial)
  submitInitial: (answers: Array<{ questionId: number; score: number }>): Promise<Big5TestResponse> =>
    post<Big5TestResponse>('/big5/initial', { answers }),

  // 현재 성격 점수 조회 (백엔드: GET /api/big5/current)
  getCurrent: (): Promise<Big5CurrentResponse> =>
    get<Big5CurrentResponse>('/big5/current'),

  // 성격 변화 이력 (백엔드: GET /api/big5/history)
  getHistory: (period?: 'weekly' | 'monthly' | 'yearly'): Promise<Big5HistoryResponse> =>
    get<Big5HistoryResponse>(`/big5/history${period ? `?period=${period}` : ''}`),
};

/**
 * ⚙️ 설정 API
 */
export const settingsApi = {
  // 설정 조회 (백엔드: GET /api/settings)
  getSettings: (): Promise<SettingsResponse> =>
    get<SettingsResponse>('/settings'),

  // 일기 생성 시간 변경 (백엔드: PUT /api/settings/diary-time)
  updateDiaryTime: (time: string): Promise<{ diaryGenerationTime: string; message: string }> =>
    put('/settings/diary-time', { time }),

  // 알림 설정 변경 (백엔드: PUT /api/settings/notifications)
  updateNotifications: (diaryCreated: boolean, messageReceived: boolean): Promise<{ notifications: { diaryCreated: boolean; messageReceived: boolean } }> =>
    put('/settings/notifications', { diaryCreated, messageReceived }),

  // 테마 설정 변경 (백엔드: PUT /api/settings/theme)
  updateTheme: (darkMode: boolean): Promise<{ theme: { darkMode: boolean } }> =>
    put('/settings/theme', { darkMode }),

  // 프로필 수정 (백엔드: PUT /api/settings/profile)
  updateProfile: (nickname: string, password?: string): Promise<{ nickname: string; updatedAt: string }> =>
    put('/settings/profile', { nickname, password }),
};

/**
 * 🔧 사용자 API (온보딩)
 */
export const userApi = {
  // 온보딩 정보 저장
  saveOnboarding: (data: OnboardingData): Promise<{ message: string; user: { id: string; onboardingCompleted: boolean } }> =>
    post('/users/onboarding', data),
};

/**
 * 📊 통계 API (프론트엔드 전용 - 백엔드 미구현)
 */
export const statsApi = {
  // 감정 통계
  getEmotions: (year: number, month: number): Promise<EmotionsResponse> =>
    get<EmotionsResponse>(`/stats/emotions?year=${year}&month=${month}`),

  // 월별 통계
  getMonthly: (year: number, month: number): Promise<MonthlyStats> =>
    get<MonthlyStats>(`/stats/monthly?year=${year}&month=${month}`),
};

/**
 * API 클라이언트 객체
 */
const api = {
  auth: authApi,
  user: userApi,
  chat: chatApi,
  diary: diaryApi,
  message: messageApi,
  support: supportApi, // 하위 호환성
  big5: big5Api,
  settings: settingsApi,
  stats: statsApi,
};

export default api;

// User 타입 임포트를 위한 인터페이스
interface User {
  id: number;
  nickname: string;
  profileImage?: string;
  createdAt: string;
}
