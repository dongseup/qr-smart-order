"use client";

import { useState, useMemo } from "react";
import type { Menu } from "@/types";
import { MenuCard } from "./menu-card";
import { MenuDetailModal } from "./menu-detail-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/stores/cart-store";

interface MenuListProps {
  menus: Menu[];
}

export function MenuList({ menus }: MenuListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSoldOut, setShowSoldOut] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  // 검색 및 필터링 로직
  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      const matchesSearch = menu.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesSoldOut = showSoldOut || !menu.isSoldOut;
      return matchesSearch && matchesSoldOut;
    });
  }, [menus, searchQuery, showSoldOut]);

  const handleMenuClick = (menu: Menu) => {
    setSelectedMenu(menu);
    setIsModalOpen(true);
  };

  const handleAddToCart = (menu: Menu, quantity: number) => {
    addItem(
      {
        menuId: menu.id,
        name: menu.name,
        price: menu.price,
        imageUrl: menu.imageUrl,
      },
      quantity
    );
  };

  return (
    <>
      <div className="space-y-4">
        {/* 검색 및 필터 UI */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="메뉴 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Button
            variant={showSoldOut ? "default" : "outline"}
            onClick={() => setShowSoldOut(!showSoldOut)}
            className="whitespace-nowrap"
          >
            {showSoldOut ? "품절 메뉴 숨기기" : "품절 메뉴 보기"}
          </Button>
        </div>

        {/* 검색 결과 개수 */}
        <div className="text-sm text-muted-foreground">
          {filteredMenus.length > 0 ? (
            <span>
              {filteredMenus.length}개의 메뉴를 찾았습니다
              {searchQuery && ` (검색: "${searchQuery}")`}
            </span>
          ) : (
            <span>검색 결과가 없습니다.</span>
          )}
        </div>

        {/* 메뉴 그리드 */}
        {filteredMenus.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                {searchQuery
                  ? `"${searchQuery}"에 대한 검색 결과가 없습니다.`
                  : "표시할 메뉴가 없습니다."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMenus.map((menu) => (
              <MenuCard
                key={menu.id}
                menu={menu}
                onClick={() => handleMenuClick(menu)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 메뉴 상세 모달 */}
      <MenuDetailModal
        menu={selectedMenu}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onAddToCart={handleAddToCart}
      />
    </>
  );
}