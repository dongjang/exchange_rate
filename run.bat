@echo off
chcp 65001 >nul
echo ========================================
echo    Exchange Rate User App
echo    로컬 개발 환경 설정
echo ========================================
echo.

REM ============================================
REM 1단계: 완전 정리
REM ============================================
echo 1단계: 기존 컨테이너 정리 중...
docker stop exchange-rate-user-grafana exchange-rate-user-prometheus exchange-rate-user-node-exporter user-redis 2>nul
docker rm -f exchange-rate-user-grafana exchange-rate-user-prometheus exchange-rate-user-node-exporter user-redis 2>nul

docker-compose -f docker-compose.monitoring.local.yml down 2>nul
docker-compose -f docker-compose.redis.yml down 2>nul

echo 정리 완료!
echo.

REM ============================================
REM 2단계: Redis 시작
REM ============================================
echo 2단계: Redis 서비스 시작 중...
docker-compose -f docker-compose.redis.yml up -d

echo Redis 시작 대기 중...
timeout /t 5 /nobreak >nul

docker ps | findstr "user-redis" >nul
if %errorlevel% equ 0 (
    echo ✓ Redis 시작 성공!
) else (
    echo ✗ Redis 시작 실패! 로그 확인:
    docker logs user-redis
    pause
    exit /b 1
)
echo.

REM ============================================
REM 3단계: 모니터링 도구 시작
REM ============================================
echo 3단계: 모니터링 도구 시작 중...
docker-compose -f docker-compose.monitoring.local.yml up -d

echo 모니터링 도구 시작 대기 중...
timeout /t 5 /nobreak >nul

echo ✓ 모니터링 도구 시작 완료!
echo.

REM ============================================
REM 최종 상태 확인
REM ============================================
echo ========================================
echo 최종 상태 확인:
echo ========================================
docker ps
echo.

echo ========================================
echo 설정 완료!
echo.
echo 로컬 접속 URL:
echo   User App:   http://localhost:8080 (VS Code에서 실행 후)
echo   Redis:      localhost:6380
echo   Grafana:    http://localhost:3001 (admin/admin123)
echo   Prometheus: http://localhost:9091
echo.
echo 다음 단계:
echo   1. VS Code Spring Dashboard에서 User App 시작
echo   2. Active profile: "local" 선택
echo   3. User App이 localhost:8080에서 실행되고 Redis(localhost:6380)에 자동 연결됨
echo.
echo 로그 확인: docker logs -f user-redis
echo 중지:     docker-compose -f docker-compose.redis.yml down
echo          docker-compose -f docker-compose.monitoring.local.yml down
echo ========================================
pause

