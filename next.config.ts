import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root — a stray lockfile in the user home dir
    // otherwise makes Next infer the wrong root.
    root: __dirname,
  },
};

export default nextConfig;
