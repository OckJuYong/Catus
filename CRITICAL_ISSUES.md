# 🚨 크리티컬 이슈 목록 - 배포 전 필수 수정

**검토 날짜**: 2025-11-11
**검토자**: Spring Backend Expert (Claude Code)
**상태**: 🔴 배포 불가 - 크리티컬 이슈 수정 필요

---

## 📊 이슈 요약

| 심각도 | 개수 | 상태 |
|--------|------|------|
| 🔴 크리티컬 | 8 | ❌ 미해결 |
| 🟡 높음 | 12 | ❌ 미해결 |
| 🟢 중간 | 15 | - |
| 🔵 낮음 | 8 | - |
| **합계** | **43** | - |

---

## 🔴 크리티컬 이슈 (즉시 수정 필요)

### 1. 데이터베이스 스키마 불일치 ⭐ 최우선

**위치**: `src/main/resources/db/migration/V1__Create_initial_tables.sql` (46-65줄)

**문제**: `chat_messages` 테이블 스키마와 JPA 엔티티가 완전히 다름

**현재 SQL 스키마** (V1__Create_initial_tables.sql):
```sql
CREATE TABLE chat_messages (
    message_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    chat_date DATE NOT NULL,
    emotion_tag VARCHAR(20),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**실제 엔티티** (ChatMessage.java):
```java
@Column(name = "user_message", length = 1000, nullable = false)
private String userMessage;

@Column(name = "ai_response", columnDefinition = "TEXT")
private String aiResponse;

@Enumerated(EnumType.STRING)
@Column(name = "detected_emotion", length = 20)
private EmotionType detectedEmotion;
```

**영향**: 앱 시작 시 Flyway 검증 실패로 크래시

**수정 방법**:
```sql
-- V1__Create_initial_tables.sql 수정
CREATE TABLE chat_messages (
    message_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user_message VARCHAR(1000) NOT NULL,
    ai_response TEXT,
    detected_emotion VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_user_created ON chat_messages(user_id, created_at DESC);
```

---

### 2. JWT Secret 검증 누락

**위치**: `src/main/java/com/catus/backend/util/JwtTokenProvider.java` (34줄)

**문제**: JWT secret이 256비트(32바이트) 미만이면 WeakKeyException 발생

**현재 코드**:
```java
this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
```

**영향**: secret이 짧으면 앱 시작 시 크래시

**수정 방법**:
```java
@PostConstruct
public void init() {
    if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
        throw new IllegalStateException(
            "JWT secret must be at least 256 bits (32 bytes). Current: " +
            (secret != null ? secret.getBytes(StandardCharsets.UTF_8).length : 0) + " bytes"
        );
    }
    this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    log.info("JWT TokenProvider initialized with secret length: {} bytes",
        secret.getBytes(StandardCharsets.UTF_8).length);
}
```

---

### 3. 소스코드 내 하드코딩된 인증정보

**위치**: `src/main/resources/application.yml` (56-58줄)

**문제**: admin 계정 비밀번호가 소스코드에 노출

**현재 코드**:
```yaml
security:
  user:
    name: admin
    password: admin
```

**영향**: 보안 취약점 - 특히 public repository에 커밋 시 위험

**수정 방법**: 해당 섹션 완전 제거 (JWT 인증 사용 중이므로 불필요)
```yaml
# 이 섹션을 완전히 삭제
# security:
#   user:
#     name: admin
#     password: admin
```

---

### 4. Firebase 설정 속성 이름 불일치

**위치**:
- `src/main/java/com/catus/backend/config/FirebaseConfig.java` (26줄)
- `src/main/resources/application.yml` (101줄)

**문제**:
- Java 코드: `@Value("${firebase.service-account-path}")`
- YAML: `firebase.service-account-key: ./firebase-service-account.json`

**영향**: Firebase가 초기화되지 않아 모든 푸시 알림 실패

**수정 방법**:
```yaml
# application.yml
firebase:
  service-account-path: ${FIREBASE_SERVICE_ACCOUNT_PATH:./firebase-service-account.json}
  enabled: ${FIREBASE_ENABLED:true}
