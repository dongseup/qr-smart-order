"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSocketStore } from "@/stores/socket-store";
import { useToast } from "@/hooks/use-toast";
import { SocketEvent, type OrderStatus } from "@/types";

/**
 * 고객 화면을 위한 주문 알림 훅
 * Socket.io를 통해 실시간 주문 상태 알림을 받고 처리
 */
interface UseOrderNotificationProps {
  orderId?: string;
  onStatusChange?: (status: OrderStatus) => void;
  onOrderReady?: () => void;
  enableVibration?: boolean;
  enableToast?: boolean;
}

export function useOrderNotification({
  orderId,
  onStatusChange,
  onOrderReady,
  enableVibration = true,
  enableToast = true,
}: UseOrderNotificationProps = {}) {
  const { socket, isConnected, connect, disconnect, joinRoom } = useSocketStore();
  const { toast } = useToast();
  const isInitializedRef = useRef(false);

  /**
   * 진동 트리거 (모바일 환경)
   * 패턴: [진동시간, 멈춤시간] 반복
   */
  const triggerVibration = useCallback(() => {
    if (!enableVibration) return;

    // Vibration API 지원 확인
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        // 200ms 진동, 100ms 멈춤, 200ms 진동 패턴
        navigator.vibrate([200, 100, 200]);
        console.log("📳 Vibration triggered");
      } catch (error) {
        console.warn("⚠️ Vibration failed:", error);
      }
    }
  }, [enableVibration]);

  /**
   * Toast 알림 표시
   */
  const showToast = useCallback(
    (title: string, description: string) => {
      if (!enableToast) return;

      toast({
        title,
        description,
        duration: 5000,
      });
    },
    [enableToast, toast]
  );

  /**
   * 주문 준비 완료 알림 처리
   */
  const handleOrderReady = useCallback(
    (data: { orderId: string; tableId: string; message?: string }) => {
      console.log("🍽️ Order ready notification:", data);

      // Toast 알림 표시
      showToast(
        "🎉 주문 준비 완료!",
        data.message || "음식이 준비되었습니다. 카운터에서 수령해 주세요."
      );

      // 진동 트리거
      triggerVibration();

      // 콜백 호출
      if (onOrderReady) {
        onOrderReady();
      }
    },
    [showToast, triggerVibration, onOrderReady]
  );

  /**
   * 주문 상태 변경 알림 처리
   */
  const handleOrderStatusChanged = useCallback(
    (data: { orderId: string; status: OrderStatus; updatedAt: string }) => {
      console.log("🔄 Order status changed:", data);

      // 상태에 따른 알림 메시지
      const statusMessages: Record<OrderStatus, { title: string; description: string }> = {
        PENDING: {
          title: "주문 접수",
          description: "주문이 접수되었습니다.",
        },
        COOKING: {
          title: "조리 중",
          description: "음식을 조리하고 있습니다. 잠시만 기다려 주세요.",
        },
        READY: {
          title: "준비 완료",
          description: "음식이 준비되었습니다. 카운터에서 수령해 주세요.",
        },
        COMPLETED: {
          title: "완료",
          description: "주문이 완료되었습니다. 감사합니다!",
        },
      };

      const message = statusMessages[data.status];
      if (message) {
        showToast(message.title, message.description);
      }

      // READY 상태일 때 진동
      if (data.status === "READY") {
        triggerVibration();
      }

      // 콜백 호출
      if (onStatusChange) {
        onStatusChange(data.status);
      }
    },
    [showToast, triggerVibration, onStatusChange]
  );

  /**
   * Socket 이벤트 리스너 등록
   */
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log("🔌 Registering order notification listeners");

    // order_ready 이벤트 리스너
    socket.on(SocketEvent.ORDER_READY, handleOrderReady);

    // order_status_changed 이벤트 리스너
    socket.on(SocketEvent.ORDER_STATUS_CHANGED, handleOrderStatusChanged);

    return () => {
      console.log("🔌 Removing order notification listeners");
      socket.off(SocketEvent.ORDER_READY, handleOrderReady);
      socket.off(SocketEvent.ORDER_STATUS_CHANGED, handleOrderStatusChanged);
    };
  }, [socket, isConnected, handleOrderReady, handleOrderStatusChanged]);

  /**
   * Socket 연결 초기화
   */
  useEffect(() => {
    // 이미 초기화되었으면 스킵
    if (isInitializedRef.current) return;

    // 브라우저 환경이 아니면 스킵
    if (typeof window === "undefined") return;

    console.log("🔌 Initializing socket connection for customer");

    // Socket 연결
    connect();

    isInitializedRef.current = true;

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      console.log("🔌 Disconnecting socket for customer");
      disconnect();
      isInitializedRef.current = false;
    };
  }, [connect, disconnect]);

  /**
   * 주문 ID가 있으면 해당 룸에 참여
   */
  useEffect(() => {
    if (!orderId || !isConnected) return;

    console.log(`🚪 Joining order room: order_${orderId}`);
    joinRoom(`order_${orderId}`);
  }, [orderId, isConnected, joinRoom]);

  return {
    isConnected,
    triggerVibration,
    showToast,
  };
}
