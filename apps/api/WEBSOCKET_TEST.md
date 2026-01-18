# WebSocket 테스트 가이드

## 개요

WebSocket Gateway의 기능을 테스트하고 성능을 측정하기 위한 테스트 스크립트입니다.

## 테스트 스크립트

### 1. 통합 테스트 (`test-websocket.ts`)

기본 기능 통합 테스트를 수행합니다.

```bash
npm run test:websocket
```

**테스트 항목:**
- kitchen 룸 조인/나가기
- order 룸 조인/나가기
- 에러 처리
- 하트비트 메커니즘
- 상태 복구 (restore_rooms)
- 연결 해제 시 자동 정리

### 2. 부하 테스트 (`test-websocket-load.ts`)

동시 접속자 부하 테스트를 수행합니다.

```bash
# 기본 실행 (10명, 30초)
npm run test:websocket:load

# 커스텀 실행
ts-node src/test-websocket-load.ts [클라이언트 수] [테스트 시간(초)]
# 예: ts-node src/test-websocket-load.ts 20 60
```

**테스트 항목:**
- 동시 연결 처리 능력
- 메시지 처리 성능
- 메모리 사용량
- 에러 발생률

## 성능 모니터링

Gateway에서 성능 통계를 조회할 수 있습니다:

```typescript
const stats = gateway.getPerformanceStats();
// {
//   connections: { current, total, reconnects },
//   rooms: { kitchen: { clients }, order: { clients, totalRooms } },
//   memory: { heapUsed, heapTotal, rss },
//   timestamp
// }
```

## 테스트 전 준비사항

1. API 서버 실행:
   ```bash
   npm run dev
   ```

2. 환경 변수 확인:
   - `API_URL` (기본값: `http://localhost:3001`)

## 예상 결과

### 통합 테스트
- 모든 테스트 케이스 통과
- 에러 메시지가 적절히 표시됨
- 하트비트가 정상 작동함

### 부하 테스트
- 연결 유지율: 95% 이상
- 에러율: 5% 이하
- 메모리 사용량: 안정적

## 문제 해결

### 연결 실패
- 서버가 실행 중인지 확인
- 포트 번호 확인 (기본: 3001)
- CORS 설정 확인

### 부하 테스트 실패
- 서버 리소스 확인
- 클라이언트 수를 줄여서 테스트
- 네트워크 상태 확인
