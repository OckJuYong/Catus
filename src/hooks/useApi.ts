/**
 * React Query Hooks for API Operations
 * TanStack Query v5 기반 훅
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import {
  authApi,
  chatApi,
  diaryApi,
  supportApi,
  big5Api,
  settingsApi,
  userApi,
  statsApi,
  ApiError,
} from '../utils/api';
import type {
  LoginResponse,
  ChatMessage,
  ChatHistory,
  Diary,
  DiaryListResponse,
  DiaryDetailResponse,
  DiaryUpdateData,
  AnonymousMessage,
  MessageResponse,
  Big5CurrentResponse,
  Big5HistoryResponse,
  SettingsResponse,
  EmotionsResponse,
  MonthlyStats,
  OnboardingData,
} from '../types';

// ============================================================================
// Query Keys (캐시 키 관리)
// ============================================================================

export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  chat: {
    history: () => ['chat', 'history'] as const,
    contextByDate: (date: string) => ['chat', 'context', date] as const,
  },
  diary: {
    all: () => ['diary'] as const,
    list: (year: number, month: number) => ['diary', 'list', year, month] as const,
    detail: (id: string) => ['diary', 'detail', id] as const,
    byDate: (date: string) => ['diary', 'byDate', date] as const,
    random: () => ['diary', 'random'] as const,
  },
  message: {
    received: (page?: number) => ['message', 'received', page] as const,
    notifications: () => ['message', 'notifications'] as const,
  },
  big5: {
    current: () => ['big5', 'current'] as const,
    history: (period?: string) => ['big5', 'history', period] as const,
  },
  settings: {
    all: () => ['settings'] as const,
  },
  stats: {
    emotions: (year: number, month: number) => ['stats', 'emotions', year, month] as const,
    monthly: (year: number, month: number) => ['stats', 'monthly', year, month] as const,
  },
};

// ============================================================================
// Authentication Hooks
// ============================================================================

export const useKakaoLogin = (options?: UseMutationOptions<LoginResponse, ApiError, string>) => {
  return useMutation({
    mutationFn: (code: string) => authApi.kakaoLogin(code),
    ...options,
  });
};

export const useLogout = (options?: UseMutationOptions<{ message: string }, ApiError>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
    ...options,
  });
};

// ============================================================================
// Chat Hooks
// ============================================================================

export const useSendChatMessage = (
  options?: UseMutationOptions<{ role: string; content: string; timestamp: string }, ApiError, string>
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => chatApi.sendMessage(content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.history() });
    },
    ...options,
  });
};

export const useChatHistory = (diaryId: string, options?: UseQueryOptions<ChatHistory, ApiError>) => {
  return useQuery({
    queryKey: queryKeys.chat.history(),
    queryFn: () => chatApi.getHistory(diaryId),
    ...options,
  });
};

// ============================================================================
// Diary Hooks
// ============================================================================

export const useDiaryList = (year: number, month: number, options?: UseQueryOptions<DiaryListResponse, ApiError>) => {
  return useQuery({
    queryKey: queryKeys.diary.list(year, month),
    queryFn: () => diaryApi.getList(year, month),
    ...options,
  });
};

export const useDiaryByDate = (date: string, options?: UseQueryOptions<DiaryDetailResponse, ApiError>) => {
  return useQuery({
    queryKey: queryKeys.diary.byDate(date),
    queryFn: () => diaryApi.getByDate(date),
    enabled: !!date,
    ...options,
  });
};

export const useCreateDiary = (
  options?: UseMutationOptions<Diary, ApiError, { date: string; emotion: string; summary: string; pictureUrl?: string }>
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; emotion: string; summary: string; pictureUrl?: string }) =>
      diaryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.diary.all() });
    },
    ...options,
  });
};

// ============================================================================
// Support (익명 응원) Hooks
// ============================================================================

export const useReceivedMessages = (options?: UseQueryOptions<MessageResponse, ApiError>) => {
  return useQuery({
    queryKey: ['support', 'received'],
    queryFn: () => supportApi.getReceived(),
    ...options,
  });
};

// ============================================================================
// Settings Hooks
// ============================================================================

export const useSettings = (options?: UseQueryOptions<SettingsResponse, ApiError>) => {
  return useQuery({
    queryKey: queryKeys.settings.all(),
    queryFn: () => settingsApi.getSettings(),
    ...options,
  });
};

export const useUpdateProfile = (
  options?: UseMutationOptions<{ profile: any }, ApiError, { nickname: string; password?: string }>
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nickname, password }: { nickname: string; password?: string }) =>
      settingsApi.updateProfile(nickname, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all() });
    },
    ...options,
  });
};

// ============================================================================
// User Hooks
// ============================================================================

export const useSaveOnboarding = (
  options?: UseMutationOptions<
    { message: string; user: { id: string; onboardingCompleted: boolean } },
    ApiError,
    OnboardingData
  >
) => {
  return useMutation({
    mutationFn: (data: OnboardingData) => userApi.saveOnboarding(data),
    ...options,
  });
};

// ============================================================================
// Statistics Hooks
// ============================================================================

export const useEmotionStats = (year: number, month: number, options?: UseQueryOptions<EmotionsResponse, ApiError>) => {
  return useQuery({
    queryKey: queryKeys.stats.emotions(year, month),
    queryFn: () => statsApi.getEmotions(year, month),
    ...options,
  });
};

export const useMonthlyStats = (year: number, month: number, options?: UseQueryOptions<MonthlyStats, ApiError>) => {
  return useQuery({
    queryKey: queryKeys.stats.monthly(year, month),
    queryFn: () => statsApi.getMonthly(year, month),
    ...options,
  });
};

// ============================================================================
// Additional Settings Hooks
// ============================================================================

export const useUpdateNotifications = (options?: UseMutationOptions<SettingsResponse, ApiError, boolean>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (anonymous: boolean) => settingsApi.updateNotifications(anonymous),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all() });
    },
    ...options,
  });
};

export const useUpdateDiaryTime = (options?: UseMutationOptions<SettingsResponse, ApiError, string>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (time: string) => settingsApi.updateDiaryTime(time),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all() });
    },
    ...options,
  });
};
