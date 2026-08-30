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
    "192.168.0.*",
    "192.168.1.*",
    "10.0.0.*",
    "localhost:3000",
    "127.0.0.1",
  ],
};

export default nextConfig;
