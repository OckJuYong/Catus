# Multi-stage build for Spring Boot application
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app

# Copy gradle wrapper and make it executable
COPY gradlew .
COPY gradle gradle
RUN chmod +x gradlew

# Copy gradle configuration
COPY build.gradle settings.gradle gradle.properties ./

# Download dependencies (cached layer)
RUN ./gradlew dependencies --no-daemon || true

# Copy source code
COPY src src

# Build application
RUN ./gradlew clean build -x test --no-daemon

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy built jar
COPY --from=builder /app/build/libs/catus-backend-1.0.0.jar app.jar

# Expose port
EXPOSE 8080

# Run application
CMD ["java", "-Dserver.port=${PORT:-8080}", "-jar", "app.jar"]
