"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { menuApi, orderApi } from "@/lib/api";
import { getErrorInfo } from "@/lib/error-handler";
import { useCartStore } from "@/stores/cart-store";
import type { Menu } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { MenuList } from "./menu-list";
import { CartDebug } from "./cart.debug";
import { CartSync } from "./cart-sync";
import { CartSummaryBar } from "./cart-summary-bar";
import { CartDrawer } from "./cart-drawer";
import { OrderConfirmModal } from "./order-confirm-modal";
import { AlertCircle, RefreshCw } from "lucide-react";



export default function OrderPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);

  const storeId = searchParams.get("storeId");
  const tableId = searchParams.get("tableId");

  useEffect(() => {
    if (!storeId || !tableId) {
      setError("매장 ID와 테이블 ID가 필요합니다.");
      setLoading(false);
      return;
    }

    const loadMenus = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await menuApi.getAll(false);
        setMenus(response.data);
      } catch (err) {
        const errorInfo = getErrorInfo(err);
        setError(errorInfo.message);
      } finally {
        setLoading(false);
      }
    };

    loadMenus();
  }, [storeId, tableId]);

  // 주문하기 핸들러
  const handleOrder = () => {
    if (items.length === 0) {
      return;
    }
    setOrderError(null);
    setIsDrawerOpen(false);
    setIsConfirmModalOpen(true);
  };

  // 주문 확인 및 API 호출
  const handleConfirmOrder = async () => {
    if (items.length === 0) {
      setOrderError("장바구니가 비어있습니다.");
      return;
    }

    try {
      setIsOrdering(true);
      setOrderError(null);

      // 장바구니 아이템을 API 형식으로 변환
      const orderItems = items.map((item) => ({
        menuId: item.menuId,
        quantity: item.quantity,
      }));

      // 주문 API 호출
      const response = await orderApi.create(orderItems);

      // 주문 성공
      // 장바구니 초기화
      clear();

      // 주문 완료 페이지로 리다이렉트 (주문 ID, storeId, tableId 전달)
      router.push(
        `/order/complete?orderId=${response.data.id}&orderNo=${response.data.orderNo}&storeId=${storeId}&tableId=${tableId}`
      );
    } catch (err) {
      // 에러 처리
      const errorInfo = getErrorInfo(err);
      setOrderError(errorInfo.message);
      // 모달은 열어둠 (사용자가 재시도할 수 있도록)
    } finally {
      setIsOrdering(false);
    }
  };

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="container mx-auto py-4 sm:py-6 md:py-10 px-4 sm:px-6 max-w-7xl pb-24 sm:pb-10">
        <div className="mb-4 sm:mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="p-0">
                <Skeleton className="h-48 w-full rounded-t-lg" />
              </CardHeader>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
    const handleRetry = () => {
      setError(null);
      setLoading(true);
      // 메뉴 다시 로드
      const loadMenus = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await menuApi.getAll(false);
          setMenus(response.data);
        } catch (err) {
          const errorInfo = getErrorInfo(err);
          setError(errorInfo.message);
        } finally {
          setLoading(false);
        }
      };
      loadMenus();
    };

    return (
      <div className="container mx-auto py-4 sm:py-6 md:py-10 px-4 sm:px-6 max-w-4xl">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">오류 발생</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                올바른 URL 형식: <code>/order?storeId=1&tableId=5</code>
              </p>
              <div className="flex gap-2">
                <Button onClick={handleRetry} variant="default" className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  다시 시도
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/">홈으로 돌아가기</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-6 md:py-10 px-4 sm:px-6 max-w-7xl pb-24 sm:pb-10">
      <CartSync /> {/* 탭 간 동기화 */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">주문하기</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          매장 ID: {storeId} | 테이블 ID: {tableId}
        </p>
      </div>

      <MenuList menus={menus} />
      {/* <CartDebug /> */}
      <CartSummaryBar onOpen={() => setIsDrawerOpen(true)} />
      <CartDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onOrder={handleOrder}
      />
      <OrderConfirmModal
        open={isConfirmModalOpen}
        onOpenChange={setIsConfirmModalOpen}
        onConfirm={handleConfirmOrder}
        isLoading={isOrdering}
      />
      {/* 주문 에러 표시 */}
      {orderError && (
        <Card className="fixed bottom-4 left-4 right-4 z-50 border-destructive sm:left-auto sm:right-4 sm:w-96">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">주문 실패</CardTitle>
            </div>
            <CardDescription>{orderError}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOrderError(null)}
                className="flex-1"
              >
                확인
              </Button>
              {getErrorInfo(new Error(orderError)).canRetry && (
                <Button
                  onClick={handleConfirmOrder}
                  disabled={isOrdering}
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  재시도
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}