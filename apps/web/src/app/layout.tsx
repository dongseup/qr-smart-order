import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QR Smart Order',
  description: 'QR 코드 기반 스마트 주문 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
