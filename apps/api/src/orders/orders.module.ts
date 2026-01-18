import { Module } from "@nestjs/common";
import { PrismaModule } from "../lib/prisma.module";
import { MenusModule } from "../menus/menus.module";
import { OrderService } from "./order.service";
import { OrderNumberService } from "./order-number.service";
import { OrderStatusService } from "./order-status.service";
import { OrdersController } from "./orders.controller";
import { OrderRepository } from "./orders.repository";

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
