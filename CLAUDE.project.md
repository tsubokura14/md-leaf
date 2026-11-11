<!--
このプロジェクトだけのAIへのルール。Claude Code は CLAUDE.md から @ で読み込み、GitHub Copilot は AGENTS.md の指示で読む。
AGENTS.md と CLAUDE.md はテンプレートのものなので、このプロジェクトで決まりを足すときはこのファイルに書く（docs/template-files.md）
-->

# このプロジェクトのルール

## 技術

<!-- 立ち上げで決めたら書く。詳しくは docs/overview.md -->

- Next.js 16（App Router）＋ TypeScript 5.9 ＋ React 19。Node.js 24
- 認証：Auth.js（`next-auth` 5.0.0-beta.32、Google ログイン、JWT のセッション）。ログインしているかの確かめは `src/proxy.ts`
- Markdown の変換：unified（remark-parse・remark-gfm・remark-frontmatter・remark-math・remark-rehype・rehype-stringify）、フロントマターは yaml、コードの色分けは highlight.js、数式は KaTeX（`src/lib/markdown.ts`）。Mermaid の図はブラウザで mermaid が描く（`src/components/mermaid.ts`）。ノートを読む場所は環境変数 `CONTENT_DIR`（既定 `content/`）
- Tailwind CSS 4（Next.js のビルドに `@tailwindcss/turbopack` で組み込む）
- テスト：Vitest ＋ Testing Library ＋ jsdom
  - `*.test.ts`・`*.test.mjs`（`src/`・`scripts/`・`.claude/hooks/`）は Node で、`src/` の `*.test.tsx` は jsdom で動く（`vitest.config.mts`）
- 画面を動かすテスト・画像を比べるテスト：Playwright 1.65（`e2e/`）。公式の Docker イメージの中で動かすので、手元では Docker Desktop が要る
  - 基準の画像は `docs/specs/screens/<名前>.png`（`playwright.config.ts` の `snapshotPathTemplate`）
- Lint：ESLint 9（`eslint-config-next`、`eslint-plugin-better-tailwindcss`）
- 整形：Prettier 3（`.prettierrc.json`）
- Next.js の使い方は、学習した知識ではなく `node_modules/next/dist/docs/` で確かめる（16 は前の版と書き方が違うところがある）

## よく使うコマンド

<!-- 起動、テスト、Lint、型チェック、本番の画面を撮り直す、画像を比べるテスト -->

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー（http://localhost:3000） |
| `npm test` | 単体・部品のテストを一度だけ実行する。ファイルを絞るときは `npm test -- <パス>` |
| `npm run lint` | Lint（ESLint と、トークンにない CSS の値の検査 `scripts/check-tokens.mjs`） |
| `npm run typecheck` | 型チェック（ルートの型を作ってから `tsc --noEmit`） |
| `npm run test:visual` | 画像を比べるテスト（Docker の中で `next build` して Playwright）。基準と違えば失敗し、`playwright-report/` に基準・今回・差分が残る。絞るときは `npm run test:visual -- <パス>` |
| `npm run screenshots` | 画面の画像を撮り直す（Docker）。違うものとないものを `docs/specs/screens/` に書き出す。撮る画面を絞るときは `npm run screenshots -- <パス>` |
| `npm run format` | コード（`.ts .tsx .js .mjs .cjs .jsx .css .json`）を Prettier でまとめて整形する。編集したファイルは、フック（`.claude/hooks/format-on-edit.mjs`）が自動で整形する |

- 撮るときのサーバーのポートは環境変数 `PORT`（既定 3100）で変えられる。テスト用のコンテンツフォルダごとにサーバーを立てるので、`PORT` から4つ（3100〜3103）を使う

## うまくいかなかったことから追加したルール

<!-- 同じ注意を2回しないために、日付つきで書き足す。使わなくなったら消してよい。例：
- 2026-09-17: 日付の比較は、時刻を切り捨ててから行う
-->

- 画面を動かすテストで、ページを開いてすぐボタン（フォルダ、☰ など）を押すときは、`e2e/hydration.ts` の `clickWhenHydrated` で React がつながるのを待ってから押す。つながる前に押すと何も起きず、CI でたまに落ちる（理由は `e2e/hydration.ts`）
