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
    const request = index.getAll(false);

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
