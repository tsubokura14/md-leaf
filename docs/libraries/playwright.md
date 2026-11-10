# Playwright

書いた時点のバージョン：1.65.0（`@playwright/test`。Docker イメージ `mcr.microsoft.com/playwright:v1.65.0-noble`）

## 何か

本物のブラウザを動かして、画面を操作するテストや、画面の画像を基準の画像と比べるテストを書く道具。テストの実行の仕組み（`@playwright/test`）と、ブラウザを入れた公式の Docker イメージがある。

- 公式：https://playwright.dev/docs/intro
- 画像を比べるテスト：https://playwright.dev/docs/test-snapshots
- Docker イメージ：https://playwright.dev/docs/docker

## このプロジェクトで使っている部分

- `playwright.config.ts`
  - `testDir: "e2e"`：テストは `e2e/` に置く
  - `snapshotPathTemplate`：基準の画像を `docs/specs/screens/<名前>.png` に置く（OS 名を入れない）
  - `webServer`：`next build` のあと `next start` でサーバーを立てる。ポートは環境変数 `PORT`（既定 3100）
  - `projects`：Chromium だけ。幅はスマホ（390×844）
  - `expect.toHaveScreenshot.animations: "disabled"`：アニメーションを止めて撮る
  - レポーター：`list` と `html`（`playwright-report/` に、基準・今回・差分の画像が入る）
- `expect(page).toHaveScreenshot("<名前>.png")`：画像を撮って基準と比べる
- `--update-snapshots`：`npm run screenshots` は `changed`（違うものとないものを撮り直す）、`npm run test:visual` は `none`（比べるだけ）
- `scripts/playwright-docker.mjs`：公式の Docker イメージの中で `npx playwright test` を走らせる。イメージのタグは、入れた `@playwright/test` のバージョンから作る
  - リポジトリをマウントし、`node_modules` と `.next` はフォルダごとの名前つきボリューム（`md-leaf-<フォルダの値>-node_modules`・`-next`）に分ける
  - `package-lock.json` が前回と変わったときだけ、コンテナの中で `npm ci` する
  - 環境変数 `CI` があるときは、Docker を起動せずにそのまま走らせる

## バージョンを上げるとき

`@playwright/test` を上げると、`scripts/playwright-docker.mjs` が使う Docker イメージのタグは自動で変わる。`.github/workflows/ci.yml` の `container:` のタグは直接書いてあるので、手で同じバージョンに合わせる。ブラウザが変わり画像が少しずれることがあるので、`npm run screenshots` で撮り直して、差分を見てから PR に入れる。
