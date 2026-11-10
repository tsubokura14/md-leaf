import { expect, type Locator } from "@playwright/test";

// ページはビルドのときに HTML にしてあるので、ボタンは React がつながる（ハイドレーション）前から見えていて押せる。
// その前に押すと、何も起きずに終わる（フォルダが開かない、☰ で一覧が開かない）。Playwright は見えていれば押すので、
// ページを開いてすぐ、ボタン（リンクでないもの）を押すときは、先にこれで待つ。
// リンクは、つながる前に押してもふつうのページの移動になるので、待たなくてよい。
//
// 前提（React 19 で確かめた。版を上げて崩れたら見直す）：React はハイドレーションのときに、要素へ
// `__reactProps$<乱数>` という名前のプロパティを置き、押されたときにここから onClick を探す。
// 置かれていれば、押したことは React に届く。Suspense ごとに別々につながるので、ページ全体ではなく、押す要素で確かめる

/** locator の要素に React がつながるまで待つ */
export async function waitForHydration(locator: Locator): Promise<void> {
  await expect
    .poll(() =>
      locator.evaluate((element) =>
        Object.keys(element).some((key) => key.startsWith("__reactProps$")),
      ),
    )
    .toBe(true);
}

/** React がつながるのを待ってから押す */
export async function clickWhenHydrated(locator: Locator): Promise<void> {
  await waitForHydration(locator);
  await locator.click();
}
