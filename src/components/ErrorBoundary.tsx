/**
 * 에러 바운더리 컴포넌트
 * React 컴포넌트 트리에서 발생하는 에러를 잡아냅니다.
 */

import { Component, ReactNode, ErrorInfo, CSSProperties } from 'react';
import { logError } from '../utils/errorHandler';

interface ErrorBoundaryProps {
  children: ReactNode;
  resetOnError?: boolean;
  fallback?: (props: FallbackProps) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface FallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 에러 로깅
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Toast 알림 (선택사항)
    if (window.showToast) {
      window.showToast('예상치 못한 오류가 발생했습니다.', 'error');
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // 페이지 새로고침 (선택사항)
    if (this.props.resetOnError) {
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 커스텀 에러 UI가 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetError: this.handleReset,
        });
      }

      // 기본 에러 UI
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.icon}>⚠️</div>
            <h2 style={styles.title}>문제가 발생했습니다</h2>
            <p style={styles.message}>
              예상치 못한 오류가 발생했습니다.
              <br />
              잠시 후 다시 시도해주세요.
            </p>

            {import.meta.env.VITE_ENABLE_DEBUG === 'true' && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>에러 상세 정보</summary>
                <pre style={styles.errorText}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div style={styles.actions}>
              <button onClick={this.handleReset} style={styles.button}>
                다시 시도
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                style={{ ...styles.button, ...styles.buttonSecondary }}
              >
                홈으로 이동
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 스타일
const styles: { [key: string]: CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    background: '#f5f5f5',
  },
  content: {
    background: 'white',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#333',
  },
  message: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#666',
    marginBottom: '30px',
  },
  details: {
    marginTop: '20px',
    marginBottom: '20px',
    textAlign: 'left',
  },
  summary: {
    cursor: 'pointer',
    padding: '10px',
    background: '#f5f5f5',
    borderRadius: '4px',
    marginBottom: '10px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  errorText: {
    background: '#f5f5f5',
    padding: '15px',
    borderRadius: '4px',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '200px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    background: '#6BCB77',
    color: 'white',
    fontWeight: 'bold',
    transition: 'background 0.2s',
  },
  buttonSecondary: {
    background: '#e0e0e0',
    color: '#333',
  },
};

export default ErrorBoundary;
