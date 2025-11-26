/**
 * LoadingSpinner 컴포넌트 테스트
 */

import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

describe('LoadingSpinner', () => {
  describe('렌더링 테스트', () => {
    it('기본 props로 정상 렌더링된다', () => {
      const { container } = render(<LoadingSpinner />);

      // 스피너 애니메이션 요소가 있는지 확인
      const spinner = container.querySelector('[style*="animation"]');
      expect(spinner).toBeInTheDocument();
    });

    it('text prop이 있으면 텍스트를 표시한다', () => {
      render(<LoadingSpinner text="로딩 중..." />);

      expect(screen.getByText('로딩 중...')).toBeInTheDocument();
    });

    it('text prop이 없으면 텍스트를 표시하지 않는다', () => {
      const { container } = render(<LoadingSpinner />);

      const textElement = container.querySelector('p');
      expect(textElement).not.toBeInTheDocument();
    });
  });

  describe('size 테스트', () => {
    it('small size가 올바른 크기를 적용한다', () => {
      const { container } = render(<LoadingSpinner size="small" />);

      const spinner = container.querySelector('[style*="width: 24px"]');
      expect(spinner).toBeInTheDocument();
    });

    it('medium size가 올바른 크기를 적용한다', () => {
      const { container } = render(<LoadingSpinner size="medium" />);

      const spinner = container.querySelector('[style*="width: 40px"]');
      expect(spinner).toBeInTheDocument();
    });

    it('large size가 올바른 크기를 적용한다', () => {
      const { container } = render(<LoadingSpinner size="large" />);

      const spinner = container.querySelector('[style*="width: 60px"]');
      expect(spinner).toBeInTheDocument();
    });

    it('기본 size는 medium이다', () => {
      const { container } = render(<LoadingSpinner />);

      const spinner = container.querySelector('[style*="width: 40px"]');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('color 테스트', () => {
    it('기본 color가 적용된다', () => {
      const { container } = render(<LoadingSpinner />);

      const spinner = container.querySelector('[style*="border-top-color: rgb(95, 111, 82)"]');
      expect(spinner).toBeInTheDocument();
    });

    it('커스텀 color가 적용된다', () => {
      const { container } = render(<LoadingSpinner color="#FF0000" />);

      const spinner = container.querySelector('[style*="border-top-color: rgb(255, 0, 0)"]');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('fullScreen 테스트', () => {
    it('fullScreen이 true이면 전체 화면 스타일이 적용된다', () => {
      const { container } = render(<LoadingSpinner fullScreen />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ position: 'fixed' });
      expect(wrapper).toHaveStyle({ inset: '0' });
    });

    it('fullScreen이 false이면 전체 화면 스타일이 적용되지 않는다', () => {
      const { container } = render(<LoadingSpinner fullScreen={false} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).not.toHaveStyle({ position: 'fixed' });
    });
  });

  describe('className 테스트', () => {
    it('추가 className이 올바르게 적용된다', () => {
      const { container } = render(<LoadingSpinner className="custom-spinner" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-spinner');
    });

    it('기본 flex 클래스가 항상 적용된다', () => {
      const { container } = render(<LoadingSpinner />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('flex-col');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('justify-center');
    });
  });

  describe('스타일 및 애니메이션 테스트', () => {
    it('스피너가 회전 애니메이션을 가진다', () => {
      const { container } = render(<LoadingSpinner />);

      // style 태그에 keyframes가 포함되어 있는지 확인
      const styleTag = container.querySelector('style');
      expect(styleTag?.textContent).toContain('spinner-rotate');
    });

    it('스피너가 둥근 모양이다', () => {
      const { container } = render(<LoadingSpinner />);

      const spinner = container.querySelector('[style*="border-radius: 50%"]');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('조합 테스트', () => {
    it('모든 props가 함께 작동한다', () => {
      const { container } = render(
        <LoadingSpinner
          size="large"
          color="#00FF00"
          text="데이터 로딩 중"
          fullScreen
          className="my-spinner"
        />
      );

      // 텍스트 확인
      expect(screen.getByText('데이터 로딩 중')).toBeInTheDocument();

      // 크기 확인
      const spinner = container.querySelector('[style*="width: 60px"]');
      expect(spinner).toBeInTheDocument();

      // 전체 화면 확인
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ position: 'fixed' });

      // 커스텀 클래스 확인
      expect(wrapper).toHaveClass('my-spinner');
    });
  });
});
