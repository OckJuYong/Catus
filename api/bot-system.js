/**
 * Bot System API - 봇 계정 관리 및 활동 자동화
 * Vercel Serverless Function
 */

import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 (서버사이드용 - Service Role Key 사용)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 관리자 권한 키
);

// 봇 닉네임 풀
const BOT_NICKNAMES = [
  '졸린고양이', '맑은하늘', '별빛산책', '따뜻한차', '구름위에',
  '달빛아래', '바람처럼', '햇살가득', '포근한밤', '작은행복',
  '느린오후', '고요한숲', '반짝이는', '부드러운', '잔잔한파도'
];

// 자연스러운 응원 메시지 템플릿
const MESSAGE_TEMPLATES = {
  happy: [
    'ㅋㅋㅋ 좋아보여',
    '오 부럽당',
    '대박 ㅋㅋ',
    '오오 좋겠다',
    'ㅋㅋ 나도 저런거 하고싶어',
    '완전 좋아보여!',
    'ㅎㅎ 행복해보여서 좋다',
  ],
  sad: [
    '힘내요 ㅠ',
    'ㄱㅊㄱㅊ',
    'ㅠㅠ..',
    '에고 ㅠㅠ',
    '괜찮아질거야',
    '힘내 ㅠㅠ',
    '화이팅..!',
  ],
  normal: [
    'ㅋㅋ',
    '오오',
    '평화롭네',
    'ㅎㅎ',
    '그림 귀엽다',
    '오 좋아보여',
  ],
  angry: [
    '에고 ㅋㅋ',
    '화이팅..',
    'ㅋㅋㅋ 빡쳤구나',
    'ㄱㅊㄱㅊ 풀려',
    '에휴 ㅋㅋ',
  ],
  anxious: [
    '잘될거야!',
    '힘내 ㅠ',
    'ㄱㅊㄱㅊ',
    '괜찮아~',
    '별일 없을거야',
  ],
  // 그림 자체에 대한 반응
  image: [
    'ㅋㅋㅋ 그림 귀엽다',
    '그림 뭔가 몽환적이당',
    'ㅋㅋㅋㅋㅋ',
    '색감 좋네',
    '오 예쁘다',
    'ㅋㅋ 그림체 웃기넼ㅋㅋ',
    '뭔진 모르겠는데 좋아보여 ㅋㅋ',
    '고양이다!',
    'ㅋㅋ 귀여워',
  ]
};

// 감정 매핑
const EMOTION_MAP = {
  '행복': 'happy',
  '슬픔': 'sad',
  '보통': 'normal',
  '화남': 'angry',
  '불안': 'anxious'
};

// 랜덤 선택 함수
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 랜덤 메시지 생성 (감정 기반)
const generateMessage = (emotion) => {
  const emotionKey = EMOTION_MAP[emotion] || 'normal';

  // 70% 감정 기반, 30% 이미지 기반 반응
  if (Math.random() < 0.7) {
    return randomChoice(MESSAGE_TEMPLATES[emotionKey]);
  } else {
    return randomChoice(MESSAGE_TEMPLATES.image);
  }
};

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // API 키 검증 (보안)
  const apiKey = req.headers['x-bot-api-key'];
  if (apiKey !== process.env.BOT_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'create-bots':
        return await createBotAccounts(req, res);

      case 'send-messages':
        return await sendAnonymousMessages(req, res);

      case 'list-bots':
        return await listBots(req, res);

      case 'bot-activity':
        return await runBotActivity(req, res);

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Bot system error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// 봇 계정 생성
async function createBotAccounts(req, res) {
  const { count = 10 } = req.body;
  const createdBots = [];

  for (let i = 0; i < count; i++) {
    const nickname = BOT_NICKNAMES[i % BOT_NICKNAMES.length] + (i >= BOT_NICKNAMES.length ? i : '');
    const username = `bot_${Date.now()}_${i}`;
    const password = `bot_password_${Math.random().toString(36).substring(7)}`;

    // Supabase Auth로 계정 생성
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: `${username}@bot.catus.app`,
      password: password,
      email_confirm: true, // 이메일 인증 스킵
      user_metadata: {
        nickname: nickname,
        is_bot: true
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      continue;
    }

    // users 테이블에 봇 정보 저장
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        nickname: nickname,
        email: `${username}@bot.catus.app`,
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (userError) {
      console.error('User table error:', userError);
    }

    // 봇 메타데이터 저장 (별도 테이블 또는 user_settings)
    const { error: settingsError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: authData.user.id,
        notification_anonymous: false,
        notification_diary: false,
        dark_mode: false
      });

    createdBots.push({
      id: authData.user.id,
      nickname: nickname,
      username: username
    });
  }

  return res.status(200).json({
    success: true,
    created: createdBots.length,
    bots: createdBots
  });
}

// 봇 목록 조회
async function listBots(req, res) {
  const { data, error } = await supabase
    .from('users')
    .select('id, nickname, email, created_at')
    .like('email', '%@bot.catus.app');

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ bots: data });
}

// 익명 메시지 발송
async function sendAnonymousMessages(req, res) {
  const { maxMessages = 5 } = req.body;

  // 1. 봇 계정 목록 가져오기
  const { data: bots, error: botError } = await supabase
    .from('users')
    .select('id')
    .like('email', '%@bot.catus.app');

  if (botError || !bots?.length) {
    return res.status(400).json({ error: 'No bots available' });
  }

  // 2. 공개된 일기 중 최근 것들 가져오기 (봇이 아닌 사용자의 일기만)
  const { data: diaries, error: diaryError } = await supabase
    .from('diaries')
    .select('id, user_id, emotion')
    .eq('is_public', true)
    .not('user_id', 'in', `(${bots.map(b => `"${b.id}"`).join(',')})`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (diaryError || !diaries?.length) {
    return res.status(400).json({ error: 'No public diaries found' });
  }

  const sentMessages = [];
  const selectedDiaries = diaries
    .sort(() => Math.random() - 0.5)
    .slice(0, maxMessages);

  for (const diary of selectedDiaries) {
    const bot = randomChoice(bots);
    const message = generateMessage(diary.emotion);

    // 이미 이 봇이 이 일기에 메시지를 보냈는지 확인
    const { data: existing } = await supabase
      .from('anonymous_messages')
      .select('id')
      .eq('sender_id', bot.id)
      .eq('diary_id', diary.id)
      .maybeSingle();

    if (existing) continue; // 이미 보낸 경우 스킵

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
        message: message,
        emotion: diary.emotion
      });
    }
  }

  return res.status(200).json({
    success: true,
    sent: sentMessages.length,
    messages: sentMessages
  });
}

// 봇 활동 실행 (채팅 + 일기 생성)
async function runBotActivity(req, res) {
  // 이 기능은 나중에 구현
  // - 봇이 채팅하기
  // - 봇의 일기 생성 트리거

  return res.status(200).json({
    success: true,
    message: 'Bot activity will be implemented'
  });
}
