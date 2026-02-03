# 실시간 알림 시스템 문서

## 개요

QR 스마트 주문 시스템의 실시간 알림 기능은 Socket.io를 기반으로 구현되어 있으며, WebSocket 연결 실패 시 HTTP 폴링으로 자동 전환되는 폴백 메커니즘을 제공합니다.

## 아키텍처

### 핵심 컴포넌트

1. **Socket Store** (`socket-store.ts`)
   - Zustand 기반 전역 상태 관리
   - Socket.io 클라이언트 연결 관리
   - 자동 재연결 로직 (지수 백오프)
   - 연결 상태 추적

2. **알림 훅**
   - `useOrderNotification`: 고객 화면용 알림 훅
   - `useKitchenNotification`: 주방 화면용 알림 훅
   - `useSocketWithFallback`: Socket 연결 및 폴백 관리
   - `useNetworkStatus`: 네트워크 상태 감지

3. **미들웨어 시스템** (`socket-middleware.ts`)
   - 이벤트 처리 미들웨어 체인
   - 로깅, 에러 처리, 디바운싱, 쓰로틀링
   - 이벤트 히스토리 관리

4. **이벤트 버스** (`socket-event-bus.ts`)
   - 중앙 집중식 이벤트 관리
   - 이벤트 구독/발행 패턴
   - 타입 안전한 이벤트 리스너

## 주요 기능

### 1. 실시간 알림

#### 고객 화면
- 주문 준비 완료 알림 (`order_ready`)
- 주문 상태 변경 알림 (`order_status_changed`)
- Toast 알림 자동 표시
- 진동 API 연동 (모바일)
- 자동 화면 갱신

#### 주방 화면
- 신규 주문 알림 (`new_order`)
- 알림음 자동 재생
- 브라우저 알림 (Notification API)
- 주문 목록 자동 갱신
- 장시간 미처리 주문 반복 알림

### 2. 재연결 로직

```typescript
// 지수 백오프 알고리즘
재연결 시도 간격: 3초 → 6초 → 12초 → 24초 → 48초
최대 재연결 시도: 5회
```

- 연결 끊김 자동 감지
- 네트워크 복구 시 자동 재연결
- 이전 룸 자동 재참여
- 재연결 상태 UI 표시

### 3. 폴링 폴백

Socket 연결 실패 시 HTTP 폴링으로 자동 전환:

| 상태 | 포그라운드 | 백그라운드 |
|------|-----------|-----------|
| Socket 연결 | 10초 | 60초 |
| Socket 미연결 | 5초 | 30초 |
| 오프라인 | 중지 | 중지 |

### 4. 네트워크 최적화

- 네트워크 품질 감지 (Network Information API)
- 배터리 절약 모드 대응
- 페이지 가시성에 따른 폴링 간격 조정
- 저전력 모드 감지 및 최적화

## 사용법

### 기본 설정

환경 변수에 Socket 서버 URL 설정:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 고객 화면에서 사용

```typescript
import { useOrderNotification } from "@/hooks/use-order-notification";

function OrderPage() {
  const { isConnected } = useOrderNotification({
    orderId: "order-123",
    onOrderReady: () => {
      console.log("주문이 준비되었습니다!");
    },
    enableVibration: true,
    enableToast: true,
  });

  return <div>연결 상태: {isConnected ? "실시간" : "폴링"}</div>;
}
```

### 주방 화면에서 사용

```typescript
import { useKitchenNotification } from "@/hooks/use-kitchen-notification";

function KitchenPage() {
  const { isConnected } = useKitchenNotification({
    onNewOrder: (order) => {
      console.log("새 주문:", order);
    },
    enableSound: true,
    audioRef: audioRef,
  });

  return <div>연결 상태: {isConnected ? "실시간" : "폴링"}</div>;
}
```

### 이벤트 버스 사용

```typescript
import { socketEventBus } from "@/lib/socket-event-bus";

// 이벤트 구독
const unsubscribe = socketEventBus.on("new_order", (data) => {
  console.log("새 주문:", data);
});

// 이벤트 발행
socketEventBus.emit("new_order", {
  orderId: "123",
  tableId: "1",
  items: [],
  totalPrice: 10000,
  createdAt: new Date().toISOString(),
});

// 구독 해제
unsubscribe();
```

## 이벤트 타입

### SocketEvent

```typescript
enum SocketEvent {
  // 연결 관련
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CONNECT_ERROR = 'connect_error',
  RECONNECT = 'reconnect',

  // 룸 관련
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',

  // 주문 관련
  NEW_ORDER = 'new_order',
  ORDER_READY = 'order_ready',
  ORDER_STATUS_CHANGED = 'order_status_changed',

  // 에러
  ERROR = 'error',
}
```

