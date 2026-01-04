-- Catus Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kakao_id BIGINT UNIQUE,
    email TEXT,
    nickname TEXT NOT NULL,
    profile_image TEXT,
    password_hash TEXT, -- For additional security verification
    diary_generation_time TIME DEFAULT '21:00:00',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. USER SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    notification_anonymous BOOLEAN DEFAULT TRUE,
    notification_diary BOOLEAN DEFAULT TRUE,
    dark_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    chat_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_date ON chat_messages(user_id, chat_date);

-- ============================================
-- 4. DIARIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS diaries (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    diary_date DATE NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    content_preview TEXT, -- First 100 chars for list view
    emotion TEXT CHECK (emotion IN ('행복', '슬픔', '보통', '화남', '불안')),
    image_url TEXT,
    thumbnail_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE, -- For random diary feature
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, diary_date)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_diaries_user_date ON diaries(user_id, diary_date);
CREATE INDEX IF NOT EXISTS idx_diaries_public ON diaries(is_public) WHERE is_public = TRUE;

-- ============================================
-- 5. ANONYMOUS MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS anonymous_messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    diary_id BIGINT REFERENCES diaries(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON anonymous_messages(receiver_id, is_read);

-- ============================================
-- 6. BIG5 PERSONALITY SCORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS big5_scores (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    openness DECIMAL(4,2) CHECK (openness >= 0 AND openness <= 100),
    conscientiousness DECIMAL(4,2) CHECK (conscientiousness >= 0 AND conscientiousness <= 100),
    extraversion DECIMAL(4,2) CHECK (extraversion >= 0 AND extraversion <= 100),
    agreeableness DECIMAL(4,2) CHECK (agreeableness >= 0 AND agreeableness <= 100),
    neuroticism DECIMAL(4,2) CHECK (neuroticism >= 0 AND neuroticism <= 100),
    analysis TEXT, -- AI generated analysis
    source TEXT CHECK (source IN ('initial_test', 'chat_analysis', 'diary_analysis')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for history queries
CREATE INDEX IF NOT EXISTS idx_big5_user_date ON big5_scores(user_id, created_at);

-- ============================================
-- 7. REFRESH TOKENS TABLE (for JWT)
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- ============================================
-- 8. VERIFICATION CODES TABLE (for withdrawal)
-- ============================================
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diaries_updated_at
    BEFORE UPDATE ON diaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE big5_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Settings policies
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view own chats" ON chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chats" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Diaries policies
CREATE POLICY "Users can view own diaries" ON diaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public diaries" ON diaries
    FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can manage own diaries" ON diaries
    FOR ALL USING (auth.uid() = user_id);

-- Anonymous messages policies
CREATE POLICY "Users can view received messages" ON anonymous_messages
    FOR SELECT USING (auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON anonymous_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own received messages" ON anonymous_messages
    FOR UPDATE USING (auth.uid() = receiver_id);

-- Big5 scores policies
CREATE POLICY "Users can view own scores" ON big5_scores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scores" ON big5_scores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Refresh tokens policies
CREATE POLICY "Users can manage own tokens" ON refresh_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Verification codes policies
CREATE POLICY "Users can manage own codes" ON verification_codes
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKET FOR DIARY IMAGES
-- ============================================
-- Run this separately in Supabase Storage settings:
-- Create bucket: 'diary-images' with public access

-- Or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('diary-images', 'diary-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload diary images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'diary-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view diary images"
ON storage.objects FOR SELECT
USING (bucket_id = 'diary-images');

CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (bucket_id = 'diary-images' AND auth.uid()::text = (storage.foldername(name))[1]);
