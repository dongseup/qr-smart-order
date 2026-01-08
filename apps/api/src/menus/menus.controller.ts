import { Controller, Get } from '@nestjs/common';

@Controller('menus')
export class MenusController {
  @Get()
  findAll() {
    return {
      message: '메뉴 목록 조회',
      data: [],
    };
  }
}
