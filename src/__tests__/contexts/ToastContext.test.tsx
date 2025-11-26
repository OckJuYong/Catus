/**
 * ToastContext 테스트
 */

import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../../contexts/ToastContext';

// 테스트용 Consumer 컴포넌트
const TestConsumer = () => {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast('정보 메시지')}>Info Toast</button>
      <button onClick={() => showToast('성공 메시지', 'success')}>Success Toast</button>
      <button onClick={() => showToast('에러 메시지', 'error')}>Error Toast</button>
      <button onClick={() => showToast('경고 메시지', 'warning')}>Warning Toast</button>
    </div>
  );
};

describe('ToastContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('ToastProvider', () => {
    it('children을 올바르게 렌더링한다', () => {
      render(
        <ToastProvider>
          <div>테스트 컴포넌트</div>
        </ToastProvider>
      );

      expect(screen.getByText('테스트 컴포넌트')).toBeInTheDocument();
    });
  });

  describe('useToast', () => {
    it('Provider 외부에서 사용하면 에러를 던진다', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useToast must be used within ToastProvider');

      consoleError.mockRestore();
    });
  });

  describe('showToast', () => {
    it('info 타입 토스트를 표시한다', async () => {
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      );

      await userEvent.click(screen.getByText('Info Toast'));

      expect(screen.getByText('정보 메시지')).toBeInTheDocument();
    });

    it('success 타입 토스트를 표시한다', async () => {
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      );

      await userEvent.click(screen.getByText('Success Toast'));

      expect(screen.getByText('성공 메시지')).toBeInTheDocument();
    });

    it('error 타입 토스트를 표시한다', async () => {
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      );

      await userEvent.click(screen.getByText('Error Toast'));

      expect(screen.getByText('에러 메시지')).toBeInTheDocument();
    });

    it('warning 타입 토스트를 표시한다', async () => {
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      );

      await userEvent.click(screen.getByText('Warning Toast'));

      expect(screen.getByText('경고 메시지')).toBeInTheDocument();
    });

    it('3초 후 토스트가 자동으로 사라진다', async () => {
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      );

      await userEvent.click(screen.getByText('Info Toast'));

      expect(screen.getByText('정보 메시지')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.queryByText('정보 메시지')).not.toBeInTheDocument();
      });
    });

    it('여러 토스트를 동시에 표시할 수 있다', async () => {
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      );

      await userEvent.click(screen.getByText('Info Toast'));
      await userEvent.click(screen.getByText('Success Toast'));
      await userEvent.click(screen.getByText('Error Toast'));

      expect(screen.getByText('정보 메시지')).toBeInTheDocument();
      expect(screen.getByText('성공 메시지')).toBeInTheDocument();
      expect(screen.getByText('에러 메시지')).toBeInTheDocument();
    });

    it('토스트 클릭 시 즉시 제거된다', async () => {
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      );

      await userEvent.click(screen.getByText('Info Toast'));

      const toast = screen.getByText('정보 메시지');
      expect(toast).toBeInTheDocument();

      await userEvent.click(toast);

      await waitFor(() => {
        expect(screen.queryByText('정보 메시지')).not.toBeInTheDocument();
      });
    });
  });

  describe('토스트 스타일 테스트', () => {
    it('success 토스트에 올바른 배경색이 적용된다', async () => {
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      );

      await userEvent.click(screen.getByText('Success Toast'));

      const toast = screen.getByText('성공 메시지');
      expect(toast).toHaveStyle({ backgroundColor: '#5E7057' });
    });

    it('error 토스트에 올바른 배경색이 적용된다', async () => {
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      );

      await userEvent.click(screen.getByText('Error Toast'));

      const toast = screen.getByText('에러 메시지');
      expect(toast).toHaveStyle({ backgroundColor: '#e57373' });
    });

    it('warning 토스트에 올바른 배경색이 적용된다', async () => {
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      );

      await userEvent.click(screen.getByText('Warning Toast'));

      const toast = screen.getByText('경고 메시지');
      expect(toast).toHaveStyle({ backgroundColor: '#ffb74d' });
    });

    it('info 토스트에 올바른 배경색이 적용된다', async () => {
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      );

      await userEvent.click(screen.getByText('Info Toast'));

      const toast = screen.getByText('정보 메시지');
      expect(toast).toHaveStyle({ backgroundColor: '#333' });
    });
  });

  describe('토스트 컨테이너 테스트', () => {
    it('토스트 컨테이너가 고정 위치에 있다', async () => {
      const { container } = render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      );

      await userEvent.click(screen.getByText('Info Toast'));

      const toastContainer = container.querySelector('[style*="position: fixed"]');
      expect(toastContainer).toBeInTheDocument();
    });

    it('토스트 컨테이너가 화면 상단 중앙에 위치한다', async () => {
      const { container } = render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      );

      await userEvent.click(screen.getByText('Info Toast'));

      const toastContainer = container.querySelector('[style*="top: 20"]');
      expect(toastContainer).toBeInTheDocument();
    });
  });

  describe('토스트 고유 ID 테스트', () => {
    it('각 토스트는 고유한 ID를 가진다', async () => {
      render(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      );

      // 같은 버튼을 여러 번 클릭
      await userEvent.click(screen.getByText('Info Toast'));
      await userEvent.click(screen.getByText('Info Toast'));

      // 같은 메시지지만 별도의 토스트로 표시됨
      const toasts = screen.getAllByText('정보 메시지');
      expect(toasts).toHaveLength(2);
    });
  });
});
