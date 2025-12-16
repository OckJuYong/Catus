import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * 모바일 앱용 카카오 OAuth 콜백 페이지
 *
 * 플로우:
 * 1. 카카오 OAuth 완료 후 이 페이지로 리다이렉트
 * 2. URL에서 code 파라미터 추출
 * 3. catus:// 딥링크로 앱 열기
 * 4. 앱의 DeepLinkHandler가 처리
 */
export default function KakaoMobileCallbackPage() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      // 에러 발생 시 앱으로 에러 전달
      window.location.href = `catus://auth/kakao/callback?error=${error}`;
      return;
    }

    if (code) {
      // 인증 코드를 딥링크로 앱에 전달
      console.log('Redirecting to app with code:', code);
      window.location.href = `catus://auth/kakao/callback?code=${code}`;
    } else {
      // 코드가 없으면 에러 처리
      window.location.href = `catus://auth/kakao/callback?error=no_code`;
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#59B464] mx-auto mb-4"></div>
        <p className="text-gray-600 mb-2">앱으로 이동 중...</p>
        <p className="text-gray-400 text-sm">잠시만 기다려주세요</p>
      </div>

      {/* 앱이 설치되지 않은 경우를 위한 폴백 */}
      <div className="mt-8 text-center">
        <p className="text-gray-400 text-xs mb-2">앱이 열리지 않나요?</p>
        <a
          href="/"
          className="text-[#59B464] text-sm underline"
        >
          웹으로 계속하기
        </a>
      </div>
    </div>
  );
}
