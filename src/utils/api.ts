/**
 * API 호출 유틸리티
 * Supabase + Gemini 기반 클라이언트
 */

import { supabase, signInWithKakao, signOut, getCurrentUser, getSession } from '../lib/supabase';
import { chatWithGemini, chatWithGeminiAndMemory, analyzeChatEmotion, generateDiaryFromChat, analyzeBig5FromChat, analyzeConversationPsychology, extractMemoriesFromChat, generateDailySummary } from '../lib/gemini';
import { generateDiaryImage } from '../lib/imagen';
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
import type { Emotion, MemoryCategory } from '../types/database';

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
 * Token refresh callback (AuthContext에서 설정) - Supabase handles this internally
 */
let tokenRefreshCallback: (() => Promise<string | null>) | null = null;

export const setTokenRefreshCallback = (callback: (() => Promise<string | null>) | null): void => {
  tokenRefreshCallback = callback;
};

/**
 * Helper: Get current user ID
 * Supabase Auth 또는 Custom Auth 사용자 모두 지원
 */
const getCurrentUserId = async (): Promise<string> => {
  // 1. 먼저 Supabase Auth 확인
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!error && user) {
    return user.id;
  }

  // 2. Custom Auth 사용자 확인 (localStorage)
  const loginType = localStorage.getItem('catus_login_type');
  if (loginType === 'custom') {
    const cachedUser = localStorage.getItem('catus_user');
    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser);
        if (userData.id) {
          return userData.id;
        }
      } catch (e) {
        console.error('Failed to parse cached user:', e);
      }
    }
  }

  throw new ApiError('인증이 필요합니다.', 401);
};

/**
 * Helper: Format date to YYYY-MM-DD
 */
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * 🔐 인증 API
 */
export const authApi = {
  // 카카오 로그인 - Supabase OAuth
  kakaoLogin: async (code: string): Promise<LoginResponse> => {
    // Supabase handles OAuth callback automatically
    const { session, error } = await supabase.auth.getSession();

    if (error || !session) {
      throw new ApiError('카카오 로그인에 실패했습니다.', 401);
    }

    // Get user profile from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    const isNewUser = !userData;

    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token || '',
      user: userData ? {
        id: userData.id,
        nickname: userData.nickname,
        profileImage: userData.profile_image,
        createdAt: userData.created_at,
      } : {
        id: session.user.id,
        nickname: session.user.user_metadata?.name || '사용자',
        profileImage: session.user.user_metadata?.avatar_url,
        createdAt: new Date().toISOString(),
      },
      isNewUser,
    };
  },

  // 추가 정보 입력 (회원가입)
  signup: async (data: SignupData): Promise<SignupResponse> => {
    const userId = await getCurrentUserId();

    const { data: userData, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        nickname: data.nickname,
        profile_image: data.profileImage,
        password_hash: data.password, // Should be hashed on client or use separate auth
        onboarding_completed: false,
      })
      .select()
      .maybeSingle();

    if (error) {
      throw new ApiError('회원가입에 실패했습니다.', 400, error);
    }

    // Create default settings
    await supabase.from('user_settings').upsert({
      user_id: userId,
      notification_anonymous: true,
      notification_diary: true,
      dark_mode: false,
    });

    const { session } = await supabase.auth.getSession();

    return {
      accessToken: session?.access_token || '',
      refreshToken: session?.refresh_token || '',
      user: {
        id: userData.id,
        nickname: userData.nickname,
        profileImage: userData.profile_image,
        createdAt: userData.created_at,
      },
    };
  },

  // 토큰 갱신 - Supabase handles this automatically
  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      throw new ApiError('토큰 갱신에 실패했습니다.', 401);
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token || '',
    };
  },

  // 로그아웃
  logout: async (): Promise<{ message: string }> => {
    const { error } = await signOut();
    if (error) {
      throw new ApiError('로그아웃에 실패했습니다.', 400, error);
    }
    return { message: '로그아웃되었습니다.' };
  },

  // 인증 코드 생성 (회원 탈퇴용)
  generateVerificationCode: async (): Promise<{ code: string; expiresInMinutes: number }> => {
    const userId = await getCurrentUserId();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await supabase.from('verification_codes').insert({
      user_id: userId,
      code,
      expires_at: expiresAt.toISOString(),
    });

    return { code, expiresInMinutes: 10 };
  },

  // 회원 탈퇴
  withdraw: async (password: string, verificationCode: string): Promise<{ message: string }> => {
    const userId = await getCurrentUserId();

    // Verify code
    const { data: codeData, error: codeError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('code', verificationCode)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (codeError || !codeData) {
      throw new ApiError('인증 코드가 유효하지 않습니다.', 400);
    }

    // Mark code as used
    await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', codeData.id);

    // Delete user data (cascading will handle related records)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      throw new ApiError('회원 탈퇴에 실패했습니다.', 500, deleteError);
    }

    // Sign out
    await signOut();

    return { message: '회원 탈퇴가 완료되었습니다.' };
  },
};

/**
 * 💬 채팅 API
 */
