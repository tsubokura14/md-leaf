# Next.js

書いた時点のバージョン：16.4.6（React 19.3.0）

## 何か

React でサイトを作るフレームワーク。ページの置き場所（フォルダ）がそのまま URL になる App Router を使う。

- 公式：https://nextjs.org/docs
- 入れた版のドキュメントは `node_modules/next/dist/docs/` にもある

## このプロジェクトで使っている部分

- App Router：`src/app/` のフォルダとファイル（`layout.tsx`、`page.tsx`）がページになる
- `next.config.ts`
  - `cacheComponents`・`partialPrefetching`：create-next-app の初期の設定のまま
  - `agentRules: false`：`next dev` が `AGENTS.md` に案内を書き足すのを止める
  - `turbopack.rules`：CSS を Tailwind CSS で変換する
- `next typegen`：`LayoutProps` などのルートの型を作る。`npm run typecheck` の最初に走る
- `eslint-config-next`：Next.js 向けの Lint の規則（`eslint.config.mjs`）