### 이벤트 페이로드

```typescript
interface SocketEventPayload {
  [SocketEvent.NEW_ORDER]: {
    orderId: string;
    tableId: string;
    items: OrderItem[];
    totalPrice: number;
    createdAt: string;
  };

  [SocketEvent.ORDER_READY]: {
    orderId: string;
    tableId: string;
    message?: string;
  };

  [SocketEvent.ORDER_STATUS_CHANGED]: {
    orderId: string;
    status: OrderStatus;
    updatedAt: string;
  };
}
```

## 연결 상태

```typescript
enum SocketStatus {
  DISCONNECTED = 'disconnected',  // 연결 끊김
  CONNECTING = 'connecting',      // 연결 중
  CONNECTED = 'connected',        // 연결됨
  RECONNECTING = 'reconnecting',  // 재연결 중
  FAILED = 'failed',             // 연결 실패
}
```

## 테스트

### 연결 테스트

1. 정상 연결 확인
   - Socket 서버 실행
   - 웹 앱 접속
   - 개발자 도구 콘솔에서 "✅ Socket connected" 메시지 확인

2. 재연결 테스트
   - Socket 서버 중지
   - "❌ Socket disconnected" 메시지 확인
   - 재연결 시도 메시지 확인 ("🔄 Reconnection attempt...")
   - Socket 서버 재시작
   - "✅ Reconnected" 메시지 확인

3. 폴링 폴백 테스트
   - Socket 서버를 시작하지 않은 상태에서 앱 접속
   - "폴링" 상태 표시 확인
   - 주문 목록이 폴링으로 갱신되는지 확인

### 알림 테스트

1. 고객 화면 알림
   - 주문 완료 페이지 접속
   - 주방에서 주문 상태를 "READY"로 변경
   - Toast 알림 표시 확인
   - 진동 발생 확인 (모바일)

2. 주방 화면 알림
   - 주방 화면 접속
   - 고객이 새 주문 생성
   - 알림음 재생 확인
   - 브라우저 알림 표시 확인
   - 주문 카드 자동 추가 확인

### 네트워크 테스트

1. 오프라인 전환
   - 브라우저 개발자 도구에서 "Offline" 모드 활성화
   - 연결 상태가 "연결 끊김"으로 변경되는지 확인
   - 폴링이 중지되는지 확인

2. 온라인 복구
   - "Offline" 모드 비활성화
   - 자동으로 Socket 재연결 시도하는지 확인
   - 연결 성공 후 정상 동작하는지 확인

## 트러블슈팅

### Socket 연결이 안 됨

1. Socket 서버 URL 확인
   ```bash
   echo $NEXT_PUBLIC_SOCKET_URL
   ```

2. Socket 서버 실행 상태 확인
   ```bash
   curl http://localhost:3001/socket.io/
   ```

3. CORS 설정 확인
   - Socket 서버에서 클라이언트 origin 허용 필요

### 알림이 표시되지 않음

1. 브라우저 알림 권한 확인
   - 설정 > 개인정보 보호 > 알림 권한 확인

2. Toast 컴포넌트 확인
   - Layout에 `<Toaster />` 추가되어 있는지 확인

3. 이벤트 리스너 확인
   - 콘솔에서 이벤트 수신 로그 확인

### 재연결이 실패함

1. 최대 재연결 시도 횟수 초과
   - 5회 시도 후 실패
   - 페이지 새로고침 필요

2. 네트워크 상태 확인
   - 인터넷 연결 확인
   - 방화벽 설정 확인

## 성능 고려사항

### 메모리 사용

- 이벤트 히스토리: 최대 100개 (미들웨어), 50개 (이벤트 버스)
- 자동으로 오래된 항목 제거

### 배터리 절약

- 백그라운드에서 폴링 간격 증가 (10배)
- 저전력 모드 감지 및 대응
- 불필요한 재연결 시도 방지

### 네트워크 최적화

- WebSocket 우선, 실패 시 polling
- 네트워크 품질에 따른 폴링 간격 조정
- 오프라인 시 폴링 중지

## 향후 개선 사항

- [ ] 서비스 워커를 통한 백그라운드 알림
- [ ] 푸시 알림 (Web Push API)
- [ ] 오프라인 큐잉 및 재전송
- [ ] 알림 통계 및 분석
- [ ] A/B 테스트 프레임워크
