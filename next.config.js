/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Turbopack을 명시적으로 활성화 (개발 모드에서만)
    turbopack: process.env.NODE_ENV === 'development' ? {} : undefined,
  },
}

// PWA 설정을 항상 포함하되, 개발 환경에서는 비활성화
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // 개발 환경에서는 PWA 비활성화
});

module.exports = withPWA(nextConfig);

