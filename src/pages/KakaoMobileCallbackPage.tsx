import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://catus-backend-node.vercel.app/api/v1';

/**
 * 모바일 앱용 카카오 OAuth 콜백 페이지
 *
 * 플로우:
 * 1. 카카오 OAuth 완료 후 이 페이지로 리다이렉트
 * 2. URL에서 code 파라미터 추출
 * 3. 백엔드 API 호출하여 토큰 발급
 * 4. Intent URL로 앱에 토큰 전달
 */
export default function KakaoMobileCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processKakaoLogin = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setErrorMessage('카카오 로그인이 취소되었습니다.');
        // Intent URL로 에러 전달
        redirectToApp({ error });
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('인증 코드를 받지 못했습니다.');
        redirectToApp({ error: 'no_code' });
        return;
      }

      try {
        console.log('Processing Kakao login with code:', code.substring(0, 10) + '...');

        // 백엔드 API 호출하여 토큰 발급
        const response = await fetch(`${API_BASE_URL}/auth/kakao`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirectUri: 'https://catus-sage.vercel.app/auth/kakao/mobile-callback'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('Kakao login successful, redirecting to app...');

        setStatus('success');

        // Intent URL로 토큰 전달
        redirectToApp({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isNewUser: String(data.isNewUser),
          userId: String(data.userId),
        });

      } catch (err) {
        console.error('Kakao login error:', err);
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : '로그인 처리 중 오류가 발생했습니다.');
        redirectToApp({ error: 'login_failed' });
      }
    };

    processKakaoLogin();
  }, [searchParams]);

  // 커스텀 스킴 URL로 앱에 데이터 전달
  const redirectToApp = (params: Record<string, string>) => {
    const queryString = new URLSearchParams(params).toString();
    const customSchemeUrl = `catus://auth/kakao/callback?${queryString}`;

    console.log('Redirecting with Custom Scheme URL:', customSchemeUrl);

    // 약간의 딜레이 후 리다이렉트 (UI 표시를 위해)
    setTimeout(() => {
      window.location.href = customSchemeUrl;
    }, 500);
  };

  // 웹으로 계속하기 (토큰이 있으면 localStorage에 저장)
  const handleContinueOnWeb = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#59B464] mx-auto mb-4"></div>
            <p className="text-gray-600 mb-2">로그인 처리 중...</p>
            <p className="text-gray-400 text-sm">잠시만 기다려주세요</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-[#59B464] text-5xl mb-4">✓</div>
            <p className="text-gray-600 mb-2">로그인 성공!</p>
            <p className="text-gray-400 text-sm">앱으로 이동 중...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-500 text-5xl mb-4">✕</div>
            <p className="text-gray-600 mb-2">로그인 실패</p>
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </>
        )}
      </div>

      {/* 앱이 열리지 않는 경우를 위한 폴백 */}
      <div className="mt-8 text-center">
        <p className="text-gray-400 text-xs mb-2">앱이 열리지 않나요?</p>
        <button
          onClick={handleContinueOnWeb}
          className="text-[#59B464] text-sm underline"
        >
          웹으로 계속하기
        </button>
      </div>
    </div>
  );
}
