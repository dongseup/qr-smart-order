import { create } from "zustand";
import { io, Socket } from "socket.io-client";

/**
 * Socket 스토어 인터페이스
 * WebSocket 연결을 관리하고 실시간 통신 기능을 제공
 */
interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  currentRoom: string | null;
  reconnectAttempts: number;
  connect: (serverUrl?: string) => void;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId?: string) => void;
  emit: (event: string, data: any) => void;
  resetReconnectAttempts: () => void;
}

// 환경 변수에서 서버 URL 가져오기, 없으면 기본값 사용
const DEFAULT_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

/**
 * Socket.io 클라이언트 Zustand 스토어
 * 실시간 양방향 통신을 위한 WebSocket 연결 관리
 */
export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,
  currentRoom: null,
  reconnectAttempts: 0,

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

    // Socket.io 클라이언트 초기화
    const newSocket = io(serverUrl || DEFAULT_SERVER_URL, {
      transports: ['websocket', 'polling'], // WebSocket 우선, 실패 시 polling
      reconnection: true, // 자동 재연결 활성화
      reconnectionDelay: 1000, // 재연결 시도 간격 (1초)
      reconnectionDelayMax: 5000, // 최대 재연결 간격 (5초)
      reconnectionAttempts: 5, // 최대 재연결 시도 횟수
    });

    // 연결 성공 이벤트
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      set({
        isConnected: true,
        reconnectAttempts: 0
      });
    });

    // 연결 해제 이벤트
    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      set({
        isConnected: false,
        currentRoom: null
      });
    });

    // 연결 에러 이벤트
    newSocket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message);
      set((state) => ({
        reconnectAttempts: state.reconnectAttempts + 1
      }));
    });

    // 재연결 시도 이벤트
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    // 재연결 성공 이벤트
    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      set({ reconnectAttempts: 0 });

      // 이전에 참여했던 룸이 있으면 재참여
      const { currentRoom } = get();
      if (currentRoom) {
        newSocket.emit('join_room', currentRoom);
      }
    });

    // 재연결 실패 이벤트
    newSocket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after maximum attempts');
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
      currentRoom: null,
      reconnectAttempts: 0
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
