import { expect, test, type Page } from "@playwright/test";
import { clickWhenHydrated, waitForHydration } from "./hydration";
import { logIn } from "./session";
import { allowedTestEmail } from "./test-env";

// src/components/theme.ts の THEME_KEY と同じ。テストはアプリのコードを読み込まないので、ここにも書く
const THEME_KEY = "md-leaf-theme";

/** ページのスクリプトより前に、ブラウザに選んだものを保存しておく */
async function saveTheme(page: Page, theme: string) {
  await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [
    THEME_KEY,
    theme,
  ] as const);
}

/** 保存が禁止されているブラウザと同じく、localStorage に触ると例外を投げるようにする */
async function denyStorage(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("denied", "SecurityError");
      },
    });
  });
}

function html(page: Page) {
  return page.locator("html");
}

/** <html> の印：今出している色（data-theme）と、選んでいるもの（data-theme-choice） */
async function expectTheme(
  page: Page,
  theme: "light" | "dark",
  choice: "system" | "light" | "dark",
) {
  await expect(html(page)).toHaveAttribute("data-theme", theme);
  await expect(html(page)).toHaveAttribute("data-theme-choice", choice);
}

test.describe("開いたときのライト/ダーク", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await logIn(context, baseURL, allowedTestEmail);
  });

  test("一度も選んでいなければ「端末に合わせる」で、端末の設定がダークならダークで出る", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expectTheme(page, "dark", "system");
  });

  test("一度も選んでいなければ、端末の設定がライトならライトで出て、開いているあいだに端末の設定が変わると合わせ直す", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expect(page.getByRole("banner")).toBeVisible();
    await expectTheme(page, "light", "system");
    await page.emulateMedia({ colorScheme: "dark" });
    await expectTheme(page, "dark", "system");
  });

  test("「端末に合わせる」を保存していれば、端末の設定に合わせ、変わると合わせ直す", async ({
    page,
  }) => {
    await saveTheme(page, "system");
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expectTheme(page, "dark", "system");
    await page.emulateMedia({ colorScheme: "light" });
    await expectTheme(page, "light", "system");
  });

  test("知らない値が保存されていれば「端末に合わせる」として扱う", async ({ page }) => {
    await saveTheme(page, "sepia");
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expectTheme(page, "dark", "system");
  });

  test("ライトを選んだあと（前の版の値）は、端末の設定がダークでもライトで出て、変わってもライトのまま", async ({
    page,
  }) => {
    await saveTheme(page, "light");
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expect(page.getByRole("banner")).toBeVisible();
    await expectTheme(page, "light", "light");
    await page.emulateMedia({ colorScheme: "light" });
    await page.emulateMedia({ colorScheme: "dark" });
    await expectTheme(page, "light", "light");
  });

  test("ダークを選んだあと（前の版の値）は、端末の設定がライトでもダークで出る", async ({
    page,
  }) => {
    await saveTheme(page, "dark");
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expectTheme(page, "dark", "dark");
  });

  test("ダークを保存して開くと、<body> ができた時点で <html> が data-theme=dark（ちらつかない）", async ({
    page,
  }) => {
    await saveTheme(page, "dark");
    await page.emulateMedia({ colorScheme: "light" });
    // <body> が DOM に入った瞬間の <html> の印を記録する。描く前の状態を見るため
    await page.addInitScript(() => {
      const record = window as unknown as { themeAtBody?: string | null };
      const observer = new MutationObserver(() => {
        if (document.body) {
          record.themeAtBody = document.documentElement.getAttribute("data-theme");
          observer.disconnect();
        }
      });
      observer.observe(document, { childList: true, subtree: true });
    });
    await page.goto("/");
    expect(
      await page.evaluate(() => (window as unknown as { themeAtBody?: string | null }).themeAtBody),
    ).toBe("dark");
  });

  test("ブラウザに覚えておけないときは、開いた直後から「端末に合わせる」で出る", async ({
    page,
  }) => {
    await denyStorage(page);
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await expectTheme(page, "dark", "system");
  });
});

test.describe("ログインの画面のライト/ダーク", () => {
  test("ダークを保存して開くとダークで出て、切り替えのボタンはない", async ({ page }) => {
    await saveTheme(page, "dark");
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Google でログインする" })).toBeVisible();
    await expectTheme(page, "dark", "dark");
    await expect(page.getByRole("button", { name: /ダークにする|ライトにする/ })).toHaveCount(0);
  });

  test("何も保存していなければ、端末の設定で出る", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Google でログインする" })).toBeVisible();
    await expectTheme(page, "dark", "system");
  });
});

const GIT_NOTE = "/notes/実践/開発/Git ブランチの運用メモ";

function toggle(page: Page, name: "ダークにする" | "ライトにする") {
  return page.getByRole("banner").getByRole("button", { name });
}

// ページを読み込み直すと消える印を置く。あとで残っていれば、読み込み直していない
async function markPage(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __notReloaded?: boolean }).__notReloaded = true;
  });
}

