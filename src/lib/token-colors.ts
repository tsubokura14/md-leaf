/**
 * トークンファイル（src/styles/tokens.css）から色を取り出す（使い方は docs/design.md「トークンにない値を書かない」）。
 * 前提（崩れたら見直す）：ライトの色は `:root { ... }`、ダークの色は `.dark { ... }` のブロックに、`--c-bg: <値>;` の形で書いてある。
 */

export type AppColors = { lightBg: string; lightAccent: string; darkBg: string };

function findVar(css: string, selector: ":root" | ".dark", name: string): string {
  const blocks = css.matchAll(/(?:^|\n)\s*(:root|\.dark)\s*\{([^}]*)\}/g);
  for (const [, sel, body] of blocks) {
    if (sel !== selector) continue;
    const match = body.match(new RegExp(`(?:^|[\\s;])${name}\\s*:\\s*([^;]+);`));
    if (match) return match[1].trim();
  }
  throw new Error(`トークンファイルの ${selector} に ${name} が見つかりません`);
}

export function extractAppColors(css: string): AppColors {
  return {
    lightBg: findVar(css, ":root", "--c-bg"),
    lightAccent: findVar(css, ":root", "--c-accent"),
    darkBg: findVar(css, ".dark", "--c-bg"),
  };
}

/** next.config.ts が埋め込んだ色を読む */
export function readAppColors(): AppColors {
  const json = process.env.APP_COLORS;
  if (!json) throw new Error("APP_COLORS がありません（next.config.ts が埋め込む）");
  return JSON.parse(json);
}
