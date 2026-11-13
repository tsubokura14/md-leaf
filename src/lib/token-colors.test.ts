import { describe, expect, test } from "vitest";
import { extractAppColors } from "./token-colors";

const tokens = `
@theme {
  --color-bg: var(--c-bg);
}
:root {
  --reading-size: 16px;
}
:root {
  --c-bg: #fbf8f1;
  --c-accent: #4f7a3a;
  --c-overlay: rgb(30 28 24 / 0.4);
}
.dark {
  color-scheme: dark;
  --c-bg: #1d1c19;
  --c-accent: #9cc27f;
}
`;

describe("extractAppColors", () => {
  test("ライトの bg・accent と、ダークの bg を取り出す", () => {
    expect(extractAppColors(tokens)).toEqual({
      lightBg: "#fbf8f1",
      lightAccent: "#4f7a3a",
      darkBg: "#1d1c19",
    });
  });

  test("どれかが見つからなければ、例外を投げる", () => {
    expect(() => extractAppColors(tokens.replace("--c-bg: #1d1c19;", ""))).toThrow(/--c-bg/);
  });
});
