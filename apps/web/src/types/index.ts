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
