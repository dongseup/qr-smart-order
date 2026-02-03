import { SocketEvent, type SocketEventPayload } from "@/types";

/**
 * 이벤트 리스너 타입
 */
type EventListener<T = any> = (data: T) => void | Promise<void>;

/**
 * Socket 이벤트 버스
 * 중앙 집중식 이벤트 관리 시스템
 */
class SocketEventBus {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private eventHistory: Array<{ event: string; data: any; timestamp: number }> = [];
  private maxHistorySize = 50;

  /**
   * 이벤트 리스너 등록
   */
  on<K extends keyof SocketEventPayload>(
    event: K,
    listener: EventListener<SocketEventPayload[K]>
  ): () => void;
  on(event: string, listener: EventListener): () => void;
  on(event: string, listener: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(listener);

    // 리스너 제거 함수 반환
    return () => this.off(event, listener);
  }

  /**
   * 이벤트 리스너 제거
   */
  off<K extends keyof SocketEventPayload>(
    event: K,
    listener: EventListener<SocketEventPayload[K]>
  ): void;
  off(event: string, listener: EventListener): void;
  off(event: string, listener: EventListener): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 이벤트 발생 (모든 리스너 호출)
   */
  async emit<K extends keyof SocketEventPayload>(
    event: K,
    data: SocketEventPayload[K]
  ): Promise<void>;
  async emit(event: string, data: any): Promise<void>;
  async emit(event: string, data: any): Promise<void> {
    const listeners = this.listeners.get(event);

    if (!listeners || listeners.size === 0) {
      console.log(`📭 No listeners for event: ${event}`);
      return;
    }

    console.log(`📢 Emitting event: ${event} to ${listeners.size} listeners`);

    // 이벤트 히스토리에 추가
    this.addToHistory(event, data);

    // 모든 리스너 병렬 실행
    const promises = Array.from(listeners).map(async (listener) => {
      try {
        await listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * 일회성 이벤트 리스너 등록
   */
  once<K extends keyof SocketEventPayload>(
    event: K,
    listener: EventListener<SocketEventPayload[K]>
  ): () => void;
  once(event: string, listener: EventListener): () => void;
  once(event: string, listener: EventListener): () => void {
    const wrappedListener: EventListener = async (data) => {
      this.off(event, wrappedListener);
      await listener(data);
    };

    return this.on(event, wrappedListener);
  }

  /**
   * 모든 이벤트 리스너 제거
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * 특정 이벤트의 리스너 개수
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0;
  }

  /**
   * 이벤트 히스토리에 추가
   */
  private addToHistory(event: string, data: any): void {
    this.eventHistory.push({
      event,
      data,
      timestamp: Date.now(),
    });

    // 최대 크기 제한
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * 이벤트 히스토리 조회
   */
  getHistory(limit?: number): Array<{ event: string; data: any; timestamp: number }> {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  /**
   * 이벤트 히스토리 초기화
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * 디버깅용: 등록된 모든 이벤트 목록
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.listeners.keys());
  }
}

/**
 * 전역 이벤트 버스 인스턴스
 */
export const socketEventBus = new SocketEventBus();

/**
 * React 훅에서 사용하기 위한 유틸리티
 */
export function useSocketEventBusSubscription() {
  return {
    subscribe: socketEventBus.on.bind(socketEventBus),
    emit: socketEventBus.emit.bind(socketEventBus),
    getHistory: socketEventBus.getHistory.bind(socketEventBus),
  };
}
