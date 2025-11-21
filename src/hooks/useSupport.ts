/**
 * 익명 응원 메시지 커스텀 훅
 */

import { useState, useCallback } from 'react';
import { supportApi } from '../utils/api';
import { logError } from '../utils/errorHandler';
import type { AnonymousMessage } from '../types';

interface UseSupportReturn {
  receivedMessages: AnonymousMessage[];
  sentMessages: AnonymousMessage[];
  loading: boolean;
  error: unknown | null;
  unreadCount: number;
  fetchReceived: () => Promise<void>;
  fetchSent: () => Promise<void>;
  sendMessage: (messageData: { content: string; emotion: string }) => Promise<[AnonymousMessage, null] | [null, unknown]>;
  markAsRead: (messageId: string) => Promise<void>;
}

/**
 * 익명 응원 훅
 */
export const useSupport = (): UseSupportReturn => {
  const [receivedMessages, setReceivedMessages] = useState<AnonymousMessage[]>([]);
  const [sentMessages, setSentMessages] = useState<AnonymousMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  // 받은 메시지 조회
  const fetchReceived = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const data = await supportApi.getReceived();
      setReceivedMessages(data.messages);
    } catch (err) {
      logError(err, { action: 'fetchReceived' });
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 보낸 메시지 조회
  const fetchSent = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const data = await supportApi.getSent();
      setSentMessages(data.messages);
    } catch (err) {
      logError(err, { action: 'fetchSent' });
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 메시지 전송
  const sendMessage = useCallback(async (
    messageData: { content: string; emotion: string }
  ): Promise<[AnonymousMessage, null] | [null, unknown]> => {
    setLoading(true);
    setError(null);

    try {
      const result = await supportApi.send(messageData.content, messageData.emotion);

      // 전송된 메시지를 임시로 추가 (실제로는 fetchSent 호출 필요)
      const newMessage: AnonymousMessage = {
        id: result.id,
        text: messageData.content,
        isRead: false,
        createdAt: result.sentAt,
      };

      setSentMessages((prev) => [newMessage, ...prev]);

      if (window.showToast) {
        window.showToast('응원 메시지가 전송되었습니다.', 'success');
      }

      return [newMessage, null];
    } catch (err) {
      logError(err, { action: 'sendMessage', messageData });
      setError(err);

      if (window.showToast) {
        window.showToast('메시지 전송에 실패했습니다.', 'error');
      }

      return [null, err];
    } finally {
      setLoading(false);
    }
  }, []);

  // 메시지 읽음 처리
  const markAsRead = useCallback(async (messageId: string): Promise<void> => {
    try {
      await supportApi.markAsRead(messageId);

      // 로컬 상태 업데이트
      setReceivedMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (err) {
      logError(err, { action: 'markAsRead', messageId });
    }
  }, []);

  // 읽지 않은 메시지 수
  const unreadCount = receivedMessages.filter((msg) => !msg.isRead).length;

  return {
    receivedMessages,
    sentMessages,
    loading,
    error,
    unreadCount,
    fetchReceived,
    fetchSent,
    sendMessage,
    markAsRead,
  };
};

export default useSupport;
