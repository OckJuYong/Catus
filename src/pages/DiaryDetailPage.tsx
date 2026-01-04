import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { ROUTES } from '../constants/routes';
import { diaryApi, messageApi } from '../utils/api';
import { useDarkMode } from '../contexts/DarkModeContext';
import type { DiaryDetailResponse, Emotion } from '../types';

export default function DiaryDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const diaryId = id ? parseInt(id, 10) : null;
  const queryClient = useQueryClient();
  const { isDarkMode } = useDarkMode();

  const [isPrivate, setIsPrivate] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showCommentSheet, setShowCommentSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [showBig5Sheet, setShowBig5Sheet] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);

  // Fetch diary data (백엔드: GET /api/diary/{id})
  const { data: diaryData, isLoading, error } = useQuery({
    queryKey: ['diary', 'detail', diaryId],
    queryFn: async () => {
      if (!diaryId) throw new Error('일기 ID가 필요합니다.');
      return await diaryApi.getById(diaryId);
    },
    enabled: !!diaryId && !isNaN(diaryId),
    retry: 2,
  });

  // API 응답에서 diary 객체 추출 (응답 구조: { diary: {...}, anonymousMessages: [] })
  const diary: DiaryDetailResponse | undefined = (diaryData as any)?.diary || diaryData;

  // 받은 메시지 조회 (백엔드: GET /api/message/received)
  const { data: messagesData } = useQuery({
    queryKey: ['messages', 'received', diaryId],
    queryFn: async () => {
      return await messageApi.getReceived(0, 50);
    },
    enabled: !!diaryId,
  });

  // 이 일기에 대한 응원 메시지 필터링
  const encouragementMessages = messagesData?.messages?.filter(
    (msg) => msg.diaryId === diaryId
  ) || [];

  // 일기 데이터 로드 시 초기화
  useEffect(() => {
    if (diary) {
      setEditedContent(diary.content || '');
      // isPublic의 반대값으로 isPrivate 설정 (공개=false일 때 비공개=true)
      setIsPrivate(!diary.isPublic);
    }
  }, [diary]);

  // 일기 수정 Mutation (백엔드: PUT /api/diary/{id})
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!diaryId) throw new Error('일기 ID가 필요합니다.');
      return await diaryApi.update(diaryId, {
        content: editedContent,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary', 'detail', diaryId] });
      queryClient.invalidateQueries({ queryKey: ['diary', 'list'] });
      setShowEditSheet(false);
      setToastMessage('일기가 수정되었습니다');
      setTimeout(() => setToastMessage(''), 3000);
    },
    onError: (error: any) => {
      console.error('일기 수정 실패:', error);
      setToastMessage('일기 수정에 실패했습니다');
      setTimeout(() => setToastMessage(''), 3000);
    },
  });

  // 일기 삭제 Mutation (백엔드: DELETE /api/diary/{id})
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!diaryId) throw new Error('일기 ID가 필요합니다.');
      return await diaryApi.delete(diaryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary', 'list'] });
      setShowDeleteModal(false);
      navigate(ROUTES.CALENDAR);
    },
    onError: (error: any) => {
      console.error('일기 삭제 실패:', error);
      setToastMessage('일기 삭제에 실패했습니다');
      setTimeout(() => setToastMessage(''), 3000);
    },
  });

  // 공개/비공개 토글 Mutation (백엔드: PUT /api/diary/{id})
  const privacyMutation = useMutation({
    mutationFn: async (newIsPublic: boolean) => {
      if (!diaryId) throw new Error('일기 ID가 필요합니다.');
      return await diaryApi.update(diaryId, { isPublic: newIsPublic });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diary', 'detail', diaryId] });
      queryClient.invalidateQueries({ queryKey: ['diary', 'list'] });
    },
    onError: (error: any) => {
      console.error('공개 설정 변경 실패:', error);
      // 실패 시 상태 롤백
      setIsPrivate(!isPrivate);
      setToastMessage('공개 설정 변경에 실패했습니다');
      setTimeout(() => setToastMessage(''), 3000);
    },
  });

  const formatDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-');
    return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
  };

  const handlePrivateToggle = (): void => {
    if (privacyMutation.isPending) return; // 중복 요청 방지

    const newPrivateState = !isPrivate;
    const newIsPublic = !newPrivateState; // isPrivate의 반대가 isPublic

    // 낙관적 업데이트 (UI 즉시 반영)
    setIsPrivate(newPrivateState);

    setToastMessage(
      newPrivateState
        ? '일기를 나만 볼 수 있게 수정했어요'
        : '일기가 모두에게 공유되었어요'
    );

    setTimeout(() => setToastMessage(''), 3000);

    // 백엔드에 저장
    privacyMutation.mutate(newIsPublic);
  };

  const handleDeleteClick = (): void => {
    setShowEditModal(false);
    setTimeout(() => {
      setShowDeleteModal(true);
    }, 250);
  };

  const handleDeleteConfirm = (): void => {
    deleteMutation.mutate();
  };

  const handleEditDiary = (): void => {
    setEditedContent(diary?.content || '');
    setShowEditModal(false);
    setTimeout(() => {
      setShowEditSheet(true);
    }, 250);
  };

  const handleSaveEdit = (): void => {
    updateMutation.mutate();
  };

  const getEmotionColor = (emotion?: string): string => {
    const colors: Record<string, string> = {
      행복: '#8EC7A9',
      슬픔: '#AFCBFF',
      불안: '#FDE68A',
      화남: '#FCA5A5',
      보통: '#D4D4D4',
    };
    return colors[emotion || '보통'] || '#AFCBFF';
  };

  // 공유 시트 열기
  const handleShareClick = () => {
    setShowShareSheet(true);
  };

  // 클립보드 복사
  const handleCopyToClipboard = async () => {
    if (!diary) return;

    const shareText = `${(diary.diaryDate || diary.date) ? formatDate(diary.diaryDate || diary.date) : '오늘'}의 일기\n\n${diary.content || ''}`;

    try {
      await navigator.clipboard.writeText(shareText);
      setToastMessage('클립보드에 복사되었습니다');
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      setToastMessage('복사에 실패했습니다');
    }

    setShowShareSheet(false);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // 앱으로 공유
  const handleShareToApp = async () => {
    if (!diary) return;

    const shareTitle = `${(diary.diaryDate || diary.date) ? formatDate(diary.diaryDate || diary.date) : '오늘'}의 일기`;
    const imageUrl = diary.image || diary.imageUrl;

    setShowShareSheet(false);

    // 네이티브 앱인 경우 Capacitor Share 사용
    if (Capacitor.isNativePlatform()) {
      try {
        let filePath: string | undefined;

        // 이미지가 있으면 캐시에 저장 후 파일로 공유
        if (imageUrl) {
          try {
            let base64Data: string;

            // 이미지가 base64 data URL인 경우
            if (imageUrl.startsWith('data:')) {
              // data:image/png;base64,xxxxx 에서 base64 부분만 추출
              base64Data = imageUrl.split(',')[1];
            } else {
              // 원격 URL인 경우 fetch
              const response = await fetch(imageUrl);
              const blob = await response.blob();
              base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const result = reader.result as string;
                  resolve(result.split(',')[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            }

            // 캐시 디렉토리에 파일 저장
            const fileName = `diary_share_${Date.now()}.png`;
            await Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: Directory.Cache,
            });

            // 파일 URI 가져오기
            const uriResult = await Filesystem.getUri({
              path: fileName,
              directory: Directory.Cache,
            });
            filePath = uriResult.uri;
          } catch (imgErr) {
            console.error('이미지 저장 실패:', imgErr);
          }
        }

        // 공유 실행 - files 파라미터 사용
        if (filePath) {
          await Share.share({
            title: shareTitle,
            files: [filePath],
            dialogTitle: '일기 공유하기',
          });
        } else {
          await Share.share({
            title: shareTitle,
            text: diary.content || '',
            dialogTitle: '일기 공유하기',
          });
        }

        setToastMessage('공유되었습니다');
      } catch (err: any) {
        if (err.message?.includes('cancel') || err.message?.includes('dismissed')) {
          return;
        }
        console.error('네이티브 공유 실패:', err);
        setToastMessage('공유에 실패했습니다');
      }
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    // 웹 브라우저: Web Share API 사용
    if (navigator.share) {
      try {
        const shareData: ShareData = {
          title: shareTitle,
          text: diary.content || '',
        };

        // 이미지가 있으면 파일로 공유 시도
        if (imageUrl) {
          try {
            let blob: Blob;

            // base64 data URL인 경우
            if (imageUrl.startsWith('data:')) {
              // data URL을 blob으로 변환
              const base64Data = imageUrl.split(',')[1];
              const mimeType = imageUrl.split(';')[0].split(':')[1] || 'image/png';
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              blob = new Blob([byteArray], { type: mimeType });
            } else {
              // 원격 URL인 경우 fetch
              const response = await fetch(imageUrl);
              blob = await response.blob();
            }

            const file = new File([blob], 'diary-image.png', { type: blob.type });
            console.log('이미지 파일 생성됨:', file.size, file.type);

            const canShareFiles = navigator.canShare && navigator.canShare({ files: [file] });
            console.log('canShare files:', canShareFiles);

            if (canShareFiles) {
              shareData.files = [file];
              // 파일 공유 시 text 제거 (일부 브라우저에서 충돌)
              delete shareData.text;
            } else {
              console.log('파일 공유 미지원, 텍스트만 공유');
            }
          } catch (imgErr) {
            console.error('이미지 공유 실패, 텍스트만 공유:', imgErr);
          }
        }

        console.log('공유 데이터:', shareData);
        await navigator.share(shareData);
        setToastMessage('공유되었습니다');
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        console.error('공유 실패:', err);
        setToastMessage('공유에 실패했습니다');
      }
    } else {
      setToastMessage('이 브라우저에서는 앱 공유를 지원하지 않습니다');
    }

    setTimeout(() => setToastMessage(''), 3000);
  };

  // Big5 점수를 퍼센트로 변환 (0-100 기준)
  const getBig5Percent = (score: number): number => {
    return Math.min(100, Math.max(0, score));
  };

  // Big5 레이블
  const big5Labels: Record<string, string> = {
    openness: '개방성',
    conscientiousness: '성실성',
    extraversion: '외향성',
    agreeableness: '친화성',
    neuroticism: '신경성',
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{
          color: 'var(--color-text-secondary)',
          backgroundColor: 'var(--color-main-bg)',
        }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E7057] mb-4"></div>
        <p>일기를 불러오는 중...</p>
      </div>
    );
  }

  // Error state
  if (error || !diary) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{
          color: 'var(--color-text-secondary)',
          backgroundColor: 'var(--color-main-bg)',
        }}
      >
        <div className="text-5xl mb-4">📭</div>
        <p>이 날짜에는 기록된 일기가 없어요.</p>
        <button
          onClick={() => navigate(ROUTES.CALENDAR)}
          className="mt-4 px-6 py-3 bg-[#5E7057] text-white rounded-lg"
        >
          캘린더로 돌아가기
        </button>
      </div>
    );
  }

  const commentCount = encouragementMessages.length;

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ backgroundColor: 'var(--color-main-bg)' }}
    >
      {/* 토스트 메시지 */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#5E705790] bg-opacity-90 text-[#FFFFFF] text-[14px] px-[20px] py-[12px] rounded-[12px] shadow-lg"
            style={{ minWidth: '250px', textAlign: 'center' }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-[12px] py-[12px]"
        style={{ backgroundColor: 'var(--color-bg-card)' }}
      >
        <button
          onClick={() => navigate(ROUTES.CALENDAR)}
          className="hover:opacity-70 text-[20px] bg-transparent border-0"
          style={{ marginTop: '-5px', color: isDarkMode ? '#FFFFFF' : '#5E7057' }}
        >
          ←
        </button>

        <div
          className="text-[16px] font-[600]"
          style={{ color: isDarkMode ? '#FFFFFF' : '#5E7057' }}
        >
          {(diary.diaryDate || diary.date) && formatDate(diary.diaryDate || diary.date)}
        </div>

        <button
          onClick={() => setShowEditModal(true)}
          className="hover:opacity-70 text-[20px] bg-transparent border-0"
          style={{ marginTop: '-4px', color: isDarkMode ? '#FFFFFF' : '#5E7057' }}
        >
          ⋯
        </button>
      </div>

      {/* 일기 이미지 */}
      {(diary.image || diary.imageUrl) && (
        <img
          src={diary.image || diary.imageUrl}
          alt="일기 이미지"
          className="w-full aspect-square object-cover mx-auto block max-h-[400px] max-w-[400px]"
        />
      )}

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto px-[20px] py-[10px]">
        {/* 하트 + 댓글 버튼 + 토글 */}
        <div className="flex items-center justify-between mb-[20px]">
          {/* 왼쪽: 하트 + 댓글 버튼 + 공유 버튼 */}
          <div className="flex items-center gap-[12px]">
            <svg width="27" height="27" viewBox="0 0 24 24" fill={getEmotionColor((diary as any).emotion)} stroke={getEmotionColor((diary as any).emotion)} strokeWidth="1.5">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>

            <button
              onClick={() => setShowCommentSheet(true)}
              className="flex items-center gap-[6px] bg-transparent border-0 hover:opacity-80"
            >
              <svg width="25" height="25" viewBox="0 0 24 24" fill="#FFFFFF" stroke={isDarkMode ? '#FFFFFF' : '#000000'} strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-[14px] font-[600]" style={{ color: 'var(--color-text-primary)' }}>{commentCount}</span>
            </button>

            {/* 공유 버튼 */}
            <button
              onClick={handleShareClick}
              className="bg-transparent border-0 hover:opacity-70 cursor-pointer"
              style={{ marginTop: '5px', marginLeft: '-9px' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#FFFFFF' : '#000000'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>

          {/* 오른쪽: 토글 */}
          <div
            onClick={handlePrivateToggle}
            className={`relative w-[51px] h-[31px] rounded-full cursor-pointer transition-all ${
              isPrivate ? 'bg-[#5E7057]' : 'bg-[#D1D5DB]'
            }`}
          >
            <div
              className={`absolute top-[3px] w-[25px] h-[25px] bg-[#FFFFFF] rounded-full transition-all ${
                isPrivate ? 'left-[23px]' : 'left-[3px]'
              }`}
            />
          </div>
        </div>

        {/* AI 요약 (content) */}
        <div className="mb-[20px]">
          <div
            className="text-[13px] font-[500] leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {diary.content ||
              '오늘은 평범한 하루였어요. 특별한 일은 없었지만 그 자체로 충분히 괜찮았어요.'}
          </div>
        </div>

        {/* Big5 성격 분석 섹션 */}
        {diary.big5Scores && (
          <div
            className="rounded-[16px] p-[16px] mb-[20px]"
            style={{ backgroundColor: 'var(--color-bg-card)' }}
          >
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowBig5Sheet(true)}
            >
              <div className="flex items-center gap-[8px]">
                <span className="text-[18px]">🧠</span>
                <span className="text-[14px] font-[600]" style={{ color: 'var(--color-text-primary)' }}>
                  오늘의 성격 분석
                </span>
              </div>
              <span className="text-[#999]" style={{ fontSize: '18px' }}>›</span>
            </div>

            {/* Big5 미니 프리뷰 */}
            <div className="mt-[12px] flex gap-[8px]">
              {Object.entries(diary.big5Scores).map(([key, value]) => (
                <div key={key} className="flex-1 text-center">
                  <div
                    className="h-[4px] rounded-full mb-[4px]"
                    style={{
                      backgroundColor: '#e0e0e0',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${getBig5Percent(value)}%`,
                        backgroundColor: '#5E7057',
                      }}
                    />
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                    {big5Labels[key]?.substring(0, 2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 댓글 Bottom Sheet */}
      <AnimatePresence>
        {showCommentSheet && (
          <div
            onClick={() => setShowCommentSheet(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'flex-end',
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full rounded-t-[24px] max-h-[60vh] flex flex-col overflow-hidden"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                zIndex: 10001,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 고정 헤더 영역 */}
              <div className="flex-shrink-0 pt-[24px] pb-[16px] flex flex-col items-center">
                {/* 핸들바 */}
                <div
                  className="w-[40px] h-[4px] rounded-full mb-[12px]"
                  style={{ backgroundColor: '#D1D5DB' }}
                />

                {/* 제목 */}
                <h2
                  className="text-[18px] font-[600] mb-[16px] text-center"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  날아온 응원 메세지
                </h2>

                {/* 구분선 */}
                <div
                  className="border-t w-full"
                  style={{ borderColor: 'var(--color-border)' }}
                ></div>
              </div>

              {/* 스크롤 가능한 메시지 영역 */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-[20px] pb-[32px]">
                <div className="w-full max-w-[300px] mx-auto pt-[0px]">
                  {encouragementMessages.length > 0 ? (
                    <div className="flex flex-col gap-[16px]">
                      {encouragementMessages.map((message, index) => (
                        <div key={message.id} className="flex flex-col gap-[4px]">
                          <div className="text-[14px] font-[600]" style={{ color: 'var(--color-text-primary)' }}>
                            익명 {index + 1}
                          </div>
                          <div
                            className="text-[13px] font-[400] leading-relaxed"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            {message.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="text-center py-[40px]"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      아직 응원 메시지가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Big5 상세 Bottom Sheet */}
      <AnimatePresence>
        {showBig5Sheet && diary.big5Scores && (
          <div
            onClick={() => setShowBig5Sheet(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'flex-end',
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full rounded-t-[24px] max-h-[70vh] flex flex-col overflow-hidden"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                zIndex: 10001,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="flex-shrink-0 pt-[24px] pb-[16px] flex flex-col items-center">
                <div
                  className="w-[40px] h-[4px] rounded-full mb-[12px]"
                  style={{ backgroundColor: '#D1D5DB' }}
                />
                <h2
                  className="text-[18px] font-[600] mb-[8px] text-center"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  🧠 오늘의 Big5 성격 분석
                </h2>
                <p
                  className="text-[13px] text-center px-[20px]"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  일기 내용을 바탕으로 분석한 오늘의 성격 특성이에요
                </p>
                <div
                  className="border-t w-full mt-[16px]"
                  style={{ borderColor: 'var(--color-border)' }}
                ></div>
              </div>

              {/* Big5 상세 내용 */}
              <div className="flex-1 overflow-y-auto px-[20px] pb-[32px]">
                <div className="flex flex-col gap-[20px]">
                  {Object.entries(diary.big5Scores).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-[8px]">
                        <span className="text-[14px] font-[600]" style={{ color: 'var(--color-text-primary)' }}>
                          {big5Labels[key]}
                        </span>
                        <span className="text-[14px] font-[600]" style={{ color: '#5E7057' }}>
                          {value}점
                        </span>
                      </div>
                      <div
                        className="h-[8px] rounded-full"
                        style={{ backgroundColor: '#e0e0e0' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${getBig5Percent(value)}%`,
                            backgroundColor: '#5E7057',
                          }}
                        />
                      </div>
                      <p
                        className="text-[12px] mt-[6px]"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {getBig5Description(key, value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 공유 Bottom Sheet */}
      <AnimatePresence>
        {showShareSheet && (
          <div
            onClick={() => setShowShareSheet(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'flex-end',
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full rounded-t-[24px] overflow-hidden"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                zIndex: 10001,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 핸들바 */}
              <div className="pt-[16px] pb-[8px] flex justify-center">
                <div
                  className="w-[40px] h-[4px] rounded-full"
                  style={{ backgroundColor: '#D1D5DB' }}
                />
              </div>

              {/* 제목 */}
              <h2
                className="text-[18px] font-[600] text-center mb-[20px]"
                style={{ color: 'var(--color-text-primary)' }}
              >
                공유하기
              </h2>

              {/* 공유 옵션 */}
              <div className="px-[20px] pb-[32px] flex flex-col gap-[12px]">
                {/* 클립보드 복사 */}
                <button
                  onClick={handleCopyToClipboard}
                  className="w-full py-[16px] rounded-[12px] flex items-center justify-center gap-[12px] border-0 hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: 'rgba(128, 128, 128, 0.1)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span className="text-[15px] font-[500]">클립보드에 복사</span>
                </button>

                {/* 앱으로 공유 */}
                <button
                  onClick={handleShareToApp}
                  className="w-full py-[16px] rounded-[12px] flex items-center justify-center gap-[12px] border-0 hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: '#5E7057',
                    color: '#FFFFFF',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  <span className="text-[15px] font-[500]">다른 앱으로 공유</span>
                </button>

                {/* 취소 */}
                <button
                  onClick={() => setShowShareSheet(false)}
                  className="w-full py-[14px] rounded-[12px] border-0 hover:opacity-90 transition-opacity mt-[4px]"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <span className="text-[14px]">취소</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 공통 배경 오버레이 */}
      {(showEditModal || showDeleteModal || showEditSheet) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 10000,
          }}
          onClick={() => {
            if (showEditModal) setShowEditModal(false);
            if (showDeleteModal) setShowDeleteModal(false);
            if (showEditSheet) setShowEditSheet(false);
          }}
        />
      )}

      {/* 일기 관리 모달 */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[20px] p-[24px] w-[85%] max-w-[320px]"
            style={{ backgroundColor: 'var(--color-bg-card)', zIndex: 10001 }}
          >
            <h2 className="text-[18px] font-semibold mb-[20px] text-center" style={{ color: 'var(--color-text-primary)' }}>
              일기 관리
            </h2>
            <div className="flex flex-col gap-[12px]">
              <button
                onClick={handleEditDiary}
                className="w-full py-[14px] bg-[#5E7057] text-[#FFFFFF] rounded-[12px] text-[15px] font-medium hover:opacity-90 transition-opacity border-0"
              >
                일기 수정하기
              </button>
              <button
                onClick={handleDeleteClick}
                className="w-full py-[14px] rounded-[12px] text-[15px] font-medium hover:bg-red-50 transition-colors border border-[#5E7057]"
                style={{ backgroundColor: 'var(--color-bg-card)', color: isDarkMode ? 'white' : 'var(--color-text-primary)' }}
              >
                일기 삭제하기
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-full py-[14px] rounded-[12px] text-[15px] font-medium transition-colors border-0"
                style={{ backgroundColor: 'rgba(128, 128, 128, 0.2)', color: 'var(--color-text-primary)' }}
              >
                취소
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 삭제 확인 모달 */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[20px] p-[24px] w-[85%] max-w-[320px]"
            style={{ backgroundColor: 'var(--color-bg-card)', zIndex: 10001 }}
          >
            <div className="text-[40px] text-center mb-[16px]">⚠️</div>
            <h2 className="text-[18px] font-semibold mb-[12px] text-center" style={{ color: 'var(--color-text-primary)' }}>
              일기를 삭제할까요?
            </h2>
            <p className="text-[14px] mb-[24px] text-center leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              삭제한 일기는 복구할 수 없어요.<br />
              정말 삭제하시겠어요?
            </p>
            <div className="flex gap-[12px]">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-[14px] rounded-[12px] text-[15px] font-medium transition-colors border-0"
                style={{ backgroundColor: 'rgba(128, 128, 128, 0.2)', color: 'var(--color-text-primary)' }}
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="flex-1 py-[14px] bg-[black] text-[white] rounded-[12px] text-[15px] font-medium hover:bg-red-50 transition-colors border border-red-500 disabled:opacity-50"
              >
                {deleteMutation.isPending ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 일기 수정 Bottom Sheet */}
      <AnimatePresence>
        {showEditSheet && (
          <div
            onClick={() => setShowEditSheet(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              pointerEvents: 'auto',
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full rounded-t-[24px] p-[24px] pb-[32px] max-h-[80vh] overflow-y-auto relative"
              style={{ backgroundColor: 'var(--color-bg-card)', zIndex: 10001 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-[16px] font-semibold mb-[24px] text-center" style={{ color: 'var(--color-text-primary)' }}>
                일기 수정하기
              </h2>

              {/* 일기 내용 */}
              <div className="mb-[24px]">
                <label className="text-[14px] mb-[12px] block" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  일기 내용
                </label>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  placeholder="오늘의 이야기를 기록해 보세요."
                  className="w-full rounded-[12px] text-[13px] min-h-[120px] resize-none"
                  style={{
                    outline: 'none',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    paddingTop: '14px',
                    paddingBottom: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(128, 128, 128, 0.1)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                  }}
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-[12px]">
                <button
                  onClick={() => setShowEditSheet(false)}
                  className="flex-1 py-[14px] rounded-[12px] text-[15px] font-medium"
                  style={{
                    backgroundColor: 'rgba(128, 128, 128, 0.2)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                  className="flex-1 py-[14px] rounded-[12px] text-[15px] font-medium border-0 disabled:opacity-50"
                  style={{ backgroundColor: '#5E7057', color: '#FFFFFF' }}
                >
                  {updateMutation.isPending ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Big5 점수에 따른 설명 생성
function getBig5Description(trait: string, score: number): string {
  const descriptions: Record<string, Record<string, string>> = {
    openness: {
      high: '새로운 경험과 아이디어에 열려있는 하루였어요.',
      medium: '익숙한 것과 새로운 것 사이에서 균형을 찾았어요.',
      low: '안정적이고 익숙한 것을 선호하는 하루였어요.',
    },
    conscientiousness: {
      high: '계획적이고 체계적으로 하루를 보냈어요.',
      medium: '적당히 유연하게 일정을 관리했어요.',
      low: '자유롭고 즉흥적인 하루를 보냈어요.',
    },
    extraversion: {
      high: '사람들과 어울리며 에너지를 얻었어요.',
      medium: '혼자만의 시간과 사교 시간의 균형을 맞췄어요.',
      low: '조용히 혼자만의 시간을 즐겼어요.',
    },
    agreeableness: {
      high: '다른 사람들과 조화롭게 지냈어요.',
      medium: '자신의 의견도 표현하며 협력했어요.',
      low: '독립적으로 자신의 길을 갔어요.',
    },
    neuroticism: {
      high: '감정의 기복이 있는 하루였어요.',
      medium: '대체로 안정적인 감정 상태였어요.',
      low: '차분하고 평온한 하루를 보냈어요.',
    },
  };

  const level = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  return descriptions[trait]?.[level] || '';
}
