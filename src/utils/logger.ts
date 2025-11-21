/**
 * Production-safe Logger
 * 프로덕션 환경에서는 로그를 출력하지 않거나 외부 서비스로 전송
 */

const isDevelopment = import.meta.env.MODE === 'development';
const isDebugEnabled = import.meta.env.VITE_ENABLE_DEBUG === 'true';

/**
 * 개발 환경에서만 로그 출력
 */
export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment || isDebugEnabled) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment || isDebugEnabled) {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment || isDebugEnabled) {
      console.warn(...args);
    }
  },

  error: (...args: any[]) => {
    if (isDevelopment || isDebugEnabled) {
      console.error(...args);
    }
    // TODO: 프로덕션에서는 Sentry 등으로 전송
    // if (!isDevelopment) {
    //   sendToSentry(args);
    // }
  },

  debug: (...args: any[]) => {
    if (isDebugEnabled) {
      console.debug(...args);
    }
  }
};

/**
 * CSP 위반 리포팅 (프로덕션에서도 필요)
 */
export const reportCSPViolation = (violation: SecurityPolicyViolationEvent) => {
  if (isDevelopment) {
    console.error('🚨 CSP Violation:', {
      blockedURI: violation.blockedURI,
      violatedDirective: violation.violatedDirective,
      originalPolicy: violation.originalPolicy
    });
  }

  // TODO: 프로덕션에서는 백엔드로 전송
  // if (!isDevelopment) {
  //   sendCSPViolationToBackend(violation);
  // }
};
