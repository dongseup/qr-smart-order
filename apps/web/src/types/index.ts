/**
 * 클라이언트 타입 정의
 */

// shared-types에서 재export
export type {
  Menu,
  Order,
  OrderItem,
  OrderStatus,
  OrderWithItems,
  MenuResponse,
  MenuListResponse,
  OrderResponse,
  OrderListResponse,
  OrderStatusResponse,
} from '@qr-smart-order/shared-types';

// ============================================
// 클라이언트 전용 타입
// ============================================

/**
 * 장바구니 아이템
 */
export interface CartItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

/**
 * 장바구니 스토어 인터페이스
 */
export interface CartStore {
  items: CartItem[];
  addItem: (menu: CartItem) => void;
  removeItem: (menuId: string) => void;
  updateQuantity: (menuId: string, quantity: number) => void;
  getTotalPrice: () => number;
  getTotalCount: () => number;
  clear: () => void;
}

/**
 * QR 코드 파라미터
 */
export interface QRParams {
  storeId?: string;
  tableId?: string;
}

/**
 * Socket 이벤트 타입
 */
export enum SocketEvent {
  // 연결 관련
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CONNECT_ERROR = 'connect_error',
  RECONNECT = 'reconnect',
  RECONNECT_ATTEMPT = 'reconnect_attempt',
  RECONNECT_FAILED = 'reconnect_failed',

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

/**
 * Socket 이벤트 페이로드 타입
 */
export interface SocketEventPayload {
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
  [SocketEvent.ERROR]: {
    message: string;
    code?: string;
  };
}

/**
 * Socket 연결 상태
 */
export enum SocketConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}
