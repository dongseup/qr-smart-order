import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">QR Smart Order</h1>
        <p className="text-center text-gray-600 mb-8">
          QR 코드 기반 스마트 주문 시스템
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/order?storeId=1&tableId=1">
            <Button>주문하기</Button>
          </Link>
          <Link href="/kitchen">
            <Button variant="outline">주방 현황판</Button>
          </Link>
          <Link href="/components">
            <Button variant="ghost">UI 컴포넌트 보기</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
