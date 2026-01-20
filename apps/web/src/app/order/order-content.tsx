"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { menuApi, ApiError } from "@/lib/api";
import type { Menu } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function OrderPageContent() {
  const searchParams = useSearchParams();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">주문하기</h1>
        <p className="text-muted-foreground">
          매장 ID: {storeId} | 테이블 ID: {tableId}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          메뉴 {menus.length}개
        </p>
      </div>

      {menus.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">등록된 메뉴가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menus.map((menu) => (
            <Card key={menu.id}>
              <CardHeader>
                <CardTitle>{menu.name}</CardTitle>
                <CardDescription>
                  {menu.price.toLocaleString()}원
                </CardDescription>
              </CardHeader>
              <CardContent>
                {menu.isSoldOut && (
                  <span className="text-xs text-destructive font-semibold">
                    품절
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}