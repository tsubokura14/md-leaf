import { describe, expect, it } from "vitest";
import { findOffTokenValues } from "./check-tokens.mjs";

describe("findOffTokenValues", () => {
  it("色コードを、行の番号つきで見つける", () => {
    const css = ".a {\n  color: var(--color-text);\n  background: #3366ff;\n}";
    expect(findOffTokenValues(css)).toEqual([{ line: 3, value: "#3366ff" }]);
  });

  it("rgb() と hsl() の色を見つける", () => {
    const css = ".a { color: rgb(0 0 0 / 0.5); border-color: hsl(10 20% 30%); }";
    expect(findOffTokenValues(css).map((v) => v.value)).toEqual(["rgb(", "hsl("]);
  });

  it("px の値を見つける", () => {
    const css = ".a { padding: 13px; }";
    expect(findOffTokenValues(css)).toEqual([{ line: 1, value: "13px" }]);
  });

  it("トークンの変数と rem だけなら、何も見つけない", () => {
    const css =
      '@import "tailwindcss";\n.a:hover { color: var(--color-accent); margin: 1rem; }\n#main { width: 100%; }';
    expect(findOffTokenValues(css)).toEqual([]);
  });

  it("コメントの中の値は見つけない", () => {
    const css = "/* 以前は #3366ff と 13px だった */\n.a { color: var(--color-text); }";
    expect(findOffTokenValues(css)).toEqual([]);
  });
});
