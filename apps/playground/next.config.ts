import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@noryx/core",
    "@noryx/runtime",
    "@noryx/react",
    "@noryx/openai-compatible",
    "@noryx/workflows",
    "@noryx/primitive-chat",
    "@noryx/primitive-summarize",
    "@noryx/primitive-extract",
    "@noryx/primitive-classify"
  ]
};

export default nextConfig;