```

---

### 5. 일기 생성 Race Condition

**위치**: `src/main/java/com/catus/backend/service/DiaryGenerationService.java` (60-63줄)

**문제**: Check-then-act 패턴으로 동시 요청 시 중복 생성 가능

**현재 코드**:
```java
if (diaryRepository.existsByUserIdAndDiaryDate(userId, date)) {
    throw new BusinessException(ErrorCode.DIARY_ALREADY_EXISTS);
}
// 여기서 다른 스레드가 일기를 생성할 수 있음!
Diary savedDiary = diaryRepository.save(diary);
```

**영향**:
- UNIQUE 제약 조건 위반으로 DataIntegrityViolationException 발생
- 사용자에게 500 에러 대신 적절한 에러 메시지 필요

**수정 방법**:
```java
try {
    // 중복 체크 제거하고 바로 저장
    Diary savedDiary = diaryRepository.save(diary);
    log.info("Diary created successfully for user {} on date {}", userId, date);
    return savedDiary;
} catch (DataIntegrityViolationException e) {
    // UNIQUE 제약 조건 위반 시
    if (e.getMessage().contains("uk_diary_user_date") ||
        e.getMessage().contains("diary_user_id_diary_date_key")) {
        log.warn("Diary already exists for user {} on date {}", userId, date);
        throw new BusinessException(ErrorCode.DIARY_ALREADY_EXISTS,
            String.format("Diary already exists for date: %s", date));
    }
    throw e;
}
```

---

### 6. 데이터베이스 인덱스 이름 불일치

**위치**:
- `src/main/resources/db/migration/V1__Create_initial_tables.sql` (82줄)
- `src/main/java/com/catus/backend/model/Diary.java` (엔티티 어노테이션)

**문제**:
- Migration: `idx_diaries_public`
- Entity: `idx_diary_public`

**영향**: Hibernate 스키마 검증 실패 또는 중복 인덱스 생성

**수정 방법**:
```sql
-- V1__Create_initial_tables.sql
CREATE INDEX idx_diary_public ON diaries(is_public, created_at DESC)
WHERE is_public = TRUE;
```

```java
// Diary.java
@Table(name = "diaries",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_diary_user_date",
            columnNames = {"user_id", "diary_date"})
    },
    indexes = {
        @Index(name = "idx_diary_public",
            columnList = "is_public,created_at DESC")
    }
)
```

---

### 7. 연결 풀 고갈 감지 설정 누락

**위치**: `src/main/resources/application.yml` (13-18줄)

**문제**: HikariCP 연결 누수 감지 설정 없음

**현재 코드**:
```yaml
hikari:
  maximum-pool-size: 20
  minimum-idle: 5
```

**영향**: 연결 누수 발생 시 앱이 멈추고 디버깅 어려움

**수정 방법**:
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      leak-detection-threshold: 60000  # 60초 후 누수 경고
```

---

### 8. 외부 API 타임아웃 부족

**위치**: `src/main/java/com/catus/backend/service/S3Service.java` (198-199줄)

**문제**: DALL-E 이미지 다운로드 타임아웃이 30초로 부족

**현재 코드**:
```java
connection.setConnectTimeout(30000); // 30초
connection.setReadTimeout(30000);    // 30초
```

**영향**: DALL-E 이미지 생성이 30초 이상 걸릴 경우 타임아웃으로 일기 생성 실패

**수정 방법**:
```java
connection.setConnectTimeout(30000);  // 연결: 30초
connection.setReadTimeout(90000);     // 읽기: 90초 (이미지 다운로드 위해)
log.debug("Downloading image from URL with 90s timeout: {}", imageUrl);
```

---

## 🟡 높은 우선순위 이슈 (배포 후 1주일 내 수정)

### 9. N+1 쿼리 문제

**위치**: `src/main/java/com/catus/backend/service/SupportMessageService.java` (193-195줄)

**문제**: 받은 메시지 조회 시 발신자 정보를 개별 쿼리로 조회

**영향**: 100개 메시지 조회 시 101번의 쿼리 실행 (성능 저하)

**수정 방법**:
```java
// SupportMessageRepository.java
@Query("SELECT sm FROM SupportMessage sm " +
       "LEFT JOIN FETCH sm.sender s " +
       "LEFT JOIN FETCH s.profile " +
       "WHERE sm.recipient.userId = :recipientId " +
       "ORDER BY sm.createdAt DESC")
Page<SupportMessage> findByRecipientIdWithSender(
    @Param("recipientId") Long recipientId, Pageable pageable);
```

---

### 10. 메모리 오버플로우 위험

**위치**: `src/main/java/com/catus/backend/service/DiaryGenerationService.java` (69-71줄)

**문제**: 사용자가 하루에 대화를 많이 하면 전체 메시지를 메모리에 로드

**영향**: 1000개 이상 메시지 시 OutOfMemoryError 가능

**수정 방법**:
```java
// 최대 500개로 제한
PageRequest pageRequest = PageRequest.of(0, 500, Sort.by(Sort.Direction.DESC, "createdAt"));
List<ChatMessage> messages = chatMessageRepository
    .findByUserIdAndCreatedAtBetween(userId, startOfDay, endOfDay, pageRequest)
    .getContent();

if (messages.size() >= 500) {
    log.warn("User {} has 500+ messages on {}. Using first 500 for diary generation.",
        userId, date);
}
```

