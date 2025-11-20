# Catus Big5 성향분석 통합 파일 구조

## 📋 개요

이 문서는 SLLM 방식을 Gemini에 적용하여 Catus에 Big5 성향분석 기능을 통합하기 위한 파일 구조 및 수정 계획입니다.

**사용자 담당 영역**:
- ✅ Gemini 프롬프트 형식 마이그레이션
- ✅ 일기 그림 생성 마이그레이션

**이 문서 범위**:
- 📁 파일 구조 및 조직화
- 🔗 파일 간 연결 관계
- 📝 수정/생성 파일 목록

---

## 🗂️ 전체 파일 구조

```
catus-backend-node/
├── services/
│   ├── gemini.js (기존 - 수정 필요)
│   ├── big5Analyzer.js (신규 - 생성 필요)
│   ├── personalityTracker.js (신규 - 생성 필요)
│   └── diaryScheduler.js (기존 - 수정 필요)
│
├── routes/
│   ├── personality.js (신규 - 생성 필요)
│   └── chat.js (기존 - 수정 필요)
│
├── prompts/
│   ├── big5/
│   │   ├── systemInstruction.js (신규)
│   │   ├── initialAnalysis.js (신규)
│   │   ├── diaryBasedUpdate.js (신규)
│   │   └── questions.js (신규)
│   └── diary/
│       └── generation.js (기존 이동)
│
├── models/
│   └── personality.js (신규 - 생성 필요)
│
└── config/
    └── big5.js (신규 - 생성 필요)

catus/
├── src/
│   ├── pages/
│   │   ├── PersonalityTestPage.jsx (신규 - 생성 필요)
│   │   ├── PersonalityResultPage.jsx (신규 - 생성 필요)
│   │   ├── PersonalityHistoryPage.jsx (신규 - 생성 필요)
│   │   ├── HomePage.jsx (기존 - 수정 필요)
│   │   └── ChatPage.jsx (기존 - 유지)
│   │
│   ├── components/
│   │   └── personality/
│   │       ├── QuestionCard.jsx (신규)
│   │       ├── TraitChart.jsx (신규)
│   │       ├── PersonalityBadge.jsx (신규)
│   │       └── ChangeIndicator.jsx (신규)
│   │
│   ├── api/
│   │   └── personality.js (신규 - 생성 필요)
│   │
│   └── utils/
│       └── big5Utils.js (신규 - 생성 필요)
│
└── docs/
    └── BIG5_INTEGRATION_GUIDE.md (신규 - 생성 필요)

claudedocs/
├── CATUS_AI_COMPONENT_ANALYSIS_REPORT.md (기존 - 완료)
├── SLLM_TO_GEMINI_INTEGRATION_STRATEGY.md (기존 - 완료)
└── CATUS_BIG5_INTEGRATION_FILE_STRUCTURE.md (현재 문서)
```

---

## 📂 백엔드 파일 상세

### 1. 서비스 계층 (services/)

#### **`services/gemini.js`** (기존 파일 - 수정)
**현재 역할**: Gemini API 호출 핵심 로직
**수정 필요 사항**:
- System Instruction 지원 추가
- JSON 모드 응답 파싱 로직 추가
- 에러 핸들링 개선

**연결 관계**:
- ← `big5Analyzer.js`에서 호출
- ← `personalityTracker.js`에서 호출
- ← `diaryScheduler.js`에서 호출 (기존)

**주요 기능 추가**:
```javascript
// System Instruction 지원
async sendToGeminiWithSystemInstruction(systemInstruction, userMessage)

// JSON 파싱 지원
async sendToGeminiJSON(prompt, parseSchema)
```

---

#### **`services/big5Analyzer.js`** (신규 파일)
**역할**: Big5 성향분석 핵심 로직
**의존성**:
- → `services/gemini.js` (Gemini API 호출)
- → `prompts/big5/systemInstruction.js` (시스템 프롬프트)
- → `prompts/big5/initialAnalysis.js` (초기 분석 프롬프트)
- → `config/big5.js` (Big5 설정)

**주요 함수 구조**:
```javascript
// 초기 성향 분석 (5개 답변 → Big5 점수)
async analyzeInitialPersonality(userId, answers)

// 하이브리드 분석 (키워드 + Gemini)
async hybridAnalysis(text)

// 키워드 기반 사전 분석
ruleBasedScoring(text)
```

