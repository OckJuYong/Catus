import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TutorialProvider } from './contexts/TutorialContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import { usePrefetchData } from './hooks/usePrefetchData';
import { useDiaryAutoGenerator } from './hooks/useDiaryAutoGenerator';
import { useBig5ProgressiveUpdate } from './hooks/useBig5ProgressiveUpdate';
import { usePersonalizedPrompt } from './hooks/usePersonalizedPrompt';
import { PrivateRoute } from './components/PrivateRoute';
import { setSessionFromTokens, supabase } from './lib/supabase';
import LoginPage from './pages/LoginPage';
import KakaoCallbackPage from './pages/KakaoCallbackPage';
import KakaoMobileCallbackPage from './pages/KakaoMobileCallbackPage';
import OnboardingPage from './pages/OnboardingPage';
import Onboarding from "./pages/Onboarding";
import HomePage from './pages/HomePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ChatPage from './pages/ChatPage';
import ChatDatePage from './pages/ChatDatePage';
import CalendarPage from './pages/CalendarPage';
import MessagesPage from './pages/MessagesPage';
import DiaryDetailPage from './pages/DiaryDetailPage';
import DiaryRevealPage from './pages/DiaryRevealPage';
import SettingsPage from './pages/SettingsPage';
import RandomDiaryPage from './pages/RandomDiaryPage';
import Big5StatsPage from './pages/Big5StatsPage';
import GeneralLoginPage from './pages/GeneralLoginPage';
import GeneralSignupPage from './pages/GeneralSignupPage';

// Deep Link 처리 컴포넌트
function DeepLinkHandler() {
  const navigate = useNavigate();
  const { login, refreshUser } = useAuth();

  useEffect(() => {
    // Capacitor 앱에서만 실행
    if (!Capacitor.isNativePlatform()) return;

    // 딥링크 처리 함수
    const handleDeepLink = async (urlString: string) => {
      console.log('🔗 딥링크 처리 시작:', urlString);

      // 딜레이 후 InAppBrowser 닫기
      setTimeout(async () => {
        try {
          await Browser.close();
        } catch (e) {
          console.log('Browser close error:', e);
        }
      }, 300);

      const url = new URL(urlString);

      // Supabase OAuth 콜백 처리 (catus://auth/callback)
      if (url.host === 'auth' && url.pathname === '/callback') {
        const error = url.searchParams.get('error');

        if (error) {
          console.error('OAuth 에러:', error);
          navigate('/');
          return;
        }

        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('✅ Supabase OAuth 토큰으로 세션 설정 중...');

          try {
            const { data, error: sessionError } = await setSessionFromTokens(accessToken, refreshToken);

            if (sessionError) {
              console.error('세션 설정 실패:', sessionError);
              navigate('/');
              return;
            }

            console.log('✅ Supabase 세션 설정 성공:', data.user?.id);

            if (refreshUser) {
              await refreshUser();
            }

            // users 테이블에서 onboarding_completed 확인 (user_metadata가 아닌 DB에서)
            const { data: dbUser } = await supabase
              .from('users')
              .select('onboarding_completed')
              .eq('id', data.user?.id)
              .maybeSingle();
            const onboardingCompleted = dbUser?.onboarding_completed ?? false;
            console.log('📋 온보딩 완료 여부 (DB):', onboardingCompleted);
            navigate(onboardingCompleted ? '/home' : '/onboarding');

          } catch (err) {
            console.error('토큰 세션 설정 에러:', err);
            navigate('/');
          }
        }
        return;
      }

      // 레거시 카카오 콜백 (catus://auth/kakao/callback)
      if (url.host === 'auth' && url.pathname.includes('kakao/callback')) {
        const error = url.searchParams.get('error');

        if (error) {
          console.error('Kakao login error:', error);
          navigate('/');
          return;
        }

        const accessToken = url.searchParams.get('accessToken');
        const refreshToken = url.searchParams.get('refreshToken');
        const isNewUser = url.searchParams.get('isNewUser') === 'true';
        const userId = url.searchParams.get('userId');

        if (accessToken && refreshToken && userId) {
          localStorage.setItem('catus_access_token', accessToken);
          localStorage.setItem('catus_refresh_token', refreshToken);
          localStorage.setItem('catus_login_type', 'kakao');

          const userData = {
            id: userId,
            nickname: '달이집사',
            createdAt: new Date().toISOString(),
          };

          login(userData);
          navigate(isNewUser ? '/onboarding' : '/home');
        }
      }
    };

    // 앱이 실행 중일 때 딥링크 수신 리스너
    const listener = CapApp.addListener('appUrlOpen', async (event) => {
      console.log('📱 appUrlOpen 이벤트:', event.url);
      await handleDeepLink(event.url);
    });

    // 클린업
    return () => {
      listener.then(l => l.remove());
    };
  }, [navigate, login, refreshUser]);

  return null;
}

// 백그라운드 서비스 컴포넌트 (데이터 프리페칭, 일기 자동 생성, BIG5 분석, 개인화 프롬프트)
function BackgroundServices() {
  usePrefetchData();
  useDiaryAutoGenerator();
  useBig5ProgressiveUpdate();
  usePersonalizedPrompt(); // 개인화 프롬프트 자동 업데이트
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DarkModeProvider>
          <ToastProvider>
            <TutorialProvider>
              <Router>
              <DeepLinkHandler />
              <BackgroundServices />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LoginPage />} />
                <Route path="/auth/login" element={<GeneralLoginPage />} />
                <Route path="/auth/signup" element={<GeneralSignupPage />} />
                <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
                <Route path="/auth/kakao/mobile-callback" element={<KakaoMobileCallbackPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

                {/* Protected Routes */}
                <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
                <Route path="/onboarding/flow" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
                <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
                <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
                <Route path="/chat/:date" element={<PrivateRoute><ChatDatePage /></PrivateRoute>} />
                <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
                <Route path="/diary-reveal/:id" element={<PrivateRoute><DiaryRevealPage /></PrivateRoute>} />
                <Route path="/diary/:id" element={<PrivateRoute><DiaryDetailPage /></PrivateRoute>} />
                <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
                <Route path="/random-diary" element={<PrivateRoute><RandomDiaryPage /></PrivateRoute>} />
                <Route path="/big5/stats" element={<PrivateRoute><Big5StatsPage /></PrivateRoute>} />
              </Routes>
              </Router>
            </TutorialProvider>
          </ToastProvider>
        </DarkModeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
