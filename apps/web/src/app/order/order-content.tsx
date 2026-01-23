"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { menuApi, orderApi, ApiError } from "@/lib/api";
import { useCartStore } from "@/stores/cart-store";
import type { Menu } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MenuList } from "./menu-list";
import { CartDebug } from "./cart.debug";
import { CartSync } from "./cart-sync";
import { CartSummaryBar } from "./cart-summary-bar";
import { CartDrawer } from "./cart-drawer";
import { OrderConfirmModal } from "./order-confirm-modal";



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
        if (err instanceof ApiError) {
          setError(err.message || "메뉴를 불러오는데 실패했습니다.");
        } else {
          setError("알 수 없는 오류가 발생했습니다.");
        }
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
      if (err instanceof ApiError) {
        setOrderError(err.message || "주문 처리 중 오류가 발생했습니다.");
      } else if (err instanceof Error) {
        setOrderError(err.message || "알 수 없는 오류가 발생했습니다.");
      } else {
        setOrderError("주문 처리 중 오류가 발생했습니다.");
      }
      // 모달은 열어둠 (사용자가 재시도할 수 있도록)
    } finally {
      setIsOrdering(false);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">오류 발생</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                올바른 URL 형식: <code>/order?storeId=1&tableId=5</code>
              </p>
              <Link href="/">
                <Button variant="outline">홈으로 돌아가기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return null; // Suspense fallback 사용
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
            <CardTitle className="text-destructive">주문 실패</CardTitle>
            <CardDescription>{orderError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => setOrderError(null)}
              className="w-full"
            >
              확인
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}