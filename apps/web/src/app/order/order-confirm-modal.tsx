"use client";

import { useCartStore } from "@/stores/cart-store";
import type { CartItem } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface OrderConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function OrderConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: OrderConfirmModalProps) {
  const items = useCartStore((state) => state.items);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const getTotalCount = useCartStore((state) => state.getTotalCount);

  const totalPrice = getTotalPrice();
  const totalCount = getTotalCount();

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      // 에러는 상위 컴포넌트에서 처리
      console.error("주문 확인 중 오류:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>주문 확인</DialogTitle>
          <DialogDescription>
            주문하시겠습니까? 주문 후에는 변경할 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 주문 항목 목록 */}
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {items.map((item: CartItem) => (
              <div
                key={item.menuId}
                className="flex items-center justify-between p-2 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.price.toLocaleString()}원 × {item.quantity}개
                  </p>
                </div>
                <p className="font-semibold">
                  {(item.price * item.quantity).toLocaleString()}원
                </p>
              </div>
            ))}
          </div>

          {/* 총액 */}
          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-lg font-semibold">총액</span>
            <span className="text-2xl font-bold">
              {totalPrice.toLocaleString()}원
            </span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            총 {totalCount}개 아이템
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto h-12 touch-manipulation"
          >
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading} className="w-full sm:w-auto h-12 touch-manipulation">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                주문 중...
              </>
            ) : (
              "주문하기"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
