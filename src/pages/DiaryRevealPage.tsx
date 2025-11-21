import { useNavigate, useParams } from 'react-router-dom';

export default function DiaryRevealPage() {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();

  return (
    <div className="min-h-screen bg-[#fef9f1] flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">일기 공개</h1>
      <p className="text-gray-600 mb-2">날짜: {date}</p>
      <p className="text-gray-600 mb-8">TypeScript 변환 완료 - 기능 구현 대기 중</p>
      <button
        onClick={() => navigate('/calendar')}
        className="px-6 py-3 bg-[#5F6F52] text-white rounded-lg hover:opacity-90"
      >
        캘린더로 이동
      </button>
    </div>
  );
}
