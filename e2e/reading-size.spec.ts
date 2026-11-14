import { expect, test, type Page } from "@playwright/test";
import { clickWhenHydrated } from "./hydration";
import { interceptNavigation, waitForAppShell } from "./navigation";
import { logIn } from "./session";
import { allowedTestEmail } from "./test-env";

// src/components/reading-size.ts の READING_SIZE_KEY と同じ。テストはアプリのコードを読み込まないので、ここにも書く
const READING_SIZE_KEY = "md-leaf-reading-size";
const GIT_NOTE = "/notes/実践/開発/Git ブランチの運用メモ";

/** ページのスクリプトより前に、ブラウザに選んだ大きさを保存しておく */
async function saveReadingSize(page: Page, size: string) {
  await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [
    READING_SIZE_KEY,
    size,
  ] as const);
}

function fontSize(page: Page, selector: string) {
  return page
    .locator(selector)
    .first()
    .evaluate((element) => getComputedStyle(element).fontSize);
}

test.describe("開いたときの本文の文字の大きさ", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await logIn(context, baseURL, allowedTestEmail);
  });

  test("14px を保存して開くと、<body> ができた時点で 14px が当たっている（16px からちらつかない）", async ({
    page,
  }) => {
    await saveReadingSize(page, "14");
    // <body> が DOM に入った瞬間の <html> の --reading-size を記録する。描く前の状態を見るため
    await page.addInitScript(() => {
      const record = window as unknown as { sizeAtBody?: string };
      const observer = new MutationObserver(() => {
        if (document.body) {
          record.sizeAtBody = document.documentElement.style.getPropertyValue("--reading-size");
          observer.disconnect();
        }
      });
      observer.observe(document, { childList: true, subtree: true });
    });
    await page.goto(GIT_NOTE);
    expect(
      await page.evaluate(() => (window as unknown as { sizeAtBody?: string }).sizeAtBody),
    ).toBe("14px");
  });

  test("14px を保存して開くと、本文の段落は 14px で、上の帯・ノートの一覧の文字は変わらない", async ({
    page,
  }) => {
    await page.goto(GIT_NOTE);
    await expect(page.locator(".note-body p").first()).toBeVisible();
    const bannerBefore = await fontSize(page, "header nav");
    const treeBefore = await fontSize(page, "aside a");

    await saveReadingSize(page, "14");
    await page.reload();
    await expect(page.locator(".note-body p").first()).toBeVisible();
    expect(await fontSize(page, ".note-body p")).toBe("14px");
    expect(await fontSize(page, "header nav")).toBe(bannerBefore);
    expect(await fontSize(page, "aside a")).toBe(treeBefore);
  });
});

const PC = { width: 1440, height: 900 };

function sizeButton(page: Page) {
  return page.getByRole("banner").getByRole("button", { name: "文字の大きさ" });
}

function sizeChoices(page: Page) {
  return page.getByRole("radiogroup", { name: "本文の文字の大きさ" });
}

function choice(page: Page, name: "14px" | "16px") {
  return sizeChoices(page).getByRole("radio", { name });
}

async function openSizeMenu(page: Page) {
  await clickWhenHydrated(sizeButton(page));
  await expect(sizeChoices(page)).toBeVisible();
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

// 本文の Mermaid の図。ブラウザで描くので、撮る前にこれで描き終わるのを待つ
async function waitForDiagram(page: Page) {
  await expect(page.locator(".note-body .mermaid-figure svg")).toBeVisible();
  await expect(page.locator(".note-body pre[data-mermaid]")).toHaveCount(0);
}

test.describe("上の帯の「Aa」を出す画面", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await logIn(context, baseURL, allowedTestEmail);
  });

  test("ノートでは、スマホでも PC でも「Aa」が出る", async ({ page }) => {
    await page.goto(GIT_NOTE);
    await expect(sizeButton(page)).toBeVisible();
    await page.setViewportSize(PC);
    await expect(sizeButton(page)).toBeVisible();
  });

  test("index.md のホームでは「Aa」が出る", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "ノートの入り口" })).toBeVisible();
    await expect(sizeButton(page)).toBeVisible();
  });

  test("ノートが見つからない画面では「Aa」が出ない", async ({ page }) => {
    await page.goto("/notes/実践/開発/ないノート");
    await expect(page.getByRole("heading", { name: "ノートが見つかりません" })).toBeVisible();
    await expect(sizeButton(page)).toBeHidden();
  });

  // 画面を移るあいだ、Next.js は前のページ（本文の .reading）を隠して残すので、それに引きずられて出ないこと
  async function goToNoteFromHome(page: Page, mode: "hold" | "break") {
    await interceptNavigation(page, GIT_NOTE, mode);
    await page.goto("/");
    await expect(sizeButton(page)).toBeVisible();
    const shell = waitForAppShell(page, (path) => path.startsWith("/notes/"));
    await clickWhenHydrated(page.getByRole("button", { name: "ノートの一覧を開く" }));
    const drawer = page.getByRole("dialog", { name: "ノートの一覧" });
    await drawer.getByRole("button", { name: "実践" }).click();
    await drawer.getByRole("button", { name: "開発" }).click();
    await shell;
    await drawer.getByRole("link", { name: "Git ブランチの運用メモ" }).click();
  }

  test("ホームからノートへ移る読み込み中は「Aa」が出ない", async ({ page }) => {
    await goToNoteFromHome(page, "hold");
    await expect(page.getByRole("main").getByRole("status", { name: "読み込み中" })).toBeVisible();
    await expect(sizeButton(page)).toBeHidden();
  });

  test("ホームからノートへ移って読み込めなかったときは「Aa」が出ない", async ({ page }) => {
    await goToNoteFromHome(page, "break");
    await expect(page.locator('[role="alert"][data-tone="danger"]')).toContainText(
      "ノートを読み込めませんでした",
    );
    await expect(sizeButton(page)).toBeHidden();
  });

  test(
    "index.md がないホームでは「Aa」が出ない",
    { tag: "@content-no-index" },
    async ({ page }) => {
      await page.goto("/");
      await expect(
        page.getByRole("main").getByRole("heading", { level: 1, name: "ノート" }),
      ).toBeVisible();
      await expect(sizeButton(page)).toBeHidden();
    },
  );

  test("ノートが1つもないホームでは「Aa」が出ない", { tag: "@content-empty" }, async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "ノートがまだありません" })).toBeVisible();
    await expect(sizeButton(page)).toBeHidden();
  });
});

