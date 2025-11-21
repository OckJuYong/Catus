import { useEffect } from 'react';

interface TutorialProps {
  onComplete?: () => void;
}

export default function Tutorial({ onComplete }: TutorialProps) {
  useEffect(() => {
    // Auto-complete tutorial after a short delay
    const timer = setTimeout(() => {
      onComplete?.();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">튜토리얼</h2>
        <p className="text-gray-600 mb-4">TypeScript 변환 완료 - 기능 구현 대기 중</p>
        <button
          onClick={onComplete}
          className="w-full px-6 py-3 bg-[#5F6F52] text-white rounded-lg hover:opacity-90"
        >
          시작하기
        </button>
      </div>
    </div>
  );
}
