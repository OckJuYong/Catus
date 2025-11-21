import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { useTutorial } from "../contexts/TutorialContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import Tutorial from "./Tutorial";
import type { AnonymousMessage } from "../types";

import catImage from "../assets/images/cat.png";
import cactus1 from "../assets/images/catus1.png";
import cactus2 from "../assets/images/catus2.png";
import cactus3 from "../assets/images/catus3.png";
import cactus4 from "../assets/images/catus4.png";
import book from "../assets/images/book.png";
import bg from "../assets/images/home-background.png";
import bgDark from "../assets/images/background-dark.png";
import settingIcon from "../assets/images/setting.png";
import airplaneImage from "../assets/images/airplane.png";

interface HomePageProps {
  hideButtons?: boolean;
}

export default function HomePage({ hideButtons = false }: HomePageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isTutorialCompleted, startTutorial } = useTutorial();
  const { isDarkMode } = useDarkMode();

  // ====== LocalStorage ======
  const [receivedMessages] = useLocalStorage<AnonymousMessage[]>("received_messages", []);
  const [lastCheckedCount, setLastCheckedCount] = useLocalStorage<number>(
    "last_checked_received_count",
    0
  );
  const [supportTutorialShown, setSupportTutorialShown] = useLocalStorage<boolean>(
    "support_tutorial_shown",
    false
  );

  // ====== 상태 ======
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSupportTutorial, setShowSupportTutorial] = useState(false);

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

  const handleMessageCheck = async (): Promise<void> => {
    setLastCheckedCount(receivedMessages.length);
    setHasNewMessage(false);
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

  // ====== 새로운 상호작용 핸들러 ======
  const openChat = (): void => navigate(ROUTES.CHAT);

  // 선인장 클릭 → BIG5 통계
  const handleCactusClick = (): void => {
    navigate(ROUTES.BIG5_STATS);
  };

  // 고양이 "달이" 클릭 → 랜덤 그림일기 보기 (백엔드에서 활성화 시에만)
  const handleCatClick = (): void => {
    // TODO: 백엔드에서 hasRandomDiary 플래그가 true일 때만 작동
    navigate(ROUTES.RANDOM_DIARY);
  };

  // 종이비행기 클릭 → 익명 메시지 수신함
  const handleAirplaneClick = async (): Promise<void> => {
    await handleMessageCheck();
    navigate(ROUTES.LETTER);
  };

  const cactusImages = [cactus1, cactus2, cactus3, cactus4];

  // ====== 튜토리얼 자동 시작 ======
  useEffect(() => {
    if (location.pathname !== ROUTES.HOME) return;

    let timeoutId: NodeJS.Timeout | null = null;

    if (!isTutorialCompleted) {
      const checkFontLoaded = async (): Promise<void> => {
        try {
          await document.fonts.ready;
          timeoutId = setTimeout(() => {
            startTutorial();
            setShowTutorial(true);
          }, 500);
        } catch (error) {
          console.error("폰트 로드 확인 중 오류:", error);
          timeoutId = setTimeout(() => {
            startTutorial();
            setShowTutorial(true);
          }, 1000);
        }
      };
      checkFontLoaded();
    }

    // Cleanup: 컴포넌트 언마운트 시 setTimeout 취소
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isTutorialCompleted, location.pathname, startTutorial]);

  const handleTutorialComplete = (): void => setShowTutorial(false);

  // 나머지 JSX는 원본과 동일하게 유지 (너무 길어서 생략)
  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-end" style={{ backgroundColor: '#fef9f1' }}>
      <img
        src={isDarkMode ? bgDark : bg}
        alt="background"
        className="absolute inset-0 w-full h-full object-fill select-none pointer-events-none"
        draggable="false"
      />

      {showTutorial && location.pathname === ROUTES.HOME && (
        <Tutorial onComplete={handleTutorialComplete} />
      )}

      {/* 선인장 그룹 - BIG5 통계 */}
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
            onClick={handleCactusClick}
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

      {/* 종이비행기 - 익명 메시지 수신함 */}
      <button
        onClick={handleAirplaneClick}
        className="airplane-button absolute z-10 bg-transparent p-0 border-0 hover:scale-110 active:scale-95 transition-transform"
        style={{
          top: "25%",
          left: "10%",
        }}
      >
        <motion.div
          className="relative"
          animate={hasNewMessage ? {
            y: [0, -10, 0],
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <img
            src={airplaneImage}
            alt="airplane"
            className="object-contain drop-shadow-lg w-[12vw] min-w-[50px] max-w-[80px]"
            style={{ filter: isDarkMode ? 'brightness(0.7)' : 'none' }}
          />
          {hasNewMessage && unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </motion.div>
      </button>

      {/* 일기장(다이어리) - 캘린더로 이동 */}
      <button
        onClick={() => navigate(ROUTES.CALENDAR)}
        className="diary-book absolute z-10 bg-transparent p-0 border-0 hover:scale-105 active:scale-95 transition-transform"
        style={{ bottom: "8%", left: "48%", transform: "translateX(-50%)" }}
      >
        <img
          src={book}
          alt="diary"
          className="object-contain drop-shadow-xl w-[18vw] min-w-[80px] max-w-[150px]"
          style={{ filter: isDarkMode ? 'brightness(0.7)' : 'none' }}
        />
      </button>

      {/* 고양이 "달이" - 랜덤 일기 (백엔드에서 활성화 시) */}
      <button
        onClick={handleCatClick}
        className="cat-container absolute z-20 bg-transparent p-0 border-0 hover:scale-105 active:scale-95 transition-transform"
        style={{
          bottom: "8%",
          left: "48%",
          transform: `translate(calc(8vw), 0) scale(${catScale})`,
          transformOrigin: "bottom left",
        }}
      >
        <img
          src={catImage}
          alt="cat"
          className="cat-image object-contain drop-shadow-2xl w-[20vw] min-w-[90px] max-w-[180px]"
          style={{ filter: isDarkMode ? 'brightness(0.9)' : 'none' }}
        />
      </button>

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
