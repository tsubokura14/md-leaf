import { describe, expect, test } from "vitest";
import { resolveNoteLink } from "./note-links";

// hast にしたあとの href は符号化されている（remark-rehype が符号化する）
const enc = (path: string) => encodeURI(path);

describe("resolveNoteLink", () => {
  test("何も付けない相対パスは、リンクを書いたノートと同じフォルダから探す", () => {
    expect(resolveNoteLink(enc("リリースの手順.md"), "開発/Git ブランチの運用メモ")).toEqual({
      path: "開発/リリースの手順",
      href: `/notes/${encodeURIComponent("開発")}/${encodeURIComponent("リリースの手順")}`,
    });
  });

  test("./ は同じフォルダ、../ は上のフォルダ", () => {
    expect(resolveNoteLink("./a.md", "dev/note")?.path).toBe("dev/a");
    expect(resolveNoteLink("../ops/b.md", "dev/deep/note")?.path).toBe("dev/ops/b");
  });

  test("一番上のノートからのリンクは、一番上のフォルダから探す", () => {
    expect(resolveNoteLink(enc("開発/Docker のメモ.md"), "index")?.path).toBe("開発/Docker のメモ");
  });

  test("一番上の index.md へのリンクはホーム（/）。下の階層の index.md はノート", () => {
    expect(resolveNoteLink("../index.md", "dev/note")).toEqual({ path: "index", href: "/" });
    expect(resolveNoteLink("index.md", "dev/note")).toEqual({
      path: "dev/index",
      href: "/notes/dev/index",
    });
  });

  test("%20 のように符号化して書いたパスも、符号化を戻して探す", () => {
    expect(resolveNoteLink("Docker%20%E3%81%AE%E3%83%A1%E3%83%A2.md", "dev/note")?.path).toBe(
      "dev/Docker のメモ",
    );
  });

  test("# と ? のあとは捨てる", () => {
    expect(resolveNoteLink("a.md#%E8%A6%8B%E5%87%BA%E3%81%97", "dev/note")).toEqual({
      path: "dev/a",
      href: "/notes/dev/a",
    });
    expect(resolveNoteLink("a.md?x=1", "dev/note")?.path).toBe("dev/a");
  });

  test("コンテンツフォルダの外を指すときは、path を返さず、パス全体を1つの部分として符号化した URL にする", () => {
    expect(resolveNoteLink("../../x.md", "dev/note")).toEqual({
      path: undefined,
      href: `/notes/${encodeURIComponent("../x")}`,
    });
  });

  test("対象外のリンク（スキーム付き、/ や # で始まる、.md で終わらない）は undefined", () => {
    expect(resolveNoteLink("https://example.com/a.md", "dev/note")).toBeUndefined();
    expect(resolveNoteLink("mailto:a@example.com", "dev/note")).toBeUndefined();
    expect(resolveNoteLink("/dev/a.md", "dev/note")).toBeUndefined();
    expect(resolveNoteLink("#a.md", "dev/note")).toBeUndefined();
    expect(resolveNoteLink("image.png", "dev/note")).toBeUndefined();
    expect(resolveNoteLink("folder/", "dev/note")).toBeUndefined();
  });
});
