/**
 * 채팅 로직 커스텀 훅
 */

import { useState, useCallback, useRef, useEffect, RefObject } from 'react';
import { chatApi } from '../utils/api';
import { logError } from '../utils/errorHandler';

interface ChatMessage {
  id: number;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface UseChatReturn {
  messages: ChatMessage[];
  inputValue: string;
  setInputValue: (value: string) => void;
  isAITyping: boolean;
  error: string | null;
  messagesEndRef: RefObject<HTMLDivElement>;
  sendMessage: () => Promise<void>;
  initializeChat: (greetingMessage?: string) => void;
  endConversation: () => Promise<{ emotion: string; summary: string } | null>;
  loadHistory: (diaryId: string) => Promise<void>;
  reset: () => void;
}

/**
 * 채팅 훅
 */
export const useChat = (): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAITyping, scrollToBottom]);

  // 초기 AI 인사 메시지
  const initializeChat = useCallback((greetingMessage?: string): void => {
    const initialMessage: ChatMessage = {
      id: Date.now(),
      type: 'ai',
      text: greetingMessage || '안녕! 오늘 하루는 어땠어? 무슨 일이 있었는지 들려줘!',
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
  }, []);

  // 메시지 전송
  const sendMessage = useCallback(async (): Promise<void> => {
    if (!inputValue.trim() || isAITyping) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsAITyping(true);
    setError(null);

    try {
      // API 호출 (백엔드 응답: {messageId, userMessage, aiResponse, timestamp})
      const response = await chatApi.sendMessage(inputValue);

      const aiMessage: ChatMessage = {
        id: response.messageId,
        type: 'ai',
        text: response.aiResponse,
        timestamp: new Date(response.timestamp),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      logError(err, { action: 'sendMessage' });
      setError('메시지 전송에 실패했습니다.');
    } finally {
      setIsAITyping(false);
    }
  }, [inputValue, isAITyping]);

  // 대화 종료 (감정 분석)
  // 백엔드에 endConversation API 없음 - analyzeChat 사용 또는 클라이언트 로직
  const endConversation = useCallback(async (): Promise<{ emotion: string; summary: string } | null> => {
    if (messages.length <= 1) {
      return null;
    }

    try {
      // TODO: 백엔드에 endConversation API 없음
      // 옵션 1: chatApi.analyzeChat(startDate, endDate) 사용
      // 옵션 2: 클라이언트에서 감정/요약 생성
      // 임시로 클라이언트 로직 사용
      return {
        emotion: '보통',
        summary: messages.filter(m => m.type === 'user').map(m => m.text).join(' '),
      };
    } catch (err) {
      logError(err, { action: 'endConversation' });
      return null;
    }
  }, [messages]);

  // 대화 기록 불러오기
  const loadHistory = useCallback(async (diaryId: string): Promise<void> => {
    try {
      // 백엔드 getHistory는 페이징 필요: getHistory(page, size)
      // diaryId 대신 날짜로 조회: getContextByDate(date) 사용
      const historyData = await chatApi.getHistory(0, 100); // 임시로 첫 페이지 100개
      const loadedMessages: ChatMessage[] = historyData.messages.map((msg, idx) => ({
        id: msg.id,
        type: 'user', // 백엔드 응답에 userMessage와 aiResponse가 분리되어 있음
        text: msg.userMessage,
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(loadedMessages);
    } catch (err) {
      logError(err, { action: 'loadHistory', diaryId });
    }
  }, []);

  // 리셋
  const reset = useCallback((): void => {
    setMessages([]);
    setInputValue('');
    setIsAITyping(false);
    setError(null);
  }, []);

  return {
    messages,
    inputValue,
    setInputValue,
    isAITyping,
    error,
    messagesEndRef,
    sendMessage,
    initializeChat,
    endConversation,
    loadHistory,
    reset,
  };
};

export default useChat;
