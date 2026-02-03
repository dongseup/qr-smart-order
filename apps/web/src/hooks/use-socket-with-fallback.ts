"use client";

import { useEffect, useRef } from "react";
import { useSocketStore, SocketStatus } from "@/stores/socket-store";
import { useNetworkStatus } from "./use-network-status";

/**
 * Socket 연결과 폴링 폴백을 관리하는 훅
 * 네트워크 상태를 감지하고 자동으로 재연결 시도
 */
interface UseSocketWithFallbackProps {
  autoConnect?: boolean;
  onConnectionChange?: (isConnected: boolean) => void;
}

export function useSocketWithFallback({
  autoConnect = true,
  onConnectionChange,
}: UseSocketWithFallbackProps = {}) {
  const { socket, isConnected, connectionStatus, connect, disconnect } = useSocketStore();
  const networkStatus = useNetworkStatus();
  const previousOnlineRef = useRef(networkStatus.isOnline);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 네트워크가 온라인으로 복구되면 Socket 재연결 시도
   */
  useEffect(() => {
    // 브라우저 환경이 아니면 스킵
    if (typeof window === "undefined") return;

    // 이전에 오프라인이었고 현재 온라인이면 재연결
    if (!previousOnlineRef.current && networkStatus.isOnline) {
      console.log("📡 Network recovered, attempting to reconnect socket...");

      // Socket이 연결 실패 상태이거나 연결되지 않은 상태면 재연결
      if (
        connectionStatus === SocketStatus.FAILED ||
        connectionStatus === SocketStatus.DISCONNECTED ||
        !isConnected
      ) {
        // 2초 후 재연결 시도 (네트워크 안정화 대기)
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("🔄 Reconnecting socket after network recovery...");
          connect();
        }, 2000);
      }
    }

    // 현재 온라인 상태 저장
    previousOnlineRef.current = networkStatus.isOnline;

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [networkStatus.isOnline, connectionStatus, isConnected, connect]);

  /**
   * 자동 연결 초기화
   */
  useEffect(() => {
    if (!autoConnect) return;
    if (typeof window === "undefined") return;

    // 이미 연결되어 있으면 스킵
    if (socket?.connected) return;

    // 네트워크가 온라인이면 연결
    if (networkStatus.isOnline) {
      console.log("🔌 Auto-connecting socket...");
      connect();
    }
  }, [autoConnect, networkStatus.isOnline, socket, connect]);

  /**
   * 연결 상태 변경 콜백
   */
  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(isConnected);
    }
  }, [isConnected, onConnectionChange]);

  /**
   * 폴링 간격 계산 (네트워크 상태 및 Socket 연결 상태 고려)
   */
  const getPollingInterval = (isPageVisible: boolean = true): number => {
    // 오프라인이면 폴링 비활성화
    if (!networkStatus.isOnline) {
      return 0; // 폴링 중지
    }

    // Socket이 연결되어 있으면 폴링 간격을 늘림
    if (isConnected) {
      return isPageVisible ? 10000 : 60000; // 10초 / 60초
    }

    // Socket이 연결되지 않았으면 더 자주 폴링
    // 네트워크 품질에 따라 간격 조정
    if (networkStatus.effectiveType === "slow-2g" || networkStatus.effectiveType === "2g") {
      return isPageVisible ? 10000 : 30000; // 느린 네트워크에서는 간격 증가
    }

    return isPageVisible ? 5000 : 30000; // 5초 / 30초
  };

  /**
   * 폴백 모드 여부 (Socket 미연결 상태)
   */
  const isFallbackMode =
    !isConnected ||
    connectionStatus === SocketStatus.DISCONNECTED ||
    connectionStatus === SocketStatus.FAILED;

  return {
    isConnected,
    connectionStatus,
    networkStatus,
    isFallbackMode,
    getPollingInterval,
    socket,
  };
}
