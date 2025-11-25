/**
 * 일기 CRUD 커스텀 훅
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { diaryApi } from '../utils/api';
import { logError } from '../utils/errorHandler';
import type { Diary } from '../types';

interface DiaryMap {
  [date: string]: Diary;
}

interface UseDiaryListReturn {
  diaries: DiaryMap;
  loading: boolean;
  isFetching: boolean;
  error: unknown | null;
  refetch: () => Promise<void>;
}

/**
 * 일기 목록 훅 (React Query 캐싱 적용)
 */
export const useDiaryList = (year: number, month: number): UseDiaryListReturn => {
  const queryClient = useQueryClient();

  const { data: diaries = {}, isLoading: loading, isFetching, error, refetch } = useQuery({
    queryKey: ['diary', 'list', year, month],
    queryFn: async () => {
      const data = await diaryApi.getList(year, month);
      // 백엔드 응답: { year, month, diaries: [{id, date, title, previewText, thumbnailUrl}], totalCount }
      // 배열을 객체로 변환 (날짜를 키로)
      const diariesMap = data.diaries.reduce((acc: DiaryMap, diary: any) => {
        acc[diary.date] = {
          id: diary.id,
          date: diary.date,
          title: diary.title,
          content: diary.previewText,
          imageUrl: diary.thumbnailUrl,
          createdAt: new Date().toISOString(),
        };
        return acc;
      }, {});
      return diariesMap;
    },
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 30 * 60 * 1000, // 30분간 가비지 컬렉션 방지
  });

  // 이전/다음 달 미리 불러오기 (prefetch)
  useEffect(() => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    // 이전 달 prefetch
    queryClient.prefetchQuery({
      queryKey: ['diary', 'list', prevYear, prevMonth],
      queryFn: async () => {
        const data = await diaryApi.getList(prevYear, prevMonth);
        return data.diaries.reduce((acc: DiaryMap, diary: any) => {
          acc[diary.date] = {
            id: diary.id,
            date: diary.date,
            title: diary.title,
            content: diary.previewText,
            imageUrl: diary.thumbnailUrl,
            createdAt: new Date().toISOString(),
          };
          return acc;
        }, {});
      },
      staleTime: 5 * 60 * 1000,
    });

    // 다음 달 prefetch
    queryClient.prefetchQuery({
      queryKey: ['diary', 'list', nextYear, nextMonth],
      queryFn: async () => {
        const data = await diaryApi.getList(nextYear, nextMonth);
        return data.diaries.reduce((acc: DiaryMap, diary: any) => {
          acc[diary.date] = {
            id: diary.id,
            date: diary.date,
            title: diary.title,
            content: diary.previewText,
            imageUrl: diary.thumbnailUrl,
            createdAt: new Date().toISOString(),
          };
          return acc;
        }, {});
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [year, month, queryClient]);

  return {
    diaries,
    loading,
    isFetching,
    error,
    refetch: async () => { await refetch(); },
  };
};

interface UseDiaryReturn {
  diary: Diary | null;
  loading: boolean;
  error: unknown | null;
  refetch: () => Promise<void>;
}

/**
 * 일기 상세 훅 (id 기반)
 */
export const useDiary = (id: number | null): UseDiaryReturn => {
  const [diary, setDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const fetchDiary = useCallback(async (): Promise<void> => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // 백엔드: getById(id) 사용, 응답: {id, date, title, content, imageUrl, big5Scores?, createdAt}
      const data = await diaryApi.getById(id);
      setDiary({
        id: data.id,
        date: data.date,
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl,
        createdAt: data.createdAt,
      });
    } catch (err) {
      logError(err, { action: 'fetchDiary', id });
      setError(err);
      setDiary(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDiary();
  }, [fetchDiary]);

  return {
    diary,
    loading,
    error,
    refetch: fetchDiary,
  };
};

interface UseDiaryMutationsReturn {
  createDiary: (data: any) => Promise<[Diary, null] | [null, unknown]>;
  updateDiary: (id: number, data: any) => Promise<[any, null] | [null, unknown]>;
  deleteDiary: (id: number) => Promise<[boolean, null] | [false, unknown]>;
  loading: boolean;
  error: unknown | null;
}

/**
 * 일기 작성/수정/삭제 훅
 */
export const useDiaryMutations = (): UseDiaryMutationsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  // 일기 생성 (백엔드에 create API 없음 - 시스템 자동 생성만 지원)
  const createDiary = useCallback(async (data: { date: string; emotion: string; summary: string; pictureUrl?: string }): Promise<[Diary, null] | [null, unknown]> => {
    setLoading(true);
    setError(null);

    try {
      // TODO: 백엔드에 일기 수동 생성 API 없음
      // POST /api/diary/generate는 시스템용 (X-System-Auth 필요)
      // 임시로 에러 반환
      throw new Error('일기 수동 생성 기능은 백엔드 미구현');
    } catch (err) {
      logError(err, { action: 'createDiary', data });
      setError(err);

      if (window.showToast) {
        window.showToast('일기 저장에 실패했습니다.', 'error');
      }

      return [null, err];
    } finally {
      setLoading(false);
    }
  }, []);

  // 일기 수정
  const updateDiary = useCallback(async (id: number, data: any): Promise<[any, null] | [null, unknown]> => {
    setLoading(true);
    setError(null);

    try {
      // 백엔드: PUT /api/diary/{id}, 응답: {id, updatedAt, message}
      const result = await diaryApi.update(id, data);

      if (window.showToast) {
        window.showToast('일기가 수정되었습니다.', 'success');
      }

      return [result, null];
    } catch (err) {
      logError(err, { action: 'updateDiary', id, data });
      setError(err);

      if (window.showToast) {
        window.showToast('일기 수정에 실패했습니다.', 'error');
      }

      return [null, err];
    } finally {
      setLoading(false);
    }
  }, []);

  // 일기 삭제
  const deleteDiary = useCallback(async (id: number): Promise<[boolean, null] | [false, unknown]> => {
    setLoading(true);
    setError(null);

    try {
      await diaryApi.delete(id);

      if (window.showToast) {
        window.showToast('일기가 삭제되었습니다.', 'success');
      }

      return [true, null];
    } catch (err) {
      logError(err, { action: 'deleteDiary', id });
      setError(err);

      if (window.showToast) {
        window.showToast('일기 삭제에 실패했습니다.', 'error');
      }

      return [false, err];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createDiary,
    updateDiary,
    deleteDiary,
    loading,
    error,
  };
};

export default useDiary;