**입력**:
- `userId`: 사용자 ID
- `answers`: 5개 질문에 대한 답변 배열
```javascript
[
  { trait: 'openness', question: '...', answer: '...' },
  { trait: 'conscientiousness', question: '...', answer: '...' },
  // ...
]
```

**출력**:
```javascript
{
  userId,
  scores: {
    openness: 7.5,
    conscientiousness: 6.0,
    extraversion: 8.0,
    agreeableness: 7.0,
    neuroticism: 4.5
  },
  insights: {
    openness: "새로운 경험에 대한 개방적 태도가...",
    // ...
  },
  summary: "전반적으로 외향적이고 개방적인 성향...",
  created_at: '2025-01-17T10:00:00Z'
}
```

---

#### **`services/personalityTracker.js`** (신규 파일)
**역할**: 일기 기반 성향 변화 추적
**의존성**:
- → `services/gemini.js` (Gemini API 호출)
- → `prompts/big5/diaryBasedUpdate.js` (업데이트 프롬프트)
- → `models/personality.js` (DB 쿼리)
- → `config/big5.js` (변화량 제한 설정)

**주요 함수 구조**:
```javascript
// 일기 기반 성향 업데이트
async updateFromDiary(userId, diaryContent, diaryEmotion, diaryDate)

// 변화량 제한 검증 (일일 ±0.5, 범위 1.0-10.0)
validateScoreChange(oldScore, newScore)

// 성향 히스토리 기록
async savePersonalityHistory(userId, scores, reason, date)
```

**입력**:
- `userId`: 사용자 ID
- `diaryContent`: 일기 내용
- `diaryEmotion`: 일기 감정
- `diaryDate`: 일기 날짜

**출력**:
```javascript
{
  userId,
  oldScores: { openness: 7.5, ... },
  newScores: { openness: 7.8, ... },
  changes: { openness: +0.3, ... },
  reason: "diary_analysis",
  date: '2025-01-18'
}
```

---

#### **`services/diaryScheduler.js`** (기존 파일 - 수정)
**현재 역할**: 자정에 대화 내역 → 일기 생성
**수정 필요 사항**:
- 일기 생성 후 `personalityTracker.updateFromDiary()` 호출 추가
- 성향 업데이트 실패 시 에러 핸들링 추가

**연결 관계**:
- → `services/gemini.js` (기존)
- → `services/personalityTracker.js` (신규 추가)

**수정 위치**:
```javascript
// 기존 코드
const diaryContent = await sendToGemini(diaryPrompt, conversationHistory);
const emotion = await sendToGemini(emotionPrompt, []);

// 신규 추가
await personalityTracker.updateFromDiary(
  userId,
  diaryContent,
  emotion,
  todayDate
);
```

---

### 2. 라우트 계층 (routes/)

#### **`routes/personality.js`** (신규 파일)
**역할**: Big5 성향분석 API 엔드포인트
**의존성**:
- → `services/big5Analyzer.js`
- → `services/personalityTracker.js`
- → `models/personality.js`

**엔드포인트 구조**:
```javascript
// 1. 초기 성향분석 (5개 질문 → Big5 점수)
POST /api/v1/personality/analyze
Body: { answers: [...] }
→ big5Analyzer.analyzeInitialPersonality()

// 2. 현재 성향 조회
GET /api/v1/personality/current
→ models.personality.getCurrentProfile()

// 3. 성향 히스토리 조회 (기간별)
GET /api/v1/personality/history?startDate=...&endDate=...
→ models.personality.getHistory()

// 4. 성향 변화 트렌드
GET /api/v1/personality/trends?period=week|month
→ models.personality.getTrends()
```

---

#### **`routes/chat.js`** (기존 파일 - 수정)
**현재 역할**: 채팅 메시지 API
**수정 필요 사항**:
- 응답에 현재 성향 정보 포함 (optional)
- 대화 종료 시 성향 업데이트 트리거 (optional)

**수정 예시**:
```javascript
// POST /api/v1/chat/messages 응답에 추가
{
  message: "...",
  timestamp: "...",
  personality: {  // Optional
    dominantTrait: 'extraversion',
    score: 8.0
  }
}
```

