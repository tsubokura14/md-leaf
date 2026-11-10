import path from "node:path";
import { describe, expect, it } from "vitest";
import { toolsFor } from "./format-on-edit.mjs";

const ROOT = path.resolve("repo");
const inRepo = (...parts) => path.join(ROOT, ...parts);
// テストのパスは実在しないので、ファイルがあるかどうかは差し替える
const exists = () => true;

describe("toolsFor", () => {
  it("TS・JS のファイルには、Prettier と ESLint をかける", () => {
    expect(toolsFor(inRepo("src", "app", "page.tsx"), ROOT, exists)).toEqual([
      "prettier",
      "eslint",
    ]);
  });

  it("CSS・JSON のファイルには、Prettier だけをかける", () => {
    expect(toolsFor(inRepo("src", "app", "globals.css"), ROOT, exists)).toEqual(["prettier"]);
  });

  it("対象でない種類のファイル（.md、画像）には、何もかけない", () => {
    expect(toolsFor(inRepo("docs", "ui.md"), ROOT, exists)).toEqual([]);
    expect(toolsFor(inRepo("docs", "specs", "screens", "home.png"), ROOT, exists)).toEqual([]);
  });

  it("拡張子の大文字・小文字は区別しない", () => {
    expect(toolsFor(inRepo("src", "Page.TSX"), ROOT, exists)).toEqual(["prettier", "eslint"]);
  });

  it("リポジトリの外のファイルには、何もかけない", () => {
    expect(toolsFor(path.resolve("elsewhere", "note.ts"), ROOT, exists)).toEqual([]);
  });

  it("パスがないときは、何もかけない", () => {
    expect(toolsFor(undefined, ROOT, exists)).toEqual([]);
  });

  it("もうないファイル（消したあとなど）には、何もかけない", () => {
    expect(toolsFor(inRepo("src", "gone.ts"), ROOT, () => false)).toEqual([]);
  });
});
