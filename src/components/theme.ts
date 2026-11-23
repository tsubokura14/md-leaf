// ライト・ダークの切り替え。「端末に合わせる」「ライト」「ダーク」の3つから選ぶ。
// <html> に印を2つ付ける。
// - data-theme：今出している色（"light"・"dark"）。「端末に合わせる」では端末の設定（prefers-color-scheme）から決めた色。
//   色を決める側（トークンのダークの組 [data-theme="dark"]・dark: の変形・Mermaid の描き直し・theme-color）は、これだけを見る
//   （memory-forge・kinari-md と同じ。kinari-md の CSS は "light"・"dark" の前提で読むので、"system" は入れない）
// - CHOICE_ATTR（data-theme-choice）：選んでいるもの（"system"・"light"・"dark"）。開いているあいだの「選んでいるもの」の正本。
//   端末の設定が変わったときに合わせ直すのは、これが "system" のときだけ（保存できないブラウザで選んだあとも、
//   端末の設定の変化で上書きしないため）。上の帯のボタンのアイコンの出し分けにも使う（src/components/theme-menu.tsx）
//
// - 選んだものは、ブラウザの localStorage に THEME_KEY で "system"・"light"・"dark" のどれかを保存する
//   （前の版の "light"・"dark" はそのまま読める。ない・ほかの値・読めないときは "system"）。
//   Cookie にしてサーバーで読むと、ルートのレイアウトで開くたびに読むことになり、ページをビルドのときに
//   HTML にしておけなくなる。サーバーは選んだものを知らなくてよい
// - 保存の読み書きは失敗しても何もしない（保存が禁止されている・プライベートブラウズなど）。
//   見た目の設定が残らないだけで、その場では選んだ色に切り替える
// - ちらつきを出さないため、applyInitialTheme を src/app/layout.tsx の <head> にインラインのスクリプトとして埋め、
//   HTML を読んでいる途中、最初に描く前に同期で動かす。<html> には suppressHydrationWarning を付ける
//   （スクリプトが付けた印が、React の出力と食い違うため）
//
// - スマホの上の、時刻や電池が出る部分の色（<meta name="theme-color">）も、そのときの bg に合わせる。
//   <meta> は applyInitialTheme が <head> に作り、<html> の data-theme を見張って（MutationObserver）、変わるたびに
//   書き換える。開いたとき・端末の設定が変わったとき・ボタンで選んだときのどれも、data-theme の付け直しを通るので、1か所で済む。
//   Next.js の viewport.themeColor は端末の設定（prefers-color-scheme）にしか合わせられず、ボタンで選んだものに合わせられない。
//   また React が出す <meta> を書き換えると、画面を移ったときに React に戻されうるので、<meta> は React に持たせない
// - 色は引数で渡す（どこから来るかは docs/design.md「トークンにない値を書かない」）
//
// 前提（崩れたら見直す）：applyInitialTheme は toString() で文字列にして埋めるので、外の変数・import を使わない。
// キーと印の名前・色は引数で受け取る（このファイルの THEME_KEY・CHOICE_ATTR と、トークンファイルを1か所にするため）

import { readAppColors } from "@/lib/token-colors";

export const THEME_KEY = "md-leaf-theme";
export const CHOICE_ATTR = "data-theme-choice";

export type ThemeChoice = "system" | "light" | "dark";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * 保存したものを読み、<html> に data-theme-choice と data-theme を付ける。開いているあいだに端末の設定が変わったら、
 * 「端末に合わせる」のときだけ data-theme を付け直す
 */
export function applyInitialTheme(
  key: string,
  choiceAttr: string,
  barColors: { light: string; dark: string },
): void {
  const readStored = (): string => {
    try {
      const value = window.localStorage.getItem(key);
      return value === "light" || value === "dark" ? value : "system";
    } catch {
      return "system";
    }
  };
  const root = document.documentElement;
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  document.head.appendChild(meta);
  const syncBar = () => {
    meta.content = root.getAttribute("data-theme") === "dark" ? barColors.dark : barColors.light;
  };
  new MutationObserver(syncBar).observe(root, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const choice = readStored();
  root.setAttribute(choiceAttr, choice);
  root.setAttribute(
    "data-theme",
    choice === "system" ? (media.matches ? "dark" : "light") : choice,
  );
  syncBar();
  media.addEventListener("change", () => {
    if (root.getAttribute(choiceAttr) === "system") {
      root.setAttribute("data-theme", media.matches ? "dark" : "light");
    }
  });
}

/** src/app/layout.tsx の <head> に埋めるスクリプト */
export function themeScript(): string {
  const { lightBg, darkBg } = readAppColors();
  const args = [THEME_KEY, CHOICE_ATTR, { light: lightBg, dark: darkBg }].map((arg) =>
    JSON.stringify(arg),
  );
  return `(${applyInitialTheme.toString()})(${args.join(", ")})`;
}

/** 選んだものにその場で切り替え、保存する。保存できなくても、その場では切り替える */
export function setTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  const theme =
    choice === "system" ? (window.matchMedia(DARK_QUERY).matches ? "dark" : "light") : choice;
  root.setAttribute(CHOICE_ATTR, choice);
  root.setAttribute("data-theme", theme);
  try {
    window.localStorage.setItem(THEME_KEY, choice);
  } catch {
    // 保存できないときは、次に開いたときに「端末に合わせる」で出る
  }
}

/** 今選んでいるもの */
export function currentTheme(): ThemeChoice {
  const value = document.documentElement.getAttribute(CHOICE_ATTR);
  return value === "light" || value === "dark" ? value : "system";
}
