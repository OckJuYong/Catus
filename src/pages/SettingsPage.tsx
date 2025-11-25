import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings, useUpdateProfile, useUpdateNotifications, useUpdateDiaryTime, useUpdateTheme } from '../hooks/useApi';
// localStorage 키 상수
const STORAGE_KEYS = {
  DIARY_NOTIFICATION: 'catus_diary_notification',
  AI_STYLE: 'catus_ai_style',
} as const;

interface ExpandedItems {
  nickname: boolean;
  diaryTime: boolean;
}

interface DiaryTime {
  hour: string;
  minute: string;
  period: 'AM' | 'PM';
}

interface Notifications {
  diaryCreation: boolean;
  encouragement: boolean;
}

type SaveType = 'nickname' | 'diaryTime' | '';

function SettingsPage() {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { user, getAccessToken } = useAuth();

  // React Query hooks
  const { data: settingsData, isLoading: isSettingsLoading, error: settingsError, refetch: refetchSettings } = useSettings();
  const updateProfileMutation = useUpdateProfile();
  const updateNotificationsMutation = useUpdateNotifications();
  const updateDiaryTimeMutation = useUpdateDiaryTime();
  const updateThemeMutation = useUpdateTheme();

  // 개별 항목 펼침/접힘 상태
  const [expandedItems, setExpandedItems] = useState<ExpandedItems>({
    nickname: false,
    diaryTime: false
  });

  // 계정 관리 상태
  const [userNickname, setUserNickname] = useState('사용자123');
  const [newNickname, setNewNickname] = useState('');

  // 일기 설정 상태
  const [diaryTime, setDiaryTime] = useState<DiaryTime>({ hour: '09', minute: '00', period: 'PM' });
  const [tempDiaryTime, setTempDiaryTime] = useState<DiaryTime>({ hour: '09', minute: '00', period: 'PM' });
  const [aiStyle, setAiStyle] = useState<'casual' | 'formal'>('casual');

  // 알람 설정 상태
  const [notifications, setNotifications] = useState<Notifications>({
    diaryCreation: true,
    encouragement: true
  });

  // 저장 모달 상태
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveType, setSaveType] = useState<SaveType>('');

  // 개별 항목 토글 (한 번에 하나씩만 열림)
  const toggleItem = (item: keyof ExpandedItems): void => {
    setExpandedItems(prev => {
      // 이미 열려있는 항목을 클릭하면 닫기
      if (prev[item]) {
        return {
          nickname: false,
          diaryTime: false
        };
      }
      // 새로운 항목을 열 때는 다른 항목 모두 닫기
      return {
        nickname: false,
        diaryTime: false,
        [item]: true
      };
    });
  };

  // 토글 스위치 (알림 설정)
  const toggleNotification = async (type: keyof Notifications): Promise<void> => {
    const newValue = !notifications[type];

    // 즉시 UI 업데이트 (optimistic update)
    setNotifications(prev => ({
      ...prev,
      [type]: newValue
    }));

    // 백엔드는 'anonymous' (응원 메시지 알림)만 지원
    if (type === 'encouragement') {
      try {
        // React Query mutation으로 API 호출 - anonymous 필드 사용
        console.log('📤 [Settings] 알림 설정 변경 요청:', { anonymous: newValue });
        const result = await updateNotificationsMutation.mutateAsync(newValue);
        console.log('✅ [Settings] 알림 설정 변경 성공:', result);
      } catch (error: any) {
        console.error('Failed to save notification settings:', error);
        // 실패 시 원래 상태로 되돌리기
        setNotifications(prev => ({
          ...prev,
          [type]: !newValue
        }));
        // 에러 유형에 따른 구체적인 메시지
        if (error?.status === 401) {
          alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        } else if (!navigator.onLine) {
          alert('인터넷 연결을 확인해주세요.');
        } else {
          alert('알림 설정 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
        }
      }
    } else {
      // 일기 생성 알림은 로컬 스토리지에 저장 (백엔드 미지원)
      try {
        localStorage.setItem(STORAGE_KEYS.DIARY_NOTIFICATION, String(newValue));
      } catch (error) {
        console.error('Failed to save diary notification setting:', error);
      }
    }
  };

  // 다크모드 토글 (로컬 Context + 백엔드 API 동기화)
  const handleToggleDarkMode = async (): Promise<void> => {
    const newValue = !isDarkMode;

    // 즉시 UI 업데이트 (Context 사용)
    toggleDarkMode();

    // 백엔드에도 저장 (실패해도 로컬은 유지)
    try {
      console.log('📤 [Settings] 다크모드 변경 요청:', { darkMode: newValue });
      const result = await updateThemeMutation.mutateAsync(newValue);
      console.log('✅ [Settings] 다크모드 변경 성공:', result);
    } catch (error) {
      console.error('❌ [Settings] 다크모드 동기화 실패:', error);
      // 백엔드 동기화 실패해도 로컬 설정은 유지 (UX 우선)
    }
  };

  // 닉네임 저장
  const handleSaveNickname = async (): Promise<void> => {
    if (!newNickname) {
      alert('새 닉네임을 입력해주세요.');
      return;
    }

    // 로딩 모달 표시
    setShowSaveModal(true);
    setSaveSuccess(false);
    setSaveType('nickname');

    try {
      // React Query mutation으로 프로필 업데이트
      console.log('📤 [Settings] 닉네임 변경 요청:', { nickname: newNickname });
      const result = await updateProfileMutation.mutateAsync({ nickname: newNickname });
      console.log('✅ [Settings] 닉네임 변경 성공:', result);
      setUserNickname(newNickname);
      setSaveSuccess(true);
    } catch (error: any) {
      console.error('❌ [Settings] 닉네임 변경 실패:', error);
      // 에러 유형에 따른 구체적인 메시지
      if (error?.status === 409) {
        alert('이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.');
      } else if (error?.status === 400) {
        alert('닉네임 형식이 올바르지 않습니다. (2~20자)');
      } else if (error?.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
      } else if (!navigator.onLine) {
        alert('인터넷 연결을 확인해주세요.');
      } else {
        alert('닉네임 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
      setShowSaveModal(false);
    }
  };

  // 닉네임 취소
  const handleCancelNickname = (): void => {
    setNewNickname('');
    setExpandedItems(prev => ({ ...prev, nickname: false }));
  };

  // 일기 시간 변경 시작
  const handleOpenDiaryTime = (): void => {
    setTempDiaryTime(diaryTime);
    toggleItem('diaryTime');
  };

  // 일기 시간 저장
  const handleSaveDiaryTime = async (): Promise<void> => {
    // 로딩 모달 표시
    setShowSaveModal(true);
    setSaveSuccess(false);
    setSaveType('diaryTime');

    try {
      // 24시간 형식으로 변환
      const hour24 = convertTo24Hour(tempDiaryTime.hour, tempDiaryTime.period);
      const alarmTime = `${hour24}:${tempDiaryTime.minute}`;

      // React Query mutation으로 일기 시간 업데이트
      console.log('📤 [Settings] 일기 생성 시간 변경 요청:', { time: alarmTime });
      const result = await updateDiaryTimeMutation.mutateAsync(alarmTime);
      console.log('✅ [Settings] 일기 생성 시간 변경 성공:', result);

      // 성공 시 로컬 상태 업데이트
      setDiaryTime(tempDiaryTime);
      setSaveSuccess(true);
    } catch (error: any) {
      console.error('❌ [Settings] 일기 생성 시간 변경 실패:', error);
      // 에러 유형에 따른 구체적인 메시지
      if (error?.status === 400) {
        alert('시간 형식이 올바르지 않습니다.');
      } else if (error?.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
      } else if (!navigator.onLine) {
        alert('인터넷 연결을 확인해주세요.');
      } else {
        alert('일기 생성 시간 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
      setShowSaveModal(false);
    }
  };

  // 일기 시간 취소
  const handleCancelDiaryTime = (): void => {
    setTempDiaryTime(diaryTime);
    setExpandedItems(prev => ({ ...prev, diaryTime: false }));
  };

  // 시간 변환 함수: 프론트엔드 → 백엔드 (24시간 형식)
  const convertTo24Hour = (hour: string, period: 'AM' | 'PM'): string => {
    let h = parseInt(hour);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return String(h).padStart(2, '0');
  };

  // 시간 변환 함수: 백엔드 → 프론트엔드 (12시간 형식)
  const convertTo12Hour = (time24: string | null | undefined): DiaryTime => {
    if (!time24) return { hour: '09', minute: '00', period: 'PM' };
    const [hour24Str, minute] = time24.split(':');
    if (!hour24Str || !minute) return { hour: '09', minute: '00', period: 'PM' };
    let h = parseInt(hour24Str);
    const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return { hour: String(h).padStart(2, '0'), minute: minute || '00', period };
  };

  // 설정 불러오기 (React Query로 자동 로딩)
  useEffect(() => {
    if (settingsData) {
      // 백엔드 응답 구조: { diaryGenerationTime, notifications, theme, profile }
      // 또는 래핑된 구조: { settings: { diaryTime, notifications, nickname } }
      // 두 구조 모두 지원하기 위해 optional chaining 사용

      // 알람 시간 설정 (diaryGenerationTime 또는 settings.diaryTime)
      const diaryTimeValue = settingsData.diaryGenerationTime || (settingsData as any).settings?.diaryTime;
      if (diaryTimeValue) {
        const time12 = convertTo12Hour(diaryTimeValue);
        setDiaryTime(time12);
        setTempDiaryTime(time12);
      }

      // 알림 설정 - 백엔드는 anonymous만 지원
      const savedDiaryNotification = localStorage.getItem(STORAGE_KEYS.DIARY_NOTIFICATION);
      // notifications.anonymous 또는 notifications.messageReceived 확인
      const encouragementValue = settingsData.notifications?.anonymous ??
                                  settingsData.notifications?.messageReceived ??
                                  (settingsData as any).settings?.notifications?.anonymous ?? true;
      setNotifications({
        diaryCreation: savedDiaryNotification !== null ? savedDiaryNotification === 'true' : true,
        encouragement: encouragementValue
      });

      // 닉네임 설정 (profile.nickname 또는 settings.nickname)
      const nicknameValue = settingsData.profile?.nickname || (settingsData as any).settings?.nickname;
      if (nicknameValue) {
        setUserNickname(nicknameValue);
      }

      // 다크모드 설정 (백엔드에서 불러오기)
      if (settingsData.theme?.darkMode !== undefined) {
        // Context의 다크모드와 백엔드 설정이 다르면 동기화
        if (isDarkMode !== settingsData.theme.darkMode) {
          toggleDarkMode();
        }
      }
    }
  }, [settingsData]);

  // AI 스타일 토글 (로컬 저장 - 백엔드 미지원시)
  const handleToggleAiStyle = async (style: 'casual' | 'formal'): Promise<void> => {
    const newStyle = style;
    setAiStyle(newStyle);

    // 로컬 스토리지에 저장 (백엔드 API 없을 경우)
    try {
      localStorage.setItem(STORAGE_KEYS.AI_STYLE, newStyle);
    } catch (error) {
      console.error('Failed to save AI style:', error);
    }
  };

  // AI 스타일 로컬 스토리지에서 불러오기
  useEffect(() => {
    const savedStyle = localStorage.getItem(STORAGE_KEYS.AI_STYLE);
    if (savedStyle === 'casual' || savedStyle === 'formal') {
      setAiStyle(savedStyle);
    }
  }, []);

  // 모달 닫기 핸들러
  const handleCloseModal = (): void => {
    if (saveType === 'nickname') {
      setNewNickname('');
      setExpandedItems(prev => ({ ...prev, nickname: false }));
    } else if (saveType === 'diaryTime') {
      setExpandedItems(prev => ({ ...prev, diaryTime: false }));
    }
    setShowSaveModal(false);
    setSaveSuccess(false);
    setSaveType('');
  };

  return (
    <>
    {/* 전역 애니메이션 스타일 */}
    <style>{`
      @keyframes spinner-rotate {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes dots-blink {
        0%, 20% { opacity: 0.2; }
        50% { opacity: 1; }
        100% { opacity: 0.2; }
      }
    `}</style>
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-main-bg)' }}>
      {/* 헤더 */}
      <div className="relative flex items-center justify-center" style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '20px', paddingRight: '20px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}>
        <button
          className="absolute left-[20px] bg-transparent border-0 cursor-pointer transition-all active:scale-93"
          style={{ fontSize: '20px', paddingLeft: '1px', paddingRight: '8px', transform: 'translateY(-2px)', color: 'var(--color-text-primary)' }}
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
        >
          ←
        </button>
        <h1 className="font-semibold" style={{ fontSize: '18px', margin: 0, color: 'var(--color-text-primary)' }}>사용자 정보 수정</h1>
      </div>

      {/* 컨텐츠 */}
      <div style={{ paddingTop: '20px', paddingBottom: '20px', paddingLeft: '20px', paddingRight: '20px' }}>
        {/* 설정 로딩 상태 */}
        {isSettingsLoading && (
          <div className="flex flex-col items-center justify-center" style={{ padding: '40px 20px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '3px solid #e0e0e0',
                borderTopColor: '#a3b899',
                borderRadius: '50%',
                animation: 'spinner-rotate 0.8s linear infinite',
                marginBottom: '16px'
              }}
            />
            <p className="text-[#666]" style={{ fontSize: '14px' }}>설정을 불러오는 중...</p>
          </div>
        )}

        {/* 설정 로딩 에러 */}
        {settingsError && !isSettingsLoading && (
          <div className="flex flex-col items-center justify-center" style={{ padding: '40px 20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
            <p className="text-[#666] text-center" style={{ fontSize: '14px', marginBottom: '16px' }}>
              설정을 불러오는데 실패했습니다.
            </p>
            <button
              className="text-white font-semibold cursor-pointer transition-all active:scale-93"
              style={{
                paddingTop: '10px',
                paddingBottom: '10px',
                paddingLeft: '24px',
                paddingRight: '24px',
                backgroundColor: '#a3b899',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              onClick={() => refetchSettings()}
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 계정 관리 - 로딩/에러가 아닐 때만 표시 */}
        {!isSettingsLoading && !settingsError && (
        <>
        <div style={{ marginBottom: '32px' }}>
          <h3 className="text-[#999] font-semibold text-center" style={{ fontSize: '12px', margin: '0 0 8px 0', paddingLeft: '16px', paddingRight: '16px' }}>계정 관리</h3>
          <div className="bg-[white]" style={{ borderRadius: '16px', paddingTop: '8px', paddingBottom: '8px', paddingLeft: '16px', paddingRight: '16px', marginBottom: '8px' }}>
              {/* 닉네임 변경 */}
              <div className="flex justify-between items-center cursor-pointer transition-all active:scale-98" style={{ paddingTop: '16px', paddingBottom: '16px' }} onClick={() => toggleItem('nickname')}>
                <span className="text-[#333]" style={{ fontSize: '15px' }}>닉네임 변경</span>
                <span className="text-[#999]" style={{ fontSize: '18px' }}>›</span>
              </div>
              <AnimatePresence>
              {expandedItems.nickname && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden' }}
                >
                <div style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '0px', paddingRight: '0px', borderBottom: '1px solid #f0f0f0' }}>
                  <div className="text-[#666] font-semibold" style={{ fontSize: '13px', marginTop: '16px', marginBottom: '6px' }}>현재 닉네임</div>
                  <input
                    type="text"
                    className="w-full bg-[#f5f5f5] text-[#666] border border-[#e0e0e0] cursor-not-allowed"
                    style={{ paddingTop: '10px', paddingBottom: '10px', paddingLeft: '16px', paddingRight: '16px', borderRadius: '12px', fontSize: '15px', boxSizing: 'border-box' }}
                    value={userNickname}
                    readOnly
                  />
                  <div className="text-[#666] font-semibold" style={{ fontSize: '13px', marginTop: '16px', marginBottom: '6px' }}>새 닉네임</div>
                  <input
                    type="text"
                    className="w-full border border-[#e0e0e0] focus:outline-none focus:border-[#5F6F52]"
                    style={{ paddingTop: '10px', paddingBottom: '10px', paddingLeft: '16px', paddingRight: '16px', borderRadius: '12px', fontSize: '15px', boxSizing: 'border-box' }}
                    placeholder="새 닉네임을 입력하세요"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                  />
                  <div className="flex" style={{ gap: '8px', marginTop: '16px' }}>
                    <button
                      className="flex-1 bg-white text-[#666] font-semibold cursor-pointer transition-all active:scale-93"
                      style={{ paddingTop: '12px', paddingBottom: '12px', border: '2px solid #e0e0e0', borderRadius: '12px', fontSize: '14px' }}
                      onClick={handleCancelNickname}
                    >
                      취소
                    </button>
                    <button
                      className="flex-1 text-[#FFFFFF] font-semibold cursor-pointer transition-all active:scale-93 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ paddingTop: '12px', paddingBottom: '12px', backgroundColor: !newNickname ? '#ccc' : '#a3b899', border: 'none', borderRadius: '12px', fontSize: '14px' }}
                      onClick={handleSaveNickname}
                      disabled={!newNickname}
                    >
                      변경
                    </button>
                  </div>
                </div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
        </div>

        {/* 일기 설정 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 className="text-[#999] font-semibold text-center" style={{ fontSize: '12px', margin: '0 0 8px 0', paddingLeft: '16px', paddingRight: '16px' }}>일기 설정</h3>
          <div className="bg-[white]" style={{ borderRadius: '16px', paddingTop: '8px', paddingBottom: '8px', paddingLeft: '16px', paddingRight: '16px', marginBottom: '8px' }}>
              {/* 그림일기 생성 시간 */}
              <div className="flex justify-between items-center cursor-pointer transition-all active:scale-98" style={{ paddingTop: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }} onClick={handleOpenDiaryTime}>
                <span className="text-[#333]" style={{ fontSize: '15px' }}>그림일기 생성 시간</span>
                <div className="flex items-center" style={{ gap: '8px' }}>
                  <span className="text-[#999]" style={{ fontSize: '14px' }}>{diaryTime.period === 'AM' ? '오전' : '오후'} {diaryTime.hour}:{diaryTime.minute}</span>
                  <span className="text-[#999]" style={{ fontSize: '18px' }}>›</span>
                </div>
              </div>
              <AnimatePresence>
              {expandedItems.diaryTime && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden' }}
                >
                <div style={{ paddingTop: '16px', paddingBottom: '16px', paddingLeft: '0px', paddingRight: '0px', borderBottom: '1px solid #f0f0f0' }}>
                  <div className="flex justify-around items-center" style={{ gap: '8px', marginTop: '16px', marginBottom: '16px' }}>
                    <div className="flex flex-col items-center">
                      <span className="text-[#999]" style={{ fontSize: '13px', marginBottom: '6px' }}>오전/오후</span>
                      <select
                        className="border border-[#e0e0e0] bg-white cursor-pointer focus:outline-none focus:border-[#5F6F52]"
                        style={{ paddingTop: '8px', paddingBottom: '8px', paddingLeft: '12px', paddingRight: '12px', borderRadius: '8px', fontSize: '15px' }}
                        value={tempDiaryTime.period}
                        onChange={(e) => setTempDiaryTime(prev => ({ ...prev, period: e.target.value as 'AM' | 'PM' }))}
                      >
                        <option value="AM">오전</option>
                        <option value="PM">오후</option>
                      </select>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[#999]" style={{ fontSize: '13px', marginBottom: '6px' }}>시</span>
                      <select
                        className="border border-[#e0e0e0] bg-white cursor-pointer focus:outline-none focus:border-[#5F6F52]"
                        style={{ paddingTop: '8px', paddingBottom: '8px', paddingLeft: '12px', paddingRight: '12px', borderRadius: '8px', fontSize: '15px' }}
                        value={tempDiaryTime.hour}
                        onChange={(e) => setTempDiaryTime(prev => ({ ...prev, hour: e.target.value }))}
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                          <option key={hour} value={hour.toString().padStart(2, '0')}>
                            {hour.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[#999]" style={{ fontSize: '13px', marginBottom: '6px' }}>분</span>
                      <select
                        className="border border-[#e0e0e0] bg-white cursor-pointer focus:outline-none focus:border-[#5F6F52]"
                        style={{ paddingTop: '8px', paddingBottom: '8px', paddingLeft: '12px', paddingRight: '12px', borderRadius: '8px', fontSize: '15px' }}
                        value={tempDiaryTime.minute}
                        onChange={(e) => setTempDiaryTime(prev => ({ ...prev, minute: e.target.value }))}
                      >
                        {['00', '15', '30', '45'].map(minute => (
                          <option key={minute} value={minute}>
                            {minute}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex" style={{ gap: '8px', marginTop: '16px' }}>
                    <button
                      className="flex-1 bg-white text-[#666] font-semibold cursor-pointer transition-all active:scale-93"
                      style={{ paddingTop: '12px', paddingBottom: '12px', border: '2px solid #e0e0e0', borderRadius: '12px', fontSize: '14px' }}
                      onClick={handleCancelDiaryTime}
                    >
                      취소
                    </button>
                    <button
                      className="flex-1 text-[white] font-semibold cursor-pointer transition-all active:scale-93"
                      style={{ paddingTop: '12px', paddingBottom: '12px', backgroundColor: '#a3b899', border: 'none', borderRadius: '12px', fontSize: '14px' }}
                      onClick={handleSaveDiaryTime}
                    >
                      저장
                    </button>
                  </div>
                </div>
                </motion.div>
              )}
              </AnimatePresence>

              {/* AI 대화 스타일 */}
              <div className="flex justify-between items-center" style={{ paddingTop: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <span className="text-[#333]" style={{ fontSize: '15px' }}>AI 대화 스타일 (반말)</span>
                <div
                  onClick={() => handleToggleAiStyle(aiStyle === 'casual' ? 'formal' : 'casual')}
                  className={`relative w-[51px] h-[31px] rounded-full cursor-pointer transition-all duration-300 flex-shrink-0 ${
                    aiStyle === 'casual' ? "bg-[#a3b899]" : "bg-[#D1D5DB]"
                  }`}
                  style={{
                    boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  <div
                    className={`absolute top-[3px] w-[25px] h-[25px] bg-[#FFFFFF] rounded-full transition-all duration-300 ${
                      aiStyle === 'casual' ? "left-[23px]" : "left-[3px]"
                    }`}
                    style={{
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
                    }}
                  />
                </div>
              </div>

              {/* 다크모드 */}
              <div className="flex justify-between items-center" style={{ paddingTop: '16px', paddingBottom: '16px' }}>
                <span className="text-[#333]" style={{ fontSize: '15px' }}>다크모드</span>
                <div
                  onClick={handleToggleDarkMode}
                  className={`relative w-[51px] h-[31px] rounded-full cursor-pointer transition-all duration-300 flex-shrink-0 ${
                    isDarkMode ? "bg-[#a3b899]" : "bg-[#D1D5DB]"
                  }`}
                  style={{
                    boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  <div
                    className={`absolute top-[3px] w-[25px] h-[25px] bg-[#FFFFFF] rounded-full transition-all duration-300 ${
                      isDarkMode ? "left-[23px]" : "left-[3px]"
                    }`}
                    style={{
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
                    }}
                  />
                </div>
              </div>
            </div>
        </div>

        {/* 알람 설정 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 className="text-[#999] font-semibold text-center" style={{ fontSize: '12px', margin: '0 0 8px 0', paddingLeft: '16px', paddingRight: '16px' }}>알람 설정</h3>
          <div className="bg-[white]" style={{ borderRadius: '16px', paddingTop: '8px', paddingBottom: '8px', paddingLeft: '16px', paddingRight: '16px', marginBottom: '8px' }}>
              {/* 일기 생성 알림 */}
              <div className="flex justify-between items-center" style={{ paddingTop: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <span className="text-[#333]" style={{ fontSize: '15px' }}>일기 생성 알림</span>
                <div
                  onClick={() => toggleNotification('diaryCreation')}
                  className={`relative w-[51px] h-[31px] rounded-full cursor-pointer transition-all duration-300 flex-shrink-0 ${
                    notifications.diaryCreation ? "bg-[#a3b899]" : "bg-[#D1D5DB]"
                  }`}
                  style={{
                    boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  <div
                    className={`absolute top-[3px] w-[25px] h-[25px] bg-[#FFFFFF] rounded-full transition-all duration-300 ${
                      notifications.diaryCreation ? "left-[23px]" : "left-[3px]"
                    }`}
                    style={{
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
                    }}
                  />
                </div>
              </div>

              {/* 응원 메시지 알림 */}
              <div className="flex justify-between items-center" style={{ paddingTop: '16px', paddingBottom: '16px' }}>
                <span className="text-[#333]" style={{ fontSize: '15px' }}>응원 메시지 알림</span>
                <div
                  onClick={() => toggleNotification('encouragement')}
                  className={`relative w-[51px] h-[31px] rounded-full cursor-pointer transition-all duration-300 flex-shrink-0 ${
                    notifications.encouragement ? "bg-[#a3b899]" : "bg-[#D1D5DB]"
                  }`}
                  style={{
                    boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  <div
                    className={`absolute top-[3px] w-[25px] h-[25px] bg-[#FFFFFF] rounded-full transition-all duration-300 ${
                      notifications.encouragement ? "left-[23px]" : "left-[3px]"
                    }`}
                    style={{
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
                    }}
                  />
                </div>
              </div>
            </div>
        </div>

        {/* 기타 */}
        <div style={{ marginBottom: '8px' }}>
          <h3 className="text-[#999] font-semibold text-center" style={{ fontSize: '12px', margin: '0 0 8px 0', paddingLeft: '16px', paddingRight: '16px' }}>기타</h3>
          <div className="bg-[white]" style={{ borderRadius: '16px', paddingTop: '8px', paddingBottom: '8px', paddingLeft: '16px', paddingRight: '16px', marginBottom: '0px' }}>
            {/* 서비스 이용약관 */}
            <div className="flex justify-between items-center cursor-pointer transition-all active:scale-98" style={{ paddingTop: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }} onClick={() => console.log('서비스 이용약관')}>
              <span className="text-[#333]" style={{ fontSize: '15px' }}>서비스 이용약관</span>
              <span className="text-[#999]" style={{ fontSize: '18px' }}>›</span>
            </div>

            {/* 개인정보 처리방침 */}
            <div className="flex justify-between items-center cursor-pointer transition-all active:scale-98" style={{ paddingTop: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }} onClick={() => console.log('개인정보 처리방침')}>
              <span className="text-[#333]" style={{ fontSize: '15px' }}>개인정보 처리방침</span>
              <span className="text-[#999]" style={{ fontSize: '18px' }}>›</span>
            </div>

            {/* 문의하기 */}
            <div className="flex justify-between items-center cursor-pointer transition-all active:scale-98" style={{ paddingTop: '16px', paddingBottom: '16px' }} onClick={() => console.log('문의하기')}>
              <span className="text-[#333]" style={{ fontSize: '15px' }}>문의하기</span>
              <span className="text-[#999]" style={{ fontSize: '18px' }}>›</span>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>

    {/* 저장 모달 */}
    {showSaveModal && (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            width: '280px',
            borderRadius: '16px',
            paddingTop: '32px',
            paddingBottom: '24px',
            paddingLeft: '24px',
            paddingRight: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            backgroundColor: 'var(--color-bg-card)'
          }}
        >
          {!saveSuccess ? (
            <>
              {/* 로딩 상태 */}
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  border: '4px solid var(--color-border)',
                  borderTopColor: '#a3b899',
                  borderRadius: '50%',
                  animation: 'spinner-rotate 0.8s linear infinite',
                  marginBottom: '24px'
                }}
              />
              <h3 className="font-semibold text-center" style={{ fontSize: '16px', margin: '0 0 8px 0', color: 'var(--color-text-primary)' }}>
                사용자 정보 수정중
              </h3>
              <p className="text-center" style={{ fontSize: '13px', margin: '0 0 16px 0', color: 'var(--color-text-secondary)' }}>
                사용자 정보를 저장하고 있어요
              </p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a3b899', animation: 'dots-blink 1.4s infinite', animationDelay: '0s' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a3b899', animation: 'dots-blink 1.4s infinite', animationDelay: '0.2s' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a3b899', animation: 'dots-blink 1.4s infinite', animationDelay: '0.4s' }} />
              </div>
            </>
          ) : (
            <>
              {/* 완료 상태 */}
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#a3b899',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px'
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-semibold text-center" style={{ fontSize: '16px', margin: '0 0 8px 0', color: 'var(--color-text-primary)' }}>
                완료
              </h3>
              <p className="text-center" style={{ fontSize: '13px', margin: '0 0 24px 0', color: 'var(--color-text-secondary)' }}>
                사용자 정보가 성공적으로 수정되었어요
              </p>
              <button
                className="w-full text-white font-semibold cursor-pointer transition-all active:scale-93"
                style={{
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  backgroundColor: '#a3b899',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px'
                }}
                onClick={handleCloseModal}
              >
                확인
              </button>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
}

export default SettingsPage;
