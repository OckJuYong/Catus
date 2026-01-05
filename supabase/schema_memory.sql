-- Catus Memory System Schema
-- Run this in Supabase SQL Editor AFTER running schema.sql

-- ============================================
-- 1. USER MEMORIES TABLE (장기 기억 저장)
-- ============================================
CREATE TABLE IF NOT EXISTS user_memories (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('personal_info', 'preference', 'event', 'relationship', 'habit', 'other')),
    content TEXT NOT NULL,
    importance INTEGER DEFAULT 3 CHECK (importance >= 1 AND importance <= 5),
    source_date DATE DEFAULT CURRENT_DATE,
    last_mentioned DATE DEFAULT CURRENT_DATE,
    mention_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_memories
CREATE INDEX IF NOT EXISTS idx_user_memories_user ON user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_importance ON user_memories(user_id, importance DESC);
CREATE INDEX IF NOT EXISTS idx_user_memories_last_mentioned ON user_memories(user_id, last_mentioned DESC);

-- ============================================
-- 2. CHAT SUMMARIES TABLE (일일 대화 요약)
-- ============================================
CREATE TABLE IF NOT EXISTS chat_summaries (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    summary_date DATE NOT NULL,
    summary TEXT NOT NULL,
    key_topics TEXT[] DEFAULT '{}',
    emotion_trend TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, summary_date)
);

-- Index for chat_summaries
CREATE INDEX IF NOT EXISTS idx_chat_summaries_user_date ON chat_summaries(user_id, summary_date DESC);

-- ============================================
-- 3. RLS POLICIES (커스텀 인증 호환)
-- ============================================

-- Enable RLS
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_summaries ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (이미 존재하는 경우)
DROP POLICY IF EXISTS "Users can view own memories" ON user_memories;
DROP POLICY IF EXISTS "Users can insert own memories" ON user_memories;
DROP POLICY IF EXISTS "Users can update own memories" ON user_memories;
DROP POLICY IF EXISTS "Users can delete own memories" ON user_memories;
DROP POLICY IF EXISTS "Users can view own summaries" ON chat_summaries;
DROP POLICY IF EXISTS "Users can insert own summaries" ON chat_summaries;
DROP POLICY IF EXISTS "Users can update own summaries" ON chat_summaries;

-- user_memories policies (커스텀 인증 지원)
-- Supabase Auth 사용자: auth.uid() = user_id
-- 커스텀 인증 사용자: user_id가 users 테이블에 존재하면 허용
CREATE POLICY "Users can view own memories"
    ON user_memories FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM users WHERE users.id = user_memories.user_id)
    );

CREATE POLICY "Users can insert own memories"
    ON user_memories FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM users WHERE users.id = user_memories.user_id)
    );

CREATE POLICY "Users can update own memories"
    ON user_memories FOR UPDATE
    USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM users WHERE users.id = user_memories.user_id)
    );

CREATE POLICY "Users can delete own memories"
    ON user_memories FOR DELETE
    USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM users WHERE users.id = user_memories.user_id)
    );

-- chat_summaries policies (커스텀 인증 지원)
CREATE POLICY "Users can view own summaries"
    ON chat_summaries FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM users WHERE users.id = chat_summaries.user_id)
    );

CREATE POLICY "Users can insert own summaries"
    ON chat_summaries FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM users WHERE users.id = chat_summaries.user_id)
    );

CREATE POLICY "Users can update own summaries"
    ON chat_summaries FOR UPDATE
    USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM users WHERE users.id = chat_summaries.user_id)
    );

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Function to increment mention_count
CREATE OR REPLACE FUNCTION increment_mention_count(row_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE user_memories
    SET mention_count = mention_count + 1,
        last_mentioned = CURRENT_DATE,
        updated_at = NOW()
    WHERE id = row_id
    RETURNING mention_count INTO new_count;

    RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_memories_updated_at
    BEFORE UPDATE ON user_memories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