test.describe("「Aa」の枠で選ぶ", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await logIn(context, baseURL, allowedTestEmail);
  });

  test("押すと枠が出て、見出しと 14px・16px が並び、一度も選んでいなければ 16px が選ばれている", async ({
    page,
  }) => {
    await page.goto(GIT_NOTE);
    await openSizeMenu(page);
    await expect(sizeButton(page)).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("本文の文字の大きさ", { exact: true })).toBeVisible();
    await expect(sizeChoices(page).getByRole("radio")).toHaveText(["14px", "16px"]);
    await expect(choice(page, "16px")).toBeChecked();
    await expect(choice(page, "14px")).not.toBeChecked();
    await waitForDiagram(page);
    await expect(page).toHaveScreenshot("note-font.png");
  });

  test("14px を押すと、読み込み直さずにすぐ本文が 14px になり、上の帯・一覧・枠の文字は変わらず、枠は開いたまま", async ({
    page,
  }) => {
    await page.goto(GIT_NOTE);
    await openSizeMenu(page);
    const bannerBefore = await fontSize(page, "header nav");
    const treeBefore = await fontSize(page, "aside a");
    const choiceBefore = await fontSize(page, '[role="radiogroup"] [role="radio"]');
    expect(await fontSize(page, ".note-body p")).toBe("16px");
    await markPage(page);

    await choice(page, "14px").check();
    expect(await fontSize(page, ".note-body p")).toBe("14px");
    expect(await fontSize(page, "header nav")).toBe(bannerBefore);
    expect(await fontSize(page, "aside a")).toBe(treeBefore);
    expect(await fontSize(page, '[role="radiogroup"] [role="radio"]')).toBe(choiceBefore);
    await expect(sizeChoices(page)).toBeVisible();
    await expect(choice(page, "14px")).toBeChecked();
    expect(await notReloaded(page)).toBe(true);
  });

  test("14px を選ぶと、別のノートへ移っても、開き直しても 14px で、枠でも 14px が選ばれている", async ({
    page,
  }) => {
    await page.goto(GIT_NOTE);
    await openSizeMenu(page);
    await choice(page, "14px").check();
    await page.keyboard.press("Escape");

    await page.getByRole("article").getByRole("link", { name: "リリースの手順" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "リリースの手順" })).toBeVisible();
    expect(await fontSize(page, ".note-body p")).toBe("14px");

    await page.reload();
    await expect(page.locator(".note-body p").first()).toBeVisible();
    expect(await fontSize(page, ".note-body p")).toBe("14px");
    await openSizeMenu(page);
    await expect(choice(page, "14px")).toBeChecked();
  });

  test("14px で開いた画面は、本文・見出し・コード・表が小さく、上の帯は変わらない", async ({
    page,
  }) => {
    await saveReadingSize(page, "14");
    await page.goto(GIT_NOTE);
    await expect(sizeButton(page)).toBeVisible();
    await waitForDiagram(page);
    await expect(page).toHaveScreenshot("note-size-14.png", { fullPage: true });
  });

  test("枠の外を押すと閉じる", async ({ page }) => {
    await page.goto(GIT_NOTE);
    await openSizeMenu(page);
    await page.getByRole("heading", { level: 2, name: "流れ" }).click();
    await expect(sizeChoices(page)).toBeHidden();
    await expect(sizeButton(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("Esc で閉じる", async ({ page }) => {
    await page.goto(GIT_NOTE);
    await openSizeMenu(page);
    await page.keyboard.press("Escape");
    await expect(sizeChoices(page)).toBeHidden();
  });

  test("もう一度「Aa」を押すと閉じる", async ({ page }) => {
    await page.goto(GIT_NOTE);
    await openSizeMenu(page);
    await sizeButton(page).click();
    await expect(sizeChoices(page)).toBeHidden();
  });
});
