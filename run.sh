#!/bin/bash

# 한글 출력을 위한 locale 설정
export LANG=ko_KR.UTF-8
export LC_ALL=ko_KR.UTF-8

# 환경변수 로드
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "========================================"
echo "   Exchange Rate User App"
echo "   Production Deployment Script"
echo "========================================"
echo

# 필수 환경변수 확인
required_vars=(
    "DB_URL"
    "DB_USERNAME"
    "DB_PASSWORD"
    "GMAIL_USERNAME"
    "GMAIL_APP_PASSWORD"
    "S3_BUCKET_NAME"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_REGION"
    "EXCHANGE_API_KEY"
    "CORS_ALLOWED_ORIGINS"
    "GRAFANA_USER_PASSWORD"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Warning: $var environment variable is not set!"
        echo "Please check if environment variables are set in GitHub Actions."
        echo
        exit 1
    fi
done

echo "환경변수 설정 완료!"
echo

# Admin 관련 서비스 상태 확인
echo "Admin 관련 서비스 상태 확인 중..."
admin_services=("exadmin-admin-app" "shared-redis")
all_admin_running=true

for service in "${admin_services[@]}"; do
    if docker ps --format "{{.Names}}" | grep -q "^${service}$"; then
        echo "  ✓ ${service} 실행 중 - 보호됨"
    else
        echo "  ⚠️ ${service}가 실행 중이지 않습니다."
        all_admin_running=false
    fi
done

if [ "$all_admin_running" = false ]; then
    echo
    echo "⚠️ 일부 Admin 서비스가 실행되지 않았습니다."
    echo "   Admin App을 먼저 실행해주세요."
    echo
fi

# ============================================
# 1단계: 완전 정리
# ============================================
echo "1단계: 기존 컨테이너 및 프로세스 완전 정리 중..."

# User App Java 프로세스만 종료 (Docker 외부에서 실행 중인 경우)
echo "User App Java 프로세스 종료 중..."
# admin-app은 보호하고 user-app 관련 프로세스만 종료
sudo pkill -f "exproject-user-app" 2>/dev/null || true
sleep 2

# Admin 관련 컨테이너 보호 확인
echo "Admin 관련 컨테이너 보호 중..."
admin_containers=("exadmin-admin-app" "shared-redis" "admin-grafana" "admin-prometheus" "admin-node-exporter")
for container in "${admin_containers[@]}"; do
    if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
        echo "  ✓ ${container} 보호됨 (정리하지 않음)"
    fi
done

# User App 관련 컨테이너만 중지 및 제거
echo "User App 관련 컨테이너만 정리 중..."
docker stop exproject-user-app exchange-rate-user-grafana exchange-rate-user-prometheus exchange-rate-user-node-exporter user-redis 2>/dev/null || true
docker rm -f exproject-user-app exchange-rate-user-grafana exchange-rate-user-prometheus exchange-rate-user-node-exporter user-redis 2>/dev/null || true

# Docker Compose로 정리
docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
docker-compose -f docker-compose.monitoring.yml down --remove-orphans 2>/dev/null || true
docker-compose -f docker-compose.redis.yml down --remove-orphans 2>/dev/null || true

# 네트워크 정리 (admin 네트워크와 충돌 방지)
echo "네트워크 정리 중... (admin 네트워크는 보호)"
# user-network가 존재하고 사용 중이 아닌 경우에만 제거
if docker network ls | grep -q "user-network" && ! docker ps --format "{{.Networks}}" | grep -q "user-network"; then
    docker network rm user-network 2>/dev/null || true
fi

echo "정리 완료!"
echo

# ============================================
# 2단계: Redis 시작
# ============================================
echo "2단계: Redis 서비스 시작 중..."
docker-compose -f docker-compose.redis.yml up -d

# Redis 시작 대기
echo "Redis 시작 대기 중..."
sleep 5

# Redis 상태 확인
if docker ps | grep -q "user-redis"; then
    echo "✓ Redis 시작 성공!"
else
    echo "✗ Redis 시작 실패!"
    docker logs user-redis
    exit 1
fi
echo

# ============================================
# 3단계: User App 시작
# ============================================
echo "3단계: User App 시작 중..."
docker-compose -f docker-compose.prod.yml up -d --build

# User App 시작 대기
echo "User App 시작 대기 중..."
sleep 10

# User App 상태 확인
if docker ps | grep -q "exproject-user-app"; then
    echo "✓ User App 시작 성공!"
else
    echo "✗ User App 시작 실패!"
    docker logs exproject-user-app 2>/dev/null || echo "User App 컨테이너가 생성되지 않았습니다."
    exit 1
fi
echo

# ============================================
# 4단계: 모니터링 도구 시작
# ============================================
echo "4단계: 모니터링 도구 시작 중..."
docker-compose -f docker-compose.monitoring.yml up -d

# 모니터링 도구 시작 대기
echo "모니터링 도구 시작 대기 중..."
sleep 5

echo "✓ 모니터링 도구 시작 완료!"
echo

# ============================================
# 최종 상태 확인
# ============================================
echo "========================================"
echo "최종 상태 확인:"
echo "========================================"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo

echo "========================================"
echo "실행 완료!"
echo
echo "User App: http://43.201.130.137:8081"
echo
echo "모니터링:"
echo "  Grafana:    http://43.201.130.137:3001"
echo "  Prometheus: http://43.201.130.137:9091"
echo
echo "로그 확인: docker logs -f exproject-user-app"
echo "중지:     docker-compose -f docker-compose.prod.yml down"
echo "========================================"

