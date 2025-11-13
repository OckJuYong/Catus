# Catus Backend - Quick Start Guide

## Phase 2 Complete - Authentication & User Management

---

## Prerequisites

1. **Java 17** installed
2. **Docker** and **Docker Compose** installed (for PostgreSQL + Redis)
3. **Kakao Developer Account** (for OAuth credentials)

---

## Setup Steps

### 1. Set Environment Variables

Create `.env` file in project root or export these variables:

```bash
# JWT Secret (must be at least 32 characters)
export JWT_SECRET="your_super_secret_jwt_key_at_least_32_characters_long_for_production"

# Kakao OAuth Credentials
export KAKAO_CLIENT_ID="your_kakao_rest_api_key"
export KAKAO_CLIENT_SECRET="your_kakao_client_secret"
export KAKAO_REDIRECT_URI="http://localhost:8080/api/v1/auth/callback"

# Database (optional - has defaults)
export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/catus_db"
export SPRING_DATASOURCE_USERNAME="catus_user"
export SPRING_DATASOURCE_PASSWORD="catus_pass"

# Redis (optional - has defaults)
export SPRING_REDIS_HOST="localhost"
export SPRING_REDIS_PORT="6379"
```

### 2. Start Infrastructure (PostgreSQL + Redis)

```bash
cd C:\Users\hoonl\dev\Catus_Backend
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

### 3. Build the Project

```bash
./gradlew clean build
```

### 4. Run the Application

```bash
./gradlew bootRun
```

The application will start on **http://localhost:8080**

---

## Verify Deployment

### Health Check
```bash
curl http://localhost:8080/actuator/health
```

Expected response:
```json
{
  "status": "UP"
}
```

### Swagger UI
Open in browser: **http://localhost:8080/swagger-ui.html**

---

## Test Kakao OAuth Login Flow

### Step 1: Get Authorization Code from Kakao

Open in browser:
```
https://kauth.kakao.com/oauth/authorize?client_id={YOUR_KAKAO_CLIENT_ID}&redirect_uri=http://localhost:8080/api/v1/auth/callback&response_type=code
```

After login, Kakao will redirect to:
```
http://localhost:8080/api/v1/auth/callback?code=ABC123...
```

Copy the `code` parameter value.

### Step 2: Login via Backend API

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ABC123...",
    "redirectUri": "http://localhost:8080/api/v1/auth/callback"
  }'
```

Expected response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400000,
  "isNewUser": true,
  "user": {
    "userId": 1,
    "email": "user@example.com",
    "nickname": "User1",
    "profileImageUrl": null
  }
}
```

### Step 3: Access Protected Endpoint

```bash
curl -X GET http://localhost:8080/api/v1/users/profile \
  -H "Authorization: Bearer {YOUR_ACCESS_TOKEN}"
```

Expected response:
```json
{
  "userId": 1,
  "email": "user@example.com",
  "nickname": "User1",
  "profileImageUrl": null,
  "bio": null,
  "gender": null,
  "ageGroup": null,
  "occupation": null,
  "servicePurpose": null,
  "createdAt": "2024-11-11T12:00:00",
  "updatedAt": "2024-11-11T12:00:00"
}
```

---

## API Endpoints

### Authentication (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login with Kakao OAuth |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout (requires auth) |

### User Profile (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/profile` | Get current user profile |
| PUT | `/api/v1/users/profile` | Update profile |
| POST | `/api/v1/users/profile/image` | Upload profile image |

---

## Update User Profile

```bash
curl -X PUT http://localhost:8080/api/v1/users/profile \
  -H "Authorization: Bearer {YOUR_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "My New Name",
    "bio": "I love writing diaries!",
    "gender": "MALE",
    "ageGroup": "20대",
    "occupation": "Software Engineer"
  }'
```

---

## Refresh Access Token

```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Authorization: Bearer {YOUR_REFRESH_TOKEN}"
```

Returns new access token with same refresh token.

---

## Logout

```bash
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Authorization: Bearer {YOUR_ACCESS_TOKEN}"
```

Removes refresh token from Redis.

---

## Database Access

Connect to PostgreSQL:
```bash
docker exec -it catus-postgres psql -U catus_user -d catus_db
```

Useful SQL queries:
```sql
-- View all users
SELECT * FROM users;

-- View user profiles
SELECT * FROM user_profiles;

-- View user settings
SELECT * FROM user_settings;

-- Check tables
\dt
```

---

## Redis Access

Connect to Redis:
```bash
docker exec -it catus-redis redis-cli
```

Useful Redis commands:
```bash
# List all keys
KEYS *

# Get refresh token for user 1
GET refresh_token:1

# Check TTL
TTL refresh_token:1

# Delete refresh token
DEL refresh_token:1
```

---

## Troubleshooting

### Problem: "Could not connect to database"
**Solution**: Make sure PostgreSQL is running:
```bash
docker-compose ps
docker-compose up -d postgres
```

### Problem: "Redis connection failed"
**Solution**: Make sure Redis is running:
```bash
docker-compose up -d redis
```

### Problem: "Invalid Kakao authorization code"
**Solution**:
1. Check KAKAO_CLIENT_ID is correct
2. Make sure redirect_uri matches exactly
3. Authorization codes expire quickly - get a new one

### Problem: "JWT secret too short"
**Solution**: JWT_SECRET must be at least 32 characters for HS256

---

## Stop Services

```bash
# Stop Spring Boot (Ctrl+C in terminal)

# Stop Docker containers
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v
```

---

## Project Structure

```
C:\Users\hoonl\dev\Catus_Backend\
├── src/
│   ├── main/
│   │   ├── java/com/catus/backend/
│   │   │   ├── config/          # Security, Redis, JWT Filter
│   │   │   ├── controller/      # REST API Controllers
│   │   │   ├── service/         # Business Logic
│   │   │   ├── repository/      # Data Access (JPA)
│   │   │   ├── model/           # JPA Entities
│   │   │   ├── dto/             # Request/Response DTOs
│   │   │   ├── exception/       # Exception Handling
│   │   │   └── util/            # JWT Token Provider
│   │   └── resources/
│   │       ├── application.yml  # Configuration
│   │       └── db/migration/    # Flyway SQL Scripts
├── build.gradle                 # Gradle Dependencies
├── docker-compose.yml           # PostgreSQL + Redis
├── PHASE2_IMPLEMENTATION_SUMMARY.md
└── QUICK_START_GUIDE.md (this file)
```

---

## Development Commands

```bash
# Build project
./gradlew build

# Clean build
./gradlew clean build

# Run application
./gradlew bootRun

# Run without tests
./gradlew build -x test

# Check dependencies
./gradlew dependencies
```

---

## Next Steps

Phase 2 is complete! Next phases:
- **Phase 3**: Chat & Diary Generation (Gemini AI, DALL-E)
- **Phase 4**: Community Features (Support messages)
- **Phase 5**: Push Notifications (FCM)

---

## Important Files

- **API Documentation**: http://localhost:8080/swagger-ui.html
- **Health Check**: http://localhost:8080/actuator/health
- **Configuration**: src/main/resources/application.yml
- **Database Schema**: src/main/resources/db/migration/V1__Create_initial_tables.sql

---

## Support

For detailed implementation information, see:
- **PHASE2_IMPLEMENTATION_SUMMARY.md** - Complete technical documentation
- **Swagger UI** - Interactive API documentation
- **Source Code** - Comprehensive JavaDoc comments

---

**Status**: Phase 2 Complete ✅
**Ready for**: Phase 3 Development
**Build**: Passing ✅