---

### 3. 프롬프트 계층 (prompts/)

#### **`prompts/big5/systemInstruction.js`** (신규 파일)
**역할**: Big5 분석용 System Instruction
**내용**:
```javascript
module.exports = `당신은 Big5 심리학 모델을 기반으로 사용자의 답변을 분석하는 전문 심리 분석가입니다.

**분석 기준**:
- Openness (개방성): 1.0-10.0
- Conscientiousness (성실성): 1.0-10.0
- Extraversion (외향성): 1.0-10.0
- Agreeableness (우호성): 1.0-10.0
- Neuroticism (신경성): 1.0-10.0

**응답 형식**: 반드시 JSON 형식으로 응답
**분석 원칙**: 긍정적이며 통찰력 있는 피드백, 의학적 진단 금지`;
```

---

#### **`prompts/big5/initialAnalysis.js`** (신규 파일)
**역할**: 초기 성향분석 프롬프트 생성
**함수**:
```javascript
function buildInitialAnalysisPrompt(answers) {
  return `다음은 사용자의 5가지 답변입니다:

1. Openness: "${answers[0].answer}"
2. Conscientiousness: "${answers[1].answer}"
3. Extraversion: "${answers[2].answer}"
4. Agreeableness: "${answers[3].answer}"
5. Neuroticism: "${answers[4].answer}"

위 답변을 분석하여 JSON 형식으로 Big5 점수와 인사이트를 제공해주세요.`;
}
```

---

#### **`prompts/big5/diaryBasedUpdate.js`** (신규 파일)
**역할**: 일기 기반 성향 업데이트 프롬프트
**함수**:
```javascript
function buildDiaryUpdatePrompt(currentScores, diaryContent, emotion) {
  return `**현재 사용자의 Big5 점수**:
- Openness: ${currentScores.openness}
- Conscientiousness: ${currentScores.conscientiousness}
- Extraversion: ${currentScores.extraversion}
- Agreeableness: ${currentScores.agreeableness}
- Neuroticism: ${currentScores.neuroticism}

**오늘의 일기 내용**:
"${diaryContent}"

**감정**: ${emotion}

위 일기를 분석하여 성향 점수의 변화를 제안해주세요. (일일 변화량: ±0.5 이내)`;
}
```

---

#### **`prompts/big5/questions.js`** (신규 파일)
**역할**: 5가지 질문 정의
**내용**:
```javascript
module.exports = [
  {
    trait: 'openness',
    question: '새로운 것을 배우거나 경험할 때 어떤 느낌이 드나요?',
    hint: '호기심, 창의성, 예술적 관심에 대해 자유롭게 써주세요.'
  },
  {
    trait: 'conscientiousness',
    question: '계획을 세우고 목표를 이루는 과정에서 자신은 어떤가요?',
    hint: '책임감, 조직력, 목표 달성 방식에 대해 생각해보세요.'
  },
  // ... 3개 더
];
```

---

### 4. 모델 계층 (models/)

#### **`models/personality.js`** (신규 파일)
**역할**: Supabase personality 테이블 쿼리
**의존성**:
- → Supabase client

**주요 함수**:
```javascript
// 현재 성향 프로필 조회
async getCurrentProfile(userId)

// 성향 프로필 저장 (초기 or 업데이트)
async saveProfile(userId, scores, insights, summary)

// 성향 히스토리 저장
async saveHistory(userId, scores, reason, date)

// 히스토리 조회 (기간별)
async getHistory(userId, startDate, endDate)

// 트렌드 분석 (주간/월간)
async getTrends(userId, period)
```

**DB 쿼리 예시**:
```javascript
// 현재 프로필 조회
const { data } = await supabase
  .from('personality_profiles')
  .select('*')
  .eq('user_id', userId)
  .single();

// 히스토리 저장
await supabase
  .from('personality_history')
  .insert({
    user_id: userId,
    scores,
    reason,
    date
  });
```

---

### 5. 설정 계층 (config/)

