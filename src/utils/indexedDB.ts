/**
 * IndexedDB 유틸리티
 * 채팅 메시지 로컬 저장소
 */

import type { ChatMessage } from '../types';

const DB_NAME = 'CatusDB';
const DB_VERSION = 1;
const STORE_NAME = 'chatMessages';

interface ChatMessageRecord extends ChatMessage {
  date: string; // YYYY-MM-DD 형식
  synced: boolean; // 백엔드 동기화 여부
  createdAt: number; // 생성 타임스탬프
}

/**
 * IndexedDB 초기화
 */
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // chatMessages 스토어 생성
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true
        });

        // 인덱스 생성
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

/**
 * 채팅 메시지 저장
 */
export const saveChatMessage = async (
  date: string,
  message: ChatMessage,
  synced: boolean = false
): Promise<void> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const record: ChatMessageRecord = {
      ...message,
      date,
      synced,
      createdAt: Date.now(),
    };

    const request = store.add(record);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
};

/**
 * 특정 날짜의 채팅 메시지 조회
 */
export const getChatMessagesByDate = async (date: string): Promise<ChatMessage[]> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('date');
    const request = index.getAll(date);

    request.onsuccess = () => {
      const records = request.result as ChatMessageRecord[];
      const messages = records.map(({ date, synced, createdAt, ...message }) => message);
      resolve(messages);
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
};

/**
 * 동기화되지 않은 메시지 조회
 */
export const getUnsyncedMessages = async (): Promise<{ date: string; messages: ChatMessage[] }[]> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('synced');
    const request = index.getAll(IDBKeyRange.only(false));

    request.onsuccess = () => {
      const records = request.result as ChatMessageRecord[];

      // 날짜별로 그룹화
      const grouped = records.reduce((acc, record) => {
        const { date, synced, createdAt, ...message } = record;

        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(message);

        return acc;
      }, {} as Record<string, ChatMessage[]>);

      // 배열로 변환
      const result = Object.entries(grouped).map(([date, messages]) => ({
        date,
        messages,
      }));

      resolve(result);
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
};

/**
 * 특정 날짜의 메시지를 동기화 완료로 표시
 */
export const markMessagesAsSynced = async (date: string): Promise<void> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('date');
    const request = index.openCursor(date);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

      if (cursor) {
        const record = cursor.value as ChatMessageRecord;
        record.synced = true;
        cursor.update(record);
        cursor.continue();
      }
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
  });
};

/**
 * 특정 날짜의 모든 메시지 삭제
 */
export const deleteChatMessagesByDate = async (date: string): Promise<void> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('date');
    const request = index.openCursor(date);

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
  });
};

/**
 * 모든 채팅 메시지 삭제
 */
export const clearAllChatMessages = async (): Promise<void> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
};

/**
 * IndexedDB 저장소 사용량 확인
 */
export const getStorageEstimate = async (): Promise<{
  usage: number;
  quota: number;
  percentage: number;
}> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;

    return { usage, quota, percentage };
  }

  // Storage API를 지원하지 않는 브라우저
  return { usage: 0, quota: 0, percentage: 0 };
};

/**
 * 오래된 메시지 자동 정리 (30일 이상 된 동기화된 메시지)
 */
export const cleanupOldMessages = async (daysToKeep: number = 30): Promise<number> => {
  const db = await initDB();
  const cutoffTimestamp = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('createdAt');
    const request = index.openCursor(IDBKeyRange.upperBound(cutoffTimestamp));

    let deletedCount = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

      if (cursor) {
        const record = cursor.value as ChatMessageRecord;

        // 동기화된 메시지만 삭제 (동기화 안 된 메시지는 보존)
        if (record.synced) {
          cursor.delete();
          deletedCount++;
        }

        cursor.continue();
      }
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => {
      db.close();
      resolve(deletedCount);
    };
  });
};

/**
 * 저장소 압박 시 자동 정리 (quota의 80% 이상 사용 시)
 */
export const autoCleanupIfNeeded = async (): Promise<{
  cleaned: boolean;
  deletedCount: number;
  newPercentage: number;
}> => {
  const estimate = await getStorageEstimate();

  // Quota의 80% 이상 사용 시 정리
  if (estimate.percentage >= 80) {
    console.warn(`Storage usage high: ${estimate.percentage.toFixed(2)}% - Running cleanup...`);

    // 먼저 30일 이상 된 메시지 정리
    let deletedCount = await cleanupOldMessages(30);

    // 여전히 75% 이상이면 더 공격적으로 정리 (15일 이상)
    const newEstimate = await getStorageEstimate();
    if (newEstimate.percentage >= 75) {
      const additionalDeleted = await cleanupOldMessages(15);
      deletedCount += additionalDeleted;
    }

    const finalEstimate = await getStorageEstimate();
    console.log(`Cleanup complete: Deleted ${deletedCount} messages, new usage: ${finalEstimate.percentage.toFixed(2)}%`);

    return {
      cleaned: true,
      deletedCount,
      newPercentage: finalEstimate.percentage
    };
  }

  return {
    cleaned: false,
    deletedCount: 0,
    newPercentage: estimate.percentage
  };
};

/**
 * 저장 전 quota 체크 및 자동 정리
 */
export const saveChatMessageWithQuotaCheck = async (
  date: string,
  message: ChatMessage,
  synced: boolean = false
): Promise<void> => {
  try {
    // 먼저 quota 확인 및 필요 시 정리
    await autoCleanupIfNeeded();

    // 메시지 저장 시도
    await saveChatMessage(date, message, synced);
  } catch (error: any) {
    // QuotaExceededError 발생 시 강제 정리 후 재시도
    if (error?.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded, forcing aggressive cleanup...');

      // 7일 이상 된 메시지만 남기고 모두 삭제
      await cleanupOldMessages(7);

      // 재시도
      await saveChatMessage(date, message, synced);
    } else {
      throw error;
    }
  }
};
