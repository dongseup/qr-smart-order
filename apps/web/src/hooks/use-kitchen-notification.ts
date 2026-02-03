"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSocketStore } from "@/stores/socket-store";
import { useToast } from "@/hooks/use-toast";
import { SocketEvent, type OrderWithItems, type OrderStatus } from "@/types";

/**
 * 주방 화면을 위한 실시간 알림 훅
 * Socket.io를 통해 신규 주문 알림을 받고 처리
 */
interface UseKitchenNotificationProps {
  onNewOrder?: (order: OrderWithItems) => void;
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
  onRefreshOrders?: () => void;
  enableSound?: boolean;
  enableToast?: boolean;
  audioRef?: React.MutableRefObject<HTMLAudioElement | null>;
}

export function useKitchenNotification({
  onNewOrder,
  onStatusChange,
  onRefreshOrders,
  enableSound = true,
  enableToast = true,
  audioRef,
}: UseKitchenNotificationProps = {}) {
  const { socket, isConnected } = useSocketStore();
  const { toast } = useToast();

  /**
   * 알림음 재생
   */
  const playNotificationSound = useCallback(() => {
    if (!enableSound || !audioRef?.current) return;

    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.warn("⚠️ Failed to play notification sound:", err);
      });
    } catch (error) {
      console.warn("⚠️ Notification sound error:", error);
    }
  }, [enableSound, audioRef]);

  /**
   * Toast 알림 표시
   */
  const showToast = useCallback(
    (title: string, description: string, variant: "default" | "destructive" = "default") => {
      if (!enableToast) return;

      toast({
        title,
        description,
        variant,
        duration: 5000,
      });
    },
    [enableToast, toast]
  );

  /**
   * 브라우저 알림 표시
   */
  const showBrowserNotification = useCallback(
    (title: string, body: string) => {
      if (
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(title, {
            body,
            icon: "/icon-192x192.png",
            badge: "/icon-192x192.png",
            tag: "new-order",
            requireInteraction: true,
          });
        } catch (error) {
          console.warn("⚠️ Browser notification error:", error);
        }
      }
    },
    []
  );

  /**
   * 신규 주문 알림 처리
   */
  const handleNewOrder = useCallback(
    (data: {
      orderId: string;
      orderNo?: string;
      tableId: string;
      items: any[];
      totalPrice: number;
      createdAt: string;
    }) => {
      console.log("🍔 New order notification:", data);

      // Toast 알림 표시
      showToast(
        "🔔 새 주문 알림",
        data.orderNo
          ? `주문 #${data.orderNo} - ${data.totalPrice.toLocaleString()}원`
          : `새 주문 - ${data.totalPrice.toLocaleString()}원`
      );

      // 알림음 재생
      playNotificationSound();

      // 브라우저 알림
      showBrowserNotification(
        "새 주문이 들어왔습니다!",
        data.orderNo
          ? `주문 #${data.orderNo} - ${data.totalPrice.toLocaleString()}원`
          : `새 주문 - ${data.totalPrice.toLocaleString()}원`
      );

      // 주문 목록 갱신
      if (onRefreshOrders) {
        onRefreshOrders();
      }

      // 콜백 호출
      if (onNewOrder) {
        onNewOrder(data as any);
      }
    },
    [showToast, playNotificationSound, showBrowserNotification, onRefreshOrders, onNewOrder]
  );

  /**
   * 주문 상태 변경 알림 처리
   */
  const handleOrderStatusChanged = useCallback(
    (data: { orderId: string; status: OrderStatus; updatedAt: string }) => {
      console.log("🔄 Order status changed:", data);

      // 주문 목록 갱신
      if (onRefreshOrders) {
        onRefreshOrders();
      }

      // 콜백 호출
      if (onStatusChange) {
        onStatusChange(data.orderId, data.status);
      }
    },
    [onRefreshOrders, onStatusChange]
  );

  /**
   * Socket 이벤트 리스너 등록
   */
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log("🔌 Registering kitchen notification listeners");

    // new_order 이벤트 리스너
    socket.on(SocketEvent.NEW_ORDER, handleNewOrder);

    // order_status_changed 이벤트 리스너
    socket.on(SocketEvent.ORDER_STATUS_CHANGED, handleOrderStatusChanged);

    return () => {
      console.log("🔌 Removing kitchen notification listeners");
      socket.off(SocketEvent.NEW_ORDER, handleNewOrder);
      socket.off(SocketEvent.ORDER_STATUS_CHANGED, handleOrderStatusChanged);
    };
  }, [socket, isConnected, handleNewOrder, handleOrderStatusChanged]);

  /**
   * Socket 연결 초기화
   *
   * 참고: 실제 Socket 연결은 useSocketWithFallback 훅에서 관리됩니다.
   * 이 훅은 연결된 Socket에 이벤트 리스너만 등록합니다.
   */
  // 연결 초기화 로직 제거 - useSocketWithFallback에서 처리

  /**
   * 주방 룸에 참여
   */
  useEffect(() => {
    if (!isConnected || !socket) return;

    console.log("🚪 Joining kitchen room");
    socket.emit("join_room", "kitchen");
  }, [isConnected, socket]);

  return {
    isConnected,
    playNotificationSound,
    showToast,
  };
}
