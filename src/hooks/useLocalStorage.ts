/**
 * localStorage 커스텀 훅
 */

import { useState, useEffect, useCallback } from 'react';
import { setItem, getItem, removeItem } from '../utils/storage';

/**
 * localStorage 상태 관리 훅
 */
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] => {
  // 초기값 설정
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = getItem<T>(key);
      return item !== null ? item : initialValue;
    } catch (error) {
      console.error('useLocalStorage initialization error:', error);
      return initialValue;
    }
  });

  // 값 저장 함수
  const setValue = useCallback((value: T | ((prev: T) => T)): void => {
    try {
      setStoredValue((prevValue) => {
        // 함수형 업데이트 지원
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        setItem(key, valueToStore);
        return valueToStore;
      });
    } catch (error) {
      console.error('useLocalStorage setValue error:', error);
    }
  }, [key]);

  // 값 삭제 함수
  const removeValue = useCallback((): void => {
    try {
      setStoredValue(initialValue);
      removeItem(key);
    } catch (error) {
      console.error('useLocalStorage removeValue error:', error);
    }
  }, [key, initialValue]);

  // 다른 탭/창의 변경 감지
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === `catus_${key}` && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error) {
          console.error('useLocalStorage storage event error:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;
