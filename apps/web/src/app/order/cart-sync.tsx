"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";

/**
 * 브라우저 탭 간 장바구니 동기화 컴포넌트
 * StorageEvent를 감지하여 다른 탭의 변경사항을 반영
 */
export function CartSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      // StorageEvent는 다른 탭에서만 발생 (같은 탭에서는 발생하지 않음)
      if (e.key === "cart-storage" && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          // Zustand persist는 { state: { items: [...] }, version: ... } 형태로 저장
          if (newState.state?.items) {
            // 현재 상태와 비교하여 실제로 변경된 경우에만 업데이트
            const currentItems = useCartStore.getState().items;
            const newItems = newState.state.items;
            
            // 배열 비교 (간단한 깊은 비교)
            const isDifferent = 
              currentItems.length !== newItems.length ||
              currentItems.some((item, index) => {
                const newItem = newItems[index];
                return !newItem || 
                       item.menuId !== newItem.menuId || 
                       item.quantity !== newItem.quantity;
              });
            
            if (isDifferent) {
              useCartStore.setState({ items: newItems });
            }
          }
        } catch (error) {
          console.error("장바구니 동기화 실패:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []); // 의존성 배열 비움 - 컴포넌트 마운트 시 한 번만 실행

  return null; // UI 없음
}