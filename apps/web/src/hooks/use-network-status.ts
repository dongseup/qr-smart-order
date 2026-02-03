"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * 네트워크 상태
 */
export interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: string; // 4g, 3g, 2g, slow-2g
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time (ms)
  saveData?: boolean; // 데이터 절약 모드
}

/**
 * 네트워크 상태 감지 훅
 * Navigator.onLine API와 Network Information API를 사용
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  });

  /**
   * 네트워크 정보 업데이트
   */
  const updateNetworkStatus = useCallback(() => {
    const isOnline = navigator.onLine;

    // Network Information API 지원 확인
    const connection = (navigator as any).connection ||
                       (navigator as any).mozConnection ||
                       (navigator as any).webkitConnection;

    setNetworkStatus({
      isOnline,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData,
    });

    console.log("📡 Network status:", {
      isOnline,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
    });
  }, []);

  /**
   * 온라인 상태로 전환
   */
  const handleOnline = useCallback(() => {
    console.log("✅ Network online");
    updateNetworkStatus();
  }, [updateNetworkStatus]);

  /**
   * 오프라인 상태로 전환
   */
  const handleOffline = useCallback(() => {
    console.log("❌ Network offline");
    updateNetworkStatus();
  }, [updateNetworkStatus]);

  /**
   * 네트워크 상태 변경 감지
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 초기 네트워크 상태 확인
    updateNetworkStatus();

    // 이벤트 리스너 등록
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Network Information API 변경 감지
    const connection = (navigator as any).connection ||
                       (navigator as any).mozConnection ||
                       (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener("change", updateNetworkStatus);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      if (connection) {
        connection.removeEventListener("change", updateNetworkStatus);
      }
    };
  }, [handleOnline, handleOffline, updateNetworkStatus]);

  return networkStatus;
}

/**
 * 네트워크 품질이 좋은지 확인
 */
export function isGoodNetworkQuality(status: NetworkStatus): boolean {
  if (!status.isOnline) return false;

  // effectiveType이 4g이거나 없으면 좋은 품질로 간주
  if (status.effectiveType === "4g" || !status.effectiveType) {
    return true;
  }

  // 3g이고 RTT가 낮으면 괜찮음
  if (status.effectiveType === "3g" && status.rtt && status.rtt < 200) {
    return true;
  }

  return false;
}
