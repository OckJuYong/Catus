# Catus Frontend AI Project Specification

## 1. Project Overview
**Project Name**: Catus
**Type**: React Native (Expo) / React Web Application (Vite)
**Purpose**: AI-powered diary and mental health support application.
**Core Tech Stack**:
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **Styling**: TailwindCSS 4.1.16
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: React Router DOM 7.9.5
- **PWA**: vite-plugin-pwa

## 2. Directory Structure
- `src/pages`: Application views/screens.
- `src/components`: Reusable UI components.
- `src/hooks`: Custom React hooks.
- `src/contexts`: React Context providers (Auth, Theme, etc.).
- `src/utils`: Helper functions (API, Storage, Date, Validation).
- `src/api`: API integration logic.

## 3. Key Features & Modules

### 3.1 Authentication
- **Login**: `LoginPage.jsx` - Handles user login (Kakao integration).
- **Onboarding**: `Onboarding.jsx`, `OnboardingPage.jsx` - User introduction flow.
- **Privacy**: `PrivacyPolicyPage.jsx`.

### 3.2 Core Functionality
### 3.2 Core Functionality
- **Home**: `HomePage.jsx`
    - **Cactus**: Visualizes Big 5 Personality Analysis results (Charts/Updates).
    - **Dali (Cat)**: Interacts only when an **Anonymous Picture Diary** is available.
    - **Paper Plane**: Appears when an **Anonymous Support Message** is received.
    - **Chat Input**: Bottom bar for initiating conversation with Dali.
- **Chat**: `ChatPage.jsx` - AI conversation interface, accessed via the bottom input bar.
- **Calendar**: `CalendarPage.jsx` - Monthly view of diaries/emotions.
- **Diary**:
    - `DiaryDetailPage.jsx`, `DiaryDetailPage2.jsx`: Viewing diary entries.
    - `DiaryRevealPage.jsx`: Animation/reveal of new diaries.
- **Letters**: `LetterPage.jsx` - Receiving/sending support letters.
- **Support**: `SupportPage.jsx` - Mental health resources/support.

### 3.3 Settings & Configuration
- **Settings**: `SettingsPage.jsx` - User preferences, notifications, account management.
- **Tutorial**: `Tutorial.jsx` - App usage guide.

### 3.4 Integration
- **API**: `src/utils/api.js` - Centralized API client.
- **Storage**: `src/utils/storage.js` - Local storage wrapper (Migrating to IndexedDB for Chat Logs).

## 4. Gemini 3.0 Integration Specification

### 4.1 System Prompt Architecture
- **Format**: XML-based structured prompt.
- **Components**:
    - `<persona>`: Defines 'Dali' (Agreeableness 0.9, Extraversion 0.75).
    - `<tone_guidelines>`: Enforces informal speech (Banmal), emojis, and empathy.
    - `<constraints>`: Safety rules, boundary setting.
    - `<task>`: Core instruction to analyze emotion and respond.

### 4.2 Proactive Questioning (Cold Start Strategy)
- **Trigger**: Detects missing data for specific Big 5 traits (e.g., 'Sociality').
- **Mechanism**: Injects "Hidden Instructions" into the prompt to guide the AI to ask relevant questions naturally.
- **Example**: "Ask about weekend plans to gauge social activity."

### 4.3 Hybrid Analysis Pipeline
1.  **Preprocessing**: Slang Normalization using `slang_dictionary.json` (e.g., "기빨려" -> "피곤").
2.  **Zero-Score Filtering**: Drop neutral sentences (no personality keywords) to prevent score regression to the mean.
3.  **LLM Reasoning**: Gemini 3.0 analyzes context for deeper insights.
4.  **Scoring**: Sigmoid normalization with dynamic sensitivity ($k$) tuning.

### 4.4 Safety & Ethics Protocols
- **Crisis Protocol (CRITICAL)**:
    1.  **Deep Empathy**: Validate pain deeply ("I'm here for you," "It's okay to cry").
    2.  **Friend-like Support**: Avoid robotic "seek help" advice. Instead, say "I'm worried about you because you're my friend."
    3.  **Presence**: Emphasize staying by their side ("I'll listen to everything").
- **Prompt Injection Defense**: "Sandwich" defense strategy (placing security instructions at both start and end of prompt).

## 5. Backend Architecture (Spring Boot Migration Target)

### 5.1 Core Components
- **Framework**: Spring Boot 3.x
- **AI Integration**: Spring AI
    - Use `ChatClient` Fluent API for structured requests.
    - `MessageChatMemoryAdvisor` for context management.
- **Typing Simulation**: Use WebSocket/SSE to send "Typing..." events while generating, then send full message. Avoid character-by-character streaming to maintain "human-like" feel.

### 5.2 Batch Processing (Spring Batch)
- **Purpose**: Weekly personality analysis and report generation.
- **Logic**: Exponential Moving Average (EMA) for score updates.
    - Formula: $NewScore = (Prev \times 0.34) + (Weekly \times 0.66)$
- **Structure**: Job -> Step -> Chunk-oriented processing.

### 5.3 Database Schema (PostgreSQL)
- **`users`**: UUID, nickname, OAuth info.
- **`personality_state`**: Current Big 5 scores (Openness, Conscientiousness, etc.), last_updated.
- **`chat_logs`**: Time-series data, partitioned by time.
- **`analysis_history`**: `jsonb` column for `raw_scores` and `trait_changes` to allow flexible schema evolution.

## 6. Frontend Data Flow (Updated)
- **Local-First**: Chat logs stored in **IndexedDB** (Dexie.js) to save server storage.
- **Sync**: Only "Analysis Results" (Diary, Emotion, Personality updates) are synced to Server via React Query.
- **Real-time**: Chat interface connects to Spring Boot WebSocket for streaming responses.
