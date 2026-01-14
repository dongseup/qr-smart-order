import { Module } from '@nestjs/common';
import { MenusController } from './menus.controller';
import { PrismaModule } from '../lib/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MenusController],
})
export class MenusModule {}
