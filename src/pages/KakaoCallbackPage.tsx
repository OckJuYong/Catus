import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useKakaoLogin } from '../hooks/useApi';

export default function KakaoCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const executed = useRef(false);
  const kakaoLoginMutation = useKakaoLogin();

  useEffect(() => {
    const handleKakaoCallback = async (): Promise<void> => {
      // React StrictMode 중복 실행 방지 - useRef 사용
      if (executed.current) return;
      executed.current = true;

      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      // 사용자가 취소했거나 에러 발생
      if (errorParam) {
        console.error('Kakao login error:', errorParam);
        setError('로그인이 취소되었습니다.');
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      // 인증 코드가 없는 경우
      if (!code) {
        console.error('No authorization code received');
        setError('인증 코드를 받지 못했습니다.');
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      try {
        // React Query mutation으로 카카오 로그인
        const response = await kakaoLoginMutation.mutateAsync(code);

        const { accessToken, refreshToken } = response;

        // JWT 토큰 저장
        localStorage.setItem('catus_access_token', accessToken);
        localStorage.setItem('catus_refresh_token', refreshToken);

        // 사용자 정보 저장 (user 객체가 있다면)
        if ('user' in response) {
          login(response.user as any);
        }

        // 신규 사용자면 온보딩, 기존 사용자면 홈으로
        if (response.isNewUser) {
          navigate('/onboarding');
        } else {
          navigate('/home');
        }
      } catch (error) {
        console.error('Login failed:', error);
        setError('로그인에 실패했습니다. 다시 시도해주세요.');
        setTimeout(() => navigate('/'), 2000);
      }
    };

    handleKakaoCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      {error ? (
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <p className="text-gray-600">로그인 페이지로 이동합니다...</p>
        </div>
      ) : (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#59B464] mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 처리 중...</p>
        </div>
      )}
    </div>
  );
}
