//  CalendarPage.tsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { ROUTES } from "../constants/routes";
import { EMOTION_COLORS } from "../constants/emotionColors";
import { useDiaryList } from "../hooks/useDiary";
import { useDarkMode } from "../contexts/DarkModeContext";
import HomePage from "./HomePage";
import type { Emotion } from "../types";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function CalendarPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const [currentDate, setCurrentDate] = useState<Value>(new Date());
  const [showModeModal, setShowModeModal] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'feed'>('calendar');
  const [feedFilter, setFeedFilter] = useState<'my' | 'public'>('my');
  const [calendarTutorialShown, setCalendarTutorialShown] = useState(() => {
    return localStorage.getItem('calendar_tutorial_shown') === 'true';
  });
  const [showCalendarTutorial, setShowCalendarTutorial] = useState(false);

  // 현재 표시 중인 년/월
  const displayDate = currentDate instanceof Date ? currentDate : new Date();
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth() + 1;

  // Fetch real diary data from API
  const { diaries: diaryData, loading, isFetching } = useDiaryList(year, month);

  // 캘린더 튜토리얼 표시 - 캘린더가 완전히 렌더링된 후에 시작
  useEffect(() => {
    if (!calendarTutorialShown && !loading) {
      // 캘린더 모달 애니메이션(300ms) + 여유 시간
      const timer = setTimeout(() => {
        // 메뉴 버튼이 실제로 렌더링되었는지 확인
        const menuButton = document.querySelector('.calendar-menu-button');
        if (menuButton) {
          setShowCalendarTutorial(true);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [calendarTutorialShown, loading]);

  // Browser back button handling for modal
  useEffect(() => {
    window.history.pushState({ modal: 'calendar' }, '');

    const handlePopState = () => {
      navigate(ROUTES.HOME);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  const handleDayClick = (date: Date): void => {
    const clickedYear = date.getFullYear();
    const clickedMonth = date.getMonth() + 1;
    const day = date.getDate();
    const dateStr = `${clickedYear}-${String(clickedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (diaryData && diaryData[dateStr]) {
      navigate(`${ROUTES.DIARY}/${diaryData[dateStr].id}`);
    }
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    const tileYear = date.getFullYear();
    const tileMonth = date.getMonth() + 1;
    const day = date.getDate();
    const dateStr = `${tileYear}-${String(tileMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const diary = diaryData ? diaryData[dateStr] : null;

    if (diary && diary.thumbnailUrl) {
      return (
        <div
          className="absolute inset-[3px] rounded-[6px] overflow-hidden border-[2px]"
          style={{ borderColor: EMOTION_COLORS[(diary as any).emotion as Emotion] || '#ccc' }}
        >
          <img
            src={diary.thumbnailUrl}
            alt="diary"
            className="w-full h-full object-cover"
            style={{ opacity: 0.5 }}
          />
        </div>
      );
    }
    return null;
  };

  // viewMode 저장
  useEffect(() => {
    localStorage.setItem('calendar_view_mode', viewMode);
  }, [viewMode]);

  // viewMode 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('calendar_view_mode');
    if (saved === 'calendar' || saved === 'feed') {
      setViewMode(saved);
    }
  }, []);

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
                    rounded-[24px] w-[90%] max-w-[360px]
                    flex flex-col shadow-2xl overflow-hidden"
          style={{ backgroundColor: 'transparent', zIndex: 1001 }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >

          {/*  헤더  */}
          <div className="flex items-center justify-between px-[15px] py-[13px] bg-[#5F6F52] text-[white] rounded-t-[24px]">
            <button
              onClick={() => setShowModeModal(true)}
              className="calendar-menu-button text-2xl w-10 h-10 flex items-center justify-center hover:opacity-70 bg-transparent border-0 text-[white]"
            >
              ⋮
            </button>
            <div className="text-[15px] font-[600] text-[white]">{viewMode === 'calendar' ? '캘린더' : '피드'}</div>
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="text-[15px] w-10 h-10 flex items-center justify-center hover:opacity-70 bg-transparent border-0 text-[white]"
            >
              ×
            </button>
          </div>

          {/*  본문 */}
          <div className="pb-[12px] mb-0 flex flex-col shadow-md relative z-10" style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '0 0 24px 24px' }}>
            {viewMode === 'calendar' ? (
              <div className="relative" style={{ minHeight: '340px' }}>
                {loading && !Object.keys(diaryData).length && (
                  <div
                    className="absolute flex items-center justify-center z-10"
                    style={{
                      top: '52px',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'var(--color-bg-card)'
                    }}
                  >
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5F6F52]"></div>
                  </div>
                )}
                <Calendar
                    key={`${year}-${month}`}
                    value={currentDate}
                    onActiveStartDateChange={({ activeStartDate }) => activeStartDate && setCurrentDate(activeStartDate)}
                    onClickDay={handleDayClick}
                    tileContent={tileContent}
                    locale="en-US"
                    formatDay={(locale, date) => date.getDate().toString()}
                    formatShortWeekday={(locale, date) => {
                      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
                      return weekdays[date.getDay()];
                    }}
                    formatMonthYear={(locale, date) => {
                      const y = date.getFullYear();
                      const m = date.getMonth() + 1;
                      return `${y}년 ${m}월`;
                    }}
                    tileClassName={({ date, view }) => {
                      if (view === 'month') {
                        const day = date.getDay();
                        if (day === 0) return 'sunday';
                        if (day === 6) return 'saturday';
                      }
                      return null;
                    }}
                    next2Label={null}
                    prev2Label={null}
                  />
              </div>
            ) : (
              /* 피드 모드 */
              <div className="w-[90%] mx-auto" style={{ height: '320px', minHeight: '320px' }}>
                {/* 탭 메뉴 */}
                <div className="flex gap-[8px] mb-[12px] pt-[12px]">
                  <button
                    onClick={() => setFeedFilter('my')}
                    className="flex-1 py-[8px] rounded-[8px] text-[13px] font-medium transition-all border-0"
                    style={{
                      backgroundColor: feedFilter === 'my' ? '#5F6F52' : 'transparent',
                      color: feedFilter === 'my' ? 'white' : 'var(--color-text-secondary)'
                    }}
                  >
                    내 일기
                  </button>
                  <button
                    onClick={() => setFeedFilter('public')}
                    className="flex-1 py-[8px] rounded-[8px] text-[13px] font-medium transition-all border-0"
                    style={{
                      backgroundColor: feedFilter === 'public' ? '#5F6F52' : 'transparent',
                      color: feedFilter === 'public' ? 'white' : 'var(--color-text-secondary)'
                    }}
                  >
                    공개한 일기
                  </button>
                </div>

                {/* 일기 그리드 */}
                <div className="overflow-y-auto pb-[12px]" style={{ height: 'calc(100% - 50px)' }}>
                  {loading ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5F6F52]"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {diaryData && Object.entries(diaryData)
                        .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                        .filter(([, diary]) => {
                          if (feedFilter === 'my') return true;
                          if (feedFilter === 'public') return !(diary as any).isPrivate;
                          return true;
                        })
                        .map(([dateKey, diary]) => (
                          <motion.div
                            key={dateKey}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-[8px] overflow-hidden shadow-sm border cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
                            onClick={() => navigate(`${ROUTES.DIARY}/${diary.id}`)}
                          >
                            {/* 이미지 */}
                            <div className="w-full aspect-square relative overflow-hidden">
                              <img
                                src={diary.thumbnailUrl}
                                alt={diary.title}
                                className="absolute top-0 left-0 w-full h-full object-cover"
                              />
                              {/* 하얀색 사각형 (감정 색상 그림자) */}
                              {(diary as any).emotion && (
                                <div
                                  className="w-[13px] h-[13px] rounded-[4px]"
                                  style={{
                                    position: 'absolute',
                                    top: '3px',
                                    right: '5.5px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    boxShadow: `2.5px 2.5px 0px ${EMOTION_COLORS[(diary as any).emotion as Emotion] || '#ccc'}`
                                  }}
                                />
                              )}
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 감정 색상 가이드 - 캘린더/피드 모드 공통 */}
            <div className="w-[90%] bg-[#f7f7f7] border border-[#E5E5E5] rounded-[12px] py-[4px] px-4 shadow-sm mx-auto mt-3 mb-5 flex flex-col items-center justify-center">
              <p className="text-[10px] font-semibold text-gray-700 mb-[3px] text-center">
                감정 색상 가이드
              </p>

              <div className="flex justify-center gap-[10px] text-[10px] text-gray-700 mb-[7px]">
                {(Object.entries(EMOTION_COLORS) as [Emotion, string][]).map(([emotion, color]) => (
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
          <div className="w-full flex justify-center pb-[6px] pt-[30px] -mt-[24px] rounded-b-[24px]" style={{ backgroundColor: isDarkMode ? '#3a3a3a' : '#f7f7f7' }}>
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

      {/* react-calendar 커스텀 스타일 */}
      <style>{`
        .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
          background: transparent;
        }

        .react-calendar__navigation {
          display: flex;
          height: 44px;
          margin-bottom: 8px;
        }

        .react-calendar__navigation button {
          min-width: 44px;
          background: transparent !important;
          border: none;
          font-size: 18px;
          cursor: pointer;
        }

        .react-calendar__navigation button:hover,
        .react-calendar__navigation button:active,
        .react-calendar__navigation button:focus {
          background: transparent !important;
        }

        .react-calendar__navigation__label {
          font-weight: 600;
          font-size: 14px;
          color: var(--color-text-primary);
          pointer-events: none;
        }

        .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 600;
          font-size: 11px;
          margin-bottom: 4px;
          display: grid !important;
          grid-template-columns: repeat(7, 1fr) !important;
        }

        .react-calendar__month-view__weekdays__weekday {
          padding: 8px 0;
        }

        .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
          color: var(--color-text-secondary);
        }

        .react-calendar__month-view__weekdays__weekday:nth-child(1) abbr {
          color: #FF6B6B;
        }

        .react-calendar__month-view__weekdays__weekday:nth-child(7) abbr {
          color: #4D96FF;
        }

        .react-calendar__month-view__days {
          gap: 2px;
          margin-bottom: 12px;
          display: grid !important;
          grid-template-columns: repeat(7, 1fr) !important;
        }

        .react-calendar__month-view {
          transition: none !important;
        }

        .react-calendar__viewContainer {
          transition: none !important;
        }

        .react-calendar__tile {
          min-height: 50px;
          padding: 0;
          background: transparent;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
          cursor: pointer;
          position: relative;
        }

        .react-calendar__tile abbr {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
          position: relative;
        }


        .react-calendar__tile--now abbr {
          color: #5F6F52;

          transform: scale(1.1);
        }

        .react-calendar__tile--active,
        .react-calendar__tile--active:enabled,
        .react-calendar__tile--active:enabled:focus,
        .react-calendar__tile--active:focus,
        .react-calendar button:focus {
          background: transparent !important;
          outline: none !important;
        }

        .react-calendar__tile--active:enabled:hover {
          background: rgba(95, 111, 82, 0.1) !important;
        }

        .react-calendar__tile--hasActive,
        .react-calendar__tile--hasActive:enabled,
        .react-calendar__tile--hasActive:enabled:focus {
          background: transparent !important;
        }

        .react-calendar__tile:enabled:hover {
          background: rgba(95, 111, 82, 0.1);
        }

        .react-calendar__tile:focus,
        .react-calendar__tile:focus-visible {
          background: transparent !important;
          outline: none !important;
        }

        .react-calendar__tile--neighboringMonth {
          visibility: hidden !important;
          pointer-events: none !important;
        }

        .react-calendar__tile--neighboringMonth abbr {
          display: none !important;
        }

        .react-calendar__month-view__days__day--neighboringMonth {
          visibility: hidden !important;
        }
      `}</style>

      {/* 캘린더 튜토리얼 - ⋮ 버튼 안내 */}
      <AnimatePresence>
        {showCalendarTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 10500,
              pointerEvents: 'none'
            }}
          >
            {/* ⋮ 버튼 스팟라이트 */}
            {(() => {
              const menuButton = document.querySelector('.calendar-menu-button');
              if (!menuButton) return null;
              const rect = menuButton.getBoundingClientRect();
              const messageWidth = 240;
              const padding = 8;

              const buttonCenterX = rect.left + rect.width / 2;
              const messageLeft = Math.max(20, Math.min(window.innerWidth - messageWidth - 20, buttonCenterX - messageWidth / 2));
              const messageTop = rect.bottom + 16;

              const handleClose = () => {
                localStorage.setItem('calendar_tutorial_shown', 'true');
                setCalendarTutorialShown(true);
                setShowCalendarTutorial(false);
              };

              return (
                <>
                  {/* 오버레이 배경 */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${rect.top - padding}px`,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      pointerEvents: 'all'
                    }}
                    onClick={handleClose}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: `${rect.top - padding}px`,
                      left: 0,
                      width: `${rect.left - padding}px`,
                      height: `${rect.height + padding * 2}px`,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      pointerEvents: 'all'
                    }}
                    onClick={handleClose}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: `${rect.top - padding}px`,
                      left: `${rect.right + padding}px`,
                      width: `${window.innerWidth - rect.right - padding}px`,
                      height: `${rect.height + padding * 2}px`,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      pointerEvents: 'all'
                    }}
                    onClick={handleClose}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: `${rect.bottom + padding}px`,
                      left: 0,
                      width: '100%',
                      height: `${window.innerHeight - rect.bottom - padding}px`,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      pointerEvents: 'all'
                    }}
                    onClick={handleClose}
                  />

                  {/* 메시지 박스 */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute',
                      top: `${messageTop}px`,
                      left: `${messageLeft}px`,
                      width: `${messageWidth}px`,
                      pointerEvents: 'all',
                      zIndex: 10502
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      style={{
                        position: 'relative',
                        background: 'white',
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        textAlign: 'center'
                      }}
                    >
                      {/* 화살표 */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '-7px',
                          left: `${rect.left + rect.width / 2 - messageLeft}px`,
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '9px solid transparent',
                          borderRight: '9px solid transparent',
                          borderBottom: '9px solid white'
                        }}
                      />

                      <p
                        style={{
                          fontSize: '15px',
                          lineHeight: '1.5',
                          color: '#333',
                          marginBottom: '12px'
                        }}
                      >
                        모드 선택이 가능합니다
                      </p>

                      <button
                        onClick={handleClose}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#5F6F52',
                          border: 'none',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          transition: 'opacity 0.2s'
                        }}
                      >
                        확인
                      </button>
                    </div>
                  </motion.div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 모드 선택 모달 */}
      <AnimatePresence>
        {showModeModal && (
          <>
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                zIndex: 10000
              }}
              onClick={() => setShowModeModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[20px] p-[24px] w-[85%] max-w-[320px]"
              style={{ backgroundColor: 'var(--color-bg-card)', zIndex: 10001 }}
            >
              <h2 className="text-[18px] font-semibold mb-[20px] text-center" style={{ color: 'var(--color-text-primary)' }}>
                보기 모드 선택
              </h2>
              <div className="flex flex-col gap-[12px]">
                <button
                  onClick={() => {
                    setViewMode('calendar');
                    setShowModeModal(false);
                  }}
                  className={`w-full py-[14px] rounded-[12px] text-[15px] font-medium transition-opacity border-0 ${
                    viewMode === 'calendar' ? 'bg-[#5F6F52] text-[#FFFFFF]' : ''
                  }`}
                  style={viewMode === 'calendar' ? {} : { backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                >
                  캘린더 모드
                </button>
                <button
                  onClick={() => {
                    setViewMode('feed');
                    setShowModeModal(false);
                  }}
                  className={`w-full py-[14px] rounded-[12px] text-[15px] font-medium transition-opacity border-0 ${
                    viewMode === 'feed' ? 'bg-[#5F6F52] text-[#FFFFFF]' : ''
                  }`}
                  style={viewMode === 'feed' ? {} : { backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                >
                  피드 모드
                </button>
                <button
                  onClick={() => setShowModeModal(false)}
                  className="w-full py-[14px] rounded-[12px] text-[15px] font-medium transition-colors border-0"
                  style={{ backgroundColor: 'rgba(128, 128, 128, 0.2)', color: 'var(--color-text-primary)' }}
                >
                  취소
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
