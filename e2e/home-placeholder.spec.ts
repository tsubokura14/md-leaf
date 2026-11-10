import { expect, test } from "@playwright/test";

// 空のページ。ホームを作るとき（#3）に、ホームの画面と状態ごとの画像に置き換える
test("空のページ", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "md-leaf" })).toBeVisible();
  await expect(page).toHaveScreenshot("home-placeholder.png", { fullPage: true });
});
