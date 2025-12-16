import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { AuthProvider } from './contexts/AuthContext';
import { TutorialProvider } from './contexts/TutorialContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import { PrivateRoute } from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import KakaoCallbackPage from './pages/KakaoCallbackPage';
import KakaoMobileCallbackPage from './pages/KakaoMobileCallbackPage';
import OnboardingPage from './pages/OnboardingPage';
import Onboarding from "./pages/Onboarding";
import HomePage from './pages/HomePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ChatPage from './pages/ChatPage';
import ChatAnalysisPage from './pages/ChatAnalysisPage';
import ChatDatePage from './pages/ChatDatePage';
import CalendarPage from './pages/CalendarPage';
import MessagesPage from './pages/MessagesPage';
import DiaryDetailPage from './pages/DiaryDetailPage';
import DiaryRevealPage from './pages/DiaryRevealPage';
import SettingsPage from './pages/SettingsPage';
import RandomDiaryPage from './pages/RandomDiaryPage';
import Big5StatsPage from './pages/Big5StatsPage';
import Big5TestPage from './pages/Big5TestPage';

// Deep Link 처리 컴포넌트
function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    // Capacitor 앱에서만 실행
    if (!Capacitor.isNativePlatform()) return;

    // 앱이 Deep Link로 열렸을 때 처리
    CapApp.addListener('appUrlOpen', async (event) => {
      console.log('Deep Link URL:', event.url);

      // InAppBrowser 닫기
      try {
        await Browser.close();
      } catch (e) {
        console.log('Browser close error (might not be open):', e);
      }

      // catus://auth/kakao/callback?code=xxx 형식 처리
      const url = new URL(event.url);
      if (url.host === 'auth' && url.pathname.includes('kakao/callback')) {
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          console.error('Kakao login error:', error);
          navigate('/');
          return;
        }

        if (code) {
          // 카카오 콜백 페이지로 이동 (code 파라미터 포함)
          navigate(`/auth/kakao/callback?code=${code}`);
        }
      }
    });

    // 클린업
    return () => {
      CapApp.removeAllListeners();
    };
  }, [navigate]);

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
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LoginPage />} />
                <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
                <Route path="/auth/kakao/mobile-callback" element={<KakaoMobileCallbackPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

                {/* Protected Routes */}
                <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
                <Route path="/onboarding/flow" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
                <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
                <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
                <Route path="/chat/analysis" element={<PrivateRoute><ChatAnalysisPage /></PrivateRoute>} />
                <Route path="/chat/:date" element={<PrivateRoute><ChatDatePage /></PrivateRoute>} />
                <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
                <Route path="/diary-reveal/:id" element={<PrivateRoute><DiaryRevealPage /></PrivateRoute>} />
                <Route path="/diary/:id" element={<PrivateRoute><DiaryDetailPage /></PrivateRoute>} />
                <Route path="/messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
                <Route path="/random-diary" element={<PrivateRoute><RandomDiaryPage /></PrivateRoute>} />
                <Route path="/big5/stats" element={<PrivateRoute><Big5StatsPage /></PrivateRoute>} />
                <Route path="/big5/test" element={<PrivateRoute><Big5TestPage /></PrivateRoute>} />
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
