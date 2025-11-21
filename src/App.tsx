import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TutorialProvider } from './contexts/TutorialContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import LoginPage from './pages/LoginPage';
import KakaoCallbackPage from './pages/KakaoCallbackPage';
import OnboardingPage from './pages/OnboardingPage';
import Onboarding from "./pages/Onboarding";
import HomePage from './pages/HomePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ChatPage from './pages/ChatPage';
import CalendarPage from './pages/CalendarPage';
import SupportPage from './pages/SupportPage';
import LetterPage from './pages/LetterPage';
import DiaryDetailPage from './pages/DiaryDetailPage';
import DiaryDetailPage2 from './pages/DiaryDetailPage2';
import DiaryRevealPage from './pages/DiaryRevealPage';
import SettingsPage from './pages/SettingsPage';
import RandomDiaryPage from './pages/RandomDiaryPage';
import Big5StatsPage from './pages/Big5StatsPage';
import Big5TestPage from './pages/Big5TestPage';

function App() {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <TutorialProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/onboarding/flow" element={<Onboarding />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/diary-reveal/:date" element={<DiaryRevealPage />} />
              <Route path="/diary2/:date" element={<DiaryDetailPage2 />} />
              <Route path="/diary/:date" element={<DiaryDetailPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/letter" element={<LetterPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/random-diary" element={<RandomDiaryPage />} />
              <Route path="/big5/stats" element={<Big5StatsPage />} />
              <Route path="/big5/test" element={<Big5TestPage />} />
            </Routes>
          </Router>
        </TutorialProvider>
      </DarkModeProvider>
    </AuthProvider>
  );
}

export default App;
