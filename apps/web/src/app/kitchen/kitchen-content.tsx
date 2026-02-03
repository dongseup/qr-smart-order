"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { orderApi } from "@/lib/api";
import { getErrorInfo } from "@/lib/error-handler";
import type { OrderWithItems } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderCard } from "./order-card";
import { Toaster } from "@/components/ui/toaster";
import { NotificationSettings } from "./notification-settings";
import { useNotificationSettings } from "@/hooks/use-notification-settings";
import { useToast } from "@/hooks/use-toast";
import { useKitchenNotification } from "@/hooks/use-kitchen-notification";

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
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNewOrder, setHasNewOrder] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastAlertTimeRef = useRef<Map<string, number>>(new Map());
  const isInitialLoadRef = useRef(true);

  const { settings } = useNotificationSettings();
  const { toast } = useToast();

  // 실시간 알림 연결
  const { isConnected } = useKitchenNotification({
    onNewOrder: (order) => {
      console.log("📱 New order via socket:", order);
      // Socket으로 신규 주문이 오면 즉시 목록 갱신
      loadOrders();
    },
    onStatusChange: (orderId, status) => {
      console.log("📱 Status changed via socket:", orderId, status);
      // Socket으로 상태 변경이 오면 즉시 목록 갱신
      loadOrders();
    },
    onRefreshOrders: loadOrders,
    enableSound: settings.soundEnabled,
    enableToast: true,
    audioRef,
  });

  // Page Visibility API: 백그라운드에서 폴링 간격 조정
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 알림음 초기화
  useEffect(() => {
    // 알림음 파일 경로 (public/sounds/notification.mp3에 파일 추가 필요)
    audioRef.current = new Audio("/sounds/notification.mp3");
    audioRef.current.volume = settings.volume;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 볼륨 변경 시 업데이트
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.volume;
    }
  }, [settings.volume]);

  // 알림음 재생
  const playNotificationSound = useCallback(() => {
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.error("Failed to play notification sound:", err);
      });
    }
  }, [settings.soundEnabled]);

  // 브라우저 알림 표시
  const showBrowserNotification = useCallback(
    (title: string, body: string) => {
      if (
        settings.browserNotificationEnabled &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(title, {
          body,
          icon: "/icon-192x192.png", // PWA 아이콘 경로
          badge: "/icon-192x192.png",
          tag: "new-order",
          requireInteraction: true,
        });
      }
    },
    [settings.browserNotificationEnabled]
  );

  // 새 주문 감지 및 알림
  const checkNewOrders = useCallback(
    (newOrders: OrderWithItems[]) => {
      const currentOrderIds = new Set(newOrders.map((o) => o.id));
      const newOrdersList: OrderWithItems[] = [];

      // 이전에 없던 주문 찾기
      newOrders.forEach((order) => {
        if (!previousOrderIdsRef.current.has(order.id)) {
          newOrdersList.push(order);
        }
      });

      // 새 주문이 있으면 알림
      if (newOrdersList.length > 0) {
        setHasNewOrder(true);
        playNotificationSound();

        // 브라우저 알림
        if (newOrdersList.length === 1) {
          showBrowserNotification(
            "새 주문이 들어왔습니다!",
            `주문 #${newOrdersList[0].orderNo} - ${newOrdersList[0].totalPrice.toLocaleString()}원`
          );
        } else {
          showBrowserNotification(
            "새 주문이 들어왔습니다!",
            `${newOrdersList.length}개의 새 주문`
          );
        }

        // Toast 알림
        toast({
          title: "🔔 새 주문 알림",
          description:
            newOrdersList.length === 1
              ? `주문 #${newOrdersList[0].orderNo}`
              : `${newOrdersList.length}개의 새 주문이 들어왔습니다.`,
        });

        // 3초 후 깜빡임 효과 제거
        setTimeout(() => setHasNewOrder(false), 3000);
      }

      // 현재 주문 ID 저장
      previousOrderIdsRef.current = currentOrderIds;
    },
    [playNotificationSound, showBrowserNotification, toast]
  );

  // 장시간 미처리 주문 반복 알림
  const checkStaleOrders = useCallback(
    (orders: OrderWithItems[]) => {
      const now = Date.now();
      const alertThreshold = settings.repeatAlertMinutes * 60 * 1000;

      orders.forEach((order) => {
        if (order.status === "PENDING" || order.status === "COOKING") {
          const orderTime = new Date(order.createdAt).getTime();
          const elapsed = now - orderTime;
          const lastAlertTime = lastAlertTimeRef.current.get(order.id) || 0;

          // 설정 시간 이상 경과 & 마지막 알림 후 5분 경과
          if (elapsed >= alertThreshold && now - lastAlertTime >= 5 * 60 * 1000) {
            playNotificationSound();
            toast({
              variant: "destructive",
              title: "⚠️ 미처리 주문 알림",
              description: `주문 #${order.orderNo}가 ${Math.floor(elapsed / 60000)}분째 대기 중입니다.`,
            });

            lastAlertTimeRef.current.set(order.id, now);
          }
        }
      });
    },
    [settings.repeatAlertMinutes, playNotificationSound, toast]
  );

  // 주문 목록 조회 (PENDING, COOKING, READY 상태만)
  const loadOrders = useCallback(async () => {
    try {
      if (isInitialLoadRef.current) {
        setLoading(true);
      }
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

      // 동일한 데이터인지 확인 (불필요한 setState 방지)
      const orderIds = sortedOrders.map((o) => o.id).join(",");
      const currentOrderIds = orders.map((o) => o.id).join(",");

      if (orderIds !== currentOrderIds) {
        setOrders(sortedOrders as OrderWithItems[]);
      }

      // 새 주문 감지 (첫 로딩 제외)
      if (!isInitialLoadRef.current) {
        checkNewOrders(sortedOrders as OrderWithItems[]);
      }

      // 장시간 미처리 주문 체크
      checkStaleOrders(sortedOrders as OrderWithItems[]);

      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
    } catch (err) {
      const errorInfo = getErrorInfo(err);
      setError(errorInfo.message);
    } finally {
      if (isInitialLoadRef.current) {
        setLoading(false);
      }
    }
  }, [orders, checkNewOrders, checkStaleOrders]);

  useEffect(() => {
    loadOrders();

    // 주기적으로 주문 목록 갱신
    // Socket 연결 시: 포그라운드 10초, 백그라운드 60초
    // Socket 미연결 시: 포그라운드 5초, 백그라운드 30초 (더 자주 확인)
    let pollInterval: number;
    if (isConnected) {
      pollInterval = isPageVisible ? 10000 : 60000;
    } else {
      pollInterval = isPageVisible ? 5000 : 30000;
    }

    const interval = setInterval(loadOrders, pollInterval);

    return () => clearInterval(interval);
  }, [loadOrders, isPageVisible, isConnected]);

  // 준비 중인 주문 개수 계산
  const pendingCount = useMemo(() => {
    return orders.filter(
      (order) => order.status === "PENDING" || order.status === "COOKING"
    ).length;
  }, [orders]);

  // 재시도 함수
  const handleRetry = () => {
    loadOrders();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 영역 - 고정 헤더 */}
      <header
        className={`sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm transition-all ${
          hasNewOrder ? "animate-pulse bg-green-100 dark:bg-green-950" : ""
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                주방 현황판
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                실시간 주문 관리
              </p>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              {/* Socket 연결 상태 */}
              <div className="flex items-center gap-1 text-xs">
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span className="hidden md:inline text-green-600">실시간</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-gray-400" />
                    <span className="hidden md:inline text-gray-500">폴링</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <Clock className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">준비 중인 주문:</span>
                <span className="font-semibold text-foreground">{pendingCount}개</span>
              </div>
              {/* 알림 설정 버튼 */}
              <NotificationSettings />
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
                <OrderCard key={order.id} order={order} onStatusChanged={loadOrders} />
              ))
            )}
          </div>
        )}
      </main>
      <Toaster />
    </div>
  );
}
