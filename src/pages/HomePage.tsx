import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "../constants/routes";
import { useTutorial } from "../contexts/TutorialContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { messageApi } from "../utils/api";
import Tutorial from "./Tutorial";
import api from "../utils/api";

import catImage from "../assets/images/cat1.png";
import catMessageImage from "../assets/images/cat_message.png";
import cactusImage from "../assets/images/cactus.png";
import bookClose from "../assets/images/book_close.png";
import bookOpen from "../assets/images/book_open.png";
import bg from "../assets/images/home-background.png";
import bgDark from "../assets/images/background-dark.png";
import settingIcon from "../assets/images/setting.png";
import airplaneSvg from "../assets/images/airplane.svg";
import exclamationMark from "../assets/images/exclamation_mark.png";

interface HomePageProps {
  hideButtons?: boolean;
  backgroundOnly?: boolean;
}

export default function HomePage({ hideButtons = false, backgroundOnly = false }: HomePageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isTutorialCompleted, startTutorial } = useTutorial();
  const { isDarkMode } = useDarkMode();

  // 현재 페이지가 캘린더인지 확인
  const isCalendarOpen = location.pathname === ROUTES.CALENDAR;

  // ====== LocalStorage ======
  const [supportTutorialShown, setSupportTutorialShown] = useLocalStorage<boolean>(
    "support_tutorial_shown",
    false
  );
  const [airplaneTutorialShown, setAirplaneTutorialShown] = useLocalStorage<boolean>(
    "airplane_tutorial_shown",
    false
  );

  // ====== 상태 ======
  const [clickCount, setClickCount] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSupportTutorial, setShowSupportTutorial] = useState(false);
  const [showAirplaneTutorial, setShowAirplaneTutorial] = useState(false);
  const [catAnimationKey, setCatAnimationKey] = useState(0);
  const [isBookOpening, setIsBookOpening] = useState(false);
  const [isBig5Checked, setIsBig5Checked] = useState(false);

  // TODO: 백엔드에서 hasRandomDiary 플래그 받아오기
  const [hasRandomDiary, setHasRandomDiary] = useState(true);

  // ====== 백엔드 API로 unreadCount 조회 ======
  const { data: messagesData } = useQuery({
    queryKey: ['messages', 'received'],
    queryFn: () => messageApi.getReceived(0, 1),
    enabled: !backgroundOnly,
    refetchInterval: 30000,
  });

  const unreadCount = messagesData?.unreadCount || 0;
  const hasNewMessage = unreadCount > 0;

  // ====== Big5 데이터 확인 ======
  useEffect(() => {
    if (backgroundOnly) return;

    const checkBig5Data = async () => {
      try {
        await api.big5.getCurrent();
        console.log('✅ Big5 데이터 존재 - 홈페이지 유지');
        setIsBig5Checked(true);
      } catch (error: any) {
        console.log('❌ Big5 데이터 없음 - Big5 테스트로 이동');
        navigate('/big5/test');
      }
    };

    checkBig5Data();
  }, [backgroundOnly, navigate]);

  // ====== 현재 활성화된 튜토리얼 체크 (동시에 하나만) ======
  const isAnyTutorialActive = showTutorial || showSupportTutorial || showAirplaneTutorial;

  // ====== 응원일기 튜토리얼 ======
  useEffect(() => {
    if (backgroundOnly) return;
    if (isAnyTutorialActive) return; // 다른 튜토리얼이 활성화되어 있으면 대기
    if (!isTutorialCompleted) return; // 메인 튜토리얼 완료 후

    if (hasRandomDiary && !supportTutorialShown) {
      setTimeout(() => {
        setShowSupportTutorial(true);
      }, 500);
    }
  }, [backgroundOnly, isAnyTutorialActive, isTutorialCompleted, hasRandomDiary, supportTutorialShown]);

  // ====== 종이비행기 튜토리얼 ======
  useEffect(() => {
    if (backgroundOnly) return;
    if (isAnyTutorialActive) return; // 다른 튜토리얼이 활성화되어 있으면 대기
    if (!isTutorialCompleted) return; // 메인 튜토리얼 완료 후

    if (hasNewMessage && !airplaneTutorialShown) {
      setTimeout(() => {
        setShowAirplaneTutorial(true);
      }, 2500);
    }
  }, [backgroundOnly, isAnyTutorialActive, isTutorialCompleted, hasNewMessage, airplaneTutorialShown]);

  // ====== 반응형 위치/스케일 ======
  const aspectRatio = window.innerHeight / window.innerWidth;
  const isLandscape = aspectRatio < 1; // 가로가 더 긴 경우

  const baseScale =
    aspectRatio > 1.8 ? 1.18 : aspectRatio > 1.5 ? 1.08 : aspectRatio > 1.2 ? 0.95 : 0.85;

  const catScale = isLandscape
    ? 1.0 // 가로 모드에서 고양이 크기 유지
    : aspectRatio > 1.8
      ? baseScale * 1.0
      : aspectRatio > 1.5
      ? baseScale * 0.95
      : aspectRatio > 1.2
      ? baseScale * 0.8
      : baseScale * 0.7;

  const heightRatio = Math.min(aspectRatio * 1.2, 1.3);
  const cactusScale = 0.9 + (heightRatio - 1) * 0.5;

  // 가로 모드에서 선인장 위치 조정
  const cactusTop = isLandscape ? "35%" : "34%";

  const openChat = (): void => navigate(ROUTES.CHAT);

  // 선인장 클릭 → BIG5 통계
  const handleCactusClick = (): void => {
    navigate(ROUTES.BIG5_STATS);
  };

  // 책 클릭 → 캘린더 (열림/닫힘 애니메이션)
  const handleBookClick = (): void => {
    if (isCalendarOpen) {
      navigate(ROUTES.HOME);
    } else {
      setIsBookOpening(true);
      setTimeout(() => {
        navigate(ROUTES.CALENDAR);
        setTimeout(() => setIsBookOpening(false), 100);
      }, 600);
    }
  };

  // 고양이 클릭 → 3번 클릭 시 RandomDiaryPage로 이동
  const handleCatClick = (): void => {
    if (!hasRandomDiary) return;

    setCatAnimationKey(prev => prev + 1);
    setClickCount((c) => c + 1);

    if (clickCount + 1 >= 3) {
      setTimeout(() => {
        setHasRandomDiary(false);
        setClickCount(0);
        navigate(ROUTES.RANDOM_DIARY);
      }, 400);
    }
  };

  // 종이비행기 클릭 → 메시지 페이지
  const handleAirplaneClick = (): void => {
    navigate(ROUTES.MESSAGES);
  };

  // ====== 튜토리얼 자동 시작 ======
  useEffect(() => {
    if (backgroundOnly) return;
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

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [backgroundOnly, isTutorialCompleted, location.pathname, startTutorial]);

  const handleTutorialComplete = (): void => setShowTutorial(false);

  // ====== 렌더 ======
  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-end" style={{ backgroundColor: 'var(--color-main-bg)' }}>
      {/* 배경 */}
      <img
        src={isDarkMode ? bgDark : bg}
        alt="background"
        className="absolute inset-0 w-full h-full object-fill select-none pointer-events-none"
        draggable="false"
      />

      {/* 튜토리얼 */}
      {!backgroundOnly && showTutorial && location.pathname === ROUTES.HOME && (
        <Tutorial onComplete={handleTutorialComplete} />
      )}

      {/* 응원일기 처음 알림 튜토리얼 */}
      {!backgroundOnly && showSupportTutorial && (
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

            if (rect.width === 0 || rect.height === 0) return null;

            const catCenterX = rect.left + rect.width / 2;
            const messageWidth = 240;
            const padding = 10;

            const idealMessageLeft = catCenterX - messageWidth / 2;
            const messageLeft = Math.max(20, Math.min(window.innerWidth - messageWidth - 20, idealMessageLeft));
            const messageTop = rect.top - padding - 10;
            const arrowLeft = catCenterX - messageLeft;

            return (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    position: 'absolute',
                    top: rect.top - padding + 5,
                    left: rect.left - padding,
                    width: rect.width + (padding * 2),
                    height: rect.height + (padding * 2),
                    borderRadius: '20px',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                    pointerEvents: 'none',
                    zIndex: 10000,
                    transition: 'all 0.3s ease'
                  }}
                />

                {/* 메시지 박스 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    bottom: `${window.innerHeight - messageTop}px`,
                    left: `${messageLeft}px`,
                    width: `${messageWidth}px`,
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
                      padding: '13px',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                      textAlign: 'center'
                    }}
                  >
                    {/* 화살표 */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-7px',
                        left: `${arrowLeft}px`,
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '9px solid transparent',
                        borderRight: '9px solid transparent',
                        borderTop: '9px solid white'
                      }}
                    />

                    <p
                      style={{
                        fontSize: '16px',
                        lineHeight: '1.5',
                        color: '#333',
                        marginBottom: '12px',
                        whiteSpace: 'pre-line'
                      }}
                    >
                      달이가 편지를 들고 있어요 ✉️{'\n'}익명으로 다른 사람에게 응원 메시지를 보낼 수 있어요
                    </p>

                    <button
                      onClick={() => {
                        setSupportTutorialShown(true);
                        setShowSupportTutorial(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'transparent',
                        border: 'none',
                        color: '#666',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        transition: 'background 0.2s'
                      }}
                    >
                      달이를 3번 쓰다듬어 봐요
                    </button>
                  </div>
                </motion.div>
              </>
            );
          })()}
        </motion.div>
      )}

      {/* 종이비행기 튜토리얼 */}
      {!backgroundOnly && showAirplaneTutorial && hasNewMessage && (
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
          {(() => {
            const airplaneElement = document.querySelector('.airplane-container');
            if (!airplaneElement) return null;
            const rect = airplaneElement.getBoundingClientRect();

            if (rect.width === 0 || rect.height === 0) return null;

            const airplaneCenterX = rect.left + rect.width / 2;
            const messageWidth = 240;
            const padding = 15;

            const idealMessageLeft = airplaneCenterX - messageWidth / 2;
            const messageLeft = Math.max(20, Math.min(window.innerWidth - messageWidth - 20, idealMessageLeft));
            const messageTop = rect.bottom + padding + 10;
            const arrowLeft = airplaneCenterX - messageLeft;

            const handleClose = () => {
              setAirplaneTutorialShown(true);
              setShowAirplaneTutorial(false);
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
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    pointerEvents: 'all'
                  }}
                  onClick={handleClose}
                />

                {/* 스팟라이트 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    position: 'absolute',
                    top: rect.top - padding,
                    left: rect.left - padding,
                    width: rect.width + (padding * 2),
                    height: rect.height + (padding * 2),
                    borderRadius: '50%',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                    pointerEvents: 'none',
                    zIndex: 10501,
                    transition: 'all 0.3s ease'
                  }}
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
                        left: `${arrowLeft}px`,
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
                      누군가가 응원의 메세지를 날렸어요
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

      {/* 선인장 - Big5 통계 */}
      <button
        onClick={handleCactusClick}
        className="cactus-group absolute z-10 hover:scale-110 active:scale-95 transition-transform bg-transparent p-0 border-0"
        style={{
          top: cactusTop,
          left: "20%",
          transform: `translateY(-100%) scale(${cactusScale})`,
        }}
      >
        <img
          src={cactusImage}
          alt="cactus"
          className="object-contain drop-shadow-lg w-[15vw] min-w-[80px] max-w-[130px]"
          style={{ filter: isDarkMode ? 'brightness(0.7)' : 'none' }}
        />
      </button>

      {/* 종이비행기 - 응원 메시지 알림 */}
      {!backgroundOnly && hasNewMessage && (
        <motion.div
          className="airplane-container absolute z-30 cursor-pointer"
          style={{
            top: "42%",
            right: "10%",
          }}
          initial={{
            x: -window.innerWidth * 0.95,
            y: -window.innerHeight * 0.3,
            opacity: 0,
            rotate: -45
          }}
          animate={{
            x: 0,
            y: 0,
            opacity: 1,
            rotate: 0
          }}
          transition={{
            duration: 2,
            ease: [0.34, 1.56, 0.64, 1],
            x: {
              type: "spring",
              damping: 20,
              stiffness: 50
            },
            y: {
              type: "spring",
              damping: 25,
              stiffness: 40
            },
            rotate: {
              duration: 2,
              ease: "easeOut"
            }
          }}
          onClick={handleAirplaneClick}
        >
          {/* 종이비행기 */}
          <motion.img
            src={airplaneSvg}
            alt="paper airplane"
            className="w-[70px] h-[70px] sm:w-[80px] sm:h-[80px] drop-shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          />

          {/* 느낌표 - 깜빡임 */}
          <motion.img
            src={exclamationMark}
            alt="notification"
            className="absolute -bottom-1 -right-1 w-[20px] h-[20px]"
            animate={{
              opacity: [1, 0.3, 1],
              scale: [1, 0.95, 1]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      )}

      {/* 고양이 - 3번 클릭 시 랜덤일기 */}
      {!backgroundOnly && hasRandomDiary ? (
        <button
          onClick={handleCatClick}
          className="cat-container absolute z-20 bg-transparent p-0 border-0 cursor-pointer"
          style={{
            top: "49%",
            left: "2%",
            transform: `translateY(-50%) scale(${catScale})`,
            transformOrigin: "center left",
          }}
        >
          <motion.img
            src={catMessageImage}
            alt="cat"
            className="cat-image object-contain drop-shadow-2xl w-[35vw] min-w-[220px] max-w-[270px]"
            style={{ filter: isDarkMode ? 'brightness(0.7)' : 'none' }}
            key={catAnimationKey}
            animate={{
              y: [0, -20, -10, -15, 0],
              scale: [1, 1.05, 1.02, 1.03, 1]
            }}
            transition={{
              duration: 0.6,
              ease: [0.34, 1.56, 0.64, 1]
            }}
          />
        </button>
      ) : (
        <div
          className="cat-container absolute z-20"
          style={{
            top: "49%",
            left: "6%",
            transform: `translateY(-50%) scale(${catScale})`,
            transformOrigin: "center left",
          }}
        >
          <motion.img
            src={catImage}
            alt="cat"
            className="cat-image object-contain drop-shadow-2xl w-[25vw] min-w-[170px] max-w-[220px]"
            style={{ filter: isDarkMode ? 'brightness(0.9)' : 'none' }}
          />
        </div>
      )}

      {/* 책 → 달력 (열림/닫힘 애니메이션) */}
      <button
        onClick={handleBookClick}
        className="diary-book absolute z-10 bg-transparent p-0 border-0"
        style={{ top: "63%", left: "70%", transform: "translate(-50%, -50%)" }}
      >
        <motion.img
          src={isCalendarOpen || isBookOpening ? bookOpen : bookClose}
          alt="diary"
          className={`object-contain drop-shadow-xl ${
            isCalendarOpen || isBookOpening
              ? 'w-[28vw] min-w-[160px] max-w-[240px]'
              : 'w-[22vw] min-w-[130px] max-w-[190px]'
          }`}
          style={{ filter: isDarkMode ? 'brightness(0.7)' : 'none' }}
          animate={
            isBookOpening
              ? { scale: [1, 1.15, 1.05], rotateY: [0, 15, 0] }
              : isCalendarOpen
              ? {}
              : { scale: 1 }
          }
          whileHover={!isBookOpening ? { scale: 1.05 } : {}}
          whileTap={!isBookOpening ? { scale: 0.95 } : {}}
          transition={{
            duration: 0.6,
            ease: "easeInOut",
            scale: { duration: 0.6 }
          }}
        />
      </button>

      {/* 설정 */}
      {!hideButtons && !backgroundOnly && (
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

      {/* 하단 채팅 인풋바 */}
      {!hideButtons && !backgroundOnly && (
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
