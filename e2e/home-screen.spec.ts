import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { extractAppColors, type AppColors } from "../src/lib/token-colors";
import { clickWhenHydrated, waitForHydration } from "./hydration";
import { logIn } from "./session";
import { allowedTestEmail } from "./test-env";

// ホーム画面に追加するときにブラウザが読むもの。ブラウザは Cookie を付けずに読みにくるので、
// テストもログインせずに読む（docs/design.md「ログインしていなければ、ログインの画面以外を出さない」）
test.describe("ホーム画面に追加するための情報", () => {
  test("ログインしていなくても、マニフェストが読め、名前・全画面・最初のページ・アイコンが入っている", async ({
    request,
  }) => {
    const res = await request.get("/manifest.webmanifest", { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    const manifest = await res.json();
    expect(manifest).toMatchObject({
      name: "md-leaf",
      short_name: "md-leaf",
      display: "standalone",
      start_url: "/",
      scope: "/",
    });

    const icons: { src: string; sizes: string; purpose?: string }[] = manifest.icons;
    expect(icons.map((icon) => icon.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    expect(icons.some((icon) => icon.purpose === "maskable")).toBe(true);
    for (const icon of icons) {
      const image = await request.get(icon.src, { maxRedirects: 0 });
      expect(image.status(), icon.src).toBe(200);
      expect(image.headers()["content-type"], icon.src).toBe("image/png");
    }
  });

  test("ログインしていなくても、iPhone のホーム画面のアイコンが読める", async ({ request }) => {
    const res = await request.get("/apple-icon", { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
  });

  test("アイコンの画像", async ({ request }) => {
    const res = await request.get("/icon/512");
    expect(await res.body()).toMatchSnapshot("app-icon.png");
  });

  test("ログインしていなくても、ブラウザのタブのファビコン（若葉）が読め、ページの head から指されている", async ({
    request,
    page,
  }) => {
    const res = await request.get("/icon/32", { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    expect(await res.body()).toMatchSnapshot("favicon.png");

    await page.goto("/login");
    const hrefs = await page
      .locator('head link[rel="icon"]')
      .evaluateAll((links) => links.map((link) => new URL((link as HTMLLinkElement).href).pathname));
    expect(hrefs).toContain("/icon/32");
    expect(hrefs).not.toContain("/favicon.ico");
  });

  // ログインの確かめから外すのは、決まった URL だけ
  for (const path of ["/manifest.json", "/icon/192/x", "/icon/32/x", "/apple-icon-x"]) {
    test(`ログインしていなければ、似た URL（${path}）はログインの画面へ移る`, async ({
      request,
    }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(307);
      const location = new URL(res.headers()["location"] ?? "", "http://localhost");
      expect(location.pathname).toBe("/login");
    });
  }
});

// 時刻や電池の部分の色（theme-color）は、そのときの bg。色はトークンファイルから取り出したもの（src/lib/token-colors.ts）
test.describe("時刻や電池の部分の色", () => {
  let colors: AppColors;
  test.beforeAll(async () => {
    colors = extractAppColors(await readFile(join(process.cwd(), "src/styles/tokens.css"), "utf8"));
  });

  function themeColor(page: Page) {
    return page.locator('head meta[name="theme-color"]');
  }

  async function chooseTheme(page: Page, name: "ライト" | "ダーク") {
    const choices = page.getByRole("radiogroup", { name: "テーマ" });
    if (!(await choices.isVisible())) {
      await clickWhenHydrated(page.getByRole("banner").getByRole("button", { name: "テーマ" }));
    }
    await choices.getByRole("radio", { name }).click();
  }

  test("ログインしていないときも、端末の設定に合わせた bg になる", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/login");
    await expect(themeColor(page)).toHaveAttribute("content", colors.darkBg);
    await page.emulateMedia({ colorScheme: "light" });
    await expect(themeColor(page)).toHaveAttribute("content", colors.lightBg);
  });

  test("ライトでは bg、枠でダークを選ぶとダークの bg になり、ノートを移ってもそのまま", async ({
    context,
    baseURL,
    page,
  }) => {
    await logIn(context, baseURL, allowedTestEmail);
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expect(themeColor(page)).toHaveCount(1);
    await expect(themeColor(page)).toHaveAttribute("content", colors.lightBg);

    await chooseTheme(page, "ダーク");
    await expect(themeColor(page)).toHaveAttribute("content", colors.darkBg);
    await page.keyboard.press("Escape");

    await waitForHydration(page.locator(".note-body"));
    await page.getByRole("article").getByRole("link", { name: "Docker のメモ" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Docker のメモ" })).toBeVisible();
    await expect(themeColor(page)).toHaveCount(1);
    await expect(themeColor(page)).toHaveAttribute("content", colors.darkBg);

    await chooseTheme(page, "ライト");
    await expect(themeColor(page)).toHaveAttribute("content", colors.lightBg);
  });
});
