import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useDarkMode } from "../contexts/DarkModeContext";

export default function DiaryDetailPage2() {
  const navigate = useNavigate();
  const { date } = useParams();
  const { isDarkMode } = useDarkMode();
  const [diaryData, setDiaryData] = useLocalStorage("diary_data", {});
  const [isPrivate, setIsPrivate] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showCommentSheet, setShowCommentSheet] = useState(false);

  const diary = diaryData[date];

  useEffect(() => {
    if (diary) {
      setIsPrivate(diary.isPrivate || false);
    }
  }, [diary]);

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split("-");
    return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
  };

  const handlePrivateToggle = () => {
    const newPrivateState = !isPrivate;
    setIsPrivate(newPrivateState);

    setDiaryData({
      ...diaryData,
      [date]: {
        ...diary,
        isPrivate: newPrivateState
      }
    });

    setToastMessage(
      newPrivateState
        ? "일기를 나만 볼 수 있게 수정했어요"
        : "일기가 모두에게 공유되었어요"
    );

    setTimeout(() => setToastMessage(""), 3000);
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      행복: "#8EC7A9",
      슬픔: "#AFCBFF",
      불안: "#FDE68A",
      화남: "#FCA5A5",
      보통: "#D4D4D4",
    };
    return colors[emotion] || "#AFCBFF";
  };

  if (!diary) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{
          color: "var(--color-text-secondary)",
          backgroundColor: "var(--color-main-bg)",
        }}
      >
        <div className="text-5xl mb-4">📭</div>
        <p>이 날짜에는 기록된 일기가 없어요.</p>
      </div>
    );
  }

  const commentCount = diary.encouragementMessages?.length || 0;

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ backgroundColor: "var(--color-main-bg)" }}
    >
      {/* 토스트 메시지 */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#5E705790] text-[#FFFFFF] text-[14px] px-[20px] py-[12px] rounded-[12px] shadow-lg"
            style={{ minWidth: "250px" }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-[12px] py-[12px]"
        style={{ backgroundColor: "var(--color-bg-card)" }}
      >
        <button
          onClick={() => navigate(ROUTES.CALENDAR)}
          className="text-[#5E7057] hover:opacity-70 text-[20px] bg-transparent border-0"
          style={{ marginTop: "-5px" }}
        >
          ←
        </button>

        <div className="text-[16px] font-[600] text-[#5E7057]">
          {formatDate(date)}
        </div>

        <button
          onClick={() => setShowEditModal(true)}
          className="text-[#5E7057] hover:opacity-70 text-[20px] bg-transparent border-0"
          style={{ marginTop: "-4px" }}
        >
          ⋯
        </button>
      </div>

      {/* 일기 이미지 */}
      {diary.image && (
        <img
          src={diary.image}
          alt="일기 이미지"
          className="w-full aspect-square object-cover mx-auto block max-h-[400px] max-w-[400px]"
        />
      )}

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto px-[20px] py-[10px]">
        {/* 하트 + 댓글 버튼 + 토글 */}
        <div className="flex items-center justify-between mb-[20px]">
          {/* 왼쪽: 하트 + 댓글 버튼 */}
          <div className="flex items-center gap-[12px]">
            <svg width="27" height="27" viewBox="0 0 24 24" fill={getEmotionColor(diary.emotion)}>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>

            <button
              onClick={() => setShowCommentSheet(true)}
              className="flex items-center gap-[6px] bg-transparent border-0 hover:opacity-80"
            >
              <svg width="25" height="25" viewBox="0 0 24 24" fill="#FFFFFF" stroke="#000000" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-[14px] font-[600]">{commentCount}</span>
            </button>
          </div>

          {/* 오른쪽: 토글 */}
          <div
            onClick={handlePrivateToggle}
            className={`relative w-[51px] h-[31px] rounded-full cursor-pointer transition-all ${
              isPrivate ? "bg-[#5E7057]" : "bg-[#D1D5DB]"
            }`}
          >
            <div
              className={`absolute top-[3px] w-[25px] h-[25px] bg-[#FFFFFF] rounded-full transition-all ${
                isPrivate ? "left-[23px]" : "left-[3px]"
              }`}
            />
          </div>
        </div>

        {/* 오늘의 기분 */}
        <div className="mb-[20px]">
          <div className="text-[15px] font-[600] mb-[8px]">오늘의 기분</div>
          <div className="text-[13px] font-[500]" style={{ color: "var(--color-text-secondary)" }}>
            {diary.title || "작지만 중요한 하루"}
          </div>
        </div>

        {/* AI 요약 */}
        <div>
          <div className="text-[15px] font-[600] mb-[8px]">AI의 속삭임</div>
          <div
            className="text-[13px] font-[500] leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {diary.summary ||
              "오늘은 평범한 하루였어요. 특별한 일은 없었지만 그 자체로 충분히 괜찮았어요."}
          </div>
        </div>
      </div>

      {/* 댓글 Bottom Sheet */}
      <AnimatePresence>
        {showCommentSheet && (
          <div
            onClick={() => setShowCommentSheet(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full rounded-t-[24px] max-h-[60vh] flex flex-col overflow-hidden"
              style={{
                backgroundColor: "var(--color-bg-card)",
                zIndex: 10001,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 고정 헤더 영역 */}
              <div className="flex-shrink-0 pt-[24px] pb-[16px] flex flex-col items-center">
                {/* 핸들바 */}
                <div
                  className="w-[40px] h-[4px] rounded-full mb-[12px]"
                  style={{ backgroundColor: "#D1D5DB" }}
                />

                {/* 제목 */}
                <h2
                  className="text-[18px] font-[600] mb-[16px] text-center"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  날아온 응원 메세지
                </h2>

                {/* 구분선 - 화면 전체 폭 */}
                <div
                  className="border-t w-full"
                  style={{ borderColor: "var(--color-border)" }}
                ></div>
              </div>

              {/* 스크롤 가능한 메시지 영역 */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-[20px] pb-[32px]">
                <div className="w-full max-w-[300px] mx-auto pt-[0px]">
                  {diary.encouragementMessages?.length > 0 ? (
                    <div className="flex flex-col gap-[16px]">
                      {diary.encouragementMessages.map((message, index) => (
                        <div key={index} className="flex flex-col gap-[4px]">
                          <div className="text-[14px] font-[600]">
                            익명 {index + 1}
                          </div>
                          <div
                            className="text-[13px] font-[400] leading-relaxed"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            {message}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="text-center py-[40px]"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      아직 댓글이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
