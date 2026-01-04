import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function GeneralLoginPage() {
  const { customSignIn } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username || !password) {
      setErrorMsg('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await customSignIn(username, password);
      if (error) {
        setErrorMsg(error);
      } else {
        // 로그인 성공 시 홈으로 이동
        navigate('/home');
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
        <h1 className="text-2xl font-bold text-[#59B464] mb-2">로그인</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          계정에 로그인하세요
        </p>
      </div>

      {/* 로그인 폼 */}
      <form onSubmit={handleSubmit} className="w-[250px] sm:w-[350px] space-y-3 sm:space-y-4">
        <div>
          <input
            type="text"
            placeholder="아이디"
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
            placeholder="비밀번호"
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

        {/* 에러 메시지 */}
        {errorMsg && (
          <p className="text-red-500 text-[12px] text-center">{errorMsg}</p>
        )}

        {/* 로그인 버튼 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-[17px] bg-[#59B464] hover:bg-[#4a9d54] rounded-[8px] text-white text-[17px] sm:text-sm font-[600] transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>로그인 중...</span>
            </div>
          ) : (
            '로그인'
          )}
        </button>
      </form>

      {/* 회원가입 링크 */}
      <div className="mt-6 text-center">
        <span className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
          계정이 없으신가요?{' '}
        </span>
        <Link to="/auth/signup" className="text-[12px] text-[#59B464] font-medium hover:underline">
          회원가입
        </Link>
      </div>
    </div>
  );
}
