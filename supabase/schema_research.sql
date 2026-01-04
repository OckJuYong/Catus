-- ============================================
-- CATUS 연구용 데이터 수집 스키마
-- 목적: BIG5 기반 사용자 심리 데이터 수집 및 분석
-- 타겟: 1인가구, 20대 여성, 고립 전 청년
-- ============================================

-- ============================================
-- 1. USER_DEMOGRAPHICS TABLE
-- 사용자 인구통계 정보 (온보딩 시 수집)
-- ============================================
CREATE TABLE IF NOT EXISTS user_demographics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

    -- 기본 인구통계
    age_group TEXT CHECK (age_group IN ('10대', '20대', '30대', '40대 이상')),
    gender TEXT CHECK (gender IN ('여성', '남성', '기타', '비공개')),
    living_type TEXT CHECK (living_type IN ('1인가구', '가족동거', '기숙사/룸메', '기타')),
    occupation TEXT CHECK (occupation IN ('학생', '직장인', '기타')),

    -- 서비스 가입 목적 (자유 텍스트)
    purpose TEXT,

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_demographics_age_gender ON user_demographics(age_group, gender);
CREATE INDEX IF NOT EXISTS idx_demographics_living_type ON user_demographics(living_type);

-- ============================================
-- 2. CONVERSATION_ANALYSIS TABLE
-- 대화 기반 심리 분석 결과 (AI 자동 추출)
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_analysis (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,

    -- 핵심 심리 지표 (0-100)
    loneliness_score DECIMAL(5,2) CHECK (loneliness_score >= 0 AND loneliness_score <= 100),
    wellbeing_score DECIMAL(5,2) CHECK (wellbeing_score >= 0 AND wellbeing_score <= 100),

    -- 감정 분포 (JSON)
    -- {"행복": 30, "슬픔": 20, "보통": 30, "화남": 10, "불안": 10}
    emotion_distribution JSONB,

    -- 대화 주제 키워드 (배열)
    topic_keywords TEXT[],

    -- 분석 기반 데이터
    message_count INTEGER DEFAULT 0,
    avg_message_length DECIMAL(8,2),

    -- AI 분석 요약
    analysis_summary TEXT,

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, analysis_date)
);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_user_date
    ON conversation_analysis(user_id, analysis_date);
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_scores
    ON conversation_analysis(loneliness_score, wellbeing_score);

-- ============================================
-- 3. ENGAGEMENT_METRICS TABLE
-- 사용 패턴 추적 (자동 집계)
-- ============================================
CREATE TABLE IF NOT EXISTS engagement_metrics (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,

    -- 세션 지표
    session_count INTEGER DEFAULT 0,
    total_session_duration_minutes INTEGER DEFAULT 0,

    -- 대화 지표
    chat_message_count INTEGER DEFAULT 0,
    avg_response_time_seconds INTEGER,

    -- 일기 지표
    diary_written BOOLEAN DEFAULT FALSE,
    diary_emotion TEXT,

    -- 상호작용 지표
    anonymous_messages_sent INTEGER DEFAULT 0,
    anonymous_messages_received INTEGER DEFAULT 0,

    -- 접속 시간대 (0-23시)
    peak_usage_hour INTEGER,

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, metric_date)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_engagement_user_date ON engagement_metrics(user_id, metric_date);

