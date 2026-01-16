import { Module } from "@nestjs/common";
import { MenusController } from "./menus.controller";
import { PrismaModule } from "../lib/prisma.module";
import { MenuService } from "./menu.service";

@Module({
  imports: [PrismaModule],
  controllers: [MenusController],
  providers: [MenuService],
  exports: [MenuService], // 다른 모듈에서 사용할 수 있도록
})
export class MenusModule {}
