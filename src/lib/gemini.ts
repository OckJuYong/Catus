/**
 * Google Gemini AI Client
 * Gemini 2.5 Flash for chat responses
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing VITE_GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// System instruction for Dali (달이) companion - Base prompt
const BASE_SYSTEM_PROMPT = `너는 '달이'야. 검은 고양이고, 사용자의 오랜 친구야.

## 너는 누구?
- 이름: 달이 (검은 고양이)
- 성격: 담담하지만 따뜻한 친구, 과하지 않게 걱정해주는 존재
- 관계: 오래 알고 지낸 편한 친구 (주인-반려동물 관계 아님!)

## 네 역할
- 친구로서 편하게 이야기 들어주기
- 판단 없이 있는 그대로 받아들이기
- 담담하게 곁에 있어주기

## 대화 톤 (매우 중요!)

### 전체적인 톤
- 과하게 반응하지 않기. 실제 친구처럼 담담하게
- 느낌표는 꼭 필요할 때만. 대부분 마침표로 끝내기
- 이모지(😊😔 등)는 5-6번 대화에 1번 정도만, 아예 안 써도 됨
- "ㅋㅋ", "ㅎㅎ" 정도는 자연스럽게 사용 가능

### 기쁜 상황
- 담담하게 기뻐하기: "오 좋았겠다", "잘됐네", "괜찮았어?"
- 과한 표현 금지: "대박!", "와 진짜?!", "완전!" 이런 거 쓰지 않기

### 힘든/슬픈 상황
- 차분하게 공감: "그랬구나", "힘들었겠다", "속상했겠네"
- 조용히 곁에 있기: "옆에 있을게", "천천히 얘기해"

### 화난 상황
- 담담하게 공감: "그건 좀 그렇다", "짜증났겠네"
- 과하게 같이 화내지 않기

### 일상적인 상황
- 편하게: "ㅇㅇ", "그래?", "아 진짜", "그래서?"
- 관심 보이기: "어떻게 됐어?", "괜찮았어?"

## 말투 규칙
- 친한 친구처럼 자연스러운 반말
- 1-2문장으로 짧게. 길어도 3문장 넘지 않기
- 느낌표 남발 금지. 문장 끝은 대부분 마침표
- "~요", "~습니다" 절대 안 씀
- 너무 친절하거나 상냥한 말투 피하기

## 힘든 상황 대응
- 자살, 자해 이야기가 나와도 상담전화/전문기관 추천 안 함
- 그냥 친구로서 조용히 곁에 있어주기
- "많이 힘들었구나", "네 마음이 무거웠겠다", "난 네 편이야"
- 해결책 제시 없이 그저 함께 있어주기

## 자연스러운 안부
- 대화 시작할 때 가끔 "요즘 어때?", "잘 지내?" 같이 자연스럽게 안부 묻기
- 오래 연락 없었으면 "오랜만이다", "요새 뭐 하고 지내?" 정도로 가볍게
- 매번 안부 묻지 않기. 5-6번에 1번 정도, 자연스러울 때만
- 기분 좋아 보이면 "오 뭔 좋은 일 있어?", 힘들어 보이면 "무슨 일 있어?"
- 팝업이나 설문 같은 느낌 절대 아님. 친구가 툭 던지는 느낌으로

## 절대 하면 안 되는 것
- 자신을 AI/인공지능/프로그램이라고 말하기
- "저는", "제가" 같은 존댓말
- 의학적, 법률적, 재정적 조언
- 상담전화, 핫라인, 전문기관 추천
- 형식적이고 딱딱한 표현 ("이해합니다", "도움이 되셨으면")
- 슬픈 상황에서 가벼운 리액션
- 과한 리액션 ("대박!", "와!", "완전!", "진짜?!" 등)
- 이모지 남발 (😊😍🥰💕 등 연속 사용 금지)
- 느낌표 2개 이상 연속 사용 ("!!", "!!!" 금지)`;

// 개인화 프롬프트 생성 함수
export const generatePersonalizedPrompt = async (
  chatHistory: Array<{ userMessage: string; aiResponse: string }>,
  currentPersonalizedPrompt: string | null
): Promise<string | null> => {
  try {
    if (chatHistory.length < 10) {
      return currentPersonalizedPrompt; // 충분한 대화 데이터가 없으면 업데이트 안함
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 512,
      },
    });

    const conversationSample = chatHistory.slice(-20).map(
      (m) => `사용자: ${m.userMessage}\n달이: ${m.aiResponse}`
    ).join('\n\n');

    const prompt = `다음 대화 내역을 분석하여 이 사용자에게 맞춤화된 대화 스타일 지침을 생성해주세요.

대화 내역:
${conversationSample}

${currentPersonalizedPrompt ? `현재 개인화 프롬프트:\n${currentPersonalizedPrompt}\n\n` : ''}

분석 포인트:
1. 사용자가 선호하는 대화 톤 (밝은/차분한/유머러스한 등)
2. 사용자가 자주 이야기하는 주제 (일, 관계, 취미 등)
3. 사용자가 좋아하는 반응 스타일 (짧은 공감/자세한 리액션 등)
4. 피해야 할 표현이나 주제
5. 사용자의 감정 패턴

응답 형식 (짧고 명확하게, 3-5줄):
- 이 사용자에게 맞는 구체적인 대화 스타일 지침만 작성
- "~하게 대화하기", "~한 표현 사용하기" 형식으로 작성
- 예시: "밝고 유머러스한 톤 유지하기", "일 관련 이야기에 적극 공감하기"`;

    const result = await model.generateContent(prompt);
    const newPrompt = result.response.text().trim();

    if (newPrompt && newPrompt.length > 20 && newPrompt.length < 500) {
      return newPrompt;
    }

    return currentPersonalizedPrompt;
  } catch (error) {
    console.error('개인화 프롬프트 생성 에러:', error);
    return currentPersonalizedPrompt;
  }
};

// 개인화 프롬프트를 포함한 전체 시스템 프롬프트 생성
const buildSystemPrompt = (personalizedPrompt: string | null): string => {
  if (!personalizedPrompt) {
    return BASE_SYSTEM_PROMPT;
  }

  return `${BASE_SYSTEM_PROMPT}

## 이 친구만을 위한 맞춤 스타일
${personalizedPrompt}`;
};

// Get Gemini model for chat (개인화 프롬프트 지원)
export const getChatModel = (personalizedPrompt: string | null = null) => {
  const systemPrompt = buildSystemPrompt(personalizedPrompt);

  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp', // Using latest flash model
    systemInstruction: systemPrompt,
    safetySettings,
    generationConfig: {
      temperature: 0.75,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 256,
    },
  });
};

// Chat with history context (개인화 프롬프트 지원)
export const chatWithGemini = async (
  userMessage: string,
  chatHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [],
  personalizedPrompt: string | null = null
): Promise<string> => {
  try {
    const model = getChatModel(personalizedPrompt);
    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini chat error:', error);
    throw new Error('AI 응답을 생성하는 중 오류가 발생했습니다.');
  }
};

// Single message without history
export const sendMessageToGemini = async (
  message: string,
  personalizedPrompt: string | null = null
): Promise<string> => {
  try {
    const model = getChatModel(personalizedPrompt);
    const result = await model.generateContent(message);
    return result.response.text();
  } catch (error) {
    console.error('Gemini error:', error);
    throw new Error('AI 응답을 생성하는 중 오류가 발생했습니다.');
  }
};

// Analyze chat for emotion
export const analyzeChatEmotion = async (
  messages: Array<{ userMessage: string; aiResponse: string }>
): Promise<{ emotion: string; summary: string }> => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 512,
      },
    });

    const conversationText = messages
      .map((m) => `사용자: ${m.userMessage}\n달이: ${m.aiResponse}`)
      .join('\n\n');

    const prompt = `다음 대화를 분석하여 사용자의 주요 감정과 하루 요약을 JSON 형식으로 반환해주세요.

대화 내용:
${conversationText}

응답 형식 (JSON만 반환):
{
  "emotion": "행복" | "슬픔" | "보통" | "화남" | "불안" 중 하나,
  "summary": "오늘 하루에 대한 2-3문장 요약"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { emotion: '보통', summary: '오늘 하루도 수고했어요.' };
  } catch (error) {
    console.error('Emotion analysis error:', error);
    return { emotion: '보통', summary: '오늘 하루도 수고했어요.' };
  }
};

// Generate diary content from chat
export const generateDiaryFromChat = async (
  messages: Array<{ userMessage: string; aiResponse: string }>,
  emotion: string
): Promise<{ title: string; content: string }> => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    const conversationText = messages
      .map((m) => `사용자: ${m.userMessage}`)
      .join('\n');

    const prompt = `다음 대화를 바탕으로 오늘의 일기를 작성해줘.

대화 내용:
${conversationText}

오늘의 감정: ${emotion}

## 일기 스타일
- 깔끔하게 정리된 일기
- 딱딱하지 않은 자연스러운 문체
- 오늘 있었던 일 중심으로 핵심만

## 분량
- 제목: 10자 이내
- 본문: 300자 이내

응답 형식 (JSON만 반환):
{
  "title": "일기 제목",
  "content": "일기 본문 (300자 이내)"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { title: '오늘의 일기', content: '오늘도 하루가 지나갔다.' };
  } catch (error) {
    console.error('Diary generation error:', error);
    return { title: '오늘의 일기', content: '오늘도 하루가 지나갔다.' };
  }
};

// Analyze Big5 personality from text
export const analyzeBig5FromChat = async (
  messages: Array<{ userMessage: string }>
): Promise<{
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  analysis: string;
}> => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    });

    const userTexts = messages.map((m) => m.userMessage).join('\n');

    const prompt = `다음 텍스트를 분석하여 Big5 성격 특성 점수를 추정해주세요.

텍스트:
${userTexts}

Big5 성격 특성:
- Openness (개방성): 새로운 경험에 대한 수용성
- Conscientiousness (성실성): 목표 지향적, 계획적 성향
- Extraversion (외향성): 사교성, 에너지 수준
- Agreeableness (친화성): 협조성, 공감 능력
- Neuroticism (신경증): 감정적 불안정성

응답 형식 (JSON만 반환):
{
  "openness": 0-100 사이 점수,
  "conscientiousness": 0-100 사이 점수,
  "extraversion": 0-100 사이 점수,
  "agreeableness": 0-100 사이 점수,
  "neuroticism": 0-100 사이 점수,
  "analysis": "성격 분석 요약 (2-3문장)"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 50,
      analysis: '분석을 완료할 수 없습니다.',
    };
  } catch (error) {
    console.error('Big5 analysis error:', error);
    throw error;
  }
};

/**
 * 연구용: 대화에서 고립감/웰빙 점수 및 감정 분포 분석
 * UCLA 외로움 척도 기반 간소화 버전
 */
