/**
 * TutorialContext 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { TutorialProvider, useTutorial } from '../../contexts/TutorialContext';

// useLocalStorage Mock
jest.mock('../../hooks/useLocalStorage', () => ({
  useLocalStorage: jest.fn((key: string, initialValue: boolean) => {
    let value = initialValue;
    const setValue = jest.fn((newValue: boolean | ((prev: boolean) => boolean)) => {
      if (typeof newValue === 'function') {
        value = newValue(value);
      } else {
        value = newValue;
      }
    });
    const removeValue = jest.fn(() => {
      value = initialValue;
    });
    return [value, setValue, removeValue];
  }),
}));

// 테스트용 Consumer 컴포넌트
const TestConsumer = () => {
  const { isTutorialCompleted, currentStep, startTutorial, nextStep, completeTutorial, resetTutorial } = useTutorial();
  return (
    <div>
      <span data-testid="is-completed">{isTutorialCompleted ? 'completed' : 'not-completed'}</span>
      <span data-testid="current-step">{currentStep}</span>
      <button onClick={startTutorial}>Start</button>
      <button onClick={nextStep}>Next</button>
      <button onClick={completeTutorial}>Complete</button>
      <button onClick={resetTutorial}>Reset</button>
    </div>
  );
};

describe('TutorialContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // useLocalStorage mock 재설정
    const { useLocalStorage } = require('../../hooks/useLocalStorage');
    useLocalStorage.mockImplementation((key: string, initialValue: boolean) => {
      let value = initialValue;
      const setValue = jest.fn((newValue: boolean | ((prev: boolean) => boolean)) => {
        if (typeof newValue === 'function') {
          value = newValue(value);
        } else {
          value = newValue;
        }
      });
      const removeValue = jest.fn(() => {
        value = initialValue;
      });
      return [value, setValue, removeValue];
    });
  });

  describe('TutorialProvider', () => {
    it('children을 올바르게 렌더링한다', () => {
      render(
        <TutorialProvider>
          <div>테스트 컴포넌트</div>
        </TutorialProvider>
      );

      expect(screen.getByText('테스트 컴포넌트')).toBeInTheDocument();
    });

    it('초기 상태가 올바르게 설정된다', () => {
      render(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>
      );

      expect(screen.getByTestId('is-completed')).toHaveTextContent('not-completed');
      expect(screen.getByTestId('current-step')).toHaveTextContent('0');
    });
  });

  describe('useTutorial', () => {
    it('Provider 외부에서 사용하면 에러를 던진다', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useTutorial must be used within TutorialProvider');

      consoleError.mockRestore();
    });
  });

  describe('startTutorial', () => {
    it('튜토리얼을 시작한다', () => {
      render(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>
      );

      fireEvent.click(screen.getByText('Start'));

      expect(screen.getByTestId('current-step')).toHaveTextContent('0');
    });

    it('이미 시작된 튜토리얼은 다시 시작하지 않는다', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>
      );

      fireEvent.click(screen.getByText('Start'));
      fireEvent.click(screen.getByText('Start'));

      // 두 번째 호출 시 "이미 시작됨" 로그가 출력되어야 함
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('이미'));

      consoleSpy.mockRestore();
    });
  });

  describe('nextStep', () => {
    it('다음 단계로 이동한다', () => {
      render(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>
      );

      expect(screen.getByTestId('current-step')).toHaveTextContent('0');

      fireEvent.click(screen.getByText('Next'));

      expect(screen.getByTestId('current-step')).toHaveTextContent('1');
    });

    it('여러 번 호출하면 단계가 증가한다', () => {
      render(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>
      );

      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));

      expect(screen.getByTestId('current-step')).toHaveTextContent('3');
    });
  });

  describe('completeTutorial', () => {
    it('튜토리얼을 완료 상태로 변경한다', () => {
      const { useLocalStorage } = require('../../hooks/useLocalStorage');
      const mockSetValue = jest.fn();
      useLocalStorage.mockReturnValue([false, mockSetValue, jest.fn()]);

      render(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>
      );

      fireEvent.click(screen.getByText('Complete'));

      expect(mockSetValue).toHaveBeenCalledWith(true);
    });
  });

  describe('resetTutorial', () => {
    it('튜토리얼을 리셋한다', () => {
      const { useLocalStorage } = require('../../hooks/useLocalStorage');
      const mockRemoveValue = jest.fn();
      useLocalStorage.mockReturnValue([true, jest.fn(), mockRemoveValue]);

      render(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>
      );

      fireEvent.click(screen.getByText('Reset'));

      expect(mockRemoveValue).toHaveBeenCalled();
    });

    it('리셋 후 currentStep이 0으로 초기화된다', () => {
      render(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>
      );

      // 단계 진행
      fireEvent.click(screen.getByText('Next'));
      fireEvent.click(screen.getByText('Next'));

      expect(screen.getByTestId('current-step')).toHaveTextContent('2');

      // 리셋
      fireEvent.click(screen.getByText('Reset'));

      expect(screen.getByTestId('current-step')).toHaveTextContent('0');
    });
  });

  describe('isTutorialCompleted', () => {
    it('튜토리얼 완료 여부를 반환한다', () => {
      const { useLocalStorage } = require('../../hooks/useLocalStorage');

      // 완료되지 않은 상태
      useLocalStorage.mockReturnValue([false, jest.fn(), jest.fn()]);

      const { rerender } = render(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>
      );

      expect(screen.getByTestId('is-completed')).toHaveTextContent('not-completed');

      // 완료된 상태로 변경
      useLocalStorage.mockReturnValue([true, jest.fn(), jest.fn()]);

      rerender(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>
      );

      expect(screen.getByTestId('is-completed')).toHaveTextContent('completed');
    });
  });

  describe('로깅 테스트', () => {
    it('startTutorial 호출 시 로그가 출력된다', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>
      );

      fireEvent.click(screen.getByText('Start'));

      expect(consoleSpy).toHaveBeenCalledWith('튜토리얼 시작!');

      consoleSpy.mockRestore();
    });

    it('completeTutorial 호출 시 로그가 출력된다', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>
      );

      fireEvent.click(screen.getByText('Complete'));

      expect(consoleSpy).toHaveBeenCalledWith('튜토리얼 완료!');

      consoleSpy.mockRestore();
    });

    it('resetTutorial 호출 시 로그가 출력된다', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      render(
        <TutorialProvider>
          <TestConsumer />
        </TutorialProvider>
      );

      fireEvent.click(screen.getByText('Reset'));

      expect(consoleSpy).toHaveBeenCalledWith('튜토리얼 리셋');

      consoleSpy.mockRestore();
    });
  });
});
