/**
 * 개인화 프롬프트 관리 훅
 * 사용자의 대화 패턴을 분석하여 맞춤형 프롬프트를 생성/업데이트
 */

import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { generatePersonalizedPrompt } from '../lib/gemini';

// 프롬프트 업데이트 간격 (7일)
const UPDATE_INTERVAL_DAYS = 7;

export const usePersonalizedPrompt = () => {
  const { user, isAuthenticated } = useAuth();
  const [personalizedPrompt, setPersonalizedPrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 개인화 프롬프트 로드
  const loadPersonalizedPrompt = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('personalized_prompt, prompt_updated_at')
        .eq('user_id', user.id)
        .single();

      if (!error && data?.personalized_prompt) {
        setPersonalizedPrompt(data.personalized_prompt);
        console.log('📝 개인화 프롬프트 로드됨');
      }
    } catch (error) {
      console.error('개인화 프롬프트 로드 에러:', error);
    }
  }, [user?.id]);

  // 프롬프트 업데이트 필요 여부 확인
  const shouldUpdatePrompt = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data } = await supabase
        .from('user_settings')
        .select('prompt_updated_at')
        .eq('user_id', user.id)
        .single();

      if (!data?.prompt_updated_at) return true;

      const lastUpdate = new Date(data.prompt_updated_at);
      const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

      return daysSinceUpdate >= UPDATE_INTERVAL_DAYS;
    } catch {
      return true;
    }
  }, [user?.id]);

  // 대화 기록 가져오기
  const getChatHistory = useCallback(async (): Promise<Array<{ userMessage: string; aiResponse: string }>> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('user_message, ai_response')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data) return [];

      return data.map((m) => ({
        userMessage: m.user_message,
        aiResponse: m.ai_response,
      }));
    } catch {
      return [];
    }
  }, [user?.id]);

  // 프롬프트 업데이트
  const updatePersonalizedPrompt = useCallback(async (force = false) => {
    if (!user?.id || isLoading) return;

    // 강제 업데이트가 아니면 업데이트 필요 여부 확인
    if (!force) {
      const needsUpdate = await shouldUpdatePrompt();
      if (!needsUpdate) {
        console.log('📝 프롬프트 업데이트 불필요 (최근 업데이트됨)');
        return;
      }
    }

    setIsLoading(true);
    console.log('🔄 개인화 프롬프트 분석 시작...');

    try {
      const chatHistory = await getChatHistory();

      if (chatHistory.length < 10) {
        console.log('📝 대화 기록 부족, 프롬프트 업데이트 건너뜀');
        setIsLoading(false);
        return;
      }

      const newPrompt = await generatePersonalizedPrompt(chatHistory, personalizedPrompt);

      if (newPrompt && newPrompt !== personalizedPrompt) {
        // DB에 저장
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            personalized_prompt: newPrompt,
            prompt_updated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });

        if (!error) {
          setPersonalizedPrompt(newPrompt);
          console.log('✅ 개인화 프롬프트 업데이트 완료:', newPrompt.substring(0, 50) + '...');
        } else {
          console.error('프롬프트 저장 에러:', error);
        }
      }
    } catch (error) {
      console.error('프롬프트 업데이트 에러:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isLoading, shouldUpdatePrompt, getChatHistory, personalizedPrompt]);

  // 초기 로드
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadPersonalizedPrompt();
    }
  }, [isAuthenticated, user?.id, loadPersonalizedPrompt]);

  // 주기적 업데이트 체크 (앱 시작 시)
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // 앱 시작 후 5초 뒤에 업데이트 필요 여부 체크
      const timer = setTimeout(() => {
        updatePersonalizedPrompt();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.id, updatePersonalizedPrompt]);

  return {
    personalizedPrompt,
    isLoading,
    updatePersonalizedPrompt,
    forceUpdate: () => updatePersonalizedPrompt(true),
  };
};

export default usePersonalizedPrompt;