#### **`config/big5.js`** (신규 파일)
**역할**: Big5 관련 상수 및 설정
**내용**:
```javascript
module.exports = {
  TRAITS: ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'],

  SCORE_RANGE: {
    MIN: 1.0,
    MAX: 10.0
  },

  DAILY_CHANGE_LIMIT: 0.5,

  TRAIT_KEYWORDS: {
    openness: {
      high: ['새로운', '창의적', '실험', '혁신', '예술', '호기심'],
      low: ['전통적', '보수적', '익숙한', '체계적', '안정적']
    },
    // ... 다른 특성들
  },

  TRAIT_NAMES_KR: {
    openness: '개방성',
    conscientiousness: '성실성',
    extraversion: '외향성',
    agreeableness: '우호성',
    neuroticism: '신경성'
  }
};
```

---

## 📱 프론트엔드 파일 상세

### 1. 페이지 계층 (pages/)

#### **`pages/PersonalityTestPage.jsx`** (신규 파일)
**역할**: 5가지 질문 답변 페이지
**의존성**:
- → `components/personality/QuestionCard.jsx`
- → `api/personality.js`

**화면 구조**:
```
[진행 표시: 1/5]
────────────────────────────────
질문: 새로운 것을 배우거나...
────────────────────────────────
[텍스트 입력 영역 (500자)]
────────────────────────────────
[이전] [다음 (5/5일 때 제출)]
```

**주요 기능**:
- 5개 질문 순차 표시
- 답변 길이 제한 (500자)
- 진행 상황 표시
- 제출 → `/api/v1/personality/analyze` 호출
- 결과 페이지로 이동

---

#### **`pages/PersonalityResultPage.jsx`** (신규 파일)
**역할**: Big5 분석 결과 표시
**의존성**:
- → `components/personality/TraitChart.jsx`
- → `components/personality/PersonalityBadge.jsx`

**화면 구조**:
```
────────────────────────────────
🎯 당신의 성향 분석 결과
────────────────────────────────
[레이더 차트: 5개 특성 점수]
────────────────────────────────
개방성 ████████░░ 8.0
성실성 ██████░░░░ 6.0
외향성 █████████░ 9.0
우호성 ███████░░░ 7.0
신경성 ████░░░░░░ 4.0
────────────────────────────────
💡 인사이트
"새로운 경험에 대한..."
────────────────────────────────
[홈으로] [히스토리 보기]
```

---

#### **`pages/PersonalityHistoryPage.jsx`** (신규 파일)
**역할**: 성향 변화 히스토리 표시
**의존성**:
- → `components/personality/ChangeIndicator.jsx`
- → `api/personality.js`

**화면 구조**:
```
────────────────────────────────
📊 성향 변화 히스토리
────────────────────────────────
[기간 선택: 1주일 | 1개월 | 3개월]
────────────────────────────────
2025-01-18 (일기 분석)
  개방성: 7.5 → 7.8 (+0.3) ↑
  외향성: 8.0 → 7.9 (-0.1) ↓

2025-01-10 (초기 분석)
  모든 특성 측정
────────────────────────────────
[라인 차트: 시간별 특성 변화]
```

---

#### **`pages/HomePage.jsx`** (기존 파일 - 수정)
**현재 역할**: 오늘의 일기, 감정 표시
**수정 필요 사항**:
- 선인장 클릭 → PersonalityTestPage 이동
- 현재 주요 성향 배지 표시

**수정 위치**:
```jsx
// 선인장 클릭 핸들러 추가
const handleCactusClick = () => {
  navigate('/personality/test');
};

// 성향 배지 표시
{currentPersonality && (
  <PersonalityBadge
    trait={currentPersonality.dominantTrait}
    score={currentPersonality.score}
  />
)}
```

---

### 2. 컴포넌트 계층 (components/personality/)

#### **`components/personality/QuestionCard.jsx`** (신규)
**역할**: 질문 카드 UI
**Props**:
```javascript
{
  question: "질문 내용",
  hint: "힌트",
  value: "현재 답변",
  onChange: (text) => {},
  maxLength: 500
}
```

---

#### **`components/personality/TraitChart.jsx`** (신규)
**역할**: Big5 레이더 차트
**Props**:
```javascript
{
  scores: {
    openness: 7.5,
    conscientiousness: 6.0,
    extraversion: 8.0,
    agreeableness: 7.0,
    neuroticism: 4.5
  }
}
```

---

