import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Next app lives in app/, not the repo root; pin Turbopack's root here so
  // it never resolves modules from the repo root (broke next/font on Vercel).
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