export const chatApi = {
  // 메시지 전송 (개인화 프롬프트 + 장기 기억 지원)
  sendMessage: async (content: string): Promise<{ messageId: number; userMessage: string; aiResponse: string; timestamp: string }> => {
    const userId = await getCurrentUserId();
    const today = formatDate(new Date());

    // Parallel fetch: personalized prompt, chat history, memory context
    const [settingsResult, historyResult, memoryContext] = await Promise.all([
      supabase
        .from('user_settings')
        .select('personalized_prompt')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('chat_messages')
        .select('user_message, ai_response')
        .eq('user_id', userId)
        .eq('chat_date', today)
        .order('created_at', { ascending: true }),
      // 메모리 컨텍스트 가져오기 (장기 기억 + 최근 대화 요약)
      (async () => {
        try {
          // 메모리 조회
          const { data: memories } = await supabase
            .from('user_memories')
            .select('category, content')
            .eq('user_id', userId)
            .order('importance', { ascending: false })
            .order('last_mentioned', { ascending: false })
            .limit(15);

          // 최근 7일 요약 조회
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          const startDateStr = startDate.toISOString().split('T')[0];

          const { data: summaries } = await supabase
            .from('chat_summaries')
            .select('summary_date, summary')
            .eq('user_id', userId)
            .gte('summary_date', startDateStr)
            .neq('summary_date', today) // 오늘 제외 (아직 진행중)
            .order('summary_date', { ascending: false });

          return {
            memories: (memories || []).map(m => ({ category: m.category, content: m.content })),
            recentSummaries: (summaries || []).map(s => ({ date: s.summary_date, summary: s.summary })),
          };
        } catch {
          return { memories: [], recentSummaries: [] };
        }
      })(),
    ]);

    const personalizedPrompt = settingsResult.data?.personalized_prompt || null;
    const historyData = historyResult.data || [];

    // Build chat history for Gemini
    const chatHistory = historyData.flatMap(msg => [
      { role: 'user' as const, parts: [{ text: msg.user_message }] },
      { role: 'model' as const, parts: [{ text: msg.ai_response }] },
    ]);

    // Get AI response from Gemini with personalized prompt + memory context
    const aiResponse = await chatWithGeminiAndMemory(
      content,
      chatHistory,
      personalizedPrompt,
      memoryContext.memories,
      memoryContext.recentSummaries
    );

    // Save to database
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        user_message: content,
        ai_response: aiResponse,
        chat_date: today,
      })
      .select('id, created_at')
      .maybeSingle();

    if (error) {
      throw new ApiError('메시지 저장에 실패했습니다.', 500, error);
    }

    return {
      messageId: data.id,
      userMessage: content,
      aiResponse,
      timestamp: data.created_at,
    };
  },

  // 대화 기록 조회
  getHistory: async (page: number = 0, size: number = 20): Promise<ChatHistory> => {
    const userId = await getCurrentUserId();

    const { data, error, count } = await supabase
      .from('chat_messages')
      .select('id, user_message, ai_response, created_at', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(page * size, (page + 1) * size - 1);

    if (error) {
      throw new ApiError('대화 기록 조회에 실패했습니다.', 500, error);
    }

    return {
      messages: (data || []).map(msg => ({
        id: msg.id,
        userMessage: msg.user_message,
        aiResponse: msg.ai_response,
        timestamp: msg.created_at,
      })),
      totalPages: Math.ceil((count || 0) / size),
      currentPage: page,
    };
  },

  // 특정 날짜 채팅 조회
  getContextByDate: async (date: string): Promise<{ date: string; messages: Array<{ id: number; userMessage: string; aiResponse: string; timestamp: string }> }> => {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, user_message, ai_response, created_at')
      .eq('user_id', userId)
      .eq('chat_date', date)
      .order('created_at', { ascending: true });

    if (error) {
      throw new ApiError('대화 조회에 실패했습니다.', 500, error);
    }

    return {
      date,
      messages: (data || []).map(msg => ({
        id: msg.id,
        userMessage: msg.user_message,
        aiResponse: msg.ai_response,
        timestamp: msg.created_at,
      })),
    };
  },

  // 최근 7일 대화 내역 조회 (카카오톡 스타일)
  getWeekHistory: async (): Promise<Array<{ id: number; userMessage: string; aiResponse: string; timestamp: string; chatDate: string }>> => {
    const userId = await getCurrentUserId();

    // 7일 전 날짜 계산
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, user_message, ai_response, created_at, chat_date')
      .eq('user_id', userId)
      .gte('chat_date', startDateStr)
      .order('created_at', { ascending: true });

    if (error) {
      throw new ApiError('대화 내역 조회에 실패했습니다.', 500, error);
    }

    return (data || []).map(msg => ({
      id: msg.id,
      userMessage: msg.user_message,
      aiResponse: msg.ai_response,
      timestamp: msg.created_at,
      chatDate: msg.chat_date,
    }));
  },

  // 채팅 분석 및 일기 생성
  analyzeChat: async (startDate: string, endDate: string): Promise<ChatAnalysisResponse> => {
    const userId = await getCurrentUserId();

    // Get messages in date range
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('user_message, ai_response')
      .eq('user_id', userId)
      .gte('chat_date', startDate)
      .lte('chat_date', endDate)
      .order('created_at', { ascending: true });

    if (error || !messages || messages.length === 0) {
      throw new ApiError('분석할 대화가 없습니다.', 400);
    }

    const messageData = messages.map(m => ({ userMessage: m.user_message, aiResponse: m.ai_response }));

    // Analyze emotion with Gemini
    const { emotion, summary } = await analyzeChatEmotion(messageData);

    // Big5 성격 분석 (ChatAnalysisResponse에 필요)
    const big5Analysis = await analyzeBig5FromChat(messageData);

    // 🔬 연구용: 심리 분석 (고립감/웰빙) 병렬 실행
    const psychologyAnalysis = analyzeConversationPsychology(messageData);

    // Generate diary content
    const { title, content } = await generateDiaryFromChat(messageData, emotion);

    // Generate diary image
    const imageUrl = await generateDiaryImage(emotion, summary);

    // Save diary to database
    const diaryDate = endDate; // Use end date as diary date
    const { data: diary, error: diaryError } = await supabase
      .from('diaries')
      .upsert({
        user_id: userId,
        diary_date: diaryDate,
        title,
        content,
        content_preview: content.substring(0, 100),
        emotion: emotion as Emotion,
        image_url: imageUrl,
        is_read: false,
        is_public: false,
      }, {
        onConflict: 'user_id,diary_date',
      })
      .select('id')
      .maybeSingle();

    if (diaryError) {
      throw new ApiError('일기 저장에 실패했습니다.', 500, diaryError);
    }

    // 🔬 연구용: 심리 분석 결과 저장 (비동기, 실패해도 일기 생성 계속)
    try {
      const analysis = await psychologyAnalysis;
      const avgLength = messages.reduce((sum, m) => sum + m.user_message.length, 0) / messages.length;

      await supabase
        .from('conversation_analysis')
        .upsert({
          user_id: userId,
          analysis_date: diaryDate,
          loneliness_score: analysis.lonelinessScore,
          wellbeing_score: analysis.wellbeingScore,
          emotion_distribution: analysis.emotionDistribution,
          topic_keywords: analysis.topicKeywords,
          message_count: messages.length,
          avg_message_length: avgLength,
          analysis_summary: analysis.analysisSummary,
        }, {
          onConflict: 'user_id,analysis_date',
        });

      console.log('📊 심리 분석 저장 완료:', {
        date: diaryDate,
        loneliness: analysis.lonelinessScore,
        wellbeing: analysis.wellbeingScore,
      });
    } catch (analysisError) {
      // 분석 저장 실패해도 일기 생성은 성공으로 처리
      console.error('심리 분석 저장 실패 (무시됨):', analysisError);
    }

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      emotionScores: {
        openness: big5Analysis.openness,
        conscientiousness: big5Analysis.conscientiousness,
        extraversion: big5Analysis.extraversion,
        agreeableness: big5Analysis.agreeableness,
        neuroticism: big5Analysis.neuroticism,
      },
      summary,
      // 추가 정보 (기존 호환성)
      diaryId: diary?.id,
      emotion,
      generatedAt: new Date().toISOString(),
    };
  },
};

