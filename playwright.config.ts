import { defineConfig, devices } from "@playwright/test";
import { testServerEnv } from "./e2e/test-env";

// worktree などでフォルダを分けて並べて撮るとき、ポートをぶつけないために変えられるようにする
const port = Number(process.env.PORT ?? 3100);

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
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      // 主に使うのはスマホなので、スマホの幅で撮る。PC の幅の画面は、テストの中で幅を変えて撮る
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    // 開発サーバーは初回の変換が遅く表示が揺れやすいので、本番と同じビルドで撮る
    command: `npx next build && npx next start -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    // テストのときだけの値（e2e/test-env.ts）
    env: testServerEnv,
    timeout: 300_000,
  },
});
