<!--
変更の仕様のひな形。コピーして docs/changes/<年-月-日>-<何をするか>.md を作る（例：2026-09-17-add-due-date.md）。
「なぜ」〜「調べたこと」は、AIが下書きし、人間がプロトタイプを触って直し、合意して決める（/dev-proto）。「画面」のスクリーンショットは、合意したときに足す。
「設計」以降はAIが書いて実装まで進め、人間は機能の PR でレビューする（/dev-build）。
スクリーンショットは、このファイルと同じ名前のフォルダに置く（例：2026-09-17-add-due-date/list-empty.png）。
-->

# 開発を始められる（#1）

## なぜ

md-leaf の目的・画面・技術は立ち上げ（/dev-start）で決まったが、アプリのひな形もテストの仕組みもまだない。テストを先に書いて機能（#2〜#8）を作り進められるように、開発の土台を作る。

## 影響する今の仕様

- なし（`docs/specs/` に書く動きはない）

## 使う場面

1. 開発する人（AI）が #2 の作業を始め、テストを1つ書いて実行すると、失敗したことが結果に出る。実装するとそのテストが通る
2. 開発する人が PR を出すと、テスト・Lint・型チェック・画面の画像を比べるテストが自動で走り、結果が PR に出る。画像が変わっていれば、基準・今回・差分の画像を見られる
3. 開発する人（AI）がファイルを編集すると、そのファイルだけが自動で整形される

## 受け入れ条件

- ひな形のアプリを手元で起動でき、ブラウザで開くと、決めたトークンの地の色と文字で、空のページが出る
- テストを実行するコマンドがあり、失敗するテストを書くと失敗、直すと成功と出る
- Lint と型チェックを実行するコマンドがあり、問題があれば失敗する
- 本番のトークンファイルがあり、プロトタイプで決めた色（ライト・ダーク）・文字・余白・角の丸み・影・文字の大きさの値がそこにだけある。`docs/tokens.css` は消え、`docs/ui.md` の「トークン」にトークンファイルの場所が書かれている
- トークンにない値（`p-[13px]`、`#3366ff` など）を書けない、または Lint で見つかる
- 本番の画面を撮るコマンドがあり、画面と状態ごとの画像を撮り直せる。画像を比べるテストのコマンドがあり、基準と違えば失敗する
- PR を出すと、テスト・Lint・型チェック・画像を比べるテストが自動で走り、結果が PR に出る。画像を比べるテストが失敗したら、基準・今回・差分の画像を PR の結果から見られる。CI では基準の画像を更新しない
- ファイルを編集すると、そのファイルだけが整形・Lint される。対象でないファイル（`.md`、画像など）では何もしない。失敗しても作業は止まらない。Windows で動く
- `CLAUDE.project.md` の「技術」「よく使うコマンド」が埋まっていて、書かれたコマンドがそのまま動く
- `README.md` に、このアプリが何か、手元での起動の仕方、要る環境変数の名前（値は書かない）が書かれている
- 本番（デプロイ先）につなぐのは #2 のあと。ログインがないままノートを本番に出さない

## 画面

- なし（土台づくりなので、プロトタイプは作らない）
- 立ち上げで合意した画面の画像は `docs/agreed-screens/` にある（各機能の Issue から参照する）

## やらないこと

- ログイン（#2）、ノートの読み込みと表示（#3 以降）などの機能
- 本番へのデプロイと、本番の環境変数の設定（#2 でログインと一緒に行う）
- `content/` へのノートの配置

## 先に要る機能

- なし

## 決まっていないこと

- [x] 言語・フレームワーク → Next.js（App Router）＋ TypeScript
- [x] デプロイ先 → Vercel（Hobby）
- [x] 認証の仕方 → Auth.js ＋ Google ログイン。許可するメールアドレスは環境変数に並べる（#2 で作る）
- [x] データベース → 使わない
- [x] ノートの置き場所 → このリポジトリの `content/`。ビルドのときに HTML にする
- [x] UI の部品ライブラリ → 使わない（Tailwind CSS ＋ 自分で作る部品）
- [x] 状態管理のライブラリ → 使わない
- [x] ファイル名・フォルダ名に日本語が入るか → 入る。URL にも日本語のまま使う

## 技術の確認表

