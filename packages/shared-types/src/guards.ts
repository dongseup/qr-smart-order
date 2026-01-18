import { z } from "zod";
import type { Menu, Order, OrderItem, OrderWithItems } from "./types";
import { OrderStatus } from "./types";

// ============================================
// 타입 확장 정의
// ============================================

/**
 * 통계 정보가 포함된 메뉴 타입
 */
export type MenuWithStats = Menu & {
  orderCount: number;
  totalRevenue: number;
  averageOrderQuantity: number;
};

/**
 * 품절이 아닌 메뉴 타입 (타입 레벨 제약)
 */
export type AvailableMenu = Menu & {
  isSoldOut: false;
};

/**
 * 품절된 메뉴 타입
 */
export type SoldOutMenu = Menu & {
  isSoldOut: true;
};

/**
 * 진행 중인 주문 타입 (PENDING, COOKING, READY 상태)
 */
export type ActiveOrder = Order & {
  status: OrderStatus.PENDING | OrderStatus.COOKING | OrderStatus.READY;
};

/**
 * 완료된 주문 타입
 */
export type CompletedOrder = Order & {
  status: OrderStatus.COMPLETED;
};

/**
 * 대기 중인 주문 타입
 */
export type PendingOrder = Order & {
  status: OrderStatus.PENDING;
};

/**
 * 조리 중인 주문 타입
 */
export type CookingOrder = Order & {
  status: OrderStatus.COOKING;
};

/**
 * 준비 완료된 주문 타입
 */
export type ReadyOrder = Order & {
  status: OrderStatus.READY;
};

/**
 * 상세 정보가 포함된 주문 타입
 */
export type OrderWithDetails = OrderWithItems & {
  estimatedCompletionTime?: string;
  kitchenNotes?: string;
  customerNotes?: string;
};

/**
 * 주문 요약 타입 (간소화된 정보)
 */
export type OrderSummary = Pick<
  Order,
  "id" | "orderNo" | "status" | "totalPrice" | "createdAt"
> & {
  itemCount: number;
};

// ============================================
// Zod 스키마 확장
// ============================================

/**
 * 통계 정보가 포함된 메뉴 스키마
 */
export const MenuWithStatsSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  price: z.number().int().positive().max(1000000),
  imageUrl: z.string().url().nullable().optional(),
  isSoldOut: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  orderCount: z.number().int().nonnegative(),
  totalRevenue: z.number().int().nonnegative(),
  averageOrderQuantity: z.number().nonnegative(),
});

export type MenuWithStatsInferred = z.infer<typeof MenuWithStatsSchema>;

/**
 * 주문 요약 스키마
 */
export const OrderSummarySchema = z.object({
  id: z.string().uuid(),
  orderNo: z.number().int().positive(),
  status: z.nativeEnum(OrderStatus),
  totalPrice: z.number().int().positive(),
  createdAt: z.string().datetime(),
  itemCount: z.number().int().positive(),
});

export type OrderSummaryInferred = z.infer<typeof OrderSummarySchema>;

/**
 * 상세 정보가 포함된 주문 스키마
 */
export const OrderWithDetailsSchema = z.object({
  id: z.string().uuid(),
  orderNo: z.number().int().positive(),
  status: z.nativeEnum(OrderStatus),
  totalPrice: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      orderId: z.string().uuid(),
      menuId: z.string().uuid(),
      quantity: z.number().int().positive(),
      price: z.number().int().positive(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
      menu: z
        .object({
          id: z.string().uuid(),
          name: z.string().min(1).max(100),
          price: z.number().int().positive().max(1000000),
          imageUrl: z.string().url().nullable().optional(),
          isSoldOut: z.boolean().default(false),
          createdAt: z.string().datetime(),
          updatedAt: z.string().datetime(),
        })
        .optional(),
    })
  ),
  estimatedCompletionTime: z.string().datetime().optional(),
  kitchenNotes: z.string().optional(),
  customerNotes: z.string().optional(),
});

export type OrderWithDetailsInferred = z.infer<typeof OrderWithDetailsSchema>;

// ============================================
// 커스텀 타입 가드 함수
// ============================================

/**
 * 주문이 대기 중인지 확인하는 타입 가드
 * @param order - 확인할 주문
 * @returns 주문이 PENDING 상태인지 여부
 */
export function isPendingOrder(order: Order): order is PendingOrder {
  return order.status === OrderStatus.PENDING;
}

/**
 * 주문이 조리 중인지 확인하는 타입 가드
 * @param order - 확인할 주문
 * @returns 주문이 COOKING 상태인지 여부
 */
export function isCookingOrder(order: Order): order is CookingOrder {
  return order.status === OrderStatus.COOKING;
}

/**
 * 주문이 준비 완료되었는지 확인하는 타입 가드
 * @param order - 확인할 주문
 * @returns 주문이 READY 상태인지 여부
 */
export function isReadyOrder(order: Order): order is ReadyOrder {
  return order.status === OrderStatus.READY;
}

/**
 * 주문이 완료되었는지 확인하는 타입 가드
 * @param order - 확인할 주문
 * @returns 주문이 COMPLETED 상태인지 여부
 */
export function isCompletedOrder(order: Order): order is CompletedOrder {
  return order.status === OrderStatus.COMPLETED;
}

/**
 * 주문이 진행 중인지 확인하는 타입 가드 (PENDING, COOKING, READY)
 * @param order - 확인할 주문
 * @returns 주문이 진행 중인지 여부
 */
export function isActiveOrder(order: Order): order is ActiveOrder {
  return (
    order.status === OrderStatus.PENDING ||
    order.status === OrderStatus.COOKING ||
    order.status === OrderStatus.READY
  );
}

