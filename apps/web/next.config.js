/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@qr-smart-order/ui", "@qr-smart-order/shared-types"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // 실제 이미지 호스팅 도메인으로 변경
      },
    ],
  },
};

module.exports = nextConfig;
