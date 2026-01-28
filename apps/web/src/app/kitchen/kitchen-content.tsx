"use client";

import { useEffect, useState, useMemo } from "react";
import { orderApi } from "@/lib/api";
import { getErrorInfo } from "@/lib/error-handler";
import type { Order, OrderStatus } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderCard } from "./order-card";

/**
 * 주방용 태블릿 화면
 * 가로 모드 최적화 레이아웃 (10-13인치 태블릿)
 * 
 * 레이아웃 특징:
 * - 가로 모드 최적화 (landscape orientation)
 * - 3-4열 그리드 레이아웃 (태블릿 크기에 따라 조정)
 * - 큰 터치 영역 (장갑 착용 가능)
 * - 화면 회전 시 안정적인 레이아웃
 */
export default function KitchenContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 주문 목록 조회 (PENDING, COOKING, READY 상태만)
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await orderApi.getAll([
          "PENDING",
          "COOKING",
          "READY",
        ]);
        
        // createdAt 기준 오름차순 정렬 (오래된 주문 우선)
        const sortedOrders = [...response.data].sort((a, b) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        
        setOrders(sortedOrders);
      } catch (err) {
        const errorInfo = getErrorInfo(err);
        setError(errorInfo.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
    
    // 주기적으로 주문 목록 갱신 (5초마다)
    const interval = setInterval(loadOrders, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // 준비 중인 주문 개수 계산
  const pendingCount = useMemo(() => {
    return orders.filter(
      (order) => order.status === "PENDING" || order.status === "COOKING"
    ).length;
  }, [orders]);

  // 재시도 함수
  const handleRetry = () => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await orderApi.getAll([
          "PENDING",
          "COOKING",
          "READY",
        ]);
        
        const sortedOrders = [...response.data].sort((a, b) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        
        setOrders(sortedOrders);
      } catch (err) {
        const errorInfo = getErrorInfo(err);
        setError(errorInfo.message);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 영역 - 고정 헤더 */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                주방 현황판
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                실시간 주문 관리
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <Clock className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">준비 중인 주문:</span>
              <span className="font-semibold text-foreground">{pendingCount}개</span>
            </div>
          </div>
        </div>
      </header>

      {/* 주문 카드 그리드 영역 */}
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {/* 에러 상태 */}
        {error && (
          <div className="mb-6">
            <Card className="border-destructive">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-destructive">오류 발생</CardTitle>
                </div>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleRetry} variant="default" className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  다시 시도
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 로딩 상태 */}
        {loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 주문 카드 그리드 */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-fr kitchen-grid">
            {orders.length === 0 ? (
              // 빈 상태 (주문이 없을 때)
              <div className="col-span-full flex flex-col items-center justify-center py-12 md:py-20">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle className="text-center text-lg md:text-xl">
                      주문이 없습니다
                    </CardTitle>
                    <CardDescription className="text-center text-sm md:text-base">
                      새로운 주문이 들어오면 여기에 표시됩니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-xs md:text-sm text-muted-foreground">
                      <p>주문 카드는 그리드 레이아웃으로 표시됩니다.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              // 주문 카드 목록
              orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
