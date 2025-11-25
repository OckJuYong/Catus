import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { chatApi } from '../utils/api';
import type { ChatAnalysisResponse } from '../types';

export default function ChatAnalysisPage() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analysisResult, setAnalysisResult] = useState<ChatAnalysisResponse | null>(null);
  const [showCalendar, setShowCalendar] = useState<'start' | 'end' | null>(null);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '날짜 선택';
    const [year, month, day] = dateStr.split('-');
    return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
  };

  const handleDateSelect = (date: Date) => {
    const formatted = formatDate(date);
    if (showCalendar === 'start') {
      setStartDate(formatted);
    } else if (showCalendar === 'end') {
      setEndDate(formatted);
    }
    setShowCalendar(null);
  };

  // 채팅 분석 Mutation (백엔드: POST /api/chat/analyze)
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate) throw new Error('시작 날짜와 종료 날짜를 모두 선택해주세요.');
      return await chatApi.analyzeChat(startDate, endDate);
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
    },
    onError: (error: any) => {
      console.error('채팅 분석 실패:', error);
      alert(`분석에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    },
  });

  const handleAnalyze = () => {
    if (!startDate || !endDate) {
      alert('시작 날짜와 종료 날짜를 모두 선택해주세요.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert('시작 날짜는 종료 날짜보다 이전이어야 합니다.');
      return;
    }
    analyzeMutation.mutate();
  };

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
          onClick={() => navigate(-1)}
          className="text-[#5E7057] hover:opacity-70 text-[20px] bg-transparent border-0"
          style={{ marginTop: '-5px' }}
        >
          ←
        </button>
        <div className="text-[16px] font-[600] text-[#5E7057]">
          채팅 분석
        </div>
        <div className="w-[20px]" />
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col px-[16px] py-[16px] overflow-hidden">
        {/* 설명 */}
        <div
          className="rounded-[16px] p-[16px] mb-[12px] flex-shrink-0"
          style={{ backgroundColor: 'var(--color-bg-card)' }}
        >
          <div className="flex items-center gap-[8px] mb-[8px]">
            <h2
              className="font-[600] text-[15px]"
              style={{ color: 'var(--color-text-primary)' }}
            >
              채팅 분석이란?
            </h2>
          </div>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            선택한 기간 동안의 대화를 Big5 성격 분석 모델로 분석하여
            감정 변화와 성격 특성을 파악할 수 있습니다.
          </p>
        </div>

        {/* 날짜 선택 */}
        <div
          className="rounded-[16px] p-[16px] mb-[12px] flex-shrink-0 overflow-hidden"
          style={{ backgroundColor: 'var(--color-bg-card)' }}
        >
          <h3
            className="text-[15px] font-[600] mb-[12px] flex items-center gap-[8px]"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <span>분석 기간 선택</span>
          </h3>

          <div className="flex flex-col gap-[12px]">
            <div>
              <label
                className="block text-[13px] font-[500] mb-[6px]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                시작 날짜
              </label>
              <button
                type="button"
                onClick={() => setShowCalendar('start')}
                className="w-full px-[12px] py-[10px] border rounded-[10px] text-[14px] text-left"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-main-bg)',
                  color: startDate ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  boxSizing: 'border-box',
                }}
              >
                {formatDisplayDate(startDate)}
              </button>
            </div>

            <div>
              <label
                className="block text-[13px] font-[500] mb-[6px]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                종료 날짜
              </label>
              <button
                type="button"
                onClick={() => setShowCalendar('end')}
                className="w-full px-[12px] py-[10px] border rounded-[10px] text-[14px] text-left"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-main-bg)',
                  color: endDate ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  boxSizing: 'border-box',
                }}
              >
                {formatDisplayDate(endDate)}
              </button>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending || !startDate || !endDate}
            className="w-full mt-[16px] py-[12px] bg-[#5E7057] text-[#FFFFFF] rounded-[12px] text-[14px] font-[500] border-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzeMutation.isPending ? '분석 중...' : '분석 시작'}
          </button>
        </div>

        {/* 분석 결과 - 스크롤 가능 영역 */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-[12px]"
          >
            {/* 기간 */}
            <div
              className="rounded-[16px] p-[16px] flex-shrink-0"
              style={{ backgroundColor: 'var(--color-bg-card)' }}
            >
              <h3
                className="text-[15px] font-[600] mb-[8px] flex items-center gap-[8px]"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <span>📅</span>
                <span>분석 기간</span>
              </h3>
              <p
                className="text-[14px]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {analysisResult.period.start} ~ {analysisResult.period.end}
              </p>
            </div>

            {/* Big5 점수 */}
            <div
              className="rounded-[16px] p-[16px] flex-shrink-0"
              style={{ backgroundColor: 'var(--color-bg-card)' }}
            >
              <h3
                className="text-[15px] font-[600] mb-[12px] flex items-center gap-[8px]"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <span>🧠</span>
                <span>성격 분석 결과</span>
              </h3>
              <div className="flex flex-col gap-[12px]">
                {[
                  { key: 'openness', name: '개방성' },
                  { key: 'conscientiousness', name: '성실성' },
                  { key: 'extraversion', name: '외향성' },
                  { key: 'agreeableness', name: '친화성' },
                  { key: 'neuroticism', name: '신경증' },
                ].map(({ key, name }) => {
                  const score = analysisResult.emotionScores[key as keyof typeof analysisResult.emotionScores] || 0;
                  const percentage = Math.min(100, Math.round(score * 10));
                  return (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-[4px]">
                        <span
                          className="text-[13px] font-[500]"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {name}
                        </span>
                        <span
                          className="text-[13px] font-[600]"
                          style={{ color: '#5E7057' }}
                        >
                          {percentage}%
                        </span>
                      </div>
                      <div
                        className="w-full rounded-full h-[6px]"
                        style={{ backgroundColor: '#E8E8E8' }}
                      >
                        <div
                          className="h-[6px] rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%`, backgroundColor: '#5E7057' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 요약 */}
            <div
              className="rounded-[16px] p-[16px] flex-shrink-0"
              style={{ backgroundColor: 'var(--color-bg-card)' }}
            >
              <h3
                className="text-[15px] font-[600] mb-[8px] flex items-center gap-[8px]"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <span>💬</span>
                <span>분석 요약</span>
              </h3>
              <p
                className="text-[13px] leading-relaxed whitespace-pre-wrap"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {analysisResult.summary}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* 캘린더 모달 */}
      <AnimatePresence>
        {showCalendar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[1000]"
              onClick={() => setShowCalendar(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[1001] w-[90%] max-w-[340px] rounded-[20px] overflow-hidden shadow-xl"
              style={{ backgroundColor: 'var(--color-bg-card)' }}
            >
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between px-[16px] py-[12px] bg-[#5E7057]">
                <span className="text-[15px] font-[600] text-white">
                  {showCalendar === 'start' ? '시작 날짜 선택' : '종료 날짜 선택'}
                </span>
                <button
                  onClick={() => setShowCalendar(null)}
                  className="text-white text-[18px] bg-transparent border-0"
                >
                  ×
                </button>
              </div>

              {/* 캘린더 */}
              <div className="p-[12px]">
                <Calendar
                  value={showCalendar === 'start' && startDate ? new Date(startDate) : showCalendar === 'end' && endDate ? new Date(endDate) : new Date()}
                  onChange={(value) => value instanceof Date && handleDateSelect(value)}
                  locale="en-US"
                  formatDay={(_, date) => date.getDate().toString()}
                  formatShortWeekday={(_, date) => ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}
                  formatMonthYear={(_, date) => `${date.getFullYear()}년 ${date.getMonth() + 1}월`}
                  formatYear={(_, date) => `${date.getFullYear()}년`}
                  formatMonth={(_, date) => `${date.getMonth() + 1}월`}
                  next2Label={null}
                  prev2Label={null}
                  maxDate={new Date()}
                  tileClassName={({ date }) => {
                    const day = date.getDay();
                    if (day === 0) return 'sunday';
                    if (day === 6) return 'saturday';
                    return null;
                  }}
                />

                {/* 하단 버튼 */}
                <div className="flex gap-[8px] mt-[12px]">
                  <button
                    onClick={() => {
                      if (showCalendar === 'start') setStartDate('');
                      else if (showCalendar === 'end') setEndDate('');
                      setShowCalendar(null);
                    }}
                    className="flex-1 py-[10px] rounded-[10px] text-[14px] font-[500] border"
                    style={{
                      backgroundColor: 'var(--color-main-bg)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    삭제
                  </button>
                  <button
                    onClick={() => handleDateSelect(new Date())}
                    className="flex-1 py-[10px] rounded-[10px] text-[14px] font-[500] border-0"
                    style={{
                      backgroundColor: '#5E7057',
                      color: 'white',
                    }}
                  >
                    오늘
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 캘린더 스타일 */}
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
          align-items: center;
        }

        .react-calendar__navigation button {
          min-width: 36px;
          height: 36px;
          background: var(--color-main-bg) !important;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          cursor: pointer;
          color: var(--color-text-primary);
          transition: all 0.15s ease;
        }

        .react-calendar__navigation button:hover {
          background: rgba(94, 112, 87, 0.15) !important;
        }

        .react-calendar__navigation button:disabled {
          opacity: 0.3;
        }

        .react-calendar__navigation__label {
          font-weight: 600;
          font-size: 15px;
          color: var(--color-text-primary);
          background: var(--color-main-bg) !important;
          border-radius: 10px;
          padding: 0 12px;
          cursor: pointer !important;
          pointer-events: auto !important;
        }

        .react-calendar__navigation__label:hover {
          background: rgba(94, 112, 87, 0.15) !important;
        }

        .react-calendar__month-view__weekdays {
          text-align: center;
          font-weight: 600;
          font-size: 12px;
          margin-bottom: 4px;
          display: grid !important;
          grid-template-columns: repeat(7, 1fr) !important;
          background: var(--color-main-bg);
          border-radius: 8px;
          padding: 6px 0;
        }

        .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
          color: var(--color-text-secondary);
        }

        .react-calendar__month-view__weekdays__weekday:nth-child(1) abbr {
          color: #e57373;
        }

        .react-calendar__month-view__weekdays__weekday:nth-child(7) abbr {
          color: #64b5f6;
        }

        .react-calendar__month-view__days {
          gap: 3px;
          margin-top: 6px;
          display: grid !important;
          grid-template-columns: repeat(7, 1fr) !important;
        }

        .react-calendar__tile {
          aspect-ratio: 1;
          padding: 0;
          background: var(--color-main-bg);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          transition: all 0.15s ease;
          cursor: pointer;
        }

        .react-calendar__tile abbr {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .react-calendar__tile.sunday abbr {
          color: #e57373;
        }

        .react-calendar__tile.saturday abbr {
          color: #64b5f6;
        }

        .react-calendar__tile--now {
          background: rgba(94, 112, 87, 0.2) !important;
        }

        .react-calendar__tile--now abbr {
          color: #5E7057 !important;
          font-weight: 700;
        }

        .react-calendar__tile--active {
          background: #5E7057 !important;
        }

        .react-calendar__tile--active abbr {
          color: white !important;
          font-weight: 600;
        }

        .react-calendar__tile:enabled:hover {
          background: rgba(94, 112, 87, 0.12);
        }

        .react-calendar__tile:focus {
          outline: none;
        }

        .react-calendar__tile--neighboringMonth {
          visibility: hidden !important;
        }

        /* 년도 선택 뷰 */
        .react-calendar__year-view__months {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 8px;
        }

        .react-calendar__year-view__months__month {
          padding: 16px 8px !important;
          background: var(--color-main-bg);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .react-calendar__year-view__months__month:hover {
          background: rgba(94, 112, 87, 0.15);
        }

        .react-calendar__tile--hasActive {
          background: #5E7057 !important;
          color: white !important;
        }

        /* 10년 단위 뷰 */
        .react-calendar__decade-view__years {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 8px;
        }

        .react-calendar__decade-view__years__year {
          padding: 16px 8px !important;
          background: var(--color-main-bg);
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .react-calendar__decade-view__years__year:hover {
          background: rgba(94, 112, 87, 0.15);
        }

        /* 100년 단위 뷰 */
        .react-calendar__century-view__decades {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 8px;
        }

        .react-calendar__century-view__decades__decade {
          padding: 16px 8px !important;
          background: var(--color-main-bg);
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .react-calendar__century-view__decades__decade:hover {
          background: rgba(94, 112, 87, 0.15);
        }
      `}</style>
    </div>
  );
}
