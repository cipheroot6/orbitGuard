import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["satellite.js"],
  turbopack: {
    rules: {
      "**/satellite.js/dist/wasm/**/*.js": {
        loaders: ["./lib/loaders/empty-loader.js"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
