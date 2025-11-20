# Frontend Refactoring & Implementation Plan

## 1. 개요
**목적**: Gemini 3.0 기능 통합 및 새로운 UI/UX 요구사항(Big 5 시각화, 하단 채팅바, 로컬 우선 저장소)을 반영하기 위한 프론트엔드 변경 사항 정리.
**기준 문서**: `PROJECT_SPEC.md`, `AI_PROJECT_SPEC.md`

## 2. 기능 분류 (Feature Classification)

### 2.1 기존 기능 개선 (Existing Features - Modification & Refactoring)
기존에 존재하지만 역할이나 동작 방식이 변경되는 기능들입니다.

-   **선인장 (Cactus)**
    -   **[AS-IS]**: 일기 작성에 따라 성장하는 반려 식물.
    -   **[TO-BE]**: **Big 5 성향 분석 시각화 도구**. 클릭 시 성향 차트(Radar Chart)와 분석 리포트 모달 표시.
-   **달이 (Dali)**
    -   **[AS-IS]**: 클릭 시 채팅 화면으로 이동하는 버튼 역할.
    -   **[TO-BE]**: **알림 에이전트**. 평소에는 대기하다가 **'익명 그림일기'** 도착 시에만 상호작용(애니메이션/뱃지)하여 사용자 호출.
-   **채팅 인터페이스 (Chat Interface)**
    -   **[AS-IS]**: 별도의 페이지(`ChatPage`)로 이동하여 대화.
    -   **[TO-BE]**: **하단 채팅바**를 통해 즉시 대화 시작. 대화 내역은 **IndexedDB**로 이관하여 로컬 우선 저장.
-   **API 클라이언트**
    -   **[AS-IS]**: `axios`와 `fetch` 혼용.
    -   **[TO-BE]**: `src/utils/api.js`로 통일 및 인터셉터(토큰 갱신) 적용.

### 2.2 신규 기능 추가 (New Features - Implementation)
새롭게 구현해야 하는 기능들입니다.

-   **종이비행기 (Paper Plane)**
    -   **기능**: **'익명 응원 메시지'** 수신 시 화면에 날아오는 애니메이션 효과.
    -   **동작**: 클릭 시 수신된 응원 메시지 내용 표시 (모달/오버레이).
-   **하단 채팅바 (Bottom Chat Bar)**
    -   **기능**: 홈 화면 하단에 고정된 채팅 입력창.
    -   **동작**: 입력 시 자연스럽게 채팅 모드로 전환(오버레이 확장).
-   **타이핑 인디케이터 (Typing Indicator)**
    -   **기능**: AI가 답변을 생성하는 동안 '달이가 입력 중...'과 같은 애니메이션 표시.
    -   **동작**: 메시지가 완성되면 한 번에 말풍선으로 전송(카카오톡 방식)하여 사람과 대화하는 듯한 자연스러움 제공.
-   **능동형 질문 UI (Proactive Questioning UI)**
    -   **기능**: AI가 먼저 질문을 던질 때, 이를 시각적으로 강조하거나 자연스럽게 대화 흐름에 삽입.

## 3. 아키텍처 및 상태 관리 (Architecture & State)

### 3.1 로컬 우선 저장소 (Local-First Storage)
-   **도입**: **IndexedDB** (라이브러리: `Dexie.js`)
-   **대상 데이터**: `chat_logs` (대화 내역 전체).
-   **이유**: 대용량 텍스트 데이터의 클라이언트 저장 및 빠른 로딩, 백엔드 스토리지 비용 절감.
-   **작업**: `useLocalStorage`로 관리되던 대화 내역을 `Dexie.js` 기반의 `useChatLog` 훅으로 리팩토링.

### 3.2 서버 상태 동기화 (Server State Sync)
-   **도구**: **React Query** (@tanstack/react-query)
-   **대상 데이터**:
    -   Big 5 성향 점수 (`/api/v1/users/personality`)
    -   일기 분석 결과 (`/api/v1/diaries`)
    -   익명 메시지 수신함 (`/api/v1/support/received`)
-   **전략**: `staleTime`을 적절히 설정하여 불필요한 API 호출 최소화.

### 3.3 API 클라이언트 리팩토링
-   **목표**: `axios` 직접 사용 제거 및 `src/utils/api.js` (fetch wrapper)로 통일하거나, `axios` 인스턴스로 중앙화.
-   **기능**: 인터셉터를 통한 JWT 토큰 자동 주입 및 만료 시 갱신 로직(Refresh Token) 구현.

## 4. 구현 우선순위 (Priority)

1.  **Phase 1: 기반 공사 (Refactoring)**
    -   `Dexie.js` 설치 및 DB 스키마 설정.
    -   `api.js` 리팩토링 및 React Query 설정.
2.  **Phase 2: 홈 화면 개편 (UI/UX)**
    -   하단 채팅바 구현.
    -   선인장 -> Big 5 차트 연동 (Chart.js 또는 Recharts 도입 필요).
    -   달이/종이비행기 조건부 렌더링 로직 구현.
3.  **Phase 3: 기능 통합 (Feature Integration)**
    -   채팅 스트리밍 연동 (백엔드 구현 후).
    -   익명 그림일기/응원 메시지 API 연동.

## 5. 필요 라이브러리 추가
-   `dexie`: IndexedDB 래퍼.
-   `recharts` 또는 `react-chartjs-2`: Big 5 성향 차트 시각화.
-   `framer-motion`: (이미 있음) 종이비행기 등 애니메이션 강화.
