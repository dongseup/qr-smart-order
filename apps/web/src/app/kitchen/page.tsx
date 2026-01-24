"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import KitchenContent from "./kitchen-content";

function KitchenPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 스켈레톤 */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-7 md:h-9 w-48 mb-2" />
              <Skeleton className="h-4 md:h-5 w-32" />
            </div>
            <Skeleton className="h-5 md:h-6 w-32" />
          </div>
        </div>
      </header>

      {/* 그리드 스켈레톤 */}
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function KitchenPage() {
  return (
    <Suspense fallback={<KitchenPageSkeleton />}>
      <KitchenContent />
    </Suspense>
  );
}
