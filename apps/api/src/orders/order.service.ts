import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  type CreateOrderRequest,
  type GetOrdersQuery,
  type Order,
  OrderStatus,
  type OrderWithItems,
} from "@qr-smart-order/shared-types";
import { MenuService } from "../menus/menu.service";
import { OrderNumberService } from "./order-number.service";
import { OrderStatusService } from "./order-status.service";
import { OrderRepository } from "./orders.repository";
import { PrismaService } from "../lib/prisma.service";

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderNumberService: OrderNumberService,
    private readonly orderStatusService: OrderStatusService,
    private readonly menuService: MenuService,
    private readonly prisma: PrismaService
  ) { }

  /**
   * Prisma Order 모델을 API 응답 형식으로 변환
   * Date 객체를 ISO 8601 문자열로 변환
   */
  private toOrderResponse(order: {
    id: string;
    orderNo: number;
    status: string;
    totalPrice: number;
    createdAt: Date;
    updatedAt: Date;
    items?: Array<{
      id: string;
      orderId: string;
      menuId: string;
      quantity: number;
      price: number;
      createdAt: Date;
      updatedAt: Date;
      menu?: {
        id: string;
        name: string;
        price: number;
        imageUrl: string | null;
        isSoldOut: boolean;
        createdAt: Date;
        updatedAt: Date;
      } | null;
    }>;
  }): OrderWithItems {
    return {
      id: order.id,
      orderNo: order.orderNo,
      status: order.status as any,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items
        ? order.items.map((item) => ({
          id: item.id,
          orderId: item.orderId,
          menuId: item.menuId,
          quantity: item.quantity,
          price: item.price,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
          menu: item.menu
            ? {
              id: item.menu.id,
              name: item.menu.name,
              price: item.menu.price,
              imageUrl: item.menu.imageUrl,
              isSoldOut: item.menu.isSoldOut,
              createdAt: item.menu.createdAt.toISOString(),
              updatedAt: item.menu.updatedAt.toISOString(),
            }
            : undefined,
        }))
        : [],
    };
  }

  /**
   * Prisma Order 모델을 Order 타입으로 변환 (관계 데이터 제외)
   */
  private toOrder(order: {
    id: string;
    orderNo: number;
    status: string;
    totalPrice: number;
    createdAt: Date;
    updatedAt: Date;
  }): Order {
    return {
      id: order.id,
      orderNo: order.orderNo,
      status: order.status as any,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  /**
   * 주문 생성
   * 메뉴 스냅샷 저장 (주문 시점의 메뉴 정보 저장)
   *
   * @param createOrderDto 주문 생성 데이터
   * @returns 생성된 주문
   */
  async create(createOrderDto: CreateOrderRequest): Promise<OrderWithItems> {
    // 1. 메뉴 정보 조회 및 검증
    const menuIds = createOrderDto.items.map((item) => item.menuId);
    const menus = await Promise.all(
      menuIds.map((menuId) => this.menuService.findOne(menuId))
    );

    // 메뉴 존재 여부 확인
    for (let i = 0; i < menus.length; i++) {
      if (!menus[i]) {
        throw new NotFoundException(
          `메뉴를 찾을 수 없습니다. (ID: ${menuIds[i]})`
        );
      }
      if (menus[i].isSoldOut) {
        throw new BadRequestException(
          `품절된 메뉴입니다. (메뉴: ${menus[i]!.name})`
        );
      }
    }

    // 2. 총 가격 계산 및 주문 아이템 데이터 준비
    let totalPrice = 0;
    const orderItemsData = createOrderDto.items.map((item, index) => {
      const menu = menus[index]!;
      const itemPrice = menu.price * item.quantity;
      totalPrice += itemPrice;

      // 메뉴 스탭샷 저장 (주문 시점의 가격)
      return {
        menuId: menu.id,
        quantity: item.quantity,
        price: itemPrice, // 주문 시점의 단가
      };
    });

    // 3. 트랜잭션으로 주문 번호 생성 및 주문 생성 (동시성 이슈 해결)
    // PostgreSQL Advisory Lock을 사용하여 애플리케이션 레벨 락 적용
    const order = await this.prisma.$transaction(async (tx) => {
      // Advisory Lock 획득 (트랜잭션 레벨, 트랜잭션 종료 시 자동 해제)
      // 날짜 기반 고유 키 사용 (예: 20260121)
      const today = new Date();
      const lockKey = parseInt(
        `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
      );

      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

      // 오늘 날짜의 시작/종료 시간 계산
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // 오늘 날짜의 최대 주문 번호 조회
      const todayMaxOrder = await tx.$queryRaw<Array<{ orderNo: bigint }>>`
        SELECT "orderNo"
        FROM orders
        WHERE "createdAt" >= ${todayStart}
          AND "createdAt" <= ${todayEnd}
        ORDER BY "orderNo" DESC
        LIMIT 1
      `;

      // 오늘 첫 주문이면 1, 아니면 최대값 + 1
      const orderNo = todayMaxOrder.length > 0
        ? Number(todayMaxOrder[0].orderNo) + 1
        : 1;

      // 주문 생성
      return tx.order.create({
        data: {
          orderNo,
          status: OrderStatus.PENDING,
          totalPrice,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              menu: true,
            },
          },
        },
      });
    });

    return this.toOrderResponse(order);
  }

  /**
   * 주문 목록 조회 (상태별 필터링)
   *
   * @param query 쿼리 파라미터 (상태, limit, offset)
   * @returns 주문 목록
   */
  async findAll(query: GetOrdersQuery): Promise<Order[]> {
    const where: any = {};

    // 상태 필터링
    if (query.status && query.status.length > 0) {
      where.status = {
        in: query.status,
      };
    }

    // 정렬: 오래된 주문 우선 (createdAt 오름차순)
    const orders = await this.orderRepository.findMany(
      where,
      { createdAt: "asc" },
      query.limit,
      query.offset
    );

    return orders.map((order) => this.toOrder(order));
  }

  /**
   * 주문 단일 조회
   *
   * @param id 주문 ID
   * @returns 주문 정보 (관계 데이터 포함)
   * @throws NotFoundException 주문을 찾을 수 없을 때
   */
  async findOne(id: string): Promise<OrderWithItems> {
    const order = await this.orderRepository.findUnique({ id });

    if (!order) {
      throw new NotFoundException(`주문을 찾을 수 없습니다. (ID: ${id})`);
    }

    return this.toOrderResponse(order);
  }

  /**
   * 주문 상태 변경
   *
   * @param orderId 주문 ID
   * @param newStatus 새로운 상태
   * @returns 업데이트된 주문 정보
   */
  async updateStatus(
    orderId: string,
    newStatus: OrderStatus
  ): Promise<{
    id: string;
    orderNo: number;
    status: OrderStatus;
    updatedAt: string;
  }> {
    const result = await this.orderStatusService.changeStatus(
      orderId,
      newStatus
    );

    return {
      id: result.id,
      orderNo: result.orderNo,
      status: result.status as any,
      updatedAt: result.updatedAt.toISOString(),
    };
  }
}
