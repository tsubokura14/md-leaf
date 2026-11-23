<!--
今の設計。アプリが今どう作られているかのうち、複数の場所に関わるものを、理由と前提つきで現在形で書く。
書き方は code-notes スキル（.claude/skills/code-notes/SKILL.md）。
-->

# 今の設計

## 全体の構成

| 場所 | 置くもの |
| --- | --- |
| `src/app/` | 画面（App Router のページとレイアウト）。データの読み込みと組み立ては `src/lib/` を呼ぶだけにする |
| `src/app/(reader)/` | ログインの画面以外のページ（ホーム、ノート）。上の帯とノートの一覧はこのグループのレイアウトに置く。ログインの画面はグループの外に置き、上の帯と一覧を出さない |
| `src/app/(reader)/data.ts` | `src/lib/notes.ts` を `"use cache"` の関数で包み、ビルドのときに読む。ページはここを呼ぶ。`"use cache"` などの Next.js の書き方は `src/lib/` に持ち込まず、ここに置く |
| `src/app/files/` | ノートの画像を返す入口（Route Handler）。上の帯と一覧が要らないので `(reader)` の外に置く（「画像を返す入口は、コンテンツフォルダの中の画像だけを返す」） |
| `src/components/` | 画面の部品（複数の画面で使うもの） |
| `src/lib/` | 画面に関係しない処理（ノートの読み込み、Markdown から HTML への変換の入口など）。React に依存しない。Markdown の変換そのものは kinari-md（`src/lib/markdown.ts` が `renderMarkdown` を呼ぶ）で、相対のリンクと画像の行き先だけを md-leaf が決める（`note-links.ts`・`note-images.ts`） |
| `src/styles/tokens.css` | トークンファイル。色・文字・余白などの値はここにだけ書く |
| `src/app/globals.css` | Tailwind とトークンの読み込み（md-leaf の `tokens.css` のあとに `kinari-md/tokens.css`）と、kinari-md の中を Tailwind に探させる `@source`（「トークンにない値を書かない」）と、`dark` の変形の定義（`<html>` の `data-theme="dark"` に合わせる。`src/components/theme.ts`）、`theme-system`・`theme-light`・`theme-dark` の変形の定義（`<html>` の `data-theme-choice` に合わせる。上の帯のテーマのボタンのアイコン。`src/components/theme-menu.tsx`）、`reading` の変形の定義（本文の `.reading` があるページだけ。`src/components/font-size-menu.tsx`）、`toc` の変形の定義（見出しのある本文のページだけ。`src/components/toc.tsx`）だけ。値は書かない |
| `src/components/note-body.css` | ノートの本文（Markdown から作った HTML）の見た目のうち、md-leaf の画面の決まりだけ（見出しの `scroll-margin-top`）。本文の見た目そのものは kinari-md の `body.css`（入れ物 `.kinari-body`。`src/components/note-body.tsx` が読む）で、md-leaf では上書きしない。値はトークンの `var()` だけを使う |
| `src/components/toc.css` | 目次の高さなど、Tailwind のトークンのクラスだけでは書けない値（画面の高さからの引き算）。値はトークンの `var()` だけを使う |
| `content/` | Vercel のビルドで保管庫から取ってくるノートの置き場所（リポジトリには入れない。`.gitignore`）。この中の構成がそのままノートの一覧になる |
| `*.test.ts(x)`・`*.test.mjs` | 単体・部品のテスト（Vitest）。テストするファイルの隣に置く（`src/`・`scripts/`・`.claude/hooks/`）。`src/` の `.tsx` は jsdom、それ以外は Node で動く |
| `e2e/` | 画面を動かすテストと、画面の画像を比べるテスト（Playwright） |
| `scripts/` | 開発とビルドのスクリプト（画像を撮る Docker の起動、トークンにない値の検査、コンテンツフォルダの検査、ビルドの前の保管庫の取得） |
| `.claude/hooks/format-on-edit.mjs` | AI が編集したファイルだけを整形するフック |

- 理由：ノートの変換（`src/lib/`）は条件の分かれ道が多く、テストを書く中心になる。React から切り離しておくと、画面を通さずにテストできる
- 前提（崩れたら見直す）：ノートはビルドのときに HTML にする（`docs/overview.md`）。実行のたびに読む作りに変えたら、層の分け方を見直す

## データ

