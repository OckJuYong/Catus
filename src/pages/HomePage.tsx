import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "../constants/routes";
import { useTutorial } from "../contexts/TutorialContext";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { messageApi, diaryApi } from "../utils/api";
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

  // 랜덤 일기 존재 여부 (백엔드에서 플래그 받아올 때까지 false)
  const [hasRandomDiary, setHasRandomDiary] = useState(false);

  // ====== Refs for DOM elements (성능 최적화) ======
  const catImageRef = useRef<HTMLImageElement>(null);
  const airplaneRef = useRef<HTMLDivElement>(null);
  const [catRect, setCatRect] = useState<DOMRect | null>(null);
  const [airplaneRect, setAirplaneRect] = useState<DOMRect | null>(null);


  // ====== 백엔드 API로 unreadCount 조회 ======
  const { data: messagesData } = useQuery({
  queryKey: ['messages', 'received'],
  queryFn: () => messageApi.getReceived(0, 20), // 최근 20개 메시지 조회
  enabled: !backgroundOnly,
  refetchInterval: 30000,
});

// unreadCount 계산: 백엔드 응답에 unreadCount가 없으면 messages에서 직접 계산
const unreadCount = messagesData?.unreadCount
  ?? messagesData?.messages?.filter((m: { read?: boolean; isRead?: boolean }) => m.read === false || m.isRead === false).length
  ?? 0;
