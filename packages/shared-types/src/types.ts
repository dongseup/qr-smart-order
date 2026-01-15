import { z } from 'zod';

/**
 * 메뉴 스키마
 * @example
 * const menu = MenuSchema.parse({
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   name: '아메리카노',
 *   price: 4500,
 *   isSoldOut: false,
 *   createdAt: '2024-01-15T10:00:00Z',
 *   updatedAt: '2024-01-15T10:00:00Z'
 * });
 */
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

/**
 * 주문 상태 Enum
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  COOKING = 'COOKING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
}

/**
 * 주문 아이템 스키마
 */
export const OrderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  menuId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * 주문 스키마
 * @example
 * const order = OrderSchema.parse({
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   orderNo: 1,
 *   status: OrderStatus.PENDING,
 *   totalPrice: 9000,
 *   createdAt: '2024-01-15T10:00:00Z',
 *   updatedAt: '2024-01-15T10:00:00Z'
 * });
 */
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


// ============================================
// WebSocket Event Schemas
// ============================================

/**
 * WebSocket 이벤트 타입 Enum
 */
export enum WebSocketEventType {
  // 클라이언트 → 서버
  CONNECT = 'connect',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',

  // 서버 → 클라이언트
  NEW_ORDER = 'new_order',
  ORDER_READY = 'order_ready',
  ORDER_STATUS_CHANGED = 'order_status_changed',
  ERROR = 'error',
}

/**
 * WebSocket 룸 타입
 */
export enum WebSocketRoomType {
  KITCHEN = 'kitchen',
  ORDER = 'order',
}


// ============================================
// 클라이언트 → 서버 이벤트
// ============================================


/**
 * 룸 조인 요청 스키마
 * Client → Server: join_room
 */
export const JoinRoomRequestSchema = z.object({
  roomType: z.nativeEnum(WebSocketRoomType),
  orderId: z.string().uuid().optional(),
});

export type JoinRoomRequest = z.infer<typeof JoinRoomRequestSchema>;

/**
 * 룸 나가기 요청 스키마
 * Client → Server: leave_room
 */
export const LeaveRoomRequestSchema = z.object({
  roomType: z.nativeEnum(WebSocketRoomType),
  orderId: z.string().uuid().optional(),
});

export type LeaveRoomRequest = z.infer<typeof LeaveRoomRequestSchema>;


// ============================================
// 서버 → 클라이언트 이벤트
// ============================================

/**
 * 신규 주문 이벤트 페이로드 스키마
 * Server → Kitchen: new_order
 */
export const NewOrderEventSchema = z.object({
  orderId: z.string().uuid(),
  orderNo: z.number().int().positive(),
  items: z.array(
    z.object({
      menuId: z.string().uuid(),
      name: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().int().positive(),
    })
  ),
  totalPrice: z.number().int().positive(),
  createdAt: z.string().datetime(),
});

export type NewOrderEvent = z.infer<typeof NewOrderEventSchema>;

/**
 * 주문 준비 완료 이벤트 페이로드 스키마
 * Server → Customer: order_ready
 */
export const OrderReadyEventSchema = z.object({
  orderId: z.string().uuid(),
  orderNo: z.number().int().positive(),
  status: z.nativeEnum(OrderStatus),
  updatedAt: z.string().datetime(),
});

export type OrderReadyEvent = z.infer<typeof OrderReadyEventSchema>;

/**
 * 주문 상태 변경 이벤트 페이로드 스키마
 * Server → All: order_status_changed
 */
export const OrderStatusChangedEventSchema = z.object({
  orderId: z.string().uuid(),
  orderNo: z.number().int().positive(),
  previousStatus: z.nativeEnum(OrderStatus),
  currentStatus: z.nativeEnum(OrderStatus),
  updatedAt: z.string().datetime(),
});

export type OrderStatusChangedEvent = z.infer<typeof OrderStatusChangedEventSchema>;

/**
 * WebSocket 에러 이벤트 스키마
 * Server → Client: error
 */
export const WebSocketErrorEventSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type WebSocketErrorEvent = z.infer<typeof WebSocketErrorEventSchema>;

// ============================================
// WebSocket 이벤트 래퍼 스키마
// ============================================

/**
 * WebSocket 이벤트 기본 구조 스키마
 */
export const WebSocketEventSchema = <T extends z.ZodTypeAny>(payloadSchema: T) =>
  z.object({
    type: z.nativeEnum(WebSocketEventType),
    payload: payloadSchema,
    timestamp: z.string().datetime(),
  });

/**
 * 신규 주문 이벤트 (완전한 구조)
 */
export const NewOrderEventWrapperSchema = WebSocketEventSchema(NewOrderEventSchema);

export type NewOrderEventWrapper = z.infer<typeof NewOrderEventWrapperSchema>;

/**
 * 주문 준비 완료 이벤트 (완전한 구조)
 */
export const OrderReadyEventWrapperSchema = WebSocketEventSchema(OrderReadyEventSchema);

export type OrderReadyEventWrapper = z.infer<typeof OrderReadyEventWrapperSchema>;

/**
 * 주문 상태 변경 이벤트 (완전한 구조)
 */
export const OrderStatusChangedEventWrapperSchema = WebSocketEventSchema(OrderStatusChangedEventSchema);

export type OrderStatusChangedEventWrapper = z.infer<typeof OrderStatusChangedEventWrapperSchema>;