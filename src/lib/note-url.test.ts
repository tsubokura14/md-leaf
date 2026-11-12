import { describe, expect, test } from "vitest";
import { isMissingNote } from "./note-url";

describe("isMissingNote", () => {
  const notePaths = ["開発/Git ブランチの運用メモ"];

  test("一覧にあるノートの URL は、見つからないとしない（URL で符号化された日本語も合わせる）", () => {
    const url = `/notes/${encodeURIComponent("開発")}/${encodeURIComponent("Git ブランチの運用メモ")}`;
    expect(isMissingNote(url, notePaths)).toBe(false);
  });

  test("/notes/ の下で一覧にない URL は、見つからないとする", () => {
    expect(isMissingNote("/notes/開発/ないノート", notePaths)).toBe(true);
  });

  test("/notes/ の下でない URL は、見つからないとしない（ほかのページに任せる）", () => {
    expect(isMissingNote("/login", notePaths)).toBe(false);
  });
});
