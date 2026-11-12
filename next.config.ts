import type { NextConfig } from "next";
import { listNotePaths } from "./src/lib/notes";

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

// docs/design.md の「見つからないノートは、Proxy で 404 にする」。ビルドのときのノートのパスを Proxy に埋め込む
export default async function config(): Promise<NextConfig> {
  const notePaths = (await listNotePaths()).map((segments) => segments.join("/"));
  return { ...nextConfig, env: { NOTE_PATHS: JSON.stringify(notePaths) } };
}
