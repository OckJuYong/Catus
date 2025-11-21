import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fef9f1] flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">개인정보 처리방침</h1>
      <p className="text-gray-600 mb-8">TypeScript 변환 완료 - 기능 구현 대기 중</p>
      <button
        onClick={() => navigate(-1)}
        className="px-6 py-3 bg-[#5F6F52] text-white rounded-lg hover:opacity-90"
      >
        뒤로가기
      </button>
    </div>
  );
}
