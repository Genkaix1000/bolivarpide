import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Respaldo si el cliente no comprimió; fotos ya van en WebP ~100–300 KB.
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  allowedDevOrigins: [
    "192.168.0.18",
    "regarding-purse-falling-prime.trycloudflare.com",
    "*.trycloudflare.com",
    "192.168.0.*",
    "192.168.1.*",
    "10.0.0.*",
    "localhost:3000",
    "127.0.0.1",
  ],
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