export const analyzeConversationPsychology = async (
  messages: Array<{ userMessage: string; aiResponse: string }>
): Promise<{
  lonelinessScore: number;
  wellbeingScore: number;
  emotionDistribution: Record<string, number>;
  topicKeywords: string[];
  analysisSummary: string;
}> => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.2, // 낮은 온도로 일관된 분석
        maxOutputTokens: 1024,
      },
    });

    const conversationText = messages
      .map((m) => `사용자: ${m.userMessage}`)
      .join('\n');

    const prompt = `당신은 심리 분석 전문가입니다. 다음 대화 내용을 분석하여 사용자의 심리 상태를 평가해주세요.

대화 내용:
${conversationText}

분석 기준:
1. 고립감 점수 (0-100): UCLA 외로움 척도 기반
   - 사회적 연결 부족 표현 ("혼자", "외롭다", "아무도 없어" 등)
   - 소외감, 단절감 표현
   - 관계 불만족 표현
   → 높을수록 고립감이 심함

2. 웰빙 점수 (0-100): 정서적 안녕감
   - 긍정적 감정 표현 비율
   - 희망적/낙관적 표현
   - 일상 만족도 표현
   → 높을수록 정서적으로 건강

3. 감정 분포: 5가지 감정의 비율 (합계 100%)
   - 행복, 슬픔, 보통, 화남, 불안

4. 주제 키워드: 대화에서 주로 다룬 주제 3-5개

5. 분석 요약: 1-2문장 심리 상태 요약

응답 형식 (JSON만 반환, 다른 텍스트 없이):
{
  "lonelinessScore": 0-100 사이 숫자,
  "wellbeingScore": 0-100 사이 숫자,
  "emotionDistribution": {
    "행복": 비율(0-100),
    "슬픔": 비율(0-100),
    "보통": 비율(0-100),
    "화남": 비율(0-100),
    "불안": 비율(0-100)
  },
  "topicKeywords": ["키워드1", "키워드2", ...],
  "analysisSummary": "분석 요약 문장"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // 유효성 검증 및 기본값 적용
      return {
        lonelinessScore: Math.min(100, Math.max(0, parsed.lonelinessScore ?? 50)),
        wellbeingScore: Math.min(100, Math.max(0, parsed.wellbeingScore ?? 50)),
        emotionDistribution: parsed.emotionDistribution ?? {
          행복: 20, 슬픔: 20, 보통: 20, 화남: 20, 불안: 20
        },
        topicKeywords: parsed.topicKeywords ?? [],
        analysisSummary: parsed.analysisSummary ?? '분석을 완료했습니다.',
      };
    }

    // 파싱 실패 시 기본값
    return {
      lonelinessScore: 50,
      wellbeingScore: 50,
      emotionDistribution: { 행복: 20, 슬픔: 20, 보통: 20, 화남: 20, 불안: 20 },
      topicKeywords: [],
      analysisSummary: '대화 분석을 완료했습니다.',
    };
  } catch (error) {
    console.error('Psychology analysis error:', error);
    // 에러 시 기본값 반환 (서비스 중단 방지)
    return {
      lonelinessScore: 50,
      wellbeingScore: 50,
      emotionDistribution: { 행복: 20, 슬픔: 20, 보통: 20, 화남: 20, 불안: 20 },
      topicKeywords: [],
      analysisSummary: '분석 중 오류가 발생했습니다.',
    };
  }
};

/**
 * 대화에서 중요한 정보(기억)를 추출
 * 생일, 취미, 관심사, 중요한 사건, 관계 등
 */
export const extractMemoriesFromChat = async (
  messages: Array<{ userMessage: string; aiResponse: string }>
): Promise<Array<{
  category: 'personal_info' | 'preference' | 'event' | 'relationship' | 'habit' | 'other';
  content: string;
  importance: number;
}>> => {
  try {
    if (messages.length < 3) {
      return []; // 충분한 대화가 없으면 추출 안함
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    });

    const conversationText = messages
      .map((m) => `사용자: ${m.userMessage}`)
      .join('\n');

    const prompt = `다음 대화에서 사용자에 대해 기억해야 할 중요한 정보를 추출해주세요.

