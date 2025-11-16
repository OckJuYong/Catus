import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useDarkMode } from "../contexts/DarkModeContext";
import drawCat from "../assets/images/draw-cat.png";
import canvas from "../assets/images/canvas.png";

export default function DiaryRevealPage() {
  const navigate = useNavigate();
  const { date } = useParams();
  const { isDarkMode } = useDarkMode();
  const [diaryData, setDiaryData] = useLocalStorage("diary_data", {});
  const [showImage, setShowImage] = useState(false);

  const diary = diaryData[date];

  useEffect(() => {
    // 일기를 조회했다고 표시
    if (diary && !diary.isViewed) {
      setDiaryData({
        ...diaryData,
        [date]: {
          ...diary,
          isViewed: true
        }
      });
    }

    // 이미지 애니메이션
    const timer = setTimeout(() => {
      setShowImage(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split("-");
    return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
  };

  const handleClose = () => {
    navigate(ROUTES.CALENDAR);
  };

  const handleViewDetail = () => {
    navigate(`${ROUTES.DIARY}/${date}`);
  };

  if (!diary) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-main-bg)' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>일기를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: isDarkMode ? '#2a2a2a' : 'var(--color-main-bg)' }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-[12px] py-[12px]" style={{ backgroundColor: isDarkMode ? '#1f1f1f' : 'var(--color-bg-card)' }}>
        <div style={{ width: '24px' }}></div>
        <div className="text-[16px] font-[600] text-[#5E7057]">
          {formatDate(date)}
        </div>
        <button
          onClick={handleClose}
          className="text-[20px] text-[#5E7057] hover:opacity-70 bg-transparent border-0"
        >
          ×
        </button>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-[20px] relative">
        {/* 고양이 + 캔버스 컨테이너 */}
        <div className="relative flex items-end justify-center" style={{ width: '100%', maxWidth: '450px' }}>
          {/* 그림 그리는 고양이 */}
          <motion.img
            src={drawCat}
            alt="drawing cat"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{
              width: '57%',
              maxWidth: '250px',
              height: 'auto',
              marginRight: '-27%',
              zIndex: 2,
              filter: isDarkMode
                ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5)) brightness(1.1)'
                : 'drop-shadow(0 2px 10px rgba(0, 0, 0, 0.1))'
            }}
          />

          {/* 캔버스 배경 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
            style={{ width: '80%', maxWidth: '350px', zIndex: 1 }}
          >
            {/* 캔버스 이미지 */}
            <img
              src={canvas}
              alt="canvas"
              className="w-full h-auto"
              style={{ filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.15))' }}
            />

            {/* 캔버스 안의 일기 이미지 */}
            <div
              className="absolute"
              style={{
                top: '4%',
                left: '23%',
                width: '55%',
                height: '70%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(7deg)',
                overflow: 'hidden'
              }}
            >
              <motion.div
                initial={{
                  clipPath: 'polygon(0 0, 0 0, 0 0)'
                }}
                animate={{
                  clipPath: showImage ? [
                    'polygon(0 0, 0 0, 0 0)',
                    'polygon(0 0, 15% 0, 13% 3%, 17% 6%, 14% 9%, 18% 12%, 0 18%)',
                    'polygon(0 0, 30% 0, 28% 3%, 32% 6%, 29% 9%, 33% 12%, 27% 18%, 31% 21%, 28% 24%, 32% 27%, 0 36%)',
                    'polygon(0 0, 45% 0, 43% 3%, 47% 6%, 44% 9%, 48% 12%, 42% 18%, 46% 21%, 43% 24%, 47% 27%, 40% 36%, 44% 39%, 41% 42%, 45% 45%, 0 54%)',
                    'polygon(0 0, 60% 0, 58% 3%, 62% 6%, 59% 9%, 63% 12%, 57% 18%, 61% 21%, 58% 24%, 62% 27%, 55% 36%, 59% 39%, 56% 42%, 60% 45%, 52% 54%, 56% 57%, 53% 60%, 57% 63%, 0 72%)',
                    'polygon(0 0, 75% 0, 73% 3%, 77% 6%, 74% 9%, 78% 12%, 72% 18%, 76% 21%, 73% 24%, 77% 27%, 70% 36%, 74% 39%, 71% 42%, 75% 45%, 67% 54%, 71% 57%, 68% 60%, 72% 63%, 62% 72%, 66% 75%, 63% 78%, 67% 81%, 0 90%)',
                    'polygon(0 0, 90% 0, 88% 3%, 92% 6%, 89% 9%, 93% 12%, 87% 18%, 91% 21%, 88% 24%, 92% 27%, 85% 36%, 89% 39%, 86% 42%, 90% 45%, 82% 54%, 86% 57%, 83% 60%, 87% 63%, 77% 72%, 81% 75%, 78% 78%, 82% 81%, 70% 90%, 74% 93%, 71% 96%, 75% 99%, 0 100%)',
                    'polygon(0 0, 100% 0, 98% 3%, 100% 6%, 97% 9%, 100% 12%, 93% 21%, 97% 24%, 100% 27%, 90% 36%, 94% 39%, 91% 42%, 95% 45%, 87% 54%, 91% 57%, 88% 60%, 92% 63%, 82% 72%, 86% 75%, 83% 78%, 87% 81%, 75% 90%, 79% 93%, 76% 96%, 80% 99%, 60% 100%, 0 100%)',
                    'polygon(0 0, 100% 0, 100% 9%, 100% 12%, 97% 21%, 100% 24%, 100% 27%, 94% 36%, 98% 39%, 95% 42%, 99% 45%, 91% 54%, 95% 57%, 92% 60%, 96% 63%, 86% 72%, 90% 75%, 87% 78%, 91% 81%, 79% 90%, 83% 93%, 80% 96%, 84% 99%, 70% 100%, 30% 100%, 0 100%)',
                    'polygon(0 0, 100% 0, 100% 27%, 98% 36%, 100% 39%, 99% 42%, 100% 45%, 95% 54%, 99% 57%, 96% 60%, 100% 63%, 90% 72%, 94% 75%, 91% 78%, 95% 81%, 83% 90%, 87% 93%, 84% 96%, 88% 99%, 78% 100%, 50% 100%, 0 100%)',
                    'polygon(0 0, 100% 0, 100% 45%, 99% 54%, 100% 57%, 100% 60%, 100% 63%, 94% 72%, 98% 75%, 95% 78%, 99% 81%, 87% 90%, 91% 93%, 88% 96%, 92% 99%, 85% 100%, 70% 100%, 0 100%)',
                    'polygon(0 0, 100% 0, 100% 63%, 98% 72%, 100% 75%, 99% 78%, 100% 81%, 91% 90%, 95% 93%, 92% 96%, 96% 99%, 90% 100%, 0 100%)',
                    'polygon(0 0, 100% 0, 100% 81%, 95% 90%, 99% 93%, 96% 96%, 100% 99%, 97% 100%, 0 100%)',
                    'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
                  ] : 'polygon(0 0, 0 0, 0 0)'
                }}
                transition={{
                  duration: 5,
                  ease: "linear",
                  times: [0, 0.07, 0.14, 0.21, 0.28, 0.35, 0.42, 0.5, 0.58, 0.66, 0.74, 0.82, 0.9, 1]
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  opacity: showImage ? 1 : 0
                }}
              >
                <img
                  src={diary.image}
                  alt="diary"
                  className="w-full h-full object-contain"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* 하단 버튼 */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showImage ? 1 : 0, y: showImage ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 5.8 }}
          onClick={handleViewDetail}
          className="mt-[40px] px-[32px] py-[14px] rounded-[14px] text-[15px] font-semibold border-0"
          style={{
            backgroundColor: '#5F6F52',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          일기 자세히 보기
        </motion.button>
      </div>
    </div>
  );
}