/**
 * 📔 일기 API
 */
export const diaryApi = {
  // 일기 목록 조회
  getList: async (year: number, month: number): Promise<DiaryListResponse> => {
    const userId = await getCurrentUserId();

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data, error } = await supabase
      .from('diaries')
      .select('id, diary_date, title, content_preview, emotion, thumbnail_url, is_read')
      .eq('user_id', userId)
      .gte('diary_date', startDate)
      .lte('diary_date', endDate)
      .order('diary_date', { ascending: false });

    if (error) {
      throw new ApiError('일기 목록 조회에 실패했습니다.', 500, error);
    }

    return {
      diaries: (data || []).map(d => ({
        id: d.id,
        date: d.diary_date,
        title: d.title || '오늘의 일기',
        previewText: d.content_preview || '',
        emotion: d.emotion || '보통',
        thumbnailUrl: d.thumbnail_url || d.thumbnail_url,
        isRead: d.is_read,
      })),
      year,
      month,
    };
  },

  // 일기 상세 조회
  getById: async (id: number): Promise<DiaryDetailResponse> => {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      throw new ApiError('일기를 찾을 수 없습니다.', 404);
    }

    // Check access permission
    if (data.user_id !== userId && !data.is_public) {
      throw new ApiError('접근 권한이 없습니다.', 403);
    }

    // Mark as read
    if (data.user_id === userId && !data.is_read) {
      await supabase
        .from('diaries')
        .update({ is_read: true })
        .eq('id', id);
    }

    return {
      id: data.id,
      date: data.diary_date,
      title: data.title || '오늘의 일기',
      content: data.content,
      emotion: data.emotion || '보통',
      imageUrl: data.image_url,
      isPublic: data.is_public,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  // 일기 수정
  update: async (id: number, data: DiaryUpdateData): Promise<{ id: number; updatedAt: string; message: string }> => {
    const userId = await getCurrentUserId();

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) {
      updateData.content = data.content;
      updateData.content_preview = data.content.substring(0, 100);
    }
    if (data.isPublic !== undefined) updateData.is_public = data.isPublic;

    const { data: updated, error } = await supabase
      .from('diaries')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, updated_at')
      .maybeSingle();

    if (error || !updated) {
      throw new ApiError('일기 수정에 실패했습니다.', 500, error);
    }

    return {
      id: updated.id,
      updatedAt: updated.updated_at,
      message: '일기가 수정되었습니다.',
    };
  },

  // 일기 삭제
  delete: async (id: number): Promise<{ message: string }> => {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from('diaries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new ApiError('일기 삭제에 실패했습니다.', 500, error);
    }

    return { message: '일기가 삭제되었습니다.' };
  },

  // 랜덤 일기 조회
  getRandom: async (): Promise<{ diaryId: number; title: string; date: string; previewText: string; thumbnailUrl: string }> => {
    const userId = await getCurrentUserId();

    // Get a random public diary (not from current user)
    const { data, error } = await supabase
      .from('diaries')
      .select('id, title, diary_date, content_preview, thumbnail_url, image_url')
      .eq('is_public', true)
      .neq('user_id', userId)
      .limit(100);

    if (error || !data || data.length === 0) {
      throw new ApiError('공개된 일기가 없습니다.', 404);
    }

    // Select random diary
    const randomIndex = Math.floor(Math.random() * data.length);
    const diary = data[randomIndex];

    return {
      diaryId: diary.id,
      title: diary.title || '오늘의 일기',
      date: diary.diary_date,
      previewText: diary.content_preview || '',
      thumbnailUrl: diary.thumbnail_url || diary.image_url || '',
    };
  },
};

