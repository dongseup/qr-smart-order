import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MenusModule } from './menus/menus.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [MenusModule, OrdersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
