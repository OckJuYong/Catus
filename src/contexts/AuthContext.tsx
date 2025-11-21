/**
 * 인증 컨텍스트
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import type { User } from '../types';
import { getToken, setToken, removeToken, getRefreshToken, setRefreshToken } from '../utils/storage';

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
          // 토큰이 만료되었으면 갱신 시도
          await refreshAccessToken();
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

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

  // 로그인
  const login = (userData: User): void => {
    setUser(userData);
    localStorage.setItem('catus_user', JSON.stringify(userData));
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
  };

  // 사용자 정보 업데이트
  const updateUser = (updates: Partial<User>): void => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('catus_user', JSON.stringify(updatedUser));
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
