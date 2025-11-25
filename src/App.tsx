import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TutorialProvider } from './contexts/TutorialContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import { PrivateRoute } from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import KakaoCallbackPage from './pages/KakaoCallbackPage';
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

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DarkModeProvider>
          <ToastProvider>
            <TutorialProvider>
              <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LoginPage />} />
                <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

                {/* Protected Routes */}
                <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
                <Route path="/onboarding/flow" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
                <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
                <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
                <Route path="/chat/analysis" element={<PrivateRoute><ChatAnalysisPage /></PrivateRoute>} />
                <Route path="/chat/:date" element={<PrivateRoute><ChatDatePage /></PrivateRoute>} />
                <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
                <Route path="/diary-reveal/:date" element={<PrivateRoute><DiaryRevealPage /></PrivateRoute>} />
                <Route path="/diary/:date" element={<PrivateRoute><DiaryDetailPage /></PrivateRoute>} />
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
