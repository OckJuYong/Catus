/**
 * 인증 컨텍스트
 * Supabase Auth 기반
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, signInWithKakao, signInWithEmail, signUpWithEmail, signOut, onAuthStateChange, customSignUp, customLogin } from '../lib/supabase';
import type { User } from '../types';
import { setTokenRefreshCallback } from '../utils/api';
import { clearAllChatMessages } from '../utils/indexedDB';

/**
 * Samsung Browser 렌더링 버그 해결을 위한 강제 repaint 함수
 * OAuth 콜백 후 화면이 갱신되지 않는 문제 해결
 */
const forceRepaint = (): void => {
  // 방법 1: transform 트릭으로 GPU 레이어 재계산 유도
  const root = document.getElementById('root');
  if (root) {
    root.style.transform = 'translateZ(0)';
    // requestAnimationFrame을 사용해 다음 프레임에서 리셋
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.style.transform = '';
      });
    });
  }

  // 방법 2: body visibility 토글 (백업)
  document.body.style.opacity = '0.999';
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
  });

  console.log('🔄 [Samsung Browser Fix] forceRepaint 실행됨');
};

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<string | null>;
  refreshUser: () => Promise<void>; // 세션 갱신 후 유저 정보 다시 로드
  signInWithKakao: () => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmailPassword: (email: string, password: string, nickname?: string) => Promise<{ error: string | null }>;
  // 커스텀 인증 (username/password)
  customSignIn: (username: string, password: string) => Promise<{ error: string | null }>;
  customSignUp: (username: string, password: string, nickname?: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Convert Supabase user to app User type
 */
const convertToAppUser = async (supabaseUser: SupabaseUser): Promise<User> => {
  console.log('🔄 convertToAppUser 시작:', supabaseUser.id);

  // 먼저 Supabase 유저 메타데이터로 기본 유저 정보 생성
  const basicUser: User = {
    id: supabaseUser.id,
    nickname: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || '사용자',
    profileImage: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
    email: supabaseUser.email,
    createdAt: new Date().toISOString(),
    onboardingCompleted: false,
  };

  try {
    // Try to get user profile from database (with timeout)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DB query timeout')), 5000)
    );

    const queryPromise = supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    const { data: dbUser, error: selectError } = await Promise.race([queryPromise, timeoutPromise]) as any;

    if (selectError && selectError.code !== 'PGRST116') {
      console.log('⚠️ DB 조회 실패, 기본 유저 정보 사용:', selectError.message);
      return basicUser;
    }

    if (dbUser) {
      console.log('✅ DB에서 유저 정보 로드:', dbUser.nickname);
      return {
        id: dbUser.id,
        nickname: dbUser.nickname,
        profileImage: dbUser.profile_image,
        email: dbUser.email,
        createdAt: dbUser.created_at,
        onboardingCompleted: dbUser.onboarding_completed,
      };
    }

    // Create new user record if not exists
    console.log('📝 새 유저 생성 시도...');
    const newUserData = {
      id: supabaseUser.id,
      nickname: basicUser.nickname,
      email: supabaseUser.email,
      profile_image: basicUser.profileImage,
      kakao_id: supabaseUser.user_metadata?.provider_id ? parseInt(supabaseUser.user_metadata.provider_id) : null,
      onboarding_completed: false,
    };

    const { data: createdUser, error: insertError } = await supabase
      .from('users')
      .upsert(newUserData)
      .select()
      .maybeSingle();

    if (insertError) {
      console.log('⚠️ 유저 생성 실패, 기본 유저 정보 사용:', insertError.message);
      console.log('📱 [DEBUG] INSERT 에러:', insertError.code, insertError.details, insertError.hint);
      // RLS 정책 문제일 가능성 높음
      return basicUser;
    }

    console.log('✅ 새 유저 생성 완료:', createdUser.nickname);
    return {
      id: createdUser.id,
      nickname: createdUser.nickname,
      profileImage: createdUser.profile_image,
      email: createdUser.email,
      createdAt: createdUser.created_at,
      onboardingCompleted: createdUser.onboarding_completed,
    };
  } catch (error: any) {
    console.log('⚠️ DB 작업 타임아웃/에러, 기본 유저 정보 사용:', error.message);
    return basicUser;
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        console.log('🔐 Auth 초기화 시작...');
        console.log('🔗 현재 URL:', window.location.href);
        console.log('🔗 해시:', window.location.hash);

        // URL 해시에 access_token이 있는지 확인 (OAuth 리다이렉트 후)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        // OAuth 에러 체크
        const oauthError = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        console.log('🎫 토큰 존재 여부:', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });
        console.log('🔍 전체 해시:', window.location.hash);

        // 디버깅용 - 배포 후 제거 필요
        if (window.location.hash && window.location.hash.length > 1) {
          console.log('📱 [DEBUG] OAuth 리다이렉트 감지');
          console.log('📱 [DEBUG] accessToken:', accessToken ? '있음' : '없음');
          console.log('📱 [DEBUG] refreshToken:', refreshToken ? '있음' : '없음');
          console.log('📱 [DEBUG] error:', oauthError || '없음');
        }

        if (oauthError) {
          console.error('❌ OAuth 에러:', oauthError, errorDescription);
          alert(`카카오 로그인 에러: ${oauthError}\n${errorDescription || ''}`);
          // URL에서 해시 제거
          window.history.replaceState(null, '', window.location.pathname);
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        if (accessToken && refreshToken) {
          console.log('✅ OAuth 토큰 감지, 세션 설정 중...');

          // 세션 설정
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          // URL에서 해시 제거 (보안) - 세션 설정 후에 제거
          window.history.replaceState(null, '', window.location.pathname);

          if (error) {
            console.error('❌ 세션 설정 실패:', error.message, error);
            alert(`세션 설정 실패: ${error.message}`);
          } else if (data.session?.user) {
            console.log('✅ 세션 설정 성공:', data.session.user.id);
            console.log('👤 유저 메타데이터:', data.session.user.user_metadata);

            if (!isMounted) return;

            setSession(data.session);

            try {
              const appUser = await convertToAppUser(data.session.user);
              console.log('✅ 앱 유저 변환 성공:', appUser);

              if (!isMounted) return;

              setUser(appUser);
              localStorage.setItem('catus_user', JSON.stringify(appUser));
            } catch (userError) {
              console.error('❌ 유저 변환 실패:', userError);
              // 기본 유저 정보로 설정
              const basicUser = {
                id: data.session.user.id,
                nickname: data.session.user.user_metadata?.name || '사용자',
                profileImage: data.session.user.user_metadata?.avatar_url,
                email: data.session.user.email,
                createdAt: new Date().toISOString(),
                onboardingCompleted: false,
              };
              setUser(basicUser);
              localStorage.setItem('catus_user', JSON.stringify(basicUser));
            }

            setIsLoading(false);

            // Samsung Browser 렌더링 버그 해결: OAuth 후 강제 repaint
            setTimeout(() => forceRepaint(), 100);
            setTimeout(() => forceRepaint(), 500);

            return;
          } else {
            console.error('❌ 세션 데이터 없음:', data);
          }
        }

        // Get current session
        console.log('🔍 기존 세션 확인 중...');
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('📋 기존 세션:', currentSession ? '있음' : '없음');

        if (currentSession?.user) {
          if (!isMounted) return;

          setSession(currentSession);
          const appUser = await convertToAppUser(currentSession.user);
          setUser(appUser);
          localStorage.setItem('catus_user', JSON.stringify(appUser));
          console.log('✅ 기존 세션으로 로그인:', appUser.nickname);

          // Samsung Browser 렌더링 버그 해결: 기존 세션 복원 후 강제 repaint
          setTimeout(() => forceRepaint(), 100);
        } else {
          // localStorage에서 user만 있고 session이 없으면 로그아웃 처리
          console.log('⚠️ 세션 없음, localStorage 정리');
          localStorage.removeItem('catus_user');
        }
      } catch (error) {
        console.error('❌ Auth 초기화 에러:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          console.log('🏁 Auth 초기화 완료');
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange(async (event, newSession) => {
      console.log('🔔 Auth state changed:', event, newSession?.user?.id);

      if (event === 'SIGNED_IN' && newSession?.user) {
        console.log('✅ SIGNED_IN 이벤트 수신');
        setSession(newSession);
        const appUser = await convertToAppUser(newSession.user);
        setUser(appUser);
        localStorage.setItem('catus_user', JSON.stringify(appUser));
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 SIGNED_OUT 이벤트 수신');
        setSession(null);
        setUser(null);
        localStorage.removeItem('catus_user');
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        setSession(newSession);
        console.log('🔄 Token refreshed automatically by Supabase');
      } else if (event === 'USER_UPDATED' && newSession?.user) {
        const appUser = await convertToAppUser(newSession.user);
        setUser(appUser);
        localStorage.setItem('catus_user', JSON.stringify(appUser));
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Token refresh (Supabase handles this automatically, but we expose it for compatibility)
  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        console.error('Token refresh failed:', error);
        return null;
      }

      setSession(data.session);
      console.log('✅ Token refreshed successfully');
      return data.session.access_token;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return null;
    }
  };

  // Refresh user state from current session (모바일 딥링크 콜백에서 사용)
  const refreshUser = async (): Promise<void> => {
    try {
      console.log('🔄 유저 정보 갱신 중...');
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (currentSession?.user) {
        setSession(currentSession);
        const appUser = await convertToAppUser(currentSession.user);
        setUser(appUser);
        localStorage.setItem('catus_user', JSON.stringify(appUser));
        console.log('✅ 유저 정보 갱신 완료:', appUser.nickname);
      } else {
        console.log('⚠️ 세션 없음');
      }
    } catch (error) {
      console.error('❌ 유저 정보 갱신 실패:', error);
    }
  };

  // Register token refresh callback for API interceptor
  useEffect(() => {
    setTokenRefreshCallback(refreshAccessToken);

    return () => {
      setTokenRefreshCallback(null);
    };
  }, []);

  // Cross-tab storage synchronization using BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel('catus_auth_channel');

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'AUTH_LOGIN':
          if (payload.user) {
            setUser(payload.user);
          }
          break;
        case 'AUTH_LOGOUT':
          setUser(null);
          setSession(null);
          break;
        case 'AUTH_UPDATE':
          if (payload.user) {
            setUser(payload.user);
          }
          break;
      }
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, []);

  const broadcastAuthChange = (type: string, payload?: any) => {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('catus_auth_channel');
        channel.postMessage({ type, payload });
        channel.close();
      } catch (error) {
        console.error('Failed to broadcast auth change:', error);
      }
    }
  };

  // Login (for compatibility with existing code)
  const login = (userData: User): void => {
    setUser(userData);
    localStorage.setItem('catus_user', JSON.stringify(userData));
    broadcastAuthChange('AUTH_LOGIN', { user: userData });
  };

  // Sign in with Kakao OAuth
  const handleSignInWithKakao = async (): Promise<void> => {
    const { error } = await signInWithKakao();
    if (error) {
      console.error('Kakao login error:', error);
      throw error;
    }
  };

  // Sign in with Email/Password
  const handleSignInWithEmailPassword = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await signInWithEmail(email, password);

      if (error) {
        console.error('Email login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: '이메일 인증이 필요합니다. 메일함을 확인해주세요.' };
        }
        return { error: error.message };
      }

      if (data.session?.user) {
        setSession(data.session);
        const appUser = await convertToAppUser(data.session.user);
        setUser(appUser);
        localStorage.setItem('catus_user', JSON.stringify(appUser));
        console.log('✅ Email login successful:', appUser.nickname);
      }

      return { error: null };
    } catch (err: any) {
      console.error('Email login error:', err);
      return { error: '로그인 중 오류가 발생했습니다.' };
    }
  };

  // Sign up with Email/Password
  const handleSignUpWithEmailPassword = async (email: string, password: string, nickname?: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await signUpWithEmail(email, password, nickname);

      if (error) {
        console.error('Email signup error:', error);
        if (error.message.includes('User already registered')) {
          return { error: '이미 등록된 이메일입니다.' };
        }
        if (error.message.includes('Password should be at least')) {
          return { error: '비밀번호는 최소 6자 이상이어야 합니다.' };
        }
        return { error: error.message };
      }

      // 이메일 확인 비활성화 시 바로 세션 생성됨
      // (Supabase 대시보드 → Authentication → Providers → Email → Confirm email OFF)

      // Auto sign in if no email confirmation required
      if (data.session?.user) {
        setSession(data.session);
        const appUser = await convertToAppUser(data.session.user);
        setUser(appUser);
        localStorage.setItem('catus_user', JSON.stringify(appUser));
        console.log('✅ Email signup successful:', appUser.nickname);
      }

      return { error: null };
    } catch (err: any) {
      console.error('Email signup error:', err);
      return { error: '회원가입 중 오류가 발생했습니다.' };
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear local state
    setUser(null);
    setSession(null);
    localStorage.removeItem('catus_user');
    localStorage.removeItem('catus_login_type'); // 커스텀 인증 정보도 정리

    // Clear IndexedDB chat messages
    try {
      await clearAllChatMessages();
      console.log('✅ IndexedDB chat messages cleared on logout');
    } catch (error) {
      console.error('❌ Failed to clear IndexedDB on logout:', error);
    }

    broadcastAuthChange('AUTH_LOGOUT');
  };

  // Update user info
  const updateUser = (updates: Partial<User>): void => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('catus_user', JSON.stringify(updatedUser));
    broadcastAuthChange('AUTH_UPDATE', { user: updatedUser });
  };

  // Get access token
  const getAccessToken = (): string | null => {
    return session?.access_token || null;
  };

  // ============================================
  // Custom Auth (Username/Password - Supabase Auth 우회)
  // ============================================

  // 커스텀 회원가입
  const handleCustomSignUp = async (username: string, password: string, nickname?: string): Promise<{ error: string | null }> => {
    try {
      const result = await customSignUp(username, password, nickname);

      if (!result.success) {
        return { error: result.error || '회원가입에 실패했습니다.' };
      }

      if (result.user) {
        const appUser: User = {
          id: result.user.id,
          nickname: result.user.nickname,
          profileImage: result.user.profileImage,
          createdAt: new Date().toISOString(),
          onboardingCompleted: result.user.onboardingCompleted,
        };

        setUser(appUser);
        localStorage.setItem('catus_user', JSON.stringify(appUser));
        localStorage.setItem('catus_login_type', 'custom');
        broadcastAuthChange('AUTH_LOGIN', { user: appUser });
        console.log('✅ Custom signup successful:', appUser.nickname);
      }

      return { error: null };
    } catch (err: any) {
      console.error('Custom signup error:', err);
      return { error: '회원가입 중 오류가 발생했습니다.' };
    }
  };

  // 커스텀 로그인
  const handleCustomSignIn = async (username: string, password: string): Promise<{ error: string | null }> => {
    try {
      const result = await customLogin(username, password);

      if (!result.success) {
        return { error: result.error || '로그인에 실패했습니다.' };
      }

      if (result.user) {
        const appUser: User = {
          id: result.user.id,
          nickname: result.user.nickname,
          profileImage: result.user.profileImage,
          createdAt: new Date().toISOString(),
          onboardingCompleted: result.user.onboardingCompleted,
        };

        setUser(appUser);
        localStorage.setItem('catus_user', JSON.stringify(appUser));
        localStorage.setItem('catus_login_type', 'custom');
        broadcastAuthChange('AUTH_LOGIN', { user: appUser });
        console.log('✅ Custom login successful:', appUser.nickname);
      }

      return { error: null };
    } catch (err: any) {
      console.error('Custom login error:', err);
      return { error: '로그인 중 오류가 발생했습니다.' };
    }
  };

  // 커스텀 로그인 사용자도 인증된 것으로 처리
  const isCustomAuth = localStorage.getItem('catus_login_type') === 'custom';
  const isAuthenticatedValue = !!user && (!!session || isCustomAuth);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: isAuthenticatedValue,
    login,
    logout,
    updateUser,
    getAccessToken,
    refreshAccessToken,
    refreshUser,
    signInWithKakao: handleSignInWithKakao,
    signInWithEmailPassword: handleSignInWithEmailPassword,
    signUpWithEmailPassword: handleSignUpWithEmailPassword,
    customSignIn: handleCustomSignIn,
    customSignUp: handleCustomSignUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
