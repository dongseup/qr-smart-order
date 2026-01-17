import { Injectable } from "@nestjs/common";
import { OrderRepository } from "./orders.repository";
import { Order, OrderWithItems } from "@qr-smart-order/shared-types";

@Injectable()
export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

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
}
