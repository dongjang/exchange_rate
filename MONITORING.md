# 모니터링 시스템 가이드

Exchange Rate User App을 위한 모니터링 시스템 설정 및 사용 가이드입니다.

## 📊 모니터링 스택

- **Prometheus** - 메트릭 수집 및 저장
- **Grafana** - 시각화 대시보드
- **Node Exporter** - 시스템 메트릭 수집
- **Spring Boot Actuator** - 애플리케이션 메트릭 노출

## 🚀 빠른 시작

### 로컬 환경

1. **User App 실행** (포트 8081)
   ```bash
   ./gradlew bootRun
   # 또는
   java -jar build/libs/exProject-0.0.1-SNAPSHOT.jar
   ```

2. **모니터링 도구 실행**
   ```bash
   # Windows
   run-monitoring-local.bat

   # Linux/Mac
   chmod +x run-monitoring-local.sh
   ./run-monitoring-local.sh
   ```

3. **접속 URL**
   - **User App**: http://localhost:8081
   - **Actuator**: http://localhost:8081/actuator
   - **Prometheus Metrics**: http://localhost:8081/actuator/prometheus
   - **Grafana**: http://localhost:3001 (admin/admin123)
   - **Prometheus**: http://localhost:9091
   - **Node Exporter**: http://localhost:9100

### 운영 환경

```bash
# Windows
run-monitoring.bat

# Linux/Mac
chmod +x run-monitoring.sh
./run-monitoring.sh
```

## 🔧 포트 구성

### User App (현재 프로젝트)
| 서비스 | 포트 | 설명 |
|--------|------|------|
| User App | 8081 | Spring Boot 애플리케이션 |
| Grafana | 3001 | 모니터링 대시보드 |
| Prometheus | 9091 | 메트릭 수집 서버 |
| Node Exporter | 9100 | 시스템 메트릭 |

### Admin App (참고)
| 서비스 | 포트 | 설명 |
|--------|------|------|
| Admin App | 8080 | Spring Boot 애플리케이션 |
| Grafana | 3000 | 모니터링 대시보드 |
| Prometheus | 9090 | 메트릭 수집 서버 |

> 💡 **Tip**: Admin App과 User App의 모니터링을 동시에 실행할 수 있도록 포트를 분리했습니다!

## 📁 프로젝트 구조

```
exProject/
├── monitoring/
│   ├── grafana/
│   │   ├── dashboards/
│   │   │   ├── dashboard.yml
│   │   │   ├── system-dashboard.json
│   │   │   ├── spring-boot-dashboard.json
│   │   │   ├── api-performance-dashboard.json
│   │   │   ├── database-dashboard.json
│   │   │   ├── error-analysis-dashboard.json
│   │   │   └── user-activity-dashboard.json
│   │   └── datasources/
│   │       └── prometheus.yml
│   ├── prometheus-local.yml
│   ├── prometheus-prod.yml
│   └── prometheus.yml
├── src/main/resources/
│   ├── application.yml
│   ├── application-local.yml
│   ├── application-prod.yml
│   └── application-docker.yml  # Docker 환경 설정
├── Dockerfile                   # Docker 이미지 빌드
├── docker-compose.yml          # (예정) 로컬 개발용
├── docker-compose.prod.yml     # 운영 환경용
├── docker-compose.redis.yml    # Redis 독립 실행용
├── docker-compose.monitoring.yml       # 모니터링 (운영)
├── docker-compose.monitoring.local.yml # 모니터링 (로컬)
├── env.example                 # 환경 변수 예시
├── run.bat / run.sh            # 운영 배포 스크립트
├── run-monitoring.bat / run-monitoring.sh             # 모니터링 실행 (운영)
├── run-monitoring-local.bat / run-monitoring-local.sh # 모니터링 실행 (로컬)
├── cleanup.sh                  # Docker 정리 스크립트
└── MONITORING.md               # 이 파일
```

## 📈 Grafana 대시보드

Grafana에 접속하면 자동으로 프로비저닝된 6개의 대시보드를 사용할 수 있습니다:

1. **System Dashboard** - 서버 리소스 (CPU, 메모리, 디스크)
2. **Spring Boot Dashboard** - Spring Boot 애플리케이션 메트릭
3. **API Performance Dashboard** - API 응답 시간 및 처리량
4. **Database Dashboard** - 데이터베이스 연결 풀 및 쿼리 성능
5. **Error Analysis Dashboard** - 에러 발생 추이 및 분석
6. **User Activity Dashboard** - 사용자 활동 패턴

## 🔍 주요 메트릭

### 애플리케이션 메트릭
- HTTP 요청/응답 통계
- JVM 메모리 사용량
- 스레드 풀 상태
- 데이터베이스 커넥션 풀
- 캐시 히트율

### 시스템 메트릭
- CPU 사용률
- 메모리 사용량
- 디스크 I/O
- 네트워크 트래픽

