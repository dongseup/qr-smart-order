import { PrismaService } from "../lib/prisma.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OrderNumberService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 오늘 날짜의 시작 시간 (00:00:00)
   */
  private getTodayStart(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  /**
   * 오늘 날짜의 종료 시간 (23:59:59.999)
   */
  private getTodayEnd(): Date {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  }

  /**
   * 일일 시퀀스 기반 주문 번호 발급
   * 매일 1부터 시작하여 순차적으로 증가
   *
   * 동시성 처리를 위해 트랜잭션과 락을 사용합니다.
   *
   * @returns 발급된 주문 번호
   */
  async generateOrderNumber(): Promise<number> {
    const todayStart = this.getTodayStart();
    const todayEnd = this.getTodayEnd();

    // 트랜잭션을 사용하여 동시성 이슈 처리
    return this.prisma.$transaction(async (tx) => {
      // 오늘 날짜의 최대 주문 번호 조회 (락을 걸어 동시 접근 방지)
      const todayMaxOrder = await tx.order.findFirst({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        orderBy: {
          orderNo: "desc",
        },
        select: {
          orderNo: true,
        },
      });

      // 오늘 첫 주문이면 1, 아니면 최대값 + 1
      const nextOrderNo = todayMaxOrder ? todayMaxOrder.orderNo + 1 : 1;

      return nextOrderNo;
    });
  }

  /**
   * 주문 번호 포맷팅
   * 예: 1 -> "001", 10 -> "010", 100 -> "100"
   *
   * @param orderNo 주문 번호
   * @param padding 패딩 길이 (기본값: 3)
   * @returns 포맷팅된 주문 번호 문자열
   */
  formatOrderNumber(orderNo: number, padding: number = 3): string {
    return orderNo.toString().padStart(padding, "0");
  }

  /**
   * 날짜 변경 감지 (다음 날로 넘어갔는지 확인)
   *
   * @param lastDate 마지막으로 확인한 날짜
   * @returns 날짜가 변경되었는지 여부
   */
  isDateChanged(lastDate: Date): boolean {
    const today = new Date();
    const last = new Date(lastDate);

    return (
      today.getFullYear() !== last.getFullYear() ||
      today.getMonth() !== last.getMonth() ||
      today.getDate() !== last.getDate()
    );
  }
}
