/**
 * 튜토리얼 컨텍스트
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { TUTORIAL_COMPLETED_KEY } from '../constants/tutorialSteps';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface TutorialContextValue {
  isTutorialCompleted: boolean;
  currentStep: number;
  startTutorial: () => void;
  nextStep: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextValue | undefined>(undefined);

export const useTutorial = (): TutorialContextValue => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
};

interface TutorialProviderProps {
  children: ReactNode;
}

export const TutorialProvider = ({ children }: TutorialProviderProps) => {
  const [isTutorialCompleted, setIsTutorialCompleted, removeTutorialCompleted] = useLocalStorage<boolean>(TUTORIAL_COMPLETED_KEY, false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isStarted, setIsStarted] = useState<boolean>(false);

  // 튜토리얼 시작
  const startTutorial = (): void => {
    // 이미 시작했거나 완료된 경우 무시
    if (isStarted || isTutorialCompleted) {
      console.log('튜토리얼 이미 시작됨 또는 완료됨, 무시');
      return;
    }
    console.log('튜토리얼 시작!');
    setCurrentStep(0);
    setIsTutorialCompleted(false);
    setIsStarted(true);
  };

  // 다음 단계
  const nextStep = (): void => {
    console.log('nextStep 호출: 현재 스텝', currentStep, '-> 다음 스텝', currentStep + 1);
    setCurrentStep((prev) => {
      console.log('setCurrentStep: prev=', prev, 'next=', prev + 1);
      return prev + 1;
    });
  };

  // 튜토리얼 완료
  const completeTutorial = (): void => {
    console.log('튜토리얼 완료!');
    setIsTutorialCompleted(true);
    setIsStarted(false);
  };

  // 튜토리얼 리셋 (테스트용)
  const resetTutorial = (): void => {
    console.log('튜토리얼 리셋');
    removeTutorialCompleted();
    setCurrentStep(0);
    setIsStarted(false);
  };

  const value: TutorialContextValue = {
    isTutorialCompleted,
    currentStep,
    startTutorial,
    nextStep,
    completeTutorial,
    resetTutorial
  };

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
};
