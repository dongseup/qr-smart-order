import { Module } from "@nestjs/common";
import { PrismaModule } from "../lib/prisma.module";
import { MenuRepository } from "./menu.repository";
import { MenuService } from "./menu.service";
import { MenusController } from "./menus.controller";

@Module({
  imports: [PrismaModule],
  controllers: [MenusController],
  providers: [MenuService, MenuRepository],
  exports: [MenuService, MenuRepository], // 다른 모듈에서 사용할 수 있도록
})
export class MenusModule {}
