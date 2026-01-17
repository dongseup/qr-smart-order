import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrderService } from "./order.service";
import { OrderRepository } from "./orders.repository";
import { PrismaModule } from "../lib/prisma.module";
import { OrderNumberService } from "./order-number.service";

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [OrderService, OrderRepository, OrderNumberService],
  exports: [OrderService, OrderRepository, OrderNumberService],
})
export class OrdersModule {}
