<!--
このプロジェクトだけのAIへのルール。Claude Code は CLAUDE.md から @ で読み込み、GitHub Copilot は AGENTS.md の指示で読む。
AGENTS.md と CLAUDE.md はテンプレートのものなので、このプロジェクトで決まりを足すときはこのファイルに書く（docs/template-files.md）
-->

# このプロジェクトのルール

## 技術

<!-- 立ち上げで決めたら書く。詳しくは docs/overview.md -->

- Next.js 16（App Router）＋ TypeScript 5.9 ＋ React 19。Node.js 24
- 認証：Auth.js（`next-auth` 5.0.0-beta.32、Google ログイン、JWT のセッション）。ログインしているかの確かめは `src/proxy.ts`
- Markdown の変換と本文の見た目：kinari-md（`github:tsubokura14/kinari-md#v0.1.1`。TypeScript のまま配るので `next.config.ts` の `transpilePackages` でビルドする）。変換は `src/lib/markdown.ts` が `renderMarkdown` を呼び、相対のリンクと画像の行き先を `resolve` で渡す。本文の CSS は `kinari-md/body.css`（入れ物 `.kinari-body`）と `kinari-md/tokens.css`、Mermaid の図はブラウザで `drawMermaid` が描く（`src/components/note-body-content.tsx`）。保管庫の検査（`scripts/check-content.mjs`）は unified（remark-parse・remark-gfm・remark-frontmatter・remark-math）と yaml を直接使う。ノートの正本は学習用の保管庫（別のリポジトリ）。ノートを読む場所は環境変数 `CONTENT_DIR`（既定 `content/`）。アプリのリポジトリに `content/` はなく、Vercel のビルドでだけ `scripts/prepare-content.mjs` が保管庫を `content/` に取る。手元では `.env.local` の `CONTENT_DIR` で手元の保管庫を指す（`docs/vault.md`）
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
| `npm run dev` | 開発サーバー（http://localhost:3000）。`CONTENT_DIR` のフォルダ（手元の保管庫）を読む。なければ案内を出して止まる |
| `npm run build` | コンテンツフォルダを用意して検査してから `next build`（`scripts/prepare-content.mjs`。Vercel ではまず保管庫を `content/` に取る）。検査に通らなければ失敗する |
| `npm test` | 単体・部品のテストを一度だけ実行する。ファイルを絞るときは `npm test -- <パス>` |
| `npm run lint` | Lint（ESLint と、トークンにない CSS の値の検査 `scripts/check-tokens.mjs`）。コンテンツフォルダの検査は含まない |
| `npm run check:content -- <フォルダ>` | コンテンツフォルダ（保管庫）が決まり（`docs/content-rules.md`）に合うかを検査する。フォルダを省くと環境変数 `CONTENT_DIR`（`.env.local` は読まない）、それもなければ `content/`。合わないものを一覧にして失敗で終わる |
| `npm run typecheck` | 型チェック（ルートの型を作ってから `tsc --noEmit`）。`next.config.ts` を読むので、`CONTENT_DIR` のフォルダが要る（保管庫がなければ `CONTENT_DIR=e2e/fixtures/content`） |
| `npm run test:visual` | 画像を比べるテスト（Docker の中で `next build` して Playwright）。基準と違えば失敗し、`playwright-report/` に基準・今回・差分が残る。絞るときは `npm run test:visual -- <パス>` |
| `npm run screenshots` | 画面の画像を撮り直す（Docker）。違うものとないものを `docs/specs/screens/` に書き出す。撮る画面を絞るときは `npm run screenshots -- <パス>` |
| `npm run format` | コード（`.ts .tsx .js .mjs .cjs .jsx .css .json`）を Prettier でまとめて整形する。編集したファイルは、フック（`.claude/hooks/format-on-edit.mjs`）が自動で整形する |

- 撮るときのサーバーのポートは環境変数 `PORT`（既定 3100）で変えられる。テスト用のコンテンツフォルダごとにサーバーを立てるので、`PORT` から4つ（3100〜3103）を使う

## うまくいかなかったことから追加したルール

<!-- 同じ注意を2回しないために、日付つきで書き足す。使わなくなったら消してよい。例：
- 2026-09-17: 日付の比較は、時刻を切り捨ててから行う
-->

- 画面を動かすテストで、ページを開いてすぐボタン（フォルダ、☰ など）を押すときは、`e2e/hydration.ts` の `clickWhenHydrated` で React がつながるのを待ってから押す。つながる前に押すと何も起きず、CI でたまに落ちる（理由は `e2e/hydration.ts`）
- `/dev-build` の始めに `docker info` で Docker が動いているか確かめ、動いていなければ先に人に起動を頼む
- PR・Issue・コミットの題や本文を Git Bash から `gh`・`git` に渡すとき、`/` で始まる文字（`/content-review` など）は Git Bash が Windows のパスに書き換える（`C:/Program Files/Git/…`）。`MSYS_NO_PATHCONV=1` を付けて呼ぶか、題の頭を `/` 以外にする
- 一覧の行などに印・飾り（読み込み中の点など）を足すときは、`absolute` などで行の幅を取らない置き方にする。幅を取ると、長い名前の折り返しが変わり、行の文字の位置がずれる。確かめは、長い名前の行がある画面の画像のテスト（`note-tree-many` など）を基準の画像のまま通すことで行う
