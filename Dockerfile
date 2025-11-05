# Multi-stage build for Spring Boot application (Backend only)

# Stage 1: Build Backend
FROM gradle:8-jdk17-alpine AS backend-build

# Disable Gradle daemon completely and fix permissions
ENV GRADLE_OPTS="-Dorg.gradle.daemon=false -Dorg.gradle.parallel=false"
ENV GRADLE_USER_HOME=/home/gradle/.gradle

# Fix Gradle permissions and ensure proper cache directory setup
USER root
RUN mkdir -p /home/gradle/.gradle && \
    chown -R gradle:gradle /home/gradle && \
    chmod -R 755 /home/gradle/.gradle

USER gradle
WORKDIR /app

# Copy gradle files first for better caching
COPY --chown=gradle:gradle build.gradle settings.gradle ./
COPY --chown=gradle:gradle gradle/ ./gradle/

# Download dependencies with proper permissions
RUN gradle dependencies --no-daemon

# Copy source code
COPY --chown=gradle:gradle src/ ./src/

# Build application
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

