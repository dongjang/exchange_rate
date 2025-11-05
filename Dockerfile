# Multi-stage build for Spring Boot application (Backend only)

# Stage 1: Build Backend
FROM gradle:8-jdk17-alpine AS backend-build

# Disable Gradle daemon completely and fix permissions
ENV GRADLE_OPTS="-Dorg.gradle.daemon=false -Dorg.gradle.parallel=false -Dorg.gradle.configureondemand=false"
ENV GRADLE_USER_HOME=/home/gradle/.gradle

# Fix Gradle permissions and ensure proper cache directory setup
USER root
RUN mkdir -p /home/gradle/.gradle /app && \
    chown -R gradle:gradle /home/gradle /app && \
    chmod -R 777 /home/gradle/.gradle /app

USER gradle
WORKDIR /app

# Copy gradle files first for better caching
COPY --chown=gradle:gradle build.gradle settings.gradle ./
COPY --chown=gradle:gradle gradle/ ./gradle/

# Create gradle.properties to disable daemon and configure build
RUN echo "org.gradle.daemon=false" > gradle.properties && \
    echo "org.gradle.parallel=false" >> gradle.properties && \
    echo "org.gradle.configureondemand=false" >> gradle.properties && \
    echo "org.gradle.caching=false" >> gradle.properties

# Ensure /app/.gradle directory has proper permissions
USER root
RUN mkdir -p /app/.gradle && chown -R gradle:gradle /app/.gradle && chmod -R 777 /app/.gradle
USER gradle

# Skip dependencies step and build directly (build will download dependencies automatically)
# This avoids the permission issue with gradle dependencies command
COPY --chown=gradle:gradle src/ ./src/

# Build application (this will download dependencies automatically)
RUN gradle build -x test --no-daemon --no-build-cache

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

