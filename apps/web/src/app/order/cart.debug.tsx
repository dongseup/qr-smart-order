"use client";

import { useCartStore } from "@/stores/cart-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * 개발용 장바구니 디버그 컴포넌트
 * Task 6.8에서 Drawer로 대체될 예정
 */
export function CartDebug() {
  const items = useCartStore((state) => state.items);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const getTotalCount = useCartStore((state) => state.getTotalCount);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clear = useCartStore((state) => state.clear);

  return (
    <Card className="fixed bottom-4 right-4 w-80 max-h-96 overflow-y-auto z-50">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">장바구니 (개발용)</CardTitle>
          <Badge variant="secondary">{getTotalCount()}개</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            장바구니가 비어있습니다.
          </p>
        ) : (
          <>
            {items.map((item) => (
              <div
                key={item.menuId}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.price.toLocaleString()}원 × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.menuId, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(item.menuId, item.quantity + 1)}
                  >
                    +
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeItem(item.menuId)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">총액</span>
                <span className="text-lg font-bold">
                  {getTotalPrice().toLocaleString()}원
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={clear}
              >
                장바구니 비우기
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}