/**
 * 회원 탈퇴 확인 모달
 */

import { CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WithdrawModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const WithdrawModal = ({ visible, onConfirm, onCancel, isLoading }: WithdrawModalProps) => {
  const overlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  };

  const modalStyle: CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '320px',
    width: '90%',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  };

  const titleStyle: CSSProperties = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px',
    textAlign: 'center',
  };

  const messageStyle: CSSProperties = {
    fontSize: '14px',
    color: '#666',
    marginBottom: '24px',
    textAlign: 'center',
    lineHeight: '1.5',
  };

  const buttonContainerStyle: CSSProperties = {
    display: 'flex',
    gap: '8px',
  };

  const cancelButtonStyle: CSSProperties = {
    flex: 1,
    padding: '12px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.5 : 1,
    transition: 'all 0.2s',
  };

  const confirmButtonStyle: CSSProperties = {
    flex: 1,
    padding: '12px',
    backgroundColor: '#FF3B30',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.7 : 1,
    transition: 'all 0.2s',
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={overlayStyle}
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={titleStyle}>정말 탈퇴하시겠어요?</h3>
            <p style={messageStyle}>
              모든 일기와 대화 기록이 삭제되며,
              <br />
              복구할 수 없습니다.
            </p>
            <div style={buttonContainerStyle}>
              <button
                onClick={onCancel}
                disabled={isLoading}
                style={cancelButtonStyle}
                className="active:scale-95"
              >
                취소
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                style={confirmButtonStyle}
                className="active:scale-95"
              >
                {isLoading ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WithdrawModal;
