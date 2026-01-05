import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 모바일 앱용 카카오 OAuth 콜백 페이지
 */
export default function KakaoMobileCallbackPage() {
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        console.log('모바일 OAuth 콜백 처리 시작');

        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        if (error) {
          console.error('OAuth 에러:', error, errorDescription);
          setStatus('error');
          setErrorMessage(errorDescription || '로그인이 취소되었습니다.');
          redirectToApp({ error, error_description: errorDescription || '' });
          return;
        }

        if (!accessToken || !refreshToken) {
          console.error('토큰 없음');
          setStatus('error');
          setErrorMessage('인증 토큰을 받지 못했습니다.');
          redirectToApp({ error: 'no_tokens' });
          return;
        }

        console.log('토큰 추출 성공');
        setStatus('success');

        redirectToApp({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

      } catch (err) {
        console.error('OAuth 콜백 처리 에러:', err);
        setStatus('error');
        setErrorMessage('로그인 처리 중 오류가 발생했습니다.');
        redirectToApp({ error: 'callback_failed' });
      }
    };

    processOAuthCallback();
  }, [location]);

  const redirectToApp = (params: Record<string, string>) => {
    const queryString = new URLSearchParams(params).toString();
    const customSchemeUrl = `catus://auth/callback?${queryString}`;

    console.log('앱으로 리다이렉트:', customSchemeUrl.substring(0, 50) + '...');

    setTimeout(() => {
      window.location.href = customSchemeUrl;
    }, 500);
  };

  const handleContinueOnWeb = () => {
    window.location.href = '/' + window.location.hash;
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
            <p className="text-red-400 text-sm mb-4">{errorMessage}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-[#59B464] text-white rounded-lg"
            >
              다시 시도
            </button>
          </>
        )}
      </div>

      {status === 'success' && (
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-xs mb-2">앱이 열리지 않나요?</p>
          <button
            onClick={handleContinueOnWeb}
            className="text-[#59B464] text-sm underline"
          >
            웹으로 계속하기
          </button>
        </div>
      )}
    </div>
  );
}
