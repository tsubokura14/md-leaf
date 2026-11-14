import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { NextConfig } from "next";
import { contentDir, listNotePaths } from "./src/lib/notes";
import { extractAppColors } from "./src/lib/token-colors";

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

// docs/design.md の「見つからないノートは、Proxy で 404 にする」。ビルドのときのノートのパスを Proxy に埋め込む。
// トークンの色も埋め込む（docs/design.md「トークンにない値を書かない」。src/lib/token-colors.ts）
export default async function config(): Promise<NextConfig> {
  // 手元で保管庫を指さずに npm run dev・typecheck を動かしたとき、readdir の ENOENT ではなく直し方を出す
  const dir = contentDir();
  if (!existsSync(dir)) {
    throw new Error(
      `コンテンツフォルダがありません: ${dir}
` +
        "保管庫のフォルダを環境変数 CONTENT_DIR で指してください（例：.env.local に CONTENT_DIR=../learning-vault）",
    );
  }
  const notePaths = (await listNotePaths()).map((segments) => segments.join("/"));
  const tokens = await readFile(join(process.cwd(), "src/styles/tokens.css"), "utf8");
  return {
    ...nextConfig,
    env: {
      NOTE_PATHS: JSON.stringify(notePaths),
      APP_COLORS: JSON.stringify(extractAppColors(tokens)),
    },
  };
}