- 保存するデータはない（データベースを使わない）。ノートの正本は学習用の保管庫（アプリとは別の非公開のリポジトリ）に置き、ビルドのときに読む（「ノートはビルドの最初に保管庫から取ってくる」）

## どこでも守る決まり

### トークンにない値を書かない
- 理由：見た目の値を `src/styles/tokens.css` の1か所にまとめ、ライト・ダークを同じトークン名で切り替えるため（`docs/ui.md` の「トークン」）
- 前提（崩れたら見直す）：Tailwind の既定の値を `--*: initial` で消してある。これを外すと、トークンにないクラスも CSS が作られる
- Tailwind は、探す対象のファイルで使っているトークンの変数だけを CSS に出す。kinari-md の `body.css` と図は md-leaf のトークン（`--color-info`・`--color-success` など）を読み、そのうち md-leaf のコードでは使っていないものがある。`node_modules` は探す対象から外れるので、`src/app/globals.css` の `@source "../../node_modules/kinari-md/src"` で kinari-md の中も探させる。理由：探させないと kinari-md だけが使う変数が出ず、コールアウトの色などが消える。探させれば、md-leaf の CSS で kinari-md を上書きせずに済む。前提（崩れたら見直す）：kinari-md の CSS が `node_modules/kinari-md/src` の下にあること（kinari-md の置き方やフォルダが変わったら、`@source` のパスを合わせる）。トークンを `@theme static` にして全部出す作りに変えたら、`@source` は要らない
- 当てはまる場所：`src/` のすべての TSX（`npm run lint` の ESLint が、トークンにないクラス、`[` を使う任意の値、色コード・`px` のリテラルを見つける）と、トークンファイル以外の `.css`（`scripts/check-tokens.mjs` が色コード・`rgb()`・`px` を見つける）。kinari-md のファイル（`node_modules/kinari-md`）は対象に入らない（パッケージの中の決まりは kinari-md が持つ）。CSS に書いたクラス（`.reading`、`.kinari-body`）は Tailwind のクラスとして見つからないので、`eslint.config.mjs` の `no-unknown-classes` の `ignore` に足す
- CSS の `var()` を使えない場所（マニフェスト・ホーム画面のアイコンの画像・時刻や電池の部分の色の `<meta name="theme-color">`）の色も、TS に書き写さない。ビルドのときに `next.config.ts` がトークンファイルを読み、`src/lib/token-colors.ts` で取り出した色を環境変数 `APP_COLORS`（JSON）として埋め込む。使う側は `readAppColors()` で読む（theme-color は `src/components/theme.ts` の `themeScript` が、ライト・ダークの bg を `<head>` のスクリプトに渡す）。トークンファイルの書き方を変えて色が見つからなくなったら、ビルドが止まる（違う色のまま出さないため）

### 画面の画像は、Playwright 公式の Docker イメージで撮って比べる
- 理由：OS が違うと文字の描き方が変わり、画像が一致しないため。手元（`scripts/playwright-docker.mjs`）と CI（`.github/workflows/ci.yml` の `visual`）で同じイメージを使う
- 前提（崩れたら見直す）：イメージのタグは `@playwright/test` の版と同じにする。`scripts/playwright-docker.mjs` は版から自動で決めるが、`.github/workflows/ci.yml` には直接書いてあるので、Playwright を上げたら両方を合わせる
- 当てはまる場所：`package.json` の `@playwright/test`、`.github/workflows/ci.yml` の `container:`

### 画面の状態は、テスト用のコンテンツフォルダで作る
- 理由：ノートはビルドのときに HTML にするので、撮る状態（0件、ノートが多いなど）は、読み込むコンテンツフォルダを差し替えて作る
- ログイン中の状態は、テストの側で作る。`e2e/session.ts` の `logIn` が、テストのときだけの `AUTH_SECRET`（`e2e/test-env.ts`。`playwright.config.ts` がサーバーにも渡す）で、Auth.js と同じセッションの Cookie を作る。理由：アプリにログインを飛ばす入口（テスト用のログインなど）を作ると、設定を間違えたときに本番で誰でも入れる抜け道になる
- 状態ごとのフォルダ（`e2e/fixtures/content/`・`content-no-index/`・`content-empty/`・`content-many/`）ごとに、別のビルドとサーバーを立てる（`playwright.config.ts` の `webServer` と `projects`。ポートは `PORT` から1つずつ大きく、ビルドの出力先は環境変数 `DIST_DIR` で `.next/e2e/<フォルダ>/` に分ける）。`content/` 以外で動かすテストには、フォルダの名前のタグ（`@content-empty` など）を付ける
- 前提（崩れたら見直す）：ノートを読む場所は環境変数 `CONTENT_DIR`（既定 `content/`）で変えられる。ノートはビルドのときに読むので、同じサーバーでは中身を差し替えられない。実行のたびに読む作りに変えたら、サーバーを1つにまとめられる。セッションは Auth.js の JWT の Cookie（`authjs.session-token`。Cookie の名前を salt に使う）。データベースのセッションに変えたり、Auth.js の版で Cookie の作り方が変わったら、`e2e/session.ts` を直す
- 当てはまる場所：`src/lib/notes.ts` のノートの読み込み、`playwright.config.ts` のサーバーの起動、`next.config.ts` の `distDir`、`e2e/fixtures/`、`e2e/session.ts`・`e2e/test-env.ts`

