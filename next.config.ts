import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 画面を動かすテストで、テスト用のコンテンツフォルダごとに出力先を分ける（playwright.config.ts）
  distDir: process.env.DIST_DIR || ".next",
  // docs/design.md の「`content/` をサーバーの出力に入れる」
  outputFileTracingIncludes: {
    "/*": ["./content/**/*"],
  },
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
