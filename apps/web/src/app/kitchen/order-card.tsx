"use client";

import { useState, useEffect, memo } from "react";
import type { OrderWithItems } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { orderApi } from "@/lib/api";
import { getErrorInfo } from "@/lib/error-handler";
import { Loader2, WifiOff, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderCardProps {
  order: OrderWithItems;
  onStatusChanged?: () => void;
}

/**
 * 주문 카드 컴포넌트
 * 주방용 주문 관리 카드
 *
 * React.memo로 최적화:
 * - order.id가 변경되지 않으면 리렌더링 생략
 * - onStatusChanged는 useCallback으로 메모이제이션 필요
 */
const OrderCardComponent = ({ order, onStatusChanged }: OrderCardProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const { toast } = useToast();

  // 온라인/오프라인 상태 감지
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 스와이프 제스처 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isUpdating || !isOnline) return;
    setIsSwiping(true);
    const touch = e.touches[0];
    setSwipeX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || isUpdating || !isOnline) return;
    const touch = e.touches[0];
    const currentX = touch.clientX;
    const startX = e.currentTarget.getBoundingClientRect().left;
    const deltaX = currentX - startX;

    // 좌측 스와이프만 허용 (0 ~ -150px)
    if (deltaX < 0 && deltaX > -150) {
      setSwipeX(deltaX);
    }
  };

  const handleTouchEnd = async () => {
    if (!isSwiping) return;
    setIsSwiping(false);

    // 80px 이상 스와이프 시 상태 변경
    if (swipeX < -80) {
      await handleStatusChange();
    }

    // 원위치
    setSwipeX(0);
  };
  // 주문 상태에 따른 색상 (오래된 주문: 빨강, 최근 주문: 초록)
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "COOKING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "READY":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "대기 중";
      case "COOKING":
        return "조리 중";
      case "READY":
        return "준비 완료";
      case "COMPLETED":
        return "완료";
      default:
        return status;
    }
  };

  // 경과 시간 계산 (분 단위)
  const getElapsedMinutes = (createdAt: string): number => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    return Math.floor(diffMs / 60000);
  };

  // 경과 시간 텍스트
  const getElapsedTime = (createdAt: string): string => {
    const diffMins = getElapsedMinutes(createdAt);

    if (diffMins < 1) return "방금";
    if (diffMins < 60) return `${diffMins}분`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}시간`;
  };

  // 경과 시간에 따른 색상 코딩 (오래된 주문: 빨강, 최근 주문: 초록)
  const getTimeBasedColor = (createdAt: string) => {
    const mins = getElapsedMinutes(createdAt);

    if (mins < 5) {
      // 0-5분: 초록 (최근 주문)
      return {
        border: "border-l-4 border-l-green-500",
        text: "text-green-600 dark:text-green-400",
        bg: "bg-green-50 dark:bg-green-950/30"
      };
    } else if (mins < 10) {
      // 5-10분: 노랑 (주의 필요)
      return {
        border: "border-l-4 border-l-yellow-500",
        text: "text-yellow-600 dark:text-yellow-400",
        bg: "bg-yellow-50 dark:bg-yellow-950/30"
      };
    } else if (mins < 15) {
      // 10-15분: 주황 (긴급)
      return {
        border: "border-l-4 border-l-orange-500",
        text: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-50 dark:bg-orange-950/30"
      };
    } else {
      // 15분 이상: 빨강 (매우 긴급)
      return {
        border: "border-l-4 border-l-red-500",
        text: "text-red-600 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-950/30"
      };
    }
  };

  // 다음 상태 및 버튼 텍스트 가져오기
  const getNextAction = (status: string) => {
    switch (status) {
      case "PENDING":
        return { nextStatus: "COOKING", buttonText: "조리 시작" };
      case "COOKING":
        return { nextStatus: "READY", buttonText: "조리 완료" };
      case "READY":
        return { nextStatus: "COMPLETED", buttonText: "픽업 완료" };
      default:
        return null;
    }
  };

  // 자동 재시도 로직 (지수 백오프)
  const retryWithBackoff = async (
    fn: () => Promise<void>,
    maxRetries = 3,
    delay = 1000
  ): Promise<void> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await fn();
        return; // 성공 시 즉시 반환
      } catch (err) {
        lastError = err as Error;

        // 네트워크 에러가 아니면 재시도하지 않음
        const errorInfo = getErrorInfo(err);
        if (!errorInfo.message.includes("네트워크")) {
          throw err;
        }

        // 마지막 시도가 아니면 대기 후 재시도
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay * (attempt + 1)));
        }
      }
    }

    // 모든 재시도 실패
    throw lastError;
  };

  // 주문 상태 변경 핸들러 (Optimistic Update + 롤백)
  const handleStatusChange = async () => {
    const nextAction = getNextAction(order.status);
    if (!nextAction) return;

    // 오프라인 체크
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "오프라인 상태",
        description: "네트워크 연결을 확인해주세요.",
      });
      return;
    }

    const previousStatus = order.status; // 롤백용 이전 상태 저장

    try {
      setIsUpdating(true);
      setError(null);

      // Optimistic Update: 즉시 UI 업데이트
      // (실제로는 부모 컴포넌트에서 관리하므로 API 호출 후 갱신)

      // API 호출 (자동 재시도 포함)
      await retryWithBackoff(async () => {
        await orderApi.updateStatus(order.id, nextAction.nextStatus);
      });

      // 성공 토스트
      toast({
        title: "상태 변경 완료",
        description: `주문 상태가 "${nextAction.buttonText}"로 변경되었습니다.`,
      });

      // 상태 변경 성공 시 부모 컴포넌트에 알림
      if (onStatusChanged) {
        onStatusChanged();
      }
    } catch (err) {
      const errorInfo = getErrorInfo(err);
      setError(errorInfo.message);

      // 실패 토스트
      toast({
        variant: "destructive",
        title: "상태 변경 실패",
        description: errorInfo.message,
      });

      // 롤백: 부모 컴포넌트에서 다시 목록을 가져오므로 자동으로 이전 상태로 복구됨
      if (onStatusChanged) {
        onStatusChanged(); // 목록 새로고침으로 롤백
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const timeColor = getTimeBasedColor(order.createdAt);

  return (
    <div className="relative">
      {/* 스와이프 힌트 (배경) */}
      {isSwiping && swipeX < -10 && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-center bg-green-500 text-white px-6 rounded-r-lg"
          style={{
            width: `${Math.abs(swipeX)}px`,
            opacity: Math.min(Math.abs(swipeX) / 80, 1),
          }}
        >
          <ChevronRight className="h-8 w-8" />
        </div>
      )}

      <Card
        className={`h-full flex flex-col hover:shadow-md transition-all select-none touch-pan-y relative ${timeColor.border} ${timeColor.bg} ${isSwiping ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg md:text-xl font-bold">
            주문 #{order.orderNo}
          </CardTitle>
          <Badge className={getStatusColor(order.status)}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>
        <CardDescription className={`text-xs md:text-sm font-semibold ${timeColor.text}`}>
          {getElapsedTime(order.createdAt)} 전
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">총액</p>
            <p className="text-base md:text-lg font-bold">
              {order.totalPrice.toLocaleString()}원
            </p>
          </div>
          
          {/* 주문 항목 목록 (items가 있는 경우) */}
          {order.items && order.items.length > 0 && (
            <div className="space-y-1 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                주문 내역:
              </p>
              <div className="space-y-1">
                {order.items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="text-xs text-muted-foreground flex justify-between"
                  >
                    <span>
                      {item.menu?.name || `메뉴 ID: ${item.menuId}`}
                    </span>
                    <span className="font-medium">×{item.quantity}</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    외 {order.items.length - 3}개
                  </p>
                )}
              </div>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground pt-2 border-t">
            주문 시간: {new Date(order.createdAt).toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* 오프라인 경고 */}
        {!isOnline && (
          <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-md flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <p className="text-xs text-orange-600 dark:text-orange-400">
              오프라인 상태입니다
            </p>
          </div>
        )}

        {/* 상태 변경 버튼 */}
        {getNextAction(order.status) && (
          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={handleStatusChange}
              disabled={isUpdating || !isOnline}
              className="w-full"
              size="xl"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : !isOnline ? (
                <>
                  <WifiOff className="mr-2 h-4 w-4" />
                  오프라인
                </>
              ) : (
                getNextAction(order.status)?.buttonText
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
};

// React.memo로 최적화: order.id가 같으면 리렌더링 생략
export const OrderCard = memo(OrderCardComponent, (prevProps, nextProps) => {
  // order의 id, status, updatedAt이 같으면 리렌더링 생략
  return (
    prevProps.order.id === nextProps.order.id &&
    prevProps.order.status === nextProps.order.status &&
    prevProps.order.createdAt === nextProps.order.createdAt
  );
});
