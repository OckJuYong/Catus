/**
 * WithdrawModal 컴포넌트 테스트
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WithdrawModal from '../../components/WithdrawModal';

describe('WithdrawModal', () => {
  const defaultProps = {
    visible: true,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('렌더링 테스트', () => {
    it('visible이 true일 때 모달을 표시한다', () => {
      render(<WithdrawModal {...defaultProps} />);

      expect(screen.getByText('정말 탈퇴하시겠어요?')).toBeInTheDocument();
    });

    it('visible이 false일 때 모달을 표시하지 않는다', () => {
      render(<WithdrawModal {...defaultProps} visible={false} />);

      expect(screen.queryByText('정말 탈퇴하시겠어요?')).not.toBeInTheDocument();
    });

    it('경고 메시지가 올바르게 표시된다', () => {
      render(<WithdrawModal {...defaultProps} />);

      expect(screen.getByText(/모든 일기와 대화 기록이 삭제되며/)).toBeInTheDocument();
      expect(screen.getByText(/복구할 수 없습니다/)).toBeInTheDocument();
    });

    it('취소 버튼이 표시된다', () => {
      render(<WithdrawModal {...defaultProps} />);

      expect(screen.getByText('취소')).toBeInTheDocument();
    });

    it('탈퇴하기 버튼이 표시된다', () => {
      render(<WithdrawModal {...defaultProps} />);

      expect(screen.getByText('탈퇴하기')).toBeInTheDocument();
    });
  });

  describe('사용자 상호작용 테스트', () => {
    it('취소 버튼 클릭 시 onCancel이 호출된다', async () => {
      const onCancel = jest.fn();
      render(<WithdrawModal {...defaultProps} onCancel={onCancel} />);

      await userEvent.click(screen.getByText('취소'));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('탈퇴하기 버튼 클릭 시 onConfirm이 호출된다', async () => {
      const onConfirm = jest.fn();
      render(<WithdrawModal {...defaultProps} onConfirm={onConfirm} />);

      await userEvent.click(screen.getByText('탈퇴하기'));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('오버레이 클릭 시 onCancel이 호출된다', async () => {
      const onCancel = jest.fn();
      const { container } = render(<WithdrawModal {...defaultProps} onCancel={onCancel} />);

      // 오버레이 영역 클릭 (모달 외부)
      const overlay = container.querySelector('[style*="position: fixed"]');
      if (overlay) {
        fireEvent.click(overlay);
        expect(onCancel).toHaveBeenCalled();
      }
    });

    it('모달 내부 클릭 시 onCancel이 호출되지 않는다', async () => {
      const onCancel = jest.fn();
      render(<WithdrawModal {...defaultProps} onCancel={onCancel} />);

      // 모달 타이틀 클릭 (모달 내부)
      fireEvent.click(screen.getByText('정말 탈퇴하시겠어요?'));

      // onCancel이 호출되지 않아야 함 (stopPropagation 때문에)
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('로딩 상태 테스트', () => {
    it('로딩 중일 때 "처리 중..." 텍스트를 표시한다', () => {
      render(<WithdrawModal {...defaultProps} isLoading={true} />);

      expect(screen.getByText('처리 중...')).toBeInTheDocument();
      expect(screen.queryByText('탈퇴하기')).not.toBeInTheDocument();
    });

    it('로딩 중일 때 버튼들이 비활성화된다', () => {
      render(<WithdrawModal {...defaultProps} isLoading={true} />);

      expect(screen.getByText('취소')).toBeDisabled();
      expect(screen.getByText('처리 중...')).toBeDisabled();
    });

    it('로딩 중일 때 취소 버튼 클릭이 무시된다', async () => {
      const onCancel = jest.fn();
      render(<WithdrawModal {...defaultProps} isLoading={true} onCancel={onCancel} />);

      await userEvent.click(screen.getByText('취소'));

      expect(onCancel).not.toHaveBeenCalled();
    });

    it('로딩 중일 때 확인 버튼 클릭이 무시된다', async () => {
      const onConfirm = jest.fn();
      render(<WithdrawModal {...defaultProps} isLoading={true} onConfirm={onConfirm} />);

      await userEvent.click(screen.getByText('처리 중...'));

      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('스타일 테스트', () => {
    it('취소 버튼에 올바른 스타일이 적용된다', () => {
      render(<WithdrawModal {...defaultProps} />);

      const cancelButton = screen.getByText('취소');
      expect(cancelButton).toHaveStyle({ backgroundColor: '#f5f5f5' });
    });

    it('탈퇴하기 버튼에 올바른 스타일이 적용된다', () => {
      render(<WithdrawModal {...defaultProps} />);

      const confirmButton = screen.getByText('탈퇴하기');
      expect(confirmButton).toHaveStyle({ backgroundColor: '#FF3B30' });
    });

    it('로딩 중일 때 버튼 opacity가 변경된다', () => {
      render(<WithdrawModal {...defaultProps} isLoading={true} />);

      const cancelButton = screen.getByText('취소');
      expect(cancelButton).toHaveStyle({ opacity: '0.5' });
    });
  });

  describe('애니메이션 테스트', () => {
    it('visible 상태 변경 시 AnimatePresence가 올바르게 동작한다', async () => {
      const { rerender } = render(<WithdrawModal {...defaultProps} visible={true} />);

      expect(screen.getByText('정말 탈퇴하시겠어요?')).toBeInTheDocument();

      rerender(<WithdrawModal {...defaultProps} visible={false} />);

      // framer-motion의 exit 애니메이션 후 사라짐
      await waitFor(() => {
        expect(screen.queryByText('정말 탈퇴하시겠어요?')).not.toBeInTheDocument();
      });
    });
  });

  describe('접근성 테스트', () => {
    it('버튼들이 올바른 역할을 가진다', () => {
      render(<WithdrawModal {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('로딩 중일 때 버튼이 disabled 상태를 가진다', () => {
      render(<WithdrawModal {...defaultProps} isLoading={true} />);

      const cancelButton = screen.getByText('취소');
      const confirmButton = screen.getByText('처리 중...');

      expect(cancelButton).toHaveAttribute('disabled');
      expect(confirmButton).toHaveAttribute('disabled');
    });
  });
});
