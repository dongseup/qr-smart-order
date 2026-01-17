import { Prisma } from "@prisma/client";
import { PrismaService } from "../lib/prisma.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 주문 목록 조회
   */
  async findMany(
    where?: Prisma.OrderWhereInput,
    orderBy?: Prisma.OrderOrderByWithRelationInput,
    take?: number,
    skip?: number
  ) {
    return this.prisma.order.findMany({
      where,
      orderBy,
      take,
      skip,
      include: {
        items: {
          include: {
            menu: true,
          },
        },
      },
    });
  }

  /**
   * 주문 개수 조회
   */
  async count(where?: Prisma.OrderWhereInput): Promise<number> {
    return this.prisma.order.count({ where });
  }

  /**
   * 주문 단일 조회 (관계 데이터 포함)
   */
  async findUnique(where: Prisma.OrderWhereUniqueInput) {
    return this.prisma.order.findUnique({
      where,
      include: {
        items: {
          include: {
            menu: true,
          },
        },
      },
    });
  }

  /**
   * 주문 생성
   */
  async create(data: Prisma.OrderCreateInput) {
    return this.prisma.order.create({
      data,
      include: {
        items: {
          include: {
            menu: true,
          },
        },
      },
    });
  }

  /**
   * 주문 수정
   */
  async update(
    where: Prisma.OrderWhereUniqueInput,
    data: Prisma.OrderUpdateInput
  ) {
    return this.prisma.order.update({
      where,
      data,
      include: {
        items: {
          include: {
            menu: true,
          },
        },
      },
    });
  }

  /**
   * 주문 존재 여부 확인
   */
  async exists(where: Prisma.OrderWhereUniqueInput): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where,
      select: { id: true },
    });
    return order !== null;
  }
}
