/**
 * Supabase Client Configuration
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'catus_auth_token',
  },
});

// 웹 도메인 (Vercel 배포 URL)
const WEB_URL = 'https://haruon-original.vercel.app';

// Auth helpers

/**
 * 웹용 카카오 로그인 (Supabase OAuth)
 * - 웹에서는 현재 도메인으로 리다이렉트
 */
export const signInWithKakao = async () => {
  const redirectUrl = typeof window !== 'undefined' && !window.location.origin.includes('localhost')
    ? window.location.origin
    : WEB_URL;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: redirectUrl,
    },
  });
  return { data, error };
};

/**
 * 모바일 앱용 카카오 OAuth URL 생성
 * - 앱에서는 웹 콜백 페이지로 리다이렉트 후, 커스텀 스킴으로 앱 복귀
 */
export const getKakaoOAuthUrlForMobile = async (): Promise<{ url: string | null; error: any }> => {
  // 모바일용 콜백 URL (웹 페이지에서 앱으로 리다이렉트)
  const mobileCallbackUrl = `${WEB_URL}/auth/kakao/mobile-callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: mobileCallbackUrl,
      skipBrowserRedirect: true, // 브라우저 리다이렉트 안하고 URL만 반환
    },
  });

  return { url: data?.url || null, error };
};

/**
 * 모바일 앱에서 Supabase 세션 설정 (토큰으로 직접 로그인)
 */
export const setSessionFromTokens = async (accessToken: string, refreshToken: string) => {
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return { data, error };
};

// Email/Password Sign Up
export const signUpWithEmail = async (email: string, password: string, nickname?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: nickname || email.split('@')[0],
      },
    },
  });
  return { data, error };
};

// Email/Password Sign In
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

// ============================================
// Custom Username/Password Auth (Supabase Auth 우회)
// ============================================

interface CustomAuthResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    username: string;
    nickname: string;
    profileImage?: string;
    onboardingCompleted: boolean;
  };
}

// 커스텀 회원가입 (RPC 함수 호출)
export const customSignUp = async (
  username: string,
  password: string,
  nickname?: string
): Promise<CustomAuthResult> => {
  try {
    const { data, error } = await supabase.rpc('custom_signup', {
      p_username: username,
      p_password: password,
      p_nickname: nickname || null,
    });

    if (error) {
      console.error('Custom signup RPC error:', error);
      return { success: false, error: error.message };
    }

    return data as CustomAuthResult;
  } catch (err: any) {
    console.error('Custom signup error:', err);
    return { success: false, error: '회원가입 중 오류가 발생했습니다.' };
  }
};

// 커스텀 로그인 (RPC 함수 호출)
export const customLogin = async (
  username: string,
  password: string
): Promise<CustomAuthResult> => {
  try {
    const { data, error } = await supabase.rpc('custom_login', {
      p_username: username,
      p_password: password,
    });

    if (error) {
      console.error('Custom login RPC error:', error);
      return { success: false, error: error.message };
    }

    return data as CustomAuthResult;
  } catch (err: any) {
    console.error('Custom login error:', err);
    return { success: false, error: '로그인 중 오류가 발생했습니다.' };
  }
};

export default supabase;
