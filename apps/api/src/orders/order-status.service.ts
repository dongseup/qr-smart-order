import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { OrderRepository } from "./orders.repository";

@Injectable()
export class OrderStatusService {
  constructor(private readonly orderRepository: OrderRepository) {}

  /**
   * 상태 전환 규칙 정의
   * 단방향 흐름: PENDING → COOKING → READY → COMPLETED
   * 취소 가능: PENDING → COMPLETED, COOKING → COMPLETED
   */
  private readonly allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.COOKING, OrderStatus.COMPLETED],
    [OrderStatus.COOKING]: [OrderStatus.READY, OrderStatus.COMPLETED],
    [OrderStatus.READY]: [OrderStatus.COMPLETED],
    [OrderStatus.COMPLETED]: [],
  };

  /**
   * 상태 전환이 가능한지 검증
   *
   * @param currentStatus 현재 상태
   * @param targetStatus 변경하려는 상태
   * @returns 전환 가능 여부
   */
  canTransition(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus
  ): boolean {
    const allowed = this.allowedTransitions[currentStatus];
    return allowed ? allowed.includes(targetStatus) : false;
  }

  /**
   * 상태 전환 검증 및 예외 처리
   *
   * @param currentStatus 현재 상태
   * @param targetStatus 변경하려는 상태
   * @throws BadRequestException 잘못된 상태 전환 시
   */
  validateTransition(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus
  ): void {
    if (currentStatus === targetStatus) {
      throw new BadRequestException(
        `주문 상태가 이미 ${currentStatus} 입니다.`
      );
    }

    if (!this.canTransition(currentStatus, targetStatus)) {
      throw new BadRequestException(
        `주문 상태를 ${currentStatus}에서 ${targetStatus}로 변경할 수 없습니다.` +
          `허용된 전환: ${this.allowedTransitions[currentStatus].join(", ") || "없음"}`
      );
    }
  }

  /**
   * 주문 상태 변경
   *
   * @param orderId 주문 ID
   * @param newStatus 새로운 상태
   * @returns 업데이트된 주문
   * @throws NotFoundException 주문을 찾을 수 없을 때
   * @throws BadRequestException 잘못된 상태 전환 시
   */
  async updateStatus(
    orderId: string,
    newStatus: OrderStatus
  ): Promise<{
    id: string;
    orderNo: number;
    status: OrderStatus;
    updatedAt: Date;
  }> {
    // 주문 조회
    const order = await this.orderRepository.findUnique({ id: orderId });

    if (!order) {
      throw new NotFoundException(`주문을 찾을 수 없습니다. (ID: ${orderId})`);
    }

    // 현재 상태
    const currentStatus = order.status as OrderStatus;

    // 상태 전환 검증
    this.validateTransition(currentStatus, newStatus);

    // 상태 업데이트
    const updatedOrder = await this.orderRepository.update(
      { id: orderId },
      { status: newStatus }
    );

    return {
      id: updatedOrder.id,
      orderNo: updatedOrder.orderNo,
      status: updatedOrder.status,
      updatedAt: updatedOrder.updatedAt,
    };
  }

  /**
   * 상태 변경 이력 기록 (간단한 로깅)
   * 실제 프로덕션에서는 별도 테이블에 기록하거나 이벤트 로그에 저장
   *
   * @param orderId 주문 ID
   * @param previousStatus 이전 상태
   * @param newStatus 새로운 상태
   */
  logStatusChange(
    orderId: string,
    previousStatus: OrderStatus,
    newStatus: OrderStatus
  ): void {
    // 간단한 콘솔 로깅 (실제로는 데이터베이스나 로깅 시스템에 저장)
    console.log(
      `[OrderStatusChange] Order ${orderId}: ${previousStatus} → ${newStatus} at ${new Date().toISOString()}`
    );
  }

  /**
   * 주문 상태 변경 (이력 기록 포함)
   *
   * @param orderId 주문 ID
   * @param newStatus 새로운 상태
   * @returns 업데이트된 주문 정보
   */
  async changeStatus(
    orderId: string,
    newStatus: OrderStatus
  ): Promise<{
    id: string;
    orderNo: number;
    status: OrderStatus;
    updatedAt: Date;
  }> {
    // 현재 주문 조회
    const order = await this.orderRepository.findUnique({ id: orderId });

    if (!order) {
      throw new NotFoundException(`주문을 찾을 수 없습니다. (ID: ${orderId})`);
    }

    const previousStatus = order.status as OrderStatus;

    // 상태 전환 검증
    this.validateTransition(previousStatus, newStatus);

    // 상태 업데이트
    const updateOrder = await this.orderRepository.update(
      { id: orderId },
      { status: newStatus }
    );

    // 상태 변경 이력 기록
    this.logStatusChange(orderId, previousStatus, newStatus);

    return {
      id: updateOrder.id,
      orderNo: updateOrder.orderNo,
      status: updateOrder.status,
      updatedAt: updateOrder.updatedAt,
    };
  }
}
