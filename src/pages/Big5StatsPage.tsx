/**
 * BIG5 성격 통계 페이지
 * 현재 성격 점수와 변화 추이를 표시
 */

import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { big5Api } from '../utils/api';
import { ROUTES } from '../constants/routes';

const BIG5_TRAITS = {
  openness: { name: '개방성', description: '새로운 경험에 열린 태도' },
  conscientiousness: { name: '성실성', description: '목표 지향적이고 체계적' },
  extraversion: { name: '외향성', description: '사회적이고 에너지 넘침' },
  agreeableness: { name: '우호성', description: '협조적이고 공감 능력 높음' },
  neuroticism: { name: '안정성', description: '정서적으로 안정적' },
} as const;

// 레이더 차트 컴포넌트
const RadarChart = ({ scores }: { scores: Record<string, number> }) => {
  const size = 240;
  const center = size / 2;
  const radius = 80;
  const levels = 5;

  // 5개 꼭지점 각도 (위에서 시작, 시계방향)
  const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  const labels = ['개방성', '성실성', '외향성', '우호성', '안정성'];

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
    const r = (value / 100) * radius; // 100% 기준
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // 배경 오각형 (레벨별 - 20%, 40%, 60%, 80%, 100%)
  const backgroundPolygons = [];
  for (let level = 1; level <= levels; level++) {
    const points = traits.map((_, i) => {
      const point = getPoint(i, level * 20);
      return `${point.x},${point.y}`;
    }).join(' ');
    backgroundPolygons.push(
      <polygon
        key={level}
        points={points}
        fill="none"
        stroke="#E5E5E5"
        strokeWidth="1"
      />
    );
  }

  // 축선
  const axisLines = traits.map((_, i) => {
    const point = getPoint(i, 100);
    return (
      <line
        key={i}
        x1={center}
        y1={center}
        x2={point.x}
        y2={point.y}
        stroke="#E5E5E5"
        strokeWidth="1"
      />
    );
  });

  // 데이터 다각형 (점수를 100% 기준 퍼센트로 변환)
  const dataPoints = traits.map((trait, i) => {
    const score = scores[trait] || 0;
    const percentage = Math.min(100, score * 10); // 10점 만점을 100%로
    return getPoint(i, percentage);
  });
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  // 라벨 위치
  const labelPositions = traits.map((_, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const labelRadius = radius + 30;
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
    };
  });

  return (
    <svg
      width="100%"
      height="auto"
      viewBox={`0 0 ${size} ${size}`}
      style={{ maxWidth: '240px' }}
    >
      {/* 배경 오각형 */}
      {backgroundPolygons}
      {/* 축선 */}
      {axisLines}
      {/* 데이터 영역 */}
      <polygon
        points={dataPolygon}
        fill="rgba(94, 112, 87, 0.3)"
        stroke="#5E7057"
        strokeWidth="2"
      />
      {/* 데이터 포인트 */}
      {dataPoints.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r="5"
          fill="#5E7057"
        />
      ))}
      {/* 라벨 */}
      {labelPositions.map((pos, i) => (
        <text
          key={i}
          x={pos.x}
          y={pos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fontWeight="600"
          fill="#333"
        >
          {labels[i]}
        </text>
      ))}
    </svg>
  );
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
      <div
        className="h-[100dvh] flex flex-col items-center justify-center overflow-hidden"
        style={{ backgroundColor: 'var(--color-main-bg)' }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E7057] mb-4"></div>
        <p style={{ color: 'var(--color-text-secondary)' }}>성격 데이터를 불러오는 중...</p>
      </div>
    );
  }

  // 에러 또는 데이터 없음 - 테스트 안내
  if (error || !currentData) {
    return (
      <div
        className="h-[100dvh] flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--color-main-bg)' }}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-[12px] py-[12px] flex-shrink-0"
          style={{ backgroundColor: 'var(--color-bg-card)' }}
        >
          <button
            onClick={() => navigate(-1)}
            className="text-[#5E7057] hover:opacity-70 text-[20px] bg-transparent border-0"
            style={{ marginTop: '-5px' }}
          >
            ←
          </button>
          <div className="text-[16px] font-[600] text-[#5E7057]">
            BIG5 성격 분석
          </div>
          <div className="w-[20px]" />
        </div>

        <div className="flex-1 flex items-center justify-center px-[16px]">
          <div
            className="rounded-[20px] p-[24px] w-full max-w-[360px] text-center"
            style={{ backgroundColor: 'var(--color-bg-card)' }}
          >
            <div className="text-[48px] mb-[16px]">🧠</div>
            <h2
              className="text-[18px] font-[600] mb-[8px]"
              style={{ color: 'var(--color-text-primary)' }}
            >
              BIG5 성격 검사를 시작하세요
            </h2>
            <p
              className="text-[14px] mb-[20px] leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              10가지 질문으로 당신의 성격 특성을 분석하고,
              매주 자동으로 업데이트됩니다.
            </p>
            <button
              onClick={() => navigate(ROUTES.BIG5_TEST)}
              className="w-full py-[12px] bg-[#5E7057] text-[#FFFFFF] rounded-[12px] text-[15px] font-[500] border-0"
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
    <div
      className="h-[100dvh] flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--color-main-bg)' }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-[12px] py-[12px] flex-shrink-0"
        style={{ backgroundColor: 'var(--color-bg-card)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="text-[#5E7057] hover:opacity-70 text-[20px] bg-transparent border-0"
          style={{ marginTop: '-5px' }}
        >
          ←
        </button>
        <div className="text-[16px] font-[600] text-[#5E7057]">
          BIG5 성격 분석
        </div>
        <div className="w-[20px]" />
      </div>

      {/* 성격 점수 - 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-[16px] py-[16px]">
        {/* 레이더 차트 */}
        <div
          className="rounded-[16px] p-[16px] mb-[16px] overflow-hidden"
          style={{ backgroundColor: 'var(--color-bg-card)' }}
        >
          <div className="flex justify-center items-center">
            <RadarChart scores={scores} />
          </div>
        </div>

        {/* 성격 특성 바 그래프 */}
        <div
          className="rounded-[16px] p-[16px] mb-[16px] overflow-hidden"
          style={{ backgroundColor: 'var(--color-bg-card)' }}
        >
          <div className="flex flex-col gap-[20px]">
            {Object.entries(BIG5_TRAITS).map(([key, trait]) => {
              const score = scores[key as keyof typeof scores] || 0;
              const percentage = Math.min(100, Math.round(score * 10)); // 10점 만점을 100%로

              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-[4px]">
                    <span
                      className="text-[14px] font-[600]"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {trait.name}
                    </span>
                    <span
                      className="text-[14px] font-[600]"
                      style={{ color: '#5E7057' }}
                    >
                      {percentage}%
                    </span>
                  </div>
                  <p
                    className="text-[12px] mb-[8px]"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {trait.description}
                  </p>
                  <div
                    className="w-full rounded-full h-[8px]"
                    style={{ backgroundColor: '#E8E8E8' }}
                  >
                    <div
                      className="h-[8px] rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%`, backgroundColor: '#5E7057' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 업데이트 정보 */}
        <div
          className="rounded-[16px] p-[16px]"
          style={{ backgroundColor: 'var(--color-bg-card)' }}
        >
          <h3
            className="text-[14px] font-[600] mb-[8px]"
            style={{ color: 'var(--color-text-primary)' }}
          >
            자동 업데이트 시스템
          </h3>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            일기를 작성할 때마다 AI가 당신의 성격 변화를 분석하고,
            매주 자동으로 BIG5 점수를 업데이트합니다.
            (최대 변화: 주당 0.15점)
          </p>
          {currentData.lastUpdated && (
            <p
              className="text-[11px] mt-[8px]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              마지막 업데이트: {new Date(currentData.lastUpdated).toLocaleDateString('ko-KR')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
