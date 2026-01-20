"use client";

import { Card, CardHeader, CardContent, Skeleton } from "@/components/ui";
import { Suspense } from "react";
import OrderPageContent from "./order-content";

function OrderPageSkeleton() {
    return (
      <div className="container mx-auto py-10 px-4 max-w-6xl">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-6 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
}

// 예시: http://localhost:3000/order?storeId=1&tableId=5
export default function OrderPage() {
 return (
    <Suspense fallback={<OrderPageSkeleton />}>
      <OrderPageContent />
    </Suspense>
 )
}