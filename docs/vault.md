# 保管庫とつなぐ

ノートの正本は、学習用の保管庫（アプリとは別の非公開のリポジトリ `learning-vault`）にある。この文書は、保管庫とアプリをつなぐ手順で、人が一度だけ行う（鍵が切れたときの直し方も）。動きの決まりは `docs/design.md` の「ノートはビルドの最初に保管庫から取ってくる」、保管庫に置くものの決まりは `docs/content-rules.md`。

つないだあとの流れは次のとおり。

1. PC の Obsidian で書き、保管庫で commit して main に push する
2. 保管庫の GitHub Actions が、Vercel の Deploy Hook を呼ぶ
3. Vercel がアプリの main をビルドする。ビルドの最初に `scripts/prepare-content.mjs` が、保管庫の main を `content/` に取って検査する
4. 検査に通れば、数分で本番に反映される。通らない・保管庫を読めないときはビルドが失敗し、本番は前の版のまま残り、Vercel から失敗のメールが届く

アプリのリポジトリの PR のプレビューも、同じく保管庫の今のノートでビルドされる。

## 始める前に

- 保管庫が検査に通る状態にしておく。手元で `npm run check:content -- <保管庫のフォルダ>` を実行し、何も出ないことを確かめる。通らないまま本番をビルドすると、失敗し続ける（本番は前の版のまま）
- 保管庫の `.gitignore` に `.obsidian/workspace*.json` を書いておく（端末ごとに変わるファイルを push しない）

## 1. 保管庫を読むだけの鍵を作る

GitHub の fine-grained のトークンを作る。

1. GitHub の「Settings」→「Developer settings」→「Personal access tokens」→「Fine-grained tokens」→「Generate new token」
2. 次のように設定する
   - Token name：何に使うか分かる名前（例：`md-leaf の Vercel のビルド`）
   - Resource owner：保管庫の持ち主
   - Expiration：1年
   - Repository access：「Only select repositories」で `learning-vault` だけを選ぶ
   - Permissions：Repository permissions の「Contents」を「Read-only」にする（「Metadata」の Read-only は自動で付く）。ほかは付けない
3. できたトークンを控える（画面を閉じると二度と見られない）。リポジトリ・文書・チャットには書かない

## 2. Vercel の環境変数に入れる

Vercel のアプリのプロジェクトの「Settings」→「Environment Variables」で、次の2つを足す。

| 名前 | 値 | 置く環境 |
| --- | --- | --- |
| `VAULT_REPO` | `<持ち主>/learning-vault`（`https://github.com/` と `.git` は付けない） | Production と Preview |
| `VAULT_TOKEN` | 1 で作ったトークン | Production と Preview |

- Preview にも置くのは、PR のプレビューも保管庫のノートでビルドするため。置かないと、プレビューのビルドが失敗する
- `CONTENT_DIR` は Vercel には置かない（ビルドで取った `content/` を読む）
- 足したら、Vercel で本番を再デプロイし、ビルドのログに「保管庫 `<VAULT_REPO>` を content/ に取ります」が出て、成功することを確かめる

## 3. Deploy Hook を作り、保管庫の secret に入れる

保管庫の push から、Vercel のビルドを始めるための URL を作る。

1. Vercel のアプリのプロジェクトの「Settings」→「Git」→「Deploy Hooks」で、名前（例：`learning-vault`）とブランチ `main` を入れて作る
2. できた URL を控える。この URL を知っていればだれでもビルドを始められるので、鍵と同じく扱い、リポジトリ・文書には書かない
3. 保管庫のリポジトリの「Settings」→「Secrets and variables」→「Actions」→「New repository secret」で、名前 `VERCEL_DEPLOY_HOOK_URL`、値に 2 の URL を入れる

### Vercel の Git のつながりを変えたとき

アプリのリポジトリを移したなどで、Vercel のプロジェクトの「Settings」→「Git」でつながりを切ってつなぎ直したら、「Deploy Hooks」が残っているかを見る。なくなっていたら、上の 1〜3 で作り直し、保管庫の secret `VERCEL_DEPLOY_HOOK_URL` を新しい URL に入れ替える（「Update secret」）。入れ替えたら、下の「5. 確かめる」の 1 を行う。

- Deploy Hook の URL が変わっても、保管庫のワークフロー（`.github/workflows/deploy.yml`）は secret を読むだけなので、直さなくてよい
- `VAULT_REPO`・`VAULT_TOKEN` などの環境変数はプロジェクトに付いているので、つなぎ直しても残る

## 4. 保管庫に GitHub Actions のワークフローを置く

保管庫に `.github/workflows/deploy.yml` を置く（「.」で始まるので、検査もアプリも見ない）。main に push したら Deploy Hook を呼ぶだけにする。検査はアプリのビルドの中で走るので、ここでは流さない。

```yaml
name: アプリを再ビルドする

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Vercel の Deploy Hook を呼ぶ
        run: curl --fail --silent --show-error --request POST "$DEPLOY_HOOK_URL"
        env:
          DEPLOY_HOOK_URL: ${{ secrets.VERCEL_DEPLOY_HOOK_URL }}
```

- `workflow_dispatch` は、保管庫を変えずに再ビルドしたいとき（鍵を入れ直したあとなど）に、保管庫の「Actions」の画面から手で流すため

## 5. 確かめる

1. 保管庫で1行直して push する。保管庫の「Actions」でワークフローが成功し、数分後に本番に直したものが出ることを確かめる
2. わざとリンクを切って push する。Vercel から失敗のメールが届き、本番が前の版のままであることを確かめる。直して push し直す
3. アプリのリポジトリの PR のプレビューのビルドのログで、保管庫を取ったことと検査が通ったことを確かめる

## 手元で保管庫を読む

手元では保管庫を GitHub から取らず、手元の保管庫のフォルダを読む（push していない書きかけも確かめられる）。

1. アプリのリポジトリの `.env.local` に、手元の保管庫のフォルダを書く（例：`CONTENT_DIR=../learning-vault`。`.env.example` にも同じ例がある）
2. `npm run dev` で画面を確かめ、`npm run check:content -- <保管庫のフォルダ>` で検査する（`check:content` は `.env.local` を読まないので、フォルダを引数で渡す。`npm run build` は `.env.local` を読み、同じフォルダを検査してからビルドする）

`CONTENT_DIR` を書かずに `npm run dev`・`npm run build`・`npm run typecheck` を動かすと、コンテンツフォルダがないと出て止まる。

## 鍵が切れたとき・ビルドが保管庫を取れないとき

ビルドのログに「保管庫 `<VAULT_REPO>` を取れませんでした」または「保管庫を取るための環境変数 … がありません」が出て失敗する。本番は前の版のまま残っている。

1. 原因を確かめる
   - 鍵の期限切れ（GitHub から期限の前にメールが届く）、鍵を消した、`learning-vault` を選び忘れた、Contents の権限がない
   - `VAULT_REPO` の書き間違い、保管庫の名前を変えた・消した
   - `VAULT_REPO`・`VAULT_TOKEN` を Production か Preview に置き忘れた
2. 鍵が原因なら、GitHub の「Fine-grained tokens」で同じトークンを「Regenerate token」する（または 1 の手順で作り直す）。期限はまた1年にする
3. Vercel の `VAULT_TOKEN`（または `VAULT_REPO`）を新しい値に変える
4. 再ビルドする（保管庫の「Actions」で `アプリを再ビルドする` を手で流すか、Vercel で本番を再デプロイする）。ビルドが成功することを確かめる
