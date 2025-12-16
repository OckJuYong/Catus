import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import logincatImage from '../assets/images/logincat.png';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleKakaoLogin = async (): Promise<void> => {
    const isNative = Capacitor.isNativePlatform();

    // 네이티브 앱: 모바일 콜백 페이지 사용 (딥링크로 앱 복귀)
    // 웹: 기존 콜백 페이지 사용
    const redirectUri = isNative
      ? 'https://catus-frontend-umber.vercel.app/auth/kakao/mobile-callback'
      : import.meta.env.VITE_KAKAO_REDIRECT_URI;

    const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${import.meta.env.VITE_KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

    console.log('카카오 로그인 시작');
    console.log('Platform:', isNative ? 'Native App' : 'Web');
    console.log('Redirect URI:', redirectUri);
    console.log('KAKAO_AUTH_URL:', KAKAO_AUTH_URL);

    if (isNative) {
      // 네이티브: InAppBrowser (Chrome Custom Tabs) 사용
      await Browser.open({ url: KAKAO_AUTH_URL });
    } else {
      // 웹: 기존 방식 유지
      window.location.href = KAKAO_AUTH_URL;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-4 px-6 overflow-hidden" style={{ backgroundColor: 'var(--color-main-bg)' }}>
      {/* 중앙 그룹 전체 묶음 */}
      <div className="flex flex-col items-center justify-center w-full max-w-md">

        {/* 고양이 + 선인장 + CATUS + 문장 모두 하나의 그룹으로 묶음 */}
        <div className="flex flex-col items-center justify-center -space-y-1">
          {/* 고양이 + 선인장 */}
          <div className="relative w-[220px] h-[238px] sm:w-[260px] sm:h-[281px] mb-0">
            <img
              src={logincatImage}
              alt="Login Cat"
              className="w-full h-full object-contain"
            />
          </div>

          {/* CATUS 로고 */}
          <h1 className="text-4xl sm:text-5xl font-bold text-[#59B464] mt-[-12px]">
            CATUS
          </h1>

          {/* 설명 문장 */}
          <p className="text-[13px] sm:text-[15px] font-normal mt-[-32px]" style={{ color: 'var(--color-text-secondary)' }}>
            귀여운 고양이와 함께하는 감정 교류
          </p>
        </div>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="w-full max-w-sm flex flex-col items-center mt-[80px] space-y-2 sm:space-y-3">
        {/* 카카오 시작하기 버튼 */}
        <button
          onClick={handleKakaoLogin}
          className="w-[250px] sm:w-[350px] py-[17px] bg-[#FEE500] hover:bg-[#FDD835] active:bg-[#FDD835]
             rounded-[8px] flex items-center justify-center gap-1 transition-all shadow-sm border-0"
        >
          <svg
            className="w-[30px] h-[20px] sm:w-[15px] sm:h-[15px]"
            viewBox="6 2 20 20"
            fill="currentColor"
          >
            <path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.8 6.7-.2.7-.6 2.5-.7 2.8 0 .4.1.5.3.4.2-.1 2.9-1.9 3.4-2.3.7.1 1.4.2 2.2.2 5.5 0 10-3.6 10-8S17.5 3 12 3z" />
          </svg>
          <span className="text-[17px] sm:text-sm font-[600]">
            카카오로 시작하기
          </span>
        </button>

        {/* 개인정보처리방침 링크 */}
        <div className="text-center mt-[30px]">
          <a
            href="/privacy-policy"
            className="text-[#d1d5db] text-[9px] sm:text-[10px] no-underline hover:text-[#9ca3af] hover:underline transition-colors inline-block"
          >
            개인정보처리방침
          </a>
        </div>
      </div>

      <style>{`
        * {
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
