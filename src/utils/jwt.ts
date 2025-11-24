/**
 * JWT 토큰 파싱 유틸리티
 */

interface JWTPayload {
  sub: string; // 일반적으로 userId
  userId?: number;
  id?: number;
  exp: number;
  iat: number;
  [key: string]: any;
}

/**
 * JWT 토큰을 디코딩하여 payload를 반환
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    // JWT는 "header.payload.signature" 형식
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    // Base64 URL-safe 디코딩
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

/**
 * JWT 토큰에서 userId를 추출
 */
export const getUserIdFromToken = (token: string): number | null => {
  const payload = decodeJWT(token);
  if (!payload) return null;

  // userId 추출 시도 (여러 필드명 시도)
  const userId = payload.userId || payload.id || (payload.sub ? parseInt(payload.sub, 10) : null);

  if (userId && !isNaN(userId as number)) {
    return userId as number;
  }

  return null;
};

/**
 * JWT 토큰 만료 확인
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return now >= payload.exp;
};

/**
 * JWT 토큰의 남은 시간 (초)
 */
export const getTokenRemainingTime = (token: string): number => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return 0;

  const now = Math.floor(Date.now() / 1000);
  const remaining = payload.exp - now;
  return Math.max(0, remaining);
};
