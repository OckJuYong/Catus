/**
 * 인증 컨텍스트
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import type { User } from '../types';
import { getToken, setToken, removeToken, getRefreshToken, setRefreshToken } from '../utils/storage';
import { setTokenRefreshCallback } from '../utils/api';
import { clearAllChatMessages } from '../utils/indexedDB';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<string | null>;
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 자동 로그인: JWT 토큰으로 사용자 정보 복원
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = getToken();
      const storedUserStr = localStorage.getItem('catus_user');

      if (accessToken && storedUserStr) {
        try {
          // 토큰이 유효한지 확인
          const response = await axios.get<User>(
            `${import.meta.env.VITE_API_BASE_URL}/auth/me`,
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          );

          // 서버에서 받은 최신 사용자 정보로 업데이트
          const userData = response.data;
          setUser(userData);
          localStorage.setItem('catus_user', JSON.stringify(userData));
        } catch (error) {
          console.error('Token validation failed:', error);
          // 토큰이 만료되었으면 모든 토큰 제거하고 로그아웃 (무한 루프 방지)
          removeToken();
          localStorage.removeItem('catus_refresh_token');
          localStorage.removeItem('catus_user');
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 초기 마운트 시에만 실행 (refreshAccessToken 의존성 제거로 무한 루프 방지)

  // 액세스 토큰 갱신
  const refreshAccessToken = async (): Promise<string | null> => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      logout();
      return null;
    }

    try {
      const response = await axios.post<{ accessToken: string; user: User }>(
        `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
        { refreshToken }
      );

      const { accessToken, user: userData } = response.data;

      // 새 액세스 토큰 저장
      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('catus_user', JSON.stringify(userData));

      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return null;
    }
  };

  // API 인터셉터에 토큰 갱신 콜백 등록
  useEffect(() => {
    setTokenRefreshCallback(refreshAccessToken);

    // Cleanup: 컴포넌트 언마운트 시 콜백 제거
    return () => {
      setTokenRefreshCallback(null);
    };
  }, []);

  // Cross-tab storage synchronization using BroadcastChannel
  useEffect(() => {
    // Check BroadcastChannel support
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('BroadcastChannel not supported in this browser');
      return;
    }

    const channel = new BroadcastChannel('catus_auth_channel');

    // Listen for auth events from other tabs
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'AUTH_LOGIN':
          // Another tab logged in, sync user data
          if (payload.user) {
            setUser(payload.user);
          }
          break;

        case 'AUTH_LOGOUT':
          // Another tab logged out, clear local state
          setUser(null);
          break;

        case 'AUTH_UPDATE':
          // Another tab updated user data
          if (payload.user) {
            setUser(payload.user);
          }
          break;

        default:
          break;
      }
    };

    channel.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, []);

  // Broadcast auth changes to other tabs
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

  // 로그인
  const login = (userData: User): void => {
    setUser(userData);
    localStorage.setItem('catus_user', JSON.stringify(userData));

    // Broadcast login to other tabs
    broadcastAuthChange('AUTH_LOGIN', { user: userData });
  };

  // 로그아웃
  const logout = async (): Promise<void> => {
    const accessToken = getToken();

    // 백엔드에 로그아웃 알림 (선택사항)
    if (accessToken) {
      try {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }

    // 로컬 상태 초기화
    setUser(null);
    localStorage.removeItem('catus_user');
    removeToken();
    localStorage.removeItem('catus_refresh_token');

    // IndexedDB 채팅 기록 삭제 (개인정보 보호)
    try {
      await clearAllChatMessages();
      console.log('✅ IndexedDB chat messages cleared on logout');
    } catch (error) {
      console.error('❌ Failed to clear IndexedDB on logout:', error);
    }

    // Broadcast logout to other tabs
    broadcastAuthChange('AUTH_LOGOUT');
  };

  // 사용자 정보 업데이트
  const updateUser = (updates: Partial<User>): void => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('catus_user', JSON.stringify(updatedUser));

    // Broadcast update to other tabs
    broadcastAuthChange('AUTH_UPDATE', { user: updatedUser });
  };

  // 액세스 토큰 가져오기 (API 호출 시 사용)
  const getAccessToken = (): string | null => {
    return getToken();
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    getAccessToken,
    refreshAccessToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
