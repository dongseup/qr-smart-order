import { Global, Module } from "@nestjs/common";
import { AppWebSocketGateway } from "./websocket.gateway";

@Global() // Global 모듈로 설정하여 모든 모듈에서 사용 가능
@Module({
  providers: [AppWebSocketGateway],
  exports: [AppWebSocketGateway], // 다른 모듈에서 주입 가능하도록 export
})
export class WebSocketModule {}
