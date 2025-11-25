import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ROUTES } from '../constants/routes';
import { chatApi } from '../utils/api';
import { formatDate } from '../utils/dateFormat';
import { useDarkMode } from '../contexts/DarkModeContext';

export default function ChatDatePage() {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();
  const { isDarkMode } = useDarkMode();

  // 임시 목 데이터 (디자인 확인용) - 나중에 삭제
  const USE_MOCK = true;
  const mockMessages = [
    {
      id: '1',
      userMessage: '오늘 하루가 너무 힘들었어. 회사에서 프로젝트 마감이 다가오는데 잘 안 풀려서 스트레스 받았어.',
      aiResponse: '힘든 하루를 보냈구나. 프로젝트 마감 압박은 정말 스트레스받을 수 있어. 잠시 쉬어가면서 하나씩 해결해보는 건 어떨까? 넌 충분히 잘하고 있어 💪',
      timestamp: '2025-11-26T10:30:00',
    },
    {
      id: '2',
      userMessage: '고마워. 그래도 네가 있어서 다행이야.',
      aiResponse: '언제든지 이야기해줘. 네 곁에서 항상 응원하고 있을게 🐱',
      timestamp: '2025-11-26T10:32:00',
    },
    {
      id: '3',
      userMessage: '점심은 뭐 먹을까 고민이야',
      aiResponse: '오늘 날씨가 쌀쌀하니까 따뜻한 국물 요리는 어때? 김치찌개나 된장찌개 같은 거! 든든하게 먹고 오후도 파이팅 하자 😊',
      timestamp: '2025-11-26T12:15:00',
    },
  ];

  // 특정 날짜 채팅 조회 (백엔드: GET /api/chat/context/{date})
  const { data: chatData, isLoading, error } = useQuery({
    queryKey: ['chat', 'context', date],
    queryFn: async () => {
      if (!date) throw new Error('날짜가 필요합니다.');
      return await chatApi.getContextByDate(date);
    },
    enabled: !!date && !USE_MOCK,
    retry: 2,
  });

  // 목 데이터 사용시 바로 렌더링
  if (USE_MOCK) {
    const messages = mockMessages;
    return (
      <div
        className="h-[100dvh] flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--color-main-bg)' }}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-[12px] py-[12px] flex-shrink-0"
          style={{ backgroundColor: 'var(--color-bg-card)' }}
        >
          <button
            onClick={() => navigate(ROUTES.CHAT)}
            className="hover:opacity-70 text-[20px] bg-transparent border-0"
            style={{ marginTop: '-5px', color: isDarkMode ? '#FFFFFF' : '#5E7057' }}
          >
            ←
          </button>
          <div
            className="text-[16px] font-[600]"
            style={{ color: isDarkMode ? '#FFFFFF' : '#5E7057' }}
          >
            2025년 11월 26일
          </div>
          <div className="w-[20px]" />
        </div>

        {/* 채팅 메시지 */}
        <div className="flex-1 overflow-y-auto px-[16px] py-[16px]">
          <div className="flex flex-col gap-[16px]">
            {messages.map((msg, index) => (
              <div key={msg.id} className="flex flex-col gap-[12px]">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-[#5E7057] text-[#FFFFFF] rounded-[16px] px-[14px] py-[10px] max-w-[75%]">
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                      {msg.userMessage}
                    </p>
                    <p className="text-[11px] text-[rgba(255,255,255,0.7)] mt-[6px]">
                      {formatDate(msg.timestamp, 'time')}
                    </p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start">
                  <div
                    className="rounded-[16px] px-[14px] py-[10px] max-w-[75%] border"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <p
                      className="text-[14px] leading-relaxed whitespace-pre-wrap"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {msg.aiResponse}
                    </p>
                    <p
                      className="text-[11px] mt-[6px]"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {formatDate(msg.timestamp, 'time')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div
          className="flex-shrink-0 px-[16px] py-[12px] border-t"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex gap-[12px]">
            <button
              onClick={() => navigate(ROUTES.CHAT)}
              className="flex-1 py-[12px] rounded-[12px] text-[14px] font-[500] border"
              style={{
                backgroundColor: 'var(--color-main-bg)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              채팅으로
            </button>
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="flex-1 py-[12px] bg-[#5E7057] text-[#FFFFFF] rounded-[12px] text-[14px] font-[500] border-0"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className="h-[100dvh] flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-main-bg)' }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-[48px] w-[48px] border-b-2 border-[#5E7057] mx-auto mb-[16px]"></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>채팅을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !chatData) {
    return (
      <div
        className="h-[100dvh] flex flex-col items-center justify-center p-[16px]"
        style={{ backgroundColor: 'var(--color-main-bg)' }}
      >
        <h1
          className="text-[20px] font-[600] mb-[16px]"
          style={{ color: 'var(--color-text-primary)' }}
        >
          😢 채팅을 불러올 수 없습니다
        </h1>
        <p
          className="text-[14px] mb-[32px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          해당 날짜의 채팅 기록을 찾을 수 없습니다.
        </p>
        <button
          onClick={() => navigate(ROUTES.CHAT)}
          className="px-[24px] py-[12px] bg-[#5E7057] text-[#FFFFFF] rounded-[12px] text-[14px] font-[500] border-0 hover:opacity-90"
        >
          채팅으로 돌아가기
        </button>
      </div>
    );
  }

  const messages = chatData.messages || [];

  return (
    <div
      className="h-[100dvh] flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--color-main-bg)' }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-[12px] py-[12px] flex-shrink-0"
        style={{ backgroundColor: 'var(--color-bg-card)' }}
      >
        <button
          onClick={() => navigate(ROUTES.CHAT)}
          className="hover:opacity-70 text-[20px] bg-transparent border-0"
          style={{ marginTop: '-5px', color: isDarkMode ? '#FFFFFF' : '#5E7057' }}
        >
          ←
        </button>
        <div
          className="text-[16px] font-[600]"
          style={{ color: isDarkMode ? '#FFFFFF' : '#5E7057' }}
        >
          {chatData.date && formatDate(chatData.date, 'full')}
        </div>
        <div className="w-[20px]" />
      </div>

      {/* 채팅 메시지 */}
      <div className="flex-1 overflow-y-auto px-[16px] py-[16px]">
        {messages.length === 0 ? (
          <div className="text-center py-[64px]">
            <div className="text-[48px] mb-[16px]">💬</div>
            <p
              className="text-[16px] mb-[8px]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              이 날짜의 대화가 없습니다
            </p>
            <p
              className="text-[13px]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              다른 날짜를 선택해주세요
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-[16px]">
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex flex-col gap-[12px]"
              >
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-[#5E7057] text-[#FFFFFF] rounded-[16px] px-[14px] py-[10px] max-w-[75%]">
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                      {msg.userMessage}
                    </p>
                    <p className="text-[11px] text-[rgba(255,255,255,0.7)] mt-[6px]">
                      {formatDate(msg.timestamp, 'time')}
                    </p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start">
                  <div
                    className="rounded-[16px] px-[14px] py-[10px] max-w-[75%] border"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <p
                      className="text-[14px] leading-relaxed whitespace-pre-wrap"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {msg.aiResponse}
                    </p>
                    <p
                      className="text-[11px] mt-[6px]"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {formatDate(msg.timestamp, 'time')}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div
        className="flex-shrink-0 px-[16px] py-[12px] border-t"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex gap-[12px]">
          <button
            onClick={() => navigate(ROUTES.CHAT)}
            className="flex-1 py-[12px] rounded-[12px] text-[14px] font-[500] border"
            style={{
              backgroundColor: 'var(--color-main-bg)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            채팅으로
          </button>
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="flex-1 py-[12px] bg-[#5E7057] text-[#FFFFFF] rounded-[12px] text-[14px] font-[500] border-0"
          >
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
}
