/**
 * PrivateRoute 컴포넌트 테스트
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute } from '../../components/PrivateRoute';
import { ROUTES } from '../../constants/routes';

// AuthContext Mock
const mockUseAuth = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// 테스트 컴포넌트
const ProtectedContent = () => <div>보호된 콘텐츠</div>;
const IntroPage = () => <div>인트로 페이지</div>;

// 테스트 헬퍼
const renderWithRouter = (initialEntries: string[] = ['/protected']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path={ROUTES.INTRO} element={<IntroPage />} />
        <Route
          path="/protected"
          element={
            <PrivateRoute>
              <ProtectedContent />
            </PrivateRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

describe('PrivateRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('로딩 상태 테스트', () => {
    it('로딩 중일 때 로딩 스피너를 표시한다', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      const { container } = renderWithRouter();

      // 로딩 스피너가 있는지 확인
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('로딩 중일 때 보호된 콘텐츠를 표시하지 않는다', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      renderWithRouter();

      expect(screen.queryByText('보호된 콘텐츠')).not.toBeInTheDocument();
    });
  });

  describe('인증 상태 테스트', () => {
    it('인증된 사용자에게 보호된 콘텐츠를 표시한다', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      renderWithRouter();

      expect(screen.getByText('보호된 콘텐츠')).toBeInTheDocument();
    });

    it('인증되지 않은 사용자를 인트로 페이지로 리다이렉트한다', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      renderWithRouter();

      expect(screen.getByText('인트로 페이지')).toBeInTheDocument();
      expect(screen.queryByText('보호된 콘텐츠')).not.toBeInTheDocument();
    });
  });

  describe('children 렌더링 테스트', () => {
    it('인증된 상태에서 children이 올바르게 렌더링된다', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path={ROUTES.INTRO} element={<IntroPage />} />
            <Route
              path="/protected"
              element={
                <PrivateRoute>
                  <div>
                    <h1>타이틀</h1>
                    <p>내용</p>
                  </div>
                </PrivateRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('타이틀')).toBeInTheDocument();
      expect(screen.getByText('내용')).toBeInTheDocument();
    });
  });

  describe('스타일 테스트', () => {
    it('로딩 상태에서 올바른 스타일이 적용된다', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      const { container } = renderWithRouter();

      const loadingContainer = container.querySelector('.fixed.inset-0');
      expect(loadingContainer).toBeInTheDocument();
      expect(loadingContainer).toHaveClass('flex');
      expect(loadingContainer).toHaveClass('items-center');
      expect(loadingContainer).toHaveClass('justify-center');
    });
  });

  describe('상태 전환 테스트', () => {
    it('로딩에서 인증 상태로 전환 시 콘텐츠가 표시된다', () => {
      // 초기: 로딩 상태
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      const { rerender } = render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path={ROUTES.INTRO} element={<IntroPage />} />
            <Route
              path="/protected"
              element={
                <PrivateRoute>
                  <ProtectedContent />
                </PrivateRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText('보호된 콘텐츠')).not.toBeInTheDocument();

      // 인증 완료 상태로 변경
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path={ROUTES.INTRO} element={<IntroPage />} />
            <Route
              path="/protected"
              element={
                <PrivateRoute>
                  <ProtectedContent />
                </PrivateRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('보호된 콘텐츠')).toBeInTheDocument();
    });
  });
});