#### **`components/personality/PersonalityBadge.jsx`** (신규)
**역할**: 주요 성향 배지
**Props**:
```javascript
{
  trait: 'extraversion',
  score: 8.0
}
```
**표시**: `🎭 외향성 8.0`

---

#### **`components/personality/ChangeIndicator.jsx`** (신규)
**역할**: 성향 변화 표시
**Props**:
```javascript
{
  oldScore: 7.5,
  newScore: 7.8,
  trait: 'openness'
}
```
**표시**: `개방성: 7.5 → 7.8 (+0.3) ↑`

---

### 3. API 계층 (api/)

#### **`api/personality.js`** (신규 파일)
**역할**: 백엔드 personality API 호출
**함수**:
```javascript
// 초기 분석
export async function analyzePersonality(answers) {
  return axios.post('/personality/analyze', { answers });
}

// 현재 프로필 조회
export async function getCurrentPersonality() {
  return axios.get('/personality/current');
}

// 히스토리 조회
export async function getPersonalityHistory(startDate, endDate) {
  return axios.get('/personality/history', { params: { startDate, endDate } });
}

// 트렌드 조회
export async function getPersonalityTrends(period) {
  return axios.get('/personality/trends', { params: { period } });
}
```

---

### 4. 유틸리티 계층 (utils/)

#### **`utils/big5Utils.js`** (신규 파일)
**역할**: Big5 관련 유틸리티 함수
**함수**:
```javascript
// 특성명 한글 변환
export function getTraitNameKR(trait)

// 점수 색상 매핑
export function getScoreColor(score)

// 변화량 표시 (↑↓→)
export function getChangeIcon(change)

// 주요 특성 찾기
export function findDominantTrait(scores)
```

---

## 🔗 파일 간 연결 관계

### 데이터 흐름도

```
[사용자 입력]
    ↓
PersonalityTestPage.jsx
    ↓ (5개 답변)
api/personality.js::analyzePersonality()
    ↓
routes/personality.js::POST /analyze
    ↓
services/big5Analyzer.js::analyzeInitialPersonality()
    ↓
services/gemini.js::sendToGeminiWithSystemInstruction()
    ↓ (Big5 점수 + 인사이트)
models/personality.js::saveProfile()
    ↓
[Supabase personality_profiles 테이블]
    ↓
PersonalityResultPage.jsx (결과 표시)
```

---

### 일기 기반 업데이트 흐름

```
[자정 스케줄러]
    ↓
services/diaryScheduler.js (일기 생성 완료)
    ↓
services/personalityTracker.js::updateFromDiary()
    ↓
models/personality.js::getCurrentProfile() (기존 점수 조회)
    ↓
services/gemini.js::sendToGeminiWithSystemInstruction()
    ↓ (변화량 제안)
validateScoreChange() (±0.5 검증)
    ↓
models/personality.js::saveProfile() (업데이트)
models/personality.js::saveHistory() (히스토리 기록)
    ↓
[Supabase personality_profiles + personality_history 테이블]
```

---

## 📊 데이터베이스 스키마 (참고)

### `personality_profiles` 테이블
```sql
CREATE TABLE personality_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(user_id),
  openness DECIMAL(3,1),
  conscientiousness DECIMAL(3,1),
  extraversion DECIMAL(3,1),
  agreeableness DECIMAL(3,1),
  neuroticism DECIMAL(3,1),
  insights JSONB,
  summary TEXT,
  last_updated_at TIMESTAMP,
  created_at TIMESTAMP
);
```

### `personality_history` 테이블
```sql
CREATE TABLE personality_history (
  history_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  scores JSONB,
  reason TEXT,
  date DATE,
  created_at TIMESTAMP
);
```

---

## 🔧 수정/생성 파일 체크리스트

### ✅ 백엔드 (catus-backend-node/)

**수정 필요**:
- [ ] `services/gemini.js` - System Instruction, JSON 파싱 추가
- [ ] `services/diaryScheduler.js` - personalityTracker 호출 추가
- [ ] `routes/chat.js` - 응답에 성향 정보 포함 (optional)

