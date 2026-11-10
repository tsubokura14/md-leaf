<!--
この README は、GitHub でリポジトリを見た人向けの説明。
このようなコメントは GitHub では表示されない。
開発の進め方と立ち上げの手順は docs/how-we-work.md にある。
-->

# md-leaf

PC の Obsidian で書いた Markdown のノートを、スマホでも読みやすく見られるようにする、自分専用の閲覧アプリ。ノートはこのリポジトリに置き、狭い画面でも読みやすく表示する。

本番（Vercel）には、まだデプロイしていない。

## 主な機能

ここに書くのは作る予定の機能で、今は開発を始めるための土台だけがある。

- Google アカウントでログインできる（許可したメールアドレスだけ）
- フォルダのツリーからノートを選べる（日本語のファイル名・フォルダ名も、URL にそのまま使う）
- コンテンツフォルダの一番上に `index.md` があれば、最初にそれを開く
- ノートを読みやすく表示できる（フロントマターの `title` を見出しに使う、コールアウト、コードのハイライト、表、数式、Mermaid、画像）
- ノート内の目次を出せる
- ノートの中の相対リンクから、別のノートへ移れる
- ライトとダークを切り替えられる
- 本文の文字の大きさを変えられる（端末ごとに覚えておく）
- ログアウトできる

## 使っている技術

- Next.js（App Router）＋ TypeScript
- Tailwind CSS（UI の部品ライブラリは使わない）
- 認証：Auth.js ＋ Google ログイン
- ノートの置き場所：このリポジトリの `content/`。ビルドのときに HTML にする
- データベース：使わない
- テスト：Vitest ＋ Testing Library、画像を比べるテストは Playwright
- デプロイ先：Vercel（Hobby）

選んだ理由は [docs/overview.md](docs/overview.md) の「技術」にある。

## セットアップ

### 必要なもの

- Node.js 24
- Docker Desktop（画像を比べるテストと、画面の撮り直しに使う）

### 手順

```bash
git clone https://github.com/tsubokura14/md-leaf.git
cd md-leaf
npm install
npm run dev
```

http://localhost:3000 で開く。

### 環境変数

今は、要る環境変数はない。
ログイン（#2）を作るときに、Google ログインと許可するメールアドレスのための環境変数を足し、その名前をここと `.env.example` に書く。値はリポジトリに書かない。

## 開発コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバーを起動 |
| `npm test` | 単体・部品のテストを実行 |
| `npm run lint` | Lint |
| `npm run typecheck` | 型チェック |
| `npm run test:visual` | 画像を比べるテスト（Docker） |
| `npm run screenshots` | 画面の画像を撮り直す（Docker） |
| `npm run format` | コードをまとめて整形 |

詳しい使い方は [CLAUDE.project.md](CLAUDE.project.md) の「よく使うコマンド」にある。

## 開発の進め方

このリポジトリは、**人間が主導するハーネスエンジニアリング** で開発している。
何を作るかを決めること、レビュー、マージは人間がする。AI（Claude Code・GitHub Copilot）は、決まった流れ・決まり・止める仕組み（ハーネス）の中で、設計の下書きと実装をする。
詳しくは [docs/how-we-work.md](docs/how-we-work.md) にある。

## ドキュメント

| ファイル | 内容 |
| --- | --- |
| [docs/overview.md](docs/overview.md) | 目的、やらないこと、技術、用語 |
| [docs/specs/](docs/specs/) | アプリが今どう動くか、今の画面 |
| [docs/design.md](docs/design.md) | アプリが今どう作られているか（複数の場所に関わる決まりと、その理由） |
| [docs/ui.md](docs/ui.md) | 見た目の決まり（色・余白・文字・部品の使い分け） |
| [docs/changes/](docs/changes/) | 機能ごとの変更の記録（何を・なぜ・どう変えたか） |
| [docs/libraries/](docs/libraries/) | コードを読むために必要なライブラリの前提知識 |
| [docs/how-we-work.md](docs/how-we-work.md) | 開発の進め方 |
| [AGENTS.md](AGENTS.md) | AIへのルール（Claude Code と GitHub Copilot が読む） |
| [.claude/skills/](.claude/skills/) | AIが作業で使う手順と決まり（テストの基準、画面の撮り方など） |
