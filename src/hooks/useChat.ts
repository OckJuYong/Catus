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
      // API 호출
      const response = await chatApi.sendMessage(inputValue);

      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: response.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      logError(err, { action: 'sendMessage' });
      setError('메시지 전송에 실패했습니다.');

      // Mock 응답 (백엔드 미구현 시)
      if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
        const mockResponses = [
          '그랬구나! 더 자세히 말해줄 수 있어?',
          '정말 흥미로운 이야기네. 그때 기분이 어땠어?',
          '잘 들었어. 다른 일은 없었어?',
          '그 상황에서 어떻게 대처했어?',
          '충분히 그럴 수 있어. 지금은 기분이 좀 어때?',
        ];

        const aiMessage: ChatMessage = {
          id: Date.now() + 1,
          type: 'ai',
          text: mockResponses[Math.floor(Math.random() * mockResponses.length)]!,
          timestamp: new Date(),
        };

        setTimeout(() => {
          setMessages((prev) => [...prev, aiMessage]);
        }, 1000);
      }
    } finally {
      setIsAITyping(false);
    }
  }, [inputValue, isAITyping]);

  // 대화 종료 (감정 분석)
  const endConversation = useCallback(async (): Promise<{ emotion: string; summary: string } | null> => {
    if (messages.length <= 1) {
      return null;
    }

    try {
      const chatMessages = messages.map((msg) => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.text,
        timestamp: msg.timestamp.toISOString(),
      }));

      const todayDate = new Date().toISOString().split('T')[0] || '';
      const response = await chatApi.endConversation(todayDate, chatMessages);
      return {
        emotion: response.emotion || '보통',
        summary: response.summary || '',
      };
    } catch (err) {
      logError(err, { action: 'endConversation' });
      return null;
    }
  }, [messages]);

  // 대화 기록 불러오기
  const loadHistory = useCallback(async (diaryId: string): Promise<void> => {
    try {
      const historyData = await chatApi.getHistory(diaryId);
      const loadedMessages: ChatMessage[] = historyData.messages.map((msg, idx) => ({
        id: Date.now() + idx,
        type: msg.role === 'user' ? 'user' as const : 'ai' as const,
        text: msg.content,
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
