/**
 * 개인정보 처리방침 페이지
 */

import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();

  const sections = [
    {
      title: '1. 수집하는 개인정보',
      content: `하루온(달이)은 서비스 제공을 위해 다음 정보를 수집합니다:

• 필수 정보: 이메일 주소, 닉네임
• 선택 정보: 프로필 이미지
• 자동 수집: 서비스 이용 기록, 접속 로그

카카오 로그인 시 카카오계정 이메일, 프로필 정보(닉네임, 프로필 사진)가 수집될 수 있습니다.`
    },
    {
      title: '2. 개인정보의 이용 목적',
      content: `수집된 개인정보는 다음 목적으로 이용됩니다:

• 회원 가입 및 관리
• 맞춤형 AI 대화 서비스 제공
• 감정 일기 및 성격 분석 서비스 제공
• 서비스 개선 및 신규 서비스 개발
• 고객 문의 대응`
    },
    {
      title: '3. 개인정보의 보관 기간',
      content: `• 회원 탈퇴 시까지 보관
• 탈퇴 후 30일 이내 파기
• 법령에 따른 보관 의무가 있는 경우 해당 기간 동안 보관

대화 기록 및 일기 데이터는 사용자가 직접 삭제하거나 회원 탈퇴 시 함께 삭제됩니다.`
    },
    {
      title: '4. 개인정보의 제3자 제공',
      content: `하루온은 원칙적으로 사용자의 개인정보를 제3자에게 제공하지 않습니다.

다만, 다음의 경우에는 예외로 합니다:
• 사용자가 사전에 동의한 경우
• 법령에 의해 요구되는 경우`
    },
    {
      title: '5. 개인정보의 안전성 확보',
      content: `하루온은 개인정보 보호를 위해 다음과 같은 조치를 취하고 있습니다:

• 개인정보 암호화
• 해킹 등에 대비한 보안 시스템 운영
• 개인정보 접근 제한
• 정기적인 보안 점검`
    },
    {
      title: '6. 사용자의 권리',
      content: `사용자는 언제든지 다음 권리를 행사할 수 있습니다:

• 개인정보 열람 요청
• 개인정보 수정 요청
• 개인정보 삭제 요청
• 회원 탈퇴

설정 메뉴에서 직접 처리하거나, 고객센터로 문의해 주세요.`
    },
    {
      title: '7. 쿠키 사용',
      content: `하루온은 서비스 품질 향상을 위해 쿠키를 사용할 수 있습니다.

사용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 일부 서비스 이용에 제한이 있을 수 있습니다.`
    },
    {
      title: '8. 개인정보 보호책임자',
      content: `개인정보 보호 관련 문의사항은 아래로 연락해 주세요:

• 이메일: support@haruon.app
• 본 방침은 2025년 1월 1일부터 적용됩니다.`
    },
  ];

  return (
    <div
      className="h-[100dvh] flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--color-main-bg)' }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-[12px] py-[8px] flex-shrink-0"
        style={{ backgroundColor: 'var(--color-bg-card)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-[44px] h-[44px] flex items-center justify-center hover:opacity-70 text-[24px] bg-transparent border-0 cursor-pointer"
          style={{ color: isDarkMode ? '#FFFFFF' : '#5E7057' }}
          aria-label="뒤로 가기"
        >
          ←
        </button>
        <div
          className="text-[16px] font-[600]"
          style={{ color: isDarkMode ? '#FFFFFF' : '#5E7057' }}
        >
          개인정보 처리방침
        </div>
        <div className="w-[44px]" />
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-[16px] py-[16px]">
        {/* 앱 정보 */}
        <div
          className="rounded-[16px] p-[20px] mb-[16px] text-center"
          style={{ backgroundColor: 'var(--color-bg-card)' }}
        >
          <div className="text-[32px] mb-[8px]">🐱</div>
          <h1
            className="text-[18px] font-[700] mb-[4px]"
            style={{ color: 'var(--color-text-primary)' }}
          >
            하루온 (달이)
          </h1>
          <p
            className="text-[13px]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            AI 감정 케어 컴패니언
          </p>
        </div>

        {/* 방침 섹션들 */}
        {sections.map((section, index) => (
          <div
            key={index}
            className="rounded-[16px] p-[16px] mb-[12px]"
            style={{ backgroundColor: 'var(--color-bg-card)' }}
          >
            <h2
              className="text-[15px] font-[600] mb-[12px]"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {section.title}
            </h2>
            <p
              className="text-[13px] leading-[1.8] whitespace-pre-line"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {section.content}
            </p>
          </div>
        ))}

        {/* 하단 여백 */}
        <div className="h-[20px]" />
      </div>
    </div>
  );
}