| 項目 | 当てはまるもの | 決めた人 |
| --- | --- | --- |
| 保存するデータ | なし（データベースは使わない。ノートはリポジトリの `content/` に置く） | 人（/dev-start） |
| 外部サービス | Vercel（デプロイ先）、Google（ログイン。つなぐのは #2）、GitHub Actions（CI） | 人（/dev-start） |
| 認証・権限 | この Issue ではなし。#2 で Auth.js ＋ Google、許可するメールアドレスは環境変数 | 人（/dev-start） |
| 費用 | なし（Vercel Hobby、GitHub Actions の無料の範囲、Google のログインは無料） | 人（/dev-start） |
| 個人情報 | この Issue ではなし。#2 で、許可するメールアドレスを Vercel の環境変数にだけ置く | 人（/dev-start） |
| デプロイの環境 | Vercel。ビルドは Next.js の標準。環境変数の設定は #2 | 人（/dev-start） |
| 新しいライブラリ | 人が決めた：Next.js、TypeScript、Tailwind CSS。AIが決めて書く：テスト（Vitest、Testing Library）、画像を比べるテスト（Playwright）、Lint・整形の道具 | 人／AI |
| 取り消せない操作 | なし | AI |
| 共通の部品・トークン | 本番のトークンファイルを作る（`docs/tokens.css` から移す） | 人（/dev-start で合意したトークン） |
| `docs/design.md` の決まり | 「全体の構成」を書く（フォルダ、層の分け方） | AI（設計で書く） |

## 調べたこと

---

## 設計

### 構成（仕上げで `docs/design.md` の「全体の構成」に移す）

| 場所 | 置くもの |
| --- | --- |
| `src/app/` | 画面（App Router のページとレイアウト）。データの読み込みと組み立ては `src/lib/` を呼ぶだけにする |
| `src/components/` | 画面の部品（複数の画面で使うもの） |
| `src/lib/` | 画面に関係しない処理（#3 以降：ノートの読み込み、Markdown から HTML への変換など）。React に依存しない |
| `src/styles/tokens.css` | 本番のトークンファイル。値はここにだけ書く |
| `src/app/globals.css` | Tailwind とトークンの読み込みだけ。値は書かない |
| `content/` | ノート（#3 以降）。読み込む場所は環境変数 `CONTENT_DIR` で変えられるようにし、画面の画像はテスト用のコンテンツ（`e2e/fixtures/content/`）で撮る（#3 で作る） |
| `src/**/*.test.ts(x)` | 単体・部品のテスト（Vitest）。テストするファイルの隣に置く |
| `e2e/` | 画面を動かすテストと、画面の画像を比べるテスト（Playwright） |
| `scripts/` | 開発用のスクリプト（画像を撮る Docker の起動、トークンにない値の検査） |
| `.claude/hooks/` | 編集したあとの整形のフック |

- 理由：ノートの変換（`src/lib/`）は条件の分かれ道が多く、テストを書く中心になる。React から切り離しておくと、画面を通さずにテストできる
- 前提（崩れたら見直す）：ノートはビルドのときに HTML にする（`docs/overview.md`）。実行のたびに読む作りに変えたら、層の分け方を見直す

### ひな形

- `create-next-app` で、TypeScript・App Router・Tailwind CSS・ESLint・`src/`・`@/*` の別名で作る。既存のファイル（`README.md`、`.gitignore` など）とぶつかるので、別のフォルダで作ってから移す。`.gitignore` は今のものに Next.js の分を足す
- 空のページ（`src/app/page.tsx`）：bg の地、text の文字、font-ui で、中身はアプリの名前だけ。#3 でホームに置き換える
- `<html lang="ja">`

### テスト

- 単体・部品：Vitest ＋ Testing Library ＋ jsdom。`npm test` で一度だけ実行する（watch しない）
- 画面：Playwright。`e2e/` に置く。サーバーは `next build` のあと `next start` で立てる（開発サーバーより表示が安定するため）。ポートは環境変数 `PORT`（既定 3100）で変えられるようにする（worktree で並べて撮るため）

### トークン

- `docs/tokens.css` を `src/styles/tokens.css` へ移し、`docs/tokens.css` は消す。中身（値）は変えない
- `docs/ui.md` の「トークン」に場所を書く
- `@theme` の `--*: initial` で Tailwind の既定の値を消してあるので、トークンにない段階のクラス（`bg-red-500`、`text-3xl` など）は CSS が作られない
- トークンにない値を Lint で見つける
  - クラス：eslint-plugin-better-tailwindcss の `no-unknown-classes`（トークンにないクラス）と `no-restricted-classes`（`[` を含む任意の値のクラス）
  - TSX の `style` やリテラル：`no-restricted-syntax` で、色コード（`#` で始まる16進）と `px` の値を止める
  - CSS：`scripts/check-tokens.mjs`（依存なし）で、トークンファイル以外の `.css` にある色コード・`rgb()`・`px` を見つける。`npm run lint` で ESLint と一緒に動かす

### 画面を撮る仕組み

