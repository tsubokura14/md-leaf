import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // next dev が AI のエージェントを見つけると AGENTS.md に Next.js の案内を書き足す。
  // AGENTS.md はテンプレートのファイルで、このプロジェクトでは書き換えないため止める
  agentRules: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
