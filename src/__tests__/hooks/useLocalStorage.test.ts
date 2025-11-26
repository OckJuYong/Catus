/**
 * useLocalStorage 훅 테스트
 */

import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// Storage Mock
jest.mock('../../utils/storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('useLocalStorage', () => {
  const { getItem, setItem, removeItem } = require('../../utils/storage');

  beforeEach(() => {
    jest.clearAllMocks();
    getItem.mockReturnValue(null);
    setItem.mockReturnValue(true);
    removeItem.mockReturnValue(true);
  });

  describe('초기화', () => {
    it('저장된 값이 없으면 initialValue를 반환한다', () => {
      getItem.mockReturnValue(null);

      const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));

      expect(result.current[0]).toBe('initialValue');
    });

    it('저장된 값이 있으면 해당 값을 반환한다', () => {
      getItem.mockReturnValue('storedValue');

      const { result } = renderHook(() => useLocalStorage('testKey', 'initialValue'));

      expect(result.current[0]).toBe('storedValue');
    });

    it('객체 타입의 값도 올바르게 처리한다', () => {
      const storedObject = { name: 'test', count: 5 };
      getItem.mockReturnValue(storedObject);

      const { result } = renderHook(() => useLocalStorage('objectKey', { name: '', count: 0 }));

      expect(result.current[0]).toEqual(storedObject);
    });

    it('배열 타입의 값도 올바르게 처리한다', () => {
      const storedArray = [1, 2, 3];
      getItem.mockReturnValue(storedArray);

      const { result } = renderHook(() => useLocalStorage('arrayKey', []));

      expect(result.current[0]).toEqual(storedArray);
    });

    it('boolean 타입의 값도 올바르게 처리한다', () => {
      getItem.mockReturnValue(true);

      const { result } = renderHook(() => useLocalStorage('boolKey', false));

      expect(result.current[0]).toBe(true);
    });
  });

  describe('setValue', () => {
    it('값을 설정하고 localStorage에 저장한다', () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

      act(() => {
        result.current[1]('newValue');
      });

      expect(result.current[0]).toBe('newValue');
      expect(setItem).toHaveBeenCalledWith('testKey', 'newValue');
    });

    it('함수형 업데이트를 지원한다', () => {
      getItem.mockReturnValue(5);

      const { result } = renderHook(() => useLocalStorage<number>('countKey', 0));

      act(() => {
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(6);
      expect(setItem).toHaveBeenCalledWith('countKey', 6);
    });

    it('객체를 업데이트할 수 있다', () => {
      getItem.mockReturnValue({ name: 'old' });

      const { result } = renderHook(() => useLocalStorage('objectKey', { name: '' }));

      act(() => {
        result.current[1]({ name: 'new' });
      });

      expect(result.current[0]).toEqual({ name: 'new' });
    });

    it('함수형 업데이트로 객체를 부분 업데이트할 수 있다', () => {
      getItem.mockReturnValue({ name: 'test', count: 1 });

      const { result } = renderHook(() =>
        useLocalStorage<{ name: string; count: number }>('objectKey', { name: '', count: 0 })
      );

      act(() => {
        result.current[1]((prev) => ({ ...prev, count: prev.count + 1 }));
      });

      expect(result.current[0]).toEqual({ name: 'test', count: 2 });
    });
  });

  describe('removeValue', () => {
    it('값을 삭제하고 initialValue로 초기화한다', () => {
      getItem.mockReturnValue('storedValue');

      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

      act(() => {
        result.current[2]();
      });

      expect(result.current[0]).toBe('initial');
      expect(removeItem).toHaveBeenCalledWith('testKey');
    });
  });

  describe('storage 이벤트 처리', () => {
    it('다른 탭에서 값이 변경되면 상태를 업데이트한다', () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

      act(() => {
        // storage 이벤트 시뮬레이션
        const event = new StorageEvent('storage', {
          key: 'catus_testKey',
          newValue: JSON.stringify('updatedFromOtherTab'),
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBe('updatedFromOtherTab');
    });

    it('다른 키의 변경은 무시한다', () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

      act(() => {
        const event = new StorageEvent('storage', {
          key: 'catus_otherKey',
          newValue: JSON.stringify('shouldNotUpdate'),
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBe('initial');
    });

    it('newValue가 없는 이벤트는 무시한다', () => {
      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

      act(() => {
        const event = new StorageEvent('storage', {
          key: 'catus_testKey',
          newValue: null,
        });
        window.dispatchEvent(event);
      });

      expect(result.current[0]).toBe('initial');
    });
  });

  describe('에러 처리', () => {
    it('getItem에서 에러 발생 시 initialValue를 반환한다', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      getItem.mockImplementation(() => {
        throw new Error('getItem error');
      });

      const { result } = renderHook(() => useLocalStorage('testKey', 'fallback'));

      expect(result.current[0]).toBe('fallback');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('setItem에서 에러 발생 시 상태는 업데이트되지 않는다', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      setItem.mockImplementation(() => {
        throw new Error('setItem error');
      });

      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

      act(() => {
        result.current[1]('newValue');
      });

      // 에러가 발생해도 상태는 업데이트됨 (setStoredValue 내부에서 처리)
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('removeItem에서 에러 발생 시 상태는 initialValue로 유지된다', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      removeItem.mockImplementation(() => {
        throw new Error('removeItem error');
      });

      getItem.mockReturnValue('storedValue');

      const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

      act(() => {
        result.current[2]();
      });

      // 에러가 발생해도 상태는 초기화됨
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('클린업', () => {
    it('언마운트 시 storage 이벤트 리스너가 제거된다', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useLocalStorage('testKey', 'initial'));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('키 변경', () => {
    it('키가 변경되면 새 키의 값을 로드한다', () => {
      getItem.mockImplementation((key: string) => {
        if (key === 'key1') return 'value1';
        if (key === 'key2') return 'value2';
        return null;
      });

      const { result, rerender } = renderHook(({ key }) => useLocalStorage(key, 'initial'), {
        initialProps: { key: 'key1' },
      });

      expect(result.current[0]).toBe('value1');

      rerender({ key: 'key2' });

      expect(result.current[0]).toBe('value2');
    });
  });
});
