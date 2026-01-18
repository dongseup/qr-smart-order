import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MenusModule } from "./menus/menus.module";
import { OrdersModule } from "./orders/orders.module";
import { PrismaModule } from "./lib/prisma.module";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

@Module({
  imports: [
    PrismaModule,
    MenusModule,
    OrdersModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60초 (밀리초 단위)
        limit: 100,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