function notReloaded(page: Page) {
  return page.evaluate(
    () => (window as unknown as { __notReloaded?: boolean }).__notReloaded === true,
  );
}

test.describe("上の帯のボタンでの切り替え", () => {
  test.beforeEach(async ({ context, baseURL, page }) => {
    await logIn(context, baseURL, allowedTestEmail);
    await page.emulateMedia({ colorScheme: "light" });
  });

  test("「ダークにする」を押すとダークになり「ライトにする」に変わり、押すとライトに戻る。読み込み直さない", async ({
    page,
  }) => {
    await page.goto(GIT_NOTE);
    await markPage(page);
    await clickWhenHydrated(toggle(page, "ダークにする"));
    await expectTheme(page, "dark", "dark");
    await expect(toggle(page, "ダークにする")).toHaveCount(0);
    await clickWhenHydrated(toggle(page, "ライトにする"));
    await expectTheme(page, "light", "light");
    await expect(toggle(page, "ダークにする")).toBeVisible();
    expect(await notReloaded(page)).toBe(true);
  });

  test("ダークにしたあと、別のノートへ移っても、読み込み直しても、ダークのまま", async ({
    page,
  }) => {
    await page.goto("/");
    await clickWhenHydrated(toggle(page, "ダークにする"));
    await expectTheme(page, "dark", "dark");
    await waitForHydration(page.locator(".note-body"));
    await page.getByRole("article").getByRole("link", { name: "Docker のメモ" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Docker のメモ" })).toBeVisible();
    await expectTheme(page, "dark", "dark");
    await page.reload();
    await expect(toggle(page, "ライトにする")).toBeVisible();
    await expectTheme(page, "dark", "dark");
  });

  test("ブラウザに覚えておけなくても、押すとその場で切り替わり、エラーを出さない", async ({
    page,
  }) => {
    await denyStorage(page);
    const errors: Error[] = [];
    page.on("pageerror", (error) => errors.push(error));
    await page.goto(GIT_NOTE);
    await clickWhenHydrated(toggle(page, "ダークにする"));
    await expectTheme(page, "dark", "dark");
    await expect(toggle(page, "ライトにする")).toBeVisible();
    // 押して選んだので、開いているあいだに端末の設定が変わっても上書きしない
    await page.emulateMedia({ colorScheme: "dark" });
    await page.emulateMedia({ colorScheme: "light" });
    await expectTheme(page, "dark", "dark");
    expect(errors).toEqual([]);
  });
});

// 本文の Mermaid の図の線（矢印）の色と、今の文字の色（トークンの --color-text）を、同じ rgb() の形で返す
function diagramLineAndTextColor(page: Page) {
  return page.evaluate(() => {
    const line = document.querySelector(".note-body .mermaid-figure svg .flowchart-link");
    const probe = document.createElement("span");
    probe.style.color = "var(--color-text)";
    document.body.append(probe);
    const text = getComputedStyle(probe).color;
    probe.remove();
    return { line: line ? getComputedStyle(line).stroke : null, text };
  });
}

test.describe("切り替えたときの Mermaid の図", () => {
  test.beforeEach(async ({ context, baseURL, page }) => {
    await logIn(context, baseURL, allowedTestEmail);
    await page.emulateMedia({ colorScheme: "light" });
  });

  test("ボタンで切り替えると、図の線の色がその場で今の文字の色に変わる", async ({ page }) => {
    await page.goto(GIT_NOTE);
    await expect(page.locator(".note-body .mermaid-figure svg .flowchart-link")).not.toHaveCount(0);
    const light = await diagramLineAndTextColor(page);
    expect(light.line).toBe(light.text);

    await clickWhenHydrated(toggle(page, "ダークにする"));
    await expectTheme(page, "dark", "dark");
    await expect.poll(async () => (await diagramLineAndTextColor(page)).line).not.toBe(light.line);
    const dark = await diagramLineAndTextColor(page);
    expect(dark.line).toBe(dark.text);

    await clickWhenHydrated(toggle(page, "ライトにする"));
    await expect.poll(async () => (await diagramLineAndTextColor(page)).line).toBe(light.text);
  });

  test("「端末に合わせる」で端末の設定が変わると、図の線の色がその場で今の文字の色に変わる", async ({
    page,
  }) => {
    await page.goto(GIT_NOTE);
    await expect(page.locator(".note-body .mermaid-figure svg .flowchart-link")).not.toHaveCount(0);
    await waitForHydration(page.locator(".note-body"));
    const light = await diagramLineAndTextColor(page);
    expect(light.line).toBe(light.text);

    await page.emulateMedia({ colorScheme: "dark" });
    await expectTheme(page, "dark", "system");
    await expect.poll(async () => (await diagramLineAndTextColor(page)).line).not.toBe(light.line);
    const dark = await diagramLineAndTextColor(page);
    expect(dark.line).toBe(dark.text);
  });
});
