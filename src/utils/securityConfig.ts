/**
 * Security Configuration
 * 프론트엔드 보안 설정 및 검증
 */

import { logger, reportCSPViolation } from './logger';

/**
 * 환경변수 검증
 * 민감한 정보가 클라이언트에 노출되지 않도록 검증
 */
export const validateEnvironmentVariables = (): void => {
  const requiredEnvVars = [
    'VITE_API_BASE_URL',
    'VITE_KAKAO_REST_API_KEY'
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    logger.error('❌ Missing required environment variables:', missingVars);
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }

  // 민감한 키가 노출되지 않았는지 확인
  const sensitivePatterns = [
    /SECRET/i,
    /PRIVATE/i,
    /PASSWORD/i,
    /JWT_SECRET/i,
    /DATABASE/i
  ];

  Object.keys(import.meta.env).forEach((key) => {
    sensitivePatterns.forEach((pattern) => {
      if (pattern.test(key)) {
        logger.error(`❌ Sensitive environment variable detected in client: ${key}`);
        throw new Error(`Sensitive variable ${key} should not be exposed to client`);
      }
    });
  });

  logger.log('✅ Environment variables validated successfully');
};

/**
 * CSP (Content Security Policy) 위반 리포팅
 */
export const setupCSPReporting = (): void => {
  if (typeof document !== 'undefined') {
    document.addEventListener('securitypolicyviolation', (event) => {
      reportCSPViolation(event);
    });
  }
};

/**
 * XSS 공격 패턴 감지
 */
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick, onerror 등
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /eval\(/gi,
  /expression\(/gi
];

/**
 * 입력값에서 XSS 공격 패턴 감지
 */
export const detectXSSPattern = (input: string): boolean => {
  return XSS_PATTERNS.some((pattern) => pattern.test(input));
};

/**
 * SQL Injection 패턴 감지 (프론트엔드 방어선)
 */
const SQL_INJECTION_PATTERNS = [
  /(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\s/gi,
  /--/g,
  /;/g,
  /\/\*/g,
  /\*\//g,
  /xp_/gi,
  /sp_/gi
];

/**
 * 입력값에서 SQL Injection 패턴 감지
 */
export const detectSQLInjection = (input: string): boolean => {
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
};

/**
 * 안전하지 않은 URL 감지
 */
export const isUnsafeURL = (url: string): boolean => {
  try {
    const parsed = new URL(url);

    // javascript: 프로토콜 차단
    if (parsed.protocol === 'javascript:') {
      return true;
    }

    // data: URI 중 base64 인코딩된 스크립트 차단
    if (parsed.protocol === 'data:') {
      const dataContent = url.split(',')[1] || '';
      if (detectXSSPattern(dataContent)) {
        return true;
      }
    }

    return false;
  } catch {
    // Invalid URL
    return true;
  }
};

/**
 * 클릭재킹 방어 검증
 */
export const validateFrameAncestors = (): void => {
  if (typeof window !== 'undefined' && window.self !== window.top) {
    logger.error('🚨 Clickjacking attempt detected!');
    // 프레임 내에서 실행되는 것을 감지하면 경고
    document.body.innerHTML = '<h1>This application cannot be embedded in an iframe</h1>';
  }
};

/**
 * HTTPS 강제 검증
 */
export const enforceHTTPS = (): void => {
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'http:' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    logger.log('🔒 Redirecting to HTTPS...');
    window.location.href = window.location.href.replace('http:', 'https:');
  }
};

/**
 * 보안 헤더 검증 (개발 환경)
 */
export const validateSecurityHeaders = async (): Promise<void> => {
  if (import.meta.env.VITE_ENABLE_DEBUG !== 'true') {
    return;
  }

  try {
    const response = await fetch(window.location.href, { method: 'HEAD' });
    const headers = response.headers;

    const securityHeaders = [
      'Content-Security-Policy',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
      'Strict-Transport-Security'
    ];

    const missingHeaders = securityHeaders.filter((header) => !headers.has(header));

    if (missingHeaders.length > 0) {
      logger.warn('⚠️ Missing security headers:', missingHeaders);
    } else {
      logger.log('✅ All security headers present');
    }
  } catch (error) {
    logger.error('Failed to validate security headers:', error);
  }
};

/**
 * 보안 초기화 (앱 시작 시 호출)
 */
export const initializeSecurity = (): void => {
  try {
    validateEnvironmentVariables();
    setupCSPReporting();
    validateFrameAncestors();
    enforceHTTPS();

    if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
      validateSecurityHeaders();
    }

    logger.log('🔒 Security initialization complete');
  } catch (error) {
    logger.error('❌ Security initialization failed:', error);
    throw error;
  }
};
