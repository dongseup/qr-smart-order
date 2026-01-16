import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Delete,
} from "@nestjs/common";
import {
  CreateMenuRequestSchema,
  GetMenuQuerySchema,
  MenuListResponse,
  MenuListResponseSchema,
  MenuResponse,
  MenuResponseSchema,
  UpdateMenuRequestSchema,
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

  /**
   * 메뉴 생성
   * POST /api/menus
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown): Promise<MenuResponse> {
    // 요청 데이터 검증
    const createMenuDto = CreateMenuRequestSchema.parse(body);

    const menu = await this.menuService.create(createMenuDto);

    const response: MenuResponse = {
      message: "메뉴 생성되었습니다.",
      data: menu,
    };

    // 응답 스키마 검증
    MenuResponseSchema.parse(response);

    return response;
  }

  /**
   * 메뉴 수정
   * PATCH /api/menus/:id
   */
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() body: unknown
  ): Promise<MenuResponse> {
    // 요청 데이터 검증
    const updateMenuDto = UpdateMenuRequestSchema.parse(body);

    const menu = await this.menuService.update(id, updateMenuDto);

    const response: MenuResponse = {
      message: "메뉴 수정되었습니다.",
      data: menu,
    };

    // 응답 스키마 검증
    MenuResponseSchema.parse(response);

    return response;
  }

  /**
   * 메뉴 삭제
   * DELETE /api/menus/:id
   */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string): Promise<void> {
    await this.menuService.remove(id);
  }
}
