import { Logger, OnModuleInit } from "@nestjs/common";
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway as WebSocketGatewayDecorator,
    WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { env } from "../lib/env";
import { JoinRoomRequestSchema, LeaveRoomRequestSchema, WebSocketRoomType } from "@qr-smart-order/shared-types";

@WebSocketGatewayDecorator({
    cors: {
        origin: env.FRONTEND_URL,
        credentials: true,
    },
    namespace: "/",
})
export class AppWebSocketGateway
    implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(AppWebSocketGateway.name);

    // 주방 룸에 연결된 클라이언트 ID 목록
    private readonly kitchenClients = new Set<string>();

    afterInit() {
        this.logger.log("WebSocket Gateway 초기화 완료");
    }

    handleConnection(client: Socket) {
        this.logger.log(`클라이언트 연결: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`클라이언트 연결 해제: ${client.id}`);

        // 연결 해제 시 kitchen 룸에서 자동 제거
        if (this.kitchenClients.has(client.id)) {
            client.leave('kitchen');
            this.kitchenClients.delete(client.id);
            this.logger.log(`클라이언트 ${client.id}가 kitchen 룸에서 제거되었습니다.`);
        }
    }

    onModuleInit() {
        this.logger.log("WebSocket 모듈이 초기화되었습니다.");
    }

    /**
  * 룸 조인 이벤트 핸들러
  * 클라이언트가 kitchen 룸에 조인할 때 호출
  */
    @SubscribeMessage('join_kitchen')
    handleJoinRoom(client: Socket, payload: unknown) {
        try {
            // 요청 데이터 검증
            const request = JoinRoomRequestSchema.parse(payload);

            // kitchen 룸 조인 처리
            if (request.roomType === WebSocketRoomType.KITCHEN) {
                client.join('kitchen');
                this.kitchenClients.add(client.id);

                this.logger.log(
                    `클라이언트 ${client.id}가 kitchen 룸에 조인했습니다. (현재 인원: ${this.kitchenClients.size})`
                );

                // 조인 성공 응답
                client.emit('Join_room_success', {
                    roomType: WebSocketRoomType.KITCHEN,
                    message: 'kitchen 룸에 조인했습니다.',
                });

                return {
                    success: true,
                    roomType: WebSocketRoomType.KITCHEN,
                    message: "kitchen 룸에 조인했습니다.",
                }
            }

            // 다른 룸 타입은 추후 구현 (order 룸 등)
            client.emit("error", {
                message: "지원하지 않는 룸 타입입니다.",
            });

            return {
                success: false,
                message: "지원하지 않는 룸 타입입니다.",
            };
        } catch (error) {
            this.logger.error(`룸 조인 실패: ${error}`);

            client.emit("error", {
                message: "룸 조인 요청이 유효하지 않습니다.",
            });

            return {
                success: false,
                message: "룸 조인 요청이 유효하지 않습니다.",
            };
        }
    }

    /**
   * 룸 나가기 이벤트 핸들러
   * 클라이언트가 kitchen 룸에서 나갈 때 호출
   */
    @SubscribeMessage('leave_room')
    handleLeaveRoom(client: Socket, payload: unknown) {
        try {
            // 요청 데이터 검증
            const request = LeaveRoomRequestSchema.parse(payload);

            // kitchen 룸 나가기 처리
            if (request.roomType === WebSocketRoomType.KITCHEN) {
                client.leave('kitchen');
                this.kitchenClients.delete(client.id);

                this.logger.log(
                    `클라이언트 ${client.id}가 kitchen 룸에서 나갔습니다. (현재 인원: ${this.kitchenClients.size})`
                );

                // 나가기 성공 응답
                client.emit("leave_room_success", {
                    roomType: WebSocketRoomType.KITCHEN,
                    message: "kitchen 룸에서 나갔습니다.",
                });

                return {
                    success: true,
                    roomType: WebSocketRoomType.KITCHEN,
                    message: "kitchen 룸에서 나갔습니다.",
                };
            }
            // 다른 룸 타입은 추후 구현
            client.emit("error", {
                message: "지원하지 않는 룸 타입입니다.",
            });

            return {
                success: false,
                message: "지원하지 않는 룸 타입입니다.",
            };
        } catch (error) {
            this.logger.error(`룸 나가기 실패: ${error}`);

            client.emit("error", {
                message: "룸 나가기 요청이 유효하지 않습니다.",
            });

            return {
                success: false,
                message: "룸 나가기 요청이 유효하지 않습니다.",
            };
        }
    }

    /**
     * kitchen 룸에 이벤트 브로드캐스트
     * 다른 서비스에서 호출하여 kitchen 룸의 모든 클라이언트에게 이벤트 전송
     */
    broadcastToKitchen(event: string, data: any) {
        this.server.to("kitchen").emit(event, data);
        this.logger.log(`kitchen 룸에 이벤트 브로드캐스트: ${event}`);
    }

    /**
     * kitchen 룸에 연결된 클라이언트 수 조회
     */
    getKitchenClientCount(): number {
        return this.kitchenClients.size;
    }
}