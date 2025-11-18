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
};

module.exports = withPWA(nextConfig);