const hasNewMessage = unreadCount > 0;

  // ====== Big5 데이터 확인 ======
  useEffect(() => {
    if (backgroundOnly) return;

    const checkBig5Data = async () => {
      try {
        await api.big5.getCurrent();
        console.log('✅ Big5 데이터 존재');
      } catch (error: any) {
        console.log('ℹ️ Big5 데이터 없음 - 일기 생성 시 자동 분석됨');
      }
      setIsBig5Checked(true);
    };

    checkBig5Data();
  }, [backgroundOnly, navigate]);

  // ====== 랜덤 일기 존재 여부 확인 (새 일기면 표시) ======
  useEffect(() => {
    if (backgroundOnly) return;

    const checkRandomDiary = async () => {
      try {
        const response = await diaryApi.getRandom();
        // API 응답 구조: { diary: {...} }
        const data = (response as any)?.diary || response;
        const diaryId = data?.diaryId || data?.id;
        const lastViewedId = localStorage.getItem('lastRandomDiaryId');

        // 이미 본 일기면 표시 안함
        if (lastViewedId === String(diaryId)) {
          setHasRandomDiary(false);
          return;
        }

        // 새로운 일기면 표시
        setHasRandomDiary(true);
      } catch {
        setHasRandomDiary(false);
      }
    };

    checkRandomDiary();
  }, [backgroundOnly]);

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

  // ====== 튜토리얼 rect 계산 (렌더 중 DOM 쿼리 방지) ======
  useEffect(() => {
    if (showSupportTutorial && catImageRef.current) {
      setCatRect(catImageRef.current.getBoundingClientRect());
    }
  }, [showSupportTutorial]);

  useEffect(() => {
    if (showAirplaneTutorial && airplaneRef.current) {
      setAirplaneRect(airplaneRef.current.getBoundingClientRect());
    }
  }, [showAirplaneTutorial]);

  // ====== 반응형 위치/스케일 (useMemo로 최적화) ======
  const { catScale, cactusScale, cactusTop } = useMemo(() => {
    const aspectRatio = window.innerHeight / window.innerWidth;
    const isLandscape = aspectRatio < 1;
    const isTablet = aspectRatio >= 1 && aspectRatio <= 1.5;

    const baseScale =
      aspectRatio > 1.8 ? 1.18 : aspectRatio > 1.5 ? 1.08 : aspectRatio > 1.2 ? 0.95 : 0.85;

    const catScaleCalc = isLandscape
      ? 1.0
      : isTablet
      ? 1.0
      : aspectRatio > 1.8
        ? baseScale * 1.0
        : aspectRatio > 1.5
        ? baseScale * 0.95
        : baseScale * 0.8;

    const heightRatio = Math.min(aspectRatio * 1.2, 1.3);
    const cactusScaleCalc = 0.9 + (heightRatio - 1) * 0.5;
    const cactusTopCalc = isLandscape ? "36.5%" : "33.8%";

    return { catScale: catScaleCalc, cactusScale: cactusScaleCalc, cactusTop: cactusTopCalc };
  }, []);

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
        loading="eager"
      />

      {/* 튜토리얼 */}
      {!backgroundOnly && showTutorial && location.pathname === ROUTES.HOME && (
        <Tutorial onComplete={handleTutorialComplete} />
      )}

      {/* 응원일기 처음 알림 튜토리얼 - 최적화됨 */}
      {!backgroundOnly && showSupportTutorial && catRect && (
        <div
          className="fixed inset-0 z-[9999]"
          style={{ pointerEvents: 'none' }}
        >
          {/* 오버레이 배경 - CSS로 처리 */}
          <div
            className="absolute inset-0 bg-black/50"
            style={{ pointerEvents: 'all' }}
            onClick={() => {
              setSupportTutorialShown(true);
              setShowSupportTutorial(false);
            }}
          />

          {/* 메시지 박스 */}
          <div
            className="absolute bg-white rounded-2xl p-4 shadow-lg text-center"
            style={{
              bottom: `${window.innerHeight - catRect.top + 20}px`,
              left: `${Math.max(20, Math.min(window.innerWidth - 260, catRect.left + catRect.width / 2 - 120))}px`,
              width: '240px',
              pointerEvents: 'all',
              zIndex: 10001
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base leading-relaxed text-gray-800 mb-3 whitespace-pre-line">
              달이가 편지를 들고 있어요 ✉️{'\n'}익명으로 다른 사람에게 응원 메시지를 보낼 수 있어요
            </p>
            <button
              onClick={() => {
                setSupportTutorialShown(true);
                setShowSupportTutorial(false);
              }}
              className="w-full py-2 px-3 bg-transparent border-0 text-gray-500 text-sm font-medium cursor-pointer rounded-lg"
            >
              달이를 3번 쓰다듬어 봐요
            </button>
          </div>
        </div>
      )}

      {/* 종이비행기 튜토리얼 - 최적화됨 */}
      {!backgroundOnly && showAirplaneTutorial && hasNewMessage && airplaneRect && (
        <div className="fixed inset-0 z-[10500]" style={{ pointerEvents: 'none' }}>
          {/* 오버레이 배경 */}
          <div
            className="absolute inset-0 bg-black/50"
            style={{ pointerEvents: 'all' }}
            onClick={() => {
              setAirplaneTutorialShown(true);
              setShowAirplaneTutorial(false);
            }}
          />

          {/* 메시지 박스 */}
          <div
            className="absolute bg-white rounded-2xl p-4 shadow-lg text-center"
            style={{
              top: `${airplaneRect.bottom + 25}px`,
              left: `${Math.max(20, Math.min(window.innerWidth - 260, airplaneRect.left + airplaneRect.width / 2 - 120))}px`,
              width: '240px',
              pointerEvents: 'all',
              zIndex: 10502
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[15px] leading-relaxed text-gray-800 mb-3">
              누군가가 응원의 메세지를 날렸어요
            </p>
            <button
              onClick={() => {
                setAirplaneTutorialShown(true);
                setShowAirplaneTutorial(false);
              }}
              className="w-full py-2.5 px-3 bg-[#5F6F52] border-0 text-white text-sm font-semibold cursor-pointer rounded-lg"
            >
              확인
            </button>
          </div>
        </div>
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
          className="object-contain w-[15vw] min-w-[80px] max-w-[130px]"
          style={{ filter: isDarkMode ? 'brightness(0.7)' : undefined }}
          loading="lazy"
        />
      </button>

      {/* 종이비행기 - 응원 메시지 알림 */}
      {!backgroundOnly && hasNewMessage && (
        <div
          ref={airplaneRef}
          className="airplane-container absolute z-30 cursor-pointer"
          style={{ top: "42%", right: "10%" }}
          onClick={handleAirplaneClick}
        >
          {/* 종이비행기 */}
          <img
            src={airplaneSvg}
            alt="paper airplane"
            className="w-[70px] h-[70px] sm:w-[80px] sm:h-[80px]"
            loading="lazy"
          />
          {/* 느낌표 - CSS 애니메이션 */}
          <img
            src={exclamationMark}
            alt="notification"
            className="absolute -bottom-1 -right-1 w-[20px] h-[20px] animate-pulse"
            loading="lazy"
          />
        </div>
      )}

      {/* 고양이 - 3번 클릭 시 랜덤일기 */}
      {!backgroundOnly && hasRandomDiary ? (
        <button
          onClick={handleCatClick}
          className="cat-container absolute z-20 bg-transparent p-0 border-0 cursor-pointer active:scale-95 transition-transform"
          style={{
            top: "49%",
            left: "2%",
            transform: `translateY(-50%) scale(${catScale})`,
            transformOrigin: "center left",
          }}
        >
          <img
            ref={catImageRef}
            src={catMessageImage}
            alt="cat"
            className="cat-image object-contain w-[35vw] min-w-[220px] max-w-[270px]"
            style={{ filter: isDarkMode ? 'brightness(0.7)' : undefined }}
            loading="lazy"
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
          <img
            ref={catImageRef}
            src={catImage}
            alt="cat"
            className="cat-image object-contain w-[25vw] min-w-[170px] max-w-[220px]"
            style={{ filter: isDarkMode ? 'brightness(0.9)' : undefined }}
            loading="lazy"
          />
        </div>
      )}

      {/* 책 → 달력 */}
      <button
        onClick={handleBookClick}
        className="diary-book absolute z-10 bg-transparent p-0 border-0 active:scale-95 transition-transform"
        style={{ top: "63%", left: "70%", transform: "translate(-50%, -50%)" }}
      >
        <img
          src={isCalendarOpen || isBookOpening ? bookOpen : bookClose}
          alt="diary"
          className={`object-contain transition-transform ${
            isCalendarOpen || isBookOpening
              ? 'w-[28vw] min-w-[160px] max-w-[240px] scale-105'
              : 'w-[22vw] min-w-[130px] max-w-[190px]'
          }`}
          style={{ filter: isDarkMode ? 'brightness(0.7)' : undefined }}
          loading="lazy"
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
          className="fixed z-50 cursor-pointer group"
          style={{
            width: '70%',
            left: '46%',
            transform: 'translateX(-50%)',
            bottom: '10px',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)'
          }}
          onClick={openChat}
        >
          <input
            type="text"
            placeholder="오늘 하루는 어땠어?"
            className="chat-input-bar w-full rounded-[20px] text-sm text-gray-400 bg-[white] cursor-pointer pointer-events-none transition-all duration-200 text-center"
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