/**
 * 💌 익명 메시지 API
 */
export const messageApi = {
  // 받은 메시지 조회
  getReceived: async (page: number = 0, size: number = 20): Promise<{ messages: Array<{ id: number; content: string; diaryId: number; receivedAt: string; isRead: boolean }>; totalPages: number; unreadCount: number }> => {
    const userId = await getCurrentUserId();

    const { data, error, count } = await supabase
      .from('anonymous_messages')
      .select('id, content, diary_id, created_at, is_read', { count: 'exact' })
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false })
      .range(page * size, (page + 1) * size - 1);

    if (error) {
      throw new ApiError('메시지 조회에 실패했습니다.', 500, error);
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('anonymous_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    return {
      messages: (data || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        diaryId: msg.diary_id,
        receivedAt: msg.created_at,
        isRead: msg.is_read,
      })),
      totalPages: Math.ceil((count || 0) / size),
      unreadCount: unreadCount || 0,
    };
  },

  // 알림 조회
  getNotifications: async (): Promise<{ unreadCount: number; notifications: Array<{ id: number; content: string; receivedAt: string }> }> => {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('anonymous_messages')
      .select('id, content, created_at')
      .eq('receiver_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw new ApiError('알림 조회에 실패했습니다.', 500, error);
    }

    return {
      unreadCount: (data || []).length,
      notifications: (data || []).map(n => ({
        id: n.id,
        content: n.content,
        receivedAt: n.created_at,
      })),
    };
  },

  // 메시지 전송
  send: async (diaryId: number, content: string): Promise<{ messageId: number; sentAt: string }> => {
    const userId = await getCurrentUserId();

    // Get diary owner
    const { data: diary, error: diaryError } = await supabase
      .from('diaries')
      .select('user_id')
      .eq('id', diaryId)
      .maybeSingle();

    if (diaryError || !diary) {
      throw new ApiError('일기를 찾을 수 없습니다.', 404);
    }

    const { data, error } = await supabase
      .from('anonymous_messages')
      .insert({
        sender_id: userId,
        receiver_id: diary.user_id,
        diary_id: diaryId,
        content,
      })
      .select('id, created_at')
      .maybeSingle();

    if (error) {
      throw new ApiError('메시지 전송에 실패했습니다.', 500, error);
    }

    return {
      messageId: data.id,
      sentAt: data.created_at,
    };
  },

  // 메시지 읽음 처리
  markAsRead: async (messageId: number): Promise<{ message: string }> => {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from('anonymous_messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .eq('receiver_id', userId);

    if (error) {
      throw new ApiError('읽음 처리에 실패했습니다.', 500, error);
    }

    return { message: '읽음 처리되었습니다.' };
  },
};

// 하위 호환성을 위한 별칭
export const supportApi = messageApi;

/**
 * 🧠 Big5 성격 분석 API
 */

// 질문 ID별 trait 매핑 (big5Questions.ts 기반)
const QUESTION_TRAIT_MAP: Record<number, 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism'> = {
  1: 'extraversion',
  2: 'agreeableness',
  3: 'conscientiousness',
  4: 'neuroticism',
  5: 'openness',
  6: 'extraversion',
  7: 'conscientiousness',
  8: 'openness',
  9: 'agreeableness',
  10: 'neuroticism',
};

