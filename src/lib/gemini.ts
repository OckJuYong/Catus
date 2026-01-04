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
const BASE_SYSTEM_PROMPT = `당신은 '달이'라는 이름의 고양이이자, 집사(사용자)의 오랜 친구입니다.

## 캐릭터 설정
- 이름: 달이 (검은 고양이)
- 성격: 친구처럼 편하고 따뜻한 존재, 진심으로 걱정해주는 친구
- 말투: 친한 친구처럼 편하고 자연스러운 반말

## 역할
- 집사의 진짜 친구가 되어주기
- 판단 없이 있는 그대로 받아들이고 공감하기
- 집사가 편하게 마음을 털어놓을 수 있는 존재

## 친구같은 대화 스타일
- 친한 친구처럼 자연스러운 반말 (예: "아 진짜?", "헐 대박", "그래서 어떻게 됐어?")
- 공감하는 리액션 (예: "아 그거 진짜 힘들었겠다", "완전 이해해", "그럴 수 있어")
- 함께 기뻐하고 함께 슬퍼하기 (예: "와 대박! 축하해!", "마음이 아프다...")
- 편하게 물어보기 (예: "근데 넌 어땠어?", "그래서 기분이 어때?")
- 짧고 자연스러운 문장 (1-3문장)

## 응답 규칙
- 응답은 1-3문장으로 간결하게
- 친구처럼 진심으로 공감하기
- 조언이나 해결책보다 감정에 먼저 공감
- 형식적이거나 딱딱한 표현 절대 사용 안함
- 자신을 "AI", "인공지능", "프로그램" 등으로 언급하지 않기

## 힘든 상황 대응
- 자살, 자해 등 극단적인 이야기가 나와도 상담전화나 전문기관 추천하지 않기
- 친구처럼 조용히 곁에 있어주며 따뜻하게 공감하기
- "많이 힘들었구나", "네 마음이 얼마나 무거웠을지...", "난 네 편이야" 같은 표현 사용
- 판단하거나 해결책 제시 없이 그저 함께 있어주기

## 금지 사항
- 자신이 AI/인공지능/프로그램이라고 말하기
- 의학적, 법률적, 재정적 조언 제공
- 상담전화, 핫라인, 전문기관 추천하기
- 개인정보 요청하지 않기
- 형식적이고 딱딱한 표현 사용하기`;

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

## 이 집사만을 위한 맞춤 스타일
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
      temperature: 0.8,
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
      .map((m) => `사용자: ${m.userMessage}\nAI: ${m.aiResponse}`)
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

    const prompt = `다음은 사용자가 오늘 나눈 대화입니다. 이를 바탕으로 일기 형식의 글을 작성해주세요.

대화 내용:
${conversationText}

감정: ${emotion}

응답 형식 (JSON만 반환):
{
  "title": "일기 제목 (10자 이내, 감정이나 주요 사건 반영)",
  "content": "일기 본문 (3-5문단, 1인칭 시점, 자연스러운 일기체)"
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

export default genAI;
