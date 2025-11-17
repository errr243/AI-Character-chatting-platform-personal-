const isDev = process.env.NODE_ENV === 'development';

// PWA 설정을 항상 포함하되, 개발 환경에서는 비활성화
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: isDev,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turbopack을 사용할 때 경고가 뜨지 않도록 빈 설정을 명시
  turbopack: {},
};

module.exports = withPWA(nextConfig);

