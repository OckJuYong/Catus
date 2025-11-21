/**
 * 에러 핸들링 유틸리티
 */

import { ApiError } from './api';

/** 에러 분류 타입 */
type ErrorType = 'network' | 'auth' | 'permission' | 'server' | 'client' | 'unknown';

/** 에러 분류 결과 */
interface ErrorClassification {
  type: ErrorType;
  message: string;
  retryable: boolean;
}

/** 에러 핸들러 옵션 */
interface ErrorHandlerOptions {
  onError?: (error: unknown, classification: ErrorClassification, context: Record<string, any>) => void;
  showToast?: boolean;
  logToConsole?: boolean;
}

/** 재시도 옵션 */
interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

/**
 * 에러 메시지 추출
 */
export const getErrorMessage = (error: unknown): string => {
  // ApiError 처리
  if (error instanceof ApiError) {
    return error.message;
  }

  // 일반 Error 객체
  if (error instanceof Error) {
    return error.message;
  }

  // 문자열 에러
  if (typeof error === 'string') {
    return error;
  }

  // 알 수 없는 에러
  return '알 수 없는 오류가 발생했습니다.';
};

/**
 * HTTP 상태 코드별 메시지 반환
 */
export const getStatusMessage = (status: number): string => {
  const messages: Record<number, string> = {
    400: '잘못된 요청입니다.',
    401: '인증이 필요합니다.',
    403: '접근 권한이 없습니다.',
    404: '요청한 리소스를 찾을 수 없습니다.',
    408: '요청 시간이 초과되었습니다.',
    429: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
    500: '서버 오류가 발생했습니다.',
    502: '게이트웨이 오류가 발생했습니다.',
    503: '서비스를 일시적으로 사용할 수 없습니다.',
    504: '게이트웨이 시간이 초과되었습니다.',
  };

  return messages[status] || '오류가 발생했습니다.';
};

/**
 * 에러 로깅
 */
export const logError = (error: unknown, context: Record<string, any> = {}): void => {
  if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
    console.error('Error:', {
      message: getErrorMessage(error),
      error,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // TODO: Sentry 등 에러 추적 서비스로 전송
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, { extra: context });
  // }
};

/**
 * 에러 분류
 */
export const classifyError = (error: unknown): ErrorClassification => {
  if (!navigator.onLine) {
    return {
      type: 'network',
      message: '인터넷 연결을 확인해주세요.',
      retryable: true,
    };
  }

  if (error instanceof ApiError) {
    if (error.status === 401) {
      return {
        type: 'auth',
        message: '로그인이 필요합니다.',
        retryable: false,
      };
    }

    if (error.status === 403) {
      return {
        type: 'permission',
        message: '접근 권한이 없습니다.',
        retryable: false,
      };
    }

    if (error.status >= 500) {
      return {
        type: 'server',
        message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        retryable: true,
      };
    }

    return {
      type: 'client',
      message: error.message,
      retryable: false,
    };
  }

  return {
    type: 'unknown',
    message: '알 수 없는 오류가 발생했습니다.',
    retryable: true,
  };
};

/**
 * 재시도 가능 여부 판단
 */
export const isRetryableError = (error: unknown): boolean => {
  const classification = classifyError(error);
  return classification.retryable;
};

/**
 * 에러 핸들러 팩토리
 */
export const createErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const { onError, showToast = true, logToConsole = true } = options;

  return (error: unknown, context: Record<string, any> = {}) => {
    const errorMessage = getErrorMessage(error);
    const classification = classifyError(error);

    // 로깅
    if (logToConsole) {
      logError(error, context);
    }

    // Toast 표시
    if (showToast && window.showToast) {
      window.showToast(errorMessage, 'error');
    }

    // 커스텀 핸들러 호출
    if (onError) {
      onError(error, classification, context);
    }

    return classification;
  };
};

/**
 * Promise 래퍼 (에러 핸들링 자동화)
 */
export const handleAsync = async <T>(
  promise: Promise<T>,
  errorHandler?: (error: unknown) => void
): Promise<[T, null] | [null, unknown]> => {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    }
    return [null, error];
  }
};

/**
 * 폴백 값과 함께 에러 처리
 */
export const withFallback = async <T>(promise: Promise<T>, fallbackValue: T): Promise<T> => {
  try {
    return await promise;
  } catch (error) {
    logError(error, { fallback: true });
    return fallbackValue;
  }
};

/**
 * 재시도 로직
 */
export const retry = async <T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> => {
  const { maxAttempts = 3, delay = 1000, backoff = 2, onRetry } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts && isRetryableError(error)) {
        if (onRetry) {
          onRetry(attempt, error);
        }

        const waitTime = delay * Math.pow(backoff, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        break;
      }
    }
  }

  throw lastError;
};

/**
 * 타임아웃 래퍼
 */
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('요청 시간이 초과되었습니다.')), timeoutMs)
    ),
  ]);
};

/**
 * 디바운스된 에러 핸들러
 */
export const debouncedErrorHandler = (() => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const errorQueue = new Set<string>();

  return (error: unknown, delay: number = 300): void => {
    errorQueue.add(getErrorMessage(error));

    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (errorQueue.size > 0) {
        const messages = Array.from(errorQueue);
        errorQueue.clear();

        if (window.showToast) {
          window.showToast(messages[0]!, 'error');
        }
      }
    }, delay);
  };
})();

// Window 타입 확장
declare global {
  interface Window {
    showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  }
}