export const big5Api = {
  // 초기 성격 테스트
  submitInitial: async (answers: Array<{ questionId: number; score: number }>): Promise<Big5TestResponse> => {
    const userId = await getCurrentUserId();

    // 각 trait별 점수 합계와 문항 수
    const traitScores: Record<string, { total: number; count: number }> = {
      openness: { total: 0, count: 0 },
      conscientiousness: { total: 0, count: 0 },
      extraversion: { total: 0, count: 0 },
      agreeableness: { total: 0, count: 0 },
      neuroticism: { total: 0, count: 0 },
    };

    // 각 답변을 해당 trait에 매핑 (역문항은 이미 Big5TestPage에서 처리됨)
    answers.forEach(a => {
      const trait = QUESTION_TRAIT_MAP[a.questionId];
      if (trait) {
        traitScores[trait].total += a.score;
        traitScores[trait].count += 1;
      }
    });

    // 각 trait별 평균 점수를 0-100 범위로 변환
    // 점수 범위: 1-5, 각 trait당 2문항 → 최대 10점
    // 평균을 구한 후 (1-5) → (0-100)으로 변환: ((avg - 1) / 4) * 100
    const traits = {
      openness: 0,
      conscientiousness: 0,
      extraversion: 0,
      agreeableness: 0,
      neuroticism: 0,
    };

    Object.keys(traits).forEach(key => {
      const k = key as keyof typeof traits;
      const { total, count } = traitScores[k];
      if (count > 0) {
        const avg = total / count; // 1-5 범위
        traits[k] = Math.round(((avg - 1) / 4) * 100); // 0-100 범위
      }
    });

    const analysis = `당신은 개방성 ${traits.openness}%, 성실성 ${traits.conscientiousness}%, 외향성 ${traits.extraversion}%, 친화성 ${traits.agreeableness}%, 신경증 ${traits.neuroticism}%의 성향을 보입니다.`;

    const { data, error } = await supabase
      .from('big5_scores')
      .insert({
        user_id: userId,
        openness: traits.openness,
        conscientiousness: traits.conscientiousness,
        extraversion: traits.extraversion,
        agreeableness: traits.agreeableness,
        neuroticism: traits.neuroticism,
        analysis,
        source: 'initial_test',
      })
      .select('id, created_at')
      .maybeSingle();

    if (error) {
      throw new ApiError('성격 테스트 저장에 실패했습니다.', 500, error);
    }

    return {
      scores: traits,
      analysis,
      completedAt: data.created_at,
    };
  },

  // 현재 성격 점수 조회
  getCurrent: async (): Promise<Big5CurrentResponse> => {
    const userId = await getCurrentUserId();

    // .single() 대신 .maybeSingle() 사용 - RLS로 0개 반환 시 406 에러 방지
    const { data, error } = await supabase
      .from('big5_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return {
        scores: null,
        hasCompletedTest: false,
      };
    }

    return {
      scores: {
        openness: Number(data.openness),
        conscientiousness: Number(data.conscientiousness),
        extraversion: Number(data.extraversion),
        agreeableness: Number(data.agreeableness),
        neuroticism: Number(data.neuroticism),
      },
      analysis: data.analysis,
      lastUpdated: data.created_at,
      hasCompletedTest: true,
    };
  },

  // 성격 변화 이력
  getHistory: async (period?: 'weekly' | 'monthly' | 'yearly'): Promise<Big5HistoryResponse> => {
    const userId = await getCurrentUserId();

    let startDate: Date;
    switch (period) {
      case 'weekly':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'yearly':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    const { data, error } = await supabase
      .from('big5_scores')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      throw new ApiError('성격 이력 조회에 실패했습니다.', 500, error);
    }

    return {
      history: (data || []).map(d => ({
        date: d.created_at,
        scores: {
          openness: Number(d.openness),
          conscientiousness: Number(d.conscientiousness),
          extraversion: Number(d.extraversion),
          agreeableness: Number(d.agreeableness),
          neuroticism: Number(d.neuroticism),
        },
        source: d.source,
      })),
      period: period || 'all',
    };
  },
};

/**
 * ⚙️ 설정 API
 */
