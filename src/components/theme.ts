// ライト・ダークの切り替え。ダークかどうかは <html> に .dark のクラスがあるかだけで決まり、
// 色はトークンの2組（src/styles/tokens.css の :root と .dark）がそのまま切り替わる。
//
// - 選んだものは、ブラウザの localStorage に THEME_KEY で "light" か "dark" を1つだけ保存する。
//   Cookie にしてサーバーで読むと、ルートのレイアウトで開くたびに読むことになり、ページをビルドのときに
//   HTML にしておけなくなる。サーバーは選んだものを知らなくてよい
// - 保存の読み書きは失敗しても何もしない（保存が禁止されている・プライベートブラウズなど）。
//   見た目の設定が残らないだけで、読む妨げにはならないため
// - ちらつきを出さないため、applyInitialTheme を src/app/layout.tsx の <head> にインラインのスクリプトとして埋め、
//   HTML を読んでいる途中、最初に描く前に同期で動かす。<html> には suppressHydrationWarning を付ける
//   （スクリプトが付けたクラスが、React の出力と食い違うため）
//
// - 上の帯のボタン（src/components/theme-toggle.tsx）で押すと、toggleTheme が .dark を付け外しして保存する。
//   押したら <html> に CHOSEN_ATTR の印も付ける。端末の設定の変化で合わせ直すのは、保存がなく、印もないときだけ
//   （保存できないブラウザで押したあと、開いているあいだに端末の設定が変わっても、選んだものを上書きしないため）
//
// - スマホの上の、時刻や電池が出る部分の色（<meta name="theme-color">）も、そのときの bg に合わせる。
//   <meta> は applyInitialTheme が <head> に作り、<html> の class を見張って（MutationObserver）、.dark が付け外しされるたびに
//   書き換える。開いたとき・端末の設定が変わったとき・ボタンで切り替えたときのどれも、.dark の付け外しを通るので、1か所で済む。
//   Next.js の viewport.themeColor は端末の設定（prefers-color-scheme）にしか合わせられず、ボタンで選んだものに合わせられない。
//   また React が出す <meta> を書き換えると、画面を移ったときに React に戻されうるので、<meta> は React に持たせない
// - 色は引数で渡す（どこから来るかは docs/design.md「トークンにない値を書かない」）
//
// 前提（崩れたら見直す）：applyInitialTheme は toString() で文字列にして埋めるので、外の変数・import を使わない。
// キーと印の名前・色は引数で受け取る（このファイルの THEME_KEY・CHOSEN_ATTR と、トークンファイルを1か所にするため）

import { readAppColors } from "@/lib/token-colors";

export const THEME_KEY = "md-leaf-theme";
export const CHOSEN_ATTR = "data-theme-chosen";

/**
 * 保存したもので .dark を付け外しする。一度も選んでいなければ（保存がなければ）、端末の設定
 * （prefers-color-scheme）に合わせ、開いているあいだに端末の設定が変わっても合わせ直す。
 * 一度選んだら、端末の設定には合わせ直さない
 */
export function applyInitialTheme(
  key: string,
  chosenAttr: string,
  barColors: { light: string; dark: string },
): void {
  const readStored = (): string | null => {
    try {
      const value = window.localStorage.getItem(key);
      return value === "light" || value === "dark" ? value : null;
    } catch {
      return null;
    }
  };
  const root = document.documentElement;
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  document.head.appendChild(meta);
  const syncBar = () => {
    meta.content = root.classList.contains("dark") ? barColors.dark : barColors.light;
  };
  new MutationObserver(syncBar).observe(root, { attributes: true, attributeFilter: ["class"] });
  syncBar();

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const apply = () => {
    const stored = readStored();
    root.classList.toggle("dark", stored ? stored === "dark" : media.matches);
  };
  apply();
  media.addEventListener("change", () => {
    if (readStored() === null && !root.hasAttribute(chosenAttr)) apply();
  });
}

/** src/app/layout.tsx の <head> に埋めるスクリプト */
export function themeScript(): string {
  const { lightBg, darkBg } = readAppColors();
  const args = [THEME_KEY, CHOSEN_ATTR, { light: lightBg, dark: darkBg }].map((arg) =>
    JSON.stringify(arg),
  );
  return `(${applyInitialTheme.toString()})(${args.join(", ")})`;
}

/** ライトとダークを入れ替え、選んだものを保存する。保存できなくても、その場では切り替える */
export function toggleTheme(): void {
  const root = document.documentElement;
  const dark = !root.classList.contains("dark");
  root.classList.toggle("dark", dark);
  root.setAttribute(CHOSEN_ATTR, "");
  try {
    window.localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  } catch {
    // 保存できないときは、次に開いたときに一度も選んでいないときの決まりで出る
  }
}
