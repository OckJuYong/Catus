// 라우트 경로 상수
export const ROUTES = {
  INTRO: "/",
  ONBOARDING: "/onboarding",
  ONBOARDING_CHAT: "/onboarding/chat",
  LOADING: "/loading",
  HOME: "/home",
  CHAT: "/chat",
  CALENDAR: "/calendar",
  DIARY: "/diary",
  DIARY_DETAIL: "/diary/:date",
  SETTINGS: "/settings",
  SUPPORT: "/support",
  LETTER: "/letter",
  BIG5_STATS: "/big5/stats",
  BIG5_TEST: "/big5/test",
  RANDOM_DIARY: "/random-diary"
} as const;

// 라우트 경로 생성 헬퍼
export const createDiaryDetailPath = (date: string): string => `/diary/${date}`;
