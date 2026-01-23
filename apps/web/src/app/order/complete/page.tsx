"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { orderApi, ApiError } from "@/lib/api";
import type { OrderWithItems, OrderStatus } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, Clock, ChefHat, Package, Loader2 } from "lucide-react";

// 주문 상태 한글 변환
const getStatusLabel = (status: OrderStatus): string => {
  switch (status) {
    case "PENDING":
      return "주문 접수";
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

// 주문 상태 아이콘
const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case "PENDING":
      return <Clock className="h-5 w-5" />;
    case "COOKING":
      return <ChefHat className="h-5 w-5" />;
    case "READY":
      return <Package className="h-5 w-5" />;
    case "COMPLETED":
      return <CheckCircle2 className="h-5 w-5" />;
    default:
      return <Clock className="h-5 w-5" />;
  }
};

// 주문 상태 색상
const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case "PENDING":
      return "text-yellow-600";
    case "COOKING":
      return "text-blue-600";
    case "READY":
      return "text-green-600";
    case "COMPLETED":
      return "text-gray-600";
    default:
      return "text-gray-600";
  }
};

// 예상 준비 시간 계산 (분 단위)
const getEstimatedTime = (status: OrderStatus): number => {
  switch (status) {
    case "PENDING":
      return 15; // 대기 중: 15분
    case "COOKING":
      return 10; // 조리 중: 10분
    case "READY":
      return 0; // 준비 완료: 0분
    case "COMPLETED":
      return 0; // 완료: 0분
    default:
      return 15;
  }
};

export default function OrderCompletePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const storeId = searchParams.get("storeId");
  const tableId = searchParams.get("tableId");

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 주문 정보 조회
  useEffect(() => {
    if (!orderId) {
      setError("주문 ID가 필요합니다.");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await orderApi.getById(orderId);
        setOrder(response.data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message || "주문 정보를 불러오는데 실패했습니다.");
        } else {
          setError("알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // 주문 상태 폴링 (5초마다 확인)
  useEffect(() => {
    if (!orderId || !order) return;

    // READY 또는 COMPLETED 상태면 폴링 중지
    if (order.status === "READY" || order.status === "COMPLETED") {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await orderApi.getById(orderId);
        setOrder(response.data);

        // READY 또는 COMPLETED 상태가 되면 폴링 중지
        if (
          response.data.status === "READY" ||
          response.data.status === "COMPLETED"
        ) {
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error("주문 상태 확인 중 오류:", err);
        // 에러가 발생해도 폴링은 계속 (네트워크 오류 등)
      }
    }, 5000); // 5초마다 확인

    return () => clearInterval(pollInterval);
  }, [orderId, order?.status]);

  // 새 주문하기 링크 생성
  const getNewOrderLink = () => {
    if (storeId && tableId) {
      return `/order?storeId=${storeId}&tableId=${tableId}`;
    }
    return "/order?storeId=1&tableId=1"; // 기본값
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-2xl">
        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-3 text-muted-foreground">주문 정보를 불러오는 중...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-2xl">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">오류 발생</CardTitle>
            <CardDescription>{error || "주문 정보를 찾을 수 없습니다."}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">홈으로</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href={getNewOrderLink()}>새 주문하기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusLabel = getStatusLabel(order.status);
  const statusIcon = getStatusIcon(order.status);
  const statusColor = getStatusColor(order.status);
  const estimatedTime = getEstimatedTime(order.status);

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <Card className="border-green-500">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">주문이 완료되었습니다!</CardTitle>
          <CardDescription className="text-lg mt-2">
            주문 번호: #{order.orderNo}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 주문 상태 */}
          <div className="flex items-center justify-center gap-3 p-4 bg-muted rounded-lg">
            <div className={statusColor}>{statusIcon}</div>
            <div>
              <p className="font-semibold text-lg">{statusLabel}</p>
              {estimatedTime > 0 && (
                <p className="text-sm text-muted-foreground">
                  예상 준비 시간: 약 {estimatedTime}분
                </p>
              )}
              {order.status === "READY" && (
                <p className="text-sm text-green-600 font-medium">
                  음식이 준비되었습니다!
                </p>
              )}
            </div>
          </div>

          {/* 주문 상세 정보 */}
          {order.items && order.items.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">주문 내역</h3>
              <div className="space-y-2 border rounded-lg p-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.menu?.name || `메뉴 ID: ${item.menuId}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.price.toLocaleString()}원 × {item.quantity}개
                      </p>
                    </div>
                    <p className="font-semibold">
                      {(item.price * item.quantity).toLocaleString()}원
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-lg font-semibold">총액</span>
                <span className="text-2xl font-bold">
                  {order.totalPrice.toLocaleString()}원
                </span>
              </div>
            </div>
          )}

          {/* 주문 시간 */}
          <div className="text-center text-sm text-muted-foreground">
            <p>주문 시간: {new Date(order.createdAt).toLocaleString("ko-KR")}</p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-4">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">홈으로</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href={getNewOrderLink()}>새 주문하기</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
