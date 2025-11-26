import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ROUTES } from '../constants/routes';
import { chatApi } from '../utils/api';
import { formatDate } from '../utils/dateFormat';
import { useDarkMode } from '../contexts/DarkModeContext';

// ============================================================================
// 🎨 디자인 확인용 더미데이터 - 배포 전 false로 변경 필요
// ============================================================================
const USE_MOCK_DATA = true;

const MOCK_CHAT_DATA = {
  date: '2025-11-26',
  messages: [
    {
      id: 1,
      userMessage: '오늘 하루 너무 힘들었어 😢',
      aiResponse: '힘든 하루였구나. 어떤 일이 있었는지 이야기해줄 수 있어? 네 마음을 들어줄게.',
      timestamp: '2025-11-26T09:30:00',
    },
    {
      id: 2,
      userMessage: '회사에서 발표를 했는데 긴장해서 실수를 많이 했어. 다들 나를 이상하게 봤을 것 같아.',
      aiResponse: '발표 중에 실수하면 정말 당황스럽지. 하지만 대부분의 사람들은 발표자의 작은 실수를 크게 신경 쓰지 않아. 오히려 용기 내서 발표한 너 자신을 칭찬해주고 싶어.',
      timestamp: '2025-11-26T09:32:00',
    },
    {
      id: 3,
      userMessage: '그래도 자꾸 그 장면이 떠올라서 괴로워',
      aiResponse: '그런 생각이 반복되는 건 자연스러운 거야. 실수한 순간보다는 잘했던 부분을 떠올려보는 건 어때? 분명 준비하면서 노력한 시간이 있었을 거야.',
      timestamp: '2025-11-26T09:35:00',
    },
    {
      id: 4,
      userMessage: '맞아, 밤새 준비했었어. 근데 그게 다 물거품이 된 것 같아서...',
      aiResponse: '밤새 준비할 만큼 열심히 했구나. 그 노력은 절대 물거품이 아니야. 이번 경험을 통해 다음에는 더 잘할 수 있을 거야. 완벽하지 않아도 괜찮아, 성장하고 있는 거니까 🌱',
      timestamp: '2025-11-26T09:38:00',
    },
    {
      id: 5,
      userMessage: '고마워, 네 말 듣고 조금 마음이 편해졌어',
      aiResponse: '다행이다 💚 오늘 하루 고생 많았어. 오늘 밤은 푹 쉬고, 내일은 새로운 마음으로 시작해보자!',
      timestamp: '2025-11-26T09:40:00',
    },
  ],
};
// ============================================================================

export default function ChatDatePage() {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();
  const { isDarkMode } = useDarkMode();

  // 특정 날짜 채팅 조회 (백엔드: GET /api/chat/context/{date})
  const { data: chatData, isLoading, error } = useQuery({
    queryKey: ['chat', 'context', date],
    queryFn: async () => {
      // 🎨 더미데이터 사용 시
      if (USE_MOCK_DATA) {
        return MOCK_CHAT_DATA;
      }
      if (!date) throw new Error('날짜가 필요합니다.');
      return await chatApi.getContextByDate(date);
    },
    enabled: !!date || USE_MOCK_DATA,
    retry: 2,
  });

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
