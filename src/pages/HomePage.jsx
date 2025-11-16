import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { useTutorial } from "../contexts/TutorialContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import Tutorial from "./Tutorial";

import catImage from "../assets/images/cat.png";
import catMessageImage from "../assets/images/cat_message.png";
import cactus1 from "../assets/images/catus1.png";
import cactus2 from "../assets/images/catus2.png";
import cactus3 from "../assets/images/catus3.png";
import cactus4 from "../assets/images/catus4.png";
import book from "../assets/images/book.png";
import bg from "../assets/images/home-background.png";
import bgDark from "../assets/images/background-dark.png";
import settingIcon from "../assets/images/setting.png";

export default function HomePage({ hideButtons = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isTutorialCompleted, startTutorial } = useTutorial();
  const { isDarkMode } = useDarkMode();

  // ====== LocalStorage ======
  const [receivedMessages, setReceivedMessages] = useLocalStorage("received_messages", []);
  const [lastCheckedCount, setLastCheckedCount] = useLocalStorage(
    "last_checked_received_count",
    0
  );
  const [supportTutorialShown, setSupportTutorialShown] = useLocalStorage(
    "support_tutorial_shown",
    false
  );

  // ====== 상태 ======
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showMessageNotification, setShowMessageNotification] = useState(false);
  const [showSupportTutorial, setShowSupportTutorial] = useState(false);
  const [catAnimationKey, setCatAnimationKey] = useState(0);

  // ====== 새 응원 메시지 확인 ======
  useEffect(() => {
    if (receivedMessages.length > 0 && receivedMessages.length > lastCheckedCount) {
      console.log("📨 새 응원 메시지 감지!");
      setHasNewMessage(true);

      // ✅ 처음 응원 메시지를 받은 경우 한 번만 튜토리얼 표시
      if (!supportTutorialShown) {
        setShowSupportTutorial(true);
      }
    }
  }, [receivedMessages.length, lastCheckedCount, supportTutorialShown]);

  const handleMessageCheck = () => {
    setLastCheckedCount(receivedMessages.length);
    setHasNewMessage(false);
    setShowMessageNotification(false);
  };

  // 읽지 않은 메시지 개수
  const unreadCount = receivedMessages.length - lastCheckedCount;

  // ====== 반응형 위치/스케일 ======
  const aspectRatio = window.innerHeight / window.innerWidth;
  const baseScale =
    aspectRatio > 1.8 ? 1.18 : aspectRatio > 1.5 ? 1.08 : aspectRatio > 1.2 ? 0.95 : 0.85;
  const catScale =
    aspectRatio > 1.8
      ? baseScale * 1.0
      : aspectRatio > 1.5
      ? baseScale * 0.95
      : aspectRatio > 1.2
      ? baseScale * 0.8
      : baseScale * 0.7;
  const heightRatio = Math.min(aspectRatio * 1.2, 1.3);
  const cactusTop = `${67 - (heightRatio - 1) * 1.5}%`;
  const cactusScale = 0.9 + (heightRatio - 1) * 0.5;

  const openChat = () => navigate(ROUTES.CHAT);
  const openSupport = () => navigate(ROUTES.SUPPORT);

  const handleCatMessageClick = () => {
    if (!hasNewMessage) return;

    // 클릭할 때마다 애니메이션 트리거
    setCatAnimationKey(prev => prev + 1);

    setClickCount((c) => c + 1);
    if (clickCount + 1 >= 3) {
      // 3번째 클릭: 애니메이션 후 편지 페이지로 이동
      setTimeout(() => {
        setLastCheckedCount(receivedMessages.length);
        setHasNewMessage(false);
        setClickCount(0);
        navigate(ROUTES.LETTER);
      }, 400); // 애니메이션 중간에 페이지 전환
    }
  };

  const cactusImages = [cactus1, cactus2, cactus3, cactus4];

  // ====== 튜토리얼 자동 시작 ======
  useEffect(() => {
    if (location.pathname !== ROUTES.HOME) return;

    if (!isTutorialCompleted) {
      const checkFontLoaded = async () => {
        try {
          await document.fonts.ready;
          setTimeout(() => {
            startTutorial();
            setShowTutorial(true);
          }, 500);
        } catch (error) {
          console.error("폰트 로드 확인 중 오류:", error);
          setTimeout(() => {
            startTutorial();
            setShowTutorial(true);
          }, 1000);
        }
      };
      checkFontLoaded();
    }
  }, [isTutorialCompleted, location.pathname]);

  const handleTutorialComplete = () => setShowTutorial(false);

  // ====== 렌더 ======
  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-end" style={{ backgroundColor: '#fef9f1' }}>
      {/* 배경 */}
      <img
        src={isDarkMode ? bgDark : bg}
        alt="background"
        className="absolute inset-0 w-full h-full object-fill select-none pointer-events-none"
        draggable="false"
      />

      {/* 튜토리얼 */}
      {showTutorial && location.pathname === ROUTES.HOME && (
        <Tutorial onComplete={handleTutorialComplete} />
      )}

      {/* 응원메시지 처음 알림 튜토리얼 */}
      {showSupportTutorial && (
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
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          {/* 오버레이 배경 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              pointerEvents: 'all'
            }}
            onClick={() => {
              setSupportTutorialShown(true);
              setShowSupportTutorial(false);
            }}
          />

          {/* 고양이 스팟라이트 */}
          {(() => {
            const catElement = document.querySelector('.cat-image');
            if (!catElement) return null;
            const rect = catElement.getBoundingClientRect();
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  position: 'absolute',
                  top: rect.top - 8,
                  left: rect.left - 8,
                  width: rect.width + 16,
                  height: rect.height + 16,
                  borderRadius: '12px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                  pointerEvents: 'none',
                  zIndex: 10000,
                  transition: 'all 0.3s ease'
                }}
              />
            );
          })()}

          {/* 메시지 박스 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              bottom: '40%',
              left: '50%',
              transform: 'translateX(-50%)',
              maxWidth: '280px',
              pointerEvents: 'all',
              zIndex: 10001
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                position: 'relative',
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                textAlign: 'center'
              }}
            >
              {/* 화살표 */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid white'
                }}
              />

              {/* 메시지 텍스트 */}
              <p
                style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#333',
                  marginBottom: '16px',
                  whiteSpace: 'pre-line'
                }}
              >
                달이가 편지를 들고 있어요 ✉️{'\n'}달이에게 편지를 받아봐요
              </p>

              {/* 알아가기 버튼 */}
              <button
                onClick={() => {
                  setSupportTutorialShown(true);
                  setShowSupportTutorial(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: '#666',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                달이를 3번 쓰다듬어 봐요
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 선인장 */}
      <div
        className="cactus-group absolute z-10 flex justify-center items-end gap-[5vw]"
        style={{
          top: cactusTop,
          left: "50%",
          transform: `translate(-50%, -95%) scale(${cactusScale})`,
        }}
      >
        {cactusImages.map((img, idx) => (
          <button
            key={idx}
            onClick={openSupport}
            className="group hover:scale-110 active:scale-95 transition-transform bg-transparent p-0 border-0"
          >
            <img
              src={img}
              alt={`cactus-${idx + 1}`}
              className="object-contain drop-shadow-lg w-[8vw] min-w-[40px] max-w-[70px]"
              style={{ filter: isDarkMode ? 'brightness(0.7)' : 'none' }}
            />
          </button>
        ))}
      </div>

      {/* 책 → 달력 */}
      <button
        onClick={() => navigate(ROUTES.CALENDAR)}
        className="diary-book absolute z-10 bg-transparent p-0 border-0"
        style={{ bottom: "8%", left: "48%", transform: "translateX(-50%)" }}
      >
        <img
          src={book}
          alt="diary"
          className="object-contain drop-shadow-xl w-[18vw] min-w-[80px] max-w-[150px]"
          style={{ filter: isDarkMode ? 'brightness(0.7)' : 'none' }}
        />
      </button>

      {/* 고양이 */}
      <button
        onClick={hasNewMessage ? handleCatMessageClick : openChat}
        className="cat-container absolute z-20 bg-transparent p-0 border-0"
        style={{
          bottom: "8%",
          left: "48%",
          transform: `translate(calc(8vw), 0) scale(${catScale})`,
          transformOrigin: "bottom left",
        }}
      >
        <motion.img
          src={hasNewMessage ? catMessageImage : catImage}
          alt="cat"
          className="cat-image object-contain drop-shadow-2xl w-[20vw] min-w-[90px] max-w-[180px]"
          style={{ filter: isDarkMode ? (hasNewMessage ? 'brightness(0.7)' : 'brightness(0.9)') : 'none' }}
          key={catAnimationKey}
          animate={hasNewMessage ? {
            y: [0, -20, -10, -15, 0],
            scale: [1, 1.05, 1.02, 1.03, 1]
          } : {}}
          transition={{
            duration: 0.6,
            ease: [0.34, 1.56, 0.64, 1]
          }}
        />
      </button>

      {/* 설정 */}
      {!hideButtons && (
        <button
          onClick={() => navigate(ROUTES.SETTINGS)}
          className="settings-icon absolute top-[4%] right-[4%] flex items-center justify-center z-30 hover:scale-110 transition-transform bg-transparent border-0"
          aria-label="설정"
        >
          <img
            src={settingIcon}
            alt="settings"
            className="w-[24px] h-[24px] sm:w-[28px] sm:h-[28px]"
          />
        </button>
      )}

      {/* 응원 메시지 알림 배너 */}
      {showMessageNotification && receivedMessages.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: 0,
          right: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          zIndex: 9999,
          pointerEvents: 'none'
        }}>
          <motion.div
            style={{
              width: '90%',
              maxWidth: '400px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              pointerEvents: 'auto'
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ fontSize: '24px' }}>💖</div>
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: '#FF3B30',
                color: 'white',
                fontSize: '10px',
                fontWeight: '700',
                minWidth: '16px',
                height: '16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px'
              }}>
                {unreadCount}
              </div>
            )}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>익명의 응원 메시지</div>
            <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
              {receivedMessages[receivedMessages.length - 1]?.text}
            </div>
          </div>
          <button
            style={{
              flexShrink: 0,
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              color: '#999',
              cursor: 'pointer',
              padding: '4px'
            }}
            onClick={() => setShowMessageNotification(false)}
            aria-label="알림 닫기"
          >
            ×
          </button>
        </motion.div>
        </div>
      )}

      {/* 하단 채팅 인풋바 */}
      {!hideButtons && (
        <div
          className="fixed bottom-0 z-50 cursor-pointer group"
          style={{ width: '70%', padding: '3px', left: '46%', transform: 'translateX(-50%)' }}
          onClick={openChat}
        >
          <input
            type="text"
            placeholder="오늘 하루는 어땠어?"
            className="w-full rounded-[20px] text-sm text-gray-400 bg-[white] cursor-pointer pointer-events-none transition-all duration-200 text-center"
            style={{
              paddingTop: '13px',
              paddingBottom: '13px',
              paddingLeft: '16px',
              paddingRight: '16px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
            readOnly
          />
        </div>
      )}
    </div>
  );
}
