/**
 * useDebounce 훅 테스트
 */

import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebouncedCallback } from '../../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('기본 동작', () => {
    it('초기값을 즉시 반환한다', () => {
      const { result } = renderHook(() => useDebounce('initial', 500));

      expect(result.current).toBe('initial');
    });

    it('지정된 딜레이 후에 값이 업데이트된다', () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: 'initial' },
      });

      rerender({ value: 'updated' });

      // 아직 업데이트되지 않음
      expect(result.current).toBe('initial');

      // 500ms 경과
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('updated');
    });

    it('딜레이 전에 값이 변경되면 타이머가 리셋된다', () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: 'initial' },
      });

      rerender({ value: 'first' });

      // 300ms 경과
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // 아직 업데이트되지 않음
      expect(result.current).toBe('initial');

      // 다시 값 변경
      rerender({ value: 'second' });

      // 추가 300ms 경과 (총 600ms지만 리셋되었으므로 아직 안됨)
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('initial');

      // 나머지 200ms 경과
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe('second');
    });

    it('기본 딜레이는 500ms이다', () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
        initialProps: { value: 'initial' },
      });

      rerender({ value: 'updated' });

      act(() => {
        jest.advanceTimersByTime(499);
      });

      expect(result.current).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current).toBe('updated');
    });
  });

  describe('다양한 타입 지원', () => {
    it('숫자 타입을 처리한다', () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: 0 },
      });

      rerender({ value: 100 });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe(100);
    });

    it('객체 타입을 처리한다', () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: { count: 0 } },
      });

      rerender({ value: { count: 5 } });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toEqual({ count: 5 });
    });

    it('배열 타입을 처리한다', () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: [1, 2, 3] },
      });

      rerender({ value: [4, 5, 6] });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toEqual([4, 5, 6]);
    });

    it('null과 undefined를 처리한다', () => {
      const { result, rerender } = renderHook(({ value }) => useDebounce<string | null>(value, 500), {
        initialProps: { value: 'test' as string | null },
      });

      rerender({ value: null });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBeNull();
    });
  });

  describe('딜레이 변경', () => {
    it('딜레이가 변경되면 새 딜레이가 적용된다', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
        initialProps: { value: 'initial', delay: 500 },
      });

      rerender({ value: 'updated', delay: 1000 });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('updated');
    });
  });

  describe('클린업', () => {
    it('언마운트 시 타이머가 정리된다', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const { unmount, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
        initialProps: { value: 'initial' },
      });

      rerender({ value: 'updated' });
      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('기본 동작', () => {
    it('콜백 함수를 디바운스 처리한다', () => {
      const callback = jest.fn();

      const { result } = renderHook(() => useDebouncedCallback(callback, 500));

      result.current('arg1');

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledWith('arg1');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('딜레이 내에 여러 번 호출하면 마지막 호출만 실행된다', () => {
      const callback = jest.fn();

      const { result } = renderHook(() => useDebouncedCallback(callback, 500));

      result.current('first');
      result.current('second');
      result.current('third');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('third');
    });

    it('기본 딜레이는 500ms이다', () => {
      const callback = jest.fn();

      const { result } = renderHook(() => useDebouncedCallback(callback));

      result.current();

      act(() => {
        jest.advanceTimersByTime(499);
      });

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('인자 전달', () => {
    it('여러 인자를 전달할 수 있다', () => {
      const callback = jest.fn();

      const { result } = renderHook(() => useDebouncedCallback(callback, 500));

      result.current('arg1', 'arg2', 'arg3');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });

    it('객체 인자를 전달할 수 있다', () => {
      const callback = jest.fn();

      const { result } = renderHook(() => useDebouncedCallback(callback, 500));

      result.current({ name: 'test', value: 123 });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledWith({ name: 'test', value: 123 });
    });
  });

  describe('연속 호출', () => {
    it('딜레이 후 다시 호출할 수 있다', () => {
      const callback = jest.fn();

      const { result } = renderHook(() => useDebouncedCallback(callback, 500));

      result.current('first');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      result.current('second');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith('second');
    });
  });

  describe('클린업', () => {
    it('언마운트 시 대기 중인 콜백이 취소된다', () => {
      const callback = jest.fn();

      const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 500));

      result.current('test');
      unmount();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('콜백 변경', () => {
    it('콜백이 변경되면 새 콜백이 사용된다', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const { result, rerender } = renderHook(({ callback }) => useDebouncedCallback(callback, 500), {
        initialProps: { callback: callback1 },
      });

      result.current('test1');

      rerender({ callback: callback2 });

      result.current('test2');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith('test2');
    });
  });
});
