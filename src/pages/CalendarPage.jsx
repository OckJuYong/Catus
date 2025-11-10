//  CalendarPage.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { EMOTION_COLORS } from "../constants/emotionColors";
import { mockDiaries } from "../mocks/diaryData";
import { useLocalStorage } from "../hooks/useLocalStorage";
import HomePage from "./HomePage";

export default function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [diaryData, setDiaryData] = useLocalStorage('diary_data', {});

  //  Mock diary data from diaryData.js (localStorage가 비어있을 때만)
  useEffect(() => {
    // localStorage에 데이터가 없으면 mock 데이터로 초기화
    if (Object.keys(diaryData).length === 0) {
      const processedData = Object.keys(mockDiaries).reduce((acc, dateKey) => {
        const diary = mockDiaries[dateKey];
        const emotionColorMap = {
          '행복': '#6BCB77',
          '슬픔': '#4D96FF',
          '불안': '#FFD93D',
          '화남': '#FF6B6B',
          '보통': '#9E9E9E'
        };
        const emotionEmojiMap = {
          '행복': '😊',
          '슬픔': '😢',
          '불안': '😰',
          '화남': '😠',
          '보통': '😐'
        };

        acc[dateKey] = {
          ...diary,
          image: `https://via.placeholder.com/100/${emotionColorMap[diary.emotion]?.replace('#', '')}/FFFFFF?text=${emotionEmojiMap[diary.emotion]}`
        };
        return acc;
      }, {});

      setDiaryData(processedData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const calendarDays = [];
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthLastDay - i, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({ day: d, isCurrentMonth: true });
  }
  const remain = 42 - calendarDays.length;
  for (let d = 1; d <= remain; d++) {
    calendarDays.push({ day: d, isCurrentMonth: false });
  }

  const isToday = (d) => {
    const t = new Date();
    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === d;
  };

  const handleDayClick = (d) => {
    if (!d) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (diaryData[dateStr]) navigate(`${ROUTES.DIARY}/${dateStr}`);
  };

  return (
    <>
      {/*  배경 페이지 (홈) */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <HomePage />
      </div>

      {/*  캘린더 모달 */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <motion.div
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                    bg-[#F5F5F0] rounded-[24px] w-[90%] max-w-[360px] 
                    flex flex-col shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >


          {/*  헤더  */}
          <div className="flex items-center justify-between px-4 py-[13px] bg-[#5F6F52] text-white rounded-t-[24px]">
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="text-2xl w-10 h-10 flex items-center justify-center hover:opacity-70 bg-transparent border-0 text-[white]"
            >
              ‹
            </button>
            <div className="text-[15px] font-semibold text-[white]" >캘린더</div>
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="text-2xl w-10 h-10 flex items-center justify-center hover:opacity-70 bg-transparent border-0 text-[white]"
            >
              ×
            </button>
          </div>

          {/*  흰색 캘린더 본문 */}
          <div className="bg-[#FFFFFF] rounded-b-[24px] mt-4 p-4 pb-[6px] flex flex-col shadow-md">
            {/* 월 네비게이션 */}
            <div className="flex items-center justify-between py-[8px] mb-1">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="text-lg p-2 hover:opacity-60 text-gray-600 bg-transparent border-0"
              >
                ‹
              </button>
              <div className="font-semibold text-[14px] text-gray-700">
                {year}년 {month + 1}월
              </div>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="text-lg p-2 hover:opacity-60 text-gray-600 bg-transparent border-0"
              >
                ›
              </button>
            </div>

            {/* 요일 */}
            <div className="grid grid-cols-7 text-center text-[11px] font-semibold mb-1">
              <div className="text-[#FF6B6B]">일</div>
              <div className="text-gray-600">월</div>
              <div className="text-gray-600">화</div>
              <div className="text-gray-600">수</div>
              <div className="text-gray-600">목</div>
              <div className="text-gray-600">금</div>
              <div className="text-[#4D96FF]">토</div>
            </div>

            {/* 날짜 */}
            <div className="grid grid-cols-7 gap-[2px] mb-3">
              {calendarDays.map((d, i) => {
                const dateStr = d.isCurrentMonth
                  ? `${year}-${String(month + 1).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`
                  : null;
                const diary = dateStr ? diaryData[dateStr] : null;
                const today = d.isCurrentMonth && isToday(d.day);

                return (
                  <motion.div
                    key={`${i}-${d.day}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className={`aspect-square flex flex-col items-center justify-start rounded-md transition-all
                      ${!d.isCurrentMonth ? "opacity-30 pointer-events-none" : ""}`}
                  >
                    {/* 날짜 */}
                    <div
                      className={`text-[11px] flex items-center justify-center
                        w-[22px] h-[22px] rounded-full font-semibold transition-all mb-[3px]
                        ${
                          today
                            ? "bg-[#5F6F52] text-white shadow-sm scale-105"
                            : "text-gray-800"
                        }`}
                    >
                      {d.day}
                    </div>

                    {/* 이미지 */}
                    {diary && diary.image && (
                      <div
                        className="w-[26px] h-[26px] rounded-[6px] mt-[2px] flex items-center justify-center border-[2px] overflow-hidden cursor-pointer hover:scale-110 transition-transform"
                        style={{ borderColor: EMOTION_COLORS[diary.emotion] }}
                        onClick={() => handleDayClick(d.day)}
                      >
                        <img src={diary.image} alt="diary" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* 감정 색상 가이드 */}
            <div className="w-[90%] bg-[#f7f7f7] border border-[#E5E5E5] rounded-[12px] py-[4px] px-4 shadow-sm mx-auto mt-3 flex flex-col items-center justify-center">
              <p className="text-[10px] font-semibold text-gray-700 mb-[3px] text-center">
                감정 색상 가이드
              </p>

              <div className="flex justify-center gap-[10px] text-[10px] text-gray-700 mb-[7px]">
                {Object.entries(EMOTION_COLORS).map(([emotion, color]) => (
                  <div key={emotion} className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded-[4px] border border-gray-300"
                      style={{
                        backgroundColor: color || "#000",
                        display: "inline-block",
                        minWidth: "12px",
                        minHeight: "12px",
                      }}
                    />
                    <span>{emotion}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 오늘의 그림일기 쓰기 버튼 */}
          <div className="bg-[#F5F5F0] w-full flex justify-center pb-[6px] pt-[6px] rounded-b-[24px]">
            <button
              className="w-[90%] py-[12px] bg-[#5F6F52] text-[white] rounded-[14px]
                         font-semibold text-[14px] shadow-md hover:opacity-90 transition-all border-0 outline-none"
              onClick={() => navigate(ROUTES.CHAT)}
            >
              오늘의 그림일기 쓰기
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
