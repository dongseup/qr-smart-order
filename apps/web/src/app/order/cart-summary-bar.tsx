"use client";

import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";

interface CartSummaryBarProps {
  onOpen: () => void;
}

export function CartSummaryBar({ onOpen }: CartSummaryBarProps) {
  const items = useCartStore((state) => state.items);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const getTotalCount = useCartStore((state) => state.getTotalCount);

  const totalPrice = getTotalPrice();
  const totalCount = getTotalCount();

  if (totalCount === 0) {
    return null; // 장바구니가 비어있으면 표시하지 않음
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg safe-area-bottom">
      <div className="container mx-auto px-4 py-3 pb-safe">
        <Button
          onClick={onOpen}
          className="w-full h-14 flex items-center justify-between touch-manipulation"
          size="lg"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              {totalCount > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {totalCount}
                </Badge>
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">장바구니</p>
              <p className="text-xs opacity-90">{totalCount}개 아이템</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{totalPrice.toLocaleString()}원</p>
            <p className="text-xs opacity-75">주문하기</p>
          </div>
        </Button>
      </div>
    </div>
  );
}