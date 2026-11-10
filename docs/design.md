<!--
今の設計。アプリが今どう作られているかのうち、複数の場所に関わるものを、理由と前提つきで現在形で書く。
書き方は code-notes スキル（.claude/skills/code-notes/SKILL.md）。
-->

# 今の設計

## 全体の構成

| 場所 | 置くもの |
| --- | --- |
| `src/app/` | 画面（App Router のページとレイアウト）。データの読み込みと組み立ては `src/lib/` を呼ぶだけにする |
| `src/components/` | 画面の部品（複数の画面で使うもの） |
| `src/lib/` | 画面に関係しない処理（ノートの読み込み、Markdown から HTML への変換など）。React に依存しない |
| `src/styles/tokens.css` | トークンファイル。色・文字・余白などの値はここにだけ書く |
| `src/app/globals.css` | Tailwind とトークンの読み込みだけ。値は書かない |
| `content/` | ノート。この中の構成がそのままノートの一覧になる |
| `*.test.ts(x)`・`*.test.mjs` | 単体・部品のテスト（Vitest）。テストするファイルの隣に置く（`src/`・`scripts/`・`.claude/hooks/`）。`src/` の `.tsx` は jsdom、それ以外は Node で動く |
| `e2e/` | 画面を動かすテストと、画面の画像を比べるテスト（Playwright） |
| `scripts/` | 開発用のスクリプト（画像を撮る Docker の起動、トークンにない値の検査） |
| `.claude/hooks/format-on-edit.mjs` | AI が編集したファイルだけを整形するフック |

- 理由：ノートの変換（`src/lib/`）は条件の分かれ道が多く、テストを書く中心になる。React から切り離しておくと、画面を通さずにテストできる
- 前提（崩れたら見直す）：ノートはビルドのときに HTML にする（`docs/overview.md`）。実行のたびに読む作りに変えたら、層の分け方を見直す

## データ

- 保存するデータはない（データベースを使わない）。ノートはリポジトリの `content/` に置く

## どこでも守る決まり

### トークンにない値を書かない
- 理由：見た目の値を `src/styles/tokens.css` の1か所にまとめ、ライト・ダークを同じトークン名で切り替えるため（`docs/ui.md` の「トークン」）
- 前提（崩れたら見直す）：Tailwind の既定の値を `--*: initial` で消してある。これを外すと、トークンにないクラスも CSS が作られる
- 当てはまる場所：`src/` のすべての TSX（`npm run lint` の ESLint が、トークンにないクラス、`[` を使う任意の値、色コード・`px` のリテラルを見つける）と、トークンファイル以外の `.css`（`scripts/check-tokens.mjs` が色コード・`rgb()`・`px` を見つける）

### 画面の画像は、Playwright 公式の Docker イメージで撮って比べる
- 理由：OS が違うと文字の描き方が変わり、画像が一致しないため。手元（`scripts/playwright-docker.mjs`）と CI（`.github/workflows/ci.yml` の `visual`）で同じイメージを使う
- 前提（崩れたら見直す）：イメージのタグは `@playwright/test` の版と同じにする。`scripts/playwright-docker.mjs` は版から自動で決めるが、`.github/workflows/ci.yml` には直接書いてあるので、Playwright を上げたら両方を合わせる
- 当てはまる場所：`package.json` の `@playwright/test`、`.github/workflows/ci.yml` の `container:`

### 画面の状態は、テスト用のコンテンツフォルダで作る
- 理由：ノートはビルドのときに HTML にするので、撮る状態（0件、ノートが多いなど）は、読み込むコンテンツフォルダを差し替えて作る
- ログイン中の状態は、テストの側で作る。`e2e/session.ts` の `logIn` が、テストのときだけの `AUTH_SECRET`（`e2e/test-env.ts`。`playwright.config.ts` がサーバーにも渡す）で、Auth.js と同じセッションの Cookie を作る。理由：アプリにログインを飛ばす入口（テスト用のログインなど）を作ると、設定を間違えたときに本番で誰でも入れる抜け道になる
- 前提（崩れたら見直す）：ノートを読む場所は環境変数 `CONTENT_DIR`（既定 `content/`）で変えられ、画面の画像は `e2e/fixtures/content/` で撮る（ノートの読み込みを作る #3 で入れる）。セッションは Auth.js の JWT の Cookie（`authjs.session-token`。Cookie の名前を salt に使う）。データベースのセッションに変えたり、Auth.js の版で Cookie の作り方が変わったら、`e2e/session.ts` を直す
- 当てはまる場所：`src/lib/` のノートの読み込み、`playwright.config.ts` のサーバーの起動、`e2e/session.ts`・`e2e/test-env.ts`

### ログインしていなければ、ログインの画面以外を出さない
- 理由：ノートはビルドのときに HTML にするので、ページの中では止められない場合がある。まだない URL も含めて、どのページより前に `src/proxy.ts` で止める
- 「ログインしている」は、セッションがあり、そのアドレスが今の `ALLOWED_EMAILS` に入っていること。開くたびに比べるので、許可するアドレスから外して再デプロイすれば、ログイン中の人も締め出せる。移す先は `src/lib/access.ts` が決める（ログインしていなければ `/login?callbackUrl=<開こうとした URL>`、ログイン中に `/login` を開けば `/`）
- 前提（崩れたら見直す）：`src/proxy.ts` の `matcher` から外した場所（`/api/auth/`、`/_next/static/`、`/_next/image`、`/favicon.ico`）は守られない。ノートの画像などを足すときも、`matcher` から外さない。ページの中に、ログインを飛ばす入口を作らない
- 当てはまる場所：`src/proxy.ts`、`src/lib/access.ts`、`src/app/` のすべてのページ
