import type { Socket } from "socket.io-client";
import { SocketEvent } from "@/types";

/**
 * Socket 이벤트 미들웨어 타입
 */
export type SocketEventHandler<T = any> = (data: T) => void | Promise<void>;

export type SocketMiddleware<T = any> = (
  data: T,
  next: () => void | Promise<void>
) => void | Promise<void>;

/**
 * 이벤트 히스토리 항목
 */
export interface EventHistoryItem {
  event: string;
  data: any;
  timestamp: number;
  duration?: number;
  error?: string;
}

/**
 * Socket 이벤트 미들웨어 매니저
 */
export class SocketMiddlewareManager {
  private middlewares: SocketMiddleware[] = [];
  private eventHistory: EventHistoryItem[] = [];
  private maxHistorySize = 100;

  /**
   * 미들웨어 추가
   */
  use(middleware: SocketMiddleware) {
    this.middlewares.push(middleware);
  }

  /**
   * 미들웨어 체인 실행
   */
  async execute<T = any>(
    event: string,
    data: T,
    handler: SocketEventHandler<T>
  ): Promise<void> {
    const startTime = Date.now();
    let currentIndex = 0;

    const next = async (): Promise<void> => {
      if (currentIndex < this.middlewares.length) {
        const middleware = this.middlewares[currentIndex++];
        await middleware(data, next);
      } else {
        // 모든 미들웨어를 거친 후 실제 핸들러 실행
        await handler(data);
      }
    };

    try {
      await next();

      // 이벤트 히스토리에 성공 기록
      this.addToHistory({
        event,
        data,
        timestamp: startTime,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      // 이벤트 히스토리에 에러 기록
      this.addToHistory({
        event,
        data,
        timestamp: startTime,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * 이벤트 히스토리에 추가
   */
  private addToHistory(item: EventHistoryItem) {
    this.eventHistory.push(item);

    // 최대 크기 제한
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * 이벤트 히스토리 조회
   */
  getHistory(limit?: number): EventHistoryItem[] {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  /**
   * 이벤트 히스토리 초기화
   */
  clearHistory() {
    this.eventHistory = [];
  }
}

/**
 * 로깅 미들웨어
 */
export const loggingMiddleware: SocketMiddleware = async (data, next) => {
  const startTime = Date.now();
  console.log("📨 Socket event received:", data);

  await next();

  const duration = Date.now() - startTime;
  console.log(`✅ Socket event processed in ${duration}ms`);
};

/**
 * 에러 핸들링 미들웨어
 */
export const errorHandlingMiddleware: SocketMiddleware = async (data, next) => {
  try {
    await next();
  } catch (error) {
    console.error("❌ Socket event handler error:", error);
    console.error("Event data:", data);

    // 에러를 다시 던져서 상위에서 처리할 수 있도록 함
    throw error;
  }
};

/**
 * 디바운싱 미들웨어 팩토리
 * @param delay - 디바운스 지연 시간 (밀리초)
 */
export function createDebounceMiddleware(delay: number): SocketMiddleware {
  const timeouts = new Map<string, NodeJS.Timeout>();

  return (data, next) => {
    // 이벤트 키 생성 (데이터 기반)
    const eventKey = JSON.stringify(data);

    // 기존 타이머 취소
    const existingTimeout = timeouts.get(eventKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // 새 타이머 설정
    const timeout = setTimeout(() => {
      timeouts.delete(eventKey);
      next();
    }, delay);

    timeouts.set(eventKey, timeout);
  };
}

/**
 * 쓰로틀링 미들웨어 팩토리
 * @param delay - 쓰로틀 지연 시간 (밀리초)
 */
export function createThrottleMiddleware(delay: number): SocketMiddleware {
  const lastExecutionTimes = new Map<string, number>();

  return async (data, next) => {
    const eventKey = JSON.stringify(data);
    const now = Date.now();
    const lastExecutionTime = lastExecutionTimes.get(eventKey) || 0;

    if (now - lastExecutionTime >= delay) {
      lastExecutionTimes.set(eventKey, now);
      await next();
    } else {
      console.log(`⏭️ Throttled event (too soon)`);
    }
  };
}

/**
 * 타입 검증 미들웨어 팩토리
 * @param validator - 데이터 검증 함수
 */
export function createValidationMiddleware<T = any>(
  validator: (data: any) => data is T
): SocketMiddleware<T> {
  return async (data, next) => {
    if (!validator(data)) {
      console.warn("⚠️ Invalid event data:", data);
      throw new Error("Invalid event data format");
    }

    await next();
  };
}

/**
 * Socket 이벤트 리스너를 미들웨어로 래핑
 */
export function wrapEventListener<T = any>(
  socket: Socket,
  event: string,
  handler: SocketEventHandler<T>,
  manager: SocketMiddlewareManager
) {
  const wrappedHandler = async (data: T) => {
    try {
      await manager.execute(event, data, handler);
    } catch (error) {
      console.error(`Error handling ${event}:`, error);
    }
  };

  socket.on(event, wrappedHandler);

  // 리스너 제거 함수 반환
  return () => {
    socket.off(event, wrappedHandler);
  };
}

/**
 * 기본 미들웨어 매니저 인스턴스
 */
export const defaultMiddlewareManager = new SocketMiddlewareManager();

// 기본 미들웨어 등록
defaultMiddlewareManager.use(errorHandlingMiddleware);
defaultMiddlewareManager.use(loggingMiddleware);
