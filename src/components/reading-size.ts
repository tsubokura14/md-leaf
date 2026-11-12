// 本文の文字の大きさ。大きさは <html> の style の --reading-size だけで決まり、本文（.reading の中）の
// 題・見出し・コード・表は、トークンファイル（src/styles/tokens.css）の倍率でそろって変わる。
//
// - 選んだものは、ブラウザの localStorage に READING_SIZE_KEY で px の数（"14" など）を1つだけ保存する。
//   保存の場所・読み書きに失敗しても何もしないこと・<head> のスクリプトで最初に描く前に当てることは、
//   ライト/ダークと同じやり方（理由は src/components/theme.ts）
// - 保存した値が READING_SIZES にないとき（壊れた値・あとで選択肢から外した値）は、標準で出す
// - 一度も選んでいなくても、標準の値を <html> に当てる。標準をこのファイルの1か所で決めるため
//   （トークンファイルの :root の 16px は、スクリプトが動かないときの値）
// - 今の大きさは、保存ではなく <html> に当たっている値から読む。保存できないブラウザでも、
//   その場で選んだものを今の大きさとして扱うため
//
// 前提（崩れたら見直す）：applyInitialReadingSize は toString() で文字列にして埋めるので、外の変数・import を使わない。
// キー・選択肢・標準は引数で受け取る（このファイルの値を1か所にするため）

export const READING_SIZE_KEY = "md-leaf-reading-size";
/** 選べる大きさ（px）。値を足せば選択肢が増える */
export const READING_SIZES = [14, 16] as const;
export const DEFAULT_READING_SIZE = 16;

const PROPERTY = "--reading-size";

/** 保存した大きさを <html> に当てる。保存がない・選択肢にない・読めないときは標準 */
export function applyInitialReadingSize(
  key: string,
  sizes: readonly number[],
  defaultSize: number,
): void {
  let size = defaultSize;
  try {
    const stored = Number(window.localStorage.getItem(key));
    if (sizes.includes(stored)) size = stored;
  } catch {
    // 読めないときは標準で出す
  }
  document.documentElement.style.setProperty("--reading-size", `${size}px`);
}

/** src/app/layout.tsx の <head> に埋めるスクリプト */
export const readingSizeScript = `(${applyInitialReadingSize.toString()})(${JSON.stringify(
  READING_SIZE_KEY,
)}, ${JSON.stringify(READING_SIZES)}, ${JSON.stringify(DEFAULT_READING_SIZE)})`;

/** 選んだ大きさを当てて保存する。保存できなくても、その場では当てる */
export function setReadingSize(size: number): void {
  document.documentElement.style.setProperty(PROPERTY, `${size}px`);
  try {
    window.localStorage.setItem(READING_SIZE_KEY, String(size));
  } catch {
    // 保存できないときは、次に開いたときに標準で出る
  }
}

/** 今 <html> に当たっている大きさ（px の数）。当たっていない・選択肢にないときは標準 */
export function currentReadingSize(): number {
  const size = Number.parseFloat(document.documentElement.style.getPropertyValue(PROPERTY));
  return (READING_SIZES as readonly number[]).includes(size) ? size : DEFAULT_READING_SIZE;
}
