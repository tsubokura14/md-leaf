import { describe, expect, test } from "vitest";
import { resolveImageSrc } from "./note-images";

// hast にしたあとの src は符号化されている（remark-rehype が符号化する）
const enc = (path: string) => encodeURI(path);
const files = (path: string) => `/files/${path.split("/").map(encodeURIComponent).join("/")}`;

describe("resolveImageSrc", () => {
  test("何も付けない相対パスは、ノートと同じフォルダからのパスにし、/files/ の URL にする", () => {
    expect(resolveImageSrc("branch-graph.png", "開発/Git ブランチの運用メモ")).toEqual({
      path: "開発/branch-graph.png",
      src: files("開発/branch-graph.png"),
    });
  });

  test("../ は上のフォルダ", () => {
    expect(resolveImageSrc("../images/a.png", "dev/deep/note")?.path).toBe("dev/images/a.png");
  });

  test("空白・日本語のパスは、山かっこでも %20 でも同じファイルを指す", () => {
    expect(resolveImageSrc(enc("ブランチ の図.png"), "dev/note")).toEqual({
      path: "dev/ブランチ の図.png",
      src: files("dev/ブランチ の図.png"),
    });
    expect(resolveImageSrc("my%20image.png", "dev/note")?.path).toBe("dev/my image.png");
  });

  test("コンテンツフォルダの外を指すときは、path を返さず、パス全体を1つの部分として符号化した URL にする", () => {
    expect(resolveImageSrc("../../x.png", "dev/note")).toEqual({
      path: undefined,
      src: `/files/${encodeURIComponent("../x.png")}`,
    });
  });

  test("http(s):// や / で始まるもの、スキーム付きのものは対象外", () => {
    expect(resolveImageSrc("https://example.com/a.png", "dev/note")).toBeUndefined();
    expect(resolveImageSrc("http://example.com/a.png", "dev/note")).toBeUndefined();
    expect(resolveImageSrc("/a.png", "dev/note")).toBeUndefined();
    expect(resolveImageSrc("data:image/png;base64,AAAA", "dev/note")).toBeUndefined();
  });
});