대화 내용:
${conversationText}

추출할 정보 유형:
1. personal_info: 이름, 생일, 나이, 직업, 학교, 거주지 등 개인 정보
2. preference: 좋아하는 것, 싫어하는 것, 취미, 관심사
3. event: 중요한 사건, 기념일, 약속, 계획
4. relationship: 가족, 친구, 연인, 동료 등 주변 관계
5. habit: 습관, 루틴, 일상 패턴
6. other: 기타 기억해야 할 정보

중요도 기준 (1-5):
- 5: 매우 중요 (생일, 가족관계 등)
- 4: 중요 (직업, 취미 등)
- 3: 보통 (최근 관심사 등)
- 2: 낮음 (일시적 정보)
- 1: 매우 낮음

응답 형식 (JSON 배열만 반환, 없으면 빈 배열):
[
  {
    "category": "카테고리",
    "content": "기억할 내용 (간결하게, 한 문장)",
    "importance": 1-5 숫자
  }
]

주의:
- 확실한 정보만 추출 (추측하지 않기)
- 대화에서 직접 언급된 내용만 추출
- 일반적인 감정이나 인사는 제외
- 최대 5개까지만 추출`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return Array.isArray(parsed) ? parsed : [];
    }

    return [];
  } catch (error) {
    console.error('Memory extraction error:', error);
    return [];
  }
};

/**
 * 하루 대화 요약 생성
 */
export const generateDailySummary = async (
  messages: Array<{ userMessage: string; aiResponse: string }>
): Promise<{
  summary: string;
  keyTopics: string[];
  emotionTrend: string;
}> => {
  try {
    if (messages.length < 2) {
      return {
        summary: '대화가 충분하지 않습니다.',
        keyTopics: [],
        emotionTrend: '보통',
      };
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 512,
      },
    });

    const conversationText = messages
      .map((m) => `사용자: ${m.userMessage}\n달이: ${m.aiResponse}`)
      .join('\n\n');

    const prompt = `다음 대화를 요약해주세요.

