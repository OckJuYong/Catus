/**
 * Supabase Database Types
 * Auto-generated type definitions for database tables
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Emotion = '행복' | '슬픔' | '보통' | '화남' | '불안';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          kakao_id: number | null;
          email: string | null;
          nickname: string;
          profile_image: string | null;
          password_hash: string | null;
          diary_generation_time: string;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          kakao_id?: number | null;
          email?: string | null;
          nickname: string;
          profile_image?: string | null;
          password_hash?: string | null;
          diary_generation_time?: string;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          kakao_id?: number | null;
          email?: string | null;
          nickname?: string;
          profile_image?: string | null;
          password_hash?: string | null;
          diary_generation_time?: string;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          notification_anonymous: boolean;
          notification_diary: boolean;
          dark_mode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notification_anonymous?: boolean;
          notification_diary?: boolean;
          dark_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          notification_anonymous?: boolean;
          notification_diary?: boolean;
          dark_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: number;
          user_id: string;
          user_message: string;
          ai_response: string;
          chat_date: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          user_message: string;
          ai_response: string;
          chat_date?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          user_message?: string;
          ai_response?: string;
          chat_date?: string;
          created_at?: string;
        };
      };
      diaries: {
        Row: {
          id: number;
          user_id: string;
          diary_date: string;
          title: string | null;
          content: string;
          content_preview: string | null;
          emotion: Emotion | null;
          image_url: string | null;
          thumbnail_url: string | null;
          is_read: boolean;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          diary_date: string;
          title?: string | null;
          content: string;
          content_preview?: string | null;
          emotion?: Emotion | null;
          image_url?: string | null;
          thumbnail_url?: string | null;
          is_read?: boolean;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          diary_date?: string;
          title?: string | null;
          content?: string;
          content_preview?: string | null;
          emotion?: Emotion | null;
          image_url?: string | null;
          thumbnail_url?: string | null;
          is_read?: boolean;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      anonymous_messages: {
        Row: {
          id: number;
          sender_id: string | null;
          receiver_id: string;
          diary_id: number;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          sender_id?: string | null;
          receiver_id: string;
          diary_id: number;
          content: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          sender_id?: string | null;
          receiver_id?: string;
          diary_id?: number;
          content?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
      big5_scores: {
        Row: {
          id: number;
          user_id: string;
          openness: number;
          conscientiousness: number;
          extraversion: number;
          agreeableness: number;
          neuroticism: number;
          analysis: string | null;
          source: 'initial_test' | 'chat_analysis' | 'diary_analysis';
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          openness: number;
          conscientiousness: number;
          extraversion: number;
          agreeableness: number;
          neuroticism: number;
          analysis?: string | null;
          source: 'initial_test' | 'chat_analysis' | 'diary_analysis';
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          openness?: number;
          conscientiousness?: number;
          extraversion?: number;
          agreeableness?: number;
          neuroticism?: number;
          analysis?: string | null;
          source?: 'initial_test' | 'chat_analysis' | 'diary_analysis';
          created_at?: string;
        };
      };
      refresh_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          expires_at?: string;
          created_at?: string;
        };
      };
      verification_codes: {
        Row: {
          id: string;
          user_id: string;
          code: string;
          expires_at: string;
          used: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code: string;
          expires_at: string;
          used?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          code?: string;
          expires_at?: string;
          used?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      emotion_type: Emotion;
      big5_source: 'initial_test' | 'chat_analysis' | 'diary_analysis';
    };
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Convenience exports
export type User = Tables<'users'>;
export type UserSettings = Tables<'user_settings'>;
export type ChatMessage = Tables<'chat_messages'>;
export type Diary = Tables<'diaries'>;
export type AnonymousMessage = Tables<'anonymous_messages'>;
export type Big5Score = Tables<'big5_scores'>;
