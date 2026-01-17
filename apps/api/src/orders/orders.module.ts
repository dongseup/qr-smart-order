import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrderService } from "./order.service";
import { OrderRepository } from "./orders.repository";
import { PrismaModule } from "../lib/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [OrderService, OrderRepository],
  exports: [OrderService, OrderRepository],
})
export class OrdersModule {}
