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
}

export interface SignupData {
  nickname: string;
  password?: string;
  diaryTime: string;
}

export interface SignupResponse {
  userId: string;
  message: string;
}

// ===== 사용자 관련 타입 =====
export interface User {
  id: string;
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

export interface ChatHistory {
  messages: ChatMessage[];
  pagination?: {
    page: number;
    size: number;
    total: number;
  };
}

export interface ChatAnalysisResponse {
  diaryId: string;
  emotion: string;
  summary: string;
  pictureUrl: string;
  keywords: string[];
  advice: string;
}

// ===== 일기 관련 타입 =====
export interface Diary {
  id: string;
  date: string; // YYYY-MM-DD
  emotion: Emotion;
  summary: string;
  content: string; // 일기 전체 내용
  pictureUrl: string;
  imageUrl?: string; // 이미지 URL (pictureUrl과 호환)
  createdAt: string;
  updatedAt?: string;
}

export interface DiaryListResponse {
  diaries: Diary[];
  totalCount: number;
}

export interface DiaryDetailResponse {
  diary: Diary;
  anonymousMessages: AnonymousMessage[];
}

export interface DiaryCreateData {
  date: string;
  chatLogs: ChatMessage[];
}

export interface DiaryUpdateData {
  content?: string;
  emotion?: Emotion;
}

// ===== 메시지 관련 타입 =====
export interface AnonymousMessage {
  id: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

export interface MessageNotification {
  id: string;
  message: AnonymousMessage;
  unread: boolean;
}

export interface MessageResponse {
  messages: AnonymousMessage[];
  pagination?: {
    page: number;
    size: number;
    total: number;
  };
}

export interface NotificationsResponse {
  notifications: MessageNotification[];
  unreadCount: number;
}

// ===== Big5 성격 분석 타입 =====
export interface Big5Scores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface Big5TestResponse {
  scores: Big5Scores;
  analysis: string;
}

export interface Big5CurrentResponse {
  scores: Big5Scores;
  lastUpdated: string;
}

export interface Big5HistoryItem {
  date: string;
  scores: Big5Scores;
}

export interface Big5HistoryResponse {
  history: Big5HistoryItem[];
  chartData: any; // 차트 데이터 구조는 추후 정의
}

// ===== 설정 관련 타입 =====
export interface Settings {
  diaryTime: string; // HH:mm
  notificationEnabled: boolean;
  kakaoNotificationEnabled: boolean;
  darkMode: boolean;
  nickname: string;
}

export interface SettingsResponse {
  settings: Settings;
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
