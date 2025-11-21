import { useNavigate } from 'react-router-dom';

export default function OnboardingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fef9f1] flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">온보딩 페이지</h1>
      <p className="text-gray-600 mb-8">TypeScript 변환 완료 - 기능 구현 대기 중</p>
      <button
        onClick={() => navigate('/home')}
        className="px-6 py-3 bg-[#5F6F52] text-white rounded-lg hover:opacity-90"
      >
        홈으로 이동
      </button>
    </div>
  );
}
