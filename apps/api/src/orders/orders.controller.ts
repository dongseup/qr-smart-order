import { Controller, Get, Post } from '@nestjs/common';

@Controller('orders')
export class OrdersController {
  @Get()
  findAll() {
    return {
      message: '주문 목록 조회',
      data: [],
    };
  }

  @Post()
  create() {
    return {
      message: '주문 생성',
      data: null,
    };
  }
}
