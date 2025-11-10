import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { EMOTION_COLORS } from "../constants/emotionColors";
import { useLocalStorage } from "../hooks/useLocalStorage";
import HomePage from "./HomePage";
import airplanePng from "../assets/images/airplane.png";

export default function SupportPage() {
  const navigate = useNavigate();
  const [diaryData] = useLocalStorage("diary_data", {});
  const [supportMessages, setSupportMessages] = useLocalStorage("support_messages", []);
  const [randomDiary, setRandomDiary] = useState(null);
  const [supportMessage, setSupportMessage] = useState("");
  const [showMessagePreview, setShowMessagePreview] = useState(false);
  const [showPlaneAnimation, setShowPlaneAnimation] = useState(false);
  const maxSupportMessageLength = 100;

  useEffect(() => {
    const diaryEntries = Object.entries(diaryData);
    if (diaryEntries.length > 0) {
      const randomIndex = Math.floor(Math.random() * diaryEntries.length);
      const [dateKey, diary] = diaryEntries[randomIndex];
      setRandomDiary({ ...diary, date: dateKey });
    } else {
      setRandomDiary({
        date: "2025-11-15",
        emotion: "슬픔",
        title: "약간은 슬펐던 하루",
        image: "https://via.placeholder.com/240x240/F9F9F9/8B9A8E?text=일기+그림",
      });
    }
  }, [diaryData]);

  const handleMessagePreview = () => {
    if (!supportMessage.trim()) {
      alert("응원 메시지를 입력해주세요!");
      return;
    }
    setShowMessagePreview(true);
  };

  const handleConfirmSend = () => {
    // 종이비행기 애니메이션 시작
    setShowPlaneAnimation(true);

    // 메시지 저장
    const newMessage = {
      id: Date.now(),
      content: supportMessage,
      date: new Date().toISOString().split("T")[0],
    };
    setSupportMessages([...supportMessages, newMessage]);

    // 애니메이션 후 페이지 이동
    setTimeout(() => {
      navigate(ROUTES.HOME);
    }, 2000);
  };

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
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
          isolation: 'isolate'
        }}
      >
        {!showPlaneAnimation && (
          <motion.div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                       bg-[#F5F5F0] rounded-[24px] w-[90%] max-w-[360px]
                       flex flex-col shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
          {/* 헤더 */}
          <div className="px-[16px] pt-[12px] pb-[12px] flex items-start justify-between">
            <div className="text-left">
              <h2 className="text-[13px] font-semibold text-gray-800">누군가의 그림일기</h2>
              <p className="text-[11px] text-[#6B6B6B] mt-[2px]">
                {randomDiary?.date &&
                  `${randomDiary.date.split("-")[1]}월 ${randomDiary.date.split("-")[2]}일 작성됨`}
              </p>
            </div>
            <button
              onClick={() => navigate(ROUTES.HOME)}
              className="text-gray-500 hover:text-gray-700 text-[26px] leading-none bg-transparent border-0 -mt-[-2px]"
            >
              ×
            </button>
          </div>

          {/* 그림 + 제목 */}
          <div className="px-[16px] mb-[16px]">
            <div className="bg-white p-[12px] rounded-xl shadow-sm border border-gray-200">
              <img
                src={randomDiary?.image}
                alt="일기 그림"
                className="w-full h-[260px] rounded-md object-cover"
              />
            </div>
            <div className="mt-[12px] flex justify-center">
              <div
                style={{
                  backgroundColor: randomDiary?.emotion ? EMOTION_COLORS[randomDiary.emotion] : '#9E9E9E',
                }}
                className="px-[4px] rounded-[4px] shadow-sm inline-block"
              >
                <p className="text-[10px] font-bold text-[#FFFFFF]" style={{
                  letterSpacing: '0.3px',
                }}>
                  {randomDiary?.title || "약간은 슬펐던 하루"}
                </p>
              </div>
            </div>
          </div>

          {/* 응원 메시지 입력 영역 */}
          <div className="px-[16px] pb-[20px]">
            {!showMessagePreview ? (
              <>
                <p className="text-[12px] text-[#6B6B6B] mb-[8px] text-left">
                  따뜻한 응원의 메시지를 남겨주세요. (50자 이내)
                </p>

                {/* 입력창 + 전송 버튼 한 줄 배치 */}
                <div className="flex items-center gap-[8px]">
                  <input
                    type="text"
                    className="flex-1 px-[12px] py-[8px] text-sm rounded-[8px] border border-gray-300 focus:outline-none focus:border-gray-400"
                    placeholder="익명의 응원 메시지 작성..."
                    value={supportMessage}
                    onChange={(e) =>
                      setSupportMessage(e.target.value.slice(0, maxSupportMessageLength))
                    }
                  />
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
                  <p className="text-[13px] text-gray-700 mb-[4px]">{supportMessage}</p>
                  <p className="text-[11px] text-[#6B6B6B]">- 익명의 집사로부터</p>
                </div>

                <div className="flex justify-end gap-[8px]">
                  <button
                    onClick={() => setShowMessagePreview(false)}
                    className="px-[20px] py-[8px] bg-[#2D2D2D] text-[#FFFFFF] text-sm font-medium rounded-[8px] hover:bg-gray-800 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleConfirmSend}
                    className="px-[20px] py-[8px] bg-[#2D2D2D] text-[#FFFFFF] text-sm font-medium rounded-[8px] hover:bg-gray-800 transition-colors"
                  >
                    확인
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
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          pointerEvents: 'none',
        }}>
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
              opacity: 0,
              scale: 0.3,
              rotate: -30
            }}
            animate={{
              x: [0, -600, 400],
              y: [0, -100, -500],
              opacity: [0, 1, 1, 0],
              scale: [0.3, 1, 1.2, 1],
              rotate: [-30, -10, 45]
            }}
            transition={{
              duration: 2,
              times: [0, 0.4, 0.7, 1],
              ease: 'easeInOut'
            }}
          >
            {/* 종이비행기 */}
            <img
              src={airplanePng}
              alt="airplane"
              style={{
                width: '80px',
                height: '80px',
                filter: 'brightness(2.5)',
              }}
            />
          </motion.div>
        </div>
      )}
    </>
  );
}
