/**
 * PrivateRoute Component
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  // 로딩 중에는 빈 화면 표시 (깜빡임 방지)
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#fef9f1]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.INTRO} replace />;
  }

  // 인증된 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
};
