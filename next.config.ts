import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
  allowedDevOrigins: ["192.168.1.39", "localhost"],
};

const withPwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
});

export default withPwaConfig(nextConfig);
