import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  CreateOrderRequestSchema,
  GetOrdersQuerySchema,
  type OrderListResponse,
  OrderListResponseSchema,
  type OrderResponse,
  OrderResponseSchema,
  type OrderStatus,
  type OrderStatusResponse,
  OrderStatusResponseSchema,
  UpdateOrderStatusRequestSchema,
  NewOrderEvent,
  WebSocketEventType,
} from "@qr-smart-order/shared-types";
import { ZodValidation } from "../common/decorators/zod-validation.decorator";
import { OrderService } from "./order.service";
import { AppWebSocketGateway } from "../websocket/websocket.gateway";

@Controller("orders")
export class OrdersController {
  constructor(private readonly orderService: OrderService, private readonly webSocketGateway: AppWebSocketGateway
  ) { }

  /**
   * 주문 생성
   * POST /api/orders
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ZodValidation(CreateOrderRequestSchema)
  async create(@Body() body: unknown): Promise<OrderResponse> {
    const order = await this.orderService.create(body);

    // 새 주문 이벤트를 kitchen 룸에 브로드캐스트
    const newOrderEvent: NewOrderEvent = {
      orderId: order.id,
      orderNo: order.orderNo,
      items: order.items.map((item) => ({
        menuId: item.menuId,
        name: item.menu?.name || "알 수 없음",
        quantity: item.quantity,
        price: item.price,
      })),
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
    };

    this.webSocketGateway.broadcastToKitchen(
      WebSocketEventType.NEW_ORDER,
      newOrderEvent
    );

    const response: OrderResponse = {
      message: "주문 생성되었습니다.",
      data: order,
    };

    // 응답 스키마 검증
    OrderResponseSchema.parse(response);

    return response;
  }

  /**
   * 주문 목록 조회
   * GET /api/orders?status=PENDING&status=COOKING&limit=10&offset=0
   */
  @Get()
  @ZodValidation(GetOrdersQuerySchema)
  async findAll(@Query() query: unknown): Promise<OrderListResponse> {
    const orders = await this.orderService.findAll(query);

    const response: OrderListResponse = {
      message: "주문 목록 조회",
      data: orders,
      count: orders.length,
    };

    // 응답 스키마 검증
    OrderListResponseSchema.parse(response);

    return response;
  }

  /**
   * 주문 단일 조회
   * GET /api/orders/:id
   */
  @Get(":id")
  async findOne(@Param("id") id: string): Promise<OrderResponse> {
    const order = await this.orderService.findOne(id);

    const response: OrderResponse = {
      message: "주문 조회",
      data: order,
    };

    // 응답 스키마 검증
    OrderResponseSchema.parse(response);

    return response;
  }

  /**
   * 주문 상태 변경
   * PATCH /api/orders/:id/status
   */
  @Patch(":id/status")
  @ZodValidation(UpdateOrderStatusRequestSchema)
  async updateStatus(
    @Param("id") id: string,
    @Body() body: unknown
  ): Promise<OrderStatusResponse> {
    const result = await this.orderService.updateStatus(
      id,
      (body as any).status as OrderStatus
    );

    const response: OrderStatusResponse = {
      message: "주문 상태가 변경되었습니다.",
      data: {
        id: result.id,
        orderNo: result.orderNo,
        status: result.status as any,
        updatedAt: result.updatedAt,
      },
    };

    // 응답 스키마 검증
    OrderStatusResponseSchema.parse(response);

    return response;
  }
}
