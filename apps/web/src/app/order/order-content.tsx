"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { menuApi, ApiError } from "@/lib/api";
import type { Menu } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MenuList } from "./menu-list";
import { CartDebug } from "./cart.debug";
import { CartSync } from "./cart-sync";
import { CartSummaryBar } from "./cart-summary-bar";
import { CartDrawer } from "./cart-drawer";



export default function OrderPageContent() {
  const searchParams = useSearchParams();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);


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

   // 주문하기 핸들러 (추후 Task 6.9에서 구현)
   const handleOrder = () => {
    // TODO: 주문 API 호출 (Task 6.9에서 구현)
    console.log("주문하기 클릭");
    setIsDrawerOpen(false);
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
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <CartSync /> {/* 탭 간 동기화 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">주문하기</h1>
        <p className="text-muted-foreground">
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
    </div>
  );
}