import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import catImage from "../assets/images/cat.png";
import footprintIcon from "../assets/images/footprint.svg";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<Array<{ type: string; text: string }>>([]);
  const [inputText, setInputText] = useState("");
  const [isWaiting, setIsWaiting] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [consentValues, setConsentValues] = useState({
    privacyConsent: false,
  });
  const [userAnswers, setUserAnswers] = useState<{
    gender?: string;
    ageGroup?: string;
    livingType?: string;
    nickname?: string;
    privacyConsent?: boolean;
  }>({});

  // 5단계: 필수 정보 + 개인정보 수집 동의
  const steps = [
    {
      id: 0,
      question: "(달이가 멀찍이서 지켜본다)\n달이가 집사의 성별을 궁금해 한다.",
      options: ["여성", "남성"],
      field: "gender"
    },
    {
      id: 1,
      question: "(달이가 관심을 가진다)\n연령대를 알려줘!",
      options: ["10대", "20대", "30대", "40대 이상"],
      field: "ageGroup"
    },
    {
      id: 2,
      question: "(달이가 코를 킁킁거린다)\n어떻게 살고 있어?",
      options: ["혼자 살아요", "가족과 함께", "룸메/기숙사"],
      field: "livingType"
    },
    {
      id: 3,
      sequence: [
        "(달이가 경계를 풀고 옆에 앉는다.)",
        "집사님 이름이 뭐야?",
      ],
      input: true,
      field: "nickname"
    },
    {
      id: 4,
      question: "(달이가 진지한 눈으로 바라본다)\n마지막으로 하나만 확인할게!",
      consent: true,
      field: "privacyConsent"
    },
  ];

  useEffect(() => {
    setMessages([{ type: "question", text: steps[0].question }]);
    setTimeout(() => setIsWaiting(false), 800);
  }, []);

  const handleOptionClick = async (option: string) => {
    if (isWaiting) return;
    setIsWaiting(true);

    // 답변 저장
    const currentStep = steps[step];
    const scoreMap = (currentStep as any).scoreMap;
    const value = scoreMap ? scoreMap[option] : option;

    const updatedAnswers = {
      ...userAnswers,
      [currentStep.field]: value
    };
    setUserAnswers(updatedAnswers);

    setTimeout(() => {
      setMessages((prev) => [...prev, { type: "answer", text: option }]);
    }, 400);

    // 마지막 단계 (외로움 문항) 체크
    const isLastStep = step === steps.length - 1;

    setTimeout(async () => {
      if (isLastStep) {
        // 마지막 단계 - 제출
        await completeOnboarding(updatedAnswers);
      } else {
        const nextStep = step + 1;
        setStep(nextStep);

        if (steps[nextStep].input) {
          setMessages((prev) => [
            ...prev,
            { type: "question", text: steps[nextStep].sequence![0] },
          ]);

          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              { type: "question-green", text: steps[nextStep].sequence![1] },
            ]);
          }, 800);

          setTimeout(() => {
            setShowInput(true);
            setIsWaiting(false);
          }, 1600);
        } else if ((steps[nextStep] as any).consent) {
          // 연구 동의 단계
          setMessages((prev) => [
            ...prev,
            { type: "question", text: steps[nextStep].question! },
          ]);
          setTimeout(() => {
            setShowConsent(true);
            setIsWaiting(false);
          }, 800);
        } else {
          setMessages((prev) => [
            ...prev,
            { type: "question", text: steps[nextStep].question! },
          ]);
          setTimeout(() => setIsWaiting(false), 800);
        }
      }
    }, 1600);
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    const currentStep = steps[step];
    const updatedAnswers = {
      ...userAnswers,
      [currentStep.field]: inputText.trim()
    };
    setUserAnswers(updatedAnswers);

    setMessages((prev) => [...prev, { type: "answer", text: inputText }]);
    setInputText("");

    // 다음 단계로 이동 (닉네임 → 외로움 문항)
    setShowInput(false);
    setIsWaiting(true);

    setTimeout(() => {
      const nextStep = step + 1;
      if (nextStep < steps.length) {
        setStep(nextStep);

        if (steps[nextStep].input) {
          setMessages((prev) => [
            ...prev,
            { type: "question", text: steps[nextStep].sequence![0] },
          ]);

          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              { type: "question-green", text: steps[nextStep].sequence![1] },
            ]);
          }, 800);

          setTimeout(() => {
            setShowInput(true);
            setIsWaiting(false);
          }, 1600);
        } else {
          // 외로움 문항 (선택지 형태)
          setMessages((prev) => [
            ...prev,
            { type: "question", text: steps[nextStep].question! },
          ]);
          setTimeout(() => setIsWaiting(false), 800);
        }
      }
    }, 1600);
  };

  // 온보딩 완료 처리
  const completeOnboarding = async (finalAnswers: typeof userAnswers) => {
    setIsLoading(true);

    try {
      // localStorage에 사용자 정보 저장
      localStorage.setItem('catus_user_gender', finalAnswers.gender || '');
      localStorage.setItem('catus_user_age_group', finalAnswers.ageGroup || '');
      localStorage.setItem('catus_user_living_type', finalAnswers.livingType || '');
      localStorage.setItem('catus_user_nickname', finalAnswers.nickname || '달이집사');
      localStorage.setItem('catus_onboarding_completed', 'true');

      console.log('✅ 온보딩 정보 localStorage 저장 완료:', finalAnswers);

      // Supabase DB에 온보딩 완료 상태 저장
      if (user?.id) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            nickname: finalAnswers.nickname || '달이집사',
            onboarding_completed: true,
          })
          .eq('id', user.id);

        if (updateError) {
          console.warn('⚠️ DB 온보딩 업데이트 실패:', updateError);
        } else {
          console.log('✅ DB 온보딩 완료 상태 저장 완료');
          // AuthContext의 user 상태도 업데이트
          updateUser({
            nickname: finalAnswers.nickname || '달이집사',
            onboardingCompleted: true
          });
        }
      }

      // 3초 후 홈으로 이동
      setTimeout(() => {
        navigate('/home');
      }, 3000);
    } catch (error: any) {
      console.error('온보딩 저장 실패:', error);
      setIsLoading(false);
      showToast('온보딩 정보 저장에 실패했습니다. 다시 시도해주세요.', 'error');
    }
  };

  // 개인정보 동의 제출 핸들러
  const handleConsentSubmit = async () => {
    if (!consentValues.privacyConsent) return;

    setIsWaiting(true);
    setShowConsent(false);

    // 동의 상태 메시지 추가
    setMessages((prev) => [...prev, { type: "answer", text: "동의할게!" }]);

    // userAnswers에 동의 정보 저장
    const updatedAnswers = {
      ...userAnswers,
      privacyConsent: consentValues.privacyConsent,
    };
    setUserAnswers(updatedAnswers);

    // 로컬 스토리지에 저장
    localStorage.setItem('catus_privacy_consent', 'true');

    // 마지막 단계이므로 온보딩 완료
    setTimeout(async () => {
      await completeOnboarding(updatedAnswers);
    }, 1600);
  };

  const handleSkip = () => {
    navigate('/home');
  };

  const progress = ((step + 1) / steps.length) * 100;

  if (isLoading) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          background: "linear-gradient(to bottom, #2f2f2f 0%, #d9d4c8 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          margin: 0,
          padding: 0,
        }}
      >
        {/* 발자국 애니메이션 */}
        <div style={{ position: "absolute", inset: 0 }}>
          {[...Array(5)].map((_, i) => {
            const baseRight = 10 + i * 14;
            const baseBottom = 5 + i * 16;
            const offsetX = i % 2 === 0 ? -8 : 8;

            return (
              <motion.img
                key={i}
                src={footprintIcon}
                alt="footprint"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.25,
                  ease: "easeOut",
                }}
                style={{
                  position: "absolute",
                  right: `${baseRight + offsetX}%`,
                  bottom: `${baseBottom}%`,
                  transform: `rotate(${i % 2 === 0 ? "-22deg" : "28deg"})`,
                  width: `${38 + i * 1.5}px`,
                  height: `${38 + i * 1.5}px`,
                  filter: "brightness(0) invert(1)",
                  opacity: 0.9,
                }}
              />
            );
          })}

          {/* 마지막 발자국 - 빛나며 사라지는 효과 */}
          <motion.img
            src={footprintIcon}
            alt="footprint-glow"
            initial={{ opacity: 0, scale: 0.8, filter: "brightness(0) invert(1)" }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.8, 1, 1.2],
              filter: [
                "brightness(0) invert(1)",
                "brightness(2) invert(1)",
                "brightness(4) invert(1)",
              ],
            }}
            transition={{
              delay: 1.8,
              duration: 1.6,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              right: "82%",
              bottom: "88%",
              transform: "rotate(15deg)",
              width: "44px",
              height: "44px",
              opacity: 0.9,
            }}
          />
        </div>

        {/* 중앙 텍스트 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            textAlign: "center",
            zIndex: 10,
          }}
        >
          <p
            style={{
              color: "white",
              fontSize: "1.3rem",
              fontWeight: 500,
              letterSpacing: "0.03em",
            }}
          >
            간택 당하는 중...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-main-bg flex flex-col overflow-hidden">
      {/* 상단 진행도 */}
      <div className="w-full flex flex-col items-center pt-[10px] pb-4 bg-main-bg sticky top-0 z-30">
        {/* 진행도 바 (80% 중앙) */}
        <div className="relative w-[80%] h-[8px] rounded-full mb-2" style={{ backgroundColor: 'var(--color-border)' }}>
          <motion.div
            className="absolute top-0 left-0 h-full bg-[#59B464] rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
          <motion.img
            src={footprintIcon}
            alt="progress-footprint"
            className="absolute w-[16px] h-[16px] top-[-4px] z-50 select-none"
            animate={{ left: `calc(${progress}% - 8px)` }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>

        {/* 진행 단계 텍스트 */}
        <p className="text-sm sm:text-base font-medium text-center" style={{ color: 'var(--color-text-primary)' }}>
          Step {step + 1}/5 - {step < 4 ? '달이에게 당신을 알려주세요' : '개인정보 수집 동의'}
        </p>
      </div>

      {/* 고양이 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.img
          src={catImage}
          alt="Black Cat"
          className="w-[144px] sm:w-[180px] object-contain select-none"
          style={{ position: "fixed", top: "50%", left: "50%", zIndex: 0 }}
          initial={{ scale: 0.6, opacity: 0.3, x: "-50%", y: "-50%" }}
          animate={{
            scale: step === 0 ? 0.6 : step === 1 ? 0.75 : step === 2 ? 0.9 : step === 3 ? 1.05 : 1.15,
            opacity: step === 0 ? 0.3 : step === 1 ? 0.5 : step === 2 ? 0.75 : step === 3 ? 0.9 : 1,
            x: "-50%",
            y: "-50%",
          }}
          transition={{
            duration: 1.0,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* 대화 영역 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-8 z-10 space-y-4 mt-4">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{
                opacity: 0,
                y:
                  msg.type === "question" || msg.type === "question-green"
                    ? -10
                    : 10,
                scale: msg.type === "question-green" ? 0.8 : 1,
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: msg.type === "question-green" ? 0.45 : 0.35,
                ease: "easeOut",
              }}
              className={`flex ${
                msg.type === "question" || msg.type === "question-green"
                  ? "justify-start"
                  : "justify-end"
              }`}
            >
              <div
                className={`${
                  msg.type === "question"
                    ? "bubble-left"
                    : msg.type === "question-green"
                    ? "bubble-left bubble-green-text"
                    : "bubble-right"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 선택지 버튼 */}
        {!steps[step].input && !isWaiting ? (
          <motion.div
            key={`options-${step}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap justify-end gap-2 mt-3"
          >
            {steps[step].options?.map((opt, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
                onClick={() => handleOptionClick(opt)}
                className="bubble-right cursor-pointer hover:opacity-80 transition-all border-none outline-none"
              >
                {opt}
              </motion.button>
            ))}
          </motion.div>
        ) : null}

        {/* 개인정보 수집 동의 UI */}
        {(steps[step] as any).consent && showConsent && (
          <motion.div
            key="consent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-4 mx-2"
          >
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '12px',
              }}
            >
              {/* 개인정보 수집 동의 */}
              <div className="flex justify-between items-center">
                <div>
                  <span style={{ fontSize: '14px', color: '#333', display: 'block' }}>개인정보 수집 동의 (필수)</span>
                  <span style={{ fontSize: '11px', color: '#999' }}>서비스 이용을 위한 개인정보 수집</span>
                </div>
                <div
                  onClick={() => setConsentValues(prev => ({ ...prev, privacyConsent: !prev.privacyConsent }))}
                  style={{
                    width: '44px',
                    height: '26px',
                    borderRadius: '13px',
                    backgroundColor: consentValues.privacyConsent ? '#59B464' : '#D1D5DB',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.3s',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: consentValues.privacyConsent ? '21px' : '3px',
                      width: '20px',
                      height: '20px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '50%',
                      transition: 'left 0.3s',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 확인 버튼 */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleConsentSubmit}
              disabled={!consentValues.privacyConsent}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: consentValues.privacyConsent ? '#59B464' : '#D1D5DB',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: consentValues.privacyConsent ? 'pointer' : 'not-allowed',
              }}
            >
              동의하고 시작하기
            </motion.button>
          </motion.div>
        )}

        {/* 입력창 */}
        {steps[step].input && showInput && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex justify-end items-center gap-1 mt-3"
          >
            <button
              onClick={handleSubmit}
              className="bg-[#7F7F7F] text-white px-4 py-2 rounded-full text-sm h-[40px] flex items-center justify-center hover:opacity-80 transition-all border-none outline-none"
            >
              전송
            </button>
            <div
              className="relative flex items-center"
              style={{ transform: "translateX(5px)" }}
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit();
                  }
                }}
                placeholder={step === 3 ? "닉네임을 입력해주세요" : "이야기를 입력해주세요."}
                className="bubble-right w-[150px] sm:w-[200px] bg-[#7F7F7F] border-none outline-none custom-input"
              />
              <div
                className="absolute right-[18px] top-1/2 -translate-y-1/4
                   w-0 h-0 border-t-[6px] border-t-transparent
                   border-b-[6px] border-b-transparent
                   border-l-[13px] border-l-[#7F7F7F]"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* 하단 */}
      <div className="w-full text-center py-[15px] bg-main-bg">
        <button onClick={handleSkip} className="text-sm sm:text-base transition-colors bg-transparent border-none outline-none" style={{ color: 'var(--color-text-primary)' }}>
          건너뛰기
        </button>
      </div>

      {/* 스타일 */}
      <style>{`
        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow-x: hidden;
          background: var(--color-main-bg);
        }
        .bubble-left {
          position: relative;
          display: inline-block;
          background: #000;
          color: white;
          padding: 10px 14px;
          border-radius: 37px;
          font-size: 14px;
          line-height: 1.5;
          word-break: keep-all;
          max-width: 70%;
          margin-left: 12px;
          margin-bottom: 10px;
          white-space: pre-line;
        }
        .bubble-left::after {
          content: '';
          position: absolute;
          border-style: solid;
          border-width: 6px 13px 6px 0;
          border-color: transparent #000;
          left: -9px;
          top: 50%;
          transform: translateY(-50%);
        }
        .bubble-green-text {
          color: #4FA958;
          margin-top: 6px;
        }
        .bubble-right {
          position: relative;
          display: inline-block;
          background: #7F7F7F;
          color: white;
          padding: 10px 14px;
          border-radius: 37px;
          font-size: 14px;
          line-height: 1.5;
          word-break: keep-all;
          max-width: 70%;
          margin-right: 12px;
        }
        .bubble-right::after {
          content: '';
          position: absolute;
          border-style: solid;
          border-width: 6px 0 6px 13px;
          border-color: transparent #7F7F7F;
          right: -9px;
          top: 50%;
          transform: translateY(-50%);
        }
        .custom-input {
          color: #fff !important;
          caret-color: #fff !important;
          font-size: 14px;
          padding: 10px 16px;
          border-radius: 37px;
          line-height: 1.4;
        }
        .custom-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
