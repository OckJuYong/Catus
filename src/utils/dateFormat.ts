/**
 * 날짜 포맷팅 유틸리티
 */

type DateInput = Date | string;
type DateFormat = 'full' | 'date' | 'time' | 'datetime';

/**
 * 날짜를 한국어 형식으로 포맷팅
 */
export const formatDate = (date: DateInput, format: DateFormat = 'full'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (!(d instanceof Date) || isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();

  switch (format) {
    case 'full':
      return `${year}년 ${month}월 ${day}일`;
    case 'date':
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    case 'time':
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    case 'datetime':
      return `${year}년 ${month}월 ${day}일 ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    default:
      return `${year}년 ${month}월 ${day}일`;
  }
};

/** 한국어 날짜 형식 반환 (2025년 1월 5일) */
export const getKoreanDate = (date: DateInput): string => formatDate(date, 'full');

/** ISO 날짜 문자열 반환 (2025-01-05) */
export const getISODate = (date: DateInput): string => formatDate(date, 'date');

/** 오늘 날짜인지 확인 */
export const isToday = (date: DateInput): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();

  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
};

/** 어제 날짜인지 확인 */
export const isYesterday = (date: DateInput): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  );
};

/** 특정 월의 일수 반환 */
export const getMonthDays = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

/** 특정 날짜의 요일 반환 (0: 일요일, 6: 토요일) */
export const getDayOfWeek = (date: DateInput): number => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getDay();
};

/** 요일 이름 반환 (한글) */
export const getDayName = (date: DateInput): string => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayIndex = getDayOfWeek(date);
  return days[dayIndex]!;
};

/** 상대 시간 표시 (방금 전, 3분 전, 1시간 전 등) */
export const getRelativeTime = (date: DateInput): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return '방금 전';
  } else if (minutes < 60) {
    return `${minutes}분 전`;
  } else if (hours < 24) {
    return `${hours}시간 전`;
  } else if (days < 7) {
    return `${days}일 전`;
  } else if (isToday(d)) {
    return '오늘';
  } else if (isYesterday(d)) {
    return '어제';
  } else {
    return formatDate(d, 'full');
  }
};

/** 월의 첫 날 반환 */
export const getFirstDayOfMonth = (year: number, month: number): Date => {
  return new Date(year, month - 1, 1);
};

/** 월의 마지막 날 반환 */
export const getLastDayOfMonth = (year: number, month: number): Date => {
  return new Date(year, month, 0);
};

/** 날짜 범위 생성 (시작일 ~ 종료일) */
export const getDateRange = (startDate: DateInput, endDate: DateInput): Date[] => {
  const dates: Date[] = [];
  const current = new Date(typeof startDate === 'string' ? startDate : startDate);
  const end = new Date(typeof endDate === 'string' ? endDate : endDate);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

/** 날짜 문자열 파싱 (YYYY-MM-DD → Date) */
export const parseDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year!, month! - 1, day);
};

/** 현재 날짜/시간 반환 */
export const now = (): Date => new Date();

/** 오늘 날짜 (00:00:00) */
export const today = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
