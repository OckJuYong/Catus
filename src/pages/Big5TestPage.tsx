/**
 * BIG5 성격 검사 페이지
 * 최초 1회 10문항 테스트 실시
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { big5Api } from '../utils/api';
import { ROUTES } from '../constants/routes';

// BIG5 초기 검사 문항
const BIG5_QUESTIONS = [
  { id: 1, text: '나는 새로운 사람을 만나는 것을 즐긴다', trait: 'openness' },
  { id: 2, text: '나는 계획을 세우고 그대로 실행하는 편이다', trait: 'conscientiousness' },
  { id: 3, text: '나는 사교적이고 활발한 편이다', trait: 'extraversion' },
  { id: 4, text: '나는 다른 사람의 기분을 잘 이해한다', trait: 'agreeableness' },
  { id: 5, text: '나는 걱정이 많은 편이다', trait: 'neuroticism' },
  { id: 6, text: '나는 예술적이고 창의적인 활동을 좋아한다', trait: 'openness' },
  { id: 7, text: '나는 책임감이 강하고 신뢰할 수 있는 사람이다', trait: 'conscientiousness' },
  { id: 8, text: '나는 혼자 있는 것보다 사람들과 함께 있는 것을 선호한다', trait: 'extraversion' },
  { id: 9, text: '나는 타인에게 친절하고 배려심이 많다', trait: 'agreeableness' },
  { id: 10, text: '나는 스트레스를 받으면 쉽게 불안해진다', trait: 'neuroticism' },
];

export default function Big5TestPage() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const submitTestMutation = useMutation({
    mutationFn: (answers: number[]) => big5Api.submitInitial(answers),
    onSuccess: () => {
      navigate(ROUTES.BIG5_STATS);
    },
    onError: (error) => {
      console.error('Failed to submit BIG5 test:', error);
      alert('테스트 제출에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const handleAnswerSelect = (value: number) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (currentQuestion < BIG5_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      // 마지막 문항 - 테스트 제출
      submitTestMutation.mutate(newAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      const newAnswers = [...answers];
      const previousAnswer = newAnswers.pop();
      setAnswers(newAnswers);
      setSelectedAnswer(previousAnswer ?? null);
    }
  };

  const progress = ((currentQuestion + 1) / BIG5_QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fef9f1] to-[#f5efe3] flex flex-col">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold text-gray-800 text-center">BIG5 성격 검사</h1>
        </div>
      </div>

      {/* 진행도 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              {currentQuestion + 1} / {BIG5_QUESTIONS.length}
            </span>
            <span className="text-sm text-[#59B464] font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#59B464] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 질문 */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl p-8 shadow-md">
            <p className="text-xl text-gray-800 text-center mb-8 leading-relaxed">
              {BIG5_QUESTIONS[currentQuestion].text}
            </p>

            {/* 답변 선택 */}
            <div className="space-y-3">
              {[
                { value: 1, label: '전혀 아니다' },
                { value: 2, label: '아니다' },
                { value: 3, label: '보통이다' },
                { value: 4, label: '그렇다' },
                { value: 5, label: '매우 그렇다' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswerSelect(option.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    selectedAnswer === option.value
                      ? 'border-[#59B464] bg-[#59B464] bg-opacity-10'
                      : 'border-gray-200 hover:border-[#59B464] hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`text-base ${
                      selectedAnswer === option.value ? 'text-[#59B464] font-medium' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex gap-4 mt-6">
            {currentQuestion > 0 && (
              <button
                onClick={handlePrevious}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
              >
                이전
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={selectedAnswer === null || submitTestMutation.isPending}
              className="flex-1 px-6 py-3 bg-[#59B464] text-white rounded-full hover:bg-[#4a9654] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {currentQuestion < BIG5_QUESTIONS.length - 1
                ? '다음'
                : submitTestMutation.isPending
                ? '제출 중...'
                : '완료'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
