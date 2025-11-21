/**
 * Input Validation & Sanitization 유틸리티
 */

/**
 * 닉네임 검증
 * - 2-10자
 * - 한글, 영문, 숫자만 허용
 * - 특수문자 금지
 */
export const validateNickname = (nickname: string): { valid: boolean; error?: string } => {
  if (!nickname || nickname.trim().length === 0) {
    return { valid: false, error: '닉네임을 입력해주세요.' };
  }

  const trimmed = nickname.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: '닉네임은 최소 2자 이상이어야 합니다.' };
  }

  if (trimmed.length > 10) {
    return { valid: false, error: '닉네임은 최대 10자까지 가능합니다.' };
  }

  // 한글, 영문, 숫자만 허용
  const validPattern = /^[가-힣a-zA-Z0-9]+$/;
  if (!validPattern.test(trimmed)) {
    return { valid: false, error: '닉네임은 한글, 영문, 숫자만 사용 가능합니다.' };
  }

  return { valid: true };
};

/**
 * 이메일 검증
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: '이메일을 입력해주세요.' };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return { valid: false, error: '올바른 이메일 형식이 아닙니다.' };
  }

  return { valid: true };
};

/**
 * 텍스트 길이 검증
 */
export const validateTextLength = (
  text: string,
  minLength: number,
  maxLength: number,
  fieldName: string = '입력'
): { valid: boolean; error?: string } => {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: `${fieldName}을(를) 입력해주세요.` };
  }

  const trimmed = text.trim();

  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName}은(는) 최소 ${minLength}자 이상이어야 합니다.` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName}은(는) 최대 ${maxLength}자까지 가능합니다.` };
  }

  return { valid: true };
};

/**
 * XSS 방지를 위한 HTML 이스케이프
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
};

/**
 * 입력 텍스트 정제 (trim + 중복 공백 제거)
 */
export const sanitizeText = (text: string): string => {
  return text.trim().replace(/\s+/g, ' ');
};

/**
 * 위험한 스크립트 태그 제거
 */
export const removeScriptTags = (text: string): string => {
  return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

/**
 * URL 검증 (보안 강화)
 */
export const validateUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: 'URL을 입력해주세요.' };
  }

  try {
    const parsedUrl = new URL(url);

    // javascript: 프로토콜 차단
    if (parsedUrl.protocol === 'javascript:') {
      return { valid: false, error: 'javascript: 프로토콜은 허용되지 않습니다.' };
    }

    // data: URI 중 위험한 패턴 차단
    if (parsedUrl.protocol === 'data:') {
      const dataContent = url.split(',')[1] || '';
      if (/<script|javascript|onerror|onload/gi.test(dataContent)) {
        return { valid: false, error: '위험한 데이터 URI입니다.' };
      }
    }

    // file: 프로토콜 차단
    if (parsedUrl.protocol === 'file:') {
      return { valid: false, error: 'file: 프로토콜은 허용되지 않습니다.' };
    }

    // HTTPS만 허용 (HTTP는 개발 환경에서만)
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return { valid: false, error: 'HTTP 또는 HTTPS URL만 허용됩니다.' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: '올바른 URL 형식이 아닙니다.' };
  }
};

/**
 * 숫자 범위 검증
 */
export const validateNumberRange = (
  value: number,
  min: number,
  max: number,
  fieldName: string = '값'
): { valid: boolean; error?: string } => {
  if (isNaN(value)) {
    return { valid: false, error: `${fieldName}은(는) 숫자여야 합니다.` };
  }

  if (value < min) {
    return { valid: false, error: `${fieldName}은(는) ${min} 이상이어야 합니다.` };
  }

  if (value > max) {
    return { valid: false, error: `${fieldName}은(는) ${max} 이하여야 합니다.` };
  }

  return { valid: true };
};

/**
 * 빈 문자열 또는 null/undefined 체크
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return false;
};

/**
 * 안전한 문자열 변환 (null/undefined → 빈 문자열)
 */
export const safeString = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
};
