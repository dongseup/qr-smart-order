"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function OrderCompletePage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const orderNo = searchParams.get("orderNo");

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <Card className="border-green-500">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">주문이 완료되었습니다!</CardTitle>
          <CardDescription className="text-lg mt-2">
            주문 번호: {orderNo ? `#${orderNo}` : "확인 중..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              주문이 접수되었습니다. 준비되면 알려드리겠습니다.
            </p>
            <p className="text-sm text-muted-foreground">
              주문 ID: {orderId || "없음"}
            </p>
          </div>
          <div className="flex gap-2 pt-4">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">홈으로</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/order?storeId=1&tableId=1">새 주문하기</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
