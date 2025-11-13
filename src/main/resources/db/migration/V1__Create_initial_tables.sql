-- V1__Create_initial_tables.sql
-- Create initial database schema for Catus Backend

-- Table 1: users
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    kakao_id VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    last_login_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE INDEX idx_users_kakao_id ON users(kakao_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

COMMENT ON TABLE users IS '사용자 기본 정보';
COMMENT ON COLUMN users.kakao_id IS '카카오 OAuth ID';
COMMENT ON COLUMN users.status IS 'ACTIVE, INACTIVE, DELETED';

-- Table 2: user_profiles
CREATE TABLE user_profiles (
    profile_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    nickname VARCHAR(20) NOT NULL,
    profile_image_url VARCHAR(500),
    bio TEXT,
    gender VARCHAR(10),
    age_group VARCHAR(20),
    occupation VARCHAR(50),
    service_purpose TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_nickname ON user_profiles(nickname);

COMMENT ON TABLE user_profiles IS '사용자 프로필 정보';
COMMENT ON COLUMN user_profiles.gender IS '성별: MALE, FEMALE, OTHER';
COMMENT ON COLUMN user_profiles.age_group IS '연령대: 20대, 30대 등';

-- Table 3: chat_messages
CREATE TABLE chat_messages (
    message_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user_message VARCHAR(1000) NOT NULL,
    ai_response TEXT,
    detected_emotion VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_user_created ON chat_messages(user_id, created_at DESC);
CREATE INDEX idx_chat_emotion ON chat_messages(detected_emotion);

COMMENT ON TABLE chat_messages IS '채팅 메시지 기록 (사용자 메시지 + AI 응답)';
COMMENT ON COLUMN chat_messages.user_message IS '사용자가 보낸 메시지';
COMMENT ON COLUMN chat_messages.ai_response IS 'AI가 생성한 응답';
COMMENT ON COLUMN chat_messages.detected_emotion IS 'HAPPY, SAD, ANXIOUS, ANGRY, NORMAL';

-- Table 4: diaries
CREATE TABLE diaries (
    diary_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    diary_date DATE NOT NULL,
    emotion VARCHAR(20) NOT NULL,
    summary TEXT NOT NULL,
    image_url VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,
    generation_type VARCHAR(20) DEFAULT 'AUTO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, diary_date)
);

CREATE INDEX idx_diaries_user_date ON diaries(user_id, diary_date);
CREATE INDEX idx_diary_public ON diaries(is_public, created_at DESC) WHERE is_public = TRUE;
CREATE INDEX idx_diaries_emotion ON diaries(emotion);
CREATE INDEX idx_diaries_created_at ON diaries(created_at);

COMMENT ON TABLE diaries IS '자동 생성 일기';
COMMENT ON COLUMN diaries.emotion IS 'HAPPY, SAD, ANXIOUS, ANGRY, NORMAL';
COMMENT ON COLUMN diaries.generation_type IS 'AUTO, MANUAL';

-- Table 5: support_messages
CREATE TABLE support_messages (
    message_id BIGSERIAL PRIMARY KEY,
    diary_id BIGINT NOT NULL REFERENCES diaries(diary_id) ON DELETE CASCADE,
    sender_id BIGINT NULL,
    recipient_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_filtered BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_support_messages_recipient ON support_messages(recipient_id, is_read);
CREATE INDEX idx_support_messages_diary ON support_messages(diary_id);
CREATE INDEX idx_support_messages_created_at ON support_messages(created_at);

COMMENT ON TABLE support_messages IS '익명 응원 메시지';
COMMENT ON COLUMN support_messages.sender_id IS 'NULL = 완전 익명';
COMMENT ON COLUMN support_messages.is_filtered IS '욕설 필터링 여부';

-- Table 6: user_settings
CREATE TABLE user_settings (
    setting_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    notification_enabled BOOLEAN DEFAULT TRUE,
    diary_generation_enabled BOOLEAN DEFAULT TRUE,
    support_message_enabled BOOLEAN DEFAULT TRUE,
    daily_reminder_time TIME DEFAULT '21:00:00',
    diary_generation_time TIME DEFAULT '00:10:00',
    ai_style VARCHAR(20) DEFAULT 'FRIENDLY',
    theme VARCHAR(20) DEFAULT 'LIGHT',
    fcm_token VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_user_settings_fcm_token ON user_settings(fcm_token);

COMMENT ON TABLE user_settings IS '사용자 설정';
COMMENT ON COLUMN user_settings.ai_style IS 'FRIENDLY, SERIOUS';
COMMENT ON COLUMN user_settings.theme IS 'LIGHT, DARK';

-- Table 7: notifications
CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE INDEX idx_notifications_user_sent ON notifications(user_id, is_sent);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

COMMENT ON TABLE notifications IS '알림 기록';
COMMENT ON COLUMN notifications.type IS 'DIARY_GENERATED, SUPPORT_RECEIVED, DAILY_REMINDER';
