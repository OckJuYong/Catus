import type { Emotion } from '../types';

// 감정 색상 매핑 (PDF 명세 기준)
export const EMOTION_COLORS: Record<Emotion, string> = {
  행복: "#6BCB77",
  슬픔: "#4D96FF",
  불안: "#FFD93D",
  화남: "#FF6B6B",
  보통: "#9E9E9E"
};

// 감정 영문 매핑 (필요시 사용)
export const EMOTION_NAMES = {
  HAPPY: "행복",
  SAD: "슬픔",
  ANXIOUS: "불안",
  ANGRY: "화남",
  NEUTRAL: "보통"
} as const;

// 감정 이모지 매핑
export const EMOTION_EMOJIS: Record<Emotion, string> = {
  행복: "😊",
  슬픔: "😢",
  불안: "😰",
  화남: "😠",
  보통: "😐"
};
