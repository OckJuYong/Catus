-- Custom Authentication Functions for Username/Password Login
-- Supabase SQL Editor에서 실행하세요

-- 1. users 테이블에 username 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. 회원가입 함수 (RLS 우회)
CREATE OR REPLACE FUNCTION custom_signup(
    p_username TEXT,
    p_password TEXT,
    p_nickname TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- RLS 우회
AS $$
DECLARE
    v_user_id UUID;
    v_password_hash TEXT;
    v_nickname TEXT;
BEGIN
    -- 사용자명 중복 체크
    IF EXISTS (SELECT 1 FROM users WHERE username = p_username) THEN
        RETURN json_build_object('success', false, 'error', '이미 사용 중인 아이디입니다.');
    END IF;

    -- 비밀번호 해시 (pgcrypto 사용)
    v_password_hash := crypt(p_password, gen_salt('bf'));

    -- 닉네임 설정 (없으면 username 사용)
    v_nickname := COALESCE(NULLIF(p_nickname, ''), p_username);

    -- 새 사용자 생성
    INSERT INTO users (username, password_hash, nickname, onboarding_completed)
    VALUES (p_username, v_password_hash, v_nickname, false)
    RETURNING id INTO v_user_id;

    RETURN json_build_object(
        'success', true,
        'user', json_build_object(
            'id', v_user_id,
            'username', p_username,
            'nickname', v_nickname,
            'onboardingCompleted', false
        )
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 3. 로그인 함수 (RLS 우회)
CREATE OR REPLACE FUNCTION custom_login(
    p_username TEXT,
    p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- RLS 우회
AS $$
DECLARE
    v_user RECORD;
BEGIN
    -- 사용자 찾기 및 비밀번호 확인
    SELECT id, username, nickname, profile_image, onboarding_completed, password_hash
    INTO v_user
    FROM users
    WHERE username = p_username;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', '아이디 또는 비밀번호가 올바르지 않습니다.');
    END IF;

    -- 비밀번호 검증
    IF v_user.password_hash IS NULL OR v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
        RETURN json_build_object('success', false, 'error', '아이디 또는 비밀번호가 올바르지 않습니다.');
    END IF;

    RETURN json_build_object(
        'success', true,
        'user', json_build_object(
            'id', v_user.id,
            'username', v_user.username,
            'nickname', v_user.nickname,
            'profileImage', v_user.profile_image,
            'onboardingCompleted', v_user.onboarding_completed
        )
    );
END;
$$;

-- 4. pgcrypto 확장 활성화 (비밀번호 해시용)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 5. anon 사용자가 이 함수들을 호출할 수 있도록 권한 부여
GRANT EXECUTE ON FUNCTION custom_signup(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION custom_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION custom_signup(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION custom_login(TEXT, TEXT) TO authenticated;

-- 6. users 테이블에 대한 추가 RLS 정책 (custom auth 사용자용)
-- 일반 로그인 사용자도 자신의 데이터에 접근할 수 있도록
CREATE POLICY "Allow custom auth users to read own data" ON users
    FOR SELECT
    USING (true);  -- RPC 함수가 SECURITY DEFINER로 처리

CREATE POLICY "Allow insert for signup" ON users
    FOR INSERT
    WITH CHECK (true);  -- RPC 함수가 SECURITY DEFINER로 처리
