import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrderService } from "./order.service";
import { OrderRepository } from "./orders.repository";
import { PrismaModule } from "../lib/prisma.module";
import { OrderNumberService } from "./order-number.service";
import { OrderStatusService } from "./order-status.service";
import { MenusModule } from "../menus/menus.module";

@Module({
  imports: [PrismaModule, MenusModule],
  controllers: [OrdersController],
  providers: [
    OrderService,
    OrderRepository,
    OrderNumberService,
    OrderStatusService,
  ],
  exports: [
    OrderService,
    OrderRepository,
    OrderNumberService,
    OrderStatusService,
  ],
})
export class OrdersModule {}