**신규 생성**:
- [ ] `services/big5Analyzer.js` - Big5 분석 핵심 로직
- [ ] `services/personalityTracker.js` - 일기 기반 성향 추적
- [ ] `routes/personality.js` - API 엔드포인트
- [ ] `prompts/big5/systemInstruction.js` - 시스템 프롬프트
- [ ] `prompts/big5/initialAnalysis.js` - 초기 분석 프롬프트
- [ ] `prompts/big5/diaryBasedUpdate.js` - 업데이트 프롬프트
- [ ] `prompts/big5/questions.js` - 5가지 질문
- [ ] `models/personality.js` - DB 쿼리
- [ ] `config/big5.js` - 설정 및 상수

---

### ✅ 프론트엔드 (catus/)

**수정 필요**:
- [ ] `src/pages/HomePage.jsx` - 선인장 클릭, 성향 배지

**신규 생성**:
- [ ] `src/pages/PersonalityTestPage.jsx` - 질문 답변 페이지
- [ ] `src/pages/PersonalityResultPage.jsx` - 결과 표시 페이지
- [ ] `src/pages/PersonalityHistoryPage.jsx` - 히스토리 페이지
- [ ] `src/components/personality/QuestionCard.jsx` - 질문 카드
- [ ] `src/components/personality/TraitChart.jsx` - 레이더 차트
- [ ] `src/components/personality/PersonalityBadge.jsx` - 성향 배지
- [ ] `src/components/personality/ChangeIndicator.jsx` - 변화 표시
- [ ] `src/api/personality.js` - API 호출
- [ ] `src/utils/big5Utils.js` - 유틸리티 함수

---

### ✅ 문서 (docs/, claudedocs/)

**신규 생성**:
- [ ] `catus/docs/BIG5_INTEGRATION_GUIDE.md` - 통합 가이드
- [x] `claudedocs/CATUS_BIG5_INTEGRATION_FILE_STRUCTURE.md` (현재 문서)

---

## 🚀 구현 순서 권장사항

### Phase 1: 백엔드 기반 구축
1. `config/big5.js` (설정)
2. `prompts/big5/*.js` (프롬프트)
3. `services/gemini.js` (System Instruction 지원)
4. `models/personality.js` (DB 쿼리)

### Phase 2: 백엔드 로직
5. `services/big5Analyzer.js` (초기 분석)
6. `routes/personality.js` (API 엔드포인트)
7. 테스트 (Postman/Thunder Client)

### Phase 3: 프론트엔드 UI
8. `api/personality.js` (API 호출)
9. `components/personality/*.jsx` (컴포넌트)
10. `pages/PersonalityTestPage.jsx` (질문 페이지)
11. `pages/PersonalityResultPage.jsx` (결과 페이지)

### Phase 4: 통합 및 일기 연동
12. `services/personalityTracker.js` (일기 기반 추적)
13. `services/diaryScheduler.js` (수정)
14. `pages/PersonalityHistoryPage.jsx` (히스토리)
15. `pages/HomePage.jsx` (수정)

### Phase 5: 테스트 및 최적화
16. E2E 테스트
17. 성능 최적화
18. 문서화 완료

---

## 📌 주의사항

1. **사용자 담당 영역**:
   - Gemini 프롬프트 형식 마이그레이션
   - 일기 그림 생성 마이그레이션

2. **Gemini API 키**:
   - `.env` 파일에 `GEMINI_API_KEY` 필요

3. **데이터베이스 마이그레이션**:
   - Supabase에서 `personality_profiles`, `personality_history` 테이블 생성 필요

4. **점수 범위 검증**:
   - 모든 점수는 1.0-10.0 범위
   - 일일 변화량 ±0.5 이내

5. **에러 핸들링**:
   - Gemini API 호출 실패 시 재시도 로직
   - JSON 파싱 실패 시 기본값 사용

---

## 🎯 완료 기준

- [ ] 백엔드 9개 신규 파일 생성 완료
- [ ] 백엔드 3개 기존 파일 수정 완료
- [ ] 프론트엔드 9개 신규 파일 생성 완료
- [ ] 프론트엔드 1개 기존 파일 수정 완료
- [ ] 데이터베이스 테이블 생성 완료
- [ ] API 엔드포인트 테스트 통과
- [ ] E2E 테스트 통과 (질문 → 결과 → 일기 업데이트)
- [ ] 문서화 완료

---

**작성일**: 2025-01-17
**버전**: 1.0
**작성자**: Claude (AI Assistant)