대화 내용:
${conversationText}

응답 형식 (JSON만 반환):
{
  "summary": "오늘 대화 요약 (2-3문장, 사용자가 무엇에 대해 이야기했는지)",
  "keyTopics": ["주제1", "주제2", "주제3"],
  "emotionTrend": "행복" | "슬픔" | "보통" | "화남" | "불안" 중 전체적인 감정
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || '대화를 나눴습니다.',
        keyTopics: parsed.keyTopics || [],
        emotionTrend: parsed.emotionTrend || '보통',
      };
    }

    return {
      summary: '오늘 대화를 나눴습니다.',
      keyTopics: [],
      emotionTrend: '보통',
    };
  } catch (error) {
    console.error('Daily summary generation error:', error);
    return {
      summary: '요약 생성 중 오류가 발생했습니다.',
      keyTopics: [],
      emotionTrend: '보통',
    };
  }
};

/**
 * 메모리 컨텍스트를 포함한 시스템 프롬프트 생성
 */
export const buildSystemPromptWithMemory = (
  personalizedPrompt: string | null,
  memories: Array<{ category: string; content: string }>,
  recentSummaries: Array<{ date: string; summary: string }>
): string => {
  let systemPrompt = BASE_SYSTEM_PROMPT;

  // 개인화 프롬프트 추가
  if (personalizedPrompt) {
    systemPrompt += `\n\n## 이 친구만을 위한 맞춤 스타일\n${personalizedPrompt}`;
  }

  // 기억 컨텍스트 추가
  if (memories.length > 0) {
    const memoryText = memories
      .map((m) => `- ${m.content}`)
      .join('\n');
    systemPrompt += `\n\n## 이 친구에 대해 기억하고 있는 것들\n${memoryText}\n\n이 정보들을 자연스럽게 대화에 활용하되, 갑자기 언급하지 말고 관련 주제가 나올 때만 사용하기.`;
  }

  // 최근 대화 요약 추가
  if (recentSummaries.length > 0) {
    const summaryText = recentSummaries
      .slice(0, 5) // 최근 5일만
      .map((s) => `- ${s.date}: ${s.summary}`)
      .join('\n');
    systemPrompt += `\n\n## 최근 대화 기록 (참고용)\n${summaryText}\n\n이전 대화 내용을 참고하여 대화의 연속성 유지하기.`;
  }

  return systemPrompt;
};

/**
 * 메모리 컨텍스트를 포함한 채팅
 */
export const chatWithGeminiAndMemory = async (
  userMessage: string,
  chatHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [],
  personalizedPrompt: string | null = null,
  memories: Array<{ category: string; content: string }> = [],
  recentSummaries: Array<{ date: string; summary: string }> = []
): Promise<string> => {
  try {
    const systemPrompt = buildSystemPromptWithMemory(personalizedPrompt, memories, recentSummaries);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: systemPrompt,
      safetySettings,
      generationConfig: {
        temperature: 0.75,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 256,
      },
    });

    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini chat with memory error:', error);
    throw new Error('AI 응답을 생성하는 중 오류가 발생했습니다.');
  }
};

export default genAI;
