/**
 * 푸시 알림 권한 요청 컴포넌트
 *
 * 사용법:
 * 1. App.tsx에서 import: import NotificationPermission from './components/NotificationPermission';
 * 2. 컴포넌트 추가: <NotificationPermission />
 * 3. 사용자 로그인 후 자동으로 권한 요청 팝업 표시
 */

import { useState, useEffect } from 'react';
import { requestNotificationPermission, onForegroundMessage } from '../utils/firebase';

type PermissionState = 'default' | 'granted' | 'denied';

const NotificationPermission = () => {
  const [permission, setPermission] = useState<PermissionState>(
    Notification.permission as PermissionState
  );
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    // 사용자 로그인 상태 확인
    const isLoggedIn = localStorage.getItem('accessToken');

    if (isLoggedIn && permission === 'default') {
      // 로그인 상태이고 아직 권한 요청하지 않았으면 요청
      handleRequestPermission();
    }

    // 포그라운드 메시지 수신 리스너
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('📩 포그라운드 알림:', payload);

      // 알림 수신 시 UI 업데이트 (예: 배지, 팝업 등)
      // 필요한 경우 여기에 커스텀 로직 추가
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [permission]);

  /**
   * 알림 권한 요청 핸들러
   */
  const handleRequestPermission = async (): Promise<void> => {
    const token = await requestNotificationPermission();

    if (token) {
      setFcmToken(token);
      setPermission('granted');
    } else {
      setPermission(Notification.permission as PermissionState);
    }
  };

  // 권한이 이미 허용되었으면 UI 표시하지 않음
  if (permission === 'granted') {
    return null;
  }

  // 권한이 거부되었으면 안내 메시지만 표시
  if (permission === 'denied') {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg max-w-sm z-50">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">알림이 차단되었습니다</p>
            <p className="mt-1 text-sm">브라우저 설정에서 알림을 허용해주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  // 권한 요청 대기 중 (default)
  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 shadow-lg rounded-lg p-4 max-w-sm z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">알림 받기</h3>
          <p className="mt-1 text-sm text-gray-500">
            새로운 메시지와 업데이트를 실시간으로 받아보세요.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleRequestPermission}
              className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              알림 허용
            </button>
            <button
              onClick={() => setPermission('denied')}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              나중에
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermission;
