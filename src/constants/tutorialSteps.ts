interface TutorialStep {
  id: number;
  target: string | null;
  message: string;
  position: 'top' | 'bottom' | 'center';
}

// 튜토리얼 단계
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    target: ".settings-icon",
    message: "우측상단 톱니바퀴에서 사용자 정보를 수정할 수 있어요",
    position: "bottom"
  },
  {
    id: 2,
    target: ".cactus-group",
    message: "선인장을 클릭하면 익명으로 다른 사람에게 응원 메시지를 보낼 수 있어요",
    position: "top"
  },
  {
    id: 3,
    target: ".cat-image",
    message: "고양이를 클릭하면 대화를 시작할 수 있어요",
    position: "top"
  },
  {
    id: 4,
    target: ".diary-book",
    message: "일기장을 클릭하면 캘린더에서 작성한 일기를 확인할 수 있어요",
    position: "top"
  },
  {
    id: 5,
    target: null,
    message: "자, 이제 시작해볼까요? 오늘 하루는 어땠나요?",
    position: "center"
  }
];

// 튜토리얼 완료 여부 로컬스토리지 키
export const TUTORIAL_COMPLETED_KEY = "catus_tutorial_completed";