- Playwright の `snapshotPathTemplate` で、基準の画像を `docs/specs/screens/<名前>.png` に置く（OS 名を入れない）
- 撮る環境：Playwright 公式の Docker イメージ `mcr.microsoft.com/playwright:v<入れた Playwright のバージョン>-noble`
- `scripts/playwright-docker.mjs`（node で起動）：手元ではイメージを起動し、リポジトリをマウントして、中で `npm ci` と `npx playwright test` を走らせる
  - `node_modules` と Next.js のビルドの出力は、名前つきの Docker ボリュームに分ける（Windows で入れた `node_modules` は Linux で動かず、手元の `.next` とも混ざらないように）
  - 環境変数 `CI` があるとき（CI のコンテナの中）は、Docker を起動せずにそのまま `npx playwright test` を走らせる
- コマンド：`npm run screenshots`（`--update-snapshots` を付けて撮り直す）、`npm run test:visual`（比べるだけ）。どちらも、後ろに付けた引数（ファイル名など）を Playwright に渡し、撮る画面を絞れるようにする
- 今撮る画面は、空のページ1つ（`home-placeholder.png`）。#3 でホームを作るときに置き換える
- アニメーションは止める（`animations: "disabled"`）。日時を使う画面ができたら、そのときに固定する

### CI（`.github/workflows/ci.yml`）

- `pull_request` で動かす。ジョブは2つ
  - `check`：ubuntu、`npm ci`、`npm test`、`npm run lint`、`npm run typecheck`
  - `visual`：`container:` に上と同じイメージ。`npm ci`、`npm run test:visual`。失敗したら `playwright-report/` をアーティファクトに残す
- CI では `--update-snapshots` を使わない

### 編集したあとのフック

- `.claude/settings.json` の `PostToolUse`（matcher `Edit|Write`）で、`node .claude/hooks/format-on-edit.mjs` を `command` と `args` で起動する
- スクリプトは、入力の `tool_input.file_path` の拡張子が `.ts .tsx .js .mjs .cjs .jsx .css .json` のときだけ、そのファイルに Prettier（`--write`）と ESLint（`--fix`、JS・TS だけ）をかける。`npx` を使わず、`node_modules` の中の起動ファイルを `node` で直接起動する（Windows で `.cmd` を起動できないため）
- 何があっても exit 0 で終える（作業を止めない）。Lint のエラーはテストと CI で見る
- どのファイルにかけるかの判断は関数に分けてテストする

### コマンド（`CLAUDE.project.md` の「よく使うコマンド」に書く）

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー |
| `npm test` | 単体・部品のテスト |
| `npm run lint` | ESLint とトークンの検査 |
| `npm run typecheck` | 型チェック |
| `npm run test:visual` | 画像を比べるテスト（Docker） |
| `npm run screenshots` | 画像を撮り直す（Docker） |
| `npm run format` | 全体を整形 |

### デプロイ

- この Issue では Vercel につながない。`vercel.json` などのデプロイの設定も作らない（#2 でログインと一緒に）

## AIが決めたこと

- テスト：Vitest ＋ Testing Library ＋ jsdom。比べた案：Jest（ESM と TypeScript の設定が要り、Next.js 16 の構成では Vitest のほうが設定が少ない）
- 画像を比べるテスト・画面を動かすテスト：Playwright。比べた案：Cypress（画像の比較が標準になく、公式の Docker イメージで撮る仕組みが Playwright のほうが整っている）
- Lint：ESLint（create-next-app の `eslint-config-next`）。比べた案：Biome（Next.js の規則と Tailwind のクラスの検査がそろわない）
- 整形：Prettier。比べた案：Biome（上と同じ理由で、ESLint と組み合わせる Prettier にした）
- トークンにないクラスの検査：eslint-plugin-better-tailwindcss。比べた案：eslint-plugin-tailwindcss（Tailwind CSS v4 の CSS での設定に対応しきれていない）、何もしない（受け入れ条件を満たせない）
- CSS の値の検査：依存なしの小さなスクリプト。比べた案：Stylelint（検査したいのが色コードと px の2つだけで、道具を足すほどではない）
- フォルダ：`src/` の下に `app`・`components`・`lib` を置く（上の「構成」）
- 撮る画面のサーバー：`next build` ＋ `next start`。比べた案：`next dev`（初回の変換が遅く、表示が揺れやすい）
- TypeScript は 5.9、ESLint は 9（create-next-app 16.4.6 が入れる版のまま）。比べた案：TypeScript 7・6.1 以降（typescript-eslint 8 が `<6.1.0` までしか対応していない）、ESLint 10（eslint-config-next が使うプラグインの対応がそろっていない）
- 部品のテストのために `@testing-library/jest-dom`（`toBeInTheDocument` などの判定）も入れる。比べた案：入れない（DOM の判定を毎回自分で書くことになる）
- 画像を撮る幅：スマホの 390×844（Chromium だけ）。比べた案：PC の幅（主に使うのはスマホ）、複数の幅の project を並べる（PC の幅の画面は一部だけなので、テストの中で幅を変えて撮る）
- 撮るコンテナの `npm ci` は、`package-lock.json` が前回と変わったときだけ行う（名前つきボリュームに印を置く）。比べた案：毎回 `npm ci`（1回ごとに時間がかかる）
- 名前つきボリュームの名前に、リポジトリの場所から作った値を入れる（worktree で並べても `node_modules`・`.next` が混ざらない）。比べた案：固定の名前（並べたときにビルドの出力がぶつかる）
- Prettier の改行コードは `endOfLine: "auto"`（ファイルごとに今のものを残す）。比べた案：`lf`（`core.autocrlf=true` の Windows で取り出した CRLF のファイルが、整形のたびに改行コードだけ書き換わる）
- Prettier の 1 行の長さは 100。比べた案：既定の 80（今のコードの書き方と合わず、整形の差分が増える）
- Prettier の対象から、`docs/`・`package-lock.json`・テンプレートのファイル（`.claude/agents/`・`.claude/skills/`・`guard.mjs`・`.claude/settings.json` など）を外す。比べた案：全部にかける（テンプレートとの差分が整形だけで増え、取り込むときにぶつかる）
- フックは、リポジトリの外のファイルと、もうないファイルには何もかけない。比べた案：拡張子だけで判断する（リポジトリの設定が効かない場所まで整形してしまう）

