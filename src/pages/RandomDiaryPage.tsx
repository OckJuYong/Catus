/**
 * 랜덤 그림일기 페이지
 * 다른 사용자의 익명 일기를 랜덤하게 보여주는 페이지
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { diaryApi, messageApi } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import { ROUTES } from '../constants/routes';
import { EMOTION_COLORS } from '../constants/emotionColors';
import HomePage from './HomePage';
import airplaneSvg from '../assets/images/airplane.svg';
import footprintIcon from '../assets/images/footprint.svg';
import type { DiaryRandomResponse, Emotion } from '../types';

export default function RandomDiaryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [messageContent, setMessageContent] = useState('');
  const [showMessagePreview, setShowMessagePreview] = useState(false);
  const [showPlaneAnimation, setShowPlaneAnimation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const maxMessageLength = 200;

  // 랜덤 일기 조회 (백엔드 응답: {diaryId, title, date, previewText, thumbnailUrl})
  const { data: diaryResponse, isLoading, error, refetch } = useQuery<DiaryRandomResponse>({
    queryKey: ['random-diary'],
    queryFn: () => diaryApi.getRandom(),
    retry: false,
  });

  // API 응답 구조에 맞게 diary 추출
  const diary = (diaryResponse as any)?.diary || diaryResponse;

  // 일기를 보면 localStorage에 저장 (다음에 같은 일기 안 보이게)
  const diaryId = diary?.diaryId || diary?.id;
  useEffect(() => {
    if (diaryId) {
      localStorage.setItem('lastRandomDiaryId', String(diaryId));
    }
  }, [diaryId]);

  // 새로운 랜덤 일기 불러오기
  const handleRefresh = () => {
    queryClient.removeQueries({ queryKey: ['random-diary'] });
    refetch();
  };

  // 메시지 미리보기
  const handleMessagePreview = () => {
    if (!messageContent.trim()) {
      showToast('응원 메시지를 입력해주세요!', 'warning');
      return;
    }
    setShowMessagePreview(true);
  };

  // 익명 메시지 전송 (백엔드: POST /api/message/send)
  const handleConfirmSend = async () => {
    if (!messageContent.trim() || !diary) return;

    setIsSending(true);
    try {
      // 종이비행기 애니메이션 시작
      setShowPlaneAnimation(true);

      // 백엔드 파라미터: diaryId, content
      await messageApi.send(diaryId, messageContent);

      // 애니메이션 후 페이지 이동
      setTimeout(() => {
        navigate(ROUTES.HOME);
      }, 2000);
    } catch (error) {
      console.error('Failed to send message:', error);
      setShowPlaneAnimation(false);
      showToast('메시지 전송에 실패했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // 로딩 중
  if (isLoading) {
    return (
      <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <HomePage />
        </div>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E7057] mx-auto mb-4"></div>
            <p style={{ color: 'var(--color-text-secondary)' }}>다른 사람의 일기를 찾고 있어요...</p>
          </div>
        </div>
      </>
    );
  }

  // 에러 또는 일기 없음
  if (error || !diary) {
    return (
      <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <HomePage />
        </div>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="text-center p-8">
            <p style={{ color: 'var(--color-text-secondary)' }} className="mb-6">
              아직 공유된 일기가 없어요 😢
            </p>
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="px-6 py-3 bg-[#5E7057] text-white rounded-lg hover:opacity-90 transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </>
    );
  }

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}월 ${date.getDate()}일 작성됨`;
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <HomePage />
      </div>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          isolation: 'isolate',
        }}
      >
        {!showPlaneAnimation && (
          <motion.div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                       rounded-[24px] w-[90%] max-w-[360px]
                       flex flex-col shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-bg-card)' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="px-[16px] pt-[12px] pb-[12px] flex items-start justify-between">
              <div className="text-left">
                <div className="flex items-center gap-[4px]">
                  <h2
                    className="text-[13px] font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    누군가의 그림일기
                  </h2>
                  <div
                    className="w-[14px] h-[14px]"
                    style={{
                      backgroundColor: (diary as any).emotion
                        ? EMOTION_COLORS[(diary as any).emotion as Emotion]
                        : '#9E9E9E',
                      WebkitMaskImage: `url(${footprintIcon})`,
                      WebkitMaskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskImage: `url(${footprintIcon})`,
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                    }}
                  />
                </div>
                <p
                  className="text-[11px] mt-[2px]"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {(diary.diaryDate || diary.date) && formatDate(diary.diaryDate || diary.date)}
                </p>
              </div>
              <div className="flex items-center gap-[8px]">
                {/* 새로고침 버튼 */}
                <button
                  onClick={handleRefresh}
                  className="text-[17px] leading-none bg-transparent border-0 hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--color-text-secondary)', marginTop: '2px' }}
                >
                  ↻
                </button>
                {/* 닫기 버튼 */}
                <button
                  onClick={() => navigate(ROUTES.HOME)}
                  className="text-[26px] leading-none bg-transparent border-0"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* 그림 */}
            <div className="px-[16px] mb-[16px]">
              {(diary.image || diary.thumbnailUrl) ? (
                <img
                  src={diary.image || diary.thumbnailUrl}
                  alt="일기 그림"
                  className="w-full h-[260px] rounded-[12px] object-cover"
                />
              ) : (
                <div
                  className="w-full h-[260px] rounded-[12px] flex items-center justify-center"
                  style={{ backgroundColor: '#F9F9F9' }}
                >
                  <span style={{ color: '#8B9A8E' }}>일기 그림</span>
                </div>
              )}
            </div>

            {/* 응원 메시지 입력 영역 */}
            <div className="px-[16px] pb-[20px]">
              {!showMessagePreview ? (
                <>
                  <p
                    className="text-[12px] mb-[8px] text-left"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    따뜻한 응원의 메시지를 남겨주세요. ({maxMessageLength}자 이내)
                  </p>

                  {/* 입력창 */}
                  <textarea
                    className="w-full px-[12px] py-[8px] text-sm rounded-[8px] border focus:outline-none resize-none mb-[8px]"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-bg-card)',
                      color: 'var(--color-text-primary)',
                      minHeight: '80px',
                    }}
                    placeholder="익명의 응원 메시지 작성..."
                    value={messageContent}
                    onChange={(e) =>
                      setMessageContent(e.target.value.slice(0, maxMessageLength))
                    }
                    maxLength={maxMessageLength}
                  />

                  {/* 글자 수 + 전송 버튼 */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {messageContent.length}/{maxMessageLength}
                    </span>
                    <button
                      onClick={handleMessagePreview}
                      className="px-[16px] py-[8px] bg-[#2D2D2D] text-[#FFFFFF] text-sm font-medium rounded-[8px] hover:bg-gray-800 transition-colors"
                    >
                      전송
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* 미리보기 */}
                  <div className="mb-[12px]">
                    <p
                      className="text-[13px] mb-[4px]"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {messageContent}
                    </p>
                    <p
                      className="text-[11px]"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      - 익명의 집사로부터
                    </p>
                  </div>

                  <div className="flex justify-end gap-[8px]">
                    <button
                      onClick={() => setShowMessagePreview(false)}
                      className="px-[20px] py-[8px] bg-[#2D2D2D] text-[#FFFFFF] text-sm font-medium rounded-[8px] hover:bg-gray-800 transition-colors"
                      disabled={isSending}
                    >
                      수정
                    </button>
                    <button
                      onClick={handleConfirmSend}
                      className="px-[20px] py-[8px] bg-[#2D2D2D] text-[#FFFFFF] text-sm font-medium rounded-[8px] hover:bg-gray-800 transition-colors disabled:opacity-50"
                      disabled={isSending}
                    >
                      {isSending ? '전송 중...' : '확인'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* 종이비행기 애니메이션 */}
      {showPlaneAnimation && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            pointerEvents: 'none',
          }}
        >
          <motion.div
            style={{
              position: 'absolute',
              bottom: '20%',
              right: '10%',
              width: '120px',
              height: '120px',
            }}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 0.3,
              rotate: -30,
            }}
            animate={{
              x: [0, -600, 400],
              y: [0, -100, -500],
              opacity: [1, 1, 1, 1, 0],
              scale: [0.3, 1, 1.2, 1.2, 1],
              rotate: [-30, -10, 45],
            }}
            transition={{
              duration: 2,
              times: [0, 0.3, 0.6, 0.9, 1],
              ease: 'easeInOut',
            }}
          >
            <img
              src={airplaneSvg}
              alt="airplane"
              style={{
                width: '80px',
                height: '80px',
              }}
            />
          </motion.div>
        </div>
      )}
    </>
  );
}
