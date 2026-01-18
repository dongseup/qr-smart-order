import { Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
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
    pingInterval: 30000, // Socket.io 기본 ping 간격 (30초)
    pingTimeout: 10000, // ping 응답 타임아웃 (10초)
})
export class AppWebSocketGateway
    implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(AppWebSocketGateway.name);

    // 주방 룸에 연결된 클라이언트 ID 목록
    // 주방 룸: Set으로 중복 제거하며 클라이언트 ID 저장
    private readonly kitchenClients = new Set<string>();

    // 고객별 주문 룸 추적: Map<clientId, Set<orderId>>
    // 주문 룸: 클라이언트별로 참여한 주문 룸들을 추적
    // 예: { "client-123" => Set(["order-1", "order-2"]) }
    private readonly clientOrderRooms = new Map<string, Set<string>>();

    // 클라이언트 연결 메타데이터: Map<clientId, { connectedAt: Date; lastHeartbeat?: Date }>
    private readonly clientMetadata = new Map<string, { connectedAt: Date; lastHeartbeat?: Date }>();

    // 연결 통계
    private totalConnections = 0;
    private currentConnections = 0;

    // 하트비트 인터벌 (30초)
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private readonly HEARTBEAT_INTERVAL = 30000; // 30초
    private readonly HEARTBEAT_TIMEOUT = 15000; // 15초 (응답 대기 시간)

    afterInit() {
        this.logger.log("WebSocket Gateway 초기화 완료");
    }


    onModuleInit() {
        this.logger.log("WebSocket 모듈이 초기화되었습니다.");

        // 하트비트 인터벌 시작
        this.startHeartbeat();
    }

    onModuleDestroy() {
        // 하트비트 인터벌 정리
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        this.logger.log("하트비트 인터벌이 정리되었습니다.");
    }

    handleConnection(client: Socket) {
        this.logger.log(`클라이언트 연결: ${client.id}`);

        // 클라이언트 연결 시 빈 Set 초기화
        this.clientOrderRooms.set(client.id, new Set())

        // 연결 메타데이터 저장
        this.clientMetadata.set(client.id, {
            connectedAt: new Date(),
            lastHeartbeat: new Date(), // 첫 하트비트 전 타임아웃 방지
        });

        // 연결 통계 업데이트
        this.totalConnections++;
        this.currentConnections++;

        this.logger.log(
            `현재 활성 연결 수: ${this.currentConnections}, 총 연결 수: ${this.totalConnections}`
        );
    }

    handleDisconnect(client: Socket) {
        const metadata = this.clientMetadata.get(client.id);
        const connectionDuration = metadata
            ? Math.floor((Date.now() - metadata.connectedAt.getTime()) / 1000)
            : 0;

        this.logger.log(
            `클라이언트 연결 해제: ${client.id} (연결 지속 시간: ${connectionDuration}초)`
        );

        // 연결 해제 시 kitchen 룸에서 자동 제거
        if (this.kitchenClients.has(client.id)) {
            client.leave('kitchen');
            this.kitchenClients.delete(client.id);
            this.logger.log(`클라이언트 ${client.id}가 kitchen 룸에서 제거되었습니다.`);
        }

        // 연결 해제 시 모든 order 룸에서 자동 제거
        const orderRooms = this.clientOrderRooms.get(client.id);
        if (orderRooms && orderRooms.size > 0) {
            orderRooms.forEach((orderId) => {
                const roomName = `order_${orderId}`;
                client.leave(roomName);
                this.logger.log(`클라이언트 ${client.id}가 ${roomName} 룸에서 제거되었습니다.`);
            });
            this.clientOrderRooms.delete(client.id);
        }

        // 메타데이터 정리
        this.clientMetadata.delete(client.id);

        // 연결 통계 업데이트
        this.currentConnections--;

        this.logger.log(`현재 활성 연결 수: ${this.currentConnections}`);
    }

    /**
     * 하트비트 시작
     * 30초 간격으로 모든 클라이언트에 heartbeat 이벤트 전송
     */
    private startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            const now = new Date();
            const clientsToDisconnect: string[] = [];

            // 모든 연결된 클라이언트에 heartbeat 전송
            this.server.sockets.sockets.forEach((socket, clientId) => {
                const metadata = this.clientMetadata.get(clientId);

                if (metadata) {
                    // 마지막 하트비트 응답 시간 확인
                    if (metadata.lastHeartbeat) {
                        const timeSinceLastHeartbeat = now.getTime() - metadata.lastHeartbeat.getTime();

                        // 타임아웃 초과 시 연결 해제 대상으로 추가
                        if (timeSinceLastHeartbeat > this.HEARTBEAT_TIMEOUT) {
                            clientsToDisconnect.push(clientId);
                        }
                    }


                    // heartbeat 이벤트 전송
                    socket.emit('heartbeat', { timestamp: now.toISOString() });
                }
            });

            // 무응답 클라이언트 연결 해제
            clientsToDisconnect.forEach((clientId) => {
                const socket = this.server.sockets.sockets.get(clientId);
                if (socket) {
                    this.logger.warn(
                        `클라이언트 ${clientId}가 하트비트에 응답하지 않아 연결을 해제합니다.`
                    );
                    socket.disconnect(true);
                }
            });
        }, this.HEARTBEAT_INTERVAL);
    }


    /**
     * 하트비트 응답 이벤트 핸들러
     * 클라이언트가 heartbeat_ack 이벤트로 응답
     */
    @SubscribeMessage('heartbeat_ack')
    handleHeartbeatAck(client: Socket) {
        const metadata = this.clientMetadata.get(client.id);
        if (metadata) {
            metadata.lastHeartbeat = new Date();
            this.clientMetadata.set(client.id, metadata);
        }
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

            // order 룸 조인 처리
            if (request.roomType === WebSocketRoomType.ORDER) {
                // orderId 필수 검증
                if (!request.orderId) {
                    client.emit('error', {
                        message: "order 룸 조인 시 orderId가 필요합니다.",
                    });

                    return {
                        success: false,
                        message: "order 룸 조인 시 orderId가 필요합니다.",
                    };
                }

                const orderId = request.orderId;
                const roomName = `order_${orderId}`;

                // 룸 조인
                client.join(roomName);

                // 클라이언트의 주문 룸 목록에 추가
                const orderRooms = this.clientOrderRooms.get(client.id) || new Set<string>();
                orderRooms.add(orderId);
                this.clientOrderRooms.set(client.id, orderRooms);

                this.logger.log(
                    `클라이언트 ${client.id}가 ${roomName} 룸에 조인했습니다. (현재 인원: ${this.getOrderRoomClientCount(orderId)})`
                );

                client.emit('join_room_success', {
                    roomType: WebSocketRoomType.ORDER,
                    orderId: orderId,
                    message: `${roomName} 룸에 조인했습니다.`,
                });

                return {
                    success: true,
                    roomType: WebSocketRoomType.ORDER,
                    orderId: orderId,
                    message: `${roomName} 룸에 조인했습니다.`,
                };
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

            // order 룸 나가기 처리
            if (request.roomType === WebSocketRoomType.ORDER) {
                // orderId 필수 검증
                if (!request.orderId) {
                    client.emit("error", {
                        message: "order 룸 나가기 시 orderId가 필요합니다.",
                    });
                    return {
                        success: false,
                        message: "order 룸 나가기 시 orderId가 필요합니다.",
                    };
                }

                const orderId = request.orderId;
                const roomName = `order_${orderId}`;

                // 룸 나가기
                client.leave(roomName);

                // 클라이언트의 주문 룸 목록에서 제거
                const orderRooms = this.clientOrderRooms.get(client.id);
                if (orderRooms) {
                    orderRooms.delete(orderId);
                    if (orderRooms.size === 0) {
                        this.clientOrderRooms.delete(client.id);
                    }
                }

                this.logger.log(
                    `클라이언트 ${client.id}가 ${roomName} 룸에서 나갔습니다. (현재 인원: ${this.getOrderRoomClientCount(orderId)})`
                );

                client.emit("leave_room_success", {
                    roomType: WebSocketRoomType.ORDER,
                    orderId: orderId,
                    message: `${roomName} 룸에서 나갔습니다.`,
                });

                return {
                    success: true,
                    roomType: WebSocketRoomType.ORDER,
                    orderId: orderId,
                    message: `${roomName} 룸에서 나갔습니다.`,
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
     * 특정 주문 룸에 이벤트 브로드캐스트
     * 주문 상태 변경 시 해당 주문의 고객에게만 이벤트 전송
     */
    broadcastToOrder(orderId: string, event: string, data: any) {
        const roomName = `order_${orderId}`;
        this.server.to(roomName).emit(event, data);
        this.logger.log(`${roomName} 룸에 이벤트 브로드캐스트: ${event}`);
    }

    /**
     * kitchen 룸에 연결된 클라이언트 수 조회
     */
    getKitchenClientCount(): number {
        return this.kitchenClients.size;
    }

    /**
     * 특정 주문 룸에 연결된 클라이언트 수 조회
     */
    getOrderRoomClientCount(orderId: string): number {
        const roomName = `order_${orderId}`;
        const room = this.server.sockets.adapter.rooms.get(roomName);
        return room ? room.size : 0;
    }

    /**
    * 클라이언트가 참여한 주문 룸 목록 조회
    */
    getClientOrderRooms(clientId: string): string[] {
        const orderRooms = this.clientOrderRooms.get(clientId);
        return orderRooms ? Array.from(orderRooms) : [];
    }

    /**
     * 현재 활성 연결 수 조회
     */
    getCurrentConnections(): number {
        return this.currentConnections;
    }

    /**
     * 총 연결 수 조회
     */
    getTotalConnections(): number {
        return this.totalConnections;
    }

    /**
     * 클라이언트 연결 메타데이터 조회
     */
    getClientMetadata(clientId: string): { connectedAt: Date } | undefined {
        return this.clientMetadata.get(clientId);
    }
}