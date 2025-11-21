/**
 * 일기 CRUD 커스텀 훅
 */

import { useState, useCallback, useEffect } from 'react';
import { diaryApi } from '../utils/api';
import { logError } from '../utils/errorHandler';
import type { Diary } from '../types';

interface DiaryMap {
  [date: string]: Diary;
}

interface UseDiaryListReturn {
  diaries: DiaryMap;
  loading: boolean;
  error: unknown | null;
  refetch: () => Promise<void>;
}

/**
 * 일기 목록 훅
 */
export const useDiaryList = (year: number, month: number): UseDiaryListReturn => {
  const [diaries, setDiaries] = useState<DiaryMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const fetchDiaries = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const data = await diaryApi.getList(year, month);
      // 배열을 객체로 변환 (날짜를 키로)
      const diariesMap = data.diaries.reduce((acc: DiaryMap, diary: Diary) => {
        acc[diary.date] = diary;
        return acc;
      }, {});
      setDiaries(diariesMap);
    } catch (err) {
      logError(err, { action: 'fetchDiaries', year, month });
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchDiaries();
  }, [fetchDiaries]);

  return {
    diaries,
    loading,
    error,
    refetch: fetchDiaries,
  };
};

interface UseDiaryReturn {
  diary: Diary | null;
  loading: boolean;
  error: unknown | null;
  refetch: () => Promise<void>;
}

/**
 * 일기 상세 훅
 */
export const useDiary = (date: string | null): UseDiaryReturn => {
  const [diary, setDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  const fetchDiary = useCallback(async (): Promise<void> => {
    if (!date) return;

    setLoading(true);
    setError(null);

    try {
      const data = await diaryApi.getByDate(date);
      setDiary(data.diary);
    } catch (err) {
      logError(err, { action: 'fetchDiary', date });
      setError(err);
      setDiary(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

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
  updateDiary: (id: string, data: any) => Promise<[Diary, null] | [null, unknown]>;
  deleteDiary: (id: string) => Promise<[boolean, null] | [false, unknown]>;
  loading: boolean;
  error: unknown | null;
}

/**
 * 일기 작성/수정/삭제 훅
 */
export const useDiaryMutations = (): UseDiaryMutationsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  // 일기 생성 (수동 작성용)
  const createDiary = useCallback(async (data: { date: string; emotion: string; summary: string; pictureUrl?: string }): Promise<[Diary, null] | [null, unknown]> => {
    setLoading(true);
    setError(null);

    try {
      const result = await diaryApi.create(data);

      if (window.showToast) {
        window.showToast('일기가 저장되었습니다.', 'success');
      }

      return [result, null];
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
  const updateDiary = useCallback(async (id: string, data: any): Promise<[Diary, null] | [null, unknown]> => {
    setLoading(true);
    setError(null);

    try {
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
  const deleteDiary = useCallback(async (id: string): Promise<[boolean, null] | [false, unknown]> => {
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
