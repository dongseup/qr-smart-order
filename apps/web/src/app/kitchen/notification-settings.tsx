"use client";

import { Bell, BellOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNotificationSettings } from "@/hooks/use-notification-settings";

export function NotificationSettings() {
  const { settings, updateSettings, notificationPermission, requestNotificationPermission } =
    useNotificationSettings();

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ volume: parseFloat(e.target.value) });
  };

  const handleBrowserNotificationToggle = async () => {
    if (!settings.browserNotificationEnabled && notificationPermission !== "granted") {
      const granted = await requestNotificationPermission();
      if (granted) {
        updateSettings({ browserNotificationEnabled: true });
      }
    } else {
      updateSettings({ browserNotificationEnabled: !settings.browserNotificationEnabled });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 md:h-10 md:w-10">
          {settings.soundEnabled || settings.browserNotificationEnabled ? (
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
          ) : (
            <BellOff className="h-4 w-4 md:h-5 md:w-5" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>알림 설정</DialogTitle>
          <DialogDescription>
            새 주문 발생 시 알림 방식을 설정합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* 사운드 알림 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.soundEnabled ? (
                  <Volume2 className="h-5 w-5 text-primary" />
                ) : (
                  <VolumeX className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="font-medium">사운드 알림</span>
              </div>
              <Button
                variant={settings.soundEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              >
                {settings.soundEnabled ? "켜짐" : "꺼짐"}
              </Button>
            </div>

            {/* 볼륨 조절 */}
            {settings.soundEnabled && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  볼륨: {Math.round(settings.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.volume}
                  onChange={handleVolumeChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
            )}
          </div>

          {/* 브라우저 알림 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <span className="font-medium">브라우저 알림</span>
              </div>
              <Button
                variant={settings.browserNotificationEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleBrowserNotificationToggle}
              >
                {settings.browserNotificationEnabled ? "켜짐" : "꺼짐"}
              </Button>
            </div>
            {notificationPermission === "denied" && (
              <p className="text-xs text-destructive">
                브라우저 알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.
              </p>
            )}
          </div>

          {/* 반복 알림 설정 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">미처리 주문 반복 알림</label>
            <p className="text-xs text-muted-foreground">
              {settings.repeatAlertMinutes}분 이상 미처리된 주문에 대해 알림을 반복합니다.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
