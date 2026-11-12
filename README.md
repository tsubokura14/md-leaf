<!--
この README は、GitHub でリポジトリを見た人向けの説明。
このようなコメントは GitHub では表示されない。
開発の進め方と立ち上げの手順は docs/how-we-work.md にある。
-->

# md-leaf

PC の Obsidian で書いた Markdown のノートを、スマホでも読みやすく見られるようにする、自分専用の閲覧アプリ。ノートはこのリポジトリに置き、狭い画面でも読みやすく表示する。

本番は Vercel で動かす。デプロイの手順は「[本番（Vercel）へのデプロイ](#本番vercelへのデプロイ)」にある。

## 主な機能

- Google アカウントでログインできる（許可したメールアドレスだけ）
- フォルダのツリーからノートを選べる（日本語のファイル名・フォルダ名も、URL にそのまま使う）
- コンテンツフォルダの一番上に `index.md` があれば、最初にそれを開く（なければノートの一覧と案内を出す）
- ノートを読みやすく表示できる（フロントマターの `title` を見出しに使う、コールアウト、コードのハイライト、表、数式、Mermaid、画像）
- ノート内の目次を出せる（見出しを押すと、その見出しへ移る）
- ノートの中の相対リンクから、別のノートへ移れる（リンク先がなければ「ノートが見つかりません」と出す）
- ライトとダークを切り替えられる
- 本文の文字の大きさを 14px・16px から選べる（標準は 16px。端末ごとに覚えておく）
- ログアウトできる（ノートの一覧のいちばん下から）

詳しい動きは [docs/specs/](docs/specs/) にある。

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

ログインに、次の環境変数を使う。値はリポジトリに書かない（コード・文書・コミットのどこにも書かない）。

| 名前 | 内容 |
| --- | --- |
| `AUTH_SECRET` | ログインの Cookie を暗号化する秘密の値。`npx auth secret` などで作る |
| `AUTH_GOOGLE_ID` | Google Cloud で作った OAuth のクライアントの ID |
| `AUTH_GOOGLE_SECRET` | 同じクライアントの秘密の値 |
| `ALLOWED_EMAILS` | ログインを許可するメールアドレス。カンマ区切りで、大文字・小文字は区別しない。空ならだれもログインできない |

手元では、`.env.example` を `.env.local` にコピーして値を入れる（`.env.local` はコミットしない）。手元でログインするには、下の「Google のログインの設定」で、リダイレクト URI に `http://localhost:3000/api/auth/callback/google` を登録しておく。

## 本番（Vercel）へのデプロイ

人間が一度だけ行う。ログインできるのは本番の URL と手元（localhost）だけで、Vercel のプレビュー（PR ごとの URL）はログインの画面までしか見られない。

### 1. Vercel のプロジェクトを作る

1. Vercel にログインし、このリポジトリを読み込んで、プロジェクトを作る（プランは Hobby）
2. 本番の URL（例：`https://<プロジェクト名>.vercel.app`）を確かめる。次の Google の設定で使う

### 2. Google のログインの設定

1. Google Cloud のコンソールでプロジェクトを作る（または選ぶ）
2. 「API とサービス」の「OAuth 同意画面」を設定する（ユーザーの種類は「外部」。テスト中のままなら、ログインに使う Google アカウントを「テストユーザー」に足す）
3. 「認証情報」で「OAuth クライアント ID」を作る。アプリケーションの種類は「ウェブ アプリケーション」
4. 「承認済みのリダイレクト URI」に、次の2つを登録する
   - `https://<本番のドメイン>/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google`
5. できたクライアントの ID と秘密の値を控える（`AUTH_GOOGLE_ID`・`AUTH_GOOGLE_SECRET` に使う）

プレビューの URL は登録しない。登録しないことで、プレビューではログインできないようにしている。

### 3. Vercel の環境変数の設定

Vercel のプロジェクトの「Settings」→「Environment Variables」で、次のように設定する。

| 名前 | 置く環境 |
| --- | --- |
| `AUTH_SECRET` | Production と Preview |
| `AUTH_GOOGLE_ID` | Production と Preview |
| `AUTH_GOOGLE_SECRET` | Production と Preview |
| `ALLOWED_EMAILS` | Production だけ |

- `AUTH_SECRET`・`AUTH_GOOGLE_ID`・`AUTH_GOOGLE_SECRET` を Preview にも置くのは、プレビューでもログインの画面が出るようにするため
- `ALLOWED_EMAILS` は Production にだけ置く。Preview に置かないので、プレビューではだれもログインできない
- 許可するアドレスを足すときは、`ALLOWED_EMAILS` を変えて再デプロイする。外したアドレスは、次に開いたときに締め出される

### 4. デプロイして確かめる

1. 環境変数を設定したら、Vercel で本番を再デプロイする（以後は main に入るたびに本番へ反映される）
2. 本番の URL を開き、許可したアカウントでログインできること、許可していないアカウントでは入れないことを確かめる
3. 手元（`npm run dev`）でもログインできることを確かめる
4. PR のプレビューの URL では、ログインの画面までしか見られないことを確かめる

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