## 🛠️ Docker Compose 명령어

### 전체 시스템 시작 (권장)
```bash
# Windows
run.sh              # 운영 환경

# Linux/Mac
chmod +x run.sh
./run.sh            # 운영 환경
```

이 스크립트는 자동으로:
1. 기존 컨테이너 정리
2. Redis 시작
3. User App 시작
4. 모니터링 도구 시작

### 개별 서비스 시작

#### Redis만 시작
```bash
docker-compose -f docker-compose.redis.yml up -d
```

#### User App만 시작
```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### 모니터링만 시작
```bash
# 로컬 환경
docker-compose -f docker-compose.monitoring.local.yml up -d

# 운영 환경
docker-compose -f docker-compose.monitoring.yml up -d
```

### 중지
```bash
# 모든 서비스 중지
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.monitoring.yml down
docker-compose -f docker-compose.redis.yml down

# 또는 cleanup 스크립트 사용 (Linux/Mac)
chmod +x cleanup.sh
./cleanup.sh
```

### 로그 확인
```bash
# User App 로그
docker logs -f exproject-user-app

# 모니터링 로그
docker logs -f exchange-rate-user-prometheus-local
docker logs -f exchange-rate-user-grafana-local

# 전체 로그
docker-compose -f docker-compose.monitoring.local.yml logs -f
```

### 상태 확인
```bash
docker-compose -f docker-compose.monitoring.local.yml ps
docker ps
```

### 재빌드
```bash
# 코드 변경 후 재빌드
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🔐 보안 설정

### Grafana 기본 계정
- **Username**: admin
- **Password**: admin123 (로컬) / 환경변수 (운영)

> ⚠️ **주의**: 운영 환경에서는 반드시 강력한 비밀번호를 설정하세요!

### 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하거나 `env.example`을 참고하세요:

```bash
# .env 파일 생성
cp env.example .env
# 그 다음 .env 파일을 편집하여 실제 값 입력
```

**env.example** 파일에 포함된 주요 환경 변수:
- Database 설정 (DB_URL, DB_USERNAME, DB_PASSWORD)
- Gmail 설정 (GMAIL_USERNAME, GMAIL_APP_PASSWORD)
- OAuth2 설정 (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- Exchange API (EXCHANGE_API_KEY)
- AWS S3 (선택사항)
- CORS 설정
- Grafana 관리자 계정

## 🎯 Actuator 엔드포인트

Spring Boot Actuator가 노출하는 주요 엔드포인트:

| 엔드포인트 | URL | 설명 |
|-----------|-----|------|
| Health | `/actuator/health` | 애플리케이션 상태 확인 |
| Metrics | `/actuator/metrics` | 사용 가능한 메트릭 목록 |
| Prometheus | `/actuator/prometheus` | Prometheus 형식 메트릭 |
| Info | `/actuator/info` | 애플리케이션 정보 |

### 예제
```bash
# 헬스 체크
curl http://localhost:8081/actuator/health

# 모든 메트릭 조회
curl http://localhost:8081/actuator/metrics

# JVM 메모리 메트릭
curl http://localhost:8081/actuator/metrics/jvm.memory.used

# Prometheus 메트릭 (전체)
curl http://localhost:8081/actuator/prometheus
```

## 🐛 트러블슈팅

### Prometheus가 메트릭을 수집하지 못할 때

1. **User App이 실행 중인지 확인**
   ```bash
   curl http://localhost:8081/actuator/health
   ```

2. **Prometheus 타겟 상태 확인**
   - http://localhost:9091/targets 접속
   - `user-app` job의 상태가 UP인지 확인

3. **Docker 네트워크 확인**
   ```bash
   docker network ls | grep shared-network
   ```

### Grafana 대시보드가 데이터를 표시하지 않을 때

1. **Prometheus 데이터소스 연결 확인**
   - Grafana > Configuration > Data Sources
   - Prometheus 데이터소스 테스트

2. **Prometheus에서 직접 쿼리 테스트**
   - http://localhost:9091/graph
   - 쿼리 예: `up{job="user-app"}`

### 컨테이너 재시작
```bash
# 특정 컨테이너 재시작
docker restart exchange-rate-user-prometheus-local
docker restart exchange-rate-user-grafana-local

# 전체 재시작
docker-compose -f docker-compose.monitoring.local.yml restart
```

## 📚 참고 자료

- [Prometheus 공식 문서](https://prometheus.io/docs/)
- [Grafana 공식 문서](https://grafana.com/docs/)
- [Spring Boot Actuator 가이드](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)
- [Micrometer 문서](https://micrometer.io/docs)

## 🤝 기여

모니터링 대시보드 개선 아이디어나 버그 리포트는 언제든 환영합니다!

## 📝 라이선스

이 프로젝트의 모니터링 설정은 Admin App의 설정을 기반으로 하여 User App에 맞게 조정되었습니다.

