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

// Auth helpers
export const signInWithKakao = async () => {
  // 현재 앱 URL을 기반으로 리다이렉트 URL 설정 (OAuth 완료 후 돌아올 곳)
  // 루트 페이지로 리다이렉트하면 LoginPage에서 세션 감지 후 적절한 페이지로 이동
  const redirectUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://haruon.vercel.app';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: redirectUrl,
    },
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