---

### 11. 수동 일기 생성 Rate Limiting 누락

**위치**: `src/main/java/com/catus/backend/service/DiaryGenerationService.java`

**문제**: 수동 일기 생성 API에 제한 없음

**영향**:
- 사용자가 무한정 일기 생성 가능
- Gemini/DALL-E API 비용 폭증
- 서버 리소스 고갈

**수정 방법**:
```java
private static final int MAX_MANUAL_DIARIES_PER_DAY = 5;

private void checkDiaryGenerationLimit(Long userId) {
    String key = "rate_limit:diary_generation:" + userId + ":" + LocalDate.now();
    Long count = redisTemplate.opsForValue().increment(key);

    if (count != null && count > MAX_MANUAL_DIARIES_PER_DAY) {
        throw new BusinessException(ErrorCode.DIARY_GENERATION_LIMIT_EXCEEDED,
            "하루 최대 " + MAX_MANUAL_DIARIES_PER_DAY + "개의 일기만 생성할 수 있습니다");
    }

    if (count == 1) {
        redisTemplate.expire(key, 1, TimeUnit.DAYS);
    }
}

// generateDiary 메서드 시작 부분에 추가
public Diary generateDiary(Long userId, LocalDate date, DiaryGenerationType type) {
    if (type == DiaryGenerationType.MANUAL) {
        checkDiaryGenerationLimit(userId);
    }
    // ... 기존 코드
}
```

---

### 12. 스케줄러 성능 문제

**위치**: `src/main/java/com/catus/backend/scheduler/DiaryScheduler.java` (69-92줄)

**문제**: 사용자를 순차적으로 처리

**영향**: 10,000명 사용자 시 몇 시간 소요 가능

**수정 방법**: 병렬 처리 구현 (별도 문서 참조)

---

### 13-20. 기타 높은 우선순위 이슈

자세한 내용은 종합 코드 리뷰 리포트 참조

---

## 📋 수정 우선순위

### Phase 1: 즉시 수정 (배포 전 필수)
1. ⭐ 데이터베이스 스키마 수정 (이슈 #1)
2. JWT secret 검증 추가 (이슈 #2)
3. 하드코딩된 인증정보 제거 (이슈 #3)
4. Firebase 설정 수정 (이슈 #4)
5. Race condition 수정 (이슈 #5)

### Phase 2: 빠른 시일 내 (배포 후 1주)
6. 인덱스 이름 통일 (이슈 #6)
7. 연결 풀 설정 추가 (이슈 #7)
8. 타임아웃 증가 (이슈 #8)
9. N+1 쿼리 수정 (이슈 #9)
10. Rate limiting 추가 (이슈 #11)

### Phase 3: 개선 (배포 후 1개월)
11. 메모리 제한 추가 (이슈 #10)
12. 스케줄러 병렬화 (이슈 #12)
13. 기타 중간/낮은 우선순위 이슈들

---

## 🧪 테스트 상태

**현재**: 28개 테스트 중 12개 실패

**실패 원인**:
1. PostgreSQL 로컬 연결 실패
2. Mockito unnecessary stubbing 경고
3. JWT 테스트 기대값 불일치

**해결 방법**:
1. TestContainers 사용으로 전환
2. Mockito 스텁 정리
3. JWT 테스트 기대값 수정

---

## 📝 수정 후 확인사항

각 이슈 수정 후 다음을 확인하세요:

```bash
# 빌드 성공 확인
./gradlew clean build

# 테스트 통과 확인
./gradlew test

# 애플리케이션 시작 확인
./gradlew bootRun

# Health check
curl http://localhost:8080/api/v1/health
```

---

## 🚀 배포 준비 체크리스트

- [ ] 모든 크리티컬 이슈 수정 (이슈 #1-8)
- [ ] 모든 테스트 통과 (28/28)
- [ ] 로컬 환경에서 정상 동작 확인
- [ ] 환경 변수 설정 완료
- [ ] Docker 컨테이너 정상 작동
- [ ] 프로덕션 데이터베이스 마이그레이션 완료
- [ ] AWS S3 버킷 생성 및 권한 설정
- [ ] Firebase 프로젝트 설정 완료
- [ ] API 테스트 완료 (Postman/cURL)
- [ ] 보안 감사 완료

---

**다음 작업**: 이슈 #1 (데이터베이스 스키마) 수정부터 시작하세요!

**문서 위치**: `C:\Users\hoonl\dev\Catus_Backend\CRITICAL_ISSUES.md`
**최종 업데이트**: 2025-11-11
