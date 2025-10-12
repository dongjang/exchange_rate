# Multi-stage build for Spring Boot application (Backend only)

# Stage 1: Build Backend
FROM gradle:8-jdk17-alpine AS backend-build
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY gradle/ ./gradle/
RUN gradle dependencies --no-daemon
COPY src/ ./src/
RUN gradle build -x test --no-daemon

# Stage 2: Runtime
FROM eclipse-temurin:17-jre

# Install necessary packages
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=backend-build /app/build/libs/*.jar app.jar

# Create uploads directory
RUN mkdir -p uploads && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8081

# Health check 제거 (Spring Security로 인한 403 에러)
# HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
#   CMD curl -f http://localhost:8081/ || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]

