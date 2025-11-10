import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/common";
import { ROUTES } from "../constants/routes";
import { useLocalStorage } from "../hooks/useLocalStorage";
import HomePage from "./HomePage";

export default function LetterPage() {
  const navigate = useNavigate();
  const [receivedMessages] = useLocalStorage("received_messages", []);
  const [diaryData] = useLocalStorage("diary_data", {});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // 현재 표시할 메시지
  const currentMessage = receivedMessages.length > 0
    ? receivedMessages[currentIndex]
    : {
        text: "응원 메시지가 없습니다.",
        date: new Date().toLocaleString(),
      };

  // 이전 메시지로 이동
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
    }
  };

  // 다음 메시지로 이동
  const handleNext = () => {
    if (currentIndex < receivedMessages.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
    }
  };

  // 메시지와 연결된 일기 이미지 가져오기 (임시로 랜덤 일기 이미지 사용)
  const getDiaryImage = () => {
    const diaryEntries = Object.values(diaryData);
    if (diaryEntries.length > 0) {
      const randomDiary = diaryEntries[Math.floor(Math.random() * diaryEntries.length)];
      return randomDiary?.image || "https://via.placeholder.com/260x260/F9F9F9/8B9A8E?text=그림일기";
    }
    return "https://via.placeholder.com/260x260/F9F9F9/8B9A8E?text=그림일기";
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}월 ${day}일의 그림일기`;
  };

  const totalMessages = receivedMessages.length;

  return (
    <>
      {/* 백그라운드로 HomePage 렌더링 */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <HomePage />
      </div>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <motion.div
          className="relative bg-[#F5F5F0] rounded-[24px] w-[90%] max-w-[360px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          style={{ perspective: '1200px' }}
        >
          {/* 편지 봉투 뚜껑 (직사각형) */}
          <motion.div
  style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '80px',
    backgroundColor: '#C9A961',
    borderRadius: '24px 24px 0 0',
    transformOrigin: 'top center',
    transformStyle: 'preserve-3d',
    zIndex: 10,
    pointerEvents: 'none', // ✅ 클릭 막지 않게
  }}
  initial={{ rotateX: 0, opacity: 1 }}
  animate={{ rotateX: -120, opacity: 0 }}
  transition={{ delay: 0.3, duration: 0.7, ease: "easeInOut" }}
/>

          {/* 편지 내용 */}
          <motion.div
            className="overflow-y-auto flex-1"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            {/* 헤더 */}
            <div className="px-[16px] pt-[12px] pb-[12px] flex items-start justify-between">
              <div className="text-left">
                <h2 className="text-[13px] font-semibold text-gray-800">
                  {formatDate(currentMessage.date)}
                </h2>
              </div>
              <button
                onClick={() => navigate(ROUTES.HOME)}
                className="text-gray-500 hover:text-gray-700 text-[26px] leading-none bg-transparent border-0"
              >
                ×
              </button>
            </div>

            {/* 그림일기 이미지 */}
            <div className="px-[16px] mb-[12px]" style={{ position: 'relative', overflow: 'hidden' }}>
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="bg-white p-[12px] rounded-xl shadow-sm border border-gray-200"
                >
                  <img
                    src={getDiaryImage()}
                    alt="일기 그림"
                    className="w-full h-[260px] rounded-md object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* 네비게이션 영역 */}
            {totalMessages > 1 && (
              <div
                className="mb-[12px] px-[16px] flex items-center justify-between"
                style={{
                  zIndex: 50,
                  position: "relative",
                }}
              >
                {/* 좌측 화살표 */}
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="w-[32px] h-[32px] rounded-full bg-[#EAEAEA] text-gray-800 flex items-center justify-center
                            disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#DADADA] transition-all"
                  style={{
                    fontSize: "20px",
                    lineHeight: "1",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)",
                    border: "none"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.15)"}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)"}
                >
                  ‹
                </button>

                {/* 페이지 인디케이터 */}
                {totalMessages <= 7 ? (
                  // 7개 이하: 모든 원 표시 (고정)
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      minWidth: '80px',
                      height: '32px'
                    }}
                  >
                    {receivedMessages.map((_, index) => (
                      <div
                        key={index}
                        style={{
                          width: index === currentIndex ? '8px' : '6px',
                          height: index === currentIndex ? '8px' : '6px',
                          borderRadius: '50%',
                          backgroundColor: index === currentIndex ? '#000000' : '#9CA3AF',
                          flexShrink: 0,
                          transition: 'all 0.3s'
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  // 8개 이상: 슬라이딩 인디케이터
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      width: '80px',
                      height: '32px',
                      overflow: 'hidden',
                      paddingLeft: '6px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'transform 0.3s ease-in-out',
                        transform: (() => {
                          const total = receivedMessages.length;
                          // 처음 3개는 왼쪽 정렬 (translateX = 0)
                          if (currentIndex <= 2) return 'translateX(0px)';
                          // 마지막 3개는 오른쪽 정렬
                          if (currentIndex >= total - 3) {
                            // 전체 너비에서 컨테이너 너비를 뺀 만큼 이동
                            const offset = (total - 6) * 12;
                            return `translateX(-${offset}px)`;
                          }
                          // 중간은 현재 인덱스가 약간 왼쪽에 오도록 (3번째 위치)
                          return `translateX(-${(currentIndex - 2) * 12}px)`;
                        })()
                      }}
                    >
                      {receivedMessages.map((_, index) => (
                        <div
                          key={index}
                          style={{
                            width: index === currentIndex ? '8px' : '6px',
                            height: index === currentIndex ? '8px' : '6px',
                            borderRadius: '50%',
                            backgroundColor: index === currentIndex ? '#000000' : '#9CA3AF',
                            flexShrink: 0,
                            transition: 'all 0.3s'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 우측 화살표 */}
                <button
                  onClick={handleNext}
                  disabled={currentIndex === totalMessages - 1}
                  className="w-[32px] h-[32px] rounded-full bg-[#EAEAEA] text-gray-800 flex items-center justify-center
                            disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#DADADA] transition-all"
                  style={{
                    fontSize: "20px",
                    lineHeight: "1",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)",
                    border: "none"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.15)"}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)"}
                >
                  ›
                </button>
              </div>
            )}



            {/* 메시지 내용 */}
            <div className="px-[16px] pb-[20px] relative" style={{ overflow: 'hidden' }}>
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={currentIndex + '-message'}
                  custom={direction}
                  initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <p className="text-[13px] text-gray-700 mb-[4px] leading-relaxed whitespace-pre-line">
                    {currentMessage.text}
                  </p>
                  <p className="text-[11px] text-[#6B6B6B]">- 익명의 친구로부터</p>
                </motion.div>
              </AnimatePresence>

              {/* 메시지 개수 표시 */}
              {totalMessages > 1 && (
                <div className="absolute bottom-[20px] right-[16px] text-[10px] text-gray-400">
                  {totalMessages}개의 메시지
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
