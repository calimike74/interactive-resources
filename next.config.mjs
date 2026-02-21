/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Note: custom headers() not supported with static export.
  // Security headers are set via Vercel config (vercel.json) for web
  // and via Capacitor's server config for iOS.
};

export default nextConfig;
