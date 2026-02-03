import { useState, useEffect } from "react";

export interface NotificationSettings {
  soundEnabled: boolean;
  browserNotificationEnabled: boolean;
  volume: number; // 0.0 ~ 1.0
  repeatAlertMinutes: number; // 반복 알림 시간 (분)
}

const DEFAULT_SETTINGS: NotificationSettings = {
  soundEnabled: true,
  browserNotificationEnabled: false,
  volume: 0.7,
  repeatAlertMinutes: 10,
};

const STORAGE_KEY = "kitchen-notification-settings";

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  // 로컬 스토리지에서 설정 불러오기
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error("Failed to parse notification settings:", error);
      }
    }

    // 브라우저 알림 권한 확인
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // 설정 변경 시 로컬 스토리지에 저장
  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // 브라우저 알림 권한 요청
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === "granted";
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return false;
    }
  };

  return {
    settings,
    updateSettings,
    notificationPermission,
    requestNotificationPermission,
  };
}
