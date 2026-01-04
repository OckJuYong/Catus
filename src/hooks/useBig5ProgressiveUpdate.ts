/**
 * BIG5 점진적 업데이트 훅
 * 채팅을 기반으로 주기적으로 BIG5 성격 분석을 업데이트
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { analyzeBig5FromChat } from '../lib/gemini';
import { queryKeys } from './useApi';

// 설정
const MIN_MESSAGES_FOR_ANALYSIS = 5; // 최소 5개의 메시지가 있어야 분석
const ANALYSIS_INTERVAL_HOURS = 24; // 24시간마다 분석
const LAST_ANALYSIS_KEY = 'catus_last_big5_analysis';

/**
 * BIG5 점진적 업데이트 훅
 */
export const useBig5ProgressiveUpdate = () => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const isAnalyzingRef = useRef(false);

  /**
   * 마지막 분석 시간 확인
   */
  const getLastAnalysisTime = useCallback((): Date | null => {
    const stored = localStorage.getItem(LAST_ANALYSIS_KEY);
    return stored ? new Date(stored) : null;
  }, []);

  /**
   * 분석이 필요한지 확인
   */
  const shouldAnalyze = useCallback((): boolean => {
    const lastAnalysis = getLastAnalysisTime();
    if (!lastAnalysis) return true;

    const hoursSinceLastAnalysis = (Date.now() - lastAnalysis.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastAnalysis >= ANALYSIS_INTERVAL_HOURS;
  }, [getLastAnalysisTime]);

  /**
   * BIG5 분석 및 저장
   */
  const analyzeAndUpdateBig5 = useCallback(async () => {
    if (isAnalyzingRef.current || !isAuthenticated || !user) return;

    // 분석 필요 여부 확인
    if (!shouldAnalyze()) {
      console.log('⏳ BIG5 분석 주기 미도달 - 건너뜀');
      return;
    }

    isAnalyzingRef.current = true;

    try {
      console.log('🧠 BIG5 점진적 분석 시작...');

      // 최근 7일간의 채팅 메시지 가져오기
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        console.log('❌ 인증 정보 없음');
        return;
      }

      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('user_message')
        .eq('user_id', authUser.id)
        .gte('chat_date', sevenDaysAgo.toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ 채팅 메시지 조회 실패:', error);
        return;
      }

      // 최소 메시지 수 확인
      if (!messages || messages.length < MIN_MESSAGES_FOR_ANALYSIS) {
        console.log(`📭 분석할 메시지 부족 (${messages?.length || 0}/${MIN_MESSAGES_FOR_ANALYSIS})`);
        return;
      }

      // Gemini로 BIG5 분석
      const big5Result = await analyzeBig5FromChat(
        messages.map(m => ({ userMessage: m.user_message }))
      );

      console.log('📊 BIG5 분석 결과:', big5Result);

      // 기존 점수와 가중 평균 계산 (점진적 업데이트)
      const { data: existingScore } = await supabase
        .from('big5_scores')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let finalScores = big5Result;

      if (existingScore) {
        // 가중 평균: 기존 70% + 새로운 30%
        const OLD_WEIGHT = 0.7;
        const NEW_WEIGHT = 0.3;

        finalScores = {
          openness: Math.round(Number(existingScore.openness) * OLD_WEIGHT + big5Result.openness * NEW_WEIGHT),
          conscientiousness: Math.round(Number(existingScore.conscientiousness) * OLD_WEIGHT + big5Result.conscientiousness * NEW_WEIGHT),
          extraversion: Math.round(Number(existingScore.extraversion) * OLD_WEIGHT + big5Result.extraversion * NEW_WEIGHT),
          agreeableness: Math.round(Number(existingScore.agreeableness) * OLD_WEIGHT + big5Result.agreeableness * NEW_WEIGHT),
          neuroticism: Math.round(Number(existingScore.neuroticism) * OLD_WEIGHT + big5Result.neuroticism * NEW_WEIGHT),
          analysis: big5Result.analysis,
        };
      }

      // 새 점수 저장 (source는 DB 스키마에 맞춰 'chat_analysis' 사용)
      const { error: insertError } = await supabase
        .from('big5_scores')
        .insert({
          user_id: authUser.id,
          openness: finalScores.openness,
          conscientiousness: finalScores.conscientiousness,
          extraversion: finalScores.extraversion,
          agreeableness: finalScores.agreeableness,
          neuroticism: finalScores.neuroticism,
          analysis: finalScores.analysis,
          source: 'chat_analysis',
        });

      if (insertError) {
        console.error('❌ BIG5 저장 실패:', insertError);
        return;
      }

      // 마지막 분석 시간 기록
      localStorage.setItem(LAST_ANALYSIS_KEY, new Date().toISOString());

      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.big5.current() });
      queryClient.invalidateQueries({ queryKey: queryKeys.big5.history() });

      console.log('✅ BIG5 점진적 업데이트 완료:', finalScores);
    } catch (error) {
      console.error('❌ BIG5 분석 실패:', error);
    } finally {
      isAnalyzingRef.current = false;
    }
  }, [isAuthenticated, user, shouldAnalyze, queryClient]);

  // 로그인 시 및 주기적으로 분석 실행
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // 로그인 후 잠시 후에 분석 시도 (10초 후)
    const timeout = setTimeout(() => {
      analyzeAndUpdateBig5();
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, user, analyzeAndUpdateBig5]);

  return { analyzeAndUpdateBig5 };
};

/**
 * 채팅 종료 시 BIG5 업데이트 트리거
 * ChatPage에서 사용
 */
export const useBig5UpdateOnChatEnd = () => {
  const { analyzeAndUpdateBig5 } = useBig5ProgressiveUpdate();
  const messagesCountRef = useRef(0);

  const incrementMessageCount = useCallback(() => {
    messagesCountRef.current += 1;

    // 10개 메시지마다 분석 시도
    if (messagesCountRef.current >= 10) {
      messagesCountRef.current = 0;
      // 비동기로 실행하여 채팅 성능에 영향 없음
      setTimeout(() => analyzeAndUpdateBig5(), 5000);
    }
  }, [analyzeAndUpdateBig5]);

  const resetMessageCount = useCallback(() => {
    messagesCountRef.current = 0;
  }, []);

  return { incrementMessageCount, resetMessageCount, analyzeAndUpdateBig5 };
};

export default useBig5ProgressiveUpdate;
