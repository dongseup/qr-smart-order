"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

/**
 * 주방용 태블릿 화면
 * 가로 모드 최적화 레이아웃 (10-13인치 태블릿)
 * 
 * 레이아웃 특징:
 * - 가로 모드 최적화 (landscape orientation)
 * - 3-4열 그리드 레이아웃 (태블릿 크기에 따라 조정)
 * - 큰 터치 영역 (장갑 착용 가능)
 * - 화면 회전 시 안정적인 레이아웃
 */
export default function KitchenContent() {
  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 영역 - 고정 헤더 */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
                주방 현황판
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                실시간 주문 관리
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <Clock className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">준비 중인 주문:</span>
              <span className="font-semibold text-foreground">0개</span>
            </div>
          </div>
        </div>
      </header>

      {/* 주문 카드 그리드 영역 */}
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {/* 
          그리드 시스템:
          - 모바일 (세로): 1열
          - 작은 태블릿 (768px~): 2열
          - 중간 태블릿 (1024px~): 3열 (가로 모드 최적화)
          - 큰 태블릿/데스크톱 (1280px~): 4열
          - 카드 간격: 모바일 16px, 태블릿 24px
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 auto-rows-fr">
          {/* 빈 상태 (주문이 없을 때) */}
          <div className="col-span-full flex flex-col items-center justify-center py-12 md:py-20">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center text-lg md:text-xl">
                  주문이 없습니다
                </CardTitle>
                <CardDescription className="text-center text-sm md:text-base">
                  새로운 주문이 들어오면 여기에 표시됩니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-xs md:text-sm text-muted-foreground">
                  <p>주문 카드는 그리드 레이아웃으로 표시됩니다.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 주문 카드 그리드 (추후 Task 7.2, 7.3에서 구현)
          주문 카드들이 여기에 표시됩니다:
          - 주문번호, 메뉴 리스트, 수량, 경과시간
          - '호출' 버튼 (60x60px 이상)
          - '수령 확인' 버튼
          */}
        </div>
      </main>
    </div>
  );
}
