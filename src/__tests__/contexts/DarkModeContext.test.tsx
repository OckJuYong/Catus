/**
 * DarkModeContext 테스트
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { DarkModeProvider, useDarkMode } from '../../contexts/DarkModeContext';

// 테스트용 Consumer 컴포넌트
const TestConsumer = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  return (
    <div>
      <span data-testid="dark-mode-status">{isDarkMode ? 'dark' : 'light'}</span>
      <button onClick={toggleDarkMode}>Toggle</button>
    </div>
  );
};

describe('DarkModeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  describe('DarkModeProvider', () => {
    it('children을 올바르게 렌더링한다', () => {
      render(
        <DarkModeProvider>
          <div>테스트 컴포넌트</div>
        </DarkModeProvider>
      );

      expect(screen.getByText('테스트 컴포넌트')).toBeInTheDocument();
    });

    it('localStorage에 저장된 값이 없으면 기본값 false를 사용한다', () => {
      render(
        <DarkModeProvider>
          <TestConsumer />
        </DarkModeProvider>
      );

      expect(screen.getByTestId('dark-mode-status')).toHaveTextContent('light');
    });

    it('localStorage에 "true"가 저장되어 있으면 다크모드가 활성화된다', () => {
      localStorage.setItem('darkMode', 'true');

      render(
        <DarkModeProvider>
          <TestConsumer />
        </DarkModeProvider>
      );

      expect(screen.getByTestId('dark-mode-status')).toHaveTextContent('dark');
    });

    it('localStorage에 "false"가 저장되어 있으면 라이트모드가 유지된다', () => {
      localStorage.setItem('darkMode', 'false');

      render(
        <DarkModeProvider>
          <TestConsumer />
        </DarkModeProvider>
      );

      expect(screen.getByTestId('dark-mode-status')).toHaveTextContent('light');
    });
  });

  describe('useDarkMode', () => {
    it('Provider 외부에서 사용하면 에러를 던진다', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useDarkMode must be used within DarkModeProvider');

      consoleError.mockRestore();
    });
  });

  describe('toggleDarkMode', () => {
    it('다크모드를 토글한다', () => {
      render(
        <DarkModeProvider>
          <TestConsumer />
        </DarkModeProvider>
      );

      expect(screen.getByTestId('dark-mode-status')).toHaveTextContent('light');

      fireEvent.click(screen.getByText('Toggle'));

      expect(screen.getByTestId('dark-mode-status')).toHaveTextContent('dark');

      fireEvent.click(screen.getByText('Toggle'));

      expect(screen.getByTestId('dark-mode-status')).toHaveTextContent('light');
    });

    it('토글 시 localStorage에 값을 저장한다', () => {
      render(
        <DarkModeProvider>
          <TestConsumer />
        </DarkModeProvider>
      );

      fireEvent.click(screen.getByText('Toggle'));

      expect(localStorage.getItem('darkMode')).toBe('true');

      fireEvent.click(screen.getByText('Toggle'));

      expect(localStorage.getItem('darkMode')).toBe('false');
    });

    it('다크모드 활성화 시 document에 dark 클래스를 추가한다', () => {
      render(
        <DarkModeProvider>
          <TestConsumer />
        </DarkModeProvider>
      );

      fireEvent.click(screen.getByText('Toggle'));

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('다크모드 비활성화 시 document에서 dark 클래스를 제거한다', () => {
      localStorage.setItem('darkMode', 'true');

      render(
        <DarkModeProvider>
          <TestConsumer />
        </DarkModeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      fireEvent.click(screen.getByText('Toggle'));

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('초기화 테스트', () => {
    it('다크모드로 초기화되면 즉시 dark 클래스가 적용된다', () => {
      localStorage.setItem('darkMode', 'true');

      render(
        <DarkModeProvider>
          <TestConsumer />
        </DarkModeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('Context 값 테스트', () => {
    it('isDarkMode 값이 올바르게 제공된다', () => {
      render(
        <DarkModeProvider>
          <TestConsumer />
        </DarkModeProvider>
      );

      expect(screen.getByTestId('dark-mode-status')).toHaveTextContent('light');
    });

    it('toggleDarkMode 함수가 올바르게 제공된다', () => {
      render(
        <DarkModeProvider>
          <TestConsumer />
        </DarkModeProvider>
      );

      const button = screen.getByText('Toggle');
      expect(button).toBeInTheDocument();

      // 함수가 작동하는지 확인
      fireEvent.click(button);
      expect(screen.getByTestId('dark-mode-status')).toHaveTextContent('dark');
    });
  });
});
