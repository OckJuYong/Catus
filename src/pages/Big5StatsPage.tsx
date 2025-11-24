/**
 * BIG5 성격 통계 페이지
 * 현재 성격 점수와 변화 추이를 표시
 */

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { big5Api } from '../utils/api';
import { ROUTES } from '../constants/routes';

const BIG5_TRAITS = {
  openness: { name: '개방성', color: '#FF6B6B', description: '새로운 경험에 대한 개방성' },
  conscientiousness: { name: '성실성', color: '#4ECDC4', description: '목표 지향적이고 조직적임' },
  extraversion: { name: '외향성', color: '#FFE66D', description: '사교적이고 활발함' },
  agreeableness: { name: '친화성', color: '#95E1D3', description: '협조적이고 배려심이 많음' },
  neuroticism: { name: '신경성', color: '#B4A7D6', description: '정서적 안정성' },
};

export default function Big5StatsPage() {
  const navigate = useNavigate();

  // 현재 BIG5 점수 조회
  const { data: currentData, isLoading, error } = useQuery({
    queryKey: ['big5', 'current'],
    queryFn: () => big5Api.getCurrent(),
    retry: false,
  });

  // 변화 이력 조회 (전체 데이터 가져오기, 프론트에서 필터링)
  const { data: historyData } = useQuery({
    queryKey: ['big5', 'history'],
    queryFn: () => big5Api.getHistory(), // period 파라미터 제거 → 전체 데이터
    enabled: !!currentData,
  });

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fef9f1] to-[#f5efe3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#59B464] mx-auto mb-4"></div>
          <p className="text-gray-600">성격 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 또는 데이터 없음 - 테스트 안내
  if (error || !currentData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fef9f1] to-[#f5efe3]">
        <div className="bg-white shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <button onClick={() => navigate(ROUTES.HOME)} className="text-gray-600 hover:text-gray-800">
              ← 뒤로
            </button>
            <h1 className="text-lg font-semibold text-gray-800">BIG5 성격 분석</h1>
            <div className="w-12" />
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-md">
            <div className="text-6xl mb-4">🧠</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">BIG5 성격 검사를 시작하세요</h2>
            <p className="text-gray-600 mb-6">
              10가지 질문으로 당신의 성격 특성을 분석하고,<br />
              매주 자동으로 업데이트됩니다.
            </p>
            <button
              onClick={() => navigate(ROUTES.BIG5_TEST)}
              className="w-full px-6 py-3 bg-[#59B464] text-white rounded-full hover:bg-[#4a9654] transition-colors"
            >
              검사 시작하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const scores = currentData.scores;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fef9f1] to-[#f5efe3]">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(ROUTES.HOME)} className="text-gray-600 hover:text-gray-800">
            ← 뒤로
          </button>
          <h1 className="text-lg font-semibold text-gray-800">BIG5 성격 분석</h1>
          <div className="w-12" />
        </div>
      </div>

      {/* 성격 점수 */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">현재 성격 특성</h2>
          <div className="space-y-4">
            {Object.entries(BIG5_TRAITS).map(([key, trait]) => {
              const score = scores[key as keyof typeof scores] || 0;
              const percentage = (score / 5) * 100;

              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-gray-800">{trait.name}</span>
                      <span className="text-sm text-gray-500 ml-2">{score.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%`, backgroundColor: trait.color }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{trait.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 업데이트 정보 */}
        <div className="bg-white rounded-2xl p-6 shadow-md">
          <h3 className="text-base font-semibold text-gray-800 mb-2">📊 자동 업데이트 시스템</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            일기를 작성할 때마다 AI가 당신의 성격 변화를 분석하고,
            매주 자동으로 BIG5 점수를 업데이트합니다.
            (최대 변화: 주당 0.15점)
          </p>
          {currentData.lastUpdated && (
            <p className="text-xs text-gray-500 mt-2">
              마지막 업데이트: {new Date(currentData.lastUpdated).toLocaleDateString('ko-KR')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