export const settingsApi = {
  // 설정 조회
  getSettings: async (): Promise<SettingsResponse> => {
    const userId = await getCurrentUserId();

    // .single() 대신 .maybeSingle() 사용 - RLS로 0개 반환 시 406 에러 방지
    const [{ data: user }, { data: settings }] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    if (!user) {
      throw new ApiError('사용자 정보를 찾을 수 없습니다.', 404);
    }

    return {
      user: {
        id: user.id,
        nickname: user.nickname,
        profileImage: user.profile_image,
        email: user.email,
      },
      settings: {
        diaryGenerationTime: user.diary_generation_time,
        notifications: {
          anonymous: settings?.notification_anonymous ?? true,
          diary: settings?.notification_diary ?? true,
        },
        theme: {
          darkMode: settings?.dark_mode ?? false,
        },
      },
    };
  },

  // 일기 생성 시간 변경
  updateDiaryTime: async (time: string): Promise<{ diaryGenerationTime: string; message: string }> => {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from('users')
      .update({ diary_generation_time: time })
      .eq('id', userId);

    if (error) {
      throw new ApiError('설정 변경에 실패했습니다.', 500, error);
    }

    return {
      diaryGenerationTime: time,
      message: '일기 생성 시간이 변경되었습니다.',
    };
  },

  // 알림 설정 변경
  updateNotifications: async (anonymous: boolean): Promise<{ settings: { notifications: { anonymous: boolean } } }> => {
    const userId = await getCurrentUserId();

    await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        notification_anonymous: anonymous,
      }, {
        onConflict: 'user_id',
      });

    return {
      settings: {
        notifications: { anonymous },
      },
    };
  },

  // 테마 설정 변경
  updateTheme: async (darkMode: boolean): Promise<{ theme: { darkMode: boolean } }> => {
    const userId = await getCurrentUserId();

    await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        dark_mode: darkMode,
      }, {
        onConflict: 'user_id',
      });

    return {
      theme: { darkMode },
    };
  },

  // 프로필 수정
  updateProfile: async (nickname: string, password?: string, currentPassword?: string): Promise<{ nickname: string; updatedAt: string }> => {
    const userId = await getCurrentUserId();

    const updateData: any = { nickname };
    if (password) {
      updateData.password_hash = password; // Should be properly hashed
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('nickname, updated_at')
      .maybeSingle();

    if (error) {
      throw new ApiError('프로필 수정에 실패했습니다.', 500, error);
    }

    return {
      nickname: data.nickname,
      updatedAt: data.updated_at,
    };
  },
};

/**
 * 🔧 사용자 API (온보딩)
 */
export const userApi = {
  // 온보딩 정보 저장
  saveOnboarding: async (data: OnboardingData): Promise<{ message: string; user: { id: string; onboardingCompleted: boolean } }> => {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from('users')
      .update({
        nickname: data.nickname,
        diary_generation_time: data.diaryTime || '21:00:00',
        onboarding_completed: true,
      })
      .eq('id', userId);

    if (error) {
      throw new ApiError('온보딩 저장에 실패했습니다.', 500, error);
    }

    // Save initial Big5 if provided
    if (data.big5Answers && data.big5Answers.length > 0) {
      await big5Api.submitInitial(data.big5Answers);
    }

    return {
      message: '온보딩이 완료되었습니다.',
      user: {
        id: userId,
        onboardingCompleted: true,
      },
    };
  },
};

/**
 * 📊 통계 API
 */
export const statsApi = {
  // 감정 통계
  getEmotions: async (year: number, month: number): Promise<EmotionsResponse> => {
    const userId = await getCurrentUserId();

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data, error } = await supabase
      .from('diaries')
      .select('emotion')
      .eq('user_id', userId)
      .gte('diary_date', startDate)
      .lte('diary_date', endDate);

    if (error) {
      throw new ApiError('감정 통계 조회에 실패했습니다.', 500, error);
    }

    const emotionCounts: Record<string, number> = {
      '행복': 0,
      '슬픔': 0,
      '보통': 0,
      '화남': 0,
      '불안': 0,
    };

    (data || []).forEach(d => {
      if (d.emotion && emotionCounts.hasOwnProperty(d.emotion)) {
        emotionCounts[d.emotion]++;
      }
    });

    return {
      year,
      month,
      emotions: Object.entries(emotionCounts).map(([emotion, count]) => ({
        emotion,
        count,
        percentage: data && data.length > 0 ? Math.round((count / data.length) * 100) : 0,
      })),
      totalDiaries: data?.length || 0,
    };
  },

  // 월별 통계
  getMonthly: async (year: number, month: number): Promise<MonthlyStats> => {
    const userId = await getCurrentUserId();

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const [diariesResult, messagesResult, chatsResult] = await Promise.all([
      supabase
        .from('diaries')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('diary_date', startDate)
        .lte('diary_date', endDate),
      supabase
        .from('anonymous_messages')
        .select('id', { count: 'exact' })
        .eq('receiver_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59'),
      supabase
        .from('chat_messages')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('chat_date', startDate)
        .lte('chat_date', endDate),
    ]);

    return {
      year,
      month,
      diaryCount: diariesResult.count || 0,
      messageCount: messagesResult.count || 0,
      chatCount: chatsResult.count || 0,
    };
  },
};

/**
 * 🧠 메모리 (장기 기억) API
 */
