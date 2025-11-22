/**
 * 공통 타입 정의
 */

// ===== 감정 타입 =====
export type Emotion = '행복' | '슬픔' | '보통' | '화남' | '불안';

// ===== 인증 관련 타입 =====
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  userId: number;
}

export interface SignupData {
  nickname: string;
  password: string;
  diaryGenerationTime: string;
}

export interface SignupResponse {
  message: string;
  userId: number;
}

export interface VerificationCodeResponse {
  code: string;
  expiresInMinutes: number;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ===== 사용자 관련 타입 =====
export interface User {
  id: number;
  nickname: string;
  profileImage?: string;
  createdAt: string;
}

export interface OnboardingData {
  gender: '여자' | '남자' | '선택 안함';
  ageGroup: '10대' | '20대' | '30대' | '40대 이상';
  occupation: '학생' | '직장인' | '기타';
  purpose: string;
}

// ===== 채팅 관련 타입 =====
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// 백엔드: POST /api/chat/message 응답
export interface ChatMessageResponse {
  messageId: number;
  userMessage: string;
  aiResponse: string;
  timestamp: string;
}

// 백엔드: GET /api/chat/history 응답
export interface ChatHistory {
  messages: Array<{
    id: number;
    userMessage: string;
    aiResponse: string;
    timestamp: string;
  }>;
  totalPages: number;
  currentPage: number;
}

// 백엔드: GET /api/chat/context/{date} 응답
export interface ChatContextResponse {
  date: string;
  messages: Array<{
    id: number;
    userMessage: string;
    aiResponse: string;
    timestamp: string;
  }>;
}

// 백엔드: POST /api/chat/analyze 응답
export interface ChatAnalysisResponse {
  period: {
    start: string;
    end: string;
  };
  emotionScores: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  summary: string;
}

// ===== 일기 관련 타입 =====
// 백엔드: GET /api/diary/list 응답
export interface DiaryListResponse {
  year: number;
  month: number;
  diaries: Array<{
    id: number;
    date: string;
    title: string;
    previewText: string;
    thumbnailUrl: string;
  }>;
  totalCount: number;
}

// 백엔드: GET /api/diary/{id} 응답
export interface DiaryDetailResponse {
  id: number;
  date: string;
  title: string;
  content: string;
  imageUrl: string;
  big5Scores?: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  createdAt: string;
}

// 백엔드: PUT /api/diary/{id} 요청
export interface DiaryUpdateData {
  title?: string;
  content?: string;
}

// 백엔드: GET /api/diary/random 응답
export interface DiaryRandomResponse {
  diaryId: number;
  title: string;
  date: string;
  previewText: string;
  thumbnailUrl: string;
}

// 호환성을 위한 Diary 타입 (기존 코드와 호환)
export interface Diary {
  id: number;
  date: string;
  title: string;
  content: string;
  imageUrl: string;
  createdAt: string;
}

// ===== 메시지 관련 타입 =====
// 백엔드: POST /api/message/send 응답
export interface MessageSendResponse {
  messageId: number;
  sentAt: string;
}

// 백엔드: GET /api/message/received 응답
export interface MessageReceivedResponse {
  messages: Array<{
    id: number;
    content: string;
    diaryId: number;
    receivedAt: string;
    isRead: boolean;
  }>;
  totalPages: number;
  unreadCount: number;
}

// 백엔드: GET /api/message/notifications 응답
export interface NotificationsResponse {
  unreadCount: number;
  notifications: Array<{
    id: number;
    content: string;
    receivedAt: string;
  }>;
}

// 호환성을 위한 타입
export interface AnonymousMessage {
  id: number;
  content: string;
  diaryId?: number;
  isRead: boolean;
  receivedAt: string;
}

export interface MessageResponse {
  messages: AnonymousMessage[];
  totalPages?: number;
  unreadCount?: number;
}

// ===== Big5 성격 분석 타입 =====
export interface Big5Scores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

// 백엔드: POST /api/big5/initial 응답
export interface Big5TestResponse {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  analysis: string;
}

// 백엔드: GET /api/big5/current 응답
export interface Big5CurrentResponse {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

// 백엔드: GET /api/big5/history 응답
export interface Big5HistoryResponse {
  period: string;
  history: Array<{
    date: string;
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  }>;
}

// ===== 설정 관련 타입 =====
// 백엔드: GET /api/settings 응답
export interface SettingsResponse {
  diaryGenerationTime: string;
  notifications: {
    diaryCreated: boolean;
    messageReceived: boolean;
  };
  theme: {
    darkMode: boolean;
  };
  profile: {
    nickname: string;
    email: string;
  };
}

// 호환성을 위한 타입
export interface Settings {
  diaryTime: string;
  notificationEnabled: boolean;
  kakaoNotificationEnabled: boolean;
  darkMode: boolean;
  nickname: string;
}

// ===== 통계 관련 타입 =====
export interface EmotionStat {
  date: string;
  emotion: Emotion;
}

export interface EmotionsResponse {
  emotions: EmotionStat[];
}

export interface MonthlyStats {
  totalDiaries: number;
  mostFrequentEmotion: Emotion;
  averageMessagesPerDay: number;
}

// ===== API 에러 타입 =====
export interface ApiErrorResponse {
  message: string;
  error: string;
  statusCode: number;
}

// ===== 로컬 스토리지 타입 =====
export interface LocalStorageKeys {
  catus_access_token: string;
  catus_onboarding_completed: boolean;
  received_messages: AnonymousMessage[];
  last_checked_received_count: number;
  support_tutorial_shown: boolean;
  catus_dark_mode: boolean;
  catus_diary_time: string;
}

// ===== 비동기 DB (IndexedDB) 타입 =====
export interface ChatDB {
  [date: string]: ChatMessage[];
}

// ===== 컴포넌트 Props 타입 =====
export interface ModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface WithdrawModalProps extends ModalProps {
  onConfirm: () => void;
  isLoading: boolean;
}

export interface TutorialProps {
  onComplete: () => void;
}

// ===== Hook 반환 타입 =====
export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  login: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
}

export interface UseDarkModeReturn {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  syncFromServer: () => Promise<void>;
}

export interface UseTutorialReturn {
  isTutorialCompleted: boolean;
  startTutorial: () => void;
  completeTutorial: () => void;
}
