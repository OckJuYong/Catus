/**
 * Button 컴포넌트 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../../components/common/Button';

describe('Button', () => {
  describe('렌더링 테스트', () => {
    it('기본 props로 정상 렌더링된다', () => {
      render(<Button>클릭</Button>);

      const button = screen.getByRole('button', { name: '클릭' });
      expect(button).toBeInTheDocument();
    });

    it('children이 올바르게 렌더링된다', () => {
      render(<Button>테스트 버튼</Button>);

      expect(screen.getByText('테스트 버튼')).toBeInTheDocument();
    });

    it('loading 상태일 때 스피너를 표시한다', () => {
      render(<Button loading>로딩</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      // 스피너가 있는지 확인 (animate-spin 클래스)
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('loading 상태일 때 children은 표시되지 않는다', () => {
      render(<Button loading>숨겨진 텍스트</Button>);

      expect(screen.queryByText('숨겨진 텍스트')).not.toBeInTheDocument();
    });
  });

  describe('variant 테스트', () => {
    it('primary variant가 올바른 스타일을 적용한다', () => {
      render(<Button variant="primary">Primary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-[#5F6F52]');
      expect(button).toHaveClass('text-white');
    });

    it('secondary variant가 올바른 스타일을 적용한다', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-200');
      expect(button).toHaveClass('text-gray-700');
    });

    it('outline variant가 올바른 스타일을 적용한다', () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('border-2');
    });
  });

  describe('size 테스트', () => {
    it('small size가 올바른 스타일을 적용한다', () => {
      render(<Button size="small">Small</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('py-1.5');
      expect(button).toHaveClass('text-sm');
    });

    it('medium size가 올바른 스타일을 적용한다', () => {
      render(<Button size="medium">Medium</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
      expect(button).toHaveClass('text-base');
    });

    it('large size가 올바른 스타일을 적용한다', () => {
      render(<Button size="large">Large</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('py-3');
      expect(button).toHaveClass('text-lg');
    });
  });

  describe('fullWidth 테스트', () => {
    it('fullWidth가 true이면 w-full 클래스가 적용된다', () => {
      render(<Button fullWidth>Full Width</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    it('fullWidth가 false이면 w-full 클래스가 적용되지 않는다', () => {
      render(<Button fullWidth={false}>Normal Width</Button>);

      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('w-full');
    });
  });

  describe('disabled 상태 테스트', () => {
    it('disabled가 true이면 버튼이 비활성화된다', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50');
      expect(button).toHaveClass('cursor-not-allowed');
    });

    it('disabled 상태에서 클릭 이벤트가 발생하지 않는다', async () => {
      const handleClick = jest.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('사용자 상호작용 테스트', () => {
    it('버튼 클릭 시 onClick이 호출된다', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>클릭</Button>);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('loading 상태에서는 클릭 이벤트가 발생하지 않는다', async () => {
      const handleClick = jest.fn();
      render(
        <Button loading onClick={handleClick}>
          Loading
        </Button>
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('클릭 이벤트에 마우스 이벤트 객체가 전달된다', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>클릭</Button>);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(handleClick).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'click',
        })
      );
    });
  });

  describe('className 및 style 테스트', () => {
    it('추가 className이 올바르게 적용된다', () => {
      render(<Button className="custom-class">Custom</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('인라인 style이 올바르게 적용된다', () => {
      render(<Button style={{ marginTop: '10px' }}>Styled</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({ marginTop: '10px' });
    });
  });

  describe('접근성 테스트', () => {
    it('버튼이 올바른 role을 가진다', () => {
      render(<Button>접근성</Button>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('disabled 상태가 aria-disabled로 반영된다', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('type prop이 올바르게 전달된다', () => {
      render(<Button type="submit">Submit</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('기타 HTML 속성 테스트', () => {
    it('data 속성이 올바르게 전달된다', () => {
      render(<Button data-testid="custom-button">Data</Button>);

      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });

    it('aria-label이 올바르게 전달된다', () => {
      render(<Button aria-label="커스텀 라벨">Aria</Button>);

      const button = screen.getByRole('button', { name: '커스텀 라벨' });
      expect(button).toBeInTheDocument();
    });
  });
});
