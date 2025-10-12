#!/bin/bash

echo "========================================"
echo "   Complete Docker Cleanup Script"
echo "   (User App)"
echo "========================================"
echo

# 1. 모든 User App 관련 컨테이너 강제 중지 및 제거
echo "1. User App 컨테이너 중지 및 제거 중..."
docker stop exproject-user-app exchange-rate-user-grafana exchange-rate-user-prometheus exchange-rate-user-node-exporter user-redis 2>/dev/null || true
docker rm -f exproject-user-app exchange-rate-user-grafana exchange-rate-user-prometheus exchange-rate-user-node-exporter user-redis 2>/dev/null || true

# 2. 프로젝트 관련 네트워크 제거
echo "2. 네트워크 정리 중..."
docker network rm user-network 2>/dev/null || true
docker network rm user-network-local 2>/dev/null || true

# 3. Docker Compose로 완전 정리
echo "3. Docker Compose 정리 중..."
docker-compose -f docker-compose.prod.yml down -v --remove-orphans 2>/dev/null || true
docker-compose -f docker-compose.monitoring.yml down -v --remove-orphans 2>/dev/null || true
docker-compose -f docker-compose.monitoring.local.yml down -v --remove-orphans 2>/dev/null || true

# 4. Java 프로세스 종료
echo "4. Java 프로세스 종료 중..."
sudo pkill -9 java 2>/dev/null || true
sleep 2

# 5. 포트 확인
echo "5. 포트 사용 확인 중..."
echo "8081 포트 (User App):"
sudo lsof -i :8081 2>/dev/null || echo "  사용 안 함 ✓"
echo "6380 포트 (User Redis):"
sudo lsof -i :6380 2>/dev/null || echo "  사용 안 함 ✓"
echo "3001 포트 (User Grafana):"
sudo lsof -i :3001 2>/dev/null || echo "  사용 안 함 ✓"
echo "9091 포트 (User Prometheus):"
sudo lsof -i :9091 2>/dev/null || echo "  사용 안 함 ✓"
echo "9101 포트 (User Node Exporter):"
sudo lsof -i :9101 2>/dev/null || echo "  사용 안 함 ✓"

echo
echo "========================================"
echo "정리 완료!"
echo "이제 ./run.sh를 실행하세요."
echo "========================================"

