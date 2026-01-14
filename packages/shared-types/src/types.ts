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


// ============================================
// API Response Schemas
// ============================================

// ============================================
// 공통 응답 스키마
// ============================================


/**
 * 성공 응답 기본 스키마
 * 모든 성공 응답의 기본 구조
 */
export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  message: z.string(),
  data: dataSchema
});

/**
 * 목록 응답 스키마
 * GET /api/menus, GET /api/orders 등
 */
export const ListResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    message: z.string(),
    data: z.array(itemSchema),
    count: z.number().int().nonnegative(),
  });

/**
 * 페이지네이션 메타데이터 스키마
 */
  export const PaginationMetaSchema = z.object({
    total: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
    hasMore: z.boolean(),
  });

  export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

/**
 * 페이지네이션된 목록 응답 스키마
 */
export const PaginatedListResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    message: z.string(),
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });


// ============================================
// 에러 응답 스키마
// ============================================

/**
 * 에러 응답 스키마
 */
export const ErrorResponseSchema = z.object({
  message: z.string(),
  error: z.string().optional(),
  statusCode: z.number().int().positive(),
  timestamp: z.string().datetime(),
  path: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;


// ============================================
// Menu API Responses
// ============================================

/**
 * 메뉴 단일 응답 스키마
 * GET /api/menus/:id, POST /api/menus, PATCH /api/menus/:id
 */
export const MenuResponseSchema = SuccessResponseSchema(MenuSchema);

export type MenuResponse = z.infer<typeof MenuResponseSchema>;

/**
 * 메뉴 목록 응답 스키마
 * GET /api/menus
 */
export const MenuListResponseSchema = ListResponseSchema(MenuSchema);

export type MenuListResponse = z.infer<typeof MenuListResponseSchema>;


// ============================================
// Order API Responses
// ============================================

/**
 * 주문 단일 응답 스키마 (관계 데이터 포함)
 * GET /api/orders/:id, POST /api/orders
 */
export const OrderWithItemsSchema = OrderSchema.extend({
  items: z.array(OrderItemSchema.extend({
    menu: MenuSchema.optional(), // 주문 아이템에 메뉴 정보 포함 (선택적)
  })),
});

export const OrderResponseSchema = SuccessResponseSchema(OrderWithItemsSchema);

export type OrderResponse = z.infer<typeof OrderResponseSchema>;
export type OrderWithItems = z.infer<typeof OrderWithItemsSchema>;

/**
 * 주문 목록 응답 스키마
 * GET /api/orders
 */
export const OrderListResponseSchema = ListResponseSchema(OrderSchema);

export type OrderListResponse = z.infer<typeof OrderListResponseSchema>;

/**
 * 주문 목록 응답 스키마 (페이지네이션)
 * GET /api/orders?limit=10&offset=0
 */
export const PaginatedOrderListResponseSchema = PaginatedListResponseSchema(OrderSchema);

export type PaginatedOrderListResponse = z.infer<typeof PaginatedOrderListResponseSchema>;

/**
 * 주문 상태 변경 응답 스키마
 * PATCH /api/orders/:id/status
 */
export const OrderStatusResponseSchema = SuccessResponseSchema(
  z.object({
    id: z.string().uuid(),
    orderNo: z.number().int().positive(),
    status: z.nativeEnum(OrderStatus),
    updatedAt: z.string().datetime(),
  })
);

export type OrderStatusResponse = z.infer<typeof OrderStatusResponseSchema>;