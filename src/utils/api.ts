/**
 * API 호출 유틸리티
 * axios 기반 HTTP 클라이언트
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { getToken, removeToken } from './storage';
import type {
  LoginResponse,
  SignupData,
  SignupResponse,
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

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
 * 요청 인터셉터 - 토큰 자동 추가
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터 - 에러 핸들링
 */
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // 401 Unauthorized - 토큰 만료
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/';
      return Promise.reject(new ApiError('인증이 만료되었습니다.', 401));
    }

    // 기타 에러
    const message = (error.response?.data as any)?.message || error.message || '요청 처리 중 오류가 발생했습니다.';
    const status = error.response?.status || 0;
    const data = error.response?.data;

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
  refreshToken: (refreshToken: string): Promise<LoginResponse> =>
    post<LoginResponse>('/auth/refresh', { refreshToken }),

  // 로그아웃
  logout: (): Promise<{ message: string }> =>
    post('/auth/logout'),

  // 회원 탈퇴
  withdraw: (password?: string): Promise<{ message: string }> =>
    del('/auth/withdraw', password ? { data: { password } } : undefined),
};

/**
 * 💬 채팅 API
 */
export const chatApi = {
  // 메시지 전송 (AI 응답)
  sendMessage: (content: string): Promise<{ role: string; content: string; timestamp: string }> =>
    post('/chat/send', { content }),

  // 대화 기록 조회 (특정 일기)
  getHistory: (diaryId: string): Promise<ChatHistory> =>
    get<ChatHistory>(`/chat/history/${diaryId}`),

  // 대화 종료 및 분석 (일기 생성)
  endConversation: (date: string, messages: ChatMessage[]): Promise<ChatAnalysisResponse> =>
    post<ChatAnalysisResponse>('/chat/end', { date, messages }),
};

/**
 * 📔 일기 API
 */
export const diaryApi = {
  // 일기 목록 조회 (월별)
  getList: (year: number, month: number): Promise<DiaryListResponse> =>
    get<DiaryListResponse>(`/diaries?year=${year}&month=${month}`),

  // 특정 날짜 일기 조회
  getByDate: (date: string): Promise<DiaryDetailResponse> =>
    get<DiaryDetailResponse>(`/diaries/${date}`),

  // 일기 생성 (수동 작성)
  create: (data: { date: string; emotion: string; summary: string; pictureUrl?: string }): Promise<Diary> =>
    post<Diary>('/diaries', data),

  // 일기 수정
  update: (date: string, data: DiaryUpdateData): Promise<Diary> =>
    put<Diary>(`/diaries/${date}`, data),

  // 일기 삭제
  delete: (date: string): Promise<{ message: string; deletedDate: string }> =>
    del(`/diaries/${date}`),

  // 랜덤 일기 조회 (익명 응원용)
  getRandom: (): Promise<Diary> =>
    get<Diary>('/diaries/random'),
};

/**
 * 💌 익명 응원 메시지 API
 */
export const supportApi = {
  // 받은 응원 메시지 조회
  getReceived: (): Promise<MessageResponse> =>
    get<MessageResponse>('/support/received'),

  // 보낸 응원 메시지 조회
  getSent: (): Promise<MessageResponse> =>
    get<MessageResponse>('/support/sent'),

  // 익명 응원 메시지 전송 (랜덤 사용자에게)
  send: (content: string, emotion: string): Promise<{ id: string; message: string; sentAt: string }> =>
    post('/support/send', { content, emotion }),

  // 응원 메시지 읽음 처리
  markAsRead: (messageId: string): Promise<{ id: string; isRead: boolean; readAt: string }> =>
    put(`/support/${messageId}/read`),
};

/**
 * 🧠 Big5 성격 분석 API
 */
export const big5Api = {
  // 초기 성격 테스트
  submitInitial: (answers: number[]): Promise<Big5TestResponse> =>
    post<Big5TestResponse>('/big5/initial', { answers }),

  // 현재 성격 점수 조회
  getCurrent: (): Promise<Big5CurrentResponse> =>
    get<Big5CurrentResponse>('/big5/current'),

  // 성격 변화 이력
  getHistory: (period?: string): Promise<Big5HistoryResponse> =>
    get<Big5HistoryResponse>(`/big5/history${period ? `?period=${period}` : ''}`),
};

/**
 * ⚙️ 설정 API
 */
export const settingsApi = {
  // 설정 조회
  getSettings: (): Promise<SettingsResponse> =>
    get<SettingsResponse>('/settings'),

  // 일기 생성 시간 변경
  updateDiaryTime: (time: string): Promise<SettingsResponse> =>
    put<SettingsResponse>('/settings/diary-time', { time }),

  // 알림 설정 변경
  updateNotifications: (anonymous: boolean): Promise<SettingsResponse> =>
    put<SettingsResponse>('/settings/notifications', { anonymous }),

  // 테마 설정 변경
  updateTheme: (darkMode: boolean): Promise<SettingsResponse> =>
    put<SettingsResponse>('/settings/theme', { darkMode }),

  // 프로필 수정
  updateProfile: (nickname: string, password?: string): Promise<{ profile: User }> =>
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
  support: supportApi,
  big5: big5Api,
  settings: settingsApi,
  stats: statsApi,
};

export default api;

// User 타입 임포트를 위한 인터페이스
interface User {
  id: string;
  nickname: string;
  profileImage?: string;
  createdAt: string;
}
