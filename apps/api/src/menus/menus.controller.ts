import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import {
  GetMenuQuerySchema,
  MenuListResponse,
  MenuListResponseSchema,
  MenuResponse,
  MenuResponseSchema,
} from "@qr-smart-order/shared-types";
import { MenuService } from "./menu.service";

@Controller("menus")
export class MenusController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * 메뉴 목록 조회
   * GET /api/menus?includeSoldOut=true
   */
  @Get()
  async findAll(
    @Query("includeSoldOut") includeSoldOutParam?: string
  ): Promise<MenuListResponse> {
    const { includeSoldOut } = GetMenuQuerySchema.parse({
      includeSoldOut: includeSoldOutParam,
    });

    const menus = await this.menuService.findAll(includeSoldOut);

    const response: MenuListResponse = {
      message: "메뉴 목록 조회",
      data: menus,
      count: menus.length,
    };

    // 응답 스키마 검증
    MenuListResponseSchema.parse(response);

    return response;
  }

  /**
   * 메뉴 단일 조회
   * GET /api/menus/:id
   */
  @Get(":id")
  async findOne(@Param("id") id: string): Promise<MenuResponse> {
    const menu = await this.menuService.findOne(id);

    if (!menu) {
      throw new NotFoundException(`메뉴를 찾을 수 없습니다. (ID: ${id})`);
    }

    const response: MenuResponse = {
      message: "메뉴 조회",
      data: menu,
    };

    // 응답 스키마 검증
    MenuResponseSchema.parse(response);

    return response;
  }
}
