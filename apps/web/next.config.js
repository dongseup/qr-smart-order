/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@qr-smart-order/ui", "@qr-smart-order/shared-types"],
};

module.exports = nextConfig;
