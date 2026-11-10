import { expect, test, type Page } from "@playwright/test";
import { interceptNavigation, waitForAppShell } from "./navigation";
import { logIn } from "./session";
import { allowedTestEmail } from "./test-env";

const PC = { width: 1440, height: 900 };
const GIT_NOTE = "/notes/開発/Git ブランチの運用メモ";

// 上の帯の場所（パンくず）
function place(page: Page) {
  return page.getByRole("banner").getByRole("navigation", { name: "場所" });
}

// スマホで ☰ から開く一覧
function drawer(page: Page) {
  return page.getByRole("dialog", { name: "ノートの一覧" });
}

// PC で左に常に出す一覧
function sidebar(page: Page) {
  return page.getByRole("complementary", { name: "ノートの一覧" });
}

async function openDrawer(page: Page) {
  await page.getByRole("button", { name: "ノートの一覧を開く" }).click();
  await expect(drawer(page)).toBeVisible();
}

test.beforeEach(async ({ context, baseURL }) => {
  await logIn(context, baseURL, allowedTestEmail);
});

test.describe("ホーム", () => {
  test("index.md があれば、その題と本文を出す。場所は「ホーム」、ページの題は「md-leaf」", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "ノートの入り口" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "よく見る" })).toBeVisible();
    await expect(place(page)).toHaveText("ホーム");
    await expect(page).toHaveTitle("md-leaf");
    await expect(page).toHaveScreenshot("home-index.png", { fullPage: true });
  });

  test("PC：左の一覧で「ホーム」を強調し、フォルダはすべて閉じる", async ({ page }) => {
    await page.setViewportSize(PC);
    await page.goto("/");
    const tree = sidebar(page);
    await expect(tree.getByRole("link", { name: "ホーム" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    for (const name of ["開発", "読書メモ", "日記"]) {
      await expect(tree.getByRole("button", { name })).toHaveAttribute("aria-expanded", "false");
    }
    await expect(tree.getByRole("link", { name: "Git ブランチの運用メモ" })).toBeHidden();
    // ログアウトの部品は後から流し込まれるので、出るまで待ってから撮る
    await expect(tree.getByRole("button", { name: "ログアウト" })).toBeVisible();
    await expect(page).toHaveScreenshot("home-index-pc.png", { fullPage: true });
  });
});

test.describe("ノート", () => {
  test("日本語のままの URL で開け、題・場所・ページの題が出る", async ({ page }) => {
    await page.goto(GIT_NOTE);
    await expect(
      page.getByRole("heading", { level: 1, name: "Git ブランチの運用メモ" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "流れ" })).toBeVisible();
    await expect(place(page)).toHaveText("開発 / Git ブランチの運用メモ");
    await expect(page).toHaveTitle("Git ブランチの運用メモ - md-leaf");
    await expect(page).toHaveScreenshot("note-default.png", { fullPage: true });
  });

  test("PC：☰ を出さず、左の一覧で今のノートを強調し、そのフォルダを開く", async ({ page }) => {
    await page.setViewportSize(PC);
    await page.goto(GIT_NOTE);
    await expect(page.getByRole("button", { name: "ノートの一覧を開く" })).toBeHidden();
    const tree = sidebar(page);
    await expect(tree.getByRole("button", { name: "開発" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(tree.getByRole("button", { name: "日記" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(tree.getByRole("link", { name: "Git ブランチの運用メモ" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(tree.getByRole("link", { name: "ホーム" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(tree.getByRole("button", { name: "ログアウト" })).toBeVisible();
    await expect(page).toHaveScreenshot("note-default-pc.png", { fullPage: true });
  });

  test("PC：フォルダを押すと開閉する", async ({ page }) => {
    await page.setViewportSize(PC);
    await page.goto(GIT_NOTE);
    const tree = sidebar(page);
    const folder = tree.getByRole("button", { name: "読書メモ" });
    await folder.click();
    await expect(folder).toHaveAttribute("aria-expanded", "true");
    await expect(tree.getByRole("link", { name: "積読を減らす" })).toBeVisible();
    await folder.click();
    await expect(folder).toHaveAttribute("aria-expanded", "false");
    await expect(tree.getByRole("link", { name: "積読を減らす" })).toBeHidden();
  });

  test("PC：手で開いたフォルダは、別のノートへ移ると、今のノートを含むフォルダだけを開いた形に戻る", async ({
    page,
  }) => {
    await page.setViewportSize(PC);
    await page.goto(GIT_NOTE);
    const tree = sidebar(page);
    const reading = tree.getByRole("button", { name: "読書メモ" });
    await reading.click();
    await expect(reading).toHaveAttribute("aria-expanded", "true");
    await tree.getByRole("button", { name: "日記" }).click();
    await tree.getByRole("link", { name: "今月の目標" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "今月の目標" })).toBeVisible();
    await expect(tree.getByRole("button", { name: "日記" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(reading).toHaveAttribute("aria-expanded", "false");
    await expect(tree.getByRole("button", { name: "開発" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});

test.describe("ノートの一覧（スマホ）", () => {
  test("☰ で開くと、今のノートを強調し、いちばん下にアドレスと「ログアウト」が出る", async ({
    page,
  }) => {
    await page.goto(GIT_NOTE);
    await expect(drawer(page)).toBeHidden();
    await openDrawer(page);
    const tree = drawer(page);
    await expect(tree.getByRole("link", { name: "Git ブランチの運用メモ" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(tree.getByText(allowedTestEmail)).toBeVisible();
    await expect(tree.getByRole("button", { name: "ログアウト" })).toBeVisible();
    await expect(page).toHaveScreenshot("note-tree.png");
  });

  test("× で閉じる", async ({ page }) => {
    await page.goto(GIT_NOTE);
    await openDrawer(page);
    await drawer(page).getByRole("button", { name: "ノートの一覧を閉じる" }).click();
    await expect(drawer(page)).toBeHidden();
  });

  test("幕の外を押すと閉じる", async ({ page }) => {
    await page.goto(GIT_NOTE);
    await openDrawer(page);
    // 一覧（幅 w-72）の外の、幕のところを押す
    await page.mouse.click(360, 400);
    await expect(drawer(page)).toBeHidden();
  });

  test("Esc で閉じる", async ({ page }) => {
    await page.goto(GIT_NOTE);
    await openDrawer(page);
    await page.keyboard.press("Escape");
    await expect(drawer(page)).toBeHidden();
  });

  test("ノートを押すと、そこへ移って一覧を閉じる", async ({ page }) => {
    await page.goto("/");
    await openDrawer(page);
    await drawer(page).getByRole("button", { name: "開発" }).click();
    await drawer(page).getByRole("link", { name: "リリースの手順" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "リリースの手順" })).toBeVisible();
    await expect(place(page)).toHaveText("開発 / リリースの手順");
    await expect(drawer(page)).toBeHidden();
  });

  test("「ホーム」を押すと、ホームへ移って一覧を閉じる", async ({ page }) => {
    await page.goto(GIT_NOTE);
    await openDrawer(page);
    await drawer(page).getByRole("link", { name: "ホーム" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "ノートの入り口" })).toBeVisible();
    await expect(drawer(page)).toBeHidden();
  });

  test("一覧が多いとき、長い名前は折り返す", { tag: "@content-many" }, async ({ page }) => {
    await page.goto(GIT_NOTE);
    await openDrawer(page);
    await expect(drawer(page).getByRole("button", { name: "ログアウト" })).toBeVisible();
    await expect(page).toHaveScreenshot("note-tree-many.png");
  });
});

test.describe("index.md がないとき", () => {
  test("一覧に「ホーム」を出さない", { tag: "@content-no-index" }, async ({ page }) => {
    await page.setViewportSize(PC);
    await page.goto(GIT_NOTE);
    const tree = sidebar(page);
    await expect(tree.getByRole("link", { name: "Git ブランチの運用メモ" })).toBeVisible();
    await expect(tree.getByRole("link", { name: "ホーム" })).toHaveCount(0);
  });
});

test.describe("ホーム（index.md がない）", () => {
  test(
    "スマホ：見出し「ノート」と案内の下に、ノートの一覧を出す（「ホーム」・ログアウトなし）",
    { tag: "@content-no-index" },
    async ({ page }) => {
      await page.goto("/");
      const main = page.getByRole("main");
      await expect(main.getByRole("heading", { level: 1, name: "ノート" })).toBeVisible();
      await expect(
        main.getByText("読みたいノートを選んでください。", { exact: true }),
      ).toBeVisible();
      await expect(main.getByRole("button", { name: "開発" })).toBeVisible();
      await expect(main.getByRole("link", { name: "ホーム" })).toHaveCount(0);
      await expect(main.getByRole("button", { name: "ログアウト" })).toHaveCount(0);
      await expect(place(page)).toHaveText("ホーム");
      await expect(page).toHaveScreenshot("home-no-index.png", { fullPage: true });
    },
  );

  test("一覧のノートを押すと、そのノートへ移る", { tag: "@content-no-index" }, async ({ page }) => {
    await page.goto("/");
    const main = page.getByRole("main");
    await main.getByRole("button", { name: "開発" }).click();
    await main.getByRole("link", { name: "リリースの手順" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "リリースの手順" })).toBeVisible();
  });

  test(
    "PC：案内「左の一覧から…」だけを出し、本文に一覧を出さない",
    { tag: "@content-no-index" },
    async ({ page }) => {
      await page.setViewportSize(PC);
      await page.goto("/");
      const main = page.getByRole("main");
      await expect(main.getByRole("heading", { level: 1, name: "ノート" })).toBeVisible();
      await expect(main.getByText("左の一覧から、読みたいノートを選んでください。")).toBeVisible();
      await expect(
        main.getByText("読みたいノートを選んでください。", { exact: true }),
      ).toBeHidden();
      await expect(main.getByRole("button", { name: "開発" })).toBeHidden();
    },
  );
});

test.describe("ホーム（ノートが1つもない）", () => {
  test(
    "「ノートがまだありません」と説明を出し、一覧には「ノートがありません」と出す",
    { tag: "@content-empty" },
    async ({ page }) => {
      await page.goto("/");
      const main = page.getByRole("main");
      await expect(main.getByRole("heading", { name: "ノートがまだありません" })).toBeVisible();
      await expect(
        main.getByText("コンテンツフォルダに md ファイルを置くと、ここに一覧が出ます。"),
      ).toBeVisible();
      await expect(page).toHaveScreenshot("home-empty.png", { fullPage: true });
      await openDrawer(page);
      await expect(drawer(page).getByText("ノートがありません")).toBeVisible();
    },
  );
});

test.describe("ノートが見つからない", () => {
  const MISSING = "/notes/開発/ないノート";

  test("ない URL では「ノートが見つかりません」と説明を出し、場所は空", async ({ page }) => {
    await page.goto(MISSING);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "ノートが見つかりません" })).toBeVisible();
    await expect(
      main.getByText("リンク先のノートは、名前が変わったか、消された可能性があります。"),
    ).toBeVisible();
    await expect(place(page)).toHaveText("");
    await expect(page).toHaveScreenshot("note-notfound.png", { fullPage: true });
  });

  test("PC：ノートの一覧では何も強調しない", async ({ page }) => {
    await page.setViewportSize(PC);
    await page.goto(MISSING);
    await expect(page.getByRole("heading", { name: "ノートが見つかりません" })).toBeVisible();
    const tree = sidebar(page);
    await expect(tree.getByRole("button", { name: "開発" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(tree.locator('[aria-current="page"]')).toHaveCount(0);
  });

  test("「ホームへ戻る」を押すと、ホームへ移る", async ({ page }) => {
    await page.goto(MISSING);
    await page.getByRole("link", { name: "ホームへ戻る" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { level: 1, name: "ノートの入り口" })).toBeVisible();
  });
});

test.describe("読み込み中・読み込めなかった", () => {
  // 帯は role="alert"。Next.js の画面遷移の読み上げも role="alert" を持つので、data-tone で見分ける
  function errorBanner(page: Page) {
    return page.locator('[role="alert"][data-tone="danger"]');
  }

  function skeleton(page: Page) {
    return page.getByRole("main").getByRole("status", { name: "読み込み中" });
  }

  // ホームから、☰ の一覧で「Git ブランチの運用メモ」へ移る
  async function goToNote(page: Page) {
    await page.goto("/");
    const shell = waitForAppShell(page, (path) => path.startsWith("/notes/"));
    await openDrawer(page);
    await drawer(page).getByRole("button", { name: "開発" }).click();
    await shell;
    await drawer(page).getByRole("link", { name: "Git ブランチの運用メモ" }).click();
  }

  // ノートから、☰ の一覧で「ホーム」へ移る
  async function goToHome(page: Page) {
    await page.goto(GIT_NOTE);
    const shell = waitForAppShell(page, (path) => path === "/");
    await openDrawer(page);
    await shell;
    await drawer(page).getByRole("link", { name: "ホーム" }).click();
  }

  test("ノートを開くのに時間がかかるあいだ、スケルトンを出し、上の帯は残る", async ({ page }) => {
    await interceptNavigation(page, GIT_NOTE, "hold");
    await goToNote(page);
    await expect(skeleton(page)).toBeVisible();
    await expect(place(page)).toHaveText("開発 / Git ブランチの運用メモ");
    await expect(page.getByRole("button", { name: "ノートの一覧を開く" })).toBeVisible();
    await expect(page).toHaveScreenshot("note-loading.png", { fullPage: true });
  });

  test("ホームを開くのに時間がかかるあいだ、スケルトンを出す", async ({ page }) => {
    await interceptNavigation(page, "/", "hold");
    await goToHome(page);
    await expect(skeleton(page)).toBeVisible();
    await expect(place(page)).toHaveText("ホーム");
    await expect(page).toHaveScreenshot("home-loading.png", { fullPage: true });
  });

  test("PC：読み込み中も、左のノートの一覧は残る", async ({ page }) => {
    await page.setViewportSize(PC);
    await interceptNavigation(page, GIT_NOTE, "hold");
    await page.goto("/");
    const shell = waitForAppShell(page, (path) => path.startsWith("/notes/"));
    const tree = sidebar(page);
    await tree.getByRole("button", { name: "開発" }).click();
    await shell;
    await tree.getByRole("link", { name: "Git ブランチの運用メモ" }).click();
    await expect(skeleton(page)).toBeVisible();
    await expect(tree.getByRole("link", { name: "Git ブランチの運用メモ" })).toBeVisible();
  });

  test("ノートを読み込めなかったら帯を出し、「もう一度読み込む」で読み込み直す", async ({
    page,
  }) => {
    await interceptNavigation(page, GIT_NOTE, "break");
    await goToNote(page);
    await expect(errorBanner(page)).toContainText("ノートを読み込めませんでした");
    await expect(errorBanner(page)).toContainText("通信が切れている可能性があります。");
    await expect(place(page)).toHaveText("開発 / Git ブランチの運用メモ");
    // 押した場所にマウスが残り、ボタンが hover の色で写らないよう、外へ動かす
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot("note-error.png", { fullPage: true });

    await page.unrouteAll();
    await page.getByRole("button", { name: "もう一度読み込む" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Git ブランチの運用メモ" }),
    ).toBeVisible();
    await expect(errorBanner(page)).toHaveCount(0);
  });

  test("ホームを読み込めなかったら帯を出し、「もう一度読み込む」で読み込み直す", async ({
    page,
  }) => {
    await interceptNavigation(page, "/", "break");
    await goToHome(page);
    await expect(errorBanner(page)).toContainText("ノートの一覧を読み込めませんでした");
    await expect(errorBanner(page)).toContainText("通信が切れている可能性があります。");
    // 押した場所にマウスが残り、ボタンが hover の色で写らないよう、外へ動かす
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot("home-error.png", { fullPage: true });

    await page.unrouteAll();
    await page.getByRole("button", { name: "もう一度読み込む" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "ノートの入り口" })).toBeVisible();
    await expect(errorBanner(page)).toHaveCount(0);
  });
});
