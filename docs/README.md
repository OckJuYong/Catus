# Catus 문서 디렉토리

이 디렉토리는 Catus 프로젝트의 모든 문서를 포함합니다.

## 📚 문서 목록

### 1. [SPECIFICATION.md](./SPECIFICATION.md) - 기술 명세서 (AI/개발자용)
**대상**: AI, 개발자, 기술 팀
**내용**:
- 프로젝트 아키텍처 상세
- 기술 스택 및 의존성
- 파일 구조 및 모듈 설명
- 핵심 기능 구현 방법
- Context API, Hooks, 라우팅 구조
- API 통신 방식
- 보안, 성능, 배포 전략

**활용 사례**:
- AI가 코드베이스를 이해하고 수정할 때
- 새로운 개발자 온보딩
- 기술적 의사결정 시 참고
- 시스템 아키텍처 리뷰

### 2. [USER_GUIDE.md](./USER_GUIDE.md) - 사용자 가이드
**대상**: 최종 사용자, 비기술 팀
**내용**:
- Catus 소개 및 주요 기능
- 화면별 상세 사용법
- 일기 작성 가이드
- 캘린더 활용 팁
- 응원 메시지 사용법
- FAQ 및 문제 해결

**활용 사례**:
- 신규 사용자 온보딩
- 기능 학습 및 활용
- 고객 지원 및 문의 대응
- 앱 내 헬프 문서

### 3. [API_REFERENCE.md](./API_REFERENCE.md) - API 레퍼런스
**대상**: AI, 백엔드 개발자, 프론트엔드 개발자
**내용**:
- 모든 API 엔드포인트 상세
- 요청/응답 예시
- 에러 코드 및 처리
- 데이터 모델 정의
- 인증 플로우
- Rate Limiting 정책

**활용 사례**:
- API 통합 개발
- 백엔드-프론트엔드 협업
- AI가 API 호출 코드 생성
- API 디버깅 및 테스트

## 📖 문서 사용 가이드

### AI 개발자용
AI가 코드 작업을 할 때 참고해야 할 문서 우선순위:
1. **SPECIFICATION.md** - 전체 구조 이해
2. **API_REFERENCE.md** - API 호출 구현
3. **USER_GUIDE.md** - 사용자 관점 기능 이해

### 신규 개발자용
프로젝트에 처음 참여할 때 읽어야 할 순서:
1. **USER_GUIDE.md** - 앱이 무엇을 하는지 이해
2. **SPECIFICATION.md** - 기술적 구조 파악
3. **API_REFERENCE.md** - API 통신 방법 학습

### 기획/디자인 팀용
기능 기획 및 디자인 시 참고:
1. **USER_GUIDE.md** - 현재 기능 확인
2. **SPECIFICATION.md** (핵심 기능 섹션) - 기술적 제약 파악

## 🔄 문서 업데이트 원칙

### 언제 업데이트해야 하나요?

1. **SPECIFICATION.md**:
   - 새로운 기술 스택 추가
   - 아키텍처 변경
   - 새로운 모듈/컴포넌트 추가
   - 빌드/배포 프로세스 변경

2. **USER_GUIDE.md**:
   - 새로운 기능 추가
   - UI/UX 변경
   - 사용자 워크플로우 변경
   - FAQ 항목 추가

3. **API_REFERENCE.md**:
   - 새로운 엔드포인트 추가
   - API 스펙 변경
   - 에러 코드 추가
   - 데이터 모델 변경

### 업데이트 프로세스

```bash
# 1. 기능 개발 완료 후
# 2. 관련 문서 수정
# 3. 문서 버전 업데이트
# 4. 최종 업데이트 날짜 수정
# 5. Git 커밋에 문서 변경 포함
```

## 📝 문서 작성 가이드

### 명확성 (Clarity)
- 기술 용어는 처음 사용 시 설명 추가
- 예시 코드 포함
- 스크린샷 사용 (USER_GUIDE.md)

### 일관성 (Consistency)
- 동일한 용어 사용 (예: "일기" vs "다이어리" 통일)
- 코드 스타일 일관성 유지
- 문서 포맷 통일

### 완전성 (Completeness)
- 모든 기능 문서화
- Edge case 설명
- 에러 처리 방법 포함

### 최신성 (Currency)
- 정기적 리뷰 (분기별)
- 버전 정보 명시
- Deprecated 항목 표시

## 🔗 관련 문서

### 프로젝트 루트 문서
- `../README.md` - 프로젝트 개요
- `../FIREBASE_SETUP_INSTRUCTIONS.md` - Firebase 설정
- `../VERCEL_DEPLOYMENT.md` - Vercel 배포 가이드
- `../CLOUDTYPE_DEPLOYMENT.md` - Cloudtype 배포 가이드

### 외부 문서
- [React 공식 문서](https://react.dev)
- [Vite 공식 문서](https://vitejs.dev)
- [TailwindCSS 문서](https://tailwindcss.com)
- [React Router 문서](https://reactrouter.com)

## 📊 문서 버전 관리

### 버전 네이밍
```
{major}.{minor}.{patch}

major: 대규모 아키텍처 변경
minor: 새로운 기능 추가
patch: 오타 수정, 작은 업데이트
```

### 현재 버전
- **SPECIFICATION.md**: v1.0.0
- **USER_GUIDE.md**: v1.0.0
- **API_REFERENCE.md**: v1.0.0

### 변경 이력
| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2025-11-20 | v1.0.0 | 초기 문서 작성 |

## 🤝 기여 가이드

문서 개선에 기여하고 싶으시면:

1. 오타나 오류 발견 시 이슈 등록
2. 내용 추가 제안
3. 예시 코드 개선
4. 번역 (다국어 지원 시)

## 📧 문의

문서 관련 질문이나 개선 제안:
- GitHub Issues
- 이메일: dev@catus.app
- 팀 슬랙 #docs 채널

---

**문서 관리자**: Catus Development Team
**최종 업데이트**: 2025-11-20
**다음 리뷰 예정일**: 2025-02-20