### ノートはビルドの最初に保管庫から取ってくる
- ノートの正本は、学習用の保管庫（別の非公開のリポジトリ）1つだけ。アプリのリポジトリには `content/` を置かない（`.gitignore` の `/content/`）
- `npm run build` は `node scripts/prepare-content.mjs && next build`。`scripts/prepare-content.mjs` は、Vercel のビルド（環境変数 `VERCEL` がある）でだけ、保管庫（`VAULT_REPO`）を読むだけの鍵（`VAULT_TOKEN`）で一時のフォルダ `.vault/`（`.gitignore`）に取り、その中の `notes/` だけを `content/` に移して `.vault/` を消す。`notes/` がなければ「保管庫に notes/ フォルダがありません」と出して exit 1。そのあと、どこでもコンテンツフォルダを検査する（「保管庫には決まりに合うものだけを置く」）。取れない・検査に通らないときは exit 1 で、`next build` に進まない
- 保管庫の main に push すると、保管庫の GitHub Actions が Vercel の Deploy Hook を呼び、本番のビルドが始まる（つなぐ手順は `docs/vault.md`）
- 手元では取らない。`.env.local` の `CONTENT_DIR` で手元の保管庫の `notes/` を指す。コンテンツフォルダがなければ、`next.config.ts` と `scripts/prepare-content.mjs` が `CONTENT_DIR` を案内して止まる
- 理由：保管庫へ push するだけで反映させ、教材の更新をアプリのリポジトリの履歴に混ぜないため。`notes/` を `content/` に移すと（`CONTENT_DIR=content/notes` にしない）、`notes/` の外（`.claude/` など）をサーバーの出力に入れず、サーバーの出力（「`content/` をサーバーの出力に入れる」）と Proxy の 404 の作りを変えずに済む。Vercel で取れないとき・検査に通らないときに `next build` へ進まなければ、本番は前の版のまま残り、Vercel の標準のメールで失敗が届く（ノートが0件や壊れたリンクのアプリを本番に出さない）
- 前提（崩れたら見直す）：Vercel のビルドのコマンドは `npm run build` のまま。CI と画面のテスト（`playwright.config.ts`）は `npx next build` を直接呼び、`e2e/fixtures/` のノートで動くので、保管庫を読まない。CI の型チェック（`next typegen` が `next.config.ts` を読む）には `CONTENT_DIR: e2e/fixtures/content` を渡す。取る先・鍵の渡し方・`VERCEL` での見分け方を変えたら、`scripts/prepare-content.mjs` と `docs/vault.md` を合わせる
- 当てはまる場所：`scripts/prepare-content.mjs`、`package.json` の `build`、`next.config.ts` のコンテンツフォルダがないときの止め方、`.gitignore`、`.env.example`、`.github/workflows/ci.yml` の `check`、`docs/vault.md`

### `content/` をサーバーの出力に入れる
- 理由：一覧にない URL（見つからないノート）は開いたときに組み立て、そのときにノートを読むので、本番でも `content/`（Vercel のビルドで保管庫から取ったもの）が要る。フォルダの中を読む処理はビルドに追跡されないので、`next.config.ts` の `outputFileTracingIncludes` で入れる。ノートの一覧はレイアウトで読むので、ログインの画面以外のすべてのページに要る
- 既定の `content/` は `join(process.cwd(), "content")` と決まった場所で書き、`CONTENT_DIR` は追跡から外す（`turbopackIgnore`）。外さないと、場所が決まらないためにプロジェクト全体が出力に入る
- 前提（崩れたら見直す）：`CONTENT_DIR` は手元（手元の保管庫を指す）と画面のテスト・CI（`e2e/fixtures/` を指す）だけで使い、Vercel では設定しない。`outputFileTracingIncludes` のキーは途中まで合えば当てはまるので、ほかのページにも入るが、ノートだけなので構わない。ノートを置く場所を変えたら、両方を合わせる
- 当てはまる場所：`src/lib/notes.ts` の `contentDir`、`next.config.ts` の `outputFileTracingIncludes`

