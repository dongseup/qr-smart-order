import { create } from "zustand";
import { io, Socket } from "socket.io-client";

/**
 * Socket 연결 상태
 */
export enum SocketStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed',
}

/**
 * Socket 스토어 인터페이스
 * WebSocket 연결을 관리하고 실시간 통신 기능을 제공
 */
interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: SocketStatus;
  currentRoom: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  lastError: string | null;
  connect: (serverUrl?: string) => void;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId?: string) => void;
  emit: (event: string, data: any) => void;
  resetReconnectAttempts: () => void;
}

// 환경 변수에서 서버 URL 가져오기, 없으면 기본값 사용
const DEFAULT_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// 재연결 설정
const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY = 3000; // 3초

/**
 * 지수 백오프 계산
 * @param attempt - 재연결 시도 횟수
 * @returns 지연 시간 (밀리초)
 */
function calculateBackoffDelay(attempt: number): number {
  // 3초, 6초, 12초, 24초, 48초
  return Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, attempt), 60000);
}

/**
 * Socket.io 클라이언트 Zustand 스토어
 * 실시간 양방향 통신을 위한 WebSocket 연결 관리
 */
export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,
  connectionStatus: SocketStatus.DISCONNECTED,
  currentRoom: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
  lastError: null,

  /**
   * Socket.io 서버에 연결
   * @param serverUrl - 연결할 서버 URL (선택사항)
   */
  connect: (serverUrl?: string) => {
    const { socket, disconnect } = get();

    // 이미 연결되어 있으면 기존 연결 해제
    if (socket?.connected) {
      disconnect();
    }

    set({
      connectionStatus: SocketStatus.CONNECTING,
      lastError: null,
    });

    // Socket.io 클라이언트 초기화 (지수 백오프 적용)
    const newSocket = io(serverUrl || DEFAULT_SERVER_URL, {
      transports: ['websocket', 'polling'], // WebSocket 우선, 실패 시 polling
      reconnection: true, // 자동 재연결 활성화
      reconnectionDelay: INITIAL_RECONNECT_DELAY, // 초기 재연결 간격 (3초)
      reconnectionDelayMax: 60000, // 최대 재연결 간격 (60초)
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS, // 최대 재연결 시도 횟수
    });

    // 연결 성공 이벤트
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      set({
        isConnected: true,
        connectionStatus: SocketStatus.CONNECTED,
        reconnectAttempts: 0,
        lastError: null,
      });
    });

    // 연결 해제 이벤트
    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      set({
        isConnected: false,
        connectionStatus: SocketStatus.DISCONNECTED,
        currentRoom: null,
        lastError: `연결 해제: ${reason}`,
      });
    });

    // 연결 에러 이벤트
    newSocket.on('connect_error', (error) => {
      const { reconnectAttempts, maxReconnectAttempts } = get();
      const nextAttempt = reconnectAttempts + 1;

      console.error(`🔴 Socket connection error (attempt ${nextAttempt}/${maxReconnectAttempts}):`, error.message);

      // 지수 백오프 지연 시간 계산
      const backoffDelay = calculateBackoffDelay(reconnectAttempts);
      console.log(`⏱️ Next reconnection attempt in ${backoffDelay / 1000}s`);

      set({
        reconnectAttempts: nextAttempt,
        connectionStatus: nextAttempt >= maxReconnectAttempts
          ? SocketStatus.FAILED
          : SocketStatus.RECONNECTING,
        lastError: error.message,
      });
    });

    // 재연결 시도 이벤트
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}/${MAX_RECONNECT_ATTEMPTS}...`);
      set({
        connectionStatus: SocketStatus.RECONNECTING,
        reconnectAttempts: attemptNumber,
      });
    });

    // 재연결 성공 이벤트
    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      set({
        reconnectAttempts: 0,
        connectionStatus: SocketStatus.CONNECTED,
        isConnected: true,
        lastError: null,
      });

      // 이전에 참여했던 룸이 있으면 재참여
      const { currentRoom } = get();
      if (currentRoom) {
        console.log(`🚪 Rejoining room: ${currentRoom}`);
        newSocket.emit('join_room', currentRoom);
      }
    });

    // 재연결 실패 이벤트
    newSocket.on('reconnect_failed', () => {
      console.error(`❌ Reconnection failed after ${MAX_RECONNECT_ATTEMPTS} attempts`);
      set({
        connectionStatus: SocketStatus.FAILED,
        lastError: `재연결 실패 (최대 ${MAX_RECONNECT_ATTEMPTS}회 시도)`,
      });
    });

    set({ socket: newSocket });
  },

  /**
   * Socket 연결 해제
   */
  disconnect: () => {
    const { socket } = get();

    if (socket) {
      socket.disconnect();
      console.log('👋 Socket disconnected manually');
    }

    set({
      socket: null,
      isConnected: false,
      connectionStatus: SocketStatus.DISCONNECTED,
      currentRoom: null,
      reconnectAttempts: 0,
      lastError: null,
    });
  },

  /**
   * 특정 룸에 참여
   * @param roomId - 참여할 룸 ID
   */
  joinRoom: (roomId: string) => {
    const { socket, isConnected } = get();

    if (!socket || !isConnected) {
      console.warn('⚠️ Cannot join room: Socket not connected');
      return;
    }

    // 서버에 룸 참여 요청
    socket.emit('join_room', roomId);
    console.log(`🚪 Joined room: ${roomId}`);

    set({ currentRoom: roomId });
  },

  /**
   * 특정 룸에서 나가기
   * @param roomId - 나갈 룸 ID (선택사항, 없으면 현재 룸)
   */
  leaveRoom: (roomId?: string) => {
    const { socket, currentRoom, isConnected } = get();

    if (!socket || !isConnected) {
      console.warn('⚠️ Cannot leave room: Socket not connected');
      return;
    }

    const targetRoom = roomId || currentRoom;

    if (!targetRoom) {
      console.warn('⚠️ No room to leave');
      return;
    }

    // 서버에 룸 나가기 요청
    socket.emit('leave_room', targetRoom);
    console.log(`🚪 Left room: ${targetRoom}`);

    if (targetRoom === currentRoom) {
      set({ currentRoom: null });
    }
  },

  /**
   * 이벤트 발생 (서버로 메시지 전송)
   * @param event - 이벤트 이름
   * @param data - 전송할 데이터
   */
  emit: (event: string, data: any) => {
    const { socket, isConnected } = get();

    if (!socket || !isConnected) {
      console.warn('⚠️ Cannot emit event: Socket not connected');
      return;
    }

    socket.emit(event, data);
    console.log(`📤 Emitted event: ${event}`, data);
  },

  /**
   * 재연결 시도 횟수 초기화
   */
  resetReconnectAttempts: () => {
    set({ reconnectAttempts: 0 });
  },
}));
