import { Injectable } from "@nestjs/common";
import { Menu } from "@qr-smart-order/shared-types";
import { PrismaService } from "../lib/prisma.service";

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Prisma Menu 모델을 API 응답 형식으로 변환
   * Date 객체를 ISO 8601 문자열로 변환
   */
  private toMenuResponse(menu: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    isSoldOut: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Menu {
    return {
      id: menu.id,
      name: menu.name,
      price: menu.price,
      imageUrl: menu.imageUrl,
      isSoldOut: menu.isSoldOut,
      createdAt: menu.createdAt.toISOString(),
      updatedAt: menu.updatedAt.toISOString(),
    };
  }

  /**
   * 메뉴 목록 조회
   * @param includeSoldOut 품절 메뉴 포함 여부
   * @returns 메뉴 목록
   */
  async findAll(includeSoldOut: boolean = false): Promise<Menu[]> {
    const where = includeSoldOut ? {} : { isSoldOut: false };

    const menus = await this.prisma.menu.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return menus.map((menu) => this.toMenuResponse(menu));
  }

  /**
   * 메뉴 단일 조회
   * @param id 메뉴 ID
   * @returns 메뉴 정보
   */
  async findOne(id: string): Promise<Menu | null> {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
    });

    if (!menu) return null;

    return this.toMenuResponse(menu);
  }
}