-- ============================================
-- 4. RESEARCH_CONSENT TABLE
-- 연구 동의 기록 (법적 요건)
-- ============================================
CREATE TABLE IF NOT EXISTS research_consent (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

    -- 동의 항목
    consent_data_collection BOOLEAN DEFAULT FALSE,
    consent_research_use BOOLEAN DEFAULT FALSE,
    consent_anonymized_sharing BOOLEAN DEFAULT FALSE,

    -- 동의 일시
    consented_at TIMESTAMPTZ,
    consent_version TEXT DEFAULT '1.0',

    -- 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. TRIGGER: Auto-update updated_at
-- ============================================
CREATE TRIGGER update_demographics_updated_at
    BEFORE UPDATE ON user_demographics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_engagement_updated_at
    BEFORE UPDATE ON engagement_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consent_updated_at
    BEFORE UPDATE ON research_consent
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE user_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_consent ENABLE ROW LEVEL SECURITY;

-- Policies for user_demographics
CREATE POLICY "Users can view own demographics" ON user_demographics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own demographics" ON user_demographics
    FOR ALL USING (auth.uid() = user_id);

-- Policies for conversation_analysis
CREATE POLICY "Users can view own analysis" ON conversation_analysis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis" ON conversation_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for engagement_metrics
CREATE POLICY "Users can view own metrics" ON engagement_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own metrics" ON engagement_metrics
    FOR ALL USING (auth.uid() = user_id);

-- Policies for research_consent
CREATE POLICY "Users can manage own consent" ON research_consent
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 7. RESEARCH VIEWS (관리자/연구용 익명 집계)
-- ============================================

-- 7.1 인구통계 분포 뷰
CREATE OR REPLACE VIEW research_demographics_summary AS
SELECT
    age_group,
    gender,
    living_type,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM user_demographics
WHERE age_group IS NOT NULL
GROUP BY age_group, gender, living_type
ORDER BY user_count DESC;

-- 7.2 심리 지표 추이 뷰 (주간 평균)
CREATE OR REPLACE VIEW research_psychological_trends AS
SELECT
    DATE_TRUNC('week', analysis_date) as week_start,
    COUNT(DISTINCT user_id) as active_users,
    ROUND(AVG(loneliness_score), 2) as avg_loneliness,
    ROUND(AVG(wellbeing_score), 2) as avg_wellbeing,
    ROUND(AVG(message_count), 2) as avg_messages
FROM conversation_analysis
GROUP BY DATE_TRUNC('week', analysis_date)
ORDER BY week_start DESC;

-- 7.3 타겟 그룹별 심리 지표 (1인가구 20대 여성)
CREATE OR REPLACE VIEW research_target_group_analysis AS
SELECT
    d.age_group,
    d.gender,
    d.living_type,
    COUNT(DISTINCT c.user_id) as user_count,
    ROUND(AVG(c.loneliness_score), 2) as avg_loneliness,
    ROUND(AVG(c.wellbeing_score), 2) as avg_wellbeing,
    ROUND(AVG(c.message_count), 2) as avg_daily_messages
FROM conversation_analysis c
JOIN user_demographics d ON c.user_id = d.user_id
GROUP BY d.age_group, d.gender, d.living_type
ORDER BY user_count DESC;

-- 7.4 사용자 변화 추적 뷰 (첫 주 vs 최근 주 비교)
CREATE OR REPLACE VIEW research_user_progress AS
WITH first_week AS (
    SELECT
        user_id,
        AVG(loneliness_score) as initial_loneliness,
        AVG(wellbeing_score) as initial_wellbeing
    FROM conversation_analysis
    WHERE analysis_date <= (
        SELECT MIN(analysis_date) + INTERVAL '7 days'
        FROM conversation_analysis ca2
        WHERE ca2.user_id = conversation_analysis.user_id
    )
    GROUP BY user_id
),
recent_week AS (
    SELECT
        user_id,
        AVG(loneliness_score) as recent_loneliness,
        AVG(wellbeing_score) as recent_wellbeing
    FROM conversation_analysis
    WHERE analysis_date >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY user_id
)
SELECT
    d.age_group,
    d.gender,
    d.living_type,
    COUNT(*) as user_count,
    ROUND(AVG(f.initial_loneliness), 2) as avg_initial_loneliness,
    ROUND(AVG(r.recent_loneliness), 2) as avg_recent_loneliness,
    ROUND(AVG(f.initial_loneliness - r.recent_loneliness), 2) as loneliness_improvement,
    ROUND(AVG(f.initial_wellbeing), 2) as avg_initial_wellbeing,
    ROUND(AVG(r.recent_wellbeing), 2) as avg_recent_wellbeing,
    ROUND(AVG(r.recent_wellbeing - f.initial_wellbeing), 2) as wellbeing_improvement
FROM first_week f
JOIN recent_week r ON f.user_id = r.user_id
JOIN user_demographics d ON f.user_id = d.user_id
GROUP BY d.age_group, d.gender, d.living_type
ORDER BY user_count DESC;

-- 7.5 서비스 효과성 지표 (전체)
CREATE OR REPLACE VIEW research_service_effectiveness AS
SELECT
    COUNT(DISTINCT c.user_id) as total_analyzed_users,
    ROUND(AVG(loneliness_score), 2) as overall_avg_loneliness,
    ROUND(AVG(wellbeing_score), 2) as overall_avg_wellbeing,
    ROUND(STDDEV(loneliness_score), 2) as loneliness_stddev,
    ROUND(STDDEV(wellbeing_score), 2) as wellbeing_stddev,
    ROUND(AVG(e.session_count), 2) as avg_sessions_per_user,
    ROUND(AVG(e.chat_message_count), 2) as avg_messages_per_day
FROM conversation_analysis c
LEFT JOIN engagement_metrics e ON c.user_id = e.user_id AND c.analysis_date = e.metric_date;

-- ============================================
-- 8. HELPER FUNCTIONS (데이터 추출용)
-- ============================================

-- 특정 기간 사용자 심리 변화 조회
CREATE OR REPLACE FUNCTION get_user_psychological_progress(
    p_user_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    analysis_date DATE,
    loneliness_score DECIMAL,
    wellbeing_score DECIMAL,
    message_count INTEGER,
    emotion_distribution JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ca.analysis_date,
        ca.loneliness_score,
        ca.wellbeing_score,
        ca.message_count,
        ca.emotion_distribution
    FROM conversation_analysis ca
    WHERE ca.user_id = p_user_id
      AND ca.analysis_date BETWEEN p_start_date AND p_end_date
    ORDER BY ca.analysis_date;
END;
$$ LANGUAGE plpgsql;

-- 연구용 익명 데이터 추출 함수
CREATE OR REPLACE FUNCTION export_research_data(
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    age_group TEXT,
    gender TEXT,
    living_type TEXT,
    analysis_date DATE,
    loneliness_score DECIMAL,
    wellbeing_score DECIMAL,
    message_count INTEGER,
    days_since_signup INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.age_group,
        d.gender,
        d.living_type,
        ca.analysis_date,
        ca.loneliness_score,
        ca.wellbeing_score,
        ca.message_count,
        (ca.analysis_date - u.created_at::date) as days_since_signup
    FROM conversation_analysis ca
    JOIN users u ON ca.user_id = u.id
    JOIN user_demographics d ON ca.user_id = d.user_id
    JOIN research_consent rc ON ca.user_id = rc.user_id
    WHERE ca.analysis_date BETWEEN p_start_date AND p_end_date
      AND rc.consent_research_use = TRUE
    ORDER BY ca.analysis_date, d.age_group, d.gender;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. SAMPLE QUERIES FOR RESEARCH (주석)
-- ============================================

/*
-- 1인가구 20대 여성 그룹의 평균 고립감 변화
SELECT * FROM research_target_group_analysis
WHERE age_group = '20대' AND gender = '여성' AND living_type = '1인가구';

-- 전체 사용자 심리 개선율
SELECT * FROM research_user_progress;

-- 특정 기간 연구용 데이터 추출
SELECT * FROM export_research_data('2024-01-01', '2024-12-31');

-- 주간 트렌드 확인
SELECT * FROM research_psychological_trends LIMIT 12;

-- 사용자별 심리 변화 추적
SELECT * FROM get_user_psychological_progress('user-uuid-here');
*/

COMMENT ON TABLE user_demographics IS '사용자 인구통계 정보 - 연구용 세분화';
COMMENT ON TABLE conversation_analysis IS '대화 기반 심리 분석 결과 - AI 자동 추출';
COMMENT ON TABLE engagement_metrics IS '서비스 사용 패턴 - 자동 집계';
COMMENT ON TABLE research_consent IS '연구 동의 기록 - 법적 요건';
COMMENT ON VIEW research_demographics_summary IS '인구통계 분포 요약';
COMMENT ON VIEW research_psychological_trends IS '심리 지표 주간 추이';
COMMENT ON VIEW research_target_group_analysis IS '타겟 그룹별 심리 분석';
COMMENT ON VIEW research_user_progress IS '사용자 변화 전후 비교';
COMMENT ON VIEW research_service_effectiveness IS '서비스 효과성 종합 지표';
