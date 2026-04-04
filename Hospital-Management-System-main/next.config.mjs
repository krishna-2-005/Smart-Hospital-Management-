/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Disable Turbopack (more stable for now)
  turbo: false,

  serverExternalPackages: ["pg", "mongoose", "firebase-admin"],
};

export default nextConfig;