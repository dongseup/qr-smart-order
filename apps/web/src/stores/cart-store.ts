import { CartItem } from "@/types";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface CartStore {
    items: CartItem[];
    addItem: (menu: Omit<CartItem, 'quantity'>, quantity: number) => void;
    removeItem: (menuId: string) => void;
    updateQuantity: (menuId: string, quantity: number) => void;
    getTotalPrice: () => number;
    getTotalCount: () => number;
    clear: () => void;
}

export const useCartStore = create<CartStore>()(
    persist((set, get) => ({
        items: [],

        /**
       * 장바구니에 아이템 추가
       * 이미 있는 메뉴면 수량 증가, 없으면 새로 추가
       */
        addItem: (menu, quantity) => {
            set((state) => {
                const existingItem = state.items.find(item => item.menuId === menu.menuId);

                if (existingItem) {
                    // 이미 있는 메뉴면 수량 증가
                    return {
                        items: state.items.map((item) => item.menuId === menu.menuId ? { ...item, quantity: item.quantity + quantity } : item)
                    }
                } else {
                    // 새 매뉴 추가
                    return {
                        items: [
                            ...state.items,
                            {
                                menuId: menu.menuId,
                                name: menu.name,
                                price: menu.price,
                                quantity,
                                imageUrl: menu.imageUrl
                            }
                        ]
                    }
                }
            })
        },
        /**
       * 장바구니에서 아이템 제거
       */
        removeItem: (menuId) => {
            set((state) => ({
                items: state.items.filter(item => item.menuId !== menuId)
            }));
        },
        /**
         * 아이템 수량 업데이트
         * quantity가 0 이하면 아이템 제거
         */
        updateQuantity: (menuId, quantity) => {
            if (quantity <= 0) {
                return get().removeItem(menuId);
            }
            set((state) => ({
                items: state.items.map(item =>
                    item.menuId === menuId ? { ...item, quantity } : item
                )
            }));
        },
        /**
         * 장바구니 총 가격 계산
         */
        getTotalPrice: () => {
            const items = get().items;
            return items.reduce((total, item) => total + (item.price * item.quantity), 0);
        },

        /**
         * 장바구니 총 개수 계산
         */
        getTotalCount: () => {
            const items = get().items;
            return items.reduce((count, item) => count + item.quantity, 0);
        },

        /**
         * 장바구니 초기화
         */
        clear: () => {
            set({ items: [] });
        }
    }), {
        name: 'cart-storage',
        storage: createJSONStorage(() => localStorage)
    }),
)
