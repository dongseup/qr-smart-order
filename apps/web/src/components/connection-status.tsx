"use client";

import { useEffect, useState } from "react";
import { useSocketStore, SocketStatus } from "@/stores/socket-store";
import { Wifi, WifiOff, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Socket 연결 상태 표시 컴포넌트
 */
interface ConnectionStatusProps {
  showLabel?: boolean;
  className?: string;
  variant?: "default" | "compact";
}

export function ConnectionStatus({
  showLabel = true,
  className,
  variant = "default",
}: ConnectionStatusProps) {
  const { connectionStatus, reconnectAttempts, maxReconnectAttempts, lastError } =
    useSocketStore();

  const [showError, setShowError] = useState(false);

  // 에러 메시지 자동 숨김
  useEffect(() => {
    if (lastError) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastError]);

  // 연결 상태에 따른 스타일 및 아이콘
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case SocketStatus.CONNECTED:
        return {
          icon: Wifi,
          text: "실시간 연결",
          color: "text-green-500",
          bgColor: "bg-green-50 dark:bg-green-950",
          pulse: false,
        };
      case SocketStatus.CONNECTING:
        return {
          icon: Loader2,
          text: "연결 중...",
          color: "text-blue-500",
          bgColor: "bg-blue-50 dark:bg-blue-950",
          pulse: true,
        };
      case SocketStatus.RECONNECTING:
        return {
          icon: Loader2,
          text: `재연결 중 (${reconnectAttempts}/${maxReconnectAttempts})`,
          color: "text-yellow-500",
          bgColor: "bg-yellow-50 dark:bg-yellow-950",
          pulse: true,
        };
      case SocketStatus.FAILED:
        return {
          icon: AlertTriangle,
          text: "연결 실패",
          color: "text-red-500",
          bgColor: "bg-red-50 dark:bg-red-950",
          pulse: false,
        };
      case SocketStatus.DISCONNECTED:
      default:
        return {
          icon: WifiOff,
          text: "연결 끊김",
          color: "text-gray-400",
          bgColor: "bg-gray-50 dark:bg-gray-950",
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Icon
          className={cn(
            "h-4 w-4",
            config.color,
            config.pulse && "animate-spin"
          )}
        />
        {showLabel && (
          <span className={cn("text-xs font-medium", config.color)}>
            {config.text}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          config.bgColor
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            config.color,
            config.pulse && "animate-spin"
          )}
        />
        {showLabel && (
          <span className={cn("text-sm font-medium", config.color)}>
            {config.text}
          </span>
        )}
      </div>

      {/* 에러 메시지 표시 */}
      {showError && lastError && connectionStatus === SocketStatus.FAILED && (
        <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 text-xs text-red-600 dark:text-red-400">
          {lastError}
        </div>
      )}

      {/* 폴링 모드 안내 */}
      {connectionStatus === SocketStatus.DISCONNECTED && (
        <div className="text-xs text-muted-foreground">
          폴링 모드로 동작 중입니다.
        </div>
      )}
    </div>
  );
}

/**
 * 간단한 연결 상태 인디케이터 (아이콘만)
 */
export function ConnectionIndicator({ className }: { className?: string }) {
  return (
    <ConnectionStatus
      showLabel={false}
      variant="compact"
      className={className}
    />
  );
}
