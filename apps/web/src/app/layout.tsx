import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineIndicator } from "@/components/offline-indicator";

export const metadata: Metadata = {
  title: "QR 코드 기반 스마트 주문 시스템",
  description: "QR 코드 기반 스마트 주문 시스템",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "스마트 주문",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover", // iOS safe-area 지원
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <ErrorBoundary>
          <OfflineIndicator />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
