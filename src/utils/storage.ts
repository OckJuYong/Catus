/**
 * localStorage 헬퍼 유틸리티
 * JSON 직렬화/역직렬화를 자동으로 처리합니다.
 */

import type { User } from '../types';

const STORAGE_PREFIX = 'catus_';

/**
 * localStorage에 값 저장 (JSON 직렬화)
 */
export const setItem = <T = any>(key: string, value: T): boolean => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, serializedValue);
    return true;
  } catch (error) {
    console.error('localStorage setItem error:', error);
    return false;
  }
};

/**
 * localStorage에서 값 조회 (JSON 파싱)
 */
export const getItem = <T = any>(key: string): T | null => {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return item ? (JSON.parse(item) as T) : null;
  } catch (error) {
    console.error('localStorage getItem error:', error);
    return null;
  }
};

/**
 * localStorage에서 값 삭제
 */
export const removeItem = (key: string): boolean => {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    return true;
  } catch (error) {
    console.error('localStorage removeItem error:', error);
    return false;
  }
};

/**
 * localStorage 전체 삭제 (Catus 관련만)
 */
export const clear = (): boolean => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
    console.error('localStorage clear error:', error);
    return false;
  }
};

/**
 * 토큰 저장 (문자열 그대로 저장)
 */
export const setToken = (token: string): boolean => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}access_token`, token);
    return true;
  } catch (error) {
    console.error('setToken error:', error);
    return false;
  }
};

/**
 * 토큰 조회 (문자열 그대로 반환)
 */
export const getToken = (): string | null => {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}access_token`);
  } catch (error) {
    console.error('getToken error:', error);
    return null;
  }
};

/**
 * 토큰 삭제
 */
export const removeToken = (): boolean => {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}access_token`);
    return true;
  } catch (error) {
    console.error('removeToken error:', error);
    return false;
  }
};

/**
 * Refresh 토큰 저장 (문자열 그대로 저장)
 */
export const setRefreshToken = (token: string): boolean => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}refresh_token`, token);
    return true;
  } catch (error) {
    console.error('setRefreshToken error:', error);
    return false;
  }
};

/**
 * Refresh 토큰 조회 (문자열 그대로 반환)
 */
export const getRefreshToken = (): string | null => {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}refresh_token`);
  } catch (error) {
    console.error('getRefreshToken error:', error);
    return null;
  }
};

/**
 * Refresh 토큰 삭제
 */
export const removeRefreshToken = (): boolean => {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}refresh_token`);
    return true;
  } catch (error) {
    console.error('removeRefreshToken error:', error);
    return false;
  }
};

/**
 * 사용자 정보 저장
 */
export const setUser = (user: User): boolean => {
  return setItem('user', user);
};

/**
 * 사용자 정보 조회
 */
export const getUser = (): User | null => {
  return getItem<User>('user');
};

/**
 * 사용자 정보 삭제
 */
export const removeUser = (): boolean => {
  return removeItem('user');
};

/**
 * 모든 인증 관련 데이터 삭제
 */
export const clearAuth = (): void => {
  removeToken();
  removeRefreshToken();
  removeUser();
};

/**
 * JWT 토큰 디코딩 (payload만 추출, 검증 없음)
 */
export const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
};

/**
 * 토큰 만료 시간 확인 (밀리초 단위)
 */
export const getTokenExpiration = (token: string): number | null => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;

  // JWT exp는 초 단위이므로 밀리초로 변환
  return decoded.exp * 1000;
};

/**
 * 토큰이 만료되었는지 확인
 */
export const isTokenExpired = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;

  return Date.now() >= expiration;
};

/**
 * 토큰이 곧 만료될 예정인지 확인 (기본 5분 전)
 */
export const isTokenExpiringSoon = (token: string, thresholdMinutes: number = 5): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;

  const threshold = thresholdMinutes * 60 * 1000; // 분을 밀리초로 변환
  return Date.now() >= (expiration - threshold);
};