### ログインしていなければ、ログインの画面以外を出さない
- 理由：ノートはビルドのときに HTML にするので、ページの中では止められない場合がある。まだない URL も含めて、どのページより前に `src/proxy.ts` で止める
- 「ログインしている」は、セッションがあり、そのアドレスが今の `ALLOWED_EMAILS` に入っていること。開くたびに比べるので、許可するアドレスから外して再デプロイすれば、ログイン中の人も締め出せる。移す先は `src/lib/access.ts` が決める（ログインしていなければ `/login?callbackUrl=<開こうとした URL>`、ログイン中に `/login` を開けば `/`）
- ホーム画面に追加するときにブラウザが読むマニフェストとアイコン（`/manifest.webmanifest`、`/icon/192`・`/icon/512`、`/apple-icon`）と、ブラウザのタブのファビコン（`/icon/32`）は、ログインしていなくても返す。ブラウザはこれらを Cookie を付けずに読むので、止めるとホーム画面に追加できない・全画面で開けないことがある。中身はアプリの名前・アイコン・色だけで、ノートの情報を入れない。外すのは決まった URL だけにする（その下や似た URL は守ったまま）
- 前提（崩れたら見直す）：`src/proxy.ts` の `matcher` から外した場所（`/api/auth/`、`/_next/static/`、`/_next/image`、上のマニフェストとアイコン・ファビコン）は守られない。アイコンの大きさを足す・変えたら、`src/app/icon.tsx` の id と `matcher` を合わせる。マニフェストとアイコンに、ノートの情報を入れない。ノートの画像などを足すときも、`matcher` から外さない。ページの中に、ログインを飛ばす入口を作らない
- 当てはまる場所：`src/proxy.ts`、`src/lib/access.ts`、`src/app/` のすべてのページ、`src/app/manifest.ts`・`icon.tsx`・`apple-icon.tsx`

### 見つからないノートは、Proxy で 404 にする
- 理由：Cache Components では、ページの枠を先に送った時点でステータスが 200 に決まり、ページの中の `notFound()` では 404 にできない。ページより前の `src/proxy.ts` で、`/notes/` の下の URL がノートの一覧にあるか確かめ、なければ同じ URL のまま `status: 404` で組み立てる（画面はページの `not-found.tsx` のまま）
- Proxy の出力には `outputFileTracingIncludes` が効かず、本番では `content/` を読めない。そこで `next.config.ts` が、ビルドのときにノートのパスの一覧（`listNotePaths`）を環境変数 `NOTE_PATHS` として Proxy に埋め込む。URL とパスを合わせる処理（`src/lib/note-url.ts`）は、ページの `readNote` と同じものを使う
- 前提（崩れたら見直す）：ノートはビルドのときに読む。ノートを足したら再ビルドが要る（`npm run dev` も起動し直す。起動し直すまで、足したノートは Proxy で 404 になる）。実行のたびに読む作りに変えたら、Proxy での確かめ方を見直す。ページが `notFound()` を呼ぶ条件（`readNote` がないとする URL）と、Proxy が 404 にする条件は同じにしておく
- 当てはまる場所：`src/proxy.ts`、`next.config.ts` の `env`、`src/lib/note-url.ts`、`src/lib/notes.ts` の `readNote`・`listNotePaths`

