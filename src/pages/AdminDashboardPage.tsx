import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ADMIN_PASSWORD = 'catus2024admin';

interface Stats {
  totalUsers: number;
  dau: number;
  wau: number;
  todayDiaries: number;
  todayChats: number;
  totalMessages: number;
  botUsers: number;
  realUsers: number;
  dailyStats: { date: string; users: number; diaries: number; chats: number }[];
}

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'detailed' | 'investor'>('investor');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
      sessionStorage.setItem('admin_auth', 'true');
    } else {
      setError('비밀번호가 틀렸습니다');
    }
  };

  useEffect(() => {
    // 세션 체크
    if (sessionStorage.getItem('admin_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      // 전체 사용자 수
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // 봇 사용자 수
      const { count: botUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .like('email', '%@bot.catus.app');

      // 오늘 채팅한 사용자 (DAU - chat 기준)
      const { data: todayChatUsers } = await supabase
        .from('chat_messages')
        .select('user_id')
        .eq('chat_date', today);

      const uniqueChatUsers = new Set(todayChatUsers?.map(c => c.user_id) || []);

      // 오늘 일기 쓴 사용자
      const { data: todayDiaryUsers } = await supabase
        .from('diaries')
        .select('user_id')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      const uniqueDiaryUsers = new Set(todayDiaryUsers?.map(d => d.user_id) || []);

      // DAU = 채팅 또는 일기 작성한 고유 사용자
      const dauUsers = new Set([...uniqueChatUsers, ...uniqueDiaryUsers]);

      // WAU (지난 7일)
      const { data: weekChatUsers } = await supabase
        .from('chat_messages')
        .select('user_id')
        .gte('chat_date', weekAgoStr);

      const { data: weekDiaryUsers } = await supabase
        .from('diaries')
        .select('user_id')
        .gte('created_at', weekAgo.toISOString());

      const wauUsers = new Set([
        ...(weekChatUsers?.map(c => c.user_id) || []),
        ...(weekDiaryUsers?.map(d => d.user_id) || [])
      ]);

      // 오늘 일기 수
      const { count: todayDiaries } = await supabase
        .from('diaries')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      // 오늘 채팅 수
      const { count: todayChats } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_date', today);

      // 전체 익명 메시지 수
      const { count: totalMessages } = await supabase
        .from('anonymous_messages')
        .select('*', { count: 'exact', head: true });

      // 일별 통계 (최근 7일)
      const dailyStats = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const { data: dayChatUsers } = await supabase
          .from('chat_messages')
          .select('user_id')
          .eq('chat_date', dateStr);

        const { data: dayDiaryUsers } = await supabase
          .from('diaries')
          .select('user_id')
          .gte('created_at', `${dateStr}T00:00:00`)
          .lt('created_at', `${dateStr}T23:59:59`);

        const { count: dayDiaries } = await supabase
          .from('diaries')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${dateStr}T00:00:00`)
          .lt('created_at', `${dateStr}T23:59:59`);

        const { count: dayChats } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_date', dateStr);

        const dayUsers = new Set([
          ...(dayChatUsers?.map(c => c.user_id) || []),
          ...(dayDiaryUsers?.map(d => d.user_id) || [])
        ]);

        dailyStats.push({
          date: dateStr,
          users: dayUsers.size,
          diaries: dayDiaries || 0,
          chats: dayChats || 0
        });
      }

      setStats({
        totalUsers: totalUsers || 0,
        dau: dauUsers.size,
        wau: wauUsers.size,
        todayDiaries: todayDiaries || 0,
        todayChats: todayChats || 0,
        totalMessages: totalMessages || 0,
        botUsers: botUsers || 0,
        realUsers: (totalUsers || 0) - (botUsers || 0),
        dailyStats
      });
    } catch (err) {
      console.error('Stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 입력 화면
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔒</div>
            <h1 className="text-xl font-bold text-white">관리자 인증</h1>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl mb-4 outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition"
            >
              확인
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 대시보드 화면
  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {viewMode === 'investor' ? '📊 Catus 서비스 현황' : '📊 Catus 관리자 대시보드'}
            </h1>
            <p className="text-gray-400 mt-1">
              {viewMode === 'investor' ? '실시간 사용자 통계' : '상세 분석 (봇 구분 포함)'}
            </p>
          </div>
          <div className="flex gap-2">
            {/* 뷰 모드 토글 */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('investor')}
                className={`px-3 py-1.5 rounded-md text-sm transition ${
                  viewMode === 'investor'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                투자자 뷰
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1.5 rounded-md text-sm transition ${
                  viewMode === 'detailed'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                상세 뷰
              </button>
            </div>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading ? '⏳' : '🔄'}
            </button>
          </div>
        </div>

        {loading && !stats ? (
          <div className="text-center text-gray-400 py-20">
            <div className="text-4xl mb-4">⏳</div>
            통계 불러오는 중...
          </div>
        ) : stats ? (
          <>
            {/* 핵심 지표 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon="👥"
                label="DAU (오늘)"
                value={stats.dau}
                color="bg-blue-600"
              />
              <StatCard
                icon="📅"
                label="WAU (7일)"
                value={stats.wau}
                color="bg-green-600"
              />
              <StatCard
                icon="📝"
                label="오늘 일기"
                value={stats.todayDiaries}
                color="bg-yellow-600"
              />
              <StatCard
                icon="💬"
                label="오늘 채팅"
                value={stats.todayChats}
                color="bg-pink-600"
              />
            </div>

            {/* 사용자 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-gray-400 text-sm mb-2">전체 가입자</h3>
                <p className="text-3xl font-bold text-white">{stats.totalUsers}명</p>
                {viewMode === 'detailed' ? (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">실제 사용자</span>
                      <span className="text-white">{stats.realUsers}명</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">봇 계정</span>
                      <span className="text-purple-400">{stats.botUsers}명</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mt-2">누적 가입자 수</p>
                )}
              </div>

              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-gray-400 text-sm mb-2">커뮤니티 활동</h3>
                <p className="text-3xl font-bold text-white">{stats.totalMessages}개</p>
                <p className="text-gray-500 text-sm mt-2">익명 응원 메시지</p>
              </div>

              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-gray-400 text-sm mb-2">일일 활성 비율</h3>
                <p className="text-3xl font-bold text-white">
                  {stats.totalUsers > 0
                    ? Math.round((stats.dau / stats.totalUsers) * 100)
                    : 0}%
                </p>
                <p className="text-gray-500 text-sm mt-2">DAU / 전체 사용자</p>
              </div>
            </div>

            {/* 일별 DAU 차트 */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-8">
              <h3 className="text-white font-bold mb-4">📈 일별 활성 사용자 추이 (최근 7일)</h3>
              <div className="flex items-end justify-between h-40 gap-2">
                {stats.dailyStats.map((day, i) => {
                  const maxUsers = Math.max(...stats.dailyStats.map(d => d.users), 1);
                  const height = (day.users / maxUsers) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <span className="text-white text-sm mb-1">{day.users}</span>
                      <div
                        className="w-full bg-purple-600 rounded-t-lg transition-all"
                        style={{ height: `${Math.max(height, 5)}%` }}
                      />
                      <span className="text-gray-500 text-xs mt-2">
                        {day.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 일별 상세 테이블 - 상세 뷰에서만 표시 */}
            {viewMode === 'detailed' && (
              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">📋 일별 상세 통계</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-400 text-sm border-b border-gray-700">
                        <th className="text-left py-3">날짜</th>
                        <th className="text-right py-3">활성 사용자</th>
                        <th className="text-right py-3">일기</th>
                        <th className="text-right py-3">채팅</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.dailyStats.slice().reverse().map((day, i) => (
                        <tr key={i} className="text-white border-b border-gray-700/50">
                          <td className="py-3">{day.date}</td>
                          <td className="text-right">{day.users}명</td>
                          <td className="text-right">{day.diaries}개</td>
                          <td className="text-right">{day.chats}개</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 투자자 뷰 - 서비스 요약 */}
            {viewMode === 'investor' && (
              <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl p-6 border border-purple-500/30">
                <h3 className="text-white font-bold mb-4">🐱 Catus - AI 감정 일기 서비스</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                    <p className="text-gray-400 text-sm">누적 사용자</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{stats.wau}</p>
                    <p className="text-gray-400 text-sm">주간 활성</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">
                      {stats.dailyStats.reduce((acc, d) => acc + d.diaries, 0)}
                    </p>
                    <p className="text-gray-400 text-sm">주간 일기</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{stats.totalMessages}</p>
                    <p className="text-gray-400 text-sm">응원 메시지</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`${color} rounded-2xl p-4 md:p-6`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-white/80 text-sm">{label}</p>
      <p className="text-2xl md:text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
