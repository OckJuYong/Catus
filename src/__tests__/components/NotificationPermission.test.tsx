/**
 * NotificationPermission 컴포넌트 테스트
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationPermission from '../../components/NotificationPermission';

// Firebase Mock
jest.mock('../../utils/firebase', () => ({
  requestNotificationPermission: jest.fn(),
  onForegroundMessage: jest.fn().mockReturnValue(jest.fn()),
}));

describe('NotificationPermission', () => {
  const { requestNotificationPermission, onForegroundMessage } = require('../../utils/firebase');

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // 기본 Notification 상태 설정
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'default' },
      writable: true,
      configurable: true,
    });
  });

  describe('권한 상태별 렌더링 테스트', () => {
    it('permission이 default일 때 권한 요청 UI를 표시한다', () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'default' },
        writable: true,
        configurable: true,
      });

      render(<NotificationPermission />);

      expect(screen.getByText('알림 받기')).toBeInTheDocument();
      expect(screen.getByText(/새로운 메시지와 업데이트를 실시간으로 받아보세요/)).toBeInTheDocument();
      expect(screen.getByText('알림 허용')).toBeInTheDocument();
      expect(screen.getByText('나중에')).toBeInTheDocument();
    });

    it('permission이 granted일 때 아무것도 렌더링하지 않는다', () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'granted' },
        writable: true,
        configurable: true,
      });

      const { container } = render(<NotificationPermission />);

      expect(container.firstChild).toBeNull();
    });

    it('permission이 denied일 때 경고 메시지를 표시한다', () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'denied' },
        writable: true,
        configurable: true,
      });

      render(<NotificationPermission />);

      expect(screen.getByText('알림이 차단되었습니다')).toBeInTheDocument();
      expect(screen.getByText('브라우저 설정에서 알림을 허용해주세요.')).toBeInTheDocument();
    });
  });

  describe('자동 권한 요청 테스트', () => {
    it('로그인 상태이고 permission이 default이면 자동으로 권한을 요청한다', async () => {
      localStorage.setItem('accessToken', 'test-token');
      requestNotificationPermission.mockResolvedValue('mock-fcm-token');

      Object.defineProperty(window, 'Notification', {
        value: { permission: 'default' },
        writable: true,
        configurable: true,
      });

      render(<NotificationPermission />);

      await waitFor(() => {
        expect(requestNotificationPermission).toHaveBeenCalled();
      });
    });

    it('로그인하지 않은 상태에서는 자동 권한 요청을 하지 않는다', () => {
      // accessToken 없음
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'default' },
        writable: true,
        configurable: true,
      });

      render(<NotificationPermission />);

      expect(requestNotificationPermission).not.toHaveBeenCalled();
    });
  });

  describe('사용자 상호작용 테스트', () => {
    it('"알림 허용" 버튼 클릭 시 권한을 요청한다', async () => {
      requestNotificationPermission.mockResolvedValue('mock-fcm-token');

      Object.defineProperty(window, 'Notification', {
        value: { permission: 'default' },
        writable: true,
        configurable: true,
      });

      render(<NotificationPermission />);

      await userEvent.click(screen.getByText('알림 허용'));

      await waitFor(() => {
        expect(requestNotificationPermission).toHaveBeenCalled();
      });
    });

    it('"나중에" 버튼 클릭 시 denied 상태로 변경된다', async () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'default' },
        writable: true,
        configurable: true,
      });

      render(<NotificationPermission />);

      await userEvent.click(screen.getByText('나중에'));

      expect(screen.getByText('알림이 차단되었습니다')).toBeInTheDocument();
    });

    it('권한 요청 성공 시 컴포넌트가 사라진다', async () => {
      requestNotificationPermission.mockResolvedValue('mock-fcm-token');

      Object.defineProperty(window, 'Notification', {
        value: { permission: 'default' },
        writable: true,
        configurable: true,
      });

      const { container } = render(<NotificationPermission />);

      await userEvent.click(screen.getByText('알림 허용'));

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('권한 요청 실패 시 현재 Notification.permission 상태를 반영한다', async () => {
      requestNotificationPermission.mockResolvedValue(null);

      Object.defineProperty(window, 'Notification', {
        value: { permission: 'denied' },
        writable: true,
        configurable: true,
      });

      render(<NotificationPermission />);

      await userEvent.click(screen.getByText('알림 허용'));

      await waitFor(() => {
        expect(screen.getByText('알림이 차단되었습니다')).toBeInTheDocument();
      });
    });
  });

  describe('포그라운드 메시지 리스너 테스트', () => {
    it('컴포넌트 마운트 시 포그라운드 메시지 리스너가 등록된다', () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'default' },
        writable: true,
        configurable: true,
      });

      render(<NotificationPermission />);

      expect(onForegroundMessage).toHaveBeenCalled();
    });

    it('컴포넌트 언마운트 시 리스너가 정리된다', () => {
      const unsubscribe = jest.fn();
      onForegroundMessage.mockReturnValue(unsubscribe);

      Object.defineProperty(window, 'Notification', {
        value: { permission: 'default' },
        writable: true,
        configurable: true,
      });

      const { unmount } = render(<NotificationPermission />);
      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('스타일 테스트', () => {
    it('default 상태에서 올바른 스타일의 컨테이너가 렌더링된다', () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'default' },
        writable: true,
        configurable: true,
      });

      render(<NotificationPermission />);

      const container = screen.getByText('알림 받기').closest('div');
      expect(container?.parentElement).toHaveClass('fixed', 'bottom-4', 'right-4');
    });

    it('denied 상태에서 경고 스타일의 컨테이너가 렌더링된다', () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'denied' },
        writable: true,
        configurable: true,
      });

      render(<NotificationPermission />);

      const container = screen.getByText('알림이 차단되었습니다').closest('div');
      expect(container?.parentElement).toHaveClass('bg-red-100', 'border-red-400');
    });
  });

  describe('접근성 테스트', () => {
    it('버튼들이 올바른 역할을 가진다', () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'default' },
        writable: true,
        configurable: true,
      });

      render(<NotificationPermission />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('SVG 아이콘이 포함되어 있다', () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'default' },
        writable: true,
        configurable: true,
      });

      const { container } = render(<NotificationPermission />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});
