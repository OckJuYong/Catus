import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { EMOTION_COLORS, EMOTION_EMOJIS } from "../constants/emotionColors";
import { useSendChatMessage } from "../hooks/useApi";
import { chatApi } from "../utils/api";
import { useToast } from "../contexts/ToastContext";
import {
  saveChatMessageWithQuotaCheck,
  getChatMessagesByDate,
  markMessagesAsSynced
} from "../utils/indexedDB";
import { getTodayKey, getISOTimestamp } from "../utils/dateFormat";
import { sanitizeText, escapeHtml } from "../utils/validation";
import HomePage from "./HomePage";
import catProfile from "../assets/images/cat-profile.png";
import type { Emotion, ChatMessage } from "../types";

interface Message {
  id: number;
  type: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const todayKey = getTodayKey(); // Timezone-safe 날짜 키
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAITyping, setIsAITyping] = useState(false);
  const [showEmotionModal, setShowEmotionModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 애니메이션 상태
  const [showChatModal, setShowChatModal] = useState(false);

  // Race condition 방지용 refs
  const lastRequestTimeRef = useRef<number>(0);
  const isSubmittingRef = useRef<boolean>(false);

  // React Query mutations
  const sendMessageMutation = useSendChatMessage();

  const todayLabel = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 진입 애니메이션 시퀀스
  useEffect(() => {
    // 채팅 모달 표시
    setShowChatModal(true);
  }, []);

  // IndexedDB에서 오늘의 메시지 로드
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const savedMessages = await getChatMessagesByDate(todayKey);

        if (savedMessages.length === 0) {
          // 초기 AI 인사 메시지
          const initialMessage: Message = {
            id: 1,
            type: "ai",
            text: "안녕! 오늘 하루는 어땠어? 무슨 일이 있었는지 들려줘!",
            timestamp: getISOTimestamp(),
          };

          setMessages([initialMessage]);

          // IndexedDB에 저장 (quota 체크 포함)
          await saveChatMessageWithQuotaCheck(todayKey, {
            role: 'assistant',
            content: initialMessage.text,
            timestamp: initialMessage.timestamp
          }, false);
        } else {
          // 저장된 메시지를 Message 포맷으로 변환
          const convertedMessages: Message[] = savedMessages.map((msg, idx) => ({
            id: idx + 1,
            type: msg.role === 'user' ? 'user' : 'ai',
            text: msg.content,
            timestamp: msg.timestamp
          }));

          setMessages(convertedMessages);
        }
      } catch (error) {
        console.error('Failed to load messages from IndexedDB:', error);
      }
    };

    loadMessages();
  }, [todayKey]);

  // 자동 스크롤
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAITyping]);

  // 메시지 전송
  const handleSendMessage = async (): Promise<void> => {
    // Race condition 방지: 중복 전송 체크
    if (!inputValue.trim() || isAITyping || isSubmittingRef.current) {
      return;
    }

    // Debouncing: 마지막 요청 후 500ms 이내 요청 무시
    const now = Date.now();
    if (now - lastRequestTimeRef.current < 500) {
      console.log('Too fast! Request ignored (debouncing)');
      return;
    }

    // 입력 정제 (trim + 중복 공백 제거 + XSS 방지)
    const sanitized = sanitizeText(inputValue);
    const cleaned = escapeHtml(sanitized);

    // 입력 길이 검증 (최대 1000자)
    if (cleaned.length === 0) {
      return;
    }

    if (cleaned.length > 1000) {
      showToast('메시지는 최대 1000자까지 입력 가능합니다.', 'warning');
      return;
    }

    // 전송 중 플래그 설정
    isSubmittingRef.current = true;
    lastRequestTimeRef.current = now;

    const userMessage: Message = {
      id: Date.now(),
      type: "user",
      text: cleaned,
      timestamp: getISOTimestamp(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsAITyping(true);

    // 사용자 메시지를 IndexedDB에 저장 (동기화 안됨, quota 체크 포함)
    await saveChatMessageWithQuotaCheck(todayKey, {
      role: 'user',
      content: userMessage.text,
      timestamp: userMessage.timestamp
    }, false);

    try {
      // React Query mutation으로 API 호출
      const response = await sendMessageMutation.mutateAsync(userMessage.text);

      // AI 응답 추가 (백엔드 응답: {messageId, userMessage, aiResponse, timestamp})
      const aiMessage: Message = {
        id: Date.now() + 1,
        type: "ai",
        text: response.aiResponse,
        timestamp: getISOTimestamp(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // AI 응답을 IndexedDB에 저장 (동기화 안됨, quota 체크 포함)
      await saveChatMessageWithQuotaCheck(todayKey, {
        role: 'assistant',
        content: aiMessage.text,
        timestamp: aiMessage.timestamp
      }, false);

    } catch (error) {
      console.error('Failed to send message:', error);

      // 에러 발생 시 사용자에게 알림
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: "ai",
        text: "미안해, 지금 답변을 할 수 없어. 잠시 후 다시 시도해줄래?",
        timestamp: getISOTimestamp(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      // 에러 메시지도 IndexedDB에 저장 (quota 체크 포함)
      await saveChatMessageWithQuotaCheck(todayKey, {
        role: 'assistant',
        content: errorMessage.text,
        timestamp: errorMessage.timestamp
      }, false);
    } finally {
      setIsAITyping(false);
      // 전송 완료 후 플래그 해제
      isSubmittingRef.current = false;
    }
  };

  // 닫기
  const handleClose = (): void => {
    navigate(ROUTES.HOME);
  };

  // 감정 선택 및 일기 생성
  const handleSelectEmotion = async (selectedEmotion: Emotion): Promise<void> => {
    try {
      // TODO: 백엔드에 endConversation API가 없음
      // 대안 1: analyzeChat API 사용 (startDate, endDate 필요)
      // 대안 2: 클라이언트에서 감정/요약 생성 후 저장
      // 현재는 IndexedDB 동기화만 처리

      // 백엔드 동기화 완료로 표시
      await markMessagesAsSynced(todayKey);

      console.log("채팅 저장 완료", { date: todayKey, emotion: selectedEmotion });
      navigate(ROUTES.HOME);
    } catch (error) {
      console.error("채팅 저장 실패:", error);
      // 에러 시에도 홈으로 이동 (사용자 경험)
      navigate(ROUTES.HOME);
    }
  };

  // 저장 안함
  const handleDontSave = (): void => {
    navigate(ROUTES.HOME);
  };

  return (
    <div className="fixed inset-0" style={{ backgroundColor: 'var(--color-main-bg)' }}>
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% {
            opacity: 0.3;
          }
          30% {
            opacity: 1;
          }
        }
      `}</style>
      {/* 백그라운드로 HomePage 렌더링 */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <HomePage hideButtons={true} />
      </div>

      {/* 채팅 화면 - 반투명 어두운 배경으로 전체 화면 */}
      {showChatModal && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4" style={{ paddingTop: '16px', paddingBottom: '16px', backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
            <button
              onClick={handleClose}
              className="text-[white] flex items-center justify-center hover:opacity-80 transition-opacity bg-transparent border-0"
              style={{ width: '50px', height: '30px', fontSize: '25px' }}
              aria-label="뒤로가기"
            >
              ←
            </button>
            <span className="text-[white] text-sm font-medium">{todayLabel}</span>
            <div style={{ width: "40px" }} />
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', paddingBottom: '16px' }}>
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-start ${m.type === "user" ? "flex-row-reverse" : "flex-row"}`}
              style={{ gap: '8px', marginBottom: '16px' }}
            >
              {m.type === "ai" && (
                <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '32px', height: '32px' }}>
                  <img src={catProfile} alt="cat" className="object-contain" style={{ width: '32px', height: '32px' }} />
                </div>
              )}
              <div className={`flex items-end ${m.type === "user" ? "flex-row-reverse" : ""}`} style={{ gap: '2px' }}>
                <div
                  className={`max-w-[200px] break-words ${
                    m.type === "ai"
                      ? "text-[white]"
                      : "text-[white]"
                  }`}
                  style={m.type === "ai" ? {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    borderRadius: '16px',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    fontSize: '12px'
                  } : {
                    backgroundColor: 'rgba(150, 150, 150, 0.8)',
                    borderRadius: '16px',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    fontSize: '14px'
                  }}
                >
                  {m.text}
                </div>
                <div className="text-xs text-[white]/60" style={{ fontSize: '10px', paddingBottom: '2px' }}>
                  {new Date(m.timestamp).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* AI 타이핑 중 */}
        {isAITyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start"
            style={{ gap: '8px', marginBottom: '16px' }}
          >
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '32px', height: '32px' }}>
              <img src={catProfile} alt="cat" className="object-contain" style={{ width: '32px', height: '32px' }} />
            </div>
            <div className="text-[white] flex" style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderRadius: '16px',
              paddingLeft: '16px',
              paddingRight: '16px',
              paddingTop: '12px',
              paddingBottom: '12px',
              fontSize: '14px',
              gap: '6px'
            }}>
              <span className="bg-[white] rounded-full" style={{
                width: '6px',
                height: '6px',
                animation: 'typingDot 1.4s infinite',
                animationDelay: '0ms'
              }}></span>
              <span className="bg-[white] rounded-full" style={{
                width: '6px',
                height: '6px',
                animation: 'typingDot 1.4s infinite',
                animationDelay: '200ms'
              }}></span>
              <span className="bg-[white] rounded-full" style={{
                width: '6px',
                height: '6px',
                animation: 'typingDot 1.4s infinite',
                animationDelay: '400ms'
              }}></span>
            </div>
          </motion.div>
        )}

        {/* 사용자 타이핑 중 */}
        {inputValue.trim() && !isAITyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start flex-row-reverse"
            style={{ gap: '8px', marginBottom: '16px' }}
          >
            <div className="text-[white] flex" style={{
              backgroundColor: 'rgba(150, 150, 150, 0.8)',
              borderRadius: '16px',
              paddingLeft: '16px',
              paddingRight: '16px',
              paddingTop: '12px',
              paddingBottom: '12px',
              fontSize: '14px',
              gap: '6px'
            }}>
              <span className="bg-[white] rounded-full" style={{
                width: '6px',
                height: '6px',
                animation: 'typingDot 1.4s infinite',
                animationDelay: '0ms'
              }}></span>
              <span className="bg-[white] rounded-full" style={{
                width: '6px',
                height: '6px',
                animation: 'typingDot 1.4s infinite',
                animationDelay: '200ms'
              }}></span>
              <span className="bg-[white] rounded-full" style={{
                width: '6px',
                height: '6px',
                animation: 'typingDot 1.4s infinite',
                animationDelay: '400ms'
              }}></span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} /></div>

          {/* 입력 영역 */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: '8px' }}>
            {/* 음성 버튼 */}
            <button
              className="hover:opacity-90 transition-all active:scale-93 border-0"
              style={{
                width: '40px',
                height: '40px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '12px',
                color: 'white'
              }}
              aria-label="음성 입력"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>mic</span>
            </button>

            {/* 입력창 */}
            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder="메시지를 입력하세요..."
                disabled={isAITyping}
                maxLength={1000}
                className="rounded-[12px] text-sm focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  paddingTop: '9px',
                  paddingBottom: '9px',
                  border: '1px solid #D1D5DB'
                }}
              />
              {inputValue.length > 900 && (
                <span className="absolute -top-6 right-0 text-xs text-gray-500">
                  {inputValue.length}/1000
                </span>
              )}
            </div>

            {/* 전송 버튼 */}
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isAITyping}
              className="text-sm font-medium transition-all active:scale-93 border-0"
              style={{
                flexShrink: 0,
                paddingLeft: '20px',
                paddingRight: '20px',
                paddingTop: '11px',
                paddingBottom: '11px',
                backgroundColor: '#000000',
                borderRadius: '12px',
                color: 'white',
                opacity: (!inputValue.trim() || isAITyping) ? 0.5 : 1,
              }}
            >
              전송
            </button>
          </div>
        </motion.div>
      )}

      {/* 감정 선택 모달 */}
      <AnimatePresence>
        {showEmotionModal && (
          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingLeft: '24px',
              paddingRight: '24px'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl w-full max-w-md"
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '24px', paddingBottom: '24px' }}
            >
              <h2 className="text-xl font-bold text-[white] text-center mb-2">오늘의 감정은?</h2>
              <p className="text-sm text-[white] text-center" style={{ marginBottom: '24px' }}>
                오늘 하루를 한 가지 감정으로 표현해볼까요?
              </p>
              <div className="flex justify-between" style={{ gap: '8px', marginBottom: '20px' }}>
                {(Object.entries(EMOTION_COLORS) as [Emotion, string][]).map(([emotion, color]) => (
                  <button
                    key={emotion}
                    onClick={() => handleSelectEmotion(emotion)}
                    className="flex flex-col items-center transition-all active:scale-93 border-0"
                    style={{
                      flex: 1,
                      paddingTop: '10px',
                      paddingBottom: '10px',
                      paddingLeft: '8px',
                      paddingRight: '8px',
                      borderRadius: '12px',
                      backgroundColor: 'transparent',
                      gap: '6px'
                    }}
                  >
                    <div
                      className="rounded-[8px] flex items-center justify-center"
                      style={{ width: '36px', height: '36px', backgroundColor: color, fontSize: '20px' }}
                    >
                      {EMOTION_EMOJIS[emotion]}
                    </div>
                    <span className="text-[white]" style={{ fontSize: '12px' }}>{emotion}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={handleDontSave}
                className="w-full text-[black] transition-all active:scale-93 border-0"
                style={{
                  marginTop: '20px',
                  paddingTop: '14px',
                  paddingBottom: '14px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '500'
                }}
              >
                저장 안함
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
