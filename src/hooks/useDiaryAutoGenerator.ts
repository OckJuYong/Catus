/**
 * 그림일기 자동 생성 훅
 * 설정된 시간에 맞춰 오늘의 채팅을 기반으로 일기를 자동 생성
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { chatApi, settingsApi, diaryApi, memoryApi } from '../utils/api';
import { queryKeys } from './useApi';

// 로컬 스토리지 키
const LAST_GENERATION_KEY = 'catus_last_diary_generation';
const GENERATION_CHECK_INTERVAL = 60 * 1000; // 1분마다 체크

/**
 * 일기 자동 생성 훅
 */
export const useDiaryAutoGenerator = () => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isGeneratingRef = useRef(false);

  /**
   * 오늘 날짜 문자열 반환 (YYYY-MM-DD)
   */
  const getTodayString = useCallback(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  /**
   * 설정된 시간인지 확인
   */
  const isGenerationTime = useCallback((diaryTime: string): boolean => {
    const now = new Date();
    const [hours, minutes] = diaryTime.split(':').map(Number);

    // 현재 시간이 설정 시간과 같거나 지났는지 확인 (±5분 허용)
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = hours * 60 + minutes;

    return nowMinutes >= targetMinutes && nowMinutes <= targetMinutes + 5;
  }, []);

  /**
   * 오늘 일기가 이미 생성되었는지 확인
   */
  const isDiaryGeneratedToday = useCallback(async (): Promise<boolean> => {
    const today = getTodayString();

    // 로컬 스토리지에서 마지막 생성 날짜 확인
    const lastGeneration = localStorage.getItem(LAST_GENERATION_KEY);
    if (lastGeneration === today) {
      return true;
    }

    // DB에서 오늘 일기 존재 여부 확인
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const response = await diaryApi.getList(year, month);
      const todayDiary = response.diaries.find(d => d.date === today);

      if (todayDiary) {
        localStorage.setItem(LAST_GENERATION_KEY, today);
        return true;
      }
    } catch (error) {
      console.error('일기 확인 실패:', error);
    }

    return false;
  }, [getTodayString]);

  /**
   * 일기 생성 실행 + 메모리 추출 + 일일 요약 저장
   */
  const generateDiary = useCallback(async () => {
    if (isGeneratingRef.current) {
      console.log('🔄 일기 생성 중 - 중복 실행 방지');
      return;
    }

    isGeneratingRef.current = true;
    const today = getTodayString();

    try {
      console.log('📝 일기 자동 생성 시작...');

      // 오늘의 채팅 데이터 가져오기 (메모리 추출용)
      let todayMessages: Array<{ userMessage: string; aiResponse: string }> = [];
      try {
        const chatContext = await chatApi.getContextByDate(today);
        todayMessages = chatContext.messages.map(m => ({
          userMessage: m.userMessage,
          aiResponse: m.aiResponse,
        }));
      } catch {
        // 채팅 데이터 없으면 빈 배열
      }

      // 1. 일기 생성 (analyzeChat 호출)
      await chatApi.analyzeChat(today, today);

      // 2. 장기 기억 추출 및 저장 (백그라운드)
      if (todayMessages.length >= 3) {
        memoryApi.extractAndSaveMemories(todayMessages)
          .then(count => {
            if (count > 0) {
              console.log(`🧠 ${count}개의 새로운 기억 저장됨`);
            }
          })
          .catch(err => console.error('메모리 추출 실패:', err));
      }

      // 3. 일일 대화 요약 저장 (백그라운드)
      if (todayMessages.length >= 2) {
        memoryApi.saveDailySummary(today, todayMessages)
          .then(success => {
            if (success) {
              console.log('📋 일일 대화 요약 저장됨');
            }
          })
          .catch(err => console.error('요약 저장 실패:', err));
      }

      // 생성 완료 기록
      localStorage.setItem(LAST_GENERATION_KEY, today);

      // 캐시 무효화
      const now = new Date();
      queryClient.invalidateQueries({
        queryKey: queryKeys.diary.list(now.getFullYear(), now.getMonth() + 1)
      });

      console.log('✅ 일기 자동 생성 완료');

      // 알림 표시 (브라우저 알림)
      if (Notification.permission === 'granted') {
        new Notification('캐터스 일기', {
          body: '오늘의 그림일기가 생성되었어요! 확인해보세요 🎨',
          icon: '/vite.svg',
        });
      }
    } catch (error: any) {
      // 분석할 대화가 없는 경우는 정상
      if (error.message?.includes('분석할 대화가 없습니다')) {
        console.log('📭 오늘 대화가 없어서 일기 생성 건너뜀');
        localStorage.setItem(LAST_GENERATION_KEY, today); // 오늘은 다시 시도하지 않음
      } else {
        console.error('❌ 일기 자동 생성 실패:', error);
      }
    } finally {
      isGeneratingRef.current = false;
    }
  }, [getTodayString, queryClient]);

  /**
   * 일기 생성 조건 확인 및 실행
   */
  const checkAndGenerate = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      // 설정 조회
      const settings = await settingsApi.getSettings();
      const diaryTime = settings.settings.diaryGenerationTime || '21:00:00';

      // 생성 시간이 아니면 패스
      if (!isGenerationTime(diaryTime)) {
        return;
      }

      // 이미 오늘 생성했으면 패스
      const alreadyGenerated = await isDiaryGeneratedToday();
      if (alreadyGenerated) {
        return;
      }

      // 일기 생성
      await generateDiary();
    } catch (error) {
      console.error('일기 생성 체크 실패:', error);
    }
  }, [isAuthenticated, user, isGenerationTime, isDiaryGeneratedToday, generateDiary]);

  // 주기적 체크 설정
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    console.log('⏰ 일기 자동 생성 스케줄러 시작');

    // 즉시 한 번 체크
    checkAndGenerate();

    // 1분마다 체크
    checkIntervalRef.current = setInterval(checkAndGenerate, GENERATION_CHECK_INTERVAL);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, user, checkAndGenerate]);

  // 브라우저 알림 권한 요청
  useEffect(() => {
    if (isAuthenticated && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isAuthenticated]);

  return { generateDiary };
};

export default useDiaryAutoGenerator;
