import { Injectable } from "@nestjs/common";
import { PrismaService } from "../lib/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class MenuRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 메뉴 목록 조회
   */
  async findMany(
    where?: Prisma.MenuWhereInput,
    orderBy?: Prisma.MenuOrderByWithRelationInput
  ) {
    return this.prisma.menu.findMany({
      where,
      orderBy,
    });
  }

  /**
   * 메뉴 단일 조회
   */
  async findUnique(where: Prisma.MenuWhereUniqueInput) {
    return this.prisma.menu.findUnique({
      where,
    });
  }

  /**
   * 메뉴 생성
   */
  async create(data: Prisma.MenuCreateInput) {
    return this.prisma.menu.create({
      data,
    });
  }

  /**
   * 메뉴 수정
   */
  async update(
    where: Prisma.MenuWhereUniqueInput,
    data: Prisma.MenuUpdateInput
  ) {
    return this.prisma.menu.update({
      where,
      data,
    });
  }

  /**
   * 메뉴 삭제
   */
  async delete(where: Prisma.MenuWhereUniqueInput) {
    return this.prisma.menu.delete({
      where,
    });
  }

  /**
   * 메뉴 존재 여부 확인
   */
  async exists(where: Prisma.MenuWhereUniqueInput): Promise<boolean> {
    const menu = await this.prisma.menu.findUnique({
      where,
      select: { id: true },
    });
    return menu !== null;
  }
}
