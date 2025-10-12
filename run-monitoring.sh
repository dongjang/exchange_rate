#!/bin/bash

echo "========================================"
echo "   User App 모니터링 도구 실행"
echo "========================================"
echo

echo "모니터링 스택 실행 중..."
docker-compose -f docker-compose.monitoring.yml up -d

echo
echo "========================================"
echo "모니터링 도구 실행 완료!"
echo
echo "Grafana:    http://localhost:3001 (admin/admin123)"
echo "Prometheus: http://localhost:9091"
echo "Node Exporter: http://localhost:9101"
echo
echo "중지하려면: docker-compose -f docker-compose.monitoring.yml down"
echo "========================================"

