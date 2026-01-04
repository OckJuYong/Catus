import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function GeneralSignupPage() {
  const { customSignUp } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username || !password) {
      setErrorMsg('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    if (username.length < 4) {
      setErrorMsg('아이디는 최소 4자 이상이어야 합니다.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await customSignUp(username, password, nickname || username);
      if (error) {
        setErrorMsg(error);
      } else {
        // 회원가입 성공 시 온보딩으로 이동
        navigate('/onboarding');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative" style={{ backgroundColor: 'var(--color-main-bg)' }}>
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => navigate('/')}
        className="p-2 rounded-full hover:bg-black/5 transition-colors"
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          color: 'var(--color-text-primary)'
        }}
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#59B464] mb-2">회원가입</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          새 계정을 만들어보세요
        </p>
      </div>

      {/* 회원가입 폼 */}
      <form onSubmit={handleSubmit} className="w-[250px] sm:w-[350px] space-y-3 sm:space-y-4">
        <div>
          <input
            type="text"
            placeholder="닉네임 (선택)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-4 py-[14px] rounded-[8px] border text-[14px] outline-none transition-all focus:border-[#59B464]"
            style={{
              backgroundColor: 'var(--color-main-bg)',
              borderColor: 'var(--color-text-secondary)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="아이디 (4자 이상)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-[14px] rounded-[8px] border text-[14px] outline-none transition-all focus:border-[#59B464]"
            style={{
              backgroundColor: 'var(--color-main-bg)',
              borderColor: 'var(--color-text-secondary)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        <div>
          <input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-[14px] rounded-[8px] border text-[14px] outline-none transition-all focus:border-[#59B464]"
            style={{
              backgroundColor: 'var(--color-main-bg)',
              borderColor: 'var(--color-text-secondary)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        <div>
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-[14px] rounded-[8px] border text-[14px] outline-none transition-all focus:border-[#59B464]"
            style={{
              backgroundColor: 'var(--color-main-bg)',
              borderColor: 'var(--color-text-secondary)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* 에러 메시지 */}
        {errorMsg && (
          <p className="text-red-500 text-[12px] text-center">{errorMsg}</p>
        )}

        {/* 회원가입 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-[17px] bg-[#59B464] hover:bg-[#4a9d54] rounded-[8px] text-white text-[17px] sm:text-sm font-[600] transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>가입 중...</span>
            </div>
          ) : (
            '회원가입'
          )}
        </button>
      </form>

      {/* 로그인 링크 */}
      <div className="mt-6 text-center">
        <span className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
          이미 계정이 있으신가요?{' '}
        </span>
        <Link to="/auth/login" className="text-[12px] text-[#59B464] font-medium hover:underline">
          로그인
        </Link>
      </div>
    </div>
  );
}
