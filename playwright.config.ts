import { defineConfig, devices } from "@playwright/test";
import { testServerEnv } from "./e2e/test-env";

// worktree などでフォルダを分けて並べて撮るとき、ポートをぶつけないために変えられるようにする。
// テスト用のコンテンツフォルダごとに、ここから1つずつ大きいポートを使う
const basePort = Number(process.env.PORT ?? 3100);

// 画面の状態ごとのテスト用のコンテンツフォルダ（e2e/fixtures/）。
// ノートはビルドのときに HTML にするので、フォルダごとに別のビルドとサーバーを立てる
// （docs/design.md「画面の状態は、テスト用のコンテンツフォルダで作る」）。
// content 以外のフォルダで動かすテストには、フォルダの名前のタグ（例：{ tag: "@content-empty" }）を付ける
const contents = ["content", "content-no-index", "content-empty", "content-many"] as const;
const tagged = contents.filter((name) => name !== "content");

const servers = contents.map((name, index) => ({ name, port: basePort + index }));

export default defineConfig({
  testDir: "e2e",
  // 基準の画像は docs/specs/screens/ に置き、「今の画面」としても使う。
  // 撮るのはいつも同じ Docker イメージ（scripts/playwright-docker.mjs）なので、名前に OS 名を入れない
  snapshotPathTemplate: "docs/specs/screens/{arg}{ext}",
  forbidOnly: !!process.env.CI,
  reporter: [["list"], ["html", { open: "never" }]],
  expect: {
    toHaveScreenshot: { animations: "disabled" },
  },
  use: {
    trace: "retain-on-failure",
  },
  projects: servers.map(({ name, port }) => ({
    name,
    // 主に使うのはスマホなので、スマホの幅で撮る。PC の幅の画面は、テストの中で幅を変えて撮る
    use: {
      ...devices["Desktop Chrome"],
      viewport: { width: 390, height: 844 },
      baseURL: `http://localhost:${port}`,
    },
    ...(name === "content"
      ? { grepInvert: new RegExp(tagged.map((t) => `@${t}\\b`).join("|")) }
      : { grep: new RegExp(`@${name}\\b`) }),
  })),
  webServer: servers.map(({ name, port }) => ({
    // 開発サーバーは初回の変換が遅く表示が揺れやすいので、本番と同じビルドで撮る
    command: `npx next build && npx next start -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    env: {
      // テストのときだけの値（e2e/test-env.ts）
      ...testServerEnv,
      CONTENT_DIR: `e2e/fixtures/${name}`,
      // 並べてビルドするので、出力先を分けて上書きし合わないようにする。
      // .next/ の中に置くのは、Docker の名前つきボリュームに入れるため（scripts/playwright-docker.mjs）。
      // next build は出力先の型の場所を tsconfig.json の include に書き足すので、フォルダごとの分を先に書いてある。
      // フォルダを足したら、tsconfig.json にも足す
      DIST_DIR: `.next/e2e/${name}`,
    },
    timeout: 300_000,
  })),
});