/**
 * 주문이 처리 가능한 상태인지 확인하는 타입 가드 (PENDING, COOKING)
 * @param order - 확인할 주문
 * @returns 주문이 처리 가능한 상태인지 여부
 */
export function isProcessableOrder(
  order: Order
): order is PendingOrder | CookingOrder {
  return (
    order.status === OrderStatus.PENDING || order.status === OrderStatus.COOKING
  );
}

/**
 * 메뉴가 품절이 아닌지 확인하는 타입 가드
 * @param menu - 확인할 메뉴
 * @returns 메뉴가 품절이 아닌지 여부
 */
export function isMenuAvailable(menu: Menu): menu is AvailableMenu {
  return !menu.isSoldOut;
}

/**
 * 메뉴가 품절되었는지 확인하는 타입 가드
 * @param menu - 확인할 메뉴
 * @returns 메뉴가 품절되었는지 여부
 */
export function isMenuSoldOut(menu: Menu): menu is SoldOutMenu {
  return menu.isSoldOut === true;
}

/**
 * 주문 상태가 특정 상태로 변경 가능한지 확인하는 함수
 * @param currentStatus - 현재 주문 상태
 * @param targetStatus - 변경하려는 상태
 * @returns 상태 변경이 가능한지 여부
 */
export function canChangeOrderStatus(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus
): boolean {
  // 상태 전환 규칙 정의
  const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [
      OrderStatus.COOKING,
      OrderStatus.COMPLETED, // 취소된 경우
    ],
    [OrderStatus.COOKING]: [OrderStatus.READY, OrderStatus.COMPLETED],
    [OrderStatus.READY]: [OrderStatus.COMPLETED],
    [OrderStatus.COMPLETED]: [], // 완료된 주문은 더 이상 변경 불가
  };

  return allowedTransitions[currentStatus]?.includes(targetStatus) ?? false;
}

/**
 * 주문 아이템이 유효한지 확인하는 타입 가드
 * @param item - 확인할 주문 아이템
 * @returns 주문 아이템이 유효한지 여부
 */
export function isValidOrderItem(item: unknown): item is OrderItem {
  return (
    typeof item === "object" &&
    item !== null &&
    "id" in item &&
    "orderId" in item &&
    "menuId" in item &&
    "quantity" in item &&
    "price" in item &&
    typeof (item as OrderItem).quantity === "number" &&
    typeof (item as OrderItem).price === "number" &&
    (item as OrderItem).quantity > 0 &&
    (item as OrderItem).price > 0
  );
}

/**
 * 주문이 아이템을 가지고 있는지 확인하는 타입 가드
 * @param order - 확인할 주문
 * @returns 주문이 아이템을 가지고 있는지 여부
 */
export function hasOrderItems(
  order: Order
): order is Order & { items: NonNullable<Order["items"]> } {
  return order.items !== undefined && order.items.length > 0;
}

/**
 * 주문이 상세 정보를 가지고 있는지 확인하는 타입 가드
 * @param order - 확인할 주문
 * @returns 주문이 상세 정보를 가지고 있는지 여부
 */
export function isOrderWithDetails(
  order: Order | OrderWithDetails
): order is OrderWithDetails {
  return (
    "estimatedCompletionTime" in order ||
    "kitchenNotes" in order ||
    "customerNotes" in order
  );
}

/**
 * 메뉴 배열에서 품절이 아닌 메뉴만 필터링하는 헬퍼 함수
 * @param menus - 메뉴 배열
 * @returns 품절이 아닌 메뉴 배열
 */
export function filterAvailableMenus(menus: Menu[]): AvailableMenu[] {
  return menus.filter(isMenuAvailable);
}

/**
 * 주문 배열에서 진행 중인 주문만 필터링하는 헬퍼 함수
 * @param orders - 주문 배열
 * @returns 진행 중인 주문 배열
 */
export function filterActiveOrders(orders: Order[]): ActiveOrder[] {
  return orders.filter(isActiveOrder);
}

/**
 * 주문 배열에서 특정 상태의 주문만 필터링하는 헬퍼 함수
 * @param orders - 주문 배열
 * @param status - 필터링할 주문 상태
 * @returns 해당 상태의 주문 배열
 */
export function filterOrdersByStatus<T extends OrderStatus>(
  orders: Order[],
  status: T
): Array<Order & { status: T }> {
  return orders.filter((order) => order.status === status) as Array<
    Order & { status: T }
  >;
}

/**
 * 주문 상태가 특정 상태들 중 하나인지 확인하는 타입 가드
 * @param order - 확인할 주문
 * @param statuses - 확인할 상태 배열
 * @returns 주문 상태가 해당 상태들 중 하나인지 여부
 */
export function isOrderStatusOneOf(
  order: Order,
  statuses: OrderStatus[]
): boolean {
  return statuses.includes(order.status);
}

/**
 * 주문 아이템의 총 가격이 올바른지 확인하는 함수
 * @param items - 주문 아이템 배열
 * @param expectedTotal - 예상 총 가격
 * @returns 총 가격이 올바른지 여부
 */
export function validateOrderTotal(
  items: OrderItem[],
  expectedTotal: number
): boolean {
  const calculatedTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  return calculatedTotal === expectedTotal;
}

/**
 * 주문이 최소 주문 금액을 만족하는지 확인하는 함수
 * @param order - 확인할 주문
 * @param minimumAmount - 최소 주문 금액
 * @returns 최소 주문 금액을 만족하는지 여부
 */
export function meetsMinimumOrderAmount(
  order: Order,
  minimumAmount: number
): boolean {
  return order.totalPrice >= minimumAmount;
}
