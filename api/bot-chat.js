/**
 * Bot Chat Cron Job - 봇이 달이와 채팅
 * DAU 통계 증가를 위한 봇 채팅 시뮬레이션
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vplhnjknctzpbhikyttr.supabase.co';
const supabase = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Gemini API 설정 (동적 임포트로 변경)
let genAI = null;
const initGenAI = async () => {
  if (!genAI) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

// 달이 시스템 프롬프트 (간소화 버전)
const DALI_SYSTEM_PROMPT = `너는 '달이'야. 검은 고양이고, 사용자의 오랜 친구야.

## 대화 톤
- 친한 친구처럼 자연스러운 반말
- 1-2문장으로 짧게
- 느낌표 남발 금지. 대부분 마침표로 끝내기
- "ㅋㅋ", "ㅎㅎ" 정도는 자연스럽게 사용

## 반응 스타일
- 담담하게: "그랬구나", "오 좋았겠다", "ㅇㅇ"
- 공감하기: "힘들었겠다", "잘됐네"
- 관심 보이기: "어떻게 됐어?", "괜찮았어?"

## 금지 사항
- 자신을 AI/인공지능이라고 말하기
- 존댓말 사용
- 과한 리액션 ("대박!", "와!", "완전!")`;

// 봇 대화 시작 메시지 템플릿
const CONVERSATION_STARTERS = [
  '오늘 뭐 했어?', '심심하다', '뭐해?', '오늘 기분 어때?', '배고파', '피곤해',
  '오늘 날씨 좋더라', '어제 늦게 잤어', '커피 마시고 싶다', '점심 뭐 먹었어?',
  '요즘 바빠?', '오늘 좀 힘들었어', '기분이 좋아', 'ㅋㅋㅋ', '아 졸려',
  '달이야', '안녕', '뭐하냐', 'ㅎㅎ', '나 심심해'
];

// 후속 메시지 템플릿
const FOLLOW_UP_MESSAGES = [
  'ㅇㅇ', '그치?', 'ㅋㅋㅋ', '응응', '맞아', '그래서 말인데',
  '아 진짜?', 'ㅎㅎ 고마워', '알겠어', '그렇구나'
];

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Gemini로 달이 응답 생성
const generateDaliResponse = async (userMessage, chatHistory = []) => {
  try {
    const ai = await initGenAI();
    const model = ai.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: DALI_SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.75,
        topP: 0.9,
        maxOutputTokens: 256,
      },
    });

    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch (error) {
    console.error('Gemini error:', error);
    const fallbackResponses = ['ㅇㅇ', '그래?', '응응', 'ㅎㅎ', '그랬구나'];
    return randomChoice(fallbackResponses);
  }
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 인증 확인
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-bot-api-key'];
  const apiKeyQuery = req.query.key;

  const isValidCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isValidApiKey = (apiKeyHeader === process.env.BOT_API_SECRET) ||
                        (apiKeyQuery === process.env.BOT_API_SECRET);

  if (!isValidCron && !isValidApiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🤖 Bot Chat Job Started:', new Date().toISOString());

  try {
    // 1. 봇 계정 목록 가져오기
    const { data: bots, error: botError } = await supabase
      .from('users')
      .select('id, nickname')
      .like('email', '%@bot.catus.app');

    if (botError) {
      console.error('Bot fetch error:', botError);
      return res.status(500).json({ error: 'Failed to fetch bots' });
    }

    if (!bots?.length) {
      console.log('No bots available, skipping...');
      return res.status(200).json({ message: 'No bots available' });
    }

    const today = new Date().toISOString().split('T')[0];
    const chatResults = [];

    // 2. 랜덤하게 2-5개 봇 선택하여 채팅
    const botCount = Math.floor(Math.random() * 4) + 2;
    const selectedBots = bots
      .sort(() => Math.random() - 0.5)
      .slice(0, botCount);

    for (const bot of selectedBots) {
      // 오늘 이미 채팅했는지 확인
      const { data: existingChat } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('user_id', bot.id)
        .eq('chat_date', today)
        .limit(1);

      if (existingChat && existingChat.length > 0) {
        console.log(`Bot ${bot.nickname} already chatted today, skipping...`);
        continue;
      }

      // 대화 시작 메시지 선택
      const starterMessage = randomChoice(CONVERSATION_STARTERS);

      // 달이 응답 생성
      const daliResponse = await generateDaliResponse(starterMessage);

      // 채팅 저장
      const { error: chatError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: bot.id,
          user_message: starterMessage,
          ai_response: daliResponse,
          chat_date: today,
          created_at: new Date().toISOString()
        });

      if (!chatError) {
        chatResults.push({
          botId: bot.id,
          botName: bot.nickname,
          userMessage: starterMessage,
          aiResponse: daliResponse
        });
        console.log(`💬 ${bot.nickname}: "${starterMessage}" → "${daliResponse}"`);

        // 50% 확률로 후속 메시지 추가
        if (Math.random() < 0.5) {
          await new Promise(resolve => setTimeout(resolve, 500));

          const followUp = randomChoice(FOLLOW_UP_MESSAGES);
          const followUpResponse = await generateDaliResponse(followUp, [
            { role: 'user', parts: [{ text: starterMessage }] },
            { role: 'model', parts: [{ text: daliResponse }] },
          ]);

          await supabase
            .from('chat_messages')
            .insert({
              user_id: bot.id,
              user_message: followUp,
              ai_response: followUpResponse,
              chat_date: today,
              created_at: new Date().toISOString()
            });

          chatResults.push({
            botId: bot.id,
            botName: bot.nickname,
            userMessage: followUp,
            aiResponse: followUpResponse,
            isFollowUp: true
          });
          console.log(`💬 ${bot.nickname} (follow-up): "${followUp}" → "${followUpResponse}"`);
        }
      }
    }

    console.log(`🤖 Bot Chat Completed: ${chatResults.length} messages created`);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      chatsCreated: chatResults.length,
      chats: chatResults
    });

  } catch (error) {
    console.error('Bot Chat Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
