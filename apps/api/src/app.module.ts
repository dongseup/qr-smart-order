import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./lib/prisma.module";
import { MenusModule } from "./menus/menus.module";
import { OrdersModule } from "./orders/orders.module";
import { AppWebSocketGateway } from "./websocket/websocket.gateway";

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
    AppWebSocketGateway,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
