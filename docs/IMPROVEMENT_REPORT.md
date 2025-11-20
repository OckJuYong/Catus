# 프로젝트 개선 및 백엔드 요구사항 보고서

## 1. 개요
**날짜**: 2025-11-20
**목적**: 프론트엔드 코드베이스의 개선점 도출 및 Spring Boot 마이그레이션을 위한 백엔드 요구사항 정의.

## 2. 프론트엔드 개선 제안 (Frontend Improvements)

### 2.1 디자인 패턴 및 아키텍처 (Design Patterns & Architecture)
-   **API 클라이언트 일관성 부재 (Inconsistent API Client)**:
    -   **현상**: `src/utils/api.js`는 `fetch` API를 래핑하여 정의되어 있으나, `ChatPage.jsx` 등 일부 컴포넌트에서는 `axios`를 직접 import하여 사용하고 있습니다.
    -   **개선**: 모든 API 호출을 `src/utils/api.js` (또는 리팩토링된 `api` 모듈)를 통해서만 이루어지도록 통일해야 합니다. 이를 통해 인터셉터(토큰 처리, 에러 핸들링)를 중앙에서 관리할 수 있습니다.
-   **관심사 분리 미흡 (Mixed Concerns)**:
    -   **현상**: `HomePage.jsx`와 `ChatPage.jsx`에 비즈니스 로직(데이터 가공, API 호출)과 UI 렌더링 로직이 혼재되어 있습니다.
    -   **개선**: 커스텀 훅(Custom Hooks) 패턴을 도입하여 비즈니스 로직을 분리해야 합니다. (예: `useChat`, `useDiary`)
-   **하드코딩된 라우팅 및 설정**:
    -   **현상**: 일부 경로 이동이나 설정값이 컴포넌트 내부에 하드코딩되어 있을 가능성이 있습니다.
    -   **개선**: `src/constants` 디렉토리를 활용하여 상수화하고 관리해야 합니다.

### 2.2 상태 관리 및 데이터 흐름 (State Management)
### 2.2 상태 관리 및 데이터 흐름 (State Management)
-   **대용량 채팅 데이터 처리 (Handling Large Chat History)**:
    -   **요구사항**: 백엔드 DB 용량 절약을 위해 '대화 내역'은 클라이언트에 보관하고, 서버에는 '분석 결과(일기/감정)'만 저장하는 하이브리드 구조를 지향합니다.
    -   **문제점**: 현재 사용 중인 `LocalStorage`는 용량 제한(약 5MB)이 있어 장기간 대화 저장 시 데이터 유실 위험이 크고, 동기식 처리로 인해 UI 블로킹이 발생할 수 있습니다.
    -   **개선**: **IndexedDB** 도입이 필수적입니다.
        -   **저장소**: `Dexie.js`와 같은 라이브러리를 사용하여 IndexedDB를 쉽게 관리합니다. (용량 제한이 거의 없고 비동기 처리)
        -   **상태 관리**: `React Query`를 사용하여 IndexedDB로부터 데이터를 비동기적으로 조회(Fetch)하고 캐싱하여 UI 로딩 속도를 최적화합니다. (IndexedDB를 로컬 서버처럼 취급)
-   **서버 데이터 동기화**:
    -   분석된 일기 데이터, 통계 등 서버에 저장된 데이터는 `React Query`를 통해 표준적인 방식으로 관리합니다.

### 2.3 코드 오류 및 잠재적 문제 (Code Errors & Smells)
-   **에러 핸들링 부족**: API 호출 실패 시 사용자에게 적절한 피드백(토스트 메시지 등)을 주는 로직이 일관되지 않습니다.
-   **타입 안정성 부재**: JavaScript를 사용하고 있어 데이터 구조 파악이 어렵습니다. (장기적으로 TypeScript 도입 권장)

## 3. Spring Boot 백엔드 요구사항 (Backend Requirements)

프론트엔드 기능을 지원하기 위해 Spring Boot 백엔드에서 구현해야 할 요소들입니다.

### 3.1 API 컨트롤러 (Controllers)
프론트엔드 `api.js`와 매핑되는 컨트롤러가 필요합니다.

| Controller | Endpoint Prefix | 주요 기능 |
| :--- | :--- | :--- |
| **AuthController** | `/api/v1/auth` | 카카오 로그인(OAuth2), 토큰 재발급(Refresh), 로그아웃, 내 정보 조회 |
| **UserController** | `/api/v1/users` | 사용자 프로필 조회/수정, 온보딩 정보 저장 |
| **ChatController** | `/api/v1/chat` | 메시지 전송/저장, 대화 기록 조회, 대화 종료(감정 분석 트리거) |
| **DiaryController** | `/api/v1/diaries` | 일기 CRUD, 월별 목록 조회 |
| **SupportController** | `/api/v1/support` | 응원 편지 주고받기, 읽음 처리 |
| **StatsController** | `/api/v1/stats` | 감정 통계, 월별 활동 통계 데이터 제공 |

### 3.2 데이터 모델 (Entities & DTOs)
-   **User**: 사용자 ID(UUID), 카카오 ID, 닉네임, 프로필 이미지, 온보딩 정보(고민, 목표 등).
-   **Diary**: 일기 ID, 사용자 ID, 날짜, 내용, 제목, 요약, 감정 태그, 생성일/수정일.
-   **ChatMessage**: 메시지 ID, 일기 ID(또는 세션 ID), 발신자(User/AI), 내용, 타임스탬프.
-   **SupportMessage**: 메시지 ID, 발신자 ID, 수신자 ID, 내용, 읽음 여부, 전송일.
-   **PersonalityProfile** (Big5): 사용자 ID, 5가지 성향 점수, 분석 요약.

### 3.3 보안 및 인증 (Security)
-   **Spring Security + JWT**:
    -   Stateless 인증 방식 구현.
    -   Access Token(짧은 만료) & Refresh Token(긴 만료, DB/Redis 저장) 구조.
    -   CORS 설정: 프론트엔드 도메인 허용.
-   **OAuth2 Client**: 카카오 로그인 연동 처리.

### 3.4 AI 통합 (AI Integration)
-   **Gemini API Service**: Spring Boot 서비스 계층에서 Google Gemini API를 호출하여 챗봇 응답 및 감정 분석 수행.
-   **Prompt Management**: 시스템 프롬프트 및 Few-shot 예시를 관리하는 설정 또는 DB 구조.

## 4. 결론 및 우선순위
1.  **백엔드 구축**: Spring Boot 프로젝트 셋업 및 API 스켈레톤 코드 작성.
2.  **프론트엔드 리팩토링**: `api.js`로 API 호출 통일 및 `React Query` 도입.
3.  **연동 테스트**: 로컬 스토리지 로직을 실제 백엔드 API 연동으로 교체.
