import { expect, test } from "@playwright/test";
import { logIn } from "./session";
import { allowedTestEmail } from "./test-env";

// 空のページと、その下のログアウト。ホームを作るとき（#3）に、ホームの画面と状態ごとの画像に置き換える
test("空のページ", async ({ page, context, baseURL }) => {
  await logIn(context, baseURL, allowedTestEmail);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "md-leaf" })).toBeVisible();
  // ログアウトの部品は後から流し込まれるので、出るまで待ってから撮る
  await expect(page.getByRole("button", { name: "ログアウト" })).toBeVisible();
  await expect(page).toHaveScreenshot("home-placeholder.png", { fullPage: true });
});
