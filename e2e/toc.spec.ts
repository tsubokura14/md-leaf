import { expect, test, type Locator, type Page } from "@playwright/test";
import { clickWhenHydrated, waitForHydration } from "./hydration";
import { logIn } from "./session";
import { allowedTestEmail } from "./test-env";

const PC = { width: 1440, height: 900 };
const GIT_NOTE = "/notes/実践/開発/Git ブランチの運用メモ";
const RELEASE_NOTE = "/notes/実践/開発/リリースの手順";
// 上の帯の高さ（h-14）
const TOP_BAR_HEIGHT = 56;

function tocButton(page: Page) {
  return page.getByRole("banner").getByRole("button", { name: "目次を開く" });
}

// スマホ・PC（幅 xl 未満）で下から出る目次
function sheet(page: Page) {
  return page.getByRole("dialog", { name: "目次" });
}

// 広い PC（幅 xl 以上）で本文の右に出す目次
function sideToc(page: Page) {
  return page.getByRole("navigation", { name: "目次" });
}

async function openToc(page: Page) {
  await clickWhenHydrated(tocButton(page));
  await expect(sheet(page)).toBeVisible();
}

// 本文の見出し（目次にも同じ名前のボタンがあるので、本文に絞る）
function bodyHeading(page: Page, name: string) {
  return page.locator(".note-body").getByRole("heading", { name, exact: true });
}

