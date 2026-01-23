"use client";

import { useState } from "react";
import { useCartStore } from "@/stores/cart-store";
import type { CartItem } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X, Trash2 } from "lucide-react";
import Image from "next/image";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrder: () => void;
}

export function CartDrawer({ open, onOpenChange, onOrder }: CartDrawerProps) {
  const items = useCartStore((state) => state.items);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const getTotalCount = useCartStore((state) => state.getTotalCount);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clear = useCartStore((state) => state.clear);

  const totalPrice = getTotalPrice();
  const totalCount = getTotalCount();

  const handleOrder = () => {
    if (totalCount > 0) {
      onOrder();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!fixed !bottom-0 !left-0 !right-0 !top-auto !translate-x-0 !translate-y-0 !max-w-full max-h-[85vh] rounded-t-lg rounded-b-none border-t p-0 data-[state=open]:!slide-in-from-bottom data-[state=closed]:!slide-out-to-bottom data-[state=open]:!animate-in data-[state=closed]:!animate-out sm:max-w-lg sm:!left-1/2 sm:!right-auto sm:!-translate-x-1/2 [&>button.absolute]:hidden">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              장바구니 ({totalCount}개)
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-11 w-11 touch-manipulation" // 44px 이상, 터치 최적화
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-2">장바구니가 비어있습니다</p>
              <p className="text-sm text-muted-foreground">
                메뉴를 선택하여 장바구니에 추가하세요
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item: CartItem) => (
                <div
                  key={item.menuId}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  {/* 메뉴 이미지 */}
                  <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        이미지 없음
                      </div>
                    )}
                  </div>

                  {/* 메뉴 정보 및 수량 조절 */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.price.toLocaleString()}원
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 touch-manipulation" // 44px 이상, 터치 최적화
                        onClick={() => updateQuantity(item.menuId, item.quantity - 1)}
                      >
                        <Minus className="h-5 w-5" />
                      </Button>
                      <span className="w-10 text-center font-medium text-base">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 touch-manipulation" // 44px 이상, 터치 최적화
                        onClick={() => updateQuantity(item.menuId, item.quantity + 1)}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* 가격 및 삭제 */}
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-semibold">
                      {(item.price * item.quantity).toLocaleString()}원
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-destructive touch-manipulation" // 44px 이상, 터치 최적화
                      onClick={() => removeItem(item.menuId)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 고정: 총액 및 주문하기 버튼 */}
        {items.length > 0 && (
          <div className="border-t bg-background px-4 py-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">총액</span>
              <span className="text-2xl font-bold">
                {totalPrice.toLocaleString()}원
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clear}
                className="flex-1 h-12 touch-manipulation" // 최소 48px 높이, 터치 최적화
              >
                비우기
              </Button>
              <Button
                onClick={handleOrder}
                className="flex-1 h-12 touch-manipulation" // 최소 48px 높이, 터치 최적화
                size="lg"
              >
                주문하기
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}