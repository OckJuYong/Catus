/**
 * 익명 응원 메시지 커스텀 훅
 */

import { useState, useCallback } from 'react';
import { messageApi } from '../utils/api';
import { logError } from '../utils/errorHandler';
import type { AnonymousMessage } from '../types';

interface UseSupportReturn {
  receivedMessages: AnonymousMessage[];
  sentMessages: AnonymousMessage[];
  loading: boolean;
  error: unknown | null;
  unreadCount: number;
  fetchReceived: (page?: number, size?: number) => Promise<void>;
  fetchSent: () => Promise<void>;
  sendMessage: (diaryId: number, content: string) => Promise<[AnonymousMessage, null] | [null, unknown]>;
  markAsRead: (messageId: number) => Promise<void>;
}

/**
 * 익명 응원 훅
 */
export const useSupport = (): UseSupportReturn => {
  const [receivedMessages, setReceivedMessages] = useState<AnonymousMessage[]>([]);
  const [sentMessages, setSentMessages] = useState<AnonymousMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  // 받은 메시지 조회 (백엔드: GET /api/message/received)
  const fetchReceived = useCallback(async (page: number = 0, size: number = 20): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const data = await messageApi.getReceived(page, size);
      // 백엔드 응답: {messages: [{id, content, diaryId, receivedAt, isRead}], totalPages, unreadCount}
      // AnonymousMessage 타입으로 변환
      const messages: AnonymousMessage[] = data.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        diaryId: msg.diaryId,
        isRead: msg.isRead,
        receivedAt: msg.receivedAt,
      }));
      setReceivedMessages(messages);
    } catch (err) {
      logError(err, { action: 'fetchReceived', page, size });
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 보낸 메시지 조회 (백엔드 미지원 - API 없음)
  const fetchSent = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // TODO: 백엔드에 보낸 메시지 조회 API 없음
      // 현재는 빈 배열 반환
      setSentMessages([]);
    } catch (err) {
      logError(err, { action: 'fetchSent' });
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 메시지 전송 (백엔드: POST /api/message/send)
  const sendMessage = useCallback(async (
    diaryId: number,
    content: string
  ): Promise<[AnonymousMessage, null] | [null, unknown]> => {
    setLoading(true);
    setError(null);

    try {
      // 백엔드 응답: {messageId, sentAt}
      const result = await messageApi.send(diaryId, content);

      // 전송된 메시지를 임시로 추가
      const newMessage: AnonymousMessage = {
        id: result.messageId,
        content: content,
        diaryId: diaryId,
        isRead: false,
        receivedAt: result.sentAt,
      };

      setSentMessages((prev) => [newMessage, ...prev]);

      if (window.showToast) {
        window.showToast('응원 메시지가 전송되었습니다.', 'success');
      }

      return [newMessage, null];
    } catch (err) {
      logError(err, { action: 'sendMessage', diaryId, content });
      setError(err);

      if (window.showToast) {
        window.showToast('메시지 전송에 실패했습니다.', 'error');
      }

      return [null, err];
    } finally {
      setLoading(false);
    }
  }, []);

  // 메시지 읽음 처리 (백엔드: PUT /api/message/read/{id})
  const markAsRead = useCallback(async (messageId: number): Promise<void> => {
    try {
      await messageApi.markAsRead(messageId);

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
