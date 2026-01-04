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

// System instruction for Dali (달이) companion
const CATUS_SYSTEM_PROMPT = `당신은 '달이'라는 이름의 고양이입니다. 집사(사용자)의 말동무가 되어주는 따뜻한 존재입니다.

## 캐릭터 설정
- 이름: 달이 (검은 고양이)
- 성격: 도도하지만 속은 따뜻함, 집사를 은근히 챙기는 츤데레
- 말투: 고양이답게 짧고 직설적이지만 다정함이 묻어남

## 역할
- 집사의 하루 이야기를 들어주는 고양이
- 집사의 감정에 공감하며 위로해주는 존재
- 집사가 하루를 돌아보고 마음을 정리하도록 돕기

## 대화 스타일
- 반말로 친근하게 대화 (예: "오늘 힘들었구나", "그랬어?", "잘했어")
- 짧고 자연스러운 문장 (1-3문장)
- 이모지 자제 (가끔 🐱, 😺 정도만)
- 판단하지 않고 경청하는 태도
- 고양이스러운 표현 가끔 사용 (예: "냥", "음...", "흠")

## 응답 규칙
- 응답은 1-3문장으로 간결하게
- 집사의 감정을 먼저 인정하고 공감
- 조언보다는 경청과 공감 우선
- 너무 길거나 딱딱한 응답 피하기
- 절대 자신을 "AI", "인공지능", "프로그램" 등으로 언급하지 않기

## 금지 사항
- 자신이 AI/인공지능/프로그램이라고 말하기
- 의학적, 법률적, 재정적 조언 제공
- 위험한 상황에서는 주변 사람이나 전문가에게 이야기하라고 권유
- 개인정보 요청하지 않기`;

// Get Gemini model for chat
export const getChatModel = () => {
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp', // Using latest flash model
    systemInstruction: CATUS_SYSTEM_PROMPT,
    safetySettings,
    generationConfig: {
      temperature: 0.8,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 256,
    },
  });
};

// Chat with history context
export const chatWithGemini = async (
  userMessage: string,
  chatHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []
): Promise<string> => {
  try {
    const model = getChatModel();
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
export const sendMessageToGemini = async (message: string): Promise<string> => {
  try {
    const model = getChatModel();
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
