// 라우트 경로 상수
export const ROUTES = {
  INTRO: "/",
  ONBOARDING: "/onboarding",
  ONBOARDING_CHAT: "/onboarding/chat",
  LOADING: "/loading",
  HOME: "/home",
  CHAT: "/chat",
  CHAT_ANALYSIS: "/chat/analysis",
  CHAT_DATE: "/chat/:date",
  CALENDAR: "/calendar",
  DIARY: "/diary",
  DIARY_DETAIL: "/diary/:date",
  SETTINGS: "/settings",
  MESSAGES: "/messages",
  BIG5_STATS: "/big5/stats",
  BIG5_TEST: "/big5/test",
  RANDOM_DIARY: "/random-diary",
  DIARY_REVEAL: "/diary-reveal"
} as const;

// 라우트 경로 생성 헬퍼
export const createDiaryDetailPath = (date: string): string => `/diary/${date}`;
