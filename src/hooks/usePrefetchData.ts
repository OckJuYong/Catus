/**
 * 데이터 프리페칭 훅
 * 로그인 시 주요 데이터를 미리 로드하여 캐싱
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { queryKeys } from './useApi';
import { diaryApi, settingsApi, big5Api, messageApi, statsApi } from '../utils/api';

/**
 * 로그인 후 주요 데이터 프리페칭
 */
export const usePrefetchData = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const prefetchAll = async () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      console.log('📦 데이터 프리페칭 시작...');

      try {
        // 병렬로 주요 데이터 프리페칭
        await Promise.allSettled([
          // 설정 정보
          queryClient.prefetchQuery({
            queryKey: queryKeys.settings.all(),
            queryFn: () => settingsApi.getSettings(),
            staleTime: 30 * 60 * 1000, // 30분
          }),

          // 현재 BIG5 점수
          queryClient.prefetchQuery({
            queryKey: queryKeys.big5.current(),
            queryFn: () => big5Api.getCurrent(),
            staleTime: 60 * 60 * 1000, // 1시간
          }),

          // 이번 달 일기 목록
          queryClient.prefetchQuery({
            queryKey: queryKeys.diary.list(currentYear, currentMonth),
            queryFn: () => diaryApi.getList(currentYear, currentMonth),
            staleTime: 30 * 60 * 1000,
          }),

          // 받은 메시지 (첫 페이지)
          queryClient.prefetchQuery({
            queryKey: queryKeys.message.received(0),
            queryFn: () => messageApi.getReceived(0, 20),
            staleTime: 10 * 60 * 1000, // 10분
          }),

          // 이번 달 감정 통계
          queryClient.prefetchQuery({
            queryKey: queryKeys.stats.emotions(currentYear, currentMonth),
            queryFn: () => statsApi.getEmotions(currentYear, currentMonth),
            staleTime: 30 * 60 * 1000,
          }),

          // BIG5 히스토리
          queryClient.prefetchQuery({
            queryKey: queryKeys.big5.history(),
            queryFn: () => big5Api.getHistory(),
            staleTime: 60 * 60 * 1000, // 1시간
          }),
        ]);

        console.log('✅ 데이터 프리페칭 완료');
      } catch (error) {
        console.error('❌ 프리페칭 에러:', error);
      }
    };

    prefetchAll();
  }, [isAuthenticated, user, queryClient]);
};

/**
 * 특정 월의 일기 데이터 프리페칭
 */
export const usePrefetchMonthDiaries = (year: number, month: number) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    // 이전 달과 다음 달도 프리페칭
    const prefetchAdjacentMonths = async () => {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;

      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: queryKeys.diary.list(prevYear, prevMonth),
          queryFn: () => diaryApi.getList(prevYear, prevMonth),
          staleTime: 30 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.diary.list(nextYear, nextMonth),
          queryFn: () => diaryApi.getList(nextYear, nextMonth),
          staleTime: 30 * 60 * 1000,
        }),
      ]);
    };

    prefetchAdjacentMonths();
  }, [isAuthenticated, year, month, queryClient]);
};

export default usePrefetchData;