### 画像を返す入口は、コンテンツフォルダの中の画像だけを返す
- ノートの画像は、ノートの HTML に入れず、`/files/<コンテンツフォルダからのパス>` の URL で返す（`src/app/files/[...path]/route.ts`）。本文の画像の相対パスは、変換のときにこの URL に書き換える（`src/lib/markdown.ts` が kinari-md の `renderMarkdown` に渡す `resolve`）。対象の拡張子と Content-Type、URL の形は `src/lib/note-files.ts` の1か所に置き、変換と入口の両方が使う
- 返すのは、ノートの一覧と同じく読み込んだときに集めた、対象の拡張子（png・jpg・jpeg・gif・webp・svg）のファイルだけ。URL からファイルのパスを組み立てない。名前が「.」で始まるファイル・フォルダは集めないので返さない
- 理由：ファイルを返す入口は、作りを間違えると、コンテンツフォルダの外やノート以外のファイル（`.env` など）を読ませる穴になる。集めた一覧の中だけを探せば、`..` などを書かれても外は読めない。svg は直接開くとスクリプトが動きうるので、`Content-Security-Policy: sandbox` を付けて返す
- 前提（崩れたら見直す）：ログインの確かめは `src/proxy.ts` に任せている。`matcher` から `/files/` を外すと、ログインしていなくても画像が見える。画像の種類を足すときは `src/lib/note-files.ts` だけを直す。ノートを置く場所を変えたら、`outputFileTracingIncludes` も合わせる（「`content/` をサーバーの出力に入れる」）
- 当てはまる場所：`src/app/files/[...path]/route.ts`、`src/lib/notes.ts` の `readContentFile`、`src/lib/note-files.ts`、`src/lib/note-images.ts`、`src/lib/markdown.ts`、`src/proxy.ts` の `matcher`

### 保管庫には決まりに合うものだけを置く
- コンテンツフォルダは保管庫の `notes/` の中。`notes/` の外は読まず、検査もしない。一番上には `index.md` と分類のフォルダ（資格・実践・基礎・スポット）だけを置く。資格・実践・基礎の直下は教材のフォルダ、スポットの直下はテーマのフォルダ（中は自由）。分類の名前と順は `src/lib/note-categories.json` の1か所に置き、ノートの一覧（`src/lib/notes.ts` が一番上をこの順に並べ、分類にない名前は後ろに出す）と検査が読む。理由：`.mjs` の検査は `.ts` を読めないので両方が読める JSON にし、書き写して「検査に通るのに並ばない」ずれが起きないようにする
- 置いてよいのは、ノート（`.md`）と、アプリが表示できる画像（`src/lib/note-files.ts` と同じ種類）だけ。名前が「.」で始まるもの（`.obsidian/`・`.github/`・`.gitignore`・`.claude/` など）は、どの階層でも検査で飛ばし（中も見ない）、合わないものにしない。名前と並び・書き方の決まりは `docs/content-rules.md`
- `scripts/check-content.mjs` がコンテンツフォルダを検査する。ビルドの最初に `scripts/prepare-content.mjs` が流し（「ノートはビルドの最初に保管庫から取ってくる」）、合わないものがあればビルドを失敗にする。手元では `npm run check:content -- <保管庫のフォルダ>`（引数がなければ `CONTENT_DIR`、それもなければ `content/`）。`npm run lint` では流さない（アプリのリポジトリに `content/` がないため）
- 理由：アプリは対象外のファイルを読まないので、置いても表示されず、教材を作るときの作業ファイルが紛れ込むだけになる。「.」で始まるものはアプリがもともと読まず、保管庫には Obsidian・Git・作業の設定（`.obsidian/` など）が要るので飛ばす。リンク切れは `next build` では警告だけで止まらないので、検査で止める。検査をビルドの中で流すので、検査とアプリの版がいつも一致する
- 前提（崩れたら見直す）：検査はアプリの読み方（`src/lib/notes.ts` が「.」で始まるものを飛ばす、`src/lib/note-files.ts` の画像の種類）を `.mjs` に書き写している。これらを変えたら、検査も合わせる。リンクと画像の行き先の決め方（`src/lib/note-links.ts`・`note-images.ts`）も検査が書き写しているので、Markdown の変換を kinari-md に任せても、この決め方は md-leaf に置き、`src/lib/markdown.ts` から kinari-md の `resolve` に渡す（ノートの URL とコンテンツフォルダの決まりは md-leaf のもので、kinari-md は知らない）。`e2e/fixtures/` のテスト用のフォルダは検査しない（画面のテストは `npx next build` を直接呼ぶ）
- 当てはまる場所：保管庫、`src/lib/note-categories.json`、`scripts/check-content.mjs`、`scripts/prepare-content.mjs`、`package.json` の `build`・`check:content`、`src/lib/notes.ts`・`note-files.ts`・`note-links.ts`・`note-images.ts`・`markdown.ts`
