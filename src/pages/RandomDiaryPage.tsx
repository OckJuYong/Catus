/**
 * 랜덤 그림일기 페이지
 * 다른 사용자의 익명 일기를 랜덤하게 보여주는 페이지
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { diaryApi, supportApi } from '../utils/api';
import { ROUTES } from '../constants/routes';
import { EMOTION_COLORS, EMOTION_EMOJIS } from '../constants/emotionColors';
import type { Diary, Emotion } from '../types';

export default function RandomDiaryPage() {
  const navigate = useNavigate();
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // 랜덤 일기 조회
  const { data: diary, isLoading, error, refetch } = useQuery({
    queryKey: ['random-diary'],
    queryFn: () => diaryApi.getRandom(),
    retry: false,
  });

  // 새로운 랜덤 일기 불러오기
  const handleRefresh = () => {
    refetch();
  };

  // 익명 메시지 보내기 모달 열기
  const handleSendMessageClick = () => {
    setShowMessageModal(true);
  };

  // 익명 메시지 전송 (랜덤 사용자에게)
  const handleSendMessage = async () => {
    if (!messageContent.trim()) return;

    setIsSending(true);
    try {
      // 랜덤 사용자에게 응원 메시지 전송 (diaryId 불필요)
      await supportApi.send(messageContent, '응원');
      alert('응원 메시지를 전달했어요! 😊');
      setShowMessageModal(false);
      setMessageContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSending(false);
    }
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fef9f1] to-[#f5efe3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#59B464] mx-auto mb-4"></div>
          <p className="text-gray-600">다른 사람의 일기를 찾고 있어요...</p>
        </div>
      </div>
    );
  }

  // 에러 또는 일기 없음
  if (error || !diary) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fef9f1] to-[#f5efe3] flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-gray-600 mb-6">아직 공유된 일기가 없어요 😢</p>
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="px-6 py-3 bg-[#59B464] text-white rounded-full hover:bg-[#4a9654] transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const emotion = diary.emotion as Emotion;
  const emotionColor = EMOTION_COLORS[emotion] || EMOTION_COLORS.보통;
  const emotionEmoji = EMOTION_EMOJIS[emotion] || EMOTION_EMOJIS.보통;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fef9f1] to-[#f5efe3]">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="text-gray-600 hover:text-gray-800"
          >
            ← 뒤로
          </button>
          <h1 className="text-lg font-semibold text-gray-800">랜덤 그림일기</h1>
          <button
            onClick={handleRefresh}
            className="text-[#59B464] hover:text-[#4a9654] font-medium"
          >
            다른 일기
          </button>
        </div>
      </div>

      {/* 일기 내용 */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 날짜 */}
        <div className="text-center mb-4">
          <p className="text-gray-500 text-sm">
            {new Date(diary.date).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* 감정 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: emotionColor + '20' }}>
            <span className="text-2xl">{emotionEmoji}</span>
            <span className="font-medium" style={{ color: emotionColor }}>{emotion}</span>
          </div>
        </div>

        {/* 일기 이미지 */}
        {diary.imageUrl && (
          <div className="mb-6 rounded-2xl overflow-hidden shadow-lg">
            <img
              src={diary.imageUrl}
              alt="Diary illustration"
              className="w-full h-auto"
            />
          </div>
        )}

        {/* 일기 내용 */}
        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {diary.content}
          </p>
        </div>

        {/* 익명 메시지 보내기 버튼 */}
        <div className="text-center">
          <button
            onClick={handleSendMessageClick}
            className="px-8 py-3 bg-[#59B464] text-white rounded-full hover:bg-[#4a9654] transition-colors shadow-md"
          >
            💌 응원 메시지 보내기
          </button>
        </div>
      </div>

      {/* 익명 메시지 모달 */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">익명 응원 메시지</h3>
            <p className="text-sm text-gray-600 mb-4">
              작성자에게 따뜻한 응원의 메시지를 보내보세요!
            </p>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="응원의 한마디를 남겨주세요..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#59B464] mb-4"
              maxLength={200}
            />
            <div className="text-right text-sm text-gray-500 mb-4">
              {messageContent.length}/200
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setMessageContent('');
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
                disabled={isSending}
              >
                취소
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageContent.trim() || isSending}
                className="flex-1 px-4 py-3 bg-[#59B464] text-white rounded-full hover:bg-[#4a9654] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSending ? '전송 중...' : '전송'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
