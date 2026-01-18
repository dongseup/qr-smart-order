import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CreateMenuRequest,
  Menu,
  UpdateMenuRequest,
} from "@qr-smart-order/shared-types";
import { MenuRepository } from "./menu.repository";

@Injectable()
export class MenuService {
  constructor(private readonly menuRepository: MenuRepository) {}

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

    const menus = await this.menuRepository.findMany(where, {
      createdAt: "desc",
    });

    return menus.map((menu) => this.toMenuResponse(menu));
  }

  /**
   * 메뉴 단일 조회
   * @param id 메뉴 ID
   * @returns 메뉴 정보
   * @throws NotFoundException 메뉴를 찾을 수 없을 때
   */
  async findOne(id: string): Promise<Menu | null> {
    const menu = await this.menuRepository.findUnique({ id });

    if (!menu) {
      throw new NotFoundException(`메뉴를 찾을 수 없습니다. (ID: ${id})`);
    }

    return this.toMenuResponse(menu);
  }

  /**
   * 메뉴 생성
   * @param createMenuDto 메뉴 생성 데이터
   * @returns 생성된 메뉴
   */
  async create(createMenuDto: CreateMenuRequest): Promise<Menu> {
    const menu = await this.menuRepository.create({
      name: createMenuDto.name,
      price: createMenuDto.price,
      imageUrl: createMenuDto.imageUrl ?? null,
      isSoldOut: createMenuDto.isSoldOut ?? false,
    });

    return this.toMenuResponse(menu);
  }

  /**
   * 메뉴 수정
   * @param id 메뉴 ID
   * @param updateMenuDto 메뉴 수정 데이터
   * @returns 수정된 메뉴
   * @throws NotFoundException 메뉴를 찾을 수 없을 때
   */
  async update(id: string, updateMenuDto: UpdateMenuRequest): Promise<Menu> {
    // 메뉴 존재 여부 확인
    const exists = await this.menuRepository.exists({ id });

    if (!exists) {
      throw new NotFoundException(`메뉴를 찾을 수 없습니다. (ID: ${id})`);
    }

    const menu = await this.menuRepository.update(
      { id },
      {
        name: updateMenuDto.name,
        price: updateMenuDto.price,
        imageUrl: updateMenuDto.imageUrl,
        isSoldOut: updateMenuDto.isSoldOut,
      }
    );
    return this.toMenuResponse(menu);
  }

  /**
   * 메뉴 삭제
   * @param id 메뉴 ID
   * @throws NotFoundException 메뉴를 찾을 수 없을 때
   * @throws ConflictException 주문에 사용 중인 메뉴일 때
   */
  async remove(id: string): Promise<void> {
    // 메뉴 존재 여부 확인
    const exists = await this.menuRepository.exists({ id });
    if (!exists) {
      throw new NotFoundException(`메뉴를 찾을 수 없습니다. (ID: ${id})`);
    }

    // 주문에 사용 중인 메뉴인지 확인 (OrderItem에 참조되는지)
    // Prisma의 onDelete: Restrict 설정으로 자동 처리되지만,
    // 명시적으로 확인하여 더 명확한 에러 메시지 제공
    try {
      await this.menuRepository.delete({ id });
    } catch (error: any) {
      if (error.code === "P2003") {
        throw new ConflictException(
          `이 메뉴는 주문에 사용 중이어서 삭제할 수 없습니다. (ID: ${id})`
        );
      }
      throw error;
    }
  }
}
