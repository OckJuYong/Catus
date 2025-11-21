interface OnboardingQuestion {
  id: number;
  question: string;
  type: 'selection' | 'text';
  options?: string[];
  placeholder?: string;
}

// 온보딩 질문 (PDF 명세 기준)
export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 1,
    question: "성별을 알려주세요",
    type: "selection",
    options: ["여자", "남자", "선택 안함"]
  },
  {
    id: 2,
    question: "연령대를 선택해주세요",
    type: "selection",
    options: ["10대", "20대", "30대", "40대 이상"]
  },
  {
    id: 3,
    question: "현재 직업은?",
    type: "selection",
    options: ["학생", "직장인", "기타"]
  },
  {
    id: 4,
    question: "이 서비스를 사용하는 목적을 알려주세요",
    type: "text",
    placeholder: "일기 기록용, 힐링용, 재미있어 보여서 등..."
  }
];

// 온보딩 완료 여부 로컬스토리지 키
export const ONBOARDING_COMPLETED_KEY = "catus_onboarding_completed";
