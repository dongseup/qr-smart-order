"use client";

import { useState } from "react";
import type { OrderWithItems } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { orderApi } from "@/lib/api";
import { getErrorInfo } from "@/lib/error-handler";
import { Loader2 } from "lucide-react";

interface OrderCardProps {
  order: OrderWithItems;
  onStatusChanged?: () => void;
}

/**
 * 주문 카드 컴포넌트
 * 주방용 주문 관리 카드
 */
export function OrderCard({ order, onStatusChanged }: OrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // 경과 시간 계산
  const getElapsedTime = (createdAt: string): string => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "방금";
    if (diffMins < 60) return `${diffMins}분`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}시간`;
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

  // 주문 상태 변경 핸들러
  const handleStatusChange = async () => {
    const nextAction = getNextAction(order.status);
    if (!nextAction) return;

    try {
      setIsUpdating(true);
      setError(null);
      await orderApi.updateStatus(order.id, nextAction.nextStatus);

      // 상태 변경 성공 시 부모 컴포넌트에 알림
      if (onStatusChanged) {
        onStatusChanged();
      }
    } catch (err) {
      const errorInfo = getErrorInfo(err);
      setError(errorInfo.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg md:text-xl font-bold">
            주문 #{order.orderNo}
          </CardTitle>
          <Badge className={getStatusColor(order.status)}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>
        <CardDescription className="text-xs md:text-sm">
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

        {/* 상태 변경 버튼 */}
        {getNextAction(order.status) && (
          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={handleStatusChange}
              disabled={isUpdating}
              className="w-full"
              size="lg"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                getNextAction(order.status)?.buttonText
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
