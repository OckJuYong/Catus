import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { ROUTES } from '../constants/routes';
import { EMOTION_COLORS, EMOTION_EMOJIS } from '../constants/emotionColors';
import { diaryApi } from '../utils/api';
import { formatDate, getRelativeTime } from '../utils/dateFormat';
import type { Diary, ChatMessage } from '../types';
import HomePage from './HomePage';

export default function DiaryDetailPage() {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();

  // Browser back button handling for modal
  useEffect(() => {
    // Push a new history state when modal opens
    window.history.pushState({ modal: 'diaryDetail' }, '');

    const handlePopState = (event: PopStateEvent) => {
      // Close modal when back button is pressed
      navigate(ROUTES.CALENDAR);
    };

    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  // Fetch diary data
  const { data: diaryData, isLoading, error } = useQuery({
    queryKey: ['diary', 'byDate', date],
    queryFn: async () => {
      if (!date) throw new Error('날짜가 필요합니다.');
      return await diaryApi.getByDate(date);
    },
    enabled: !!date,
    retry: 2,
  });

  const diary: Diary | undefined = diaryData?.diary;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fef9f1] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5F6F52] mx-auto mb-4"></div>
          <p className="text-gray-600">일기를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !diary) {
    return (
      <div className="min-h-screen bg-[#fef9f1] flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">😢 일기를 찾을 수 없습니다</h1>
        <p className="text-gray-600 mb-8">{date} 날짜의 일기가 존재하지 않습니다.</p>
        <button
          onClick={() => navigate(ROUTES.CALENDAR)}
          className="px-6 py-3 bg-[#5F6F52] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          캘린더로 돌아가기
        </button>
      </div>
    );
  }

  const emotionColor = EMOTION_COLORS[diary.emotion] || '#ccc';
  const emotionEmoji = EMOTION_EMOJIS[diary.emotion] || '😐';

  return (
    <>
      {/* Background (HomePage) */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <HomePage />
      </div>

      {/* Diary Detail Modal */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
        }}
      >
        <motion.div
          className="bg-[#F5F5F0] rounded-[24px] w-[90%] max-w-[480px] max-h-[85vh] overflow-hidden flex flex-col shadow-2xl my-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 text-white rounded-t-[24px]"
            style={{ backgroundColor: emotionColor }}
          >
            <button
              onClick={() => navigate(ROUTES.CALENDAR)}
              className="text-2xl w-10 h-10 flex items-center justify-center hover:opacity-70 bg-transparent border-0 text-white"
            >
              ‹
            </button>
            <div className="text-[15px] font-semibold">
              {diary.date && formatDate(diary.date, 'full')}
            </div>
            <button
              onClick={() => navigate(ROUTES.CALENDAR)}
              className="text-2xl w-10 h-10 flex items-center justify-center hover:opacity-70 bg-transparent border-0 text-white"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Emotion & Picture */}
            <div className="text-center">
              <div className="text-6xl mb-3">{emotionEmoji}</div>
              <div
                className="inline-block px-4 py-2 rounded-full text-white font-semibold text-sm"
                style={{ backgroundColor: emotionColor }}
              >
                {diary.emotion}
              </div>
            </div>

            {/* Picture (if exists) */}
            {diary.pictureUrl && (
              <div className="rounded-2xl overflow-hidden shadow-lg bg-white">
                <img
                  src={diary.pictureUrl}
                  alt="그림일기"
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Summary */}
            <div className="bg-white rounded-2xl p-5 shadow-md">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>📝</span>
                <span>오늘의 요약</span>
              </h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {diary.summary}
              </p>
            </div>

            {/* Keywords (if exists) */}
            {diary.content && (
              <div className="bg-white rounded-2xl p-5 shadow-md">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>💬</span>
                  <span>전체 내용</span>
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {diary.content}
                </p>
              </div>
            )}

            {/* Chat Messages (if exists) */}
            {diaryData?.messages && diaryData.messages.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-md">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>💭</span>
                  <span>대화 기록</span>
                </h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {diaryData.messages.map((msg: ChatMessage, idx: number) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                          msg.role === 'user'
                            ? 'bg-[#5F6F52] text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.role === 'user' ? 'text-gray-200' : 'text-gray-500'
                          }`}
                        >
                          {getRelativeTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Created At */}
            <div className="text-center text-sm text-gray-500">
              {diary.createdAt && `작성일: ${formatDate(diary.createdAt, 'datetime')}`}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-[#F5F5F0] p-4 flex gap-3">
            <button
              onClick={() => navigate(ROUTES.CALENDAR)}
              className="flex-1 py-3 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors border border-gray-300"
            >
              캘린더로
            </button>
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="flex-1 py-3 bg-[#5F6F52] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              홈으로
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