export const memoryApi = {
  // 사용자 메모리 조회
  getMemories: async (limit: number = 20): Promise<Array<{
    id: number;
    category: MemoryCategory;
    content: string;
    importance: number;
    sourceDate: string;
    lastMentioned: string;
    mentionCount: number;
  }>> => {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId)
      .order('importance', { ascending: false })
      .order('last_mentioned', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('메모리 조회 실패:', error);
      return [];
    }

    return (data || []).map(m => ({
      id: m.id,
      category: m.category,
      content: m.content,
      importance: m.importance,
      sourceDate: m.source_date,
      lastMentioned: m.last_mentioned,
      mentionCount: m.mention_count,
    }));
  },

  // 새 메모리 저장
  saveMemory: async (memory: {
    category: MemoryCategory;
    content: string;
    importance: number;
  }): Promise<{ id: number } | null> => {
    const userId = await getCurrentUserId();
    const today = new Date().toISOString().split('T')[0];

    // 중복 체크 - 비슷한 내용이 있는지 확인
    const { data: existing } = await supabase
      .from('user_memories')
      .select('id, content')
      .eq('user_id', userId)
      .ilike('content', `%${memory.content.substring(0, 20)}%`)
      .limit(1);

    if (existing && existing.length > 0) {
      // 이미 비슷한 메모리가 있으면 업데이트
      await supabase
        .from('user_memories')
        .update({
          last_mentioned: today,
          mention_count: supabase.rpc('increment', { row_id: existing[0].id }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id);
      return { id: existing[0].id };
    }

    // 새 메모리 저장
    const { data, error } = await supabase
      .from('user_memories')
      .insert({
        user_id: userId,
        category: memory.category,
        content: memory.content,
        importance: memory.importance,
        source_date: today,
        last_mentioned: today,
        mention_count: 1,
      })
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('메모리 저장 실패:', error);
      return null;
    }

    return data;
  },

  // 메모리 삭제
  deleteMemory: async (memoryId: number): Promise<boolean> => {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from('user_memories')
      .delete()
      .eq('id', memoryId)
      .eq('user_id', userId);

    return !error;
  },

  // 대화에서 메모리 추출 및 저장
  extractAndSaveMemories: async (messages: Array<{ userMessage: string; aiResponse: string }>): Promise<number> => {
    try {
      const extracted = await extractMemoriesFromChat(messages);

      if (extracted.length === 0) {
        return 0;
      }

      let savedCount = 0;
      for (const memory of extracted) {
        const result = await memoryApi.saveMemory({
          category: memory.category,
          content: memory.content,
          importance: memory.importance,
        });
        if (result) savedCount++;
      }

      return savedCount;
    } catch (error) {
      console.error('메모리 추출 및 저장 실패:', error);
      return 0;
    }
  },

  // 최근 대화 요약 조회
  getRecentSummaries: async (days: number = 7): Promise<Array<{
    date: string;
    summary: string;
    keyTopics: string[];
    emotionTrend: string;
  }>> => {
    const userId = await getCurrentUserId();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('chat_summaries')
      .select('*')
      .eq('user_id', userId)
      .gte('summary_date', startDateStr)
      .order('summary_date', { ascending: false });

    if (error) {
      console.error('요약 조회 실패:', error);
      return [];
    }

    return (data || []).map(s => ({
      date: s.summary_date,
      summary: s.summary,
      keyTopics: s.key_topics || [],
      emotionTrend: s.emotion_trend || '보통',
    }));
  },

  // 하루 대화 요약 저장
  saveDailySummary: async (date: string, messages: Array<{ userMessage: string; aiResponse: string }>): Promise<boolean> => {
    try {
      const userId = await getCurrentUserId();

      // 요약 생성
      const summaryData = await generateDailySummary(messages);

      // 기존 요약이 있는지 확인
      const { data: existing } = await supabase
        .from('chat_summaries')
        .select('id')
        .eq('user_id', userId)
        .eq('summary_date', date)
        .maybeSingle();

      if (existing) {
        // 업데이트
        await supabase
          .from('chat_summaries')
          .update({
            summary: summaryData.summary,
            key_topics: summaryData.keyTopics,
            emotion_trend: summaryData.emotionTrend,
          })
          .eq('id', existing.id);
      } else {
        // 새로 저장
        await supabase
          .from('chat_summaries')
          .insert({
            user_id: userId,
            summary_date: date,
            summary: summaryData.summary,
            key_topics: summaryData.keyTopics,
            emotion_trend: summaryData.emotionTrend,
          });
      }

      return true;
    } catch (error) {
      console.error('요약 저장 실패:', error);
      return false;
    }
  },

  // 채팅용 메모리 컨텍스트 가져오기
  getMemoryContext: async (): Promise<{
    memories: Array<{ category: string; content: string }>;
    recentSummaries: Array<{ date: string; summary: string }>;
  }> => {
    const [memories, summaries] = await Promise.all([
      memoryApi.getMemories(15), // 상위 15개 메모리
      memoryApi.getRecentSummaries(7), // 최근 7일 요약
    ]);

    return {
      memories: memories.map(m => ({ category: m.category, content: m.content })),
      recentSummaries: summaries.map(s => ({ date: s.date, summary: s.summary })),
    };
  },
};

/**
 * 📊 연구용 데이터 API
 */
