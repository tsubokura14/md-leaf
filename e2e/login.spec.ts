import { expect, test, type Page } from "@playwright/test";
import { clickWhenHydrated } from "./hydration";
import { logIn } from "./session";
import { allowedTestEmail } from "./test-env";

// Google へは実際には行かず、向かったリクエストの URL だけを確かめる
async function captureGoogleRequest(page: Page): Promise<() => Promise<URL>> {
  await page.route("https://accounts.google.com/**", (route) =>
    route.fulfill({ status: 200, body: "google" }),
  );
  const request = page.waitForRequest((req) =>
    req.url().startsWith("https://accounts.google.com/"),
  );
  return async () => new URL((await request).url());
}

// Next.js の画面遷移の読み上げ（next-route-announcer）も role="alert" を持つので、帯は data-tone で見分ける
function banner(page: Page) {
  return page.locator('[role="alert"][data-tone]');
}

test.describe("ログインの画面", () => {
  test("ログイン前：帯がなく、「Google でログインする」が出る", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Google でログインする" })).toBeVisible();
    await expect(banner(page)).toHaveCount(0);
    await expect(page).toHaveScreenshot("login-default.png", { fullPage: true });
  });

  test("ログイン前（ダーク）", async ({ page }) => {
    // ダークを選んで覚えておいたブラウザで開く（キーは src/components/theme.ts の THEME_KEY）
    await page.addInitScript(() => window.localStorage.setItem("md-leaf-theme", "dark"));
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Google でログインする" })).toBeVisible();
    await expect(page).toHaveScreenshot("login-default-dark.png", { fullPage: true });
  });

  test("ログイン前（PC）", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Google でログインする" })).toBeVisible();
    await expect(page).toHaveScreenshot("login-default-pc.png", { fullPage: true });
  });

  test("押すと Google のログインへ進む", async ({ page }) => {
    const googleUrl = await captureGoogleRequest(page);
    await page.goto("/login");
    await page.getByRole("button", { name: "Google でログインする" }).click();

    const url = await googleUrl();
    expect(new URL(url.searchParams.get("redirect_uri") ?? "").pathname).toBe(
      "/api/auth/callback/google",
    );
    expect(url.searchParams.get("prompt")).toBeNull();
  });

  test("最初に開こうとした URL を、ログインのあとの戻り先に引き継ぐ", async ({ page, context }) => {
    const googleUrl = await captureGoogleRequest(page);
    await page.goto(`/login?callbackUrl=${encodeURIComponent("/notes/x")}`);
    await page.getByRole("button", { name: "Google でログインする" }).click();
    await googleUrl();

    const cookies = await context.cookies();
    const callback = cookies.find((c) => c.name === "authjs.callback-url");
    expect(new URL(decodeURIComponent(callback?.value ?? "")).pathname).toBe("/notes/x");
  });

  test("許可していないアカウント：warning の帯と、別のアカウントのボタン", async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([
      { name: "denied-email", value: "someone@example.com", url: baseURL },
    ]);
    const googleUrl = await captureGoogleRequest(page);
    await page.goto("/login?error=AccessDenied");

    const alert = banner(page);
    await expect(alert).toHaveAttribute("data-tone", "warning");
    await expect(alert).toContainText("このアカウントでは見られません");
    await expect(alert).toContainText(
      "someone@example.com は、許可されていません。許可したアカウントでログインしてください。",
    );
    const button = page.getByRole("button", { name: "別の Google アカウントでログインする" });
    await expect(button).toBeVisible();
    await expect(page).toHaveScreenshot("login-denied.png", { fullPage: true });

    await button.click();
    expect((await googleUrl()).searchParams.get("prompt")).toBe("select_account");
  });

  test("ログインに失敗：danger の帯と「Google でログインする」", async ({ page }) => {
    await page.goto("/login?error=OAuthCallbackError");

    const alert = banner(page);
    await expect(alert).toHaveAttribute("data-tone", "danger");
    await expect(alert).toContainText("ログインできませんでした");
    await expect(alert).toContainText("時間をおいて、もう一度試してください。");
    await expect(page.getByRole("button", { name: "Google でログインする" })).toBeVisible();
    await expect(page).toHaveScreenshot("login-error.png", { fullPage: true });
  });

  test("AccessDenied でもアドレスの Cookie がなければ、danger の帯", async ({ page }) => {
    await page.goto("/login?error=AccessDenied");
    await expect(banner(page)).toHaveAttribute("data-tone", "danger");
    await expect(page.getByRole("button", { name: "Google でログインする" })).toBeVisible();
  });
});

test.describe("ログインしているかでの移動", () => {
  for (const path of [
    "/",
    "/notes/x",
    `/notes/${encodeURIComponent("実践")}/${encodeURIComponent("開発")}/${encodeURIComponent("Git ブランチの運用メモ")}`,
    "/no-such-page",
  ]) {
    test(`ログインしていなければ、${path} はログインの画面へ移り、本文を返さない`, async ({
      request,
    }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(307);
      const location = new URL(res.headers()["location"] ?? "", "http://localhost");
      expect(location.pathname).toBe("/login");
      expect(await res.text()).not.toContain("md-leaf");
    });
  }

  test("開こうとした URL を、ログインの画面に引き継ぐ", async ({ page }) => {
    await page.goto("/notes/x");
    await expect(page).toHaveURL(/\/login\?/);
    expect(new URL(page.url()).searchParams.get("callbackUrl")).toBe("/notes/x");
  });

  test("ログイン中にログインの画面を開くと、ホームへ移る", async ({ page, context, baseURL }) => {
    await logIn(context, baseURL, allowedTestEmail);
    await page.goto("/login");
    await expect(page).toHaveURL(new URL("/", baseURL).href);
  });

  test("許可から外れたアドレスのログイン中の Cookie では、ホームはログインの画面へ移り、ログインの画面はそのまま出る", async ({
    page,
    context,
    baseURL,
  }) => {
    await logIn(context, baseURL, "removed@example.com");
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("button", { name: "Google でログインする" })).toBeVisible();
  });
});

test.describe("ログアウト", () => {
  test("ログイン中はノートの一覧のいちばん下にアドレスと「ログアウト」が出て、押すとログインの画面へ移り、そのあとホームもログインの画面へ移る", async ({
    page,
    context,
    baseURL,
  }) => {
    await logIn(context, baseURL, allowedTestEmail);
    await page.goto("/");
    // スマホでは、ノートの一覧を ☰ で開く
    await clickWhenHydrated(page.getByRole("button", { name: "ノートの一覧を開く" }));
    const tree = page.getByRole("dialog", { name: "ノートの一覧" });
    await expect(tree.getByText(allowedTestEmail)).toBeVisible();

    await tree.getByRole("button", { name: "ログアウト" }).click();
    await expect(page).toHaveURL(new URL("/login", baseURL).href);

    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
