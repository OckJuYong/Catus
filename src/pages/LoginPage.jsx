import React from 'react';
import { useNavigate } from 'react-router-dom';
import catImage from '../assets/images/cat.png';
import cactusImage from '../assets/images/cactus.png';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleKakaoLogin = () => {
    console.log('카카오 로그인 시작');
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-4 px-6 overflow-hidden">
      {/* 중앙 그룹 전체 묶음 */}
      <div className="flex flex-col items-center justify-center w-full max-w-md">
        
        {/* 고양이 + 선인장 + CATUS + 문장 모두 하나의 그룹으로 묶음 */}
        <div className="flex flex-col items-center justify-center -space-y-1">
          {/* 고양이 + 선인장 */}
          <div className="relative w-[220px] h-[238px] sm:w-[260px] sm:h-[281px] mb-0">
            <img
              src={catImage}
              alt="Black Cat"
              className="w-full h-full object-contain relative z-10"
              style={{ transform: 'translateY(-20px)' }}
            />
            <img
              src={cactusImage}
              alt="Cactus"
              className="w-16 h-20 sm:w-20 sm:h-24 object-contain absolute bottom-[15px] right-[25px] sm:bottom-[18px] sm:right-[31px] z-20"
            />
          </div>

          {/* CATUS 로고 */}
          <h1 className="text-4xl sm:text-5xl font-bold text-[#59B464] mt-[-12px]">
            CATUS
          </h1>

          {/* 설명 문장 */}
          <p className="text-gray-600 text-[13px] sm:text-[15px] font-normal mt-[-32px]">
            귀여운 고양이와 함께하는 감정 교류
          </p>
        </div>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="w-full max-w-sm flex flex-col items-center mt-[80px] space-y-2 sm:space-y-3">
        {/* 카카오 시작하기 버튼 */}
        <button
          onClick={handleKakaoLogin}
          className="w-[180px] sm:w-[220px] py-[10px] bg-[#FEE500] hover:bg-[#FDD835] active:bg-[#FDD835]
             rounded-[8px] flex items-center justify-center gap-1 transition-all shadow-sm border-0"
        >
          <svg
            className="w-[18px] h-[15px] sm:w-[14px] sm:h-[14px]"
            viewBox="4 0 24 24"
            fill="currentColor"
          >
            <path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.8 6.7-.2.7-.6 2.5-.7 2.8 0 .4.1.5.3.4.2-.1 2.9-1.9 3.4-2.3.7.1 1.4.2 2.2.2 5.5 0 10-3.6 10-8S17.5 3 12 3z" />
          </svg>
          <span className="text-[15px] sm:text-sm font-semibold text-gray-900">
            카카오로 시작하기
          </span>
        </button>

        {/* 개인정보처리방침 링크 */}
        <div className="text-center mt-[30px]">
          <a
            href="/privacy-policy"
            className="text-gray-400 text-[9px] sm:text-[10px] underline hover:text-gray-600 transition-colors inline-block"
          >
            개인정보처리방침
          </a>
        </div>
      </div>

      {/* Pretendard 폰트 */}
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');

        * {
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
          -webkit-tap-highlight-color: transparent;
        }

        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        @supports (padding: max(0px)) {
          .min-h-screen {
            min-height: 100vh;
            min-height: -webkit-fill-available;
          }
        }
      `}</style>
    </div>
  );
}