// 見出しが上の帯に隠れず、上の帯のすぐ下にある
async function expectJustBelowTopBar(heading: Locator) {
  await expect
    .poll(async () => (await heading.boundingBox())?.y ?? -1)
    .toBeGreaterThanOrEqual(TOP_BAR_HEIGHT);
  const box = await heading.boundingBox();
  expect(box && box.y).toBeLessThanOrEqual(TOP_BAR_HEIGHT + 24);
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

test.beforeEach(async ({ context, baseURL }) => {
  await logIn(context, baseURL, allowedTestEmail);
});

test.describe("スマホの目次", () => {
  test("上の帯の「Aa」の左のボタンで、下から目次が出て、h2・h3 が本文の順に並ぶ", async ({
    page,
  }) => {
    await page.goto(GIT_NOTE);
    const button = tocButton(page);
    const sizeButton = page.getByRole("banner").getByRole("button", { name: "文字の大きさ" });
    const buttonBox = await button.boundingBox();
    const sizeBox = await sizeButton.boundingBox();
    expect(buttonBox && sizeBox && buttonBox.x < sizeBox.x).toBe(true);

    await expect(sheet(page)).toBeHidden();
    await openToc(page);
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(sheet(page).getByRole("button")).toHaveText([
      "流れ",
      "よく使うコマンド",
      "ブランチ名の決まり",
      "番号を先に書く理由",
      "注意",
      "かかる時間の見積もり",
      "ブランチの図",
    ]);
    await waitForDiagram(page);
    await expect(page).toHaveScreenshot("note-toc.png");
  });

  test("見出しを押すと、目次が閉じ、その見出しが上の帯のすぐ下に来る。読み込み直さず、URL も変えない", async ({
    page,
  }) => {
    await page.goto(GIT_NOTE);
    // 図を描くと、その下の見出しの位置が変わるので、描き終わってから移る
    await waitForDiagram(page);
    await openToc(page);
    await markPage(page);
    await sheet(page).getByRole("button", { name: "ブランチ名の決まり" }).click();
    await expect(sheet(page)).toBeHidden();
    await expectJustBelowTopBar(bodyHeading(page, "ブランチ名の決まり"));
    await expect(page).toHaveURL(encodeURI(GIT_NOTE));
    expect(await notReloaded(page)).toBe(true);
  });

  test("目次で移ったあとの「戻る」は、目次で移る前のページへ戻る", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page.locator(".note-body"));
    await page.getByRole("article").getByRole("link", { name: "Git ブランチの運用メモ" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Git ブランチの運用メモ" }),
    ).toBeVisible();
    await waitForDiagram(page);
    await openToc(page);
    await sheet(page).getByRole("button", { name: "ブランチ名の決まり" }).click();
    await expectJustBelowTopBar(bodyHeading(page, "ブランチ名の決まり"));
    await page.goBack();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { level: 1, name: "ノートの入り口" })).toBeVisible();
  });

  test("幕の外を押すと閉じる", async ({ page }) => {
    await page.goto(GIT_NOTE);
    await openToc(page);
    // 目次より上の、幕のところを押す
    await page.mouse.click(200, 100);
    await expect(sheet(page)).toBeHidden();
    await expect(tocButton(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("Esc で閉じる", async ({ page }) => {
    await page.goto(GIT_NOTE);
    await openToc(page);
    await page.keyboard.press("Escape");
    await expect(sheet(page)).toBeHidden();
  });

  test("折りたたみのコールアウトの中の見出しを押すと、コールアウトを開いてから移る", async ({
    page,
  }) => {
    await page.goto(RELEASE_NOTE);
    const heading = bodyHeading(page, "折りたたみの中の見出し");
    await expect(heading).toBeHidden();
    await openToc(page);
    await sheet(page).getByRole("button", { name: "折りたたみの中の見出し" }).click();
    await expect(heading).toBeVisible();
    await expectJustBelowTopBar(heading);
  });

  test("同じ文字の見出しが2つあっても、押したほうへ移る", async ({ page }) => {
    await page.goto(RELEASE_NOTE);
    await openToc(page);
    await sheet(page).getByRole("button", { name: "確かめること" }).nth(1).click();
    await expectJustBelowTopBar(bodyHeading(page, "確かめること").nth(1));
  });

  test(
    "見出しが多いと、上に幕が見える高さで止まり、「目次」を残して見出しの並びだけがスクロールする",
    { tag: "@content-many" },
    async ({ page }) => {
      await page.goto("/notes/実践/開発/開発のノート 1");
      await openToc(page);
      const box = await sheet(page).boundingBox();
      expect(box && box.y).toBeGreaterThan(TOP_BAR_HEIGHT);
      const label = sheet(page).getByText("目次", { exact: true });
      await expect(label).toBeInViewport();
      const list = sheet(page).getByRole("list");
      expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
      await expect(page).toHaveScreenshot("note-toc-many.png");

      await list.evaluate((el) => el.scrollTo(0, el.scrollHeight));
      await expect(sheet(page).getByRole("button", { name: "困ったときの注意" })).toBeInViewport();
      await expect(label).toBeInViewport();
    },
  );
});

test.describe("広い PC の目次", () => {
  test("本文の右に常に出し、上の帯の目次のボタンは出さない。下までスクロールしても残り、押すと上へ戻る", async ({
    page,
  }) => {
    await page.setViewportSize(PC);
    await page.goto(GIT_NOTE);
    const toc = sideToc(page);
    await expect(toc).toBeVisible();
    await expect(tocButton(page)).toBeHidden();
    const tocBox = await toc.boundingBox();
    const bodyBox = await page.getByRole("article").boundingBox();
    expect(tocBox && bodyBox && tocBox.x > bodyBox.x + bodyBox.width).toBe(true);

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(toc.getByRole("button", { name: "流れ" })).toBeInViewport();
    await clickWhenHydrated(toc.getByRole("button", { name: "流れ" }));
    await expectJustBelowTopBar(bodyHeading(page, "流れ"));
  });
});

test.describe("目次を出さないとき", () => {
  test("見出しのないノートでは、目次のボタンも右の目次も出ない", async ({ page }) => {
    await page.goto("/notes/基礎/読書メモ/積読を減らす");
    await expect(page.getByRole("heading", { level: 1, name: "積読を減らす" })).toBeVisible();
    await expect(tocButton(page)).toBeHidden();
    await page.setViewportSize(PC);
    await expect(sideToc(page)).toHaveCount(0);
  });

  test("ホームの index.md では、ノートと同じに目次を出す", async ({ page }) => {
    await page.goto("/");
    await openToc(page);
    await expect(sheet(page).getByRole("button")).toHaveText(["よく見る", "最近書いたもの"]);
  });

  test("ノートが見つからない画面では、目次のボタンが出ない", async ({ page }) => {
    await page.goto("/notes/実践/開発/ないノート");
    await expect(page.getByRole("heading", { name: "ノートが見つかりません" })).toBeVisible();
    await expect(tocButton(page)).toBeHidden();
  });

  test(
    "index.md がないホームでは、目次のボタンが出ない",
    { tag: "@content-no-index" },
    async ({ page }) => {
      await page.goto("/");
      await expect(
        page.getByRole("main").getByRole("heading", { level: 1, name: "ノート" }),
      ).toBeVisible();
      await expect(tocButton(page)).toBeHidden();
    },
  );
});
