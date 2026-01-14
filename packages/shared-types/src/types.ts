import { z } from 'zod';

// Menu types
export const MenuSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  price: z.number().int().positive().max(1000000), 
  imageUrl: z.string().url().nullable().optional(),
  isSoldOut: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Menu = z.infer<typeof MenuSchema>;

// Order types
export enum OrderStatus {
  PENDING = 'PENDING',
  COOKING = 'COOKING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
}

export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  menuId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNo: z.number().int().positive(),
  status: z.nativeEnum(OrderStatus).default(OrderStatus.PENDING),
  totalPrice: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // 관계 데이터 (선택적)
  items: z.array(OrderItemSchema).optional(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;


// ============================================
// API Request Schemas
// ============================================

// ============================================
// Menu API Requests
// ============================================

/**
 * 메뉴 생성 요청 스키마
 * POST /api/menus
 */
export const CreateMenuRequestSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().int().positive().max(1000000),
  imageUrl: z.string().url().nullable().optional(),
  isSoldOut: z.boolean().default(false),
});

export type CreateMenuRequest = z.infer<typeof CreateMenuRequestSchema>;

/**
 * 메뉴 수정 요청 스키마
 * PATCH /api/menus/:id
 */
export const UpdateMenuRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  price: z.number().int().positive().max(1000000).optional(),
  imageUrl: z.string().url().nullable().optional(),
  isSoldOut: z.boolean().default(false).optional(),
});

export type UpdateMenuRequest = z.infer<typeof UpdateMenuRequestSchema>;

/**
 * 메뉴 목록 조회 쿼리 파라미터 스키마
 * GET /api/menus?includeSoldOut=true
 */
export const GetMenuQuerySchema = z.object({
  includeSoldOut: z.string().optional().transform((val) => val === 'true'),
});

export type GetMenuQuery = z.infer<typeof GetMenuQuerySchema>;

// ============================================
// Order API Requests
// ============================================

/**
 * 주문 생성 요청 아이템 스키마
 */
export const CreateOrderItemRequestSchema = z.object({
  menuId: z.string().uuid(),
  quantity: z.number().int().positive().max(100), 
});

export type CreateOrderItemRequest = z.infer<typeof CreateOrderItemRequestSchema>;

/**
 * 주문 생성 요청 스키마
 * POST /api/orders
 */
export const CreateOrderRequestSchema = z.object({
  items: z.array(CreateOrderItemRequestSchema).min(1, '주문 항목이 최소 1개 이상 필요합니다'),
});

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;


/**
 * 주문 목록 조회 쿼리 파라미터 스키마
 * GET /api/orders?status=PENDING&status=COOKING
 */
export const GetOrdersQuerySchema = z.object({
  status: z
    .union([
      z.nativeEnum(OrderStatus),
      z.array(z.nativeEnum(OrderStatus)),
    ])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().positive().max(100).optional()),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().nonnegative().optional()),
});

export type GetOrdersQuery = z.infer<typeof GetOrdersQuerySchema>;


/**
 * 주문 상태 변경 요청 스키마
 * PATCH /api/orders/:id/status
 */
export const UpdateOrderStatusRequestSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export type UpdateOrderStatusRequest = z.infer<typeof UpdateOrderStatusRequestSchema>;