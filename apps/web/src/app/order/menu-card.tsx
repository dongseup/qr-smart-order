"use client";

import { Card, CardHeader, Badge, CardContent, CardTitle, CardDescription } from "@/components/ui";
import { Menu } from "@qr-smart-order/shared-types";
import Image from "next/image";

interface MenuCardProps {
    menu: Menu;
    onClick?: () => void;
}

export function MenuCard({ menu, onClick }: MenuCardProps) {
    return (
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md active:scale-[0.98] touch-manipulation ${
          menu.isSoldOut ? "opacity-60" : ""
        }`}
        onClick={onClick}
      >
        <CardHeader className="p-0">
          {/* 메뉴 이미지 */}
          <div className="relative w-full h-48 bg-muted rounded-t-lg overflow-hidden">
            {menu.imageUrl ? (
              <Image
                src={menu.imageUrl}
                alt={menu.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <span className="text-4xl">🍽️</span>
              </div>
            )}
            {menu.isSoldOut && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive" className="text-sm">
                  품절
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-lg mb-1">{menu.name}</CardTitle>
          <CardDescription className="text-base font-semibold text-foreground">
            {menu.price.toLocaleString()}원
          </CardDescription>
        </CardContent>
      </Card>
    );
  }