export const researchApi = {
  // 인구통계 정보 저장
  saveDemographics: async (data: {
    ageGroup: string;
    gender: string;
    livingType: string;
    occupation?: string;
    purpose?: string;
  }): Promise<{ message: string }> => {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from('user_demographics')
      .upsert({
        user_id: userId,
        age_group: data.ageGroup,
        gender: data.gender,
        living_type: data.livingType,
        occupation: data.occupation,
        purpose: data.purpose,
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      throw new ApiError('인구통계 저장에 실패했습니다.', 500, error);
    }

    return { message: '인구통계 정보가 저장되었습니다.' };
  },

  // 인구통계 조회
  getDemographics: async (): Promise<{
    ageGroup: string | null;
    gender: string | null;
    livingType: string | null;
    occupation: string | null;
    purpose: string | null;
  } | null> => {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from('user_demographics')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      ageGroup: data.age_group,
      gender: data.gender,
      livingType: data.living_type,
      occupation: data.occupation,
      purpose: data.purpose,
    };
  },

  // 대화 심리 분석 저장 (하루 종료 시 자동 호출)
  saveConversationAnalysis: async (date?: string): Promise<{
    lonelinessScore: number;
    wellbeingScore: number;
    saved: boolean;
  }> => {
    const userId = await getCurrentUserId();
    const analysisDate = date || formatDate(new Date());

    // 해당 날짜의 대화 조회
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('user_message, ai_response')
      .eq('user_id', userId)
      .eq('chat_date', analysisDate)
      .order('created_at', { ascending: true });

    if (msgError || !messages || messages.length === 0) {
      return { lonelinessScore: 50, wellbeingScore: 50, saved: false };
    }

    // Gemini로 심리 분석
    const analysis = await analyzeConversationPsychology(
      messages.map(m => ({ userMessage: m.user_message, aiResponse: m.ai_response }))
    );

    // 평균 메시지 길이 계산
    const avgLength = messages.reduce((sum, m) => sum + m.user_message.length, 0) / messages.length;

    // DB에 저장
    const { error: saveError } = await supabase
      .from('conversation_analysis')
      .upsert({
        user_id: userId,
        analysis_date: analysisDate,
        loneliness_score: analysis.lonelinessScore,
        wellbeing_score: analysis.wellbeingScore,
        emotion_distribution: analysis.emotionDistribution,
        topic_keywords: analysis.topicKeywords,
        message_count: messages.length,
        avg_message_length: avgLength,
        analysis_summary: analysis.analysisSummary,
      }, {
        onConflict: 'user_id,analysis_date',
      });

    if (saveError) {
      console.error('Analysis save error:', saveError);
      return { lonelinessScore: analysis.lonelinessScore, wellbeingScore: analysis.wellbeingScore, saved: false };
    }

    return {
      lonelinessScore: analysis.lonelinessScore,
      wellbeingScore: analysis.wellbeingScore,
      saved: true,
    };
  },

  // 사용자 심리 변화 추이 조회
  getPsychologicalHistory: async (days: number = 30): Promise<Array<{
    date: string;
    lonelinessScore: number;
    wellbeingScore: number;
    messageCount: number;
  }>> => {
    const userId = await getCurrentUserId();
    const startDate = formatDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

    const { data, error } = await supabase
      .from('conversation_analysis')
      .select('analysis_date, loneliness_score, wellbeing_score, message_count')
      .eq('user_id', userId)
      .gte('analysis_date', startDate)
      .order('analysis_date', { ascending: true });

    if (error) {
      throw new ApiError('심리 변화 조회에 실패했습니다.', 500, error);
    }

    return (data || []).map(d => ({
      date: d.analysis_date,
      lonelinessScore: Number(d.loneliness_score),
      wellbeingScore: Number(d.wellbeing_score),
      messageCount: d.message_count,
    }));
  },

  // 연구 동의 저장
  saveResearchConsent: async (consent: {
    dataCollection: boolean;
    researchUse: boolean;
    anonymizedSharing: boolean;
  }): Promise<{ message: string }> => {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from('research_consent')
      .upsert({
        user_id: userId,
        consent_data_collection: consent.dataCollection,
        consent_research_use: consent.researchUse,
        consent_anonymized_sharing: consent.anonymizedSharing,
        consented_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      throw new ApiError('동의 저장에 실패했습니다.', 500, error);
    }

    return { message: '연구 동의가 저장되었습니다.' };
  },

  // 사용 지표 업데이트 (세션 종료 시)
  updateEngagementMetrics: async (data: {
    sessionDuration?: number;
    messageCount?: number;
  }): Promise<void> => {
    const userId = await getCurrentUserId();
    const today = formatDate(new Date());

    // 기존 데이터 조회
    const { data: existing } = await supabase
      .from('engagement_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('metric_date', today)
      .maybeSingle();

    const updateData: any = {
      user_id: userId,
      metric_date: today,
      session_count: (existing?.session_count || 0) + 1,
    };

    if (data.sessionDuration) {
      updateData.total_session_duration_minutes =
        (existing?.total_session_duration_minutes || 0) + Math.round(data.sessionDuration / 60);
    }

    if (data.messageCount) {
      updateData.chat_message_count =
        (existing?.chat_message_count || 0) + data.messageCount;
    }

    // 현재 시간 기록
    updateData.peak_usage_hour = new Date().getHours();

    await supabase
      .from('engagement_metrics')
      .upsert(updateData, {
        onConflict: 'user_id,metric_date',
      });
  },
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
  memory: memoryApi, // 장기 기억 API
  research: researchApi, // 연구용 API
};

export default api;

// User 타입 임포트를 위한 인터페이스
interface User {
  id: number;
  nickname: string;
  profileImage?: string;
  createdAt: string;
}
