"use client";

import { useState } from "react";
import type { Menu } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";

interface MenuDetailModalProps {
  menu: Menu | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart?: (menu: Menu, quantity: number) => void;
}

export function MenuDetailModal({
  menu,
  open,
  onOpenChange,
  onAddToCart,
}: MenuDetailModalProps) {
  const [quantity, setQuantity] = useState(1);

  if (!menu) return null;

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(menu, quantity);
      onOpenChange(false);
      setQuantity(1); // 모달 닫을 때 수량 초기화
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  const totalPrice = menu.price * quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{menu.name}</DialogTitle>
          <DialogDescription>
            {menu.price.toLocaleString()}원
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 메뉴 이미지 */}
          <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
            {menu.imageUrl ? (
              <Image
                src={menu.imageUrl}
                alt={menu.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 512px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <span className="text-6xl">🍽️</span>
              </div>
            )}
            {menu.isSoldOut && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive" className="text-base px-4 py-2">
                  품절
                </Badge>
              </div>
            )}
          </div>

          {/* 품절 상태 표시 */}
          {menu.isSoldOut && (
            <div className="text-center">
              <p className="text-destructive font-semibold">
                현재 품절된 메뉴입니다.
              </p>
            </div>
          )}

          {/* 수량 조절 */}
          {!menu.isSoldOut && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">수량</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="h-11 w-11" // 44px 이상
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold text-lg">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    className="h-11 w-11" // 44px 이상
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 총 가격 */}
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-lg font-semibold">총 가격</span>
                <span className="text-2xl font-bold">
                  {totalPrice.toLocaleString()}원
                </span>
              </div>

              {/* 장바구니 담기 버튼 */}
              <Button
                onClick={handleAddToCart}
                className="w-full h-12 text-lg"
                disabled={!onAddToCart}
              >
                장바구니에 추가
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}