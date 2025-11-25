import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '../contexts/TutorialContext';
import { TUTORIAL_STEPS } from '../constants/tutorialSteps';

interface TutorialProps {
  onComplete?: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function Tutorial({ onComplete }: TutorialProps) {
  const { currentStep, nextStep, completeTutorial } = useTutorial();
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const currentTutorial = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  // 타겟 요소 위치 계산
  useEffect(() => {
    if (!currentTutorial?.target) {
      setTargetRect(null);
      return;
    }

    const updateTargetRect = () => {
      const element = document.querySelector(currentTutorial.target!);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      }
    };

    // 폰트 로드 후 타겟 크기 계산
    document.fonts.ready.then(() => {
      setTimeout(updateTargetRect, 100);
    });

    window.addEventListener('resize', updateTargetRect);
    return () => window.removeEventListener('resize', updateTargetRect);
  }, [currentStep, currentTutorial]);

  // 다음 버튼 클릭
  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      nextStep();
    }
  };

  // 튜토리얼 완료
  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      completeTutorial();
      if (onComplete) onComplete();
    }, 300);
  };

  // 메시지 위치와 화살표 방향 계산
  const getMessageStyle = (): {
    style: React.CSSProperties;
    arrow: 'top' | 'bottom' | null;
    arrowLeft: string | null;
  } => {
    if (!targetRect || !currentTutorial) {
      return {
        style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        arrow: null,
        arrowLeft: null
      };
    }

    const position = currentTutorial.position;
    const padding = 24;
    const messageWidth = 240;
    let arrowPosition: 'top' | 'bottom' | null = null;
    let arrowLeft: string | null = null;

    const targetCenterX = targetRect.left + targetRect.width / 2;

    let style: React.CSSProperties = {};

    switch (position) {
      case 'top': {
        const messageLeft = Math.max(20, Math.min(window.innerWidth - messageWidth - 20, targetCenterX - messageWidth / 2));
        style = {
          bottom: `${window.innerHeight - targetRect.top + padding}px`,
          left: `${messageLeft}px`
        };
        arrowPosition = 'bottom';
        arrowLeft = `${targetCenterX - messageLeft}px`;
        break;
      }
      case 'bottom': {
        const messageLeft = window.innerWidth - messageWidth - 20;
        style = {
          top: `${targetRect.top + targetRect.height + padding}px`,
          left: `${messageLeft}px`
        };
        arrowPosition = 'top';
        const arrowOffset = targetCenterX - messageLeft;
        const minArrow = 30;
        const maxArrow = messageWidth - 30;
        arrowLeft = `${Math.max(minArrow, Math.min(maxArrow, arrowOffset))}px`;
        break;
      }
      case 'center':
      default:
        style = {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
        arrowPosition = null;
        arrowLeft = null;
        break;
    }

    return { style, arrow: arrowPosition, arrowLeft };
  };

  if (!isVisible || !currentTutorial) return null;

  const { style: messageStyle, arrow: arrowPosition, arrowLeft } = getMessageStyle();

  return (
    <AnimatePresence>
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
            pointerEvents: 'all',
            cursor: 'pointer'
          }}
          onClick={handleNext}
        />

        {/* 스팟라이트 효과 */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'absolute',
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              borderRadius: '12px',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              pointerEvents: 'none',
              zIndex: 10000,
              transition: 'all 0.3s ease'
            }}
          />
        )}

        {/* 메시지 박스 */}
        <motion.div
          initial={{
            opacity: 0,
            ...(currentTutorial.position === 'center' ? { scale: 0.9 } : { y: 20 })
          }}
          animate={{
            opacity: 1,
            ...(currentTutorial.position === 'center' ? { scale: 1 } : { y: 0 })
          }}
          exit={{ opacity: 0 }}
          style={{
            ...messageStyle,
            position: 'absolute',
            maxWidth: '240px',
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
            {arrowPosition && (
              <div
                style={{
                  position: 'absolute',
                  width: 0,
                  height: 0,
                  ...(arrowPosition === 'top' && {
                    top: '-7px',
                    left: arrowLeft || '50%',
                    transform: 'translateX(-50%)',
                    borderLeft: '9px solid transparent',
                    borderRight: '9px solid transparent',
                    borderBottom: '9px solid white'
                  }),
                  ...(arrowPosition === 'bottom' && {
                    bottom: '-7px',
                    left: arrowLeft || '50%',
                    transform: 'translateX(-50%)',
                    borderLeft: '9px solid transparent',
                    borderRight: '9px solid transparent',
                    borderTop: '9px solid white'
                  })
                }}
              />
            )}

            {/* 메시지 텍스트 */}
            <p
              style={{
                fontSize: '16px',
                lineHeight: '1.5',
                color: '#333',
                marginBottom: '12px',
                whiteSpace: 'pre-line'
              }}
            >
              {currentTutorial.message}
            </p>

            {/* 알아가기 버튼 */}
            <button
              onClick={handleNext}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: '#666',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'color 0.2s ease'
              }}
            >
              {isLastStep ? '시작하기' : '알아가기'} →
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
