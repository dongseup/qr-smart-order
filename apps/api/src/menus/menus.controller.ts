import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../lib/prisma.service';

@Controller('menus')
export class MenusController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Query('includeSoldOut') includeSoldOut?: string) {
    const where = includeSoldOut !== 'true' ? { isSoldOut: false } : {};

    const menus = await this.prisma.menu.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: '메뉴 목록 조회',
      data: menus,
      count: menus.length,
    };
  }
}
