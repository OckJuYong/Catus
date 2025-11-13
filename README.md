# Catus Backend API Server

AI-powered emotional diary platform with chatbot companion "Dali" (고양이 달이)

## Tech Stack

- **Backend**: Spring Boot 3.2.0, Java 17, Gradle 8.5
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Storage**: AWS S3
- **External APIs**: Google Gemini (AI), OpenAI DALL-E (Images), Firebase FCM (Push), Kakao OAuth

## Quick Start

### Prerequisites

- Java 17+
- Docker & Docker Compose
- Git
- (Gradle은 포함되어 있음 - Gradle Wrapper 사용)

### 1. Clone Repository

```bash
cd C:\Users\hoonl\dev
git clone <repository-url> Catus_Backend
cd Catus_Backend
```

### 2. Setup Environment

```bash
# Copy environment template
cp .env.template .env

# Edit .env and fill in your API keys
# - Kakao OAuth (https://developers.kakao.com)
# - Google Gemini (https://makersuite.google.com/app/apikey)
# - OpenAI DALL-E (https://platform.openai.com/api-keys)
# - AWS S3 credentials
# - Firebase service account JSON
```

### 3. Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify containers are running
docker-compose ps
```

### 4. Build and Run

```bash
# Build project (Windows)
.\gradlew.bat clean build

# Run application (Windows)
.\gradlew.bat bootRun

# Or on Unix/Linux/Mac:
./gradlew clean build
./gradlew bootRun
```

### 5. Verify

```bash
# Health check
curl http://localhost:8080/actuator/health

# Expected: {"status":"UP"}

# Swagger UI
open http://localhost:8080/swagger-ui.html
```

## Project Structure

```
Catus_Backend/
├── src/
│   ├── main/
│   │   ├── java/com/catus/backend/
│   │   │   ├── config/          # Spring configurations
│   │   │   ├── controller/      # REST controllers
│   │   │   ├── service/         # Business logic
│   │   │   ├── repository/      # JPA repositories
│   │   │   ├── model/           # Entity classes
│   │   │   ├── dto/             # Request/Response DTOs
│   │   │   ├── exception/       # Custom exceptions
│   │   │   ├── scheduler/       # Batch jobs
│   │   │   └── util/            # Utilities
│   │   └── resources/
│   │       ├── db/migration/    # Flyway migrations
│   │       └── application.yml  # Configuration
│   └── test/                    # Tests
├── docker-compose.yml           # Local dev infrastructure
├── pom.xml                      # Maven dependencies
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Kakao OAuth login
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - Logout

### Chat
- `POST /api/v1/chat/messages` - Send message to AI
- `GET /api/v1/chat/messages` - Get conversation history

### Diary
- `GET /api/v1/diaries` - Calendar view
- `GET /api/v1/diaries/{date}` - Diary detail
- `POST /api/v1/diaries/generate` - Manual generation
- `PATCH /api/v1/diaries/{id}/public` - Toggle public/private

### Support Messages
- `GET /api/v1/support/random-diary` - Random public diary
- `POST /api/v1/support/messages` - Send anonymous message
- `GET /api/v1/support/messages/received` - Received messages

Full API documentation: http://localhost:8080/swagger-ui.html

## Database Schema

7 core tables:
- `users` - User accounts
- `user_profiles` - Profile information
- `chat_messages` - Chat history
- `diaries` - Generated diaries
- `support_messages` - Anonymous messages
- `user_settings` - User preferences
- `notifications` - Notification logs

## Development

### Run Tests

```bash
# Windows
.\gradlew.bat test

# Unix/Linux/Mac
./gradlew test
```

### Database Migration

```bash
# Flyway runs automatically on Spring Boot startup
# No manual migration needed with Gradle
```

### Stop Infrastructure

```bash
docker-compose down
```

## Configuration

Key environment variables (see `.env.template`):
- `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` - Kakao OAuth
- `GEMINI_API_KEY` - Google Gemini AI
- `OPENAI_API_KEY` - OpenAI DALL-E
- `AWS_ACCESS_KEY`, `AWS_SECRET_KEY` - AWS S3
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Firebase FCM

## License

Proprietary - All rights reserved

## Contact

Development Team: [email@example.com]
