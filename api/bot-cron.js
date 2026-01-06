/**
 * Bot Cron Job - 매 3시간마다 실행
 * - 실사용자 일기에 익명 메시지 발송
 * - 봇 활동 시뮬레이션
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 자연스러운 응원 메시지 템플릿 (더 다양하게)
const MESSAGE_TEMPLATES = {
  happy: [
    'ㅋㅋㅋ 좋아보여', '오 부럽당', '대박 ㅋㅋ', '오오 좋겠다',
    '나도 저런거 하고싶어 ㅠ', '완전 좋아보여!', 'ㅎㅎ 행복해보여서 좋다',
    '우왕 ㅋㅋ', '헐 부럽 ㅠㅠ', '대박이당', '오 좋겠다 진짜',
    'ㅋㅋㅋㅋ 재밌겠다', '나도 ㅠㅠ', '부러워요 ㅎㅎ'
  ],
  sad: [
    '힘내요 ㅠ', 'ㄱㅊㄱㅊ', 'ㅠㅠ..', '에고 ㅠㅠ', '괜찮아질거야',
    '힘내 ㅠㅠ', '화이팅..!', '힘내세요!', 'ㅠㅠ 힘내', '괜찮아요',
    '좋은 일 있을거야', '에궁 ㅠ', '별일 아닐거야 ㅎㅎ'
  ],
  normal: [
    'ㅋㅋ', '오오', '평화롭네', 'ㅎㅎ', '그림 귀엽다', '오 좋아보여',
    'ㅋㅋㅋ', '오 ㅋㅋ', 'ㅎㅎㅎ', '좋다 ㅋㅋ', '평화로워 보여요',
    '일상 좋네요 ㅎ', '오오오'
  ],
  angry: [
    '에고 ㅋㅋ', '화이팅..', 'ㅋㅋㅋ 빡쳤구나', 'ㄱㅊㄱㅊ 풀려',
    '에휴 ㅋㅋ', '진정해요 ㅋㅋ', '에구구 ㅋㅋ', '화 풀어요~',
    'ㅋㅋㅋ 인정', '아이고 ㅋㅋ'
  ],
  anxious: [
    '잘될거야!', '힘내 ㅠ', 'ㄱㅊㄱㅊ', '괜찮아~', '별일 없을거야',
    '걱정마세요!', '다 잘될거에요', '화이팅!', '걱정 노노 ㅎ',
    '괜찮을거야 ㅎㅎ'
  ],
  image: [
    'ㅋㅋㅋ 그림 귀엽다', '그림 뭔가 몽환적이당', 'ㅋㅋㅋㅋㅋ',
    '색감 좋네', '오 예쁘다', 'ㅋㅋ 그림체 웃기넼ㅋㅋ',
    '뭔진 모르겠는데 좋아보여 ㅋㅋ', '고양이다!', 'ㅋㅋ 귀여워',
    '그림 이쁘당', '오 그림 좋다', 'ㅋㅋㅋ 뭐야 이거',
    '그림체 귀엽네요', 'ㅋㅋㅋㅋ 웃기다', '뭔가 예술적?ㅋㅋ',
    '오 몽환적이다', '색이 예쁘네', 'ㅋㅋ 뭔진 모르겠어도 좋아',
    '그림 스타일 좋아요 ㅎ'
  ]
};

const EMOTION_MAP = {
  '행복': 'happy',
  '슬픔': 'sad',
  '보통': 'normal',
  '화남': 'angry',
  '불안': 'anxious'
};

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateMessage = (emotion) => {
  const emotionKey = EMOTION_MAP[emotion] || 'normal';
  // 60% 감정 기반, 40% 이미지 기반
  if (Math.random() < 0.6) {
    return randomChoice(MESSAGE_TEMPLATES[emotionKey]);
  } else {
    return randomChoice(MESSAGE_TEMPLATES.image);
  }
};

export default async function handler(req, res) {
  // Vercel Cron 인증 확인
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // 로컬 테스트용 API 키 체크
    const apiKey = req.headers['x-bot-api-key'];
    if (apiKey !== process.env.BOT_API_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  console.log('🤖 Bot Cron Job Started:', new Date().toISOString());

  try {
    // 1. 봇 계정 목록 가져오기
    const { data: bots, error: botError } = await supabase
      .from('users')
      .select('id')
      .like('email', '%@bot.catus.app');

    if (botError) {
      console.error('Bot fetch error:', botError);
      return res.status(500).json({ error: 'Failed to fetch bots' });
    }

    if (!bots?.length) {
      console.log('No bots available, skipping...');
      return res.status(200).json({ message: 'No bots available' });
    }

    const botIds = bots.map(b => b.id);

    // 2. 최근 공개 일기 가져오기 (봇 제외, 최근 7일)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: diaries, error: diaryError } = await supabase
      .from('diaries')
      .select('id, user_id, emotion, created_at')
      .eq('is_public', true)
      .not('user_id', 'in', `(${botIds.map(id => `"${id}"`).join(',')})`)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(30);

    if (diaryError) {
      console.error('Diary fetch error:', diaryError);
      return res.status(500).json({ error: 'Failed to fetch diaries' });
    }

    if (!diaries?.length) {
      console.log('No public diaries found');
      return res.status(200).json({ message: 'No public diaries' });
    }

    // 3. 랜덤하게 3-7개 일기 선택
    const messageCount = Math.floor(Math.random() * 5) + 3; // 3-7개
    const selectedDiaries = diaries
      .sort(() => Math.random() - 0.5)
      .slice(0, messageCount);

    const sentMessages = [];

    for (const diary of selectedDiaries) {
      const bot = randomChoice(bots);
      const message = generateMessage(diary.emotion);

      // 중복 체크
      const { data: existing } = await supabase
        .from('anonymous_messages')
        .select('id')
        .eq('sender_id', bot.id)
        .eq('diary_id', diary.id)
        .maybeSingle();

      if (existing) continue;

      // 메시지 발송
      const { error: msgError } = await supabase
        .from('anonymous_messages')
        .insert({
          sender_id: bot.id,
          receiver_id: diary.user_id,
          diary_id: diary.id,
          content: message,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (!msgError) {
        sentMessages.push({
          diary_id: diary.id,
          message: message
        });
        console.log(`✉️ Sent: "${message}" to diary ${diary.id}`);
      }
    }

    console.log(`🤖 Bot Cron Completed: ${sentMessages.length} messages sent`);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      messagesSent: sentMessages.length,
      messages: sentMessages
    });

  } catch (error) {
    console.error('Bot Cron Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
