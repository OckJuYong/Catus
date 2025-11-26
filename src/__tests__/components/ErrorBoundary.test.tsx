/**
 * ErrorBoundary 컴포넌트 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../../components/ErrorBoundary';

// Mock errorHandler
jest.mock('../../utils/errorHandler', () => ({
  logError: jest.fn(),
}));

// 에러를 발생시키는 컴포넌트
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>정상 렌더링</div>;
};

// 콘솔 에러 억제
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('렌더링 테스트', () => {
    it('에러가 없을 때 자식 컴포넌트를 정상 렌더링한다', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('정상 렌더링')).toBeInTheDocument();
    });

    it('에러 발생 시 기본 에러 UI를 표시한다', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();
      expect(screen.getByText(/예상치 못한 오류가 발생했습니다/)).toBeInTheDocument();
      expect(screen.getByText('다시 시도')).toBeInTheDocument();
      expect(screen.getByText('홈으로 이동')).toBeInTheDocument();
    });

    it('커스텀 fallback이 제공되면 해당 UI를 표시한다', () => {
      const CustomFallback = ({ error, resetError }: { error: Error | null; resetError: () => void }) => (
        <div>
          <p>커스텀 에러 UI</p>
          <p>{error?.message}</p>
          <button onClick={resetError}>리셋</button>
        </div>
      );

      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('커스텀 에러 UI')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
      expect(screen.getByText('리셋')).toBeInTheDocument();
    });
  });

  describe('사용자 상호작용 테스트', () => {
    it('"다시 시도" 버튼 클릭 시 에러 상태가 리셋된다', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();

      // 다시 시도 버튼 클릭
      fireEvent.click(screen.getByText('다시 시도'));

      // 에러 상태가 리셋되어 자식을 다시 렌더링 시도
      // (실제로는 같은 에러 컴포넌트가 있어서 다시 에러가 발생하지만, 상태 리셋은 확인됨)
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('정상 렌더링')).toBeInTheDocument();
    });

    it('"홈으로 이동" 버튼 클릭 시 홈으로 이동한다', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('홈으로 이동'));

      expect(window.location.href).toBe('/');
    });

    it('커스텀 fallback의 resetError 호출 시 에러 상태가 리셋된다', () => {
      const CustomFallback = ({ resetError }: { error: Error | null; resetError: () => void }) => (
        <button onClick={resetError}>커스텀 리셋</button>
      );

      const { rerender } = render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('커스텀 리셋'));

      rerender(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('정상 렌더링')).toBeInTheDocument();
    });
  });

  describe('에러 로깅 테스트', () => {
    it('에러 발생 시 logError가 호출된다', () => {
      const { logError } = require('../../utils/errorHandler');

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          errorBoundary: true,
        })
      );
    });

    it('window.showToast가 정의되어 있으면 호출된다', () => {
      const mockShowToast = jest.fn();
      (window as any).showToast = mockShowToast;

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(mockShowToast).toHaveBeenCalledWith('예상치 못한 오류가 발생했습니다.', 'error');
    });
  });

  describe('resetOnError prop 테스트', () => {
    it('resetOnError가 true이면 다시 시도 시 페이지가 새로고침된다', () => {
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { ...window.location, reload: mockReload },
        writable: true,
      });

      render(
        <ErrorBoundary resetOnError={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('다시 시도'));

      expect(mockReload).toHaveBeenCalled();
    });
  });
});
