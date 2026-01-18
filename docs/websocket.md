# WebSocket 실시간 통신 가이드

## 📖 목차

1. [WebSocket이란?](#websocket이란)
2. [왜 WebSocket을 사용하나요?](#왜-websocket을-사용하나요)
3. [시스템 구조](#시스템-구조)
4. [룸(Room) 개념](#룸room-개념)
5. [주요 기능](#주요-기능)
6. [이벤트 목록](#이벤트-목록)
7. [사용 예제](#사용-예제)
8. [테스트 방법](#테스트-방법)

---

## WebSocket이란?

**WebSocket**은 브라우저와 서버 간 **양방향 실시간 통신**을 가능하게 하는 기술입니다.

### 일반 HTTP vs WebSocket

```
일반 HTTP (REST API):
클라이언트 → 서버: "주문 상태 알려줘"
서버 → 클라이언트: "주문 상태는 PENDING입니다"
(끝 - 연결 종료)

WebSocket:
클라이언트 ←→ 서버: 연결 유지
서버 → 클라이언트: "새 주문이 들어왔어요!" (실시간 알림)
클라이언트 → 서버: "알겠습니다"
(연결 유지 - 계속 통신 가능)
```

### 비유로 이해하기

- **일반 HTTP**: 전화를 걸어서 물어보고 끊는 방식
- **WebSocket**: 전화를 걸어놓고 계속 연결된 상태로 대화하는 방식

---

## 왜 WebSocket을 사용하나요?

이 프로젝트에서는 **실시간 주문 알림**을 위해 WebSocket을 사용합니다.

### 사용 사례

1. **주방 화면**: 고객이 주문을 하면 **즉시** 주방 화면에 알림이 표시됩니다
2. **고객 화면**: 주문이 준비되면 **즉시** 고객에게 알림이 전달됩니다

### WebSocket 없이 하면?

```javascript
// 폴링 방식 (비효율적)
setInterval(() => {
  // 5초마다 서버에 물어봄: "주문 준비됐나요?"
  fetch('/api/orders/123/status')
}, 5000);
```

**문제점:**
- 서버에 계속 요청을 보내야 함 (리소스 낭비)
- 최대 5초 지연 발생 (실시간이 아님)
- 서버 부하 증가

### WebSocket을 사용하면?

```javascript
// WebSocket (효율적)
socket.on('order_ready', (data) => {
  // 주문이 준비되면 즉시 알림 받음 (0초 지연)
  alert('주문이 준비되었습니다!');
});
```

**장점:**
- 서버가 직접 알림을 보냄 (실시간)
- 불필요한 요청 없음 (효율적)
- 서버 부하 감소

---

## 시스템 구조

### 전체 흐름도

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   고객      │         │   서버       │         │   주방      │
│  (웹앱)     │         │ (Nest.js)    │         │  (태블릿)   │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                        │                        │
       │  1. WebSocket 연결     │                        │
       ├───────────────────────>│                        │
       │                        │                        │
       │  2. order 룸 조인      │                        │
       ├───────────────────────>│                        │
       │                        │                        │
       │                        │  3. kitchen 룸 조인   │
       │                        │<───────────────────────┤
       │                        │                        │
       │  4. 주문 생성 (REST)    │                        │
       ├───────────────────────>│                        │
       │                        │                        │
       │                        │  5. new_order 이벤트   │
       │                        │───────────────────────>│
       │                        │                        │
       │                        │  6. 주문 상태 변경     │
       │                        │<───────────────────────┤
       │                        │                        │
       │  7. order_ready 이벤트  │                        │
       │<───────────────────────┤                        │
       │                        │                        │
```

### 파일 구조

```
apps/api/src/
├── websocket/
│   ├── websocket.gateway.ts    # WebSocket 핵심 로직
│   └── websocket.module.ts      # WebSocket 모듈 설정
└── orders/
    └── orders.controller.ts     # 주문 API (WebSocket 이벤트 발생)
```

---

## 룸(Room) 개념

**룸(Room)**은 특정 그룹의 클라이언트들에게만 메시지를 보낼 수 있는 공간입니다.

### 비유로 이해하기

- **일반 채팅방**: 모든 사람이 메시지를 볼 수 있음
- **룸**: 특정 그룹만 메시지를 볼 수 있음

### 이 프로젝트의 룸 종류

#### 1. `kitchen` 룸 (주방용)

**목적**: 모든 주방 직원이 신규 주문을 받을 수 있도록 함

```
주방 직원 A ──┐
주방 직원 B ──┼──> kitchen 룸 ──> 모두가 신규 주문 알림 받음
주방 직원 C ──┘
```

**사용 예시:**
- 고객이 주문을 하면 → `kitchen` 룸의 모든 직원에게 알림

#### 2. `order_${orderId}` 룸 (고객용)

**목적**: 특정 주문의 고객에게만 알림을 보냄

```
고객 A (주문 #1) ──> order_주문ID1 룸
고객 B (주문 #2) ──> order_주문ID2 룸
```

**사용 예시:**
- 주문 #1이 준비되면 → `order_주문ID1` 룸의 고객 A에게만 알림
- 주문 #2의 고객 B는 알림을 받지 않음

### 룸 조인/나가기

```javascript
// 룸 조인
socket.emit('join_kitchen', {
  roomType: 'kitchen'
});

// 룸 나가기
socket.emit('leave_room', {
  roomType: 'kitchen'
});
```

---

## 주요 기능

### 1. 연결 관리

#### 클라이언트 연결 시

```typescript
// 서버에서 자동으로 실행됨
handleConnection(client: Socket) {
  // 1. 클라이언트 ID 저장
  // 2. 연결 시간 기록
  // 3. 통계 업데이트
}
```

**자동으로 처리되는 것:**
- 클라이언트 ID 할당
- 연결 시간 기록
- 연결 통계 업데이트

#### 클라이언트 연결 해제 시

```typescript
// 서버에서 자동으로 실행됨
handleDisconnect(client: Socket) {
  // 1. 모든 룸에서 자동 제거
  // 2. 메타데이터 정리
  // 3. 통계 업데이트
}
```

**자동으로 처리되는 것:**
- `kitchen` 룸에서 제거
- 모든 `order_` 룸에서 제거
- 메모리 정리

### 2. 하트비트 (Heartbeat)

**하트비트**는 "살아있니?" 확인하는 메시지입니다.

#### 작동 방식

```
서버: "살아있니?" (heartbeat 이벤트)
  ↓
클라이언트: "응! 살아있어!" (heartbeat_ack 이벤트)
  ↓
서버: "좋아, 연결 유지"
```

#### 설정

- **주기**: 30초마다 확인
- **타임아웃**: 15초 동안 응답 없으면 연결 해제

#### 왜 필요한가요?

네트워크가 끊겼는데 서버가 모르는 경우를 방지합니다.

```
클라이언트가 갑자기 꺼짐
  ↓
서버는 계속 메시지를 보냄 (낭비)
  ↓
하트비트로 확인 → 응답 없음 → 연결 해제
```

### 3. 에러 처리

모든 에러는 표준화된 형식으로 전달됩니다.

```typescript
// 에러 형식
{
  message: "에러 메시지",
  code: "ERROR_CODE",
  timestamp: "2024-01-15T10:00:00Z"
}
```

#### 에러 코드 종류

- `CONNECTION_FAILED`: 연결 실패
- `VALIDATION_ERROR`: 요청 데이터 오류
- `ROOM_JOIN_FAILED`: 룸 조인 실패
- `ROOM_LEAVE_FAILED`: 룸 나가기 실패
- `MESSAGE_SEND_FAILED`: 메시지 전송 실패
- `UNAUTHORIZED`: 인증 오류
- `INTERNAL_ERROR`: 서버 내부 오류

### 4. 재연결 처리

네트워크가 끊겼다가 다시 연결되면 자동으로 처리됩니다.

#### 재연결 시 자동 처리

1. 재연결 감지
2. 재연결 성공 이벤트 전송
3. 이전 상태 복구 가능 (선택적)

#### 상태 복구 예시

```javascript
// 재연결 후 이전 룸 정보 복구
socket.emit('restore_rooms', {
  rooms: [
    { roomType: 'kitchen' },
    { roomType: 'order', orderId: '주문ID' }
  ]
});
```

---

## 이벤트 목록

### 클라이언트 → 서버 (요청)

| 이벤트 이름 | 설명 | 데이터 형식 |
|-----------|------|------------|
| `join_kitchen` | kitchen 룸 조인 | `{ roomType: 'kitchen' }` |
| `join_kitchen` | order 룸 조인 | `{ roomType: 'order', orderId: '주문ID' }` |
| `leave_room` | 룸 나가기 | `{ roomType: 'kitchen' }` 또는 `{ roomType: 'order', orderId: '주문ID' }` |
| `heartbeat_ack` | 하트비트 응답 | 없음 |
| `restore_rooms` | 재연결 시 상태 복구 | `{ rooms: [{ roomType, orderId? }] }` |

### 서버 → 클라이언트 (알림)

| 이벤트 이름 | 설명 | 데이터 형식 |
|-----------|------|------------|
| `new_order` | 신규 주문 알림 (주방용) | `{ orderId, orderNo, items, totalPrice, createdAt }` |
| `order_ready` | 주문 준비 완료 알림 (고객용) | `{ orderId, orderNo, status, updatedAt }` |
| `heartbeat` | 하트비트 확인 | `{ timestamp }` |
| `reconnect_success` | 재연결 성공 | `{ message, timestamp }` |
| `restore_rooms_success` | 상태 복구 성공 | `{ message, restoredCount, timestamp }` |
| `Join_room_success` | kitchen 룸 조인 성공 | `{ roomType, message }` |
| `join_room_success` | order 룸 조인 성공 | `{ roomType, orderId, message }` |
| `leave_room_success` | 룸 나가기 성공 | `{ roomType, orderId?, message }` |
| `error` | 에러 발생 | `{ message, code, timestamp }` |

---

## 사용 예제

### 예제 1: 주방 화면에서 신규 주문 받기

```javascript
// 1. WebSocket 연결
const socket = io('http://localhost:3001');

// 2. 연결 성공 시
socket.on('connect', () => {
  console.log('서버에 연결되었습니다!');
  
  // 3. kitchen 룸 조인
  socket.emit('join_kitchen', {
    roomType: 'kitchen'
  });
});

// 4. kitchen 룸 조인 성공 확인
socket.on('Join_room_success', (data) => {
  console.log('주방 룸에 조인했습니다!');
});

// 5. 신규 주문 알림 받기
socket.on('new_order', (orderData) => {
  console.log('새 주문이 들어왔습니다!', orderData);
  // 화면에 주문 카드 표시
  displayOrderCard(orderData);
});

// 6. 하트비트 응답
socket.on('heartbeat', () => {
  socket.emit('heartbeat_ack');
});
```

### 예제 2: 고객 화면에서 주문 준비 완료 알림 받기

```javascript
// 1. WebSocket 연결
const socket = io('http://localhost:3001');

// 2. 연결 성공 시
socket.on('connect', () => {
  // 3. 주문 ID로 order 룸 조인
  const orderId = '550e8400-e29b-41d4-a716-446655440000';
  socket.emit('join_kitchen', {
    roomType: 'order',
    orderId: orderId
  });
});

// 4. order 룸 조인 성공 확인
socket.on('join_room_success', (data) => {
  if (data.roomType === 'order') {
    console.log('주문 룸에 조인했습니다!', data.orderId);
  }
});

// 5. 주문 준비 완료 알림 받기
socket.on('order_ready', (orderData) => {
  console.log('주문이 준비되었습니다!', orderData);
  // 알림 표시
  alert(`주문 #${orderData.orderNo}이(가) 준비되었습니다!`);
  // 진동 (모바일)
  if (navigator.vibrate) {
    navigator.vibrate(200);
  }
});

// 6. 하트비트 응답
socket.on('heartbeat', () => {
  socket.emit('heartbeat_ack');
});
```

### 예제 3: 재연결 시 상태 복구

```javascript
// 1. 연결 끊김 감지
socket.on('disconnect', () => {
  console.log('연결이 끊겼습니다. 재연결 시도 중...');
});

// 2. 재연결 성공
socket.on('connect', () => {
  console.log('재연결 성공!');
  
  // 3. 이전 상태 복구
  const previousRooms = [
    { roomType: 'kitchen' },
    { roomType: 'order', orderId: '주문ID' }
  ];
  
  socket.emit('restore_rooms', {
    rooms: previousRooms
  });
});

// 4. 상태 복구 성공 확인
socket.on('restore_rooms_success', (data) => {
  console.log(`${data.restoredCount}개의 룸이 복구되었습니다.`);
});
```

### 예제 4: 서버에서 이벤트 보내기 (백엔드 코드)

```typescript
// 주문 생성 시 주방에 알림
@Post()
async create(@Body() body: unknown) {
  const order = await this.orderService.create(body);
  
  // kitchen 룸의 모든 클라이언트에게 알림
  this.webSocketGateway.broadcastToKitchen('new_order', {
    orderId: order.id,
    orderNo: order.orderNo,
    items: order.items,
    totalPrice: order.totalPrice,
    createdAt: order.createdAt
  });
  
  return order;
}

// 주문 상태 변경 시 고객에게 알림
@Patch(':id/status')
async updateStatus(@Param('id') id: string, @Body() body: unknown) {
  const order = await this.orderService.updateStatus(id, body);
  
  // 주문 상태가 READY면 고객에게 알림
  if (order.status === 'READY') {
    this.webSocketGateway.broadcastToOrder(order.id, 'order_ready', {
      orderId: order.id,
      orderNo: order.orderNo,
      status: order.status,
      updatedAt: order.updatedAt
    });
  }
  
  return order;
}
```

---

## 테스트 방법

### 1. 통합 테스트 실행

```bash
# API 서버 실행 (터미널 1)
cd apps/api
npm run dev

# 테스트 실행 (터미널 2)
npm run test:websocket
```

**예상 결과:**
- ✅ 서버에 연결되었습니다
- ✅ kitchen 룸 조인 성공
- ✅ order 룸 조인 성공
- ✅ 모든 테스트 완료

### 2. 부하 테스트 실행

```bash
# 기본 실행 (10명, 30초)
npm run test:websocket:load

# 커스텀 실행 (20명, 60초)
ts-node src/test-websocket-load.ts 20 60
```

**예상 결과:**
```
📊 부하 테스트 결과
총 클라이언트 수: 10
연결 유지: 10/10
총 메시지 수신: 300
총 에러 수: 0
테스트 시간: 30초
평균 메시지/초: 10.00
```

### 3. 브라우저에서 테스트

#### Chrome DevTools 사용

1. 브라우저에서 개발자 도구 열기 (F12)
2. Console 탭으로 이동
3. 다음 코드 입력:

```javascript
// Socket.io 클라이언트 라이브러리 로드 (CDN 사용)
const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.8.3/socket.io.min.js';
document.head.appendChild(script);

// 연결
script.onload = () => {
  const socket = io('http://localhost:3001');
  
  socket.on('connect', () => {
    console.log('✅ 연결 성공!', socket.id);
    
    // kitchen 룸 조인
    socket.emit('join_kitchen', { roomType: 'kitchen' });
  });
  
  socket.on('Join_room_success', (data) => {
    console.log('✅ kitchen 룸 조인 성공!', data);
  });
  
  socket.on('new_order', (data) => {
    console.log('📦 새 주문!', data);
  });
  
  socket.on('error', (error) => {
    console.error('❌ 에러:', error);
  });
};
```

---

## 주요 메서드 설명

### 서버 측 (Gateway)

#### `broadcastToKitchen(event, data)`
kitchen 룸의 모든 클라이언트에게 이벤트 전송

```typescript
this.webSocketGateway.broadcastToKitchen('new_order', {
  orderId: '...',
  orderNo: 1,
  // ...
});
```

#### `broadcastToOrder(orderId, event, data)`
특정 주문 룸의 클라이언트에게만 이벤트 전송

```typescript
this.webSocketGateway.broadcastToOrder('주문ID', 'order_ready', {
  orderId: '...',
  orderNo: 1,
  // ...
});
```

#### `getPerformanceStats()`
성능 통계 조회

```typescript
const stats = this.webSocketGateway.getPerformanceStats();
console.log(stats);
// {
//   connections: { current: 10, total: 50, reconnects: 2 },
//   rooms: { kitchen: { clients: 3 }, order: { clients: 7, totalRooms: 10 } },
//   memory: { heapUsed: 45, heapTotal: 60, rss: 120 },
//   timestamp: "2024-01-15T10:00:00Z"
// }
```

---

## 자주 묻는 질문 (FAQ)

### Q1: WebSocket 연결이 끊기면 어떻게 되나요?

**A:** 자동으로 재연결을 시도합니다. 재연결 후 `restore_rooms` 이벤트로 이전 상태를 복구할 수 있습니다.

### Q2: 하트비트는 왜 필요한가요?

**A:** 클라이언트가 갑자기 꺼졌을 때 서버가 알아차리기 위해 필요합니다. 30초마다 확인하고, 15초 동안 응답이 없으면 연결을 해제합니다.

### Q3: 여러 주문을 동시에 받을 수 있나요?

**A:** 네, 한 클라이언트가 여러 `order_` 룸에 조인할 수 있습니다.

```javascript
// 주문 1 룸 조인
socket.emit('join_kitchen', {
  roomType: 'order',
  orderId: '주문ID1'
});

// 주문 2 룸 조인
socket.emit('join_kitchen', {
  roomType: 'order',
  orderId: '주문ID2'
});
```

### Q4: 에러가 발생하면 어떻게 되나요?

**A:** 표준화된 에러 형식으로 `error` 이벤트가 전송됩니다.

```javascript
socket.on('error', (error) => {
  console.error('에러 코드:', error.code);
  console.error('에러 메시지:', error.message);
});
```

### Q5: 성능은 어떤가요?

**A:** `getPerformanceStats()` 메서드로 실시간 성능 통계를 확인할 수 있습니다.

---

## 추가 리소스

- [Socket.io 공식 문서](https://socket.io/docs/v4/)
- [Nest.js WebSocket 가이드](https://docs.nestjs.com/websockets/gateways)
- 프로젝트 내 테스트 가이드: `apps/api/WEBSOCKET_TEST.md`

---

## 요약

### 핵심 개념

1. **WebSocket**: 실시간 양방향 통신
2. **룸**: 특정 그룹에게만 메시지 전송
3. **하트비트**: 연결 상태 확인
4. **에러 처리**: 표준화된 에러 형식

### 주요 이벤트

- `new_order`: 주방에 신규 주문 알림
- `order_ready`: 고객에게 주문 준비 완료 알림
- `heartbeat`: 연결 상태 확인

### 사용 흐름

1. WebSocket 연결
2. 룸 조인 (`kitchen` 또는 `order_주문ID`)
3. 이벤트 수신 대기
4. 하트비트 응답

이제 WebSocket을 사용하여 실시간 주문 알림 시스템을 구현할 수 있습니다! 🎉
