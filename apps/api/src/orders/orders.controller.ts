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
import { OrderService } from "./order.service";
import {
  CreateOrderRequestSchema,
  GetOrdersQuerySchema,
  OrderListResponse,
  OrderListResponseSchema,
  OrderResponse,
  OrderResponseSchema,
  OrderStatus,
  OrderStatusResponse,
  OrderStatusResponseSchema,
  UpdateOrderStatusRequestSchema,
} from "@qr-smart-order/shared-types";

@Controller("orders")
export class OrdersController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * 주문 생성
   * POST /api/orders
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown): Promise<OrderResponse> {
    // 요청 데이터 검증
    const createOrderDto = CreateOrderRequestSchema.parse(body);

    const order = await this.orderService.create(createOrderDto);

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
  async findAll(@Query() query: unknown): Promise<OrderListResponse> {
    // 쿼리 파라미터 검증
    const validatedQuery = GetOrdersQuerySchema.parse(query);

    const orders = await this.orderService.findAll(validatedQuery);

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
  async updateStatus(
    @Param("id") id: string,
    @Body() body: unknown
  ): Promise<OrderStatusResponse> {
    // 요청 데이터 검증
    const updateOrderStatusDto = UpdateOrderStatusRequestSchema.parse(body);

    const result = await this.orderService.updateStatus(
      id,
      updateOrderStatusDto.status as OrderStatus
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