## 確かめ方

| 受け入れ条件 | 確かめ方 |
| --- | --- |
| ひな形を手元で起動でき、トークンの地の色と文字で空のページが出る | 触って確かめる（`npm run dev` を開く）。画像は `docs/specs/screens/home-placeholder.png` |
| テストのコマンドがあり、失敗・成功が出る | テスト（フックの判断・トークンの検査のテストが `npm test` で走る）＋ 触って確かめる（わざと失敗するテストを書いて戻す） |
| Lint と型チェックのコマンドがあり、問題があれば失敗する | 触って確かめる（`npm run lint`・`npm run typecheck` に、わざと問題を入れて戻す） |
| 本番のトークンファイルがあり、値はそこにだけ。`docs/tokens.css` は消え、`docs/ui.md` に場所 | コードを見て確かめる（`src/styles/tokens.css`、`docs/ui.md` の「トークン」） |
| トークンにない値を書けない、または Lint で見つかる | テスト（`scripts/check-tokens` のテスト）＋ 触って確かめる（`p-[13px]`・`#3366ff` を書いて `npm run lint`） |
| 画面を撮るコマンドと、比べるテストのコマンドがある | 触って確かめる（`npm run screenshots`、`npm run test:visual`） |
| PR で自動で走り、失敗したら画像を見られる。CI で基準を更新しない | 触って確かめる（この PR の CI）＋ コードを見て確かめる（`.github/workflows/ci.yml`） |
| 編集したファイルだけが整形・Lint され、対象外では何もせず、失敗しても止まらない。Windows で動く | テスト（どのファイルにかけるかの判断）＋ 触って確かめる（Windows で実際に編集して整形されること） |
| `CLAUDE.project.md` の「技術」「よく使うコマンド」が埋まり、そのまま動く | 触って確かめる（`test-runner` が書かれたコマンドで実行できる） |
| `README.md` に、何か・起動の仕方・環境変数の名前 | コードを見て確かめる（`README.md`） |
| 本番につなぐのは #2 のあと | コードを見て確かめる（デプロイの設定がない） |

## タスク

- [x] ひな形と、テストが実行できる（Next.js のひな形、Vitest・Testing Library、`npm test`・`npm run lint`・`npm run typecheck`、`docs/overview.md` の「技術」の確認、`CLAUDE.project.md` の「技術」「よく使うコマンド」、空のページ）ができたら完了
- [x] 本番のトークンファイル（`src/styles/tokens.css` に移し、`docs/tokens.css` を消し、`docs/ui.md` に場所を書き、空のページがトークンの色と文字で出る）と、トークンにない値の Lint（eslint-plugin-better-tailwindcss、`no-restricted-syntax`、`scripts/check-tokens.mjs` とそのテスト）ができたら完了
- [x] 画面を撮る仕組み（Playwright、`scripts/playwright-docker.mjs`、`npm run screenshots`・`npm run test:visual`、`docs/specs/screens/home-placeholder.png`、`CLAUDE.project.md` へのコマンドの追加）ができたら完了
- [x] CI（`.github/workflows/ci.yml` の `check` と `visual`、失敗したときのレポートのアーティファクト）ができたら完了
- [x] 編集したあとのフック（`.claude/hooks/format-on-edit.mjs` とそのテスト、`.claude/settings.json` の `PostToolUse`、Prettier と `npm run format`）と、`.claude/rules/testing.md` の `paths:` ができたら完了
- [x] `README.md`（何か、主な機能、技術、手元での起動の仕方、要る環境変数の名前、開発コマンド）ができたら完了
