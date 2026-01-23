"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WifiOff, Wifi } from "lucide-react";

/**
 * 오프라인 상태 표시 컴포넌트
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // 초기 상태 설정
    setIsOnline(navigator.onLine);

    // 온라인/오프라인 이벤트 리스너
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // 온라인으로 돌아오면 3초 후 알림 숨김
      setTimeout(() => {
        setWasOffline(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 온라인 상태면 표시하지 않음
  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <Card
      className={`fixed top-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96 transition-all ${
        isOnline
          ? "border-green-500 bg-green-50 dark:bg-green-950"
          : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-700 dark:text-green-400">
                인터넷 연결이 복구되었습니다
              </CardTitle>
            </>
          ) : (
            <>
              <WifiOff className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-700 dark:text-yellow-400">
                오프라인 상태입니다
              </CardTitle>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription
          className={
            isOnline
              ? "text-green-600 dark:text-green-400"
              : "text-yellow-600 dark:text-yellow-400"
          }
        >
          {isOnline
            ? "인터넷 연결이 복구되었습니다. 이제 정상적으로 사용할 수 있습니다."
            : "인터넷 연결을 확인해주세요. 일부 기능이 제한될 수 있습니다."}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
