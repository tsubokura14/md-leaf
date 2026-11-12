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
// 前提（崩れたら見直す）：applyInitialTheme は toString() で文字列にして埋めるので、外の変数・import を使わない。
// キーと印の名前は引数で受け取る（このファイルの THEME_KEY・CHOSEN_ATTR を1か所にするため）

export const THEME_KEY = "md-leaf-theme";
export const CHOSEN_ATTR = "data-theme-chosen";

/**
 * 保存したもので .dark を付け外しする。一度も選んでいなければ（保存がなければ）、端末の設定
 * （prefers-color-scheme）に合わせ、開いているあいだに端末の設定が変わっても合わせ直す。
 * 一度選んだら、端末の設定には合わせ直さない
 */
export function applyInitialTheme(key: string, chosenAttr: string): void {
  const readStored = (): string | null => {
    try {
      const value = window.localStorage.getItem(key);
      return value === "light" || value === "dark" ? value : null;
    } catch {
      return null;
    }
  };
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const apply = () => {
    const stored = readStored();
    document.documentElement.classList.toggle("dark", stored ? stored === "dark" : media.matches);
  };
  apply();
  media.addEventListener("change", () => {
    if (readStored() === null && !document.documentElement.hasAttribute(chosenAttr)) apply();
  });
}

/** src/app/layout.tsx の <head> に埋めるスクリプト */
export const themeScript = `(${applyInitialTheme.toString()})(${JSON.stringify(THEME_KEY)}, ${JSON.stringify(CHOSEN_ATTR)})`;

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